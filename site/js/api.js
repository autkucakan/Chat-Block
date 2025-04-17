/**
 * API service for communicating with the backend
 */
const API_URL = 'http://127.0.0.1:8000/api';

/**
 * Make a fetch request with authentication
 * @param {string} url - API endpoint 
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch promise
 */
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers,
    });
    
    // If unauthorized, clear token and redirect to login
    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/';
        return null;
    }
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'An error occurred');
    }
    
    if (response.status !== 204) { // No content
        return await response.json();
    }
    
    return null;
}

/**
 * Authentication API
 */
const authAPI = {
    /**
     * Register a new user
     * @param {Object} userData - User data (username, email, password)
     * @returns {Promise} - User data
     */
    register: async (userData) => {
        return await fetchWithAuth('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },
    
    /**
     * Login a user
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise} - Token data
     */
    login: async (username, password) => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Invalid credentials');
        }
        
        return await response.json();
    },
    
    /**
     * Get current user profile
     * @returns {Promise} - User data
     */
    me: async () => {
        return await fetchWithAuth('/auth/me');
    },
    
    /**
     * Refresh token
     * @returns {Promise} - New token
     */
    refresh: async () => {
        return await fetchWithAuth('/auth/refresh', {
            method: 'POST',
        });
    },
};

/**
 * Users API
 */
const usersAPI = {
    /**
     * Get list of users
     * @param {number} page - Page number
     * @param {number} limit - Number of users per page
     * @returns {Promise} - Users data
     */
    getUsers: async (page = 1, limit = 20) => {
        return await fetchWithAuth(`/users?page=${page}&limit=${limit}`);
    },
    
    /**
     * Get user by ID
     * @param {number} userId - User ID
     * @returns {Promise} - User data
     */
    getUserById: async (userId) => {
        return await fetchWithAuth(`/users/${userId}`);
    },
    
    /**
     * Update user status
     * @param {string} status - User status (online, offline, away)
     * @returns {Promise} - Updated user data
     */
    updateUserStatus: async (status) => {
        return await fetchWithAuth(`/users/me/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    },
};

/**
 * Chats API
 */
const chatsAPI = {
    /**
     * Get all chats
     * @returns {Promise} - Chats data
     */
    getChats: async () => {
        return await fetchWithAuth('/chats');
    },
    
    /**
     * Get chat by ID
     * @param {number} chatId - Chat ID
     * @returns {Promise} - Chat data
     */
    getChatById: async (chatId) => {
        return await fetchWithAuth(`/chats/${chatId}`);
    },
    
    /**
     * Create a new chat
     * @param {Object} chatData - Chat data (name, is_group_chat, user_ids)
     * @returns {Promise} - New chat data
     */
    createChat: async (chatData) => {
        return await fetchWithAuth('/chats', {
            method: 'POST',
            body: JSON.stringify(chatData),
        });
    },
    
    /**
     * Update chat
     * @param {number} chatId - Chat ID
     * @param {Object} chatData - Chat data (name)
     * @returns {Promise} - Updated chat data
     */
    updateChat: async (chatId, chatData) => {
        return await fetchWithAuth(`/chats/${chatId}`, {
            method: 'PUT',
            body: JSON.stringify(chatData),
        });
    },
    
    /**
     * Delete chat
     * @param {number} chatId - Chat ID
     * @returns {Promise} - Null
     */
    deleteChat: async (chatId) => {
        return await fetchWithAuth(`/chats/${chatId}`, {
            method: 'DELETE',
        });
    },
    
    /**
     * Add user to chat
     * @param {number} chatId - Chat ID
     * @param {number} userId - User ID
     * @returns {Promise} - Updated chat data
     */
    addUserToChat: async (chatId, userId) => {
        return await fetchWithAuth(`/chats/${chatId}/members`, {
            method: 'POST',
            body: JSON.stringify({ user_id: userId }),
        });
    },
    
    /**
     * Remove user from chat
     * @param {number} chatId - Chat ID
     * @param {number} userId - User ID
     * @returns {Promise} - Null
     */
    removeUserFromChat: async (chatId, userId) => {
        return await fetchWithAuth(`/chats/${chatId}/members/${userId}`, {
            method: 'DELETE',
        });
    },
};

/**
 * Messages API
 */
const messagesAPI = {
    /**
     * Get messages in a chat
     * @param {number} chatId - Chat ID
     * @param {number} page - Page number
     * @param {number} limit - Number of messages per page
     * @returns {Promise} - Messages data
     */
    getMessages: async (chatId, page = 1, limit = 50) => {
        return await fetchWithAuth(`/chats/${chatId}/messages?page=${page}&limit=${limit}`);
    },
    
    /**
     * Send a message
     * @param {number} chatId - Chat ID
     * @param {string} content - Message content
     * @returns {Promise} - New message data
     */
    sendMessage: async (chatId, content) => {
        return await fetchWithAuth(`/chats/${chatId}/messages`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    },
    
    /**
     * Update a message
     * @param {number} chatId - Chat ID
     * @param {number} messageId - Message ID
     * @param {string} content - New message content
     * @returns {Promise} - Updated message data
     */
    updateMessage: async (chatId, messageId, content) => {
        return await fetchWithAuth(`/chats/${chatId}/messages/${messageId}`, {
            method: 'PUT',
            body: JSON.stringify({ content }),
        });
    },
    
    /**
     * Delete a message
     * @param {number} chatId - Chat ID
     * @param {number} messageId - Message ID
     * @returns {Promise} - Null
     */
    deleteMessage: async (chatId, messageId) => {
        return await fetchWithAuth(`/chats/${chatId}/messages/${messageId}`, {
            method: 'DELETE',
        });
    },
    
    /**
     * Mark messages as read
     * @param {number} chatId - Chat ID
     * @returns {Promise} - Null
     */
    markAsRead: async (chatId) => {
        return await fetchWithAuth(`/chats/${chatId}/messages/read`, {
            method: 'PUT',
        });
    },
}; 