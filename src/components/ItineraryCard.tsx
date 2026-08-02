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
                    // 🌟 聽從中央指揮：卡片背景強制使用 primary 主色
                    "!border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-3xl overflow-hidden !bg-primary",
                    (item.hasContent || item.description) ? "cursor-pointer active:scale-[0.98]" : "cursor-default"
                )}
            >
                {item.img && (
                    <div className="relative w-full h-48">
                        <Image
                            src={item.img}
                            alt={item.title}
                            fill
                            className="object-cover opacity-90 hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute top-4 left-4">
                            {/* 🌟 聽從中央指揮：圖片左上角時間標籤文字改為 primary */}
                            <span className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl text-xs font-bold text-primary shadow-sm">
                                {timeStr}
                            </span>
                        </div>
                    </div>
                )}

                <CardContent className={cn("p-5", !item.img && "pt-6")}>
                    <div className="flex items-start justify-between mb-3">
                        <div className="space-y-1">
                            {!item.img && (
                                {/* 🌟 聽從中央指揮：無圖片時的時間標籤改為半透明白色 */}
                                <span className="text-sm font-black text-white/80 tracking-tighter block mb-1">
                                    {timeStr}
                                </span>
                            )}
                            <h3 className="font-bold text-xl text-white leading-tight">{item.title}</h3>
                            
                            {item.description && (
                                <p className="text-xs text-white/70 font-medium line-clamp-1 mt-1">
                                    {item.description}
                                </p>
                            )}
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-2xl text-white shrink-0 ml-4 border border-white/10">
                            <CategoryIcon category={item.category} />
                        </div>
                    </div>

                    {item.maps && (
                        <Button
                            asChild
                            variant="outline"
                            onClick={(e) => e.stopPropagation()}
                            // 🌟 聽從中央指揮：底部按鈕文字顏色使用 primary
                            className="w-full justify-center gap-2 text-xs font-bold rounded-2xl h-11 border-transparent bg-white text-primary hover:bg-white/90 hover:text-primary transition-all active:scale-[0.98] mt-2"
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
