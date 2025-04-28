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
  getAll: () => api.get('/users'),
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
    
    // Append all fields to formData
    Object.entries(profileData).forEach(([key, value]) => {
      // Handle file upload separately
      if (key === 'profileImage' && value instanceof File) {
        formData.append('profileImage', value);
      } else {
        formData.append(key, value);
      }
    });
    
    return api.post('/profile/client', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  update: async (data) => {
    const formData = new FormData();
    
    // Add all form fields to formData
    Object.keys(data).forEach(key => {
      if (key === 'profileImage' && data[key]) {
        formData.append('profileImage', data[key]);
      } else if (key !== 'profileImage') {
        formData.append(key, data[key]);
      }
    });

    // Explicitly append removeImage flag if present
    if (data.removeImage) {
      formData.append('removeImage', 'true');
    }

    return api.put('/profile/client', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Freelancer Profile API
export const freelancerProfileAPI = {
  get: () => api.get('/profile/freelancer'),
  create: (profileData) => {
    const formData = new FormData();
    
    // Append all fields to formData
    Object.entries(profileData).forEach(([key, value]) => {
      // Handle file upload separately
      if (key === 'profileImage' && value instanceof File) {
        formData.append('profileImage', value);
      } else {
        formData.append(key, value);
      }
    });
    
    return api.post('/profile/freelancer', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  update: async (data) => {
    const formData = new FormData();
    
    // Add all form fields to formData
    Object.keys(data).forEach(key => {
      if (key === 'profileImage' && data[key]) {
        formData.append('profileImage', data[key]);
      } else if (key !== 'profileImage') {
        formData.append(key, data[key]);
      }
    });

    // Explicitly append removeImage flag if present
    if (data.removeImage) {
      formData.append('removeImage', 'true');
    }

    return api.put('/profile/freelancer', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;