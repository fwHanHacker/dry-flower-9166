/**
 * ESA Edge Routine: /api/leaderboard
 * 获取全球排行榜数据
 */

interface LeaderboardEntry {
    rank: number;
    userId: string;
    nickname: string;
    totalEnergy: number;
    citiesPurified: number;
    country: string;
}

interface LeaderboardResponse {
    timestamp: number;
    entries: LeaderboardEntry[];
    userRank?: number;
}

export default async function handler(request: Request, params: any) {
    try {
        const kv = params?.env?.GAME_KV;
        if (!kv) {
            return new Response(
                JSON.stringify({
                    error: 'KV_NOT_BOUND',
                    message: '未绑定 GAME_KV。请在 ESA 控制台按 esa.jsonc 配置 KV 绑定。',
                }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                }
            );
        }

        const raw = await kv.get('global:leaderboard');
        if (!raw) {
            return new Response(
                JSON.stringify({
                    error: 'KV_NOT_INITIALIZED',
                    message: '数据未初始化。请先访问 /api/init 初始化 Edge KV。',
                }),
                {
                    status: 503,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                }
            );
        }

        const parsed = JSON.parse(raw) as
            | LeaderboardEntry[]
            | { entries?: Array<Omit<LeaderboardEntry, 'rank'> & { rank?: number }> };

        const list = Array.isArray(parsed) ? parsed : (parsed.entries ?? []);

        const sorted = list
            .slice()
            .sort((a, b) => {
                const byEnergy = (b.totalEnergy ?? 0) - (a.totalEnergy ?? 0);
                if (byEnergy !== 0) return byEnergy;
                return (b.citiesPurified ?? 0) - (a.citiesPurified ?? 0);
            })
            .slice(0, 100)
            .map((e, idx) => ({
                rank: idx + 1,
                userId: e.userId,
                nickname: e.nickname,
                totalEnergy: e.totalEnergy ?? 0,
                citiesPurified: e.citiesPurified ?? 0,
                country: e.country ?? '',
            }));

        const response: LeaderboardResponse = {
            timestamp: Date.now(),
            entries: sorted,
            userRank: undefined,
        };

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=60', // 缓存 1 分钟
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
