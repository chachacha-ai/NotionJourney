import React from 'react';
import { getTripData, getPasswordConfig } from '@/lib/notion';
import SetupGuide from '@/components/SetupGuide';
import JourneyDashboard from '@/components/JourneyDashboard';

// ☢️ 核彈指令：強制這個頁面變成動態的 (Dynamic Rendering)
// 這會告訴 Vercel：「不要快取這個頁面，每次有人來都要重新執行一次！」
export const dynamic = 'force-dynamic';

export default async function Home() {
  const apiKey = process.env.NOTION_API_KEY;
  const dbId = process.env.NOTION_DATABASE_ID;

  if (!apiKey || !dbId) {
    console.log("Missing Environment Variables");
    return <SetupGuide />;
  }

  let tripData;
  try {
    // 這裡會去呼叫 lib/notion.ts (記得確認那邊也有加 cache: 'no-store')
    tripData = await getTripData();
  } catch (error: any) {
    console.error("Notion API Error:", error);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-red-50 text-red-900">
        <h1 className="text-2xl font-bold mb-4">系統發生錯誤</h1>
        <p className="mb-2">無法讀取 Notion 資料</p>
        <div className="bg-white p-4 rounded-lg shadow border border-red-200 w-full max-w-lg overflow-auto">
          <p className="font-mono text-sm whitespace-pre-wrap text-red-600">
            {error.message || JSON.stringify(error)}
          </p>
        </div>
      </div>
    );
  }

  const passwordConfig = await getPasswordConfig();
  return <JourneyDashboard data={tripData} requiredPassword={passwordConfig} />;
}
