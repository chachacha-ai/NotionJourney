import React, { useState, useEffect } from 'react';
import { Clock, Home } from 'lucide-react'; 
import { format } from 'date-fns';
import { cn } from '@/lib/utils'; // 如果你的路徑不一樣，請改回原本的 (例如 './ui/utils')

interface TimeZoneWidgetProps {
    baseTime?: Date;
    gmtOffset?: string; // e.g. "+9", "-5"
}

export const TimeZoneWidget: React.FC<TimeZoneWidgetProps> = ({ gmtOffset }) => {
    
    // --- 計算當地時間 ---
    const calcTime = () => {
        const now = new Date();
        if (!gmtOffset) return now;
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const offset = parseFloat(gmtOffset.replace('GMT', '').replace('UTC', ''));
        return !isNaN(offset) ? new Date(utc + (3600000 * offset)) : now;
    };

    // --- 計算香港時間 (GMT+8) ---
    const calcHkTime = () => {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        return new Date(utc + (3600000 * 8));
    };

    const [time, setTime] = useState<Date>(calcTime());
    const [hkTime, setHkTime] = useState<Date>(calcHkTime());

    useEffect(() => {
        setTime(calcTime());
        setHkTime(calcHkTime());
        const timer = setInterval(() => {
            setTime(calcTime());
            setHkTime(calcHkTime());
        }, 1000);
        return () => clearInterval(timer);
    }, [gmtOffset]);

    return (
        // h-full 確保它會填滿格子，flex-col justify-between 確保上下分佈均勻
        <div className="bg-slate-800 text-white rounded-2xl p-4 shadow-sm border border-slate-700 h-full flex flex-col justify-between relative overflow-hidden group">
            {/* 背景裝飾 (不佔空間) */}
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all" />

            {/* --- 上半部：當地時間 (主角) --- */}
            <div className="flex flex-col gap-1 z-10"> {/* 使用 flex-col gap-1 讓它緊湊一點 */}
                <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={14} className="text-blue-400" />
                    <span className="text-[10px] font-medium tracking-wide uppercase">Local Time</span>
                </div>

                <div className="flex items-end justify-between">
                     {/* 字體縮小為 text-2xl (原本是 3xl) 以節省空間 */}
                    <div className="text-2xl font-bold font-mono tracking-tight leading-none text-white">
                        {format(time, 'HH:mm')}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider bg-slate-900/50 px-1.5 py-0.5 rounded mb-0.5">
                        GMT{gmtOffset}
                    </div>
                </div>
            </div>

            {/* --- 分隔線 (變細、變淡) --- */}
            <div className="w-full h-px bg-slate-700/30 my-2" />

            {/* --- 下半部：香港時間 (配角) --- */}
            <div className="flex items-center justify-between z-10 opacity-70 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1.5 text-slate-400">
                    <Home size={12} className="text-emerald-400" />
                    <span className="text-[10px] font-medium tracking-wide">HK Time</span>
                </div>
                {/* 字體設為 text-sm，比上面小一點，建立層次感 */}
                <div className="text-sm font-bold font-mono text-slate-300">
                    {format(hkTime, 'HH:mm')}
                </div>
            </div>
        </div>
    );
};
