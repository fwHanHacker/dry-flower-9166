<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import EarthCanvas from './components/EarthCanvas.vue';
import HUD from './components/HUD.vue';
import AchievementModal from './components/AchievementModal.vue';
import LeaderboardModal from './components/LeaderboardModal.vue';
import SettingsModal from './components/SettingsModal.vue';
import PerformancePanel from './components/PerformancePanel.vue';
import StatsPanel from './components/StatsPanel.vue';
import NotificationContainer from './components/NotificationContainer.vue';
import { api } from './api';
import { UserManager } from './utils/UserManager';
import { AchievementManager } from './utils/AchievementSystem';
import { NotificationManager } from './utils/NotificationManager';
import { AnalyticsManager } from './utils/AnalyticsManager';
import { WebSocketManager, WSMessageType } from './utils/WebSocketManager';
import { audioManager, SoundEffect } from './utils/AudioManager';

const earthRef = ref<InstanceType<typeof EarthCanvas> | null>(null);
const showAchievements = ref(false);
const showLeaderboard = ref(false);
const showSettings = ref(false);

const currentCity = computed(() => earthRef.value?.userCity?.name || 'Loading...');
const brightness = computed(() => earthRef.value?.userCity?.brightness || 0);
const totalBrightness = computed(() => {
  const cities = earthRef.value?.cities || [];
  if (cities.length === 0) return 0;
  return Math.round(cities.reduce((sum, c) => sum + c.brightness, 0) / cities.length);
});

// 处理净化请求
const handlePurify = async () => {
  if (!earthRef.value?.userCity) return;
  
  try {
    const userData = await UserManager.getCurrentUser();
    const result = await api.purify(earthRef.value.userCity.name, 20, userData.id, userData.nickname);
    
    // 播放音效
    audioManager.play(SoundEffect.PURIFY);
    
    // 更新用户数据
    UserManager.addEnergy(20);
    UserManager.addPurifiedCity(earthRef.value.userCity.name);
    
    // 追踪分析
    AnalyticsManager.trackPurify(earthRef.value.userCity.name, 20);
    
    // 显示通知
    NotificationManager.success('净化成功', result.message);
    
    // 检查成就
    const newAchievements = AchievementManager.checkAchievements(userData);
    newAchievements.forEach(achievement => {
      UserManager.addAchievement(achievement.id);
      NotificationManager.achievement('解锁成就', `${achievement.icon} ${achievement.name}`);
      AnalyticsManager.trackAchievement(achievement.id);
      audioManager.play(SoundEffect.ACHIEVEMENT);
    });
    
    // 刷新状态
    await earthRef.value.loadStatus();
    
    // 如果有 relayTarget，渲染光束动画
    if (result.relayTarget && earthRef.value.userCity) {
      earthRef.value.showRelayBeam(
        earthRef.value.userCity.lat,
        earthRef.value.userCity.lng,
        result.relayTarget.lat,
        result.relayTarget.lng
      );
      
      audioManager.play(SoundEffect.RELAY);
      NotificationManager.info(
        '能量接力',
        `光束飞向 ${result.relayTarget.name}！`
      );
      AnalyticsManager.trackRelay(
        earthRef.value.userCity.name,
        result.relayTarget.name
      );
    }
  } catch (error) {
    console.error('Purify failed:', error);
    NotificationManager.error('净化失败', '请稍后重试');
  }
};

onMounted(async () => {
  // 初始化分析
  AnalyticsManager.init();
  AnalyticsManager.trackPageView('main');
  
  // 连接 WebSocket
  WebSocketManager.connect();
  
  // 监听实时事件
  WebSocketManager.on(WSMessageType.PURIFY_EVENT, (data) => {
    NotificationManager.info(
      '全球活动',
      `${data.guardian} 净化了 ${data.city}`
    );
  });
  
  WebSocketManager.on(WSMessageType.CITY_UPDATE, (data) => {
    console.log('City update:', data);
  });
  
  // 显示欢迎消息
  const userData = await UserManager.getCurrentUser();
  NotificationManager.success(
    '欢迎回来',
    `${userData.nickname}，继续你的守护之旅吧！`,
    3000
  );
});

// 键盘快捷键
const handleKeyPress = (e: KeyboardEvent) => {
  if (e.key === 'a' || e.key === 'A') {
    showAchievements.value = !showAchievements.value;
  } else if (e.key === 'l' || e.key === 'L') {
    showLeaderboard.value = !showLeaderboard.value;
  } else if (e.key === 's' || e.key === 'S') {
    showSettings.value = !showSettings.value;
  }
};

onMounted(() => {
  window.addEventListener('keypress', handleKeyPress);
});
</script>

<template>
  <div class="app-container">
    <EarthCanvas ref="earthRef" />
    
    <HUD 
      :currentCity="currentCity"
      :brightness="brightness"
      :totalBrightness="totalBrightness"
      @purify="handlePurify"
    />
    
    <PerformancePanel />
    <StatsPanel />
    <NotificationContainer />
    
    <!-- 底部菜单栏 -->
    <div class="bottom-menu">
      <button class="menu-btn" @click="showAchievements = true">
        🏆 成就 <span class="hotkey">(A)</span>
      </button>
      <button class="menu-btn" @click="showLeaderboard = true">
        🏅 排行榜 <span class="hotkey">(L)</span>
      </button>
      <button class="menu-btn" @click="showSettings = true">
        ⚙️ 设置 <span class="hotkey">(S)</span>
      </button>
    </div>
    
    <!-- 模态框 -->
    <AchievementModal :visible="showAchievements" @close="showAchievements = false" />
    <LeaderboardModal :visible="showLeaderboard" @close="showLeaderboard = false" />
    <SettingsModal :visible="showSettings" @close="showSettings = false" />
  </div>
</template>

<style>
.app-container {
  width: 100%;
  height: 100%;
}

.bottom-menu {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 15px;
  z-index: 100;
}

.menu-btn {
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(0, 255, 136, 0.5);
  border-radius: 10px;
  color: #00ff88;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.menu-btn:hover {
  background: rgba(0, 255, 136, 0.2);
  border-color: #00ff88;
  transform: translateY(-3px);
  box-shadow: 0 5px 20px rgba(0, 255, 136, 0.4);
}

.hotkey {
  font-size: 10px;
  opacity: 0.6;
  margin-left: 5px;
}
</style>
