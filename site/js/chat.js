/**
 * Chat functionality
 */
class ChatService {
    constructor() {
        this.chats = [];
        this.selectedChat = null;
        this.messages = [];
        this.users = [];
        this.userStatus = {};
    }

    /**
     * Initialize chat service
     */
    async init() {
        try {
            await this.loadChats();
            await this.loadUsers();
            
            // Connect to status WebSocket
            if (authService.token) {
                websocketService.setToken(authService.token);
                websocketService.connectToStatus();
                websocketService.onStatusUpdate(this.handleStatusUpdate.bind(this));
            }
        } catch (error) {
            console.error('Failed to initialize chat service:', error);
        }
    }

    /**
     * Load user chats
     */
    async loadChats() {
        try {
            document.getElementById('chats-loading').classList.remove('hidden');
            const chats = await chatsAPI.getChats();
            this.chats = chats;
            this.renderChatList();
        } catch (error) {
            console.error('Failed to load chats:', error);
            this.showError('Failed to load chats. Please try again later.');
        } finally {
            document.getElementById('chats-loading').classList.add('hidden');
        }
    }

    /**
     * Load users
     */
    async loadUsers() {
        try {
            const users = await usersAPI.getUsers();
            this.users = users;
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }

    /**
     * Render chat list
     */
    renderChatList() {
        const chatList = document.getElementById('chat-list');
        const loadingElement = document.getElementById('chats-loading');
        
        // Clear previous chat items
        Array.from(chatList.children)
            .filter(child => child !== loadingElement)
            .forEach(child => child.remove());
        
        if (this.chats.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = 'No chats yet. Create a new chat to start messaging!';
            chatList.appendChild(emptyMessage);
            return;
        }
        
        this.chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = 'chat-item';
            chatItem.dataset.chatId = chat.id;
            
            if (this.selectedChat && this.selectedChat.id === chat.id) {
                chatItem.classList.add('active');
            }
            
            // Create avatar with first letter of chat name
            const chatAvatar = document.createElement('div');
            chatAvatar.className = 'chat-avatar';
            chatAvatar.textContent = chat.name ? chat.name.charAt(0).toUpperCase() : '?';
            
            // Create chat info
            const chatInfo = document.createElement('div');
            chatInfo.className = 'chat-info';
            
            const chatName = document.createElement('div');
            chatName.className = 'chat-name';
            chatName.textContent = chat.name;
            
            const chatPreview = document.createElement('div');
            chatPreview.className = 'chat-preview';
            
            if (chat.is_group_chat) {
                chatPreview.textContent = `${chat.users.length} members`;
            } else {
                // For direct messages, show the other user's name
                const otherUser = chat.users.find(user => user.id !== authService.currentUser.id);
                chatPreview.textContent = otherUser ? `@${otherUser.username}` : 'Unknown user';
            }
            
            chatInfo.appendChild(chatName);
            chatInfo.appendChild(chatPreview);
            
            // Add elements to chat item
            chatItem.appendChild(chatAvatar);
            chatItem.appendChild(chatInfo);
            
            // Add click event
            chatItem.addEventListener('click', () => {
                this.selectChat(chat);
            });
            
            chatList.appendChild(chatItem);
        });
    }

    /**
     * Select a chat
     * @param {Object} chat - Chat object
     */
    async selectChat(chat) {
        this.selectedChat = chat;
        
        // Update UI
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
            if (parseInt(item.dataset.chatId) === chat.id) {
                item.classList.add('active');
            }
        });
        
        // Show chat screen and hide welcome screen
        document.getElementById('welcome-screen').classList.add('hidden');
        document.getElementById('chat-screen').classList.remove('hidden');
        
        // Update chat header
        this.updateChatHeader();
        
        // Load messages
        await this.loadMessages();
        
        // Connect to WebSocket for this chat
        if (authService.token) {
            websocketService.connectToChat(chat.id);
            websocketService.onChatMessage(this.handleNewMessage.bind(this));
        }
        
        // Mark messages as read
        await messagesAPI.markAsRead(chat.id);
    }

    /**
     * Update chat header
     */
    updateChatHeader() {
        const chatHeader = document.getElementById('chat-header');
        
        chatHeader.innerHTML = '';
        
        if (!this.selectedChat) {
            return;
        }
        
        const chatTitle = document.createElement('span');
        chatTitle.className = 'chat-title';
        chatTitle.textContent = this.selectedChat.name;
        
        const chatParticipants = document.createElement('span');
        chatParticipants.className = 'chat-participants';
        
        if (this.selectedChat.is_group_chat) {
            chatParticipants.textContent = `${this.selectedChat.users.length} participants`;
        } else {
            const otherUser = this.selectedChat.users.find(user => user.id !== authService.currentUser.id);
            if (otherUser) {
                // Show online status if available
                const status = this.userStatus[otherUser.id] || otherUser.status;
                chatParticipants.textContent = `${status}`;
            }
        }
        
        chatHeader.appendChild(chatTitle);
        chatHeader.appendChild(chatParticipants);
    }

    /**
     * Load messages for selected chat
     */
    async loadMessages() {
        if (!this.selectedChat) {
            return;
        }
        
        try {
            document.getElementById('messages-loading').classList.remove('hidden');
            const messages = await messagesAPI.getMessages(this.selectedChat.id);
            this.messages = messages;
            this.renderMessages();
        } catch (error) {
            console.error('Failed to load messages:', error);
            this.showError('Failed to load messages. Please try again later.');
        } finally {
            document.getElementById('messages-loading').classList.add('hidden');
        }
    }

    /**
     * Render messages
     */
    renderMessages() {
        const messagesContainer = document.getElementById('messages');
        messagesContainer.innerHTML = '';
        
        if (this.messages.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-message';
            emptyMessage.textContent = 'No messages yet. Send a message to start the conversation!';
            messagesContainer.appendChild(emptyMessage);
            return;
        }
        
        this.messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            messageElement.dataset.messageId = message.id;
            
            // Determine if message is sent by current user
            const isCurrentUser = message.user_id === authService.currentUser.id;
            messageElement.classList.add(isCurrentUser ? 'message-sent' : 'message-received');
            
            // Create message content
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            messageContent.textContent = message.content;
            
            // Create message info
            const messageInfo = document.createElement('div');
            messageInfo.className = 'message-info';
            
            if (!isCurrentUser) {
                const messageSender = document.createElement('span');
                messageSender.className = 'message-sender';
                messageSender.textContent = message.user.username;
                messageInfo.appendChild(messageSender);
            }
            
            const messageTime = document.createElement('span');
            messageTime.className = 'message-time';
            messageTime.textContent = this.formatDate(message.created_at);
            messageInfo.appendChild(messageTime);
            
            // Add elements to message
            messageElement.appendChild(messageContent);
            messageElement.appendChild(messageInfo);
            
            messagesContainer.appendChild(messageElement);
        });
        
        // Scroll to bottom
        const messagesContainerElement = document.getElementById('messages-container');
        messagesContainerElement.scrollTop = messagesContainerElement.scrollHeight;
    }

    /**
     * Send a message
     * @param {string} content - Message content
     */
    async sendMessage(content) {
        if (!this.selectedChat || !content.trim()) {
            return;
        }
        
        try {
            // Use WebSocket to send message
            websocketService.sendChatMessage(content);
            
            // Clear input
            document.getElementById('message-text').value = '';
        } catch (error) {
            console.error('Failed to send message:', error);
            this.showError('Failed to send message. Please try again.');
        }
    }

    /**
     * Create a new chat
     * @param {string} name - Chat name
     * @param {boolean} isGroupChat - Whether it's a group chat
     * @param {Array<number>} userIds - User IDs to add to the chat
     */
    async createChat(name, isGroupChat, userIds) {
        try {
            const chatData = {
                name,
                is_group_chat: isGroupChat,
                user_ids: userIds,
            };
            
            const newChat = await chatsAPI.createChat(chatData);
            
            // Add new chat to list and refresh UI
            this.chats.push(newChat);
            this.renderChatList();
            
            // Select the new chat
            this.selectChat(newChat);
            
            // Close modal
            document.getElementById('create-chat-modal').remove();
        } catch (error) {
            console.error('Failed to create chat:', error);
            const errorElement = document.getElementById('create-chat-error');
            if (errorElement) {
                errorElement.textContent = error.message || 'Failed to create chat. Please try again.';
            }
        }
    }

    /**
     * Handle new message from WebSocket
     * @param {Object} message - Message data
     */
    handleNewMessage(message) {
        // Only add the message if it's for the current chat
        if (this.selectedChat && message.chat_id === this.selectedChat.id) {
            // Fetch the message with user info
            messagesAPI.getMessages(this.selectedChat.id)
                .then(messages => {
                    // Find the new message
                    const newMessage = messages.find(m => m.id === message.id);
                    if (newMessage) {
                        this.messages.push(newMessage);
                        this.renderMessages();
                    }
                })
                .catch(error => {
                    console.error('Failed to fetch message details:', error);
                });
        }
    }

    /**
     * Handle status update from WebSocket
     * @param {Object} statusData - Status data
     */
    handleStatusUpdate(statusData) {
        // Update user status
        this.userStatus[statusData.user_id] = statusData.status;
        
        // Update chat header if needed
        if (this.selectedChat && !this.selectedChat.is_group_chat) {
            const otherUser = this.selectedChat.users.find(user => user.id !== authService.currentUser.id);
            if (otherUser && otherUser.id === statusData.user_id) {
                this.updateChatHeader();
            }
        }
    }

    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @returns {string} - Formatted date
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        // Show error in appropriate container
        const container = this.selectedChat 
            ? document.getElementById('messages') 
            : document.getElementById('chat-list');
        
        container.appendChild(errorElement);
        
        // Remove after 5 seconds
        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    }
}

// Create singleton instance
const chatService = new ChatService();

// Handle chat UI
document.addEventListener('DOMContentLoaded', () => {
    // Send message form submission
    const messageForm = document.getElementById('message-form');
    if (messageForm) {
        messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const messageText = document.getElementById('message-text').value;
            if (messageText.trim()) {
                chatService.sendMessage(messageText);
            }
        });
    }
    
    // Create chat button
    const createChatBtn = document.getElementById('create-chat-btn');
    if (createChatBtn) {
        createChatBtn.addEventListener('click', () => {
            showCreateChatModal();
        });
    }
});

/**
 * Show create chat modal
 */
function showCreateChatModal() {
    const modalTemplate = document.getElementById('create-chat-template');
    const modalContent = modalTemplate.content.cloneNode(true);
    document.body.appendChild(modalContent);
    
    // Load users for selection
    loadUsersForSelection();
    
    // Close modal button
    const closeBtn = document.getElementById('close-modal-btn');
    closeBtn.addEventListener('click', () => {
        document.getElementById('create-chat-modal').remove();
    });
    
    // Create chat form submission
    const createChatForm = document.getElementById('create-chat-form');
    createChatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const chatName = document.getElementById('chat-name').value;
        const isGroupChat = document.getElementById('chat-type').value === 'true';
        
        // Get selected users
        const selectedUsers = Array.from(document.querySelectorAll('.user-item.selected'))
            .map(item => parseInt(item.dataset.userId));
        
        // Add current user to the list if not already included
        if (!selectedUsers.includes(authService.currentUser.id)) {
            selectedUsers.push(authService.currentUser.id);
        }
        
        // Validate selection
        if (selectedUsers.length < 2) {
            document.getElementById('create-chat-error').textContent = 'Please select at least one user to chat with.';
            return;
        }
        
        chatService.createChat(chatName, isGroupChat, selectedUsers);
    });
}

/**
 * Load users for selection in create chat modal
 */
async function loadUsersForSelection() {
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    
    try {
        const users = await usersAPI.getUsers();
        
        usersList.innerHTML = '';
        
        users.forEach(user => {
            // Skip current user
            if (user.id === authService.currentUser.id) {
                return;
            }
            
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.dataset.userId = user.id;
            
            const userCheckbox = document.createElement('input');
            userCheckbox.type = 'checkbox';
            userCheckbox.className = 'user-checkbox';
            userCheckbox.id = `user-${user.id}`;
            
            const userLabel = document.createElement('label');
            userLabel.htmlFor = `user-${user.id}`;
            userLabel.textContent = user.username;
            
            userItem.appendChild(userCheckbox);
            userItem.appendChild(userLabel);
            
            // Toggle selection on click
            userItem.addEventListener('click', () => {
                userItem.classList.toggle('selected');
                userCheckbox.checked = userItem.classList.contains('selected');
            });
            
            usersList.appendChild(userItem);
        });
    } catch (error) {
        console.error('Failed to load users:', error);
        usersList.innerHTML = '<div class="error-message">Failed to load users. Please try again.</div>';
    }
} 