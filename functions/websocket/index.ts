/**
 * ESA Edge Runtime WebSocket Handler
 * 用于实时数据同步
 */

export default {
    async fetch(request: Request, env: any) {
        const upgradeHeader = request.headers.get('Upgrade');

        if (!upgradeHeader || upgradeHeader !== 'websocket') {
            return new Response('Expected Upgrade: websocket', { status: 426 });
        }

        const [client, server] = Object.values(new WebSocketPair());

        // Handle WebSocket connection
        server.accept();

        server.addEventListener('message', async (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data as string);

                // Handle different message types
                switch (data.type) {
                    case 'subscribe':
                        // Subscribe to global events
                        server.send(JSON.stringify({
                            type: 'subscribed',
                            timestamp: Date.now(),
                        }));
                        break;

                    case 'purify_event':
                        // Broadcast purification event to all connected clients
                        // In production, you would use Durable Objects for this
                        server.send(JSON.stringify({
                            type: 'city_update',
                            data: data.data,
                            timestamp: Date.now(),
                        }));
                        break;

                    default:
                        server.send(JSON.stringify({
                            type: 'error',
                            message: 'Unknown message type',
                            timestamp: Date.now(),
                        }));
                }
            } catch (error) {
                console.error('WebSocket error:', error);
            }
        });

        server.addEventListener('close', () => {
            console.log('WebSocket closed');
        });

        return new Response(null, {
            status: 101,
            // @ts-ignore - ESA runtime supports webSocket property
            webSocket: client,
        });
    },
};

// WebSocket pair type definition for TypeScript
interface WebSocketPair {
    0: WebSocket;
    1: WebSocket;
}

declare const WebSocketPair: {
    new(): WebSocketPair;
};
