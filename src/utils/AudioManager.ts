/**
 * 音效管理系统 - 使用 Web Audio API 生成真实音效
 */

export enum SoundEffect {
    CHARGE = 'charge',
    PURIFY = 'purify',
    RELAY = 'relay',
    ACHIEVEMENT = 'achievement',
    BUTTON_CLICK = 'button_click',
    AMBIENT = 'ambient',
}

export class AudioManager {
    private static instance: AudioManager;
    private audioContext: AudioContext | null = null;
    private effectVolume: number = 0.5;
    private muted: boolean = false;

    private constructor() {
        this.initAudioContext();
    }

    static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    private initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    private playSynthSound(frequency: number, duration: number, type: OscillatorType = 'sine') {
        if (!this.audioContext || this.muted) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(this.effectVolume * 0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    play(effect: SoundEffect) {
        if (this.muted || !this.audioContext) return;

        // Resume audio context if suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        switch (effect) {
            case SoundEffect.CHARGE:
                this.playSynthSound(440, 0.1, 'sine');
                break;
            case SoundEffect.PURIFY:
                this.playSynthSound(880, 0.2, 'triangle');
                setTimeout(() => this.playSynthSound(660, 0.15, 'sine'), 100);
                break;
            case SoundEffect.RELAY:
                this.playSynthSound(660, 0.3, 'sawtooth');
                break;
            case SoundEffect.ACHIEVEMENT:
                this.playSynthSound(1000, 0.1, 'sine');
                setTimeout(() => this.playSynthSound(1200, 0.1, 'sine'), 100);
                setTimeout(() => this.playSynthSound(1500, 0.2, 'sine'), 200);
                break;
            case SoundEffect.BUTTON_CLICK:
                this.playSynthSound(300, 0.05, 'square');
                break;
        }
    }

    setVolume(volume: number) {
        this.effectVolume = Math.max(0, Math.min(1, volume));
    }

    setMuted(muted: boolean) {
        this.muted = muted;
    }

    isMuted(): boolean {
        return this.muted;
    }
}

// 导出单例实例
export const audioManager = AudioManager.getInstance();
