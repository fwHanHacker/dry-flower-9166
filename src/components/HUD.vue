<script setup lang="ts">
import { ref, computed } from 'vue';

defineProps<{
  currentCity: string;
  brightness: number;
  totalBrightness: number;
}>();

const emit = defineEmits<{
  (e: 'purify'): void;
}>();

const energy = ref(0);
const isCharging = ref(false);
const maxEnergy = 100;

// 点击开始充能
const startCharging = () => {
  if (isCharging.value || energy.value >= maxEnergy) return;
  
  isCharging.value = true;
  const interval = setInterval(() => {
    energy.value += 2;
    if (energy.value >= maxEnergy) {
      energy.value = maxEnergy;
      isCharging.value = false;
      clearInterval(interval);
    }
  }, 50);
};

// 执行净化
const executePurify = () => {
  if (energy.value < maxEnergy) return;
  
  emit('purify');
  energy.value = 0; // 重置能量
};

const energyPercent = computed(() => (energy.value / maxEnergy) * 100);
const canPurify = computed(() => energy.value >= maxEnergy);
</script>

<template>
  <div class="hud-overlay">
    <!-- 顶部信息栏 -->
    <div class="top-bar">
      <div class="info-block">
        <span class="label">当前节点</span>
        <span class="value">{{ currentCity }}</span>
      </div>
      <div class="info-block">
        <span class="label">本地亮度</span>
        <span class="value">{{ brightness }}%</span>
      </div>
      <div class="info-block">
        <span class="label">全球净化率</span>
        <span class="value">{{ totalBrightness }}%</span>
      </div>
    </div>

    <!-- 能量收集器 -->
    <div class="energy-collector">
      <div class="energy-title">能量收集器</div>
      <div class="energy-bar-container">
        <div class="energy-bar" :style="{ width: energyPercent + '%' }"></div>
        <span class="energy-text">{{ energy }} / {{ maxEnergy }}</span>
      </div>
      
      <div class="action-buttons">
        <button 
          class="btn-charge" 
          @click="startCharging"
          :disabled="isCharging || canPurify"
        >
          {{ isCharging ? '充能中...' : '点击充能' }}
        </button>
        <button 
          class="btn-purify" 
          @click="executePurify"
          :disabled="!canPurify"
          :class="{ active: canPurify }"
        >
          净化节点
        </button>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="instructions">
      <p>🌟 点击"充能"收集能量</p>
      <p>⚡ 能量满后点击"净化节点"点亮城市</p>
      <p>🔗 当节点完全点亮，能量将接力至下一个节点</p>
    </div>
  </div>
</template>

<style scoped>
.hud-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 10;
  font-family: 'Courier New', monospace;
  color: #00ff88;
}

.hud-overlay > * {
  pointer-events: auto;
}

/* 顶部信息栏 */
.top-bar {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 30px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 15px 30px;
  border-radius: 10px;
  border: 1px solid rgba(0, 255, 136, 0.3);
}

.info-block {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.label {
  font-size: 12px;
  opacity: 0.7;
  margin-bottom: 5px;
}

.value {
  font-size: 20px;
  font-weight: bold;
  text-shadow: 0 0 10px currentColor;
}

/* 能量收集器 */
.energy-collector {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  padding: 20px 40px;
  border-radius: 15px;
  border: 2px solid rgba(0, 255, 136, 0.5);
  min-width: 400px;
}

.energy-title {
  text-align: center;
  font-size: 18px;
  margin-bottom: 15px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.energy-bar-container {
  position: relative;
  width: 100%;
  height: 30px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 15px;
  overflow: hidden;
  margin-bottom: 20px;
  border: 1px solid rgba(0, 255, 136, 0.3);
}

.energy-bar {
  height: 100%;
  background: linear-gradient(90deg, #00ff88, #00ffff);
  transition: width 0.1s ease;
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.8);
}

.energy-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
  font-weight: bold;
  text-shadow: 0 0 5px black;
  color: white;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}

button {
  padding: 12px 30px;
  font-size: 16px;
  font-family: inherit;
  border: 2px solid #00ff88;
  background: rgba(0, 0, 0, 0.5);
  color: #00ff88;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  letter-spacing: 1px;
}

button:hover:not(:disabled) {
  background: rgba(0, 255, 136, 0.2);
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
  transform: translateY(-2px);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-purify.active {
  background: linear-gradient(135deg, #00ff88, #00ffff);
  color: black;
  font-weight: bold;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(0, 255, 136, 0.8);
  }
  50% {
    box-shadow: 0 0 40px rgba(0, 255, 255, 1);
  }
}

/* 使用说明 */
.instructions {
  position: absolute;
  top: 340px;
  right: 30px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  padding: 15px 20px;
  border-radius: 10px;
  border: 1px solid rgba(0, 255, 136, 0.3);
  font-size: 14px;
  line-height: 1.8;
}

.instructions p {
  margin: 5px 0;
}
</style>
