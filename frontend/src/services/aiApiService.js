import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, authFetch } from './api';

const buildFormAudio = ({ fileUri, fileName, mimeType }) => {
  const extension = (fileName?.split('.').pop() || fileUri?.split('.').pop() || 'm4a').toLowerCase();
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: fileName || `audio.${extension}`,
    type: mimeType || `audio/${extension}`,
  });
  return formData;
};

const buildFormImage = ({ fileUri, fileName, mimeType, languageId }) => {
  const extension = (fileName?.split('.').pop() || fileUri?.split('.').pop() || 'jpg').toLowerCase();
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: fileName || `image.${extension}`,
    type: mimeType || `image/${extension === 'jpg' ? 'jpeg' : extension}`,
  });
  if (languageId) {
    formData.append('language_id', languageId);
  }
  return formData;
};

const authUpload = async (path, formData) => {
  const token = await AsyncStorage.getItem('userToken');
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed (${response.status})`);
  }

  return response.json();
};

export const aiApiService = {
  chat: async ({ message, history = [], systemContext = null, targetLanguage = null, mode = null }) => {
    return authFetch('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        history: history.map((item) => ({
          role: item.role,
          text: item.text,
        })),
        system_context: systemContext,
        target_language: targetLanguage,
        mode,
      }),
    });
  },

  translate: async ({ sourceText, sourceLang = 'English', targetLang = 'Malay', languageId = 'kadazan-demo' }) => {
    return authFetch('/ai/translate', {
      method: 'POST',
      body: JSON.stringify({
        source_text: sourceText,
        source_lang: sourceLang,
        target_lang: targetLang,
        language_id: languageId,
      }),
    });
  },

  visionFromText: async ({ description, languageId = 'kadazan-demo' }) => {
    return authFetch('/ai/vision', {
      method: 'POST',
      body: JSON.stringify({ description, language_id: languageId }),
    });
  },

  visionFromImage: async ({ fileUri, fileName, mimeType, languageId = 'kadazan-demo' }) => {
    const formData = buildFormImage({ fileUri, fileName, mimeType, languageId });
    return authUpload('/ai/vision/image', formData);
  },

  tts: async ({ indigenousText, languageId = 'kadazan-demo' }) => {
    return authFetch('/ai/tts', {
      method: 'POST',
      body: JSON.stringify({
        indigenous_text: indigenousText,
        language_id: languageId,
      }),
    });
  },

  elicitFromAudio: async ({ fileUri, fileName, mimeType }) => {
    const formData = buildFormAudio({ fileUri, fileName, mimeType });
    return authUpload('/ai/elicit/audio', formData);
  },

  transcribeAudio: async ({ base64Audio, mimeType = 'audio/mp4', targetLanguage = null }) => {
    return authFetch('/ai/transcribe', {
      method: 'POST',
      body: JSON.stringify({
        base64_audio: base64Audio,
        mime_type: mimeType,
        target_language: targetLanguage,
      }),
    });
  },
};
