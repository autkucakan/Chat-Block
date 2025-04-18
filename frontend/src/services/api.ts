import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - token ekleme
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const auth = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  refresh: () => api.post('/auth/refresh'),
  me: () => api.get('/auth/me'),
};

// Chat endpoints
export const chats = {
  getAll: (params?: { skip?: number; limit?: number }) =>
    api.get('/chats', { params }),
  getOne: (id: number) => api.get(`/chats/${id}`),
  create: (data: { name: string; user_ids: number[]; is_group_chat: boolean }) =>
    api.post('/chats', data),
  update: (id: number, data: { name: string; user_ids: number[]; is_group_chat: boolean }) =>
    api.put(`/chats/${id}`, data),
  delete: (id: number) => api.delete(`/chats/${id}`),
  addMembers: (id: number, user_ids: number[]) =>
    api.post(`/chats/${id}/members`, { user_ids }),
  removeMember: (chatId: number, userId: number) =>
    api.delete(`/chats/${chatId}/members/${userId}`),
};

// Message endpoints
export const messages = {
  getAll: (chatId: number, params?: { skip?: number; limit?: number }) =>
    api.get(`/chats/${chatId}/messages`, { params }),
  create: (chatId: number, content: string) =>
    api.post(`/chats/${chatId}/messages`, { content }),
  update: (chatId: number, messageId: number, content: string) =>
    api.put(`/chats/${chatId}/messages/${messageId}`, { content }),
  delete: (chatId: number, messageId: number) =>
    api.delete(`/chats/${chatId}/messages/${messageId}`),
  markAsRead: (chatId: number) =>
    api.put(`/chats/${chatId}/messages/read`),
  getReadStatus: (chatId: number, messageId: number) =>
    api.get(`/chats/${chatId}/messages/${messageId}/read-status`),
};

// WebSocket bağlantısı için yardımcı fonksiyon
export const createWebSocket = (path: string, token: string) => {
  const ws = new WebSocket(`ws://localhost:8000${path}?token=${token}`);
  return ws;
};

export default api; 