/**
 * ESA 缓存策略管理
 */

export interface CacheStrategy {
    path: string;
    ttl: number; // Time to live in seconds
    staleWhileRevalidate: number; // SWR time in seconds
    cacheKey?: string;
}

export const CACHE_STRATEGIES: CacheStrategy[] = [
    {
        path: '/api/status',
        ttl: 5,
        staleWhileRevalidate: 10,
    },
    {
        path: '/api/leaderboard',
        ttl: 60,
        staleWhileRevalidate: 120,
    },
    {
        path: '/api/stats',
        ttl: 30,
        staleWhileRevalidate: 60,
    },
];

/**
 * 客户端缓存管理器
 */
export class ClientCacheManager {
    private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

    set(key: string, data: any, ttl: number = 60) {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttl * 1000,
        });
    }

    get<T = any>(key: string): T | null {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const age = Date.now() - cached.timestamp;
        if (age > cached.ttl) {
            this.cache.delete(key);
            return null;
        }

        return cached.data as T;
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }

    clear() {
        this.cache.clear();
    }

    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
}

export const clientCache = new ClientCacheManager();
