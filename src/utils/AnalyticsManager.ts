/**
 * 数据分析工具 - 用于追踪用户行为和性能指标
 */

export interface AnalyticsEvent {
    category: string;
    action: string;
    label?: string;
    value?: number;
    timestamp: number;
}

class AnalyticsManagerClass {
    private events: AnalyticsEvent[] = [];
    private sessionId: string = '';
    private sessionStartTime: number = 0;

    init() {
        this.sessionId = this.generateSessionId();
        this.sessionStartTime = Date.now();
        this.trackEvent('session', 'start');
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    trackEvent(category: string, action: string, label?: string, value?: number) {
        const event: AnalyticsEvent = {
            category,
            action,
            label,
            value,
            timestamp: Date.now(),
        };

        this.events.push(event);

        // In production, send to analytics service
        console.log('[Analytics]', event);

        // Keep only last 1000 events in memory
        if (this.events.length > 1000) {
            this.events.shift();
        }
    }

    // Convenience methods
    trackPurify(cityName: string, energy: number) {
        this.trackEvent('gameplay', 'purify', cityName, energy);
    }

    trackRelay(fromCity: string, toCity: string) {
        this.trackEvent('gameplay', 'relay', `${fromCity}->${toCity}`);
    }

    trackAchievement(achievementId: string) {
        this.trackEvent('achievement', 'unlock', achievementId);
    }

    trackPageView(pageName: string) {
        this.trackEvent('navigation', 'pageview', pageName);
    }

    trackError(errorMessage: string, errorStack?: string) {
        this.trackEvent('error', 'exception', errorMessage, errorStack ? 1 : 0);
    }

    getSessionDuration(): number {
        return Date.now() - this.sessionStartTime;
    }

    getEventCounts(): Record<string, number> {
        const counts: Record<string, number> = {};
        this.events.forEach(event => {
            const key = `${event.category}:${event.action}`;
            counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
    }

    exportData(): {
        sessionId: string;
        duration: number;
        events: AnalyticsEvent[];
        summary: Record<string, number>;
    } {
        return {
            sessionId: this.sessionId,
            duration: this.getSessionDuration(),
            events: this.events,
            summary: this.getEventCounts(),
        };
    }
}

export const AnalyticsManager = new AnalyticsManagerClass();
