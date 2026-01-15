/**
 * 浏览器指纹识别 - 用于创建匿名用户ID
 */

export class FingerprintGenerator {
    private static cachedFingerprint: string | null = null;

    static async generate(): Promise<string> {
        if (this.cachedFingerprint) {
            return this.cachedFingerprint;
        }

        const components: string[] = [];

        // 1. Canvas 指纹
        components.push(await this.getCanvasFingerprint());

        // 2. WebGL 指纹
        components.push(this.getWebGLFingerprint());

        // 3. 屏幕分辨率
        components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

        // 4. 时区
        components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

        // 5. 语言
        components.push(navigator.language);

        // 6. 平台
        components.push(navigator.platform);

        // 7. User Agent
        components.push(navigator.userAgent);

        // 8. 硬件并发数
        components.push(navigator.hardwareConcurrency?.toString() || '0');

        // 9. 设备内存（如果可用）
        components.push((navigator as any).deviceMemory?.toString() || 'unknown');

        // 10. 触摸支持
        components.push(navigator.maxTouchPoints?.toString() || '0');

        // 生成哈希
        const fingerprint = await this.hashString(components.join('|'));
        this.cachedFingerprint = fingerprint;

        return fingerprint;
    }

    private static async getCanvasFingerprint(): Promise<string> {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');

        if (!ctx) return 'no-canvas';

        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('EdgeGuardian', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('EdgeGuardian', 4, 17);

        return canvas.toDataURL();
    }

    private static getWebGLFingerprint(): string {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') as WebGLRenderingContext | null;

        if (!gl) return 'no-webgl';

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            return `${vendor}~${renderer}`;
        }

        return 'webgl-available';
    }

    private static async hashString(str: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    static getShortId(): string {
        return this.cachedFingerprint?.substring(0, 12) || 'anonymous';
    }
}

/**
 * 用户数据管理
 */
export interface UserData {
    id: string;
    nickname: string;
    totalEnergy: number;
    citiesPurified: string[];
    achievements: string[];
    joinedAt: number;
    lastActiveAt: number;
}

export class UserManager {
    private static STORAGE_KEY = 'spark_user_data';

    static async getCurrentUser(): Promise<UserData> {
        const fingerprint = await FingerprintGenerator.generate();
        const stored = localStorage.getItem(this.STORAGE_KEY);

        if (stored) {
            try {
                const userData: UserData = JSON.parse(stored);
                userData.lastActiveAt = Date.now();
                this.saveUser(userData);
                return userData;
            } catch (e) {
                // Invalid data, create new
            }
        }

        // Create new user
        const newUser: UserData = {
            id: fingerprint,
            nickname: `Guardian-${FingerprintGenerator.getShortId()}`,
            totalEnergy: 0,
            citiesPurified: [],
            achievements: [],
            joinedAt: Date.now(),
            lastActiveAt: Date.now(),
        };

        this.saveUser(newUser);
        return newUser;
    }

    static saveUser(userData: UserData) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));
    }

    static updateNickname(nickname: string) {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            const userData: UserData = JSON.parse(stored);
            userData.nickname = nickname;
            this.saveUser(userData);
        }
    }

    static addEnergy(amount: number) {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            const userData: UserData = JSON.parse(stored);
            userData.totalEnergy += amount;
            this.saveUser(userData);
        }
    }

    static addPurifiedCity(cityName: string) {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            const userData: UserData = JSON.parse(stored);
            if (!userData.citiesPurified.includes(cityName)) {
                userData.citiesPurified.push(cityName);
                this.saveUser(userData);
            }
        }
    }

    static addAchievement(achievementId: string) {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            const userData: UserData = JSON.parse(stored);
            if (!userData.achievements.includes(achievementId)) {
                userData.achievements.push(achievementId);
                this.saveUser(userData);
                return true; // New achievement
            }
        }
        return false;
    }
}
