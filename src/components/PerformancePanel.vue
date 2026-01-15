<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { performanceMonitor, type PerformanceMetrics } from '../utils/PerformanceMonitor';

const metrics = ref<PerformanceMetrics>({
  fps: 0,
  memoryUsage: 0,
  latency: 0,
  renderTime: 0,
  apiCallCount: 0,
  particleCount: 0,
});

const healthStatus = ref<'excellent' | 'good' | 'poor'>('excellent');

const updateMetrics = () => {
  metrics.value = performanceMonitor.getMetrics();
  healthStatus.value = performanceMonitor.getHealthStatus();
};

onMounted(() => {
  setInterval(updateMetrics, 1000);
});

const getStatusColor = () => {
  switch (healthStatus.value) {
    case 'excellent':
      return '#00ff88';
    case 'good':
      return '#ffaa00';
    case 'poor':
      return '#ff4444';
  }
};
</script>

<template>
  <div class="performance-monitor">
    <div class="monitor-title">性能监控</div>
    <div class="metrics-grid">
      <div class="metric">
        <span class="label">FPS:</span>
        <span class="value" :style="{ color: metrics.fps >= 50 ? '#00ff88' : '#ff4444' }">
          {{ metrics.fps }}
        </span>
      </div>
      <div class="metric">
        <span class="label">延迟:</span>
        <span class="value">{{ metrics.latency }}ms</span>
      </div>
      <div class="metric">
        <span class="label">内存:</span>
        <span class="value">{{ metrics.memoryUsage }}%</span>
      </div>
      <div class="metric">
        <span class="label">粒子:</span>
        <span class="value">{{ metrics.particleCount }}</span>
      </div>
      <div class="metric">
        <span class="label">API:</span>
        <span class="value">{{ metrics.apiCallCount }}</span>
      </div>
      <div class="metric">
        <span class="label">状态:</span>
        <span class="value status" :style="{ color: getStatusColor() }">
          {{ healthStatus === 'excellent' ? '优秀' : healthStatus === 'good' ? '良好' : '较差' }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.performance-monitor {
  position: fixed;
  top: 120px;
  right: 30px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid rgba(0, 255, 136, 0.3);
  font-family: 'Courier New', monospace;
  color: #00ff88;
  font-size: 12px;
  min-width: 200px;
}

.monitor-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  opacity: 0.7;
  margin-right: 5px;
}

.value {
  font-weight: bold;
  text-shadow: 0 0 5px currentColor;
}

.status {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
</style>
