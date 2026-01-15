/**
 * ESA Edge Routine: /api/status
 * 获取全球各节点的亮度数据
 */

interface CityData {
    name: string;
    lat: number;
    lng: number;
    brightness: number; // 0-100
    guardians: number; // 守护者数量
}

interface StatusResponse {
    timestamp: number;
    cities: CityData[];
    totalBrightness: number; // 全球平均亮度
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

        const raw = await kv.get('global:cities');
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

        const obj = JSON.parse(raw) as Record<
            string,
            { name: string; lat: number; lng: number; brightness: number; guardians?: number }
        >;

        const cities: CityData[] = Object.values(obj).map((c) => ({
            name: c.name,
            lat: c.lat,
            lng: c.lng,
            brightness: c.brightness,
            guardians: c.guardians ?? 0,
        }));

        const totalBrightness =
            cities.length === 0
                ? 0
                : Math.round(cities.reduce((sum, city) => sum + city.brightness, 0) / cities.length);

        const response: StatusResponse = {
            timestamp: Date.now(),
            cities,
            totalBrightness,
        };

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // 开发阶段允许跨域
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
