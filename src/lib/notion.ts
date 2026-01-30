import { Client } from '@notionhq/client';
import { cache } from 'react';

export interface TripMetadata {
    title: string;
    city: string;
    startDate: string;
    endDate: string;
    exchangeRate: string;
    timezone: string;
    icon?: string;
    infoPage?: {
        id: string;
        title: string;
        blocks: any[];
    };
}

export interface ItineraryItem {
    id: string;
    type: string;
    title: string;
    category: string;
    date: string;
    maps: string;
    img: string | null;
    description: string;
    hasContent: boolean;
    icon?: string | null;
    // 雖然你沒用到 file 欄位，但為了介面完整性保留定義
    file?: string | null; 
}

function emojiToDataUrl(emoji: string): string {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <text y=".9em" font-size="90">${emoji}</text>
        </svg>
    `.trim();
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export async function getDataSourceId(notion: Client, databaseId: string) {
    try {
        const dbResponse = await notion.databases.retrieve({
            database_id: databaseId,
        }) as any;

        let dbIcon = undefined;
        if (dbResponse.icon) {
            if (dbResponse.icon.type === 'emoji') {
                dbIcon = emojiToDataUrl(dbResponse.icon.emoji);
            } else if (dbResponse.icon.type === 'external') {
                dbIcon = dbResponse.icon.external.url;
            } else if (dbResponse.icon.type === 'file') {
                dbIcon = dbResponse.icon.file.url;
            }
        }

        let dataSourceId = databaseId;
        if (dbResponse.data_sources && dbResponse.data_sources.length > 0) {
            dataSourceId = dbResponse.data_sources[0].id;
        }

        return { dataSourceId, dbIcon };
    } catch (e) {
        console.warn("Failed to retrieve database info, using provided ID as Data Source ID:", e);
        return { dataSourceId: databaseId, dbIcon: undefined };
    }
}

export const getTripData = cache(async () => {
    const apiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!apiKey || !databaseId) {
        throw new Error(`Missing Notion credentials.`);
    }

    // 🔥 修改點 1：強制 Notion Client 不要快取
    const notion = new Client({
        auth: apiKey,
        fetch: (url, options) => {
            return fetch(url, {
                ...options,
                cache: 'no-store', // 👈 關鍵指令：永遠抓最新資料
            });
        },
    });

    const { dataSourceId, dbIcon } = await getDataSourceId(notion, databaseId);

    let response;
    try {
        // @ts-ignore
        response = await notion.dataSources.query({
            data_source_id: dataSourceId,
        });
    } catch (error: any) {
        console.error("Notion API Error Detail:", error);
        if (error.status === 401) throw new Error("Notion API Key 無效或是未授權。");
        if (error.status === 404) throw new Error("找不到指定的 Data Source ID。");
        throw error;
    }

    const results = response.results as any[];
    const configItems = results.filter(r => r.properties.type?.select?.name === 'config');

    const countryRow = configItems.find(r => r.properties.config?.select?.name === 'country');
    const cityRow = configItems.find(r => r.properties.config?.select?.name === 'city');
    const exchangeRow = configItems.find(r => r.properties.config?.select?.name === 'exchange');
    const gmtRow = configItems.find(r => r.properties.config?.select?.name === 'gmt');

    const metadata: TripMetadata = {
        title: countryRow?.properties.title?.title[0]?.plain_text || '我的旅遊行程',
        city: cityRow?.properties.title?.title[0]?.plain_text || '',
        startDate: countryRow?.properties.date?.date?.start || '',
        endDate: countryRow?.properties.date?.date?.end || '',
        exchangeRate: exchangeRow?.properties.title?.title[0]?.plain_text || 'JPY',
        timezone: gmtRow?.properties.title?.title[0]?.plain_text || 'GMT+8',
        icon: dbIcon,
        infoPage: undefined,
    };

    const infoRow = configItems.find(r => r.properties.config?.select?.name === 'info');
    if (infoRow) {
        try {
            const blocksResponse = await notion.blocks.children.list({
                block_id: infoRow.id,
            });
            metadata.infoPage = {
                id: infoRow.id,
                title: infoRow.properties.title?.title[0]?.plain_text || 'Info',
                blocks: blocksResponse.results
            };
        } catch (e) {
            console.error("Failed to fetch info page blocks", e);
        }
    }

    const itinerary: ItineraryItem[] = results
        .filter(r => r.properties.type?.select?.name === 'journey')
        .map(page => {
            let coverUrl = null;
            if (page.cover) {
                if (page.cover.type === 'external') coverUrl = page.cover.external.url;
                else if (page.cover.type === 'file') coverUrl = page.cover.file.url;
            }

            const category = page.properties.journey?.select?.name || 'other';
            const description = page.properties.description?.rich_text?.map((t: any) => t.plain_text).join('') || '';

            let icon: string | null = null;
            if (page.icon) {
                if (page.icon.type === 'emoji') icon = page.icon.emoji;
                else if (page.icon.type === 'external') icon = page.icon.external.url;
                else if (page.icon.type === 'file') icon = page.icon.file.url;
            }

            return {
                id: page.id,
                type: 'journey',
                title: page.properties.title?.title[0]?.plain_text || '未命名項目',
                category: category,
                date: page.properties.date?.date?.start || '',
                maps: page.properties.maps?.url || '',
                img: coverUrl,
                description: description,
                hasContent: true,
                icon,
                // 如果你有加 file property，這裡可以讀取 page.properties.file?.url
            };
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { metadata, itinerary };
});

export const getPasswordConfig = cache(async () => {
    const apiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!apiKey || !databaseId) return null;

    // 🔥 修改點 2：密碼驗證也要強制更新
    const notion = new Client({ 
        auth: apiKey,
        fetch: (url, options) => {
            return fetch(url, {
                ...options,
                cache: 'no-store',
            });
        },
    });

    const { dataSourceId } = await getDataSourceId(notion, databaseId);

    try {
        // @ts-ignore
        const response = await notion.dataSources.query({
            data_source_id: dataSourceId,
            filter: {
                property: "type",
                select: { equals: "config" }
            }
        });

        const results = response.results as any[];
        const passwordRow = results.find(r => r.properties.config?.select?.name === 'password');
        return passwordRow?.properties.title?.title[0]?.plain_text || null;
    } catch (e) {
        console.error("Failed to fetch password config:", e);
        return null;
    }
});

export const getPageBlocks = cache(async (pageId: string) => {
    const apiKey = process.env.NOTION_API_KEY;
    if (!apiKey) throw new Error('Missing Notion API Key');

    // 🔥 修改點 3：內頁內容也要強制更新
    const notion = new Client({ 
        auth: apiKey,
        fetch: (url, options) => {
            return fetch(url, {
                ...options,
                cache: 'no-store',
            });
        },
    });

    try {
        const response = await notion.blocks.children.list({
            block_id: pageId,
        });
        return response.results;
    } catch (error: any) {
        console.error("Notion getPageBlocks Error:", error);
        throw error;
    }
});
