/**
 * ESA Edge Routine: /api/purify
 * 处理净化请求，更新城市亮度
 */

interface PurifyRequest {
    cityName: string;
    energy: number; // 玩家贡献的能量值
    userId?: string;
    nickname?: string;
    country?: string;
}

interface PurifyResponse {
    success: boolean;
    cityName: string;
    newBrightness: number;
    message: string;
    relayTarget?: { // 如果触发接力
        name: string;
        lat: number;
        lng: number;
    };
}

// 计算两点之间的距离（简化的球面距离）
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

type CityRecord = {
    name: string;
    lat: number;
    lng: number;
    brightness: number;
    guardians?: number;
    purifications?: number;
};

type GlobalStatsStore = {
    totalPurifications: number;
    totalPlayers: number;
    totalEnergy: number;
    lastUpdate: number;
    recentActivities?: Array<{
        type: 'purify' | 'relay' | 'achievement';
        userId: string;
        nickname: string;
        city: string;
        timestamp: number;
    }>;
};

type LeaderboardStoreEntry = {
    userId: string;
    nickname: string;
    totalEnergy: number;
    citiesPurified: number;
    country?: string;
    lastActive?: number;
};

type UserStore = {
    userId: string;
    nickname: string;
    country?: string;
    totalEnergy: number;
    citiesPurified: number;
    citiesSeen?: Record<string, true>;
    lastActive: number;
};

function findNearestDarkNodeFromKv(current: CityRecord, allCities: CityRecord[]): CityRecord | null {
    let nearest: CityRecord | null = null;
    let minDistance = Infinity;

    for (const city of allCities) {
        if (city.name === current.name) continue;
        if ((city.brightness ?? 0) >= 100) continue;
        const distance = calculateDistance(current.lat, current.lng, city.lat, city.lng);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = city;
        }
    }

    return nearest;
}

export default async function handler(request: Request, params: any) {
    try {
        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { 'Content-Type': 'application/json' },
            });
        }

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

        const body: PurifyRequest = await request.json();
        const { cityName, energy, userId, nickname, country } = body;

        if (!cityName || energy === undefined) {
            return new Response(JSON.stringify({ error: 'Invalid request' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const citiesRaw = await kv.get('global:cities');
        const statsRaw = await kv.get('global:stats');
        const leaderboardRaw = await kv.get('global:leaderboard');
        if (!citiesRaw || !statsRaw || !leaderboardRaw) {
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

        const citiesObj = JSON.parse(citiesRaw) as Record<string, CityRecord>;
        const cityEntry = Object.entries(citiesObj).find(([, c]) => c?.name === cityName);
        if (!cityEntry) {
            return new Response(JSON.stringify({ error: 'City not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        const [cityKey, city] = cityEntry;
        const safeEnergy = Number.isFinite(energy) ? Math.max(0, energy) : 0;
        const newBrightness = Math.min(100, (city.brightness ?? 0) + safeEnergy);

        let userStore: UserStore | null = null;
        let isNewPlayer = false;
        let userFirstTimeThisCity = false;

        if (userId) {
            const userKey = `user:${userId}`;
            const userRaw = await kv.get(userKey);
            if (userRaw) {
                userStore = JSON.parse(userRaw) as UserStore;
            } else {
                isNewPlayer = true;
                userStore = {
                    userId,
                    nickname: nickname || 'Anonymous',
                    country: country,
                    totalEnergy: 0,
                    citiesPurified: 0,
                    citiesSeen: {},
                    lastActive: Date.now(),
                };
            }

            userStore.nickname = nickname || userStore.nickname;
            if (country) userStore.country = country;
            userStore.totalEnergy = (userStore.totalEnergy ?? 0) + safeEnergy;
            userStore.lastActive = Date.now();
            userStore.citiesSeen = userStore.citiesSeen ?? {};

            if (!userStore.citiesSeen[cityKey]) {
                userFirstTimeThisCity = true;
                userStore.citiesSeen[cityKey] = true;
                userStore.citiesPurified = (userStore.citiesPurified ?? 0) + 1;
            }

            await kv.put(userKey, JSON.stringify(userStore));
        }

        citiesObj[cityKey] = {
            ...city,
            brightness: newBrightness,
            purifications: (city.purifications ?? 0) + 1,
            guardians: userFirstTimeThisCity ? (city.guardians ?? 0) + 1 : (city.guardians ?? 0),
        };

        // 更新全局统计
        const statsObj = JSON.parse(statsRaw) as GlobalStatsStore;
        statsObj.totalPurifications = (statsObj.totalPurifications ?? 0) + 1;
        statsObj.totalEnergy = (statsObj.totalEnergy ?? 0) + safeEnergy;
        if (isNewPlayer) {
            statsObj.totalPlayers = (statsObj.totalPlayers ?? 0) + 1;
        }
        statsObj.lastUpdate = Date.now();

        const actorId = userId || 'anonymous';
        const actorNick = (nickname || userStore?.nickname || 'Anonymous').slice(0, 40);
        const activity = {
            type: 'purify' as const,
            userId: actorId,
            nickname: actorNick,
            city: cityName,
            timestamp: Date.now(),
        };
        const recent = (statsObj.recentActivities ?? []).slice(0, 50);
        recent.unshift(activity);
        statsObj.recentActivities = recent.slice(0, 30);

        // 更新排行榜
        const parsedLeaderboard = JSON.parse(leaderboardRaw) as LeaderboardStoreEntry[] | { entries?: LeaderboardStoreEntry[] };
        const leaderboardList = Array.isArray(parsedLeaderboard)
            ? parsedLeaderboard
            : (parsedLeaderboard.entries ?? []);

        if (userId) {
            const idx = leaderboardList.findIndex((e) => e.userId === userId);
            const entry: LeaderboardStoreEntry = idx >= 0
                ? leaderboardList[idx]
                : {
                    userId,
                    nickname: actorNick,
                    totalEnergy: 0,
                    citiesPurified: 0,
                    country: country,
                    lastActive: Date.now(),
                };

            entry.nickname = actorNick;
            entry.totalEnergy = (entry.totalEnergy ?? 0) + safeEnergy;
            entry.citiesPurified = userStore?.citiesPurified ?? entry.citiesPurified ?? 0;
            if (country) entry.country = country;
            entry.lastActive = Date.now();

            if (idx >= 0) leaderboardList[idx] = entry;
            else leaderboardList.push(entry);
        }

        await kv.put('global:cities', JSON.stringify(citiesObj));
        await kv.put('global:stats', JSON.stringify(statsObj));
        await kv.put('global:leaderboard', JSON.stringify(leaderboardList));

        // 接力：仅当当前城市被点亮到 100% 才触发
        let relayTarget: PurifyResponse['relayTarget'] = undefined;
        if (newBrightness >= 100) {
            const allCities = Object.values(citiesObj);
            const nearest = findNearestDarkNodeFromKv(citiesObj[cityKey], allCities);
            if (nearest) {
                relayTarget = { name: nearest.name, lat: nearest.lat, lng: nearest.lng };
            }
        }

        const response: PurifyResponse = {
            success: true,
            cityName,
            newBrightness,
            message: relayTarget
                ? `${cityName} fully lit! Energy relayed to ${relayTarget.name}!`
                : `${cityName} brightness increased to ${newBrightness}%`,
            relayTarget,
        };

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
