/**
 * 成就系统
 */

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    condition: (userData: any) => boolean;
    reward?: number; // 奖励能量
}

export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first_purify',
        name: '初次净化',
        description: '完成第一次节点净化',
        icon: '✨',
        condition: (userData) => userData.citiesPurified.length >= 1,
        reward: 10,
    },
    {
        id: 'energy_collector',
        name: '能量收集者',
        description: '累计收集 1000 点能量',
        icon: '⚡',
        condition: (userData) => userData.totalEnergy >= 1000,
        reward: 50,
    },
    {
        id: 'city_savior',
        name: '城市救星',
        description: '净化 5 个不同的城市',
        icon: '🌆',
        condition: (userData) => userData.citiesPurified.length >= 5,
        reward: 100,
    },
    {
        id: 'global_guardian',
        name: '全球守护者',
        description: '净化 10 个不同的城市',
        icon: '🌍',
        condition: (userData) => userData.citiesPurified.length >= 10,
        reward: 200,
    },
    {
        id: 'veteran',
        name: '资深玩家',
        description: '游戏时长超过 30 分钟',
        icon: '🏆',
        condition: (userData) => {
            const now = Date.now();
            const playTime = now - userData.joinedAt;
            return playTime > 30 * 60 * 1000;
        },
        reward: 150,
    },
    {
        id: 'energy_master',
        name: '能量大师',
        description: '累计收集 5000 点能量',
        icon: '💎',
        condition: (userData) => userData.totalEnergy >= 5000,
        reward: 300,
    },
    {
        id: 'relay_champion',
        name: '接力冠军',
        description: '触发 10 次光束接力',
        icon: '🔗',
        condition: (userData) => userData.relayCount >= 10,
        reward: 250,
    },
    {
        id: 'speed_runner',
        name: '极速净化',
        description: '在 1 分钟内完成 3 次净化',
        icon: '⚡',
        condition: (userData) => userData.speedPurifyCount >= 3,
        reward: 100,
    },
];

export class AchievementManager {
    static checkAchievements(userData: any): Achievement[] {
        const newAchievements: Achievement[] = [];

        for (const achievement of ACHIEVEMENTS) {
            if (userData.achievements?.includes(achievement.id)) {
                continue; // Already unlocked
            }

            if (achievement.condition(userData)) {
                newAchievements.push(achievement);
            }
        }

        return newAchievements;
    }

    static getUnlockedAchievements(userData: any): Achievement[] {
        return ACHIEVEMENTS.filter(a => userData.achievements?.includes(a.id));
    }

    static getProgress(userData: any): { total: number; unlocked: number; percentage: number } {
        const total = ACHIEVEMENTS.length;
        const unlocked = this.getUnlockedAchievements(userData).length;
        const percentage = Math.round((unlocked / total) * 100);

        return { total, unlocked, percentage };
    }
}
