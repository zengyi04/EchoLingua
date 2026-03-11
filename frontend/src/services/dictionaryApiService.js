import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, authFetch } from './api';

const toQuery = (params) => {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      search.append(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const dictionaryApiService = {
  getEntries: async ({ status, languageId } = {}) => {
    const query = toQuery({ status, language_id: languageId });
    return authFetch(`/ai/dictionary${query}`);
  },

  elicitFromText: async ({ anchorText, indigenousResponse, languageId }) => {
    return authFetch('/ai/elicit/text', {
      method: 'POST',
      body: JSON.stringify({
        anchor_text: anchorText,
        indigenous_response: indigenousResponse,
        language_id: languageId,
      }),
    });
  },

  elicitFromAudio: async ({ fileUri, fileName, mimeType }) => {
    const token = await AsyncStorage.getItem('userToken');
    const extension = (fileName?.split('.').pop() || fileUri?.split('.').pop() || 'm4a').toLowerCase();

    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      name: fileName || `elicitation.${extension}`,
      type: mimeType || `audio/${extension}`,
    });

    const response = await fetch(`${API_URL}/ai/elicit/audio`, {
      method: 'POST',
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Audio elicitation failed with status ${response.status}`);
    }

    return response.json();
  },

  verifyEntry: async (entryId) => {
    return authFetch(`/ai/dictionary/${encodeURIComponent(entryId)}/verify`, {
      method: 'POST',
    });
  },

  deleteEntry: async (entryId) => {
    return authFetch(`/ai/dictionary/${encodeURIComponent(entryId)}`, {
      method: 'DELETE',
    });
  },
};
