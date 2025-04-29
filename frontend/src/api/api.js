import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;
console.log("API_URL in api.js: " + API_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add the token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API functions
export const loginUser = (username, password) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  return api.post('/auth/login', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const refreshToken = () => api.post('/auth/refresh');

// User API functions
export const getUsers = (skip = 0, limit = 10) => 
  api.get(`/users/?skip=${skip}&limit=${limit}`);

export const getUserStatus = (userId) => 
  api.get(`/users/${userId}/status`);

export const updateUserStatus = (userId, status) => 
  api.put(`/users/${userId}/status`, { status });

// Chat API functions
export const getChats = (skip = 0, limit = 10) => 
  api.get(`/chats/?skip=${skip}&limit=${limit}`);

export const createChat = (chatData) => 
  api.post('/chats/', chatData);

export const getChatById = (chatId) => 
  api.get(`/chats/${chatId}`);

export const deleteChat = (chatId) => 
  api.delete(`/chats/${chatId}`);

export const addMembersToChat = (chatId, userIds) => 
  api.post(`/chats/${chatId}/members`, userIds);

// Message API functions
export const getMessages = (chatId, skip = 0, limit = 100) => 
  api.get(`/chats/${chatId}/messages/?skip=${skip}&limit=${limit}`);

export const sendMessage = (chatId, content) => 
  api.post(`/chats/${chatId}/messages/`, { content });

export const markMessagesAsRead = (chatId) => 
  api.put(`/chats/${chatId}/messages/read`);

export default api;