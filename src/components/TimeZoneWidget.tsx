import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils'; // 如果你的路徑不一樣，請改回原本的

interface TimeZoneWidgetProps {
    baseTime?: Date;
    gmtOffset?: string; // e.g. "+9", "-5"
}

export const TimeZoneWidget: React.FC<TimeZoneWidgetProps> = ({ gmtOffset }) => {
    // Calc destination time helper
    const calcTime = () => {
        const now = new Date();
        if (!gmtOffset) return now;

        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const offset = parseFloat(gmtOffset.replace('GMT', '').replace('UTC', ''));

        if (!isNaN(offset)) {
            return new Date(utc + (3600000 * offset));
        }
        return now;
    };

    // Initialize with calculated time directly to avoid delay
    const [time, setTime] = useState<Date>(calcTime());

    useEffect(() => {
        setTime(calcTime());

        const timer = setInterval(() => {
            setTime(calcTime());
        }, 1000);

        return () => clearInterval(timer);
    }, [gmtOffset]);

    return (
        <div className="bg-slate-800 text-white rounded-2xl p-4 shadow-sm border border-slate-700 h-full flex flex-col justify-between relative overflow-hidden group">
            {/* Background Decoration */}
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/30 transition-all" />

            <div className="flex items-center gap-2 text-slate-400 mb-1 relative z-10">
                <Clock size={16} className="text-blue-400" />
                <span className="text-xs font-medium tracking-wide">當地時間</span>
            </div>

            <div className="relative z-10 text-right">
                <div className="text-3xl font-bold font-mono tracking-tight leading-none mb-1 text-white">
                    {format(time, 'HH:mm')}
                </div>
                <div className="flex items-center justify-end">
                    <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider bg-slate-700/50 px-1.5 py-0.5 rounded">
                        GMT{gmtOffset}
                    </div>
                </div>
            </div>
        </div>
    );
};
