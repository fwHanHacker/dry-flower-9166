<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { NotificationManager, type Notification, NotificationType } from '../utils/NotificationManager';

const notifications = ref<Notification[]>([]);

let unsubscribe: (() => void) | null = null;

const getNotificationIcon = (type: NotificationType): string => {
  switch (type) {
    case NotificationType.SUCCESS:
      return '✅';
    case NotificationType.WARNING:
      return '⚠️';
    case NotificationType.ERROR:
      return '❌';
    case NotificationType.ACHIEVEMENT:
      return '🏆';
    default:
      return 'ℹ️';
  }
};

const getNotificationColor = (type: NotificationType): string => {
  switch (type) {
    case NotificationType.SUCCESS:
      return '#00ff88';
    case NotificationType.WARNING:
      return '#ffaa00';
    case NotificationType.ERROR:
      return '#ff4444';
    case NotificationType.ACHIEVEMENT:
      return '#FFD700';
    default:
      return '#00ffff';
  }
};

const closeNotification = (id: string) => {
  NotificationManager.remove(id);
};

onMounted(() => {
  unsubscribe = NotificationManager.subscribe((notifs) => {
    notifications.value = notifs;
  });
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>

<template>
  <div class="notification-container">
    <transition-group name="notification">
      <div
        v-for="notif in notifications"
        :key="notif.id"
        class="notification"
        :style="{ borderLeftColor: getNotificationColor(notif.type) }"
      >
        <div class="notification-icon">
          {{ getNotificationIcon(notif.type) }}
        </div>
        <div class="notification-content">
          <div class="notification-title">{{ notif.title }}</div>
          <div class="notification-message">{{ notif.message }}</div>
        </div>
        <button class="notification-close" @click="closeNotification(notif.id)">
          ✕
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.notification-container {
  position: fixed;
  top: 100px;
  left: 30px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
}

.notification {
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 10px;
  border-left: 4px solid #00ff88;
  padding: 15px;
  display: flex;
  align-items: flex-start;
  gap: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
  font-family: 'Courier New', monospace;
  color: #fff;
}

.notification-icon {
  font-size: 24px;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
  color: #00ff88;
}

.notification-message {
  font-size: 12px;
  color: #aaa;
}

.notification-close {
  background: none;
  border: none;
  color: #aaa;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.notification-close:hover {
  color: #fff;
  transform: rotate(90deg);
}

/* Transition animations */
.notification-enter-active {
  animation: slideIn 0.3s ease;
}

.notification-leave-active {
  animation: slideOut 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
}
</style>
