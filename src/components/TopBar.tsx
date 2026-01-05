import React, { useState, useEffect } from 'react';

interface TopBarProps {
    title: string;
    subtitle: string;
    gmtOffset?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle, gmtOffset = '+8' }) => {
    const [timeStr, setTimeStr] = useState('');
    const [hkTimeStr, setHkTimeStr] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);

            // 當地時間
            const offset = parseFloat(gmtOffset);
            const localDate = new Date(utc + (3600000 * offset));
            const hours = localDate.getHours().toString().padStart(2, '0');
            const minutes = localDate.getMinutes().toString().padStart(2, '0');
            setTimeStr(`${hours}:${minutes}`);

            // 香港時間
            const hkDate = new Date(utc + (3600000 * 8));
            const hkHours = hkDate.getHours().toString().padStart(2, '0');
            const hkMinutes = hkDate.getMinutes().toString().padStart(2, '0');
            setHkTimeStr(`${hkHours}:${hkMinutes}`);
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [gmtOffset]);

    return (
        // 1. 背景改為實心深綠色 (bg-emerald-700)，移除原本的 backdrop-blur 和 gradient
        <div className="absolute top-0 left-0 right-0 z-40 w-full overflow-hidden bg-emerald-700 border-b border-emerald-800 shadow-md transition-colors duration-300 h-[calc(env(safe-area-inset-top)+78px)] pt-[env(safe-area-inset-top)]">
            
            <div className="relative w-full h-full flex items-center justify-center px-4">
                <div className="flex flex-col items-center justify-center text-center">
                    {/* 2. 標題改為白色 (text-white) */}
                    <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
                    {/* 3. 副標題改為淺綠色 (text-emerald-100) */}
                    <p className="text-xs font-medium text-emerald-100/80 uppercase tracking-widest">{subtitle}</p>
                </div>

                {/* 右上角時間區 */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end gap-1">
                    
                    {/* 當地時間 */}
                    <div className="flex flex-col items-end leading-none">
                        <span className="text-[8px] uppercase font-bold text-emerald-200 tracking-wider mb-0.5">當地時間</span>
                        <span className="text-sm font-bold text-white font-mono">{timeStr}</span>
                    </div>

                    {/* 香港時間 */}
                    <div className="flex flex-col items-end leading-none opacity-80">
                         <div className="flex items-center gap-1">
                            <span className="text-[8px] uppercase font-bold text-emerald-200 tracking-wider mb-0.5">HK</span>
                            <span className="text-xs font-bold text-emerald-100 font-mono">{hkTimeStr}</span>
                         </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
