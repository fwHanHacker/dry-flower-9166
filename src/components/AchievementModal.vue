<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ACHIEVEMENTS, AchievementManager, type Achievement } from '../utils/AchievementSystem';
import { UserManager } from '../utils/UserManager';
import { audioManager, SoundEffect } from '../utils/AudioManager';

defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const userData = ref<any>(null);
const unlockedAchievements = ref<Achievement[]>([]);
const progress = ref({ total: 0, unlocked: 0, percentage: 0 });

const loadAchievements = async () => {
  userData.value = await UserManager.getCurrentUser();
  unlockedAchievements.value = AchievementManager.getUnlockedAchievements(userData.value);
  progress.value = AchievementManager.getProgress(userData.value);
};

const isUnlocked = (achievementId: string): boolean => {
  return userData.value?.achievements?.includes(achievementId) || false;
};

const close = () => {
  audioManager.play(SoundEffect.BUTTON_CLICK);
  emit('close');
};

onMounted(() => {
  loadAchievements();
});
</script>

<template>
  <div v-if="visible" class="achievement-modal" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2>🏆 成就系统</h2>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <div class="progress-bar-container">
        <div class="progress-label">
          完成度: {{ progress.unlocked }} / {{ progress.total }} ({{ progress.percentage }}%)
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress.percentage + '%' }"></div>
        </div>
      </div>

      <div class="achievements-grid">
        <div
          v-for="achievement in ACHIEVEMENTS"
          :key="achievement.id"
          class="achievement-card"
          :class="{ unlocked: isUnlocked(achievement.id) }"
        >
          <div class="achievement-icon">{{ achievement.icon }}</div>
          <div class="achievement-info">
            <h3>{{ achievement.name }}</h3>
            <p>{{ achievement.description }}</p>
            <div class="achievement-reward" v-if="achievement.reward">
              ⚡ +{{ achievement.reward }} 能量
            </div>
          </div>
          <div class="achievement-status">
            {{ isUnlocked(achievement.id) ? '✓ 已解锁' : '🔒 未解锁' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.achievement-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid rgba(0, 255, 136, 0.5);
  border-radius: 20px;
  padding: 30px;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  color: #00ff88;
  font-family: 'Courier New', monospace;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h2 {
  margin: 0;
  font-size: 28px;
  text-shadow: 0 0 10px currentColor;
}

.close-btn {
  background: none;
  border: 2px solid #00ff88;
  color: #00ff88;
  font-size: 24px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(0, 255, 136, 0.2);
  transform: rotate(90deg);
}

.progress-bar-container {
  margin-bottom: 30px;
}

.progress-label {
  font-size: 14px;
  margin-bottom: 10px;
  text-align: center;
}

.progress-bar {
  height: 20px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(0, 255, 136, 0.3);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ff88, #00ffff);
  transition: width 0.5s ease;
  box-shadow: 0 0 20px rgba(0, 255, 136, 0.8);
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 15px;
}

.achievement-card {
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 15px;
  display: flex;
  gap: 15px;
  transition: all 0.3s;
  opacity: 0.6;
}

.achievement-card.unlocked {
  border-color: rgba(0, 255, 136, 0.8);
  opacity: 1;
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
}

.achievement-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(0, 255, 136, 0.4);
}

.achievement-icon {
  font-size: 48px;
  filter: grayscale(100%);
}

.achievement-card.unlocked .achievement-icon {
  filter: grayscale(0%);
  animation: pulse 2s infinite;
}

.achievement-info {
  flex: 1;
}

.achievement-info h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
  color: #fff;
}

.achievement-info p {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #aaa;
}

.achievement-reward {
  font-size: 12px;
  color: #ffaa00;
}

.achievement-status {
  font-size: 12px;
  align-self: center;
  white-space: nowrap;
}
</style>
