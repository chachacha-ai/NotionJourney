"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ItineraryItem } from '@/lib/notion';
import { Loader2, Info } from 'lucide-react';

// 🌟 新增：Notion 格式翻譯機
const renderRichText = (richTextArr: any[]) => {
    if (!richTextArr || !Array.isArray(richTextArr)) return null;
    return richTextArr.map((t, i) => {
        let cls = "";
        if (t.annotations?.bold) cls += " font-bold";
        if (t.annotations?.italic) cls += " italic";
        if (t.annotations?.strikethrough) cls += " line-through";
        if (t.annotations?.underline) cls += " underline";
        if (t.annotations?.code) cls += " font-mono bg-primary/10 text-primary px-1 py-0.5 rounded text-sm";
        if (t.annotations?.color && t.annotations.color !== 'default') cls += " text-primary"; 
        
        return (
            <span key={i} className={cls} style={{ whiteSpace: 'pre-wrap' }}>
                {t.text?.content}
            </span>
        );
    });
};

interface ItineraryDetailsModalProps {
    item: ItineraryItem | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function ItineraryDetailsModal({ item, isOpen, onClose }: ItineraryDetailsModalProps) {
    const [blocks, setBlocks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && item?.id && item.hasContent) {
            const fetchBlocks = async () => {
                setLoading(true);
                try {
                    const res = await fetch(`/api/notion/page/${item.id}`);
                    const data = await res.json();
                    if (data.blocks) {
                        setBlocks(data.blocks);
                    }
                } catch (error) {
                    console.error("Failed to fetch blocks", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchBlocks();
        } else {
            setBlocks([]);
        }
    }, [isOpen, item]);

    if (!item) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md rounded-3xl p-6 bg-white/95 backdrop-blur-xl border-none shadow-2xl">
                <DialogHeader className="text-left">
                    <DialogTitle className="text-2xl font-black text-gray-900 leading-tight">
                        {item.title}
                    </DialogTitle>
                    {/* 🎨 聽從中央指揮：把原本的 text-red-600 改成了 text-primary */}
                    <DialogDescription className="text-sm font-medium text-primary mt-1">
                        行程詳細資訊
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    {item.description && (
                        <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-2 mb-2 text-gray-400">
                                <Info className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">簡要描述</span>
                            </div>
                            <div className="text-gray-700 leading-relaxed font-medium">
                                {/* 🌟 讓簡要描述支援粗體和換行 */}
                                {item.descriptionRaw ? renderRichText(item.descriptionRaw) : <span style={{ whiteSpace: 'pre-wrap' }}>{item.description}</span>}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                <p className="text-xs font-bold uppercase tracking-widest">載入內容中...</p>
                            </div>
                        ) : blocks.length > 0 ? (
                            <div className="space-y-3">
                                {blocks.map((block: any) => (
                                    <div key={block.id} className="text-gray-800">
                                        {/* 🌟 讓所有內文區塊都掛上翻譯機，恢復原本的格式！ */}
                                        {block.type === 'paragraph' && (
                                            <p className="text-base leading-relaxed">
                                                {renderRichText(block.paragraph.rich_text)}
                                            </p>
                                        )}
                                        {block.type === 'bulleted_list_item' && (
                                            <li className="list-disc ml-5 text-base leading-relaxed">
                                                {renderRichText(block.bulleted_list_item.rich_text)}
                                            </li>
                                        )}
                                        {block.type === 'numbered_list_item' && (
                                            <li className="list-decimal ml-5 text-base leading-relaxed">
                                                {renderRichText(block.numbered_list_item.rich_text)}
                                            </li>
                                        )}
                                        {block.type === 'heading_1' && (
                                            <h1 className="text-2xl font-bold mt-5 mb-3 text-primary">
                                                {renderRichText(block.heading_1.rich_text)}
                                            </h1>
                                        )}
                                        {block.type === 'heading_2' && (
                                            <h2 className="text-xl font-bold mt-4 mb-2 text-primary/80">
                                                {renderRichText(block.heading_2.rich_text)}
                                            </h2>
                                        )}
                                        {block.type === 'heading_3' && (
                                            <h3 className="text-lg font-bold mt-3 mb-2 text-primary/70">
                                                {renderRichText(block.heading_3.rich_text)}
                                            </h3>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : !item.description && (
                            <div className="text-center py-12 text-gray-300 italic font-medium">
                                尚無詳細內容
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
