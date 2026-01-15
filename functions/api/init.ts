/**
 * Edge KV 初始化 API
 * 首次部署时调用此接口初始化数据
 */

const CITIES = {
    beijing: { name: '北京', lat: 39.9042, lng: 116.4074, brightness: 100 },
    shanghai: { name: '上海', lat: 31.2304, lng: 121.4737, brightness: 100 },
    guangzhou: { name: '广州', lat: 23.1291, lng: 113.2644, brightness: 100 },
    shenzhen: { name: '深圳', lat: 22.5431, lng: 114.0579, brightness: 100 },
    chengdu: { name: '成都', lat: 30.5728, lng: 104.0668, brightness: 100 },
    hangzhou: { name: '杭州', lat: 30.2741, lng: 120.1551, brightness: 100 },
    wuhan: { name: '武汉', lat: 30.5928, lng: 114.3055, brightness: 100 },
    xian: { name: '西安', lat: 34.3416, lng: 108.9398, brightness: 100 },
    tokyo: { name: 'Tokyo', lat: 35.6762, lng: 139.6503, brightness: 100 },
    osaka: { name: 'Osaka', lat: 34.6937, lng: 135.5023, brightness: 100 },
    seoul: { name: 'Seoul', lat: 37.5665, lng: 126.9780, brightness: 100 },
    singapore: { name: 'Singapore', lat: 1.3521, lng: 103.8198, brightness: 100 },
    bangkok: { name: 'Bangkok', lat: 13.7563, lng: 100.5018, brightness: 100 },
    mumbai: { name: 'Mumbai', lat: 19.0760, lng: 72.8777, brightness: 100 },
    delhi: { name: 'Delhi', lat: 28.7041, lng: 77.1025, brightness: 100 },
    dubai: { name: 'Dubai', lat: 25.2048, lng: 55.2708, brightness: 100 },
    london: { name: 'London', lat: 51.5074, lng: -0.1278, brightness: 100 },
    paris: { name: 'Paris', lat: 48.8566, lng: 2.3522, brightness: 100 },
    berlin: { name: 'Berlin', lat: 52.5200, lng: 13.4050, brightness: 100 },
    madrid: { name: 'Madrid', lat: 40.4168, lng: -3.7038, brightness: 100 },
    rome: { name: 'Rome', lat: 41.9028, lng: 12.4964, brightness: 100 },
    moscow: { name: 'Moscow', lat: 55.7558, lng: 37.6173, brightness: 100 },
    amsterdam: { name: 'Amsterdam', lat: 52.3676, lng: 4.9041, brightness: 100 },
    newyork: { name: 'New York', lat: 40.7128, lng: -74.0060, brightness: 100 },
    losangeles: { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, brightness: 100 },
    chicago: { name: 'Chicago', lat: 41.8781, lng: -87.6298, brightness: 100 },
    toronto: { name: 'Toronto', lat: 43.6532, lng: -79.3832, brightness: 100 },
    sanfrancisco: { name: 'San Francisco', lat: 37.7749, lng: -122.4194, brightness: 100 },
    saopaulo: { name: 'São Paulo', lat: -23.5505, lng: -46.6333, brightness: 100 },
    buenosaires: { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816, brightness: 100 },
    sydney: { name: 'Sydney', lat: -33.8688, lng: 151.2093, brightness: 100 },
    melbourne: { name: 'Melbourne', lat: -37.8136, lng: 144.9631, brightness: 100 },
    cairo: { name: 'Cairo', lat: 30.0444, lng: 31.2357, brightness: 100 },
    lagos: { name: 'Lagos', lat: 6.5244, lng: 3.3792, brightness: 100 },
};

export default async (params: any) => {
    const { env } = params;

    if (!env.GAME_KV) {
        return new Response(JSON.stringify({
            status: 'error',
            message: 'KV namespace not bound. Check esa.jsonc bindings.',
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        // 检查是否已初始化
        const existing = await env.GAME_KV.get('global:cities');
        if (existing) {
            return new Response(JSON.stringify({
                status: 'already_initialized',
                message: 'Data already exists. Use /api/reset to reinitialize.',
                citiesCount: Object.keys(JSON.parse(existing)).length,
            }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // 初始化城市数据
        await env.GAME_KV.put('global:cities', JSON.stringify(CITIES));
        console.log('✅ Initialized global:cities');

        // 初始化排行榜
        await env.GAME_KV.put('global:leaderboard', JSON.stringify([]));
        console.log('✅ Initialized global:leaderboard');

        // 初始化统计数据
        const stats = {
            totalPurifications: 0,
            totalPlayers: 0,
            totalEnergy: 0,
            lastUpdate: Date.now(),
        };
        await env.GAME_KV.put('global:stats', JSON.stringify(stats));
        console.log('✅ Initialized global:stats');

        return new Response(JSON.stringify({
            status: 'success',
            message: 'KV data initialized successfully',
            data: {
                citiesCount: Object.keys(CITIES).length,
                leaderboard: [],
                stats,
            },
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error: any) {
        console.error('❌ Initialization error:', error);
        return new Response(JSON.stringify({
            status: 'error',
            message: error.message || 'Unknown error',
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};
