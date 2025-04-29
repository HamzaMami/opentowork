import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Request interceptor to attach authorization token to requests
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors
    if (error.response && error.response.status === 401) {
      // Clear user from local storage and redirect to login page
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
};

// Users API
export const usersAPI = {
  getAll: (params = {}) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
};

// Client Profile API
export const clientProfileAPI = {
  get: () => api.get('/profile/client'),
  create: (profileData) => {
    const formData = new FormData();
    
    // If profileData is already FormData, use it directly
    if (profileData instanceof FormData) {
      return api.post('/profile/client', profileData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    
    // Otherwise, convert object to FormData
    Object.entries(profileData).forEach(([key, value]) => {
      if (key === 'profileImage' && value instanceof File) {
        formData.append('profileImage', value);
      } else if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });
    
    return api.post('/profile/client', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (profileData) => {
    // If profileData is already FormData, use it directly
    if (profileData instanceof FormData) {
      return api.put('/profile/client', profileData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    
    // Otherwise, convert object to FormData
    const formData = new FormData();
    Object.entries(profileData).forEach(([key, value]) => {
      if (key === 'profileImage' && value instanceof File) {
        formData.append('profileImage', value);
      } else if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });
    
    return api.put('/profile/client', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Freelancer Profile API
export const freelancerProfileAPI = {
  get: () => api.get('/profile/freelancer'),
  create: (profileData) => {
    // If profileData is already FormData, use it directly
    if (profileData instanceof FormData) {
      return api.post('/profile/freelancer', profileData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    
    // Otherwise, convert object to FormData
    const formData = new FormData();
    Object.entries(profileData).forEach(([key, value]) => {
      if (key === 'profileImage' && value instanceof File) {
        formData.append('profileImage', value);
      } else if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });
    
    return api.post('/profile/freelancer', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (profileData) => {
    // If profileData is already FormData, use it directly
    if (profileData instanceof FormData) {
      return api.put('/profile/freelancer', profileData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    
    // Otherwise, convert object to FormData
    const formData = new FormData();
    Object.entries(profileData).forEach(([key, value]) => {
      if (key === 'profileImage' && value instanceof File) {
        formData.append('profileImage', value);
      } else if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });
    
    return api.put('/profile/freelancer', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Wallet API
export const walletAPI = {
  getWallet: () => api.get('/wallet'),
  getTransactions: () => api.get('/wallet/transactions'),
  addFunds: (amount, paymentMethod) => api.post('/wallet/deposit', { amount, paymentMethod }),
  withdrawFunds: (amount, withdrawalMethod) => api.post('/wallet/withdraw', { amount, withdrawalMethod }),
  
  // Payment methods
  getPaymentMethods: () => api.get('/wallet/payment-methods'),
  addPaymentMethod: (type, details, makeDefault = false) => 
    api.post('/wallet/payment-methods', { type, details, makeDefault }),
  removePaymentMethod: (id) => api.delete(`/wallet/payment-methods/${id}`)
};

// Chat API
export const chatAPI = {
  getAllChats: () => api.get('/chats'),
  createChat: (recipientId) => api.post('/chats', { recipientId }),
  getChatById: (chatId) => api.get(`/chats/${chatId}`),
  getChatMessages: (chatId, page = 1, limit = 20) => api.get(`/chats/${chatId}/messages`, {
    params: { page, limit }
  }),
  
  // Send a message with optional attachments
  sendMessage: (formData) => {
    // Extract chatId from formData
    const chatId = formData.get('chatId');
   
    // FormData already contains content and attachments if any
    return api.post(`/chats/${chatId}/messages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Mark all unread messages in a chat as read
  markMessagesAsRead: (chatId) => api.put(`/chats/${chatId}/read`),
  
  // Delete a specific message
  deleteMessage: (chatId, messageId) => api.delete(`/chats/${chatId}/messages/${messageId}`),
  
  getUnreadCount: () => api.get('/chats/unread/count')
};

export default api;