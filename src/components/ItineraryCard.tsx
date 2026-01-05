"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Info, Hotel, Train, ShoppingBag, Utensils } from 'lucide-react';
import { resolveMapUrl, cn, parseNotionDateTime } from '@/lib/utils';
import { ItineraryItem } from '@/lib/notion';
import ItineraryDetailsModal from './ItineraryDetailsModal';

const CategoryIcon = ({ category }: { category: string }) => {
    switch (category) {
        case 'transport': return <Train className="w-5 h-5" />;
        case 'hotel': return <Hotel className="w-5 h-5" />;
        case 'visit': return <MapPin className="w-5 h-5" />;
        case 'restaurant': return <Utensils className="w-5 h-5" />;
        case 'shopping': return <ShoppingBag className="w-5 h-5" />;
        default: return <Info className="w-5 h-5" />;
    }
};

interface ItineraryCardProps {
    item: ItineraryItem;
}

export default function ItineraryCard({ item }: ItineraryCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { time } = parseNotionDateTime(item.date);
    const timeStr = time;

    const handleCardClick = () => {
        if (item.hasContent || item.description) {
            setIsModalOpen(true);
        }
    };

    return (
        <>
            <Card
                onClick={handleCardClick}
                className={cn(
                    // 修改 1: 背景改為深綠色 (bg-emerald-800)，移除 bg-white
                    "border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-3xl overflow-hidden bg-emerald-800",
                    (item.hasContent || item.description) ? "cursor-pointer active:scale-[0.98]" : "cursor-default"
                )}
            >
                {/* 圖片區域 */}
                {item.img && (
                    <div className="relative w-full h-48">
                        <Image
                            src={item.img}
                            alt={item.title}
                            fill
                            className="object-cover opacity-90 hover:opacity-100 transition-opacity" // 讓圖片稍微融合一點
                        />
                        <div className="absolute top-4 left-4">
                            {/* 修改 2: 圖片上的時間標籤，保持白色底，文字改深綠 */}
                            <span className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl text-xs font-bold text-emerald-800 shadow-sm">
                                {timeStr}
                            </span>
                        </div>
                    </div>
                )}

                <CardContent className={cn("p-5", !item.img && "pt-6")}>
                    <div className="flex items-start justify-between mb-3">
                        <div className="space-y-1">
                            {!item.img && (
                                /* 修改 3: 無圖片時的時間，改成淺綠色 (text-emerald-300) 以便在深底上閱讀 */
                                <span className="text-sm font-black text-emerald-300 tracking-tighter block mb-1">
                                    {timeStr}
                                </span>
                            )}
                            {/* 修改 4: 標題改成白色 (text-white) */}
                            <h3 className="font-bold text-xl text-white leading-tight">{item.title}</h3>
                            
                            {item.description && (
                                /* 修改 5: 描述文字改成半透明淺綠 (text-emerald-100) */
                                <p className="text-xs text-emerald-100/70 font-medium line-clamp-1 mt-1">
                                    {item.description}
                                </p>
                            )}
                        </div>

                        {/* 修改 6: Icon 區域改成半透明白底 (bg-white/10)，Icon 本身白色 */}
                        <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-2xl text-white shrink-0 ml-4 border border-white/10">
                            <CategoryIcon category={item.category} />
                        </div>
                    </div>

                    {item.maps && (
                        <Button
                            asChild
                            variant="outline"
                            onClick={(e) => e.stopPropagation()}
                            /* 修改 7: 按鈕改成全白色 (bg-white) 配深綠字，讓它在深底上跳出來 */
                            className="w-full justify-center gap-2 text-xs font-bold rounded-2xl h-11 border-transparent bg-white text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 transition-all active:scale-[0.98] mt-2"
                        >
                            <a href={resolveMapUrl(item.maps)} target="_blank">
                                <MapPin className="w-3.5 h-3.5" />
                                查看地點 / 導航
                            </a>
                        </Button>
                    )}
                </CardContent>
            </Card>

            <ItineraryDetailsModal
                item={item}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
