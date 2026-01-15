<script setup lang="ts">
import { ref } from 'vue';
import { I18n, type Language } from '../utils/I18n';
import { audioManager, SoundEffect } from '../utils/AudioManager';

defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const currentLanguage = ref<Language>(I18n.getLanguage());
const soundEnabled = ref(!audioManager.isMuted());
const volume = ref(50);

const languages: Array<{ code: Language; name: string; flag: string }> = [
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
];

const changeLanguage = (lang: Language) => {
  currentLanguage.value = lang;
  I18n.setLanguage(lang);
  audioManager.play(SoundEffect.BUTTON_CLICK);
  // Reload to apply language changes
  setTimeout(() => window.location.reload(), 300);
};

const toggleSound = () => {
  soundEnabled.value = !soundEnabled.value;
  audioManager.setMuted(!soundEnabled.value);
  if (soundEnabled.value) {
    audioManager.play(SoundEffect.BUTTON_CLICK);
  }
};

const updateVolume = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  volume.value = parseInt(value);
  audioManager.setVolume(volume.value / 100);
};

const close = () => {
  audioManager.play(SoundEffect.BUTTON_CLICK);
  emit('close');
};
</script>

<template>
  <div v-if="visible" class="settings-modal" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2>⚙️ 设置</h2>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <!-- Language Settings -->
      <div class="settings-section">
        <h3>🌍 语言设置</h3>
        <div class="language-grid">
          <button
            v-for="lang in languages"
            :key="lang.code"
            class="language-btn"
            :class="{ active: currentLanguage === lang.code }"
            @click="changeLanguage(lang.code)"
          >
            <span class="flag">{{ lang.flag }}</span>
            <span class="name">{{ lang.name }}</span>
          </button>
        </div>
      </div>

      <!-- Audio Settings -->
      <div class="settings-section">
        <h3>🔊 音频设置</h3>
        <div class="audio-controls">
          <div class="control-row">
            <label>音效开关</label>
            <button class="toggle-btn" :class="{ active: soundEnabled }" @click="toggleSound">
              {{ soundEnabled ? 'ON' : 'OFF' }}
            </button>
          </div>
          <div class="control-row">
            <label>音量</label>
            <input
              type="range"
              min="0"
              max="100"
              :value="volume"
              @input="updateVolume"
              :disabled="!soundEnabled"
              class="volume-slider"
            />
            <span class="volume-value">{{ volume }}%</span>
          </div>
        </div>
      </div>

      <!-- About -->
      <div class="settings-section">
        <h3>ℹ️ 关于</h3>
        <div class="about-content">
          <p>星火燎原：边缘守护者 v1.0</p>
          <p>基于阿里云 ESA 边缘计算</p>
          <p>© 2025 Edge Guardians Team</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-modal {
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
  max-width: 500px;
  width: 90%;
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

.settings-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 255, 136, 0.2);
}

.settings-section:last-child {
  border-bottom: none;
}

.settings-section h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: #fff;
}

.language-grid {
  display: grid;
  gap: 10px;
}

.language-btn {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(0, 255, 136, 0.3);
  border-radius: 10px;
  color: #00ff88;
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.language-btn:hover {
  border-color: rgba(0, 255, 136, 0.6);
  transform: translateX(5px);
}

.language-btn.active {
  background: rgba(0, 255, 136, 0.2);
  border-color: #00ff88;
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.5);
}

.flag {
  font-size: 24px;
}

.audio-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.control-row label {
  font-size: 14px;
  color: #aaa;
}

.toggle-btn {
  padding: 8px 20px;
  background: rgba(255, 68, 68, 0.3);
  border: 2px solid #ff4444;
  border-radius: 8px;
  color: #ff4444;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 60px;
}

.toggle-btn.active {
  background: rgba(0, 255, 136, 0.3);
  border-color: #00ff88;
  color: #00ff88;
}

.volume-slider {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(0, 255, 136, 0.3);
  border-radius: 3px;
  outline: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #00ff88;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.8);
}

.volume-slider:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.volume-value {
  font-size: 14px;
  min-width: 45px;
  text-align: right;
}

.about-content {
  background: rgba(0, 0, 0, 0.5);
  padding: 15px;
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.8;
}

.about-content p {
  margin: 5px 0;
  color: #aaa;
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
