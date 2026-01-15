<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { audioManager, SoundEffect } from '../utils/AudioManager';
import { api } from '../api';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  nickname: string;
  totalEnergy: number;
  citiesPurified: number;
  country: string;
}

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const leaderboard = ref<LeaderboardEntry[]>([]);
const loading = ref(true);

const loadLeaderboard = async () => {
  try {
    loading.value = true;
    const data = await api.getLeaderboard();
    leaderboard.value = data.entries;
  } catch (error) {
    console.error('Failed to load leaderboard:', error);
  } finally {
    loading.value = false;
  }
};

const close = () => {
  audioManager.play(SoundEffect.BUTTON_CLICK);
  emit('close');
};

const getRankColor = (rank: number): string => {
  if (rank === 1) return '#FFD700';
  if (rank === 2) return '#C0C0C0';
  if (rank === 3) return '#CD7F32';
  return '#00ff88';
};

const getCountryFlag = (country: string): string => {
  const flags: Record<string, string> = {
    JP: '🇯🇵',
    CN: '🇨🇳',
    US: '🇺🇸',
    GB: '🇬🇧',
    FR: '🇫🇷',
    SG: '🇸🇬',
    AU: '🇦🇺',
    KR: '🇰🇷',
    IN: '🇮🇳',
  };
  return flags[country] || '🌍';
};

onMounted(() => {
  if (props.visible) {
    loadLeaderboard();
  }
});
</script>

<template>
  <div v-if="visible" class="leaderboard-modal" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2>🏅 全球排行榜</h2>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <div v-if="loading" class="loading">加载中...</div>

      <div v-else class="leaderboard-table">
        <div class="table-header">
          <div class="col-rank">排名</div>
          <div class="col-guardian">守护者</div>
          <div class="col-energy">能量</div>
          <div class="col-cities">城市</div>
        </div>

        <div
          v-for="entry in leaderboard"
          :key="entry.userId"
          class="table-row"
          :class="{ top3: entry.rank <= 3 }"
        >
          <div class="col-rank" :style="{ color: getRankColor(entry.rank) }">
            {{ entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}` }}
          </div>
          <div class="col-guardian">
            <span class="flag">{{ getCountryFlag(entry.country) }}</span>
            <span class="nickname">{{ entry.nickname }}</span>
          </div>
          <div class="col-energy">{{ entry.totalEnergy.toLocaleString() }}</div>
          <div class="col-cities">{{ entry.citiesPurified }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.leaderboard-modal {
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

.modal-content {
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid rgba(0, 255, 136, 0.5);
  border-radius: 20px;
  padding: 30px;
  max-width: 700px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  color: #00ff88;
  font-family: 'Courier New', monospace;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
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

.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
}

.leaderboard-table {
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 10px;
  overflow: hidden;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 80px 1fr 120px 80px;
  gap: 15px;
  padding: 15px;
  align-items: center;
}

.table-header {
  background: rgba(0, 255, 136, 0.2);
  font-weight: bold;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 1px;
}

.table-row {
  border-top: 1px solid rgba(0, 255, 136, 0.1);
  transition: all 0.3s;
}

.table-row:hover {
  background: rgba(0, 255, 136, 0.1);
  transform: translateX(5px);
}

.table-row.top3 {
  background: rgba(255, 215, 0, 0.1);
}

.col-rank {
  font-size: 20px;
  font-weight: bold;
  text-align: center;
}

.col-guardian {
  display: flex;
  align-items: center;
  gap: 10px;
}

.flag {
  font-size: 20px;
}

.nickname {
  font-size: 14px;
}

.col-energy,
.col-cities {
  text-align: center;
  font-size: 14px;
}

.col-energy {
  color: #ffaa00;
}

.col-cities {
  color: #00ffff;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
