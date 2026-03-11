import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for the backend API
// When using a physical device with Expo Go, you must use your computer's LAN IP address.
export const API_URL = 'http://192.168.0.5:8000'; 

/**
 * Helper function to handle authenticated requests
 */
export const authFetch = async (endpoint, options = {}) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    
    // Default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add Authorization if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, config);

    // Handle token expiration or unauthorized access
    if (response.status === 401) {
      console.warn('Unauthorized access - potentially clearer token needed here');
      // Ideally, clear token and redirect to login, but we'll throw for now
      // await AsyncStorage.removeItem('userToken');
      // throw new Error('Unauthorized');
    }

    if (!response.ok) {
        // Try getting error message from JSON response
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `Request failed with status ${response.status}`);
    }

    // 204 No Content
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Authentication Services
 */
export const authService = {
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }
      
      const data = await response.json();
      if (data.token) {
        await AsyncStorage.setItem('userToken', data.token);
        if (data.user) {
          await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        }
      }
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  register: async (name, email, password, role) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!response.ok) {
         // Handle non-JSON errors gracefully
         const text = await response.text();
         try {
             const error = JSON.parse(text);
             throw new Error(error.detail || 'Registration failed');
         } catch (e) {
             console.error('Registration failed with non-JSON response:', text);
             throw new Error(`Server Error: ${response.status} ${response.statusText}`);
         }
      }
      
      const data = await response.json();
      if (data.token) {
        await AsyncStorage.setItem('userToken', data.token);
        if (data.user) {
          await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        }
      }
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
  },
  
  getCurrentUser: async () => {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
  }
};

/**
 * User Services
 */
export const userService = {
  getProfile: async () => {
    return authFetch('/users/me');
  },
};

/**
 * Recording Services
 */
export const recordingService = {
  getAll: async (language, userId) => {
    const params = new URLSearchParams();
    if (language) params.append('language', language);
    if (userId) params.append('userId', userId);
    
    // If params empty don't add ?
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return authFetch(`/recordings${queryString}`);
  },

  upload: async (fileUri, userId, language, consent, visibility, transcript) => {
    const token = await AsyncStorage.getItem('userToken');
    
    // FormData requires specific handling
    const formData = new FormData();
    
    // Infer file type from extension
    const uriParts = fileUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    formData.append('file', {
      uri: fileUri,
      name: `recording.${fileType}`,
      type: `audio/${fileType}`, 
    });
    
    formData.append('userId', userId);
    formData.append('language', language);
    formData.append('consent', String(consent)); // FormData values are strings
    formData.append('visibility', visibility);
    if (transcript) formData.append('transcript', transcript);

    try {
      // Direct fetch for upload to handle FormData properly (sometimes headers need special care)
      const response = await fetch(`${API_URL}/recordings/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // 'Content-Type': 'multipart/form-data', // Let fetch set boundary automatically
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
         throw new Error(errorData.detail || 'Upload failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Upload recording error:', error);
      throw error;
    }
  },

  getById: async (recordingId) => {
    return authFetch(`/recordings/${recordingId}`);
  },
};

/**
 * Services for Stories
 */
export const storyService = {
  getAll: async (language, tags) => {
    const params = new URLSearchParams();
    if (language) params.append('language', language);
    if (tags) params.append('tags', tags); 

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return authFetch(`/stories${queryString}`);
  },

  create: async (storyData) => {
    return authFetch('/stories', {
      method: 'POST',
      body: JSON.stringify(storyData),
    });
  },

  getAllMine: async () => {
    return authFetch('/stories/me/created');
  },
  
  delete: async (storyId) => {
    return authFetch(`/stories/${storyId}`, {
      method: 'DELETE',
    });
  },

  getById: async (storyId) => {
    return authFetch(`/stories/${storyId}`);
  },
};

/**
 * Services for Lessons & Quizzes
 */
export const lessonService = {
  getAll: async (difficulty, language, category) => {
    const params = new URLSearchParams();
    if (difficulty) params.append('difficulty', difficulty);
    if (language) params.append('language', language);
    if (category) params.append('category', category);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    return authFetch(`/lessons${queryString}`);
  },

  create: async (lessonData) => {
    return authFetch('/lessons', {
      method: 'POST',
      body: JSON.stringify(lessonData),
    });
  },

  getById: async (lessonId) => {
    return authFetch(`/lessons/${lessonId}`);
  },
};

export const analyticsService = {
  getLanguageUsage: async () => {
    return authFetch('/analytics/language-usage');
  },
};

// Start: Backward Compatibility functions for existing UI integration

export const fetchVocabulary = async () => {
    // Attempt to fetch lessons that might contain vocabulary
    try {
        const lessons = await lessonService.getAll(null, null, 'Vocabulary');
        // Flat map vocabulary if the structure is nested
        if (Array.isArray(lessons)) {
            return lessons.flatMap(lesson => lesson.vocabulary || []);
        }
        return [];
    } catch (e) {
        console.error("Compatible fetchVocabulary failed", e);
        return [];
    }
};

export const fetchStories = async () => {
  try {
      return await storyService.getAll();
  } catch (e) {
      console.error("Compatible fetchStories failed", e);
      return [];
  }
};

export const submitQuizScore = async (score) => {
    // This endpoint isn't documented in the provided backend docs.
    // We'll log it for now.
    console.warn('submitQuizScore: Backend endpoint not specified. Score not synced:', score);
    // If there was a /scores endpoint:
    // return authFetch('/scores', { method: 'POST', body: JSON.stringify({ score }) });
};

// End: Backward Compatibility
