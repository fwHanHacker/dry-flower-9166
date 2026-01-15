<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { api } from '../api';

interface GlobalStats {
  totalPlayers: number;
  totalEnergyCollected: number;
  totalPurifications: number;
  averageBrightness: number;
  mostActiveCities: Array<{ name: string; purifications: number }>;
}

const stats = ref<GlobalStats>({
  totalPlayers: 0,
  totalEnergyCollected: 0,
  totalPurifications: 0,
  averageBrightness: 0,
  mostActiveCities: [],
});

const loadStats = async () => {
  try {
    const data = await api.getStats();
    stats.value = data as any;
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
};

onMounted(() => {
  loadStats();
  setInterval(loadStats, 10000); // Refresh every 10 seconds
});
</script>

<template>
  <div class="stats-panel">
    <div class="panel-title">全球统计</div>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-value">{{ stats.totalPlayers.toLocaleString() }}</div>
        <div class="stat-label">总守护者</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">⚡</div>
        <div class="stat-value">{{ stats.totalEnergyCollected.toLocaleString() }}</div>
        <div class="stat-label">总能量</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">✨</div>
        <div class="stat-value">{{ stats.totalPurifications.toLocaleString() }}</div>
        <div class="stat-label">总净化次数</div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">🌍</div>
        <div class="stat-value">{{ stats.averageBrightness }}%</div>
        <div class="stat-label">平均亮度</div>
      </div>
    </div>

    <div class="top-cities">
      <div class="section-title">活跃城市 TOP 5</div>
      <div
        v-for="(city, index) in stats.mostActiveCities"
        :key="city.name"
        class="city-item"
      >
        <span class="city-rank">{{ index + 1 }}</span>
        <span class="city-name">{{ city.name }}</span>
        <span class="city-count">{{ city.purifications }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-panel {
  position: fixed;
  bottom: 150px;
  right: 30px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 20px;
  border-radius: 15px;
  border: 1px solid rgba(0, 255, 136, 0.3);
  font-family: 'Courier New', monospace;
  color: #00ff88;
  min-width: 280px;
  max-width: 320px;
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0 0 10px currentColor;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 20px;
}

.stat-card {
  background: rgba(0, 0, 0, 0.5);
  padding: 12px;
  border-radius: 10px;
  text-align: center;
  border: 1px solid rgba(0, 255, 136, 0.2);
  transition: all 0.3s;
}

.stat-card:hover {
  border-color: rgba(0, 255, 136, 0.6);
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 255, 136, 0.3);
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 3px;
}

.stat-label {
  font-size: 10px;
  opacity: 0.7;
  text-transform: uppercase;
}

.top-cities {
  border-top: 1px solid rgba(0, 255, 136, 0.3);
  padding-top: 15px;
}

.section-title {
  font-size: 12px;
  text-transform: uppercase;
  margin-bottom: 10px;
  text-align: center;
  opacity: 0.8;
}

.city-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  margin-bottom: 5px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 5px;
  font-size: 12px;
  transition: all 0.3s;
}

.city-item:hover {
  background: rgba(0, 255, 136, 0.2);
  transform: translateX(5px);
}

.city-rank {
  width: 20px;
  text-align: center;
  font-weight: bold;
  color: #ffaa00;
}

.city-name {
  flex: 1;
  margin: 0 10px;
}

.city-count {
  color: #00ffff;
  font-weight: bold;
}
</style>
