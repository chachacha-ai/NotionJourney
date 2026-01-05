'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { format, parseISO, isSameDay, isBefore } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { ChevronDown, Calendar, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { TripMetadata, ItineraryItem } from '@/lib/notion';
import { parseNotionDateTime, cn } from '@/lib/utils';
import { JourneyCard } from './JourneyCard';
import { TopBar } from './TopBar';
import { BottomNav, TabType } from './BottomNav';
import { CurrencyWidget } from './CurrencyWidget';
import { NotionBlockRenderer } from './NotionBlockRenderer';
import { PullToRefresh } from './PullToRefresh';

interface JourneyDashboardProps {
    data: {
        metadata: TripMetadata;
        itinerary: ItineraryItem[];
    };
    requiredPassword?: string | null;
}

const toFloatingDate = (dateStr: string): Date => {
    const { dateTimeStr } = parseNotionDateTime(dateStr);
    return parseISO(dateTimeStr);
};

export default function JourneyDashboard({ data, requiredPassword }: JourneyDashboardProps) {
    const { metadata, itinerary } = data;

    const [activeTab, setActiveTab] = useState<TabType>('home');
    const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        setNow(new Date());
    }, []);

    const sortedJourneys = useMemo(() =>
        [...itinerary].sort((a, b) => {
            return toFloatingDate(a.date).getTime() - toFloatingDate(b.date).getTime();
        }),
        [itinerary]);

    const groupedJourneys = useMemo(() => {
        const groups: Record<string, ItineraryItem[]> = {};
        sortedJourneys.forEach(item => {
            const { date } = parseNotionDateTime(item.date);
            if (!groups[date]) groups[date] = [];
            groups[date].push(item);
        });
        return groups;
    }, [sortedJourneys]);

    const allDates = useMemo(() => Object.keys(groupedJourneys).sort(), [groupedJourneys]);

    useEffect(() => {
        if (!now) return;
        const todayKey = format(now, 'yyyy-MM-dd');
        if (allDates.includes(todayKey)) {
            setExpandedDays(prev => ({
                ...prev,
                [todayKey]: true
            }));
        } else {
            if (allDates.length > 0 && !Object.keys(expandedDays).length) {
                setExpandedDays({ [allDates[0]]: true });
            }
        }
    }, [allDates, now]);

    const toggleDay = (dateStr: string) => {
        setExpandedDays(prev => ({
            ...prev,
            [dateStr]: !prev[dateStr]
        }));
    };

    // 1. UNIFIED HOME TAB
    const renderHome = () => {
        return (
            <div className="pb-8 pt-4">
                <div className="mx-4 mb-6 flex gap-4 h-28">
                    <div className="w-full">
                        <CurrencyWidget
                            currencyCode={metadata.exchangeRate || 'EUR'}
                        />
                    </div>
                </div>

                <div className="px-4 space-y-4">
                    {allDates.map((dateStr, index) => {
                        const isExpanded = !!expandedDays[dateStr];
                        const dayItems = groupedJourneys[dateStr];
                        const dateObj = parseISO(dateStr);
                        const isToday = now ? isSameDay(dateObj, now) : false;

                        return (
                            <div
                                key={dateStr}
                                className={cn(
                                    "rounded-2xl transition-all duration-300 overflow-hidden border shadow-sm",
                                    // 修改重點 1: 恢復原本的低調邊框 (border-blue-100 或 white)，移除綠色邊框
                                    // 這樣展開時就不會整個發綠光，保持乾淨
                                    isExpanded ? "bg-white/60 border-blue-100 shadow-md" : "bg-white/40 border-white/60 hover:bg-white/60"
                                )}
                            >
                                <button
                                    onClick={() => toggleDay(dateStr)}
                                    className="w-full p-4 flex items-center justify-between"
                                >
                                    <div className="text-left">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn(
                                                "text-xs font-bold uppercase tracking-widest",
                                                // 這裡的文字維持綠色是可以的，因為它是重點
                                                isToday ? "text-emerald-600" : "text-slate-400"
                                            )}>
                                                第 {index + 1} 天
                                            </span>
                                            {isToday && (
                                                // 修改重點 2: 「今天」的標籤維持綠色，因為這是重點資訊
                                                <span className="bg-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    今天
                                                </span>
                                            )}
                                        </div>
                                        <h3 className={cn(
                                            "text-lg font-semibold",
                                            isToday ? "text-emerald-900" : "text-slate-700"
                                        )}>
                                            {format(dateObj, 'MMM do', { locale: zhTW })} - {format(dateObj, 'EEEE', { locale: zhTW })}
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-slate-400 font-medium">
                                            {dayItems.length} 個行程
                                        </span>
                                        <div className={cn(
                                            "p-1 rounded-full transition-transform duration-300",
                                            // 修改重點 3: 箭頭也改回低調的藍灰色，或者淡綠色
                                            isExpanded ? "bg-slate-100 text-slate-600 rotate-180" : "text-slate-400"
                                        )}>
                                            <ChevronDown size={20} />
                                        </div>
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                        >
                                            <div className="px-4 pb-4 pt-0 space-y-3 border-t border-slate-100/50 mt-1">
                                                <div className="h-2" />
                                                {dayItems.map(item => {
                                                    const itemTime = toFloatingDate(item.date);
                                                    const isPast = now ? isBefore(itemTime, now) : false;
                                                    return (
                                                        <JourneyCard
                                                            key={item.id}
                                                            item={item}
                                                            isPast={isPast}
                                                            hideImage={true}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderFiltered = (filterType: string | 'visit_group') => {
        let filteredItems = sortedJourneys;

        if (filterType === 'visit_group') {
            filteredItems = sortedJourneys.filter(j => ['visit', 'shopping', 'restaurant'].includes(j.category));
        } else {
            filteredItems = sortedJourneys.filter(j => j.category === filterType);
        }

        return (
            <div className="pb-8 pt-4 px-4">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <p>此分類目前沒有行程。</p>
                    </div>
                ) : (
                    filteredItems.reduce((groups, item) => {
                        const { date } = parseNotionDateTime(item.date);
                        const lastGroup = groups[groups.length - 1];
                        if (lastGroup && lastGroup.date === date) {
                            lastGroup.items.push(item);
                        } else {
                            groups.push({ date: date, items: [item] });
                        }
                        return groups;
                    }, [] as { date: string, items: typeof filteredItems }[]).map((group) => (
                        <div key={group.date} className="mb-8 last:mb-0">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-2">
                                    <Calendar size={14} className="text-slate-400" />
                                    <span className="text-sm font-bold text-slate-700">
                                        {format(parseISO(group.date), 'MM/dd EEEE', { locale: zhTW })}
                                    </span>
                                </div>
                                <div className="h-px bg-slate-200/60 flex-1" />
                            </div>

                            <div className="space-y-3">
                                {group.items.map(item => (
                                    <div key={item.id}>
                                        <JourneyCard item={item} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    };

    const renderInfo = () => (
        <div className="pb-8 pt-4 px-4">
            {metadata.infoPage ? (
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-white/60">
                    <NotionBlockRenderer blocks={metadata.infoPage.blocks} />
                </div>
            ) : (
                <div className="p-8 pb-32 flex flex-col items-center justify-center text-center text-slate-500 space-y-8">
                    <ShieldAlert size={48} className="text-slate-300" />
                    <p>尚無緊急資訊</p>
                </div>
            )}
        </div>
    );

    const TABS: TabType[] = ['home', 'visit', 'hotel', 'transport', 'info'];
    const minSwipeDistance = 50;
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [touchStartY, setTouchStartY] = useState<number | null>(null);

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
        setTouchStartY(e.targetTouches[0].clientY);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const [direction, setDirection] = useState(0);

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 300 : -300,
            opacity: 0
        })
    };

    const changeTab = (newTab: TabType) => {
        const currentIndex = TABS.indexOf(activeTab);
        const nextIndex = TABS.indexOf(newTab);
        setDirection(nextIndex > currentIndex ? 1 : -1);
        setActiveTab(newTab);
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart || !touchEnd || !touchStartY) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        const verticalDistance = Math.abs(touchStartY - e.changedTouches[0].clientY);
        const horizontalDistance = Math.abs(distance);
        if (verticalDistance > horizontalDistance) return;

        if (isLeftSwipe || isRightSwipe) {
            const currentIndex = TABS.indexOf(activeTab);
            let nextIndex = currentIndex;
            if (isLeftSwipe && currentIndex < TABS.length - 1) {
                nextIndex = currentIndex + 1;
            } else if (isRightSwipe && currentIndex > 0) {
                nextIndex = currentIndex - 1;
            }
            if (nextIndex !== currentIndex) {
                setDirection(nextIndex > currentIndex ? 1 : -1);
                setActiveTab(TABS[nextIndex]);
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100 flex justify-center">
            <div className="w-full max-w-[768px] h-[100dvh] bg-[#F8FAFC] shadow-2xl relative overflow-hidden transition-colors duration-300">
                <TopBar
                    title={metadata.city ? `${metadata.title} - ${metadata.city}` : metadata.title}
                    gmtOffset={metadata.timezone || '+8'}
                    subtitle={
                        metadata.startDate && metadata.endDate
                            ? format(parseISO(metadata.startDate), 'MMM do', { locale: zhTW }) + ' - ' + format(parseISO(metadata.endDate), 'MMM do', { locale: zhTW })
                            : ''
                    }
                />

                <main className="absolute inset-0 top-[calc(env(safe-area-inset-top)+78px)] bottom-[calc(env(safe-area-inset-bottom)+64px)] overflow-hidden">
                    <PullToRefresh className="h-full">
                        <div
                            className="min-h-full"
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            onTouchEnd={onTouchEnd}
                        >
                            <AnimatePresence initial={false} custom={direction} mode='popLayout'>
                                <motion.div
                                    key={activeTab}
                                    custom={direction}
                                    variants={variants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        x: { type: "spring", stiffness: 300, damping: 30 },
                                        opacity: { duration: 0.2 }
                                    }}
                                    className="min-h-full"
                                >
                                    {activeTab === 'home' && renderHome()}
                                    {activeTab === 'visit' && renderFiltered('visit_group')}
                                    {activeTab === 'hotel' && renderFiltered('hotel')}
                                    {activeTab === 'transport' && renderFiltered('transport')}
                                    {activeTab === 'info' && renderInfo()}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </PullToRefresh>
                </main>

                <BottomNav currentTab={activeTab} onTabChange={changeTab} />
            </div>
        </div>
    );
}
