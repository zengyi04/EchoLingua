import { WORLD_LANGUAGES } from './languages';

export const ASEAN_PRIORITY_LANGUAGE_IDS = [
  // Indigenous Borneo first
  'iban',
  'bidayuh',
  'kadazan',
  'murut',
  'melanau',
  'penan',
  // ASEAN major languages
  'malay',
  'indonesian',
  'tagalog',
  'vietnamese',
  'thai',
  'burmese',
  'khmer',
  'lao',
  // Bridge language for wider access
  'english',
];

const toOption = (lang) => ({
  id: lang.id,
  label: lang.label,
  flag: lang.flag,
  region: lang.region,
  indigenous: Boolean(lang.indigenous),
});

const byPriorityThenLabel = (a, b) => {
  const aIndex = ASEAN_PRIORITY_LANGUAGE_IDS.indexOf(a.id);
  const bIndex = ASEAN_PRIORITY_LANGUAGE_IDS.indexOf(b.id);
  const aRank = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
  const bRank = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;

  if (aRank !== bRank) {
    return aRank - bRank;
  }
  return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' });
};

export const UNIFIED_LANGUAGE_OPTIONS = [...WORLD_LANGUAGES]
  .sort(byPriorityThenLabel)
  .map(toOption);

export const TRANSLATION_LANGUAGE_IDS = [
  'english',
  'malay',
  'indonesian',
  'mandarin',
  'spanish',
  'french',
  'arabic',
  'japanese',
  'korean',
  'german',
  'portuguese',
  'thai',
  'vietnamese',
  'russian',
  'italian',
  'turkish',
  'hindi',
  'iban',
  'bidayuh',
  'kadazan',
  'murut',
];

export const TRANSLATION_LANGUAGE_OPTIONS = WORLD_LANGUAGES.filter((lang) =>
  TRANSLATION_LANGUAGE_IDS.includes(lang.id)
)
  .sort(byPriorityThenLabel)
  .map(toOption);

export const getLanguageLabelById = (id) => {
  const normalized = String(id || '').trim().toLowerCase();
  const foundById = WORLD_LANGUAGES.find((lang) => lang.id.toLowerCase() === normalized);
  if (foundById) return foundById.label;

  const foundByLabel = WORLD_LANGUAGES.find((lang) => lang.label.toLowerCase() === normalized);
  return foundByLabel?.label || id || 'Unknown';
};

const LANGUAGE_HINTS = {
  english: ['the', 'and', 'with', 'this', 'that', 'for', 'you', 'your', 'from'],
  malay: ['dan', 'yang', 'untuk', 'dengan', 'ini', 'itu', 'saya', 'kami', 'anda', 'terima'],
  indonesian: ['dan', 'yang', 'untuk', 'dengan', 'ini', 'itu', 'saya', 'kami', 'anda'],
  spanish: ['de', 'la', 'el', 'que', 'y', 'con', 'para', 'una', 'gracias'],
  french: ['le', 'la', 'et', 'de', 'des', 'pour', 'avec', 'bonjour', 'merci'],
  german: ['der', 'die', 'das', 'und', 'mit', 'für', 'danke', 'hallo'],
  portuguese: ['de', 'da', 'do', 'e', 'com', 'para', 'obrigado', 'ola'],
  italian: ['di', 'e', 'con', 'per', 'ciao', 'grazie', 'il', 'la'],
  turkish: ['ve', 'ile', 'icin', 'merhaba', 'tesekkur', 'bir'],
  russian: ['и', 'в', 'не', 'на', 'спасибо', 'привет'],
  thai: ['และ', 'ใน', 'คุณ', 'สวัสดี'],
  vietnamese: ['va', 'toi', 'ban', 'cam', 'on', 'xin', 'chao'],
  hindi: ['और', 'में', 'यह', 'आप', 'धन्यवाद', 'नमस्ते'],
  arabic: ['و', 'في', 'من', 'على', 'شكرا', 'مرحبا'],
  mandarin: ['的', '了', '我', '你', '谢谢', '你好'],
};

export const detectLanguageFromText = (text) => {
  const sample = String(text || '').trim();
  if (!sample) return { languageId: null, confidence: 0 };

  if (/[\u4e00-\u9fff]/.test(sample)) {
    return { languageId: 'mandarin', confidence: 0.95 };
  }
  if (/[\u0600-\u06FF]/.test(sample)) {
    return { languageId: 'arabic', confidence: 0.95 };
  }
  if (/[\u0E00-\u0E7F]/.test(sample)) {
    return { languageId: 'thai', confidence: 0.95 };
  }
  if (/[\u0400-\u04FF]/.test(sample)) {
    return { languageId: 'russian', confidence: 0.95 };
  }

  const tokens = sample
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) {
    return { languageId: null, confidence: 0 };
  }

  let bestLanguage = null;
  let bestScore = 0;

  Object.entries(LANGUAGE_HINTS).forEach(([languageId, hints]) => {
    let score = 0;
    hints.forEach((hint) => {
      if (tokens.includes(hint)) {
        score += 1;
      }
    });

    if (score > bestScore) {
      bestScore = score;
      bestLanguage = languageId;
    }
  });

  if (!bestLanguage || bestScore === 0) {
    // Fallback for plain Latin words like "apple": prefer English as practical default.
    if (/^[A-Za-z\s'\-]+$/.test(sample)) {
      return { languageId: 'english', confidence: 0.45 };
    }
    return { languageId: null, confidence: 0 };
  }

  const confidence = Math.min(0.9, 0.35 + bestScore * 0.12);
  return { languageId: bestLanguage, confidence };
};
