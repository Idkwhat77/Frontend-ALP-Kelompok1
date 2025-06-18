// filepath: d:\Git Pak Okta stuff\Frontend-ALP-Kelompok1\js\websocket-manager.js
class WebSocketManager {
    constructor() {
        this.stompClient = null;
        this.isConnected = false;
        this.currentUserId = null;
        this.messageHandlers = [];
        this.typingHandlers = [];
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 5;
    }

    connect(userId) {
        if (this.connectionAttempts >= this.maxConnectionAttempts) {
            console.error('Max WebSocket connection attempts reached');
            return;
        }

        this.currentUserId = userId;
        this.connectionAttempts++;
        
        console.log(`WebSocket connection attempt ${this.connectionAttempts} for user ${userId}`);
        
        try {
            // Include userId in the connection URL
            const wsUrl = `http://localhost:8080/ws?userId=${userId}`;
            console.log('Connecting to WebSocket URL:', wsUrl);
            
            const socket = new SockJS(wsUrl);
            this.stompClient = new StompJs.Client({
                webSocketFactory: () => socket,
                debug: (str) => console.log('STOMP Debug: ' + str),
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
            });

            this.stompClient.onConnect = (frame) => {
                console.log('✅ Connected to WebSocket: ' + frame);
                this.isConnected = true;
                this.connectionAttempts = 0;
                this.subscribeToMessages();
            };

            this.stompClient.onWebSocketError = (error) => {
                console.error('❌ WebSocket error: ', error);
                this.isConnected = false;
            };

            this.stompClient.onStompError = (frame) => {
                console.error('❌ STOMP error: ' + frame.headers['message']);
                console.error('STOMP error details:', frame);
                this.isConnected = false;
            };

            this.stompClient.onDisconnect = () => {
                console.log('🔌 Disconnected from WebSocket');
                this.isConnected = false;
                
                if (this.connectionAttempts < this.maxConnectionAttempts) {
                    setTimeout(() => {
                        console.log('🔄 Attempting to reconnect...');
                        this.connect(userId);
                    }, 3000);
                }
            };

            this.stompClient.activate();
        } catch (error) {
            console.error('❌ Failed to create WebSocket connection:', error);
            this.isConnected = false;
        }
    }

    subscribeToMessages() {
        if (!this.stompClient || !this.isConnected) {
            console.warn('⚠️ Cannot subscribe: WebSocket not connected');
            return;
        }

        try {
            console.log(`📡 Subscribing to messages for user ${this.currentUserId}`);
            
            // Subscribe to private messages using the user's session principal
            this.stompClient.subscribe(`/user/queue/messages`, (message) => {
                console.log('📨 Received message:', message.body);
                const chatMessage = JSON.parse(message.body);
                this.notifyMessageHandlers(chatMessage);
            });

            // Subscribe to typing indicators
            this.stompClient.subscribe(`/user/queue/typing`, (message) => {
                console.log('⌨️ Received typing indicator:', message.body);
                const typingMessage = JSON.parse(message.body);
                this.notifyTypingHandlers(typingMessage);
            });
            
            console.log('✅ Successfully subscribed to WebSocket channels');
        } catch (error) {
            console.error('❌ Failed to subscribe to WebSocket channels:', error);
        }
    }

    sendTyping(receiverId, senderName) {
        if (!this.isConnected) {
            console.warn('⚠️ Cannot send typing indicator: WebSocket not connected');
            return;
        }
        
        try {
            console.log(`⌨️ Sending typing indicator from ${this.currentUserId} to ${receiverId}`);
            this.stompClient.publish({
                destination: '/app/chat.typing',
                body: JSON.stringify({
                    senderId: this.currentUserId,
                    senderName: senderName,
                    receiverId: receiverId,
                    type: 'typing'
                })
            });
        } catch (error) {
            console.error('❌ Failed to send typing indicator:', error);
        }
    }

    sendStopTyping(receiverId, senderName) {
        if (!this.isConnected) {
            console.warn('⚠️ Cannot send stop typing indicator: WebSocket not connected');
            return;
        }
        
        try {
            console.log(`⌨️ Sending stop typing indicator from ${this.currentUserId} to ${receiverId}`);
            this.stompClient.publish({
                destination: '/app/chat.stopTyping',
                body: JSON.stringify({
                    senderId: this.currentUserId,
                    senderName: senderName,
                    receiverId: receiverId,
                    type: 'stopTyping'
                })
            });
        } catch (error) {
            console.error('❌ Failed to send stop typing indicator:', error);
        }
    }

    addMessageHandler(handler) {
        this.messageHandlers.push(handler);
    }

    addTypingHandler(handler) {
        this.typingHandlers.push(handler);
    }

    notifyMessageHandlers(message) {
        this.messageHandlers.forEach(handler => handler(message));
    }

    notifyTypingHandlers(typingMessage) {
        this.typingHandlers.forEach(handler => handler(typingMessage));
    }

    disconnect() {
        if (this.stompClient) {
            this.stompClient.deactivate();
        }
    }
}

// Create global instance
window.webSocketManager = new WebSocketManager();