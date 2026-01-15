/**
 * 粒子系统 - 为地球添加动态粒子效果
 */

export interface Particle {
    id: string;
    lat: number;
    lng: number;
    altitude: number;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
    color: string;
    size: number;
}

export class ParticleSystem {
    private particles: Particle[] = [];
    private maxParticles: number = 500;

    constructor(maxParticles?: number) {
        if (maxParticles) this.maxParticles = maxParticles;
    }

    // 在指定位置发射粒子
    emit(lat: number, lng: number, count: number = 10, color: string = '#00ff88') {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= this.maxParticles) break;

            const particle: Particle = {
                id: `particle_${Date.now()}_${Math.random()}`,
                lat,
                lng,
                altitude: 0.1 + Math.random() * 0.2,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                vz: Math.random() * 0.3,
                life: 100,
                maxLife: 100,
                color,
                size: 0.1 + Math.random() * 0.2,
            };

            this.particles.push(particle);
        }
    }

    // 更新粒子状态
    update(deltaTime: number = 1) {
        this.particles = this.particles.filter(p => {
            p.life -= deltaTime;
            p.altitude += p.vz * deltaTime * 0.01;
            p.lat += p.vy * deltaTime * 0.1;
            p.lng += p.vx * deltaTime * 0.1;

            // 粒子随着生命值衰减变小
            p.size = (p.life / p.maxLife) * 0.3;

            return p.life > 0;
        });
    }

    // 获取当前所有粒子数据（用于渲染）
    getParticles(): Particle[] {
        return this.particles;
    }

    // 清空所有粒子
    clear() {
        this.particles = [];
    }

    // 获取粒子数量
    getCount(): number {
        return this.particles.length;
    }
}

// 预设粒子效果
export const ParticleEffects = {
    // 净化成功效果
    purifySuccess: (lat: number, lng: number, system: ParticleSystem) => {
        system.emit(lat, lng, 50, '#00ff88');
        setTimeout(() => system.emit(lat, lng, 30, '#00ffff'), 100);
        setTimeout(() => system.emit(lat, lng, 20, '#ffffff'), 200);
    },

    // 能量收集效果
    energyCollect: (lat: number, lng: number, system: ParticleSystem) => {
        system.emit(lat, lng, 10, '#ffaa00');
    },

    // 光束接力效果
    relayBeam: (fromLat: number, fromLng: number, toLat: number, toLng: number, system: ParticleSystem) => {
        // 在起点和终点发射粒子
        system.emit(fromLat, fromLng, 30, '#00ff88');
        setTimeout(() => {
            system.emit(toLat, toLng, 30, '#00ffff');
        }, 1000);
    },
};
