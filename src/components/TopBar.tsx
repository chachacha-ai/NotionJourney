import React, { useState, useEffect } from 'react';

interface TopBarProps {
    title: string;
    subtitle: string;
    gmtOffset?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle, gmtOffset = '+8' }) => {
    const offsets = gmtOffset.split(',').map(s => s.trim()).filter(Boolean);
    const defaultOffset = offsets.length > 0 ? offsets[0] : '+8';

    const [activeOffset, setActiveOffset] = useState<string>(defaultOffset);
    const [timeStr, setTimeStr] = useState('');
    const [hkTimeStr, setHkTimeStr] = useState('');

    useEffect(() => {
        const savedOffset = localStorage.getItem('lastUsedTimezone');
        if (savedOffset && offsets.includes(savedOffset)) {
            setActiveOffset(savedOffset);
        } else {
            setActiveOffset(defaultOffset);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gmtOffset]);

    const handleOffsetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newOffset = e.target.value;
        setActiveOffset(newOffset);
        localStorage.setItem('lastUsedTimezone', newOffset);
    };

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);

            const offset = parseFloat(activeOffset);
            const localDate = new Date(utc + (3600000 * offset));
            const hours = localDate.getHours().toString().padStart(2, '0');
            const minutes = localDate.getMinutes().toString().padStart(2, '0');
            setTimeStr(`${hours}:${minutes}`);

            const hkDate = new Date(utc + (3600000 * 8));
            const hkHours = hkDate.getHours().toString().padStart(2, '0');
            const hkMinutes = hkDate.getMinutes().toString().padStart(2, '0');
            setHkTimeStr(`${hkHours}:${hkMinutes}`);
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [activeOffset]);

    return (
        // 🌟 關鍵修改：使用 bg-primary (背景) 和 border-primary (框線)
        <div className="absolute top-0 left-0 right-0 z-40 w-full overflow-hidden bg-primary border-b border-primary shadow-md transition-colors duration-300 h-[calc(env(safe-area-inset-top)+78px)] pt-[env(safe-area-inset-top)]">
            
            <div className="relative w-full h-full flex items-center justify-center px-4">
                <div className="flex flex-col items-center justify-center text-center">
                    <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
                    {/* 使用白色的半透明度代替寫死的顏色 */}
                    <p className="text-xs font-medium text-white/70 uppercase tracking-widest">{subtitle}</p>
                </div>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end gap-1">
                    <div className="flex flex-col items-end leading-none">
                        <div className="flex items-center gap-1 mb-0.5">
                            <span className="text-[8px] uppercase font-bold text-white/70 tracking-wider">當地</span>
                            
                            {offsets.length > 1 && (
                                <select
                                    value={activeOffset}
                                    onChange={handleOffsetChange}
                                    // 🌟 選單背景也吃 primary
                                    className="bg-primary/50 text-white/90 text-[8px] font-mono rounded px-0.5 py-0 outline-none cursor-pointer border border-white/20 hover:bg-white/10"
                                >
                                    {offsets.map(o => {
                                        const display = o.startsWith('-') ? o : `+${o.replace('+','')}`;
                                        return <option key={o} value={o}>GMT{display}</option>;
                                    })}
                                </select>
                            )}
                        </div>
                        <span className="text-sm font-bold text-white font-mono">{timeStr}</span>
                    </div>

                    <div className="flex flex-col items-end leading-none opacity-80">
                         <div className="flex items-center gap-1">
                            <span className="text-[8px] uppercase font-bold text-white/70 tracking-wider mb-0.5">HK</span>
                            <span className="text-xs font-bold text-white/90 font-mono">{hkTimeStr}</span>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
