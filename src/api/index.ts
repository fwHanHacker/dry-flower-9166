export interface CityData {
    name: string;
    lat: number;
    lng: number;
    brightness: number;
    guardians: number;
}

export interface StatusResponse {
    timestamp: number;
    cities: CityData[];
    totalBrightness: number;
}

export interface PurifyResponse {
    success: boolean;
    cityName: string;
    newBrightness: number;
    message: string;
    relayTarget?: {
        name: string;
        lat: number;
        lng: number;
    };
}

export interface GlobalStats {
    totalPlayers: number;
    totalEnergyCollected: number;
    totalPurifications: number;
    averageBrightness: number;
    mostActiveCities: Array<{ name: string; purifications: number }>;
}

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    nickname: string;
    totalEnergy: number;
    citiesPurified: number;
    country: string;
}

export interface LeaderboardResponse {
    timestamp: number;
    entries: LeaderboardEntry[];
    userRank?: number;
}

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? '';

const resolveUrl = (path: string) => {
    if (import.meta.env.DEV && !API_BASE) {
        throw new Error(
            '未配置真实后端地址：请在 .env.local 设置 VITE_API_BASE=https://<你的ESA域名>'
        );
    }
    return `${API_BASE}${path}`;
};

const fetchJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const response = await fetch(resolveUrl(path), init);
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Request failed: ${response.status} ${text}`);
    }
    return response.json();
};

export const api = {
    async getStatus(): Promise<StatusResponse> {
        return fetchJson<StatusResponse>('/api/status');
    },

    async purify(cityName: string, energy: number, userId?: string, nickname?: string): Promise<PurifyResponse> {
        return fetchJson<PurifyResponse>('/api/purify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cityName, energy, userId, nickname }),
        });
    },

    async getStats(): Promise<GlobalStats> {
        return fetchJson<GlobalStats>('/api/stats');
    },

    async getLeaderboard(): Promise<LeaderboardResponse> {
        return fetchJson<LeaderboardResponse>('/api/leaderboard');
    },
};
