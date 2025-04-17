/**
 * WebSocket service for real-time chat
 */
class WebSocketService {
    constructor() {
        this.chatSocket = null;
        this.statusSocket = null;
        this.chatCallbacks = [];
        this.statusCallbacks = [];
        this.reconnectTimeout = null;
        this.API_URL = 'ws://localhost:8000/api/ws';
        this.token = null;
    }

    /**
     * Set token for WebSocket authentication
     * @param {string} token - JWT token
     */
    setToken(token) {
        this.token = token;
    }

    /**
     * Connect to chat WebSocket
     * @param {number} chatId - Chat ID
     */
    connectToChat(chatId) {
        if (!this.token) {
            console.error('No token available for WebSocket connection');
            return;
        }

        if (this.chatSocket) {
            this.chatSocket.close();
        }

        const wsUrl = `${this.API_URL}/chat/${chatId}?token=${this.token}`;
        
        try {
            this.chatSocket = new WebSocket(wsUrl);
            
            this.chatSocket.onopen = () => {
                console.log(`Connected to chat ${chatId}`);
            };
            
            this.chatSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.chatCallbacks.forEach(callback => callback(data));
                } catch (error) {
                    console.error('Error parsing chat message:', error);
                }
            };
            
            this.chatSocket.onclose = () => {
                console.log(`Disconnected from chat ${chatId}`);
                
                // Attempt to reconnect after 3 seconds
                if (this.reconnectTimeout) {
                    clearTimeout(this.reconnectTimeout);
                }
                
                this.reconnectTimeout = setTimeout(() => {
                    this.connectToChat(chatId);
                }, 3000);
            };
            
            this.chatSocket.onerror = (error) => {
                console.error('Chat WebSocket error:', error);
            };
        } catch (error) {
            console.error('Failed to connect to chat WebSocket:', error);
        }
    }

    /**
     * Connect to status WebSocket
     */
    connectToStatus() {
        if (!this.token) {
            console.error('No token available for WebSocket connection');
            return;
        }

        if (this.statusSocket) {
            this.statusSocket.close();
        }

        const wsUrl = `${this.API_URL}/status?token=${this.token}`;
        
        try {
            this.statusSocket = new WebSocket(wsUrl);
            
            this.statusSocket.onopen = () => {
                console.log('Connected to status updates');
            };
            
            this.statusSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.statusCallbacks.forEach(callback => callback(data));
                } catch (error) {
                    console.error('Error parsing status message:', error);
                }
            };
            
            this.statusSocket.onclose = () => {
                console.log('Disconnected from status updates');
                
                // Attempt to reconnect after 3 seconds
                if (this.reconnectTimeout) {
                    clearTimeout(this.reconnectTimeout);
                }
                
                this.reconnectTimeout = setTimeout(() => {
                    this.connectToStatus();
                }, 3000);
            };
            
            this.statusSocket.onerror = (error) => {
                console.error('Status WebSocket error:', error);
            };
        } catch (error) {
            console.error('Failed to connect to status WebSocket:', error);
        }
    }

    /**
     * Send a chat message via WebSocket
     * @param {string} message - Message content
     */
    sendChatMessage(message) {
        if (this.chatSocket && this.chatSocket.readyState === WebSocket.OPEN) {
            this.chatSocket.send(message);
        } else {
            console.error('Chat connection not open');
        }
    }

    /**
     * Update user status via WebSocket
     * @param {string} status - User status (online, offline, away)
     */
    updateStatus(status) {
        if (this.statusSocket && this.statusSocket.readyState === WebSocket.OPEN) {
            this.statusSocket.send(JSON.stringify({ status }));
        } else {
            console.error('Status connection not open');
        }
    }

    /**
     * Add callback for chat messages
     * @param {Function} callback - Callback function
     * @returns {Function} - Function to remove the callback
     */
    onChatMessage(callback) {
        this.chatCallbacks.push(callback);
        return () => {
            this.chatCallbacks = this.chatCallbacks.filter(cb => cb !== callback);
        };
    }

    /**
     * Add callback for status updates
     * @param {Function} callback - Callback function
     * @returns {Function} - Function to remove the callback
     */
    onStatusUpdate(callback) {
        this.statusCallbacks.push(callback);
        return () => {
            this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
        };
    }

    /**
     * Disconnect all WebSocket connections
     */
    disconnect() {
        if (this.chatSocket) {
            this.chatSocket.close();
            this.chatSocket = null;
        }
        
        if (this.statusSocket) {
            this.statusSocket.close();
            this.statusSocket = null;
        }
        
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }
}

// Create singleton instance
const websocketService = new WebSocketService(); 