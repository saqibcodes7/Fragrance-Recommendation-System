import axios from 'axios';

// Set up Axios defaults
axios.defaults.withCredentials = true; // Enables sending cookies with cross-site requests

// Base URL for API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Error handler helper
const handleError = (error) => {
  if (error.response) {
    // Server responded with error
    if (error.response.status === 401) {
      // Clear user session if unauthorized
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error(error.response.data.error || 'An error occurred');
  } else if (error.request) {
    // Request made but no response
    throw new Error('No response from server');
  } else {
    // Other errors
    throw new Error('Error setting up request');
  }
};

// Add request interceptor to include token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth requests
export const registerUser = async (userData) => {
  try {
    const response = await api.post('/api/signup', userData);
    localStorage.setItem('token', response.data.token);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/api/login', credentials);
    localStorage.setItem('token', response.data.token);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const logoutUser = async () => {
  try {
    const response = await api.post('/api/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const getLoggedInUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const response = await api.get('/api/me');
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
    handleError(error);
  }
};

// Fragrance requests
export const getAllFragrances = async (page = 1, limit = 20) => {
  try {
    const response = await api.get(`/api/fragrances?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const searchFragrances = async (query) => {
  try {
    const response = await api.get(`/api/search?query=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const getFragrance = async (id) => {
  try {
    const response = await api.get(`/api/fragrances/${id}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Quiz requests
export const submitQuiz = async (quizData) => {
  try {
    const response = await api.post('/api/api/quiz', { preferences: quizData });
    return {
      success: true,
      ...response.data
    };
  } catch (error) {
    throw new Error(
      error.response?.data?.error || 
      error.response?.data?.message || 
      'Failed to submit quiz. Server error'
    );
  }
};

export const getQuizResults = async () => {
  try {
    const response = await api.get('/api/quiz/results');
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Favorites requests
export const addToFavorites = async (fragrance_id) => {
  try {
    const response = await api.post('/api/favourites', { fragrance_id });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const getFavorites = async () => {
  try {
    const response = await api.get('/api/favourites');
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const removeFromFavorites = async (favorite_id) => {
  try {
    const response = await api.delete(`/api/favourites/${favorite_id}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

export const checkFavorite = async (fragrance_id) => {
  try {
    const response = await api.get(`/api/favourites/check/${fragrance_id}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// Similar fragrances request
export const getSimilarFragrances = async (fragranceName) => {
  try {
    const response = await api.get(`/api/recommendations?title=${encodeURIComponent(fragranceName)}`);
    return response.data;
  } catch (error) {
    return [];
  }
};