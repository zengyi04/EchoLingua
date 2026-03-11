// Service to handle Story API integration
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api';
import { authFetch } from './api';

export const storyApiService = {
  /**
   * Transcribe audio via backend AI pipeline.
   * Uses POST /ai/elicit/audio and reads anchor_text as transcript source.
   */
  transcribeAudioFromBackend: async (fileUri) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const uriParts = fileUri.split('.');
      const fileType = (uriParts[uriParts.length - 1] || 'm4a').toLowerCase();

      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: `story-recording.${fileType}`,
        type: `audio/${fileType}`,
      });

      const response = await fetch(`${API_URL}/ai/elicit/audio`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Transcription failed with status ${response.status}`);
      }

      const data = await response.json();
      return (data?.anchor_text || '').trim();
    } catch (error) {
      console.error('❌ Backend audio transcription failed:', error);
      throw error;
    }
  },

  /**
   * Generate a bilingual story using AI and automatically persist it
   * According to API docs: POST /ai/story
   * 
   * @param {Array} annotatedText - Array of {indigenous_text, malay_translation}
   * @param {Array} grammarRules - Array of grammar rules
   * @param {string} language - Language name (e.g., "Kadazan")
   * @returns {Promise<Object>} The generated story response with persisted ID
   */
  generateStory: async (annotatedText, grammarRules, language = 'Kadazan') => {
    try {
      console.log('🎯 Calling /ai/story endpoint with:', { annotatedText, grammarRules, language });
      const response = await authFetch('/ai/story', {
        method: 'POST',
        body: JSON.stringify({
          annotated_text: annotatedText,
          grammar_rules: grammarRules,
          language: language
        }),
      });
      console.log('✅ Story generated and persisted by backend:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to generate story via AI API:', error);
      throw error;
    }
  },

  /**
   * Create a new story manually in the backend
   * According to API docs: POST /stories
   * 
   * @param {Object} storyData - The story data
   * @param {string} storyData.title - Story title
   * @param {string} storyData.text - Full story text
   * @param {string} [storyData.language] - Language (default: English)
   * @param {Array<string>} [storyData.tags] - optional tags
   * @param {string} [storyData.audioUrl] - optional audio URL
   * @returns {Promise<Object>} The created story response
   */
  createStory: async (storyData) => {
    try {
      const response = await authFetch('/stories', {
        method: 'POST',
        body: JSON.stringify(storyData),
      });
      return response;
    } catch (error) {
      console.error('Failed to create story via API:', error);
      throw error;
    }
  },

  /**
   * Get all stories from the community
   * According to API docs: GET /stories
   * @param {string} [language]
   * @returns {Promise<Array>} List of stories
   */
  getStories: async (language = null) => {
    try {
      let url = '/stories';
      if (language) {
        url += `?language=${encodeURIComponent(language)}`;
      }
      return await authFetch(url);
    } catch (error) {
        console.error('Failed to fetch stories:', error);
        throw error;
    }
  },
  
  /**
   * Get a single story by ID
   * @param {string} id
   */
  getStoryById: async (id) => {
      return await authFetch(`/stories/${id}`);
  }
};
