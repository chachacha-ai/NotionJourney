import React, { useState, useEffect } from 'react';

interface TopBarProps {
    title: string;
    subtitle: string;
    gmtOffset?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle, gmtOffset = '+8' }) => {
    // 1. 我們原本只有一個時間狀態，現在多加一個香港時間的狀態
    const [timeStr, setTimeStr] = useState('');
    const [hkTimeStr, setHkTimeStr] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            // 取得 UTC 標準時間 (毫秒)
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);

            // --- 計算當地時間 (Destination) ---
            const offset = parseFloat(gmtOffset);
            const localDate = new Date(utc + (3600000 * offset));
            const hours = localDate.getHours().toString().padStart(2, '0');
            const minutes = localDate.getMinutes().toString().padStart(2, '0');
            setTimeStr(`${hours}:${minutes}`);

            // --- 計算香港時間 (HK is always +8) ---
            const hkDate = new Date(utc + (3600000 * 8));
            const hkHours = hkDate.getHours().toString().padStart(2, '0');
            const hkMinutes = hkDate.getMinutes().toString().padStart(2, '0');
            setHkTimeStr(`${hkHours}:${hkMinutes}`);
        };

        updateTime();
        // 每秒更新一次
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [gmtOffset]);

    return (
        <div className="absolute top-0 left-0 right-0 z-40 w-full overflow-hidden bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm transition-colors duration-300 h-[calc(env(safe-area-inset-top)+78px)] pt-[env(safe-area-inset-top)]">
            {/* 背景裝飾 */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-pink-50/50 opacity-80" />

            <div className="relative w-full h-full flex items-center justify-center px-4">
                {/* 中間標題區 (不變) */}
                <div className="flex flex-col items-center justify-center text-center">
                    <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">{subtitle}</p>
                </div>

                {/* --- 右上角時間區 (修改這裡) --- */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end gap-1">
                    
                    {/* 上排：當地時間 (原本的，稍微改小一點點字體) */}
                    <div className="flex flex-col items-end leading-none">
                        <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">當地時間</span>
                        <span className="text-sm font-bold text-slate-800 font-mono">{timeStr}</span>
                    </div>

                    {/* 下排：香港時間 (新增的，用稍微淡一點的顏色區分) */}
                    <div className="flex flex-col items-end leading-none opacity-60">
                         <div className="flex items-center gap-1">
                            <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">HK</span>
                            <span className="text-xs font-bold text-slate-600 font-mono">{hkTimeStr}</span>
                         </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
