/**
 * 多语言支持
 */

export type Language = 'zh-CN' | 'en-US' | 'ja-JP';

export interface Translations {
    [key: string]: string | Translations;
}

const translations: Record<Language, Translations> = {
    'zh-CN': {
        title: '星火燎原：边缘守护者',
        currentNode: '当前节点',
        localBrightness: '本地亮度',
        globalPurification: '全球净化率',
        energyCollector: '能量收集器',
        clickToCharge: '点击充能',
        charging: '充能中...',
        purifyNode: '净化节点',
        instructions: {
            charge: '🌟 点击"充能"收集能量',
            purify: '⚡ 能量满后点击"净化节点"点亮城市',
            relay: '🔗 当节点完全点亮，能量将接力至下一个节点',
        },
        achievements: {
            title: '成就系统',
            unlocked: '已解锁',
            locked: '未解锁',
        },
        leaderboard: {
            title: '排行榜',
            rank: '排名',
            guardian: '守护者',
            energy: '能量',
        },
        settings: {
            title: '设置',
            language: '语言',
            sound: '音效',
            music: '音乐',
        },
    },
    'en-US': {
        title: 'Spark: Edge Guardians',
        currentNode: 'Current Node',
        localBrightness: 'Local Brightness',
        globalPurification: 'Global Purification',
        energyCollector: 'Energy Collector',
        clickToCharge: 'Click to Charge',
        charging: 'Charging...',
        purifyNode: 'Purify Node',
        instructions: {
            charge: '🌟 Click "Charge" to collect energy',
            purify: '⚡ When full, click "Purify Node" to light up the city',
            relay: '🔗 When node is fully lit, energy relays to the next node',
        },
        achievements: {
            title: 'Achievements',
            unlocked: 'Unlocked',
            locked: 'Locked',
        },
        leaderboard: {
            title: 'Leaderboard',
            rank: 'Rank',
            guardian: 'Guardian',
            energy: 'Energy',
        },
        settings: {
            title: 'Settings',
            language: 'Language',
            sound: 'Sound',
            music: 'Music',
        },
    },
    'ja-JP': {
        title: 'スパーク：エッジガーディアン',
        currentNode: '現在のノード',
        localBrightness: 'ローカル輝度',
        globalPurification: 'グローバル浄化率',
        energyCollector: 'エネルギーコレクター',
        clickToCharge: '充電をクリック',
        charging: '充電中...',
        purifyNode: 'ノードを浄化',
        instructions: {
            charge: '🌟 「充電」をクリックしてエネルギーを収集',
            purify: '⚡ エネルギーが満タンになったら「ノードを浄化」をクリック',
            relay: '🔗 ノードが完全に点灯すると、次のノードにエネルギーがリレーされます',
        },
        achievements: {
            title: 'アチーブメント',
            unlocked: 'アンロック済み',
            locked: 'ロック中',
        },
        leaderboard: {
            title: 'リーダーボード',
            rank: 'ランク',
            guardian: 'ガーディアン',
            energy: 'エネルギー',
        },
        settings: {
            title: '設定',
            language: '言語',
            sound: '効果音',
            music: '音楽',
        },
    },
};

export class I18n {
    private static currentLanguage: Language = 'zh-CN';

    static setLanguage(lang: Language) {
        this.currentLanguage = lang;
        localStorage.setItem('spark_language', lang);
    }

    static getLanguage(): Language {
        const stored = localStorage.getItem('spark_language') as Language;
        if (stored && translations[stored]) {
            this.currentLanguage = stored;
            return stored;
        }
        return this.currentLanguage;
    }

    static t(key: string): string {
        const keys = key.split('.');
        let value: any = translations[this.currentLanguage];

        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                return key; // Return key if translation not found
            }
        }

        return typeof value === 'string' ? value : key;
    }

    static detectBrowserLanguage(): Language {
        const browserLang = navigator.language;
        if (browserLang.startsWith('zh')) return 'zh-CN';
        if (browserLang.startsWith('ja')) return 'ja-JP';
        return 'en-US';
    }
}

// Auto-detect language on first load
if (!localStorage.getItem('spark_language')) {
    I18n.setLanguage(I18n.detectBrowserLanguage());
}
