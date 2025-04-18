import api from './api';

// Auth işlemleri
export const register = data => api.post('/auth/register', data);
export const login = creds => {
  const form = new URLSearchParams();
  form.append('username', creds.username);
  form.append('password', creds.password);
  
  return api.post('/auth/login', form, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
};
export const me = () => api.get('/auth/me');
export const refreshToken = () => api.post('/auth/refresh');

// Kullanıcı işlemleri
export const getUsers = (params) => api.get('/users', { params });
export const getUser = (id) => api.get(`/users/${id}`);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);

// Sohbet işlemleri
export const getChats = (params) => api.get('/chats', { params });
export const getChat = (id) => api.get(`/chats/${id}`);
export const createChat = (data) => api.post('/chats', data);
export const updateChat = (id, data) => api.put(`/chats/${id}`, data);
export const deleteChat = (id) => api.delete(`/chats/${id}`);
export const addMembers = (chatId, userIds) => api.post(`/chats/${chatId}/members`, { user_ids: userIds });
export const removeMember = (chatId, userId) => api.delete(`/chats/${chatId}/members/${userId}`);

// Mesaj işlemleri
export const getMessages = (chatId, params) => api.get(`/chats/${chatId}/messages`, { params });
export const sendMessage = (chatId, content) => api.post(`/chats/${chatId}/messages`, { content });
export const updateMessage = (chatId, messageId, content) => api.put(`/chats/${chatId}/messages/${messageId}`, { content });
export const deleteMessage = (chatId, messageId) => api.delete(`/chats/${chatId}/messages/${messageId}`);
export const markAsRead = (chatId) => api.put(`/chats/${chatId}/messages/read`);
export const getMessageReadStatus = (chatId, messageId) => api.get(`/chats/${chatId}/messages/${messageId}/read-status`);
