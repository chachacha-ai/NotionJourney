import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Coins, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CurrencyWidgetProps {
    rate?: number;
    currencyCode: string; // 現在可以接受 "DKK,SEK,EUR"[cite: 2]
}

export const CurrencyWidget: React.FC<CurrencyWidgetProps> = ({ rate: initialRate, currencyCode }) => {
    // 1. 將 Notion 傳來的字串用逗號切開，變成陣列並去除空白
    const currencies = currencyCode.split(',').map(c => c.trim()).filter(Boolean);
    const defaultCurrency = currencies.length > 0 ? currencies[0] : 'EUR';

    // 2. 狀態管理
    const [activeCurrency, setActiveCurrency] = useState<string>(defaultCurrency);
    const [amount, setAmount] = useState<string>('');
    const [exchangeRate, setExchangeRate] = useState<number>(initialRate || 9.1);[cite: 2]
    const [isLoading, setIsLoading] = useState(false);[cite: 2]

    // 3. 第一次載入時，從 Local Storage 讀取上次的選擇
    useEffect(() => {
        const savedCurrency = localStorage.getItem('lastUsedCurrency');
        // 確保儲存的幣別有在這次 Notion 設定的清單裡
        if (savedCurrency && currencies.includes(savedCurrency)) {
            setActiveCurrency(savedCurrency);
        } else {
            setActiveCurrency(defaultCurrency);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currencyCode]);

    // 4. 切換貨幣時，更新狀態並存入 Local Storage
    const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCur = e.target.value;
        setActiveCurrency(newCur);
        localStorage.setItem('lastUsedCurrency', newCur);
    };

    // 5. 抓取匯率邏輯 (改為監聽 activeCurrency)
    useEffect(() => {
        const fetchRate = async () => {
            if (!activeCurrency || activeCurrency.length !== 3 || activeCurrency === 'CUR') return;[cite: 2]

            setIsLoading(true);[cite: 2]
            try {
                // 以 HKD 為基準抓取匯率[cite: 2]
                const res = await fetch(`https://open.er-api.com/v6/latest/HKD`);[cite: 2]
                const data = await res.json();[cite: 2]

                // 1 HKD = X Target => 1 Target = 1/X HKD[cite: 2]
                const rateToTarget = data.rates[activeCurrency.toUpperCase()];[cite: 2]
                if (rateToTarget) {[cite: 2]
                    const priceInHkd = 1 / rateToTarget;[cite: 2]
                    setExchangeRate(priceInHkd);[cite: 2]
                }[cite: 2]
            } catch (e) {
                console.error("Rate fetch failed", e);[cite: 2]
            } finally {
                setIsLoading(false);[cite: 2]
            }
        };

        fetchRate();[cite: 2]
    }, [activeCurrency]);

    const targetVal = amount ? parseFloat(amount) : 1000;[cite: 2]
    const calculated = (targetVal * exchangeRate).toFixed(0);[cite: 2]

    return (
        <div className="h-full p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg shadow-slate-200 flex flex-col relative overflow-hidden group">
            {/* 讀取中指示器 */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {isLoading && <RefreshCw className="animate-spin text-slate-500" size={10} />}
            </div>

            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                        <Coins size={12} />
                        <span>匯率計算</span>
                    </div>
                    
                    {/* 如果有多個貨幣，顯示下拉選單 */}
                    {currencies.length > 1 && (
                        <select
                            value={activeCurrency}
                            onChange={handleCurrencyChange}
                            className="bg-slate-800/50 border border-slate-600 text-slate-200 rounded px-1.5 py-0.5 outline-none cursor-pointer hover:bg-slate-700 transition-colors"
                        >
                            {currencies.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    )}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                    1 {activeCurrency} ≈ {exchangeRate.toFixed(3)} HKD
                </div>
            </div>

            <div className="flex-1 flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-xs font-medium text-slate-500">
                            {activeCurrency === 'EUR' ? '€' : activeCurrency === 'JPY' ? '¥' : '$'}
                        </span>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={amount ? parseFloat(amount).toLocaleString() : ''}[cite: 2]
                            onChange={(e) => {
                                const val = e.target.value.replace(/,/g, '');[cite: 2]
                                if (!isNaN(Number(val)) && val !== '') {[cite: 2]
                                    setAmount(val);[cite: 2]
                                } else if (val === '') {[cite: 2]
                                    setAmount('');[cite: 2]
                                }[cite: 2]
                            }}
                            placeholder="1,000"[cite: 2]
                            className={cn(
                                "w-full bg-transparent border-none font-bold placeholder-slate-700 text-white focus:outline-none p-0 tracking-tight font-mono transition-all duration-200",[cite: 2]
                                (amount?.length || 0) >= 8 ? "text-lg" :[cite: 2]
                                    (amount?.length || 0) >= 6 ? "text-xl" :[cite: 2]
                                        "text-2xl"[cite: 2]
                            )}
                        />
                    </div>
                </div>

                <ArrowRightLeft size={14} className="text-slate-600 shrink-0" />

                <div className="flex-1 min-w-0 text-right">
                    <div className="flex items-baseline justify-end gap-0.5">
                        <span className="text-xs font-medium text-slate-500">HK$</span>
                        <span className={cn(
                            "font-bold text-emerald-400 tracking-tight truncate font-mono transition-all duration-200",[cite: 2]
                            calculated.length >= 8 ? "text-lg" :[cite: 2]
                                calculated.length >= 6 ? "text-xl" :[cite: 2]
                                    "text-2xl"[cite: 2]
                        )}>
                            {parseFloat(calculated).toLocaleString()}[cite: 2]
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
