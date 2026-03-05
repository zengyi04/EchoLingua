// Comprehensive list of world languages for the Indigenous Language Revitalization Platform
// This list includes major world languages plus indigenous Borneo languages

export const WORLD_LANGUAGES = [
  // Indigenous Borneo Languages (Priority)
  { id: 'iban', label: 'Iban', flag: '🇲🇾', region: 'Borneo', indigenous: true },
  { id: 'bidayuh', label: 'Bidayuh', flag: '🇲🇾', region: 'Borneo', indigenous: true },
  { id: 'kadazan', label: 'Kadazan-Dusun', flag: '🇲🇾', region: 'Borneo', indigenous: true },
  { id: 'murut', label: 'Murut', flag: '🇲🇾', region: 'Borneo', indigenous: true },
  { id: 'melanau', label: 'Melanau', flag: '🇲🇾', region: 'Borneo', indigenous: true },
  { id: 'penan', label: 'Penan', flag: '🇲🇾', region: 'Borneo', indigenous: true },
  
  // Southeast Asian Languages
  { id: 'malay', label: 'Malay', flag: '🇲🇾', region: 'Southeast Asia' },
  { id: 'indonesian', label: 'Indonesian', flag: '🇮🇩', region: 'Southeast Asia' },
  { id: 'tagalog', label: 'Tagalog (Filipino)', flag: '🇵🇭', region: 'Southeast Asia' },
  { id: 'vietnamese', label: 'Vietnamese', flag: '🇻🇳', region: 'Southeast Asia' },
  { id: 'thai', label: 'Thai', flag: '🇹🇭', region: 'Southeast Asia' },
  { id: 'burmese', label: 'Burmese', flag: '🇲🇲', region: 'Southeast Asia' },
  { id: 'khmer', label: 'Khmer', flag: '🇰🇭', region: 'Southeast Asia' },
  { id: 'lao', label: 'Lao', flag: '🇱🇦', region: 'Southeast Asia' },
  
  // Major World Languages
  { id: 'english', label: 'English', flag: '🇬🇧', region: 'Global' },
  { id: 'mandarin', label: 'Mandarin Chinese', flag: '🇨🇳', region: 'East Asia' },
  { id: 'spanish', label: 'Spanish', flag: '🇪🇸', region: 'Europe/Americas' },
  { id: 'hindi', label: 'Hindi', flag: '🇮🇳', region: 'South Asia' },
  { id: 'arabic', label: 'Arabic', flag: '🇸🇦', region: 'Middle East/North Africa' },
  { id: 'bengali', label: 'Bengali', flag: '🇧🇩', region: 'South Asia' },
  { id: 'portuguese', label: 'Portuguese', flag: '🇵🇹', region: 'Europe/Americas' },
  { id: 'russian', label: 'Russian', flag: '🇷🇺', region: 'Eastern Europe/Central Asia' },
  { id: 'japanese', label: 'Japanese', flag: '🇯🇵', region: 'East Asia' },
  { id: 'punjabi', label: 'Punjabi', flag: '🇮🇳', region: 'South Asia' },
  { id: 'marathi', label: 'Marathi', flag: '🇮🇳', region: 'South Asia' },
  { id: 'telugu', label: 'Telugu', flag: '🇮🇳', region: 'South Asia' },
  { id: 'turkish', label: 'Turkish', flag: '🇹🇷', region: 'Western Asia' },
  { id: 'korean', label: 'Korean', flag: '🇰🇷', region: 'East Asia' },
  { id: 'french', label: 'French', flag: '🇫🇷', region: 'Europe/Africa' },
  { id: 'german', label: 'German', flag: '🇩🇪', region: 'Central Europe' },
  { id: 'tamil', label: 'Tamil', flag: '🇮🇳', region: 'South Asia' },
  { id: 'urdu', label: 'Urdu', flag: '🇵🇰', region: 'South Asia' },
  { id: 'italian', label: 'Italian', flag: '🇮🇹', region: 'Southern Europe' },
  { id: 'persian', label: 'Persian (Farsi)', flag: '🇮🇷', region: 'Middle East' },
  
  // European Languages
  { id: 'polish', label: 'Polish', flag: '🇵🇱', region: 'Central Europe' },
  { id: 'ukrainian', label: 'Ukrainian', flag: '🇺🇦', region: 'Eastern Europe' },
  { id: 'dutch', label: 'Dutch', flag: '🇳🇱', region: 'Western Europe' },
  { id: 'romanian', label: 'Romanian', flag: '🇷🇴', region: 'Eastern Europe' },
  { id: 'czech', label: 'Czech', flag: '🇨🇿', region: 'Central Europe' },
  { id: 'greek', label: 'Greek', flag: '🇬🇷', region: 'Southern Europe' },
  { id: 'swedish', label: 'Swedish', flag: '🇸🇪', region: 'Northern Europe' },
  { id: 'hungarian', label: 'Hungarian', flag: '🇭🇺', region: 'Central Europe' },
  { id: 'catalan', label: 'Catalan', flag: '🇪🇸', region: 'Southern Europe' },
  { id: 'finnish', label: 'Finnish', flag: '🇫🇮', region: 'Northern Europe' },
  { id: 'danish', label: 'Danish', flag: '🇩🇰', region: 'Northern Europe' },
  { id: 'norwegian', label: 'Norwegian', flag: '🇳🇴', region: 'Northern Europe' },
  
  // African Languages
  { id: 'swahili', label: 'Swahili', flag: '🇰🇪', region: 'East Africa' },
  { id: 'hausa', label: 'Hausa', flag: '🇳🇬', region: 'West Africa' },
  { id: 'yoruba', label: 'Yoruba', flag: '🇳🇬', region: 'West Africa' },
  { id: 'igbo', label: 'Igbo', flag: '🇳🇬', region: 'West Africa' },
  { id: 'amharic', label: 'Amharic', flag: '🇪🇹', region: 'East Africa' },
  { id: 'zulu', label: 'Zulu', flag: '🇿🇦', region: 'Southern Africa' },
  { id: 'xhosa', label: 'Xhosa', flag: '🇿🇦', region: 'Southern Africa' },
  
  // Americas Indigenous & Regional
  { id: 'quechua', label: 'Quechua', flag: '🇵🇪', region: 'South America', indigenous: true },
  { id: 'guarani', label: 'Guaraní', flag: '🇵🇾', region: 'South America', indigenous: true },
  { id: 'nahuatl', label: 'Nahuatl', flag: '🇲🇽', region: 'Central America', indigenous: true },
  { id: 'maya', label: 'Maya', flag: '🇲🇽', region: 'Central America', indigenous: true },
  
  // Pacific Languages
  { id: 'maori', label: 'Māori', flag: '🇳🇿', region: 'Oceania', indigenous: true },
  { id: 'samoan', label: 'Samoan', flag: '🇼🇸', region: 'Oceania' },
  { id: 'tongan', label: 'Tongan', flag: '🇹🇴', region: 'Oceania' },
  { id: 'fijian', label: 'Fijian', flag: '🇫🇯', region: 'Oceania' },
  
  // Additional Asian Languages
  { id: 'cantonese', label: 'Cantonese', flag: '🇭🇰', region: 'East Asia' },
  { id: 'sinhala', label: 'Sinhala', flag: '🇱🇰', region: 'South Asia' },
  { id: 'nepali', label: 'Nepali', flag: '🇳🇵', region: 'South Asia' },
  { id: 'mongolian', label: 'Mongolian', flag: '🇲🇳', region: 'Central Asia' },
  { id: 'tibetan', label: 'Tibetan', flag: '🏔️', region: 'Central Asia', indigenous: true },
  { id: 'kazakh', label: 'Kazakh', flag: '🇰🇿', region: 'Central Asia' },
  { id: 'uzbek', label: 'Uzbek', flag: '🇺🇿', region: 'Central Asia' },
  
  // Middle Eastern Languages
  { id: 'hebrew', label: 'Hebrew', flag: '🇮🇱', region: 'Middle East' },
  { id: 'kurdish', label: 'Kurdish', flag: '🏴', region: 'Middle East' },
  { id: 'pashto', label: 'Pashto', flag: '🇦🇫', region: 'Central/South Asia' },
  
  // Indigenous Languages from Various Regions
  { id: 'ainu', label: 'Ainu', flag: '🇯🇵', region: 'East Asia', indigenous: true },
  { id: 'aboriginal', label: 'Aboriginal Australian', flag: '🇦🇺', region: 'Oceania', indigenous: true },
  { id: 'inuit', label: 'Inuit (Inuktitut)', flag: '🇨🇦', region: 'North America', indigenous: true },
  { id: 'sami', label: 'Sámi', flag: '🇳🇴', region: 'Northern Europe', indigenous: true },
  { id: 'hawaiian', label: 'Hawaiian', flag: '🇺🇸', region: 'Oceania', indigenous: true },
];

// Helper functions
export const getLanguageById = (id) => {
  return WORLD_LANGUAGES.find(lang => lang.id === id);
};

export const getIndigenousLanguages = () => {
  return WORLD_LANGUAGES.filter(lang => lang.indigenous);
};

export const getLanguagesByRegion = (region) => {
  return WORLD_LANGUAGES.filter(lang => lang.region === region);
};

export const getBorneoLanguages = () => {
  return WORLD_LANGUAGES.filter(lang => lang.region === 'Borneo');
};

export const getMajorLanguages = () => {
  return WORLD_LANGUAGES.filter(lang => 
    ['english', 'mandarin', 'spanish', 'hindi', 'arabic', 'french', 'german', 'japanese', 'korean', 'portuguese'].includes(lang.id)
  );
};
