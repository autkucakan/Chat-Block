const WS_URL = import.meta.env.VITE_WS_URL;
console.log("WS_URL in websocket.js: " + WS_URL);

// Chat WebSocket instance
export class ChatWebSocket {
  constructor(chatId, onMessage) {
    this.chatId = chatId;
    this.onMessage = onMessage;
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    if (this.isConnected) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return;
    }

    this.socket = new WebSocket(`${WS_URL}/ws/chat/${this.chatId}?token=${token}`);
    
    this.socket.onopen = () => {
      console.log(`Connected to chat ${this.chatId}`);
      this.isConnected = true;
    };
    
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.onMessage) {
          this.onMessage(data);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
    
    this.socket.onclose = () => {
      console.log(`Disconnected from chat ${this.chatId}`);
      this.isConnected = false;
    };
    
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnected = false;
    };
  }

  sendMessage(message) {
    if (this.socket && this.isConnected) {
      this.socket.send(message);
    } else {
      console.error('WebSocket not connected');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.isConnected = false;
    }
  }
}

// Status WebSocket instance
export class StatusWebSocket {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    if (this.isConnected) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return;
    }

    this.socket = new WebSocket(`${WS_URL}/ws/status?token=${token}`);
    
    this.socket.onopen = () => {
      console.log('Connected to status websocket');
      this.isConnected = true;
    };
    
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Status WebSocket received:', data);
        
        // Handle different types of updates
        if (data.error) {
          console.error('Status WebSocket error:', data.error);
          return;
        }
        
        // Determine the type of update
        if (data.user_id && data.status) {
          // It's a user status update
          this.onUpdate({
            type: 'status',
            user_id: data.user_id,
            status: data.status,
            last_seen: data.last_seen
          });
        } else if (data.action && data.action.startsWith('chat.')) {
          // It's a chat update
          this.onUpdate({
            type: 'chat',
            action: data.action,
            chat: data.chat,
            chat_id: data.chat_id
          });
        } else {
          // Unknown update type, just pass it through
          this.onUpdate(data);
        }
      } catch (error) {
        console.error('Error parsing status message:', error);
      }
    };
    
    this.socket.onclose = () => {
      console.log('Disconnected from status websocket');
      this.isConnected = false;
    };
    
    this.socket.onerror = (error) => {
      console.error('Status WebSocket error:', error);
      this.isConnected = false;
    };
  }

  updateStatus(status) {
    if (this.socket && this.isConnected) {
      this.socket.send(JSON.stringify({ status }));
    } else {
      console.error('Status WebSocket not connected');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.isConnected = false;
    }
  }
}