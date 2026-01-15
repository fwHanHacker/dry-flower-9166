/**
 * WebSocket 实时通信管理
 * 连接到 ESA Edge Runtime 的 WebSocket 端点
 */

export enum WSMessageType {
    CITY_UPDATE = 'city_update',
    PLAYER_JOIN = 'player_join',
    PLAYER_LEAVE = 'player_leave',
    PURIFY_EVENT = 'purify_event',
    RELAY_EVENT = 'relay_event',
    ACHIEVEMENT_UNLOCK = 'achievement_unlock',
}

export interface WSMessage {
    type: WSMessageType;
    data: any;
    timestamp: number;
}

class WebSocketManagerClass {
    private listeners: Map<WSMessageType, Array<(data: any) => void>> = new Map();
    private ws: WebSocket | null = null;
    private reconnectInterval: number | null = null;
    private connected: boolean = false;
    private wsUrl: string = '';

    connect(url?: string) {
        if (this.connected && this.ws) return;

        // Use production WebSocket URL or fallback to simulation
        this.wsUrl = url || this.getWebSocketUrl();

        if (!this.wsUrl) {
            console.warn('[WebSocket] No URL provided, using simulation mode');
            this.startSimulation();
            return this;
        }

        console.log('[WebSocket] Connecting to:', this.wsUrl);

        try {
            this.ws = new WebSocket(this.wsUrl);

            this.ws.onopen = () => {
                console.log('[WebSocket] Connected');
                this.connected = true;

                // Subscribe to global events
                this.send(WSMessageType.PLAYER_JOIN, {
                    timestamp: Date.now(),
                });
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.emit(message.type, message.data);
                } catch (error) {
                    console.error('[WebSocket] Message parse error:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('[WebSocket] Error:', error);
                this.startSimulation();
            };

            this.ws.onclose = () => {
                console.log('[WebSocket] Disconnected');
                this.connected = false;
                this.ws = null;

                // Auto-reconnect after 5 seconds
                this.reconnectInterval = window.setTimeout(() => {
                    this.connect(this.wsUrl);
                }, 5000);
            };
        } catch (error) {
            console.error('[WebSocket] Connection failed:', error);
            this.startSimulation();
        }

        return this;
    }

    private getWebSocketUrl(): string {
        // In production, this would be your ESA WebSocket endpoint
        // Example: wss://your-domain.com/ws
        const isProduction = window.location.hostname !== 'localhost';
        if (isProduction) {
            return `wss://${window.location.hostname}/ws`;
        }
        return ''; // Empty string triggers simulation mode
    }

    private startSimulation() {
        console.log('[WebSocket] Starting simulation mode');
        this.connected = true;

        // Simulate receiving real-time updates every 15 seconds
        this.reconnectInterval = window.setInterval(() => {
            this.simulateRandomEvent();
        }, 15000);
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
        }

        this.connected = false;
        console.log('[WebSocket] Disconnected');
    }

    on(type: WSMessageType, callback: (data: any) => void) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type)!.push(callback);

        return () => {
            const callbacks = this.listeners.get(type);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }

    private emit(type: WSMessageType, data: any) {
        const callbacks = this.listeners.get(type);
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }
    }

    private simulateRandomEvent() {
        const events = [
            {
                type: WSMessageType.PURIFY_EVENT,
                data: {
                    city: ['Tokyo', 'Shanghai', 'London', 'Paris'][Math.floor(Math.random() * 4)],
                    guardian: `Guardian-${Math.random().toString(36).substring(7)}`,
                },
            },
            {
                type: WSMessageType.CITY_UPDATE,
                data: {
                    city: ['Singapore', 'Sydney', 'Mumbai'][Math.floor(Math.random() * 3)],
                    brightness: Math.floor(Math.random() * 100),
                },
            },
        ];

        const event = events[Math.floor(Math.random() * events.length)];
        if (event) {
            this.emit(event.type, event.data);
        }
    }

    // Send message to WebSocket server
    send(type: WSMessageType, data: any) {
        const message = JSON.stringify({
            type,
            data,
            timestamp: Date.now()
        });

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message);
            console.log('[WebSocket] Sent:', type, data);
        } else {
            console.warn('[WebSocket] Not connected, cannot send:', type);
        }
    }

    isConnected(): boolean {
        return this.connected;
    }
}

export const WebSocketManager = new WebSocketManagerClass();
