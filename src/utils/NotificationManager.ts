/**
 * 实时通知系统
 */

export enum NotificationType {
    INFO = 'info',
    SUCCESS = 'success',
    WARNING = 'warning',
    ERROR = 'error',
    ACHIEVEMENT = 'achievement',
}

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    duration: number;
    timestamp: number;
}

class NotificationManagerClass {
    private notifications: Notification[] = [];
    private listeners: Array<(notifications: Notification[]) => void> = [];

    subscribe(callback: (notifications: Notification[]) => void) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }

    private notify() {
        this.listeners.forEach(callback => callback([...this.notifications]));
    }

    show(
        type: NotificationType,
        title: string,
        message: string,
        duration: number = 5000
    ): string {
        const notification: Notification = {
            id: `notif_${Date.now()}_${Math.random()}`,
            type,
            title,
            message,
            duration,
            timestamp: Date.now(),
        };

        this.notifications.push(notification);
        this.notify();

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification.id);
            }, duration);
        }

        return notification.id;
    }

    remove(id: string) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.notify();
    }

    clear() {
        this.notifications = [];
        this.notify();
    }

    // Convenience methods
    info(title: string, message: string, duration?: number) {
        return this.show(NotificationType.INFO, title, message, duration);
    }

    success(title: string, message: string, duration?: number) {
        return this.show(NotificationType.SUCCESS, title, message, duration);
    }

    warning(title: string, message: string, duration?: number) {
        return this.show(NotificationType.WARNING, title, message, duration);
    }

    error(title: string, message: string, duration?: number) {
        return this.show(NotificationType.ERROR, title, message, duration);
    }

    achievement(title: string, message: string, duration?: number) {
        return this.show(NotificationType.ACHIEVEMENT, title, message, duration);
    }
}

export const NotificationManager = new NotificationManagerClass();
