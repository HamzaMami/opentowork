import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, clientProfileAPI, freelancerProfileAPI } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [clientProfile, setClientProfile] = useState(null);
  const [freelancerProfile, setFreelancerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for saved user on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Fetch the appropriate profile based on user role
        if (parsedUser.role === 'client') {
          fetchClientProfile();
        } else if (parsedUser.role === 'freelancer') {
          fetchFreelancerProfile();
        }
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        console.error('Failed to parse stored user data');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Fetch client profile
  const fetchClientProfile = async () => {
    try {
      setLoading(true);
      const response = await clientProfileAPI.get();
      setClientProfile(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching client profile:', error);
      // If profile doesn't exist yet, that's ok
      if (error.response?.status !== 404) {
        setError(error.response?.data?.message || 'Failed to fetch client profile');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch freelancer profile
  const fetchFreelancerProfile = async () => {
    try {
      setLoading(true);
      const response = await freelancerProfileAPI.get();
      setFreelancerProfile(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching freelancer profile:', error);
      // If profile doesn't exist yet, that's ok
      if (error.response?.status !== 404) {
        setError(error.response?.data?.message || 'Failed to fetch freelancer profile');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update or create client profile
  const updateClientProfile = async (profileData) => {
    try {
      setError(null);
      setLoading(true);
      
      let response;
      if (clientProfile) {
        response = await clientProfileAPI.update(profileData);
      } else {
        response = await clientProfileAPI.create(profileData);
      }
      
      setClientProfile(response.data);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update client profile');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update or create freelancer profile
  const updateFreelancerProfile = async (profileData) => {
    try {
      setError(null);
      setLoading(true);
      
      let response;
      if (freelancerProfile) {
        response = await freelancerProfileAPI.update(profileData);
      } else {
        response = await freelancerProfileAPI.create(profileData);
      }
      
      setFreelancerProfile(response.data);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update freelancer profile');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authAPI.login(email, password);
      const userData = response.data;
      
      // Save user to state and localStorage
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Fetch the appropriate profile based on user role
      if (userData.role === 'client') {
        await fetchClientProfile();
      } else if (userData.role === 'freelancer') {
        await fetchFreelancerProfile();
      }
      
      return userData;
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authAPI.register(userData);
      const newUser = response.data;
      
      // Save user to state and localStorage
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      return newUser;
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Remove user from state and localStorage
    setUser(null);
    setClientProfile(null);
    setFreelancerProfile(null);
    localStorage.removeItem('user');
  };

  // Update profile function
  const updateProfile = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authAPI.updateProfile(userData);
      const updatedUser = { ...user, ...response.data };
      
      // Save updated user to state and localStorage
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      setError(error.response?.data?.message || 'Profile update failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        clientProfile,
        freelancerProfile,
        loading, 
        error, 
        login, 
        register, 
        logout, 
        updateProfile,
        updateClientProfile,
        updateFreelancerProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for accessing auth context
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};