/**
 * ESA Edge Routine: /api/stats
 * 获取全局统计数据
 */

interface GlobalStats {
    totalPlayers: number;
    totalEnergyCollected: number;
    totalPurifications: number;
    averageBrightness: number;
    mostActiveCities: Array<{ name: string; purifications: number }>;
    recentActivities: Array<{
        type: 'purify' | 'relay' | 'achievement';
        userId: string;
        nickname: string;
        city: string;
        timestamp: number;
    }>;
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

        const statsRaw = await kv.get('global:stats');
        const citiesRaw = await kv.get('global:cities');
        if (!statsRaw || !citiesRaw) {
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

        const statsObj = JSON.parse(statsRaw) as {
            totalPurifications?: number;
            totalPlayers?: number;
            totalEnergy?: number;
            lastUpdate?: number;
            recentActivities?: GlobalStats['recentActivities'];
        };

        const citiesObj = JSON.parse(citiesRaw) as Record<
            string,
            { name: string; brightness: number; purifications?: number }
        >;

        const citiesArr = Object.values(citiesObj);
        const averageBrightness =
            citiesArr.length === 0
                ? 0
                : Math.round(
                    citiesArr.reduce((sum, c) => sum + (c.brightness ?? 0), 0) / citiesArr.length
                );

        const mostActiveCities = citiesArr
            .map((c) => ({ name: c.name, purifications: c.purifications ?? 0 }))
            .sort((a, b) => b.purifications - a.purifications)
            .slice(0, 5);

        const response: GlobalStats = {
            totalPlayers: statsObj.totalPlayers ?? 0,
            totalEnergyCollected: statsObj.totalEnergy ?? 0,
            totalPurifications: statsObj.totalPurifications ?? 0,
            averageBrightness,
            mostActiveCities,
            recentActivities: statsObj.recentActivities ?? [],
        };

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=30',
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
