import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Plane, Hotel, MapPin, Utensils, ShoppingBag, Info, ExternalLink } from 'lucide-react';
import { ItineraryItem } from '@/lib/notion';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { NotionBlockRenderer } from '@/components/NotionBlockRenderer';

const TYPE_ICONS: Record<string, any> = {
    transport: Plane,
    hotel: Hotel,
    visit: MapPin,
    restaurant: Utensils,
    shopping: ShoppingBag,
};

// 為了配合白底，我們讓 Icon 的背景稍微有點色彩，但不要太重
const TYPE_COLORS: Record<string, string> = {
    transport: 'bg-blue-50 text-blue-600',
    hotel: 'bg-indigo-50 text-indigo-600',
    visit: 'bg-emerald-50 text-emerald-600',
    restaurant: 'bg-orange-50 text-orange-600',
    shopping: 'bg-pink-50 text-pink-600',
};

interface JourneyCardProps {
    item: ItineraryItem;
    isPast?: boolean;
    hideImage?: boolean;
}

export const JourneyCard: React.FC<JourneyCardProps> = ({ item, isPast = false, hideImage = false }) => {
    const CategoryIcon = TYPE_ICONS[item.category] || Info;
    const colorClass = TYPE_COLORS[item.category] || 'bg-slate-50 text-slate-500';

    const renderIcon = () => {
        if (item.icon) {
            if (item.icon.startsWith('http') || item.icon.startsWith('data:')) {
                return <img src={item.icon} alt="" className="w-4 h-4 object-contain" />;
            }
            return <span className="text-sm leading-none">{item.icon}</span>;
        }
        return <CategoryIcon size={16} />;
    };

    const [blocks, setBlocks] = useState<any[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchBlocks = async () => {
        if (blocks || !item.hasContent) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/notion/page/${item.id}`);
            if (res.ok) {
                const data = await res.json();
                setBlocks(data.blocks);
            }
        } catch (error) {
            console.error("Failed to load blocks", error);
        } finally {
            setIsLoading(false);
        }
    };

    const dateObj = parseISO(item.date);
    const timeStr = format(dateObj, 'HH:mm');
    const dateStr = format(dateObj, 'yyyy-MM-dd');

    return (
        <div className={cn(
            // 修改重點 1: 改回白底 (bg-white)，加上極淡的綠色邊框 (border-emerald-100)
            // 這樣既有層次，又不會黑壓壓一片
            "relative mb-4 rounded-2xl bg-white border border-emerald-100/60 shadow-md transition-all duration-300 overflow-hidden group hover:shadow-lg hover:border-emerald-200",
            isPast && "opacity-60 grayscale-[0.5]"
        )}>
            {item.img && !hideImage && (
                <div className="h-20 w-full relative overflow-hidden">
                    <img
                        src={item.img}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* 圖片遮罩改淡一點，讓圖片亮一點 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
            )}

            <Dialog onOpenChange={(open) => {
                if (open) fetchBlocks();
            }}>
                <DialogTrigger asChild>
                    <div className={cn("p-2.5 flex gap-3 cursor-pointer hover:bg-slate-50 transition-colors", item.img && !hideImage ? "" : "pt-3")}>
                        {/* Time & Line */}
                        <div className="flex flex-col items-center min-w-[3rem]">
                            {/* 修改重點 2: 時間改成深綠色 (text-emerald-700)，在白底上才看得清楚 */}
                            <span className="text-xs font-bold text-emerald-700 font-mono">{timeStr}</span>
                            {/* 修改重點 3: 中間的線條改成極淡的綠色 (bg-emerald-100) */}
                            <div className="flex-1 w-0.5 bg-emerald-100 my-1 rounded-full min-h-[1.5rem]" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-2">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className={cn("inline-flex items-center justify-center p-1.5 rounded-lg shadow-sm shrink-0", colorClass)}>
                                            {renderIcon()}
                                        </div>
                                        {/* 修改重點 4: 標題改回深灰色 (text-slate-800) */}
                                        <h3 className="font-bold text-slate-800 text-base leading-tight">{item.title}</h3>
                                    </div>
                                </div>
                                {item.maps && (
                                    <a
                                        href={item.maps}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-slate-300 hover:text-emerald-500 transition-colors p-1"
                                    >
                                        <ExternalLink size={18} />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogTrigger>

                <DialogContent className="max-w-sm w-[90vw] p-0 overflow-hidden rounded-3xl gap-0 border-0 shadow-2xl bg-white max-h-[85vh] flex flex-col">
                    <DialogHeader className="hidden">
                        <DialogTitle>{item.title}</DialogTitle>
                        <DialogDescription>{dateStr}</DialogDescription>
                    </DialogHeader>

                    {item.img ? (
                        <div className="h-48 w-full relative">
                            <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute bottom-4 left-4 text-white flex items-end gap-3">
                                <div className={cn("inline-flex items-center justify-center p-1.5 rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/30 shrink-0")}>
                                    {renderIcon()}
                                </div>
                                <h2 className="text-2xl font-bold leading-tight text-white drop-shadow-sm mb-0.5">{item.title}</h2>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 pb-2 text-left flex items-center gap-3">
                            <div className={cn("inline-flex items-center justify-center p-2 rounded-xl shrink-0", colorClass)}>
                                {renderIcon()}
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">{item.title}</h2>
                        </div>
                    )}

                    <div className="p-6 pt-4 flex-1 overflow-y-auto">
                        <div className="flex items-center gap-2 text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-6">
                            <div className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                {timeStr}
                            </div>
                            <span className="text-sm border-l border-slate-200 pl-2">{dateStr}</span>
                        </div>

                        <div className="text-slate-600 leading-relaxed text-sm">
                            {item.description && (
                                <div className="mb-4 text-base p-3 bg-slate-50 text-slate-700 rounded-lg border border-slate-100">{item.description}</div>
                            )}

                            {isLoading && (
                                <div className="flex items-center justify-center py-8 space-x-2 text-slate-400">
                                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0s' }} />
                                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                                </div>
                            )}

                            {blocks && blocks.length > 0 && (
                                <NotionBlockRenderer blocks={blocks} />
                            )}
                        </div>

                        {item.maps && (
                            <Button asChild className="w-full rounded-xl gap-2 font-bold h-12 text-base shadow-lg shadow-emerald-200/50 bg-emerald-600 hover:bg-emerald-700 mt-6" size="lg">
                                <a href={item.maps} target="_blank" rel="noreferrer">
                                    <MapPin size={18} />
                                    開啟地圖
                                </a>
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog >
        </div >
    );
};
