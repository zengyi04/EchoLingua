/**
 * Translation Service
 * Provides text translation using free MyMemory API (no API key needed)
 * For production, consider using Google Translate API with a paid key for better quality
 */

import { aiApiService } from './aiApiService';

const INDIGENOUS_DICTIONARY_LANGUAGE_IDS = new Set([
  'iban',
  'bidayuh',
  'kadazan',
  'murut',
  'melanau',
  'penan',
]);

const shouldUseDictionaryAi = (sourceLanguageId, targetLanguageId) =>
  INDIGENOUS_DICTIONARY_LANGUAGE_IDS.has(String(sourceLanguageId || '').toLowerCase()) ||
  INDIGENOUS_DICTIONARY_LANGUAGE_IDS.has(String(targetLanguageId || '').toLowerCase());

const normalizeForCompare = (value) =>
  String(value || '')
    .replace(/[{}\[\]"'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const isUnchangedTranslation = (source, translated) => {
  const a = normalizeForCompare(source);
  const b = normalizeForCompare(translated);
  if (!a || !b) return false;
  return a === b;
};

// Language code mapping for translations
const LANGUAGE_CODES = {
  english: 'en',
  malay: 'ms',
  indonesian: 'id',
  mandarin: 'zh-CN',
  chinese: 'zh-CN',
  spanish: 'es',
  french: 'fr',
  arabic: 'ar',
  japanese: 'ja',
  korean: 'ko',
  german: 'de',
  portuguese: 'pt',
  thai: 'th',
  vietnamese: 'vi',
  russian: 'ru',
  italian: 'it',
  turkish: 'tr',
  hindi: 'hi',
  iban: 'ms', // Use Malay as closest match
  bidayuh: 'ms',
  kadazan: 'ms',
  murut: 'ms',
};

/**
 * Translates text using MyMemory API (free, no auth required)
 * @param {string} text - Text to translate
 * @param {string} languageId - Target language ID (e.g., 'spanish', 'mandarin')
 * @returns {Promise<string>} - Translated text
 */
export const translateText = async (text, languageId) => {
  try {
    if (!text || !languageId) {
      return text || '';
    }

    if (shouldUseDictionaryAi('english', languageId)) {
      try {
        const aiResponse = await aiApiService.translate({
          sourceText: text,
          sourceLang: 'English',
          targetLang: languageId,
          languageId: 'kadazan-demo',
        });
        if (aiResponse?.translated_text && !isUnchangedTranslation(text, aiResponse.translated_text)) {
          return aiResponse.translated_text;
        }
        if (aiResponse?.translated_text) {
          console.warn('AI translate returned unchanged text; falling back to MyMemory');
        }
      } catch (aiError) {
        console.warn('AI translation unavailable, falling back to MyMemory:', aiError?.message || aiError);
      }
    }

    const targetCode = LANGUAGE_CODES[languageId] || 'en';
    
    // Use MyMemory free API (no authentication needed)
    const encodedText = encodeURIComponent(text);
    const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${targetCode}`;

    console.log(`🔄 Translating to ${languageId} (${targetCode})...`);
    
    const response = await fetch(url, {
      method: 'GET',
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      console.warn(`⚠️ Translation API returned status ${response.status}`);
      return text; // Return original if translation fails
    }

    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData.translatedText) {
      const translated = data.responseData.translatedText;
      console.log(`✅ Translation successful`);
      return translated;
    } else {
      console.warn('⚠️ Translation API error:', data.responseDetails);
      return text; // Return original if translation fails
    }
  } catch (error) {
    console.error('❌ Translation service error:', error);
    return text; // Return original on error
  }
};

/**
 * Translates multiple text segments in parallel
 * @param {string[]} texts - Array of texts to translate
 * @param {string} languageId - Target language ID
 * @returns {Promise<string[]>} - Array of translated texts
 */
export const translateMultiple = async (texts, languageId) => {
  try {
    const translations = await Promise.all(
      texts.map(text => translateText(text, languageId))
    );
    return translations;
  } catch (error) {
    console.error('❌ Batch translation error:', error);
    return texts; // Return originals on error
  }
};

/**
 * Translate between any supported source and target language IDs.
 * @param {string} text - Text to translate
 * @param {string} sourceLanguageId - Source language ID
 * @param {string} targetLanguageId - Target language ID
 * @returns {Promise<string>} - Translated text
 */
export const translateTextBetween = async (text, sourceLanguageId, targetLanguageId) => {
  try {
    if (!text || !sourceLanguageId || !targetLanguageId) {
      return text;
    }

    if (sourceLanguageId === targetLanguageId) {
      return text;
    }

    if (shouldUseDictionaryAi(sourceLanguageId, targetLanguageId)) {
      try {
        const aiResponse = await aiApiService.translate({
          sourceText: text,
          sourceLang: sourceLanguageId,
          targetLang: targetLanguageId,
          languageId: 'kadazan-demo',
        });
        if (aiResponse?.translated_text && !isUnchangedTranslation(text, aiResponse.translated_text)) {
          return aiResponse.translated_text;
        }
        if (aiResponse?.translated_text) {
          console.warn('AI translateBetween returned unchanged text; falling back to MyMemory');
        }
      } catch (aiError) {
        console.warn('AI translateBetween unavailable, falling back to MyMemory:', aiError?.message || aiError);
      }
    }

    const sourceCode = LANGUAGE_CODES[sourceLanguageId] || 'en';
    const targetCode = LANGUAGE_CODES[targetLanguageId] || 'en';
    const encodedText = encodeURIComponent(text);
    const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${sourceCode}|${targetCode}`;

    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
      return text;
    }

    const data = await response.json();
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }

    return text;
  } catch (error) {
    console.error('❌ Pair translation error:', error);
    return text;
  }
};

/**
 * For production use: Google Translate API translation
 * Requires API key to be configured
 * @param {string} text - Text to translate
 * @param {string} languageId - Target language ID
 * @param {string} apiKey - Google Translate API key
 * @returns {Promise<string>} - Translated text
 */
export const translateWithGoogleAPI = async (text, languageId, apiKey) => {
  try {
    if (!apiKey) {
      console.warn('⚠️ No Google API key provided. Using free MyMemory API instead.');
      return translateText(text, languageId);
    }

    const targetCode = LANGUAGE_CODES[languageId] || 'en';
    const url = 'https://translation.googleapis.com/language/translate/v2';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetCode,
        key: apiKey,
      }),
    });

    const data = await response.json();

    if (data.data && data.data.translations && data.data.translations[0]) {
      return data.data.translations[0].translatedText;
    }

    return text;
  } catch (error) {
    console.error('❌ Google Translation API error:', error);
    return text;
  }
};

export default {
  translateText,
  translateMultiple,
  translateTextBetween,
  translateWithGoogleAPI,
};
