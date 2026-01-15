/**
 * 性能监控工具
 */

export interface PerformanceMetrics {
    fps: number;
    memoryUsage: number;
    latency: number;
    renderTime: number;
    apiCallCount: number;
    particleCount: number;
}

export class PerformanceMonitor {
    private static instance: PerformanceMonitor;
    private metrics: PerformanceMetrics = {
        fps: 60,
        memoryUsage: 0,
        latency: 0,
        renderTime: 0,
        apiCallCount: 0,
        particleCount: 0,
    };

    private frameCount: number = 0;
    private fpsUpdateInterval: number = 1000; // Update FPS every second
    private lastFpsUpdate: number = performance.now();
    // @ts-ignore - Used for performance tracking
    private lastFrameTime: number = performance.now();

    private constructor() {
        this.startMonitoring();
    }

    static getInstance(): PerformanceMonitor {
        if (!PerformanceMonitor.instance) {
            PerformanceMonitor.instance = new PerformanceMonitor();
        }
        return PerformanceMonitor.instance;
    }

    private startMonitoring() {
        this.monitorFPS();
        this.monitorMemory();
    }

    private monitorFPS() {
        const updateFPS = () => {
            const now = performance.now();
            this.frameCount++;

            if (now - this.lastFpsUpdate >= this.fpsUpdateInterval) {
                this.metrics.fps = Math.round(
                    (this.frameCount * 1000) / (now - this.lastFpsUpdate)
                );
                this.frameCount = 0;
                this.lastFpsUpdate = now;
            }

            this.lastFrameTime = now;
            requestAnimationFrame(updateFPS);
        };

        requestAnimationFrame(updateFPS);
    }

    private monitorMemory() {
        if ((performance as any).memory) {
            setInterval(() => {
                const memory = (performance as any).memory;
                this.metrics.memoryUsage = Math.round(
                    (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
                );
            }, 2000);
        }
    }

    recordAPICall(latency: number) {
        this.metrics.apiCallCount++;
        this.metrics.latency = latency;
    }

    recordRenderTime(time: number) {
        this.metrics.renderTime = time;
    }

    updateParticleCount(count: number) {
        this.metrics.particleCount = count;
    }

    getMetrics(): PerformanceMetrics {
        return { ...this.metrics };
    }

    getHealthStatus(): 'excellent' | 'good' | 'poor' {
        if (this.metrics.fps >= 50 && this.metrics.memoryUsage < 70) {
            return 'excellent';
        } else if (this.metrics.fps >= 30 && this.metrics.memoryUsage < 85) {
            return 'good';
        }
        return 'poor';
    }
}

export const performanceMonitor = PerformanceMonitor.getInstance();
