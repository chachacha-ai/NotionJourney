import React, { useState, useEffect } from 'react';

interface TopBarProps {
    title: string;
    subtitle: string;
    gmtOffset?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ title, subtitle, gmtOffset = '+8' }) => {
    // 1. 將 Notion 傳來的字串用逗號切開 (例如 "+2,+3")
    const offsets = gmtOffset.split(',').map(s => s.trim()).filter(Boolean);
    const defaultOffset = offsets.length > 0 ? offsets[0] : '+8';

    // 2. 狀態管理
    const [activeOffset, setActiveOffset] = useState<string>(defaultOffset);
    const [timeStr, setTimeStr] = useState('');
    const [hkTimeStr, setHkTimeStr] = useState('');

    // 3. 第一次載入時，從 Local Storage 讀取上次的時區選擇
    useEffect(() => {
        const savedOffset = localStorage.getItem('lastUsedTimezone');
        if (savedOffset && offsets.includes(savedOffset)) {
            setActiveOffset(savedOffset);
        } else {
            setActiveOffset(defaultOffset);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gmtOffset]);

    // 4. 切換時區時，更新狀態並存入 Local Storage
    const handleOffsetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newOffset = e.target.value;
        setActiveOffset(newOffset);
        localStorage.setItem('lastUsedTimezone', newOffset);
    };

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);

            // 當地時間 (使用使用者選擇的 activeOffset)
            const offset = parseFloat(activeOffset);
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
    }, [activeOffset]);

    return (
        // 🎨 顏色修正：把 bg-emerald-700 改成了 bg-slate-900 (深海軍藍)
        <div className="absolute top-0 left-0 right-0 z-40 w-full overflow-hidden bg-slate-900 border-b border-slate-800 shadow-md transition-colors duration-300 h-[calc(env(safe-area-inset-top)+78px)] pt-[env(safe-area-inset-top)]">
            
            <div className="relative w-full h-full flex items-center justify-center px-4">
                <div className="flex flex-col items-center justify-center text-center">
                    <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
                    {/* 🎨 顏色修正：把 text-emerald-100 改成了 text-slate-300 */}
                    <p className="text-xs font-medium text-slate-300 uppercase tracking-widest">{subtitle}</p>
                </div>

                {/* 右上角時間區 */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-end gap-1">
                    
                    {/* 當地時間與下拉選單 */}
                    <div className="flex flex-col items-end leading-none">
                        <div className="flex items-center gap-1 mb-0.5">
                            {/* 🎨 顏色修正：把 text-emerald-200 改成了 text-blue-200 */}
                            <span className="text-[8px] uppercase font-bold text-blue-200 tracking-wider">當地</span>
                            
                            {/* 如果有多個時區，顯示下拉選單 */}
                            {offsets.length > 1 && (
                                <select
                                    value={activeOffset}
                                    onChange={handleOffsetChange}
                                    className="bg-slate-800 text-blue-100 text-[8px] font-mono rounded px-0.5 py-0 outline-none cursor-pointer border border-slate-700 hover:bg-slate-700"
                                >
                                    {offsets.map(o => {
                                        // 確保顯示格式漂亮，例如 "+2", "-5"
                                        const display = o.startsWith('-') ? o : `+${o.replace('+','')}`;
                                        return <option key={o} value={o}>GMT{display}</option>;
                                    })}
                                </select>
                            )}
                        </div>
                        <span className="text-sm font-bold text-white font-mono">{timeStr}</span>
                    </div>

                    {/* 香港時間 */}
                    <div className="flex flex-col items-end leading-none opacity-80">
                         <div className="flex items-center gap-1">
                            {/* 🎨 顏色修正：把 text-emerald 換成了 text-blue */}
                            <span className="text-[8px] uppercase font-bold text-blue-200 tracking-wider mb-0.5">HK</span>
                            <span className="text-xs font-bold text-blue-100 font-mono">{hkTimeStr}</span>
                         </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
