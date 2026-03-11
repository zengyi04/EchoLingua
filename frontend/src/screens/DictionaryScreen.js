import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { WORLD_LANGUAGES } from '../constants/languages';
import {
  TRANSLATION_LANGUAGE_OPTIONS,
  getLanguageLabelById,
} from '../constants/translationLanguages';
import { dictionaryApiService } from '../services/dictionaryApiService';

const CORE_WORD_TEMPLATES = [
  { key: 'hello', word: 'Hello', translation: 'Hello', pronunciation: 'heh-loh', partOfSpeech: 'Greeting', category: 'Greetings' },
  { key: 'thanks', word: 'Thank you', translation: 'Thank you', pronunciation: 'thangk-yoo', partOfSpeech: 'Expression', category: 'Expressions' },
  { key: 'family', word: 'Family', translation: 'Family', pronunciation: 'fa-muh-lee', partOfSpeech: 'Noun', category: 'Family' },
  { key: 'learn', word: 'Learn', translation: 'Learn', pronunciation: 'lurn', partOfSpeech: 'Verb', category: 'Learning' },
];

const BORNEO_LANGUAGE_ENTRIES = [
  {
    id: 'borneo-kadazan-1',
    word: 'Kotobian',
    language: 'Kadazan-Dusun',
    translation: 'Good morning',
    pronunciation: 'koh-toh-bee-ahn',
    partOfSpeech: 'Greeting',
    examples: ['Kotobian poinsian - Good morning to you'],
    relatedWords: ['Kotobian tadau - Good day', 'Kopiodong - Good evening'],
    category: 'Greetings',
  },
  {
    id: 'borneo-kadazan-2',
    word: 'Kaamatan',
    language: 'Kadazan-Dusun',
    translation: 'Harvest festival',
    pronunciation: 'kah-ah-mah-tahn',
    partOfSpeech: 'Noun',
    examples: ['Pesta Kaamatan - Harvest Festival'],
    relatedWords: ['Padi - Rice', 'Sumazau - Dance'],
    category: 'Culture',
  },
  {
    id: 'borneo-iban-1',
    word: 'Ngajat',
    language: 'Iban',
    translation: 'Traditional warrior dance',
    pronunciation: 'ngah-jaht',
    partOfSpeech: 'Noun',
    examples: ['Bengar ngajat - Dance the ngajat'],
    relatedWords: ['Gawai - Festival', 'Pua Kumbu - Textile'],
    category: 'Culture',
  },
  {
    id: 'borneo-bidayuh-1',
    word: 'Gawai',
    language: 'Bidayuh',
    translation: 'Festival celebration',
    pronunciation: 'gah-why',
    partOfSpeech: 'Noun',
    examples: ['Hari Gawai disambut setiap tahun.'],
    relatedWords: ['Tapai - Rice wine', 'Bamboo dance'],
    category: 'Culture',
  },
  {
    id: 'borneo-murut-1',
    word: 'Lansaran',
    language: 'Murut',
    translation: 'Traditional spring platform',
    pronunciation: 'lahn-sah-rahn',
    partOfSpeech: 'Noun',
    examples: ['Minsibut di lansaran - Jump on the platform'],
    relatedWords: ['Magunatip - Dance', 'Sompoton - Instrument'],
    category: 'Culture',
  },
  {
    id: 'borneo-penan-1',
    word: 'Belian',
    language: 'Penan',
    translation: 'Traditional healer',
    pronunciation: 'beh-lee-ahn',
    partOfSpeech: 'Noun',
    examples: ['Belian memimpin upacara komuniti.'],
    relatedWords: ['Ritual', 'Heritage'],
    category: 'Culture',
  },
];

const GENERATED_WORLD_LANGUAGE_ENTRIES = WORLD_LANGUAGES.flatMap((language) =>
  CORE_WORD_TEMPLATES.map((template) => ({
    id: `world-${language.id}-${template.key}`,
    word: template.word,
    language: language.label,
    translation: template.translation,
    pronunciation: template.pronunciation,
    partOfSpeech: template.partOfSpeech,
    examples: [`${template.word} in ${language.label} context.`],
    relatedWords: ['Culture', 'Community', 'Heritage'],
    category: template.category,
  }))
);

const DICTIONARY_DATA = [...BORNEO_LANGUAGE_ENTRIES, ...GENERATED_WORLD_LANGUAGE_ENTRIES];

const COMMUNITY_ENTRIES_KEY = 'dictionaryCommunityEntries';
const USER_STORAGE_KEY = '@echolingua_current_user';
const DICTIONARY_LANGUAGE_IDS_KEY = 'dictionaryTrackedLanguageIds';
const MY_SUBMITTED_API_IDS_KEY = 'dictionaryMySubmittedApiIds';

const sortWordsAtoZ = (items) =>
  [...items].sort((a, b) => a.word.localeCompare(b.word, undefined, { sensitivity: 'base' }));

const parseWordsFromText = (text) => {
  if (!text) return [];

  const cleaned = text
    .replace(/[^A-Za-z0-9\s'\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return [];

  const parts = cleaned.split(' ').filter((part) => part.length > 0);
  const unique = [];
  const seen = new Set();

  parts.forEach((part) => {
    const key = part.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(part);
    }
  });

  return unique;
};

const normalizeLanguageId = (value) => {
  if (!value) return 'kadazan-demo';
  return String(value).trim().toLowerCase().replace(/\s+/g, '-');
};

const dedupeById = (entries = []) => {
  const seen = new Set();
  const result = [];
  entries.forEach((item) => {
    const id = item?.id;
    if (!id || seen.has(id)) return;
    seen.add(id);
    result.push(item);
  });
  return result;
};

const mapApiEntryToWord = (entry) => {
  const languageId = normalizeLanguageId(entry?.language_id || 'kadazan-demo');
  const languageLabel = getLanguageLabelById(languageId);
  const english = entry?.translation_english || '';
  const malay = entry?.translation_malay || '';

  return {
    id: entry?.id,
    apiEntryId: entry?.id,
    word: entry?.word || 'Unknown',
    language: languageLabel,
    translation: english || malay || 'No translation',
    pronunciation: 'N/A',
    partOfSpeech: entry?.pos || 'Unknown',
    examples: [
      english ? `English: ${english}` : null,
      malay ? `Malay: ${malay}` : null,
    ].filter(Boolean),
    relatedWords: [],
    category: 'Community',
    meaningAndUsage: english || malay || '',
    culturalContext: entry?.cultural_note || '',
    pronunciationAudioUri: entry?.source_audio_url || null,
    pronunciationAudioName: entry?.source_audio_url ? 'Source audio' : null,
    verificationStatus: entry?.status === 'verified' ? 'Verified by language expert' : 'Pending expert review',
    statusRaw: entry?.status || 'pending_verification',
    source: 'api',
    createdAt: entry?.created_at || new Date().toISOString(),
    createdByUserId: entry?.created_by_user_id || null,
    createdByName: entry?.created_by_name || null,
    verifiedByUserId: entry?.verified_by_user_id || null,
    verifiedByName: entry?.verified_by_name || null,
    verifiedByRole: entry?.verified_by_role || null,
    verifiedAt: entry?.verified_at || null,
  };
};

export default function DictionaryScreen({ navigation }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [languageMenuQuery, setLanguageMenuQuery] = useState('');
  const [showSearchPage, setShowSearchPage] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedWord, setSelectedWord] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [communityEntries, setCommunityEntries] = useState([]);
  const [dictionaryApiEntries, setDictionaryApiEntries] = useState([]);
  const [showDocumentationProject, setShowDocumentationProject] = useState(false);
  const [isDictionarySyncing, setIsDictionarySyncing] = useState(false);
  const [dictionaryLanguageIds, setDictionaryLanguageIds] = useState(['kadazan-demo']);
  const [newWord, setNewWord] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newMeaningUsage, setNewMeaningUsage] = useState('');
  const [newPronunciation, setNewPronunciation] = useState('');
  const [newCulturalContext, setNewCulturalContext] = useState('');
  const [uploadedPronunciation, setUploadedPronunciation] = useState(null);
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [sourceLanguageId, setSourceLanguageId] = useState('english');
  const [targetLanguageId, setTargetLanguageId] = useState('malay');
  const [currentUserRole, setCurrentUserRole] = useState('learner');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [mySubmittedApiIds, setMySubmittedApiIds] = useState([]);
  const [activePronunciationWordId, setActivePronunciationWordId] = useState(null);
  const [isPronunciationPlaying, setIsPronunciationPlaying] = useState(false);
  const [pronunciationRecording, setPronunciationRecording] = useState(null);
  const [isRecordingPronunciation, setIsRecordingPronunciation] = useState(false);
  const pronunciationSoundRef = useRef(null);

  const dictionaryWords = useMemo(() => {
    const merged = [...DICTIONARY_DATA, ...communityEntries, ...dictionaryApiEntries];
    return sortWordsAtoZ(merged);
  }, [communityEntries, dictionaryApiEntries]);

  useEffect(() => {
    loadFavorites();
    loadRecentSearches();
    loadCommunityEntries();
    loadCurrentUserRole();

    const initializeTrackedLanguages = async () => {
      try {
        const stored = await AsyncStorage.getItem(DICTIONARY_LANGUAGE_IDS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const normalizedIds = Array.from(new Set(parsed.map((id) => normalizeLanguageId(id))));
            setDictionaryLanguageIds(normalizedIds);
            await loadDictionaryApiEntries(normalizedIds);
            return;
          }
        }
      } catch (error) {
        console.error('Load tracked dictionary languages error:', error);
      }

      await loadDictionaryApiEntries(['kadazan-demo']);
    };

    initializeTrackedLanguages();
  }, []);

  useEffect(() => {
    return () => {
      if (pronunciationSoundRef.current) {
        pronunciationSoundRef.current.unloadAsync();
      }
      if (pronunciationRecording) {
        pronunciationRecording.stopAndUnloadAsync();
      }
    };
  }, [pronunciationRecording]);

  useEffect(() => {
    const loadMySubmittedApiIds = async () => {
      if (!currentUserId) {
        setMySubmittedApiIds([]);
        return;
      }

      try {
        const storageKey = `${MY_SUBMITTED_API_IDS_KEY}:${currentUserId}`;
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setMySubmittedApiIds(parsed);
            return;
          }
        }
      } catch (error) {
        console.error('Load submitted API IDs error:', error);
      }

      setMySubmittedApiIds([]);
    };

    loadMySubmittedApiIds();
  }, [currentUserId]);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem('dictionaryFavorites');
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Load favorites error:', error);
    }
  };

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem('recentSearches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Load recent searches error:', error);
    }
  };

  const loadCommunityEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem(COMMUNITY_ENTRIES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCommunityEntries(parsed);
        }
      }
    } catch (error) {
      console.error('Load community entries error:', error);
    }
  };

  const saveCommunityEntries = async (entries) => {
    try {
      await AsyncStorage.setItem(COMMUNITY_ENTRIES_KEY, JSON.stringify(entries));
      setCommunityEntries(entries);
    } catch (error) {
      console.error('Save community entries error:', error);
      Alert.alert('Save Failed', 'Unable to store your contribution locally. Please try again.');
    }
  };

  const loadCurrentUserRole = async () => {
    try {
      const rawUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (!rawUser) {
        setCurrentUserRole('learner');
        setCurrentUserId(null);
        setCurrentUserName('');
        return;
      }

      const parsed = JSON.parse(rawUser);
      setCurrentUserRole(parsed?.role || 'learner');
      setCurrentUserId(String(parsed?.id || parsed?._id || '').trim() || null);
      setCurrentUserName(parsed?.name || parsed?.fullName || '');
    } catch (error) {
      console.error('Load current user role error:', error);
      setCurrentUserRole('learner');
      setCurrentUserId(null);
      setCurrentUserName('');
    }
  };

  const loadDictionaryApiEntries = async (languageIds = dictionaryLanguageIds) => {
    try {
      setIsDictionarySyncing(true);
      const normalizedIds = Array.from(
        new Set((languageIds || ['kadazan-demo']).map((id) => normalizeLanguageId(id)))
      );

      const results = await Promise.all(
        normalizedIds.map((languageId) => dictionaryApiService.getEntries({ languageId }))
      );

      const mergedRaw = results.flatMap((list) => (Array.isArray(list) ? list : []));
      const mapped = dedupeById(mergedRaw.map(mapApiEntryToWord));
      setDictionaryApiEntries(sortWordsAtoZ(mapped));
    } catch (error) {
      console.error('Load dictionary API entries error:', error);
    } finally {
      setIsDictionarySyncing(false);
    }
  };

  const persistTrackedLanguageIds = async (languageIds) => {
    try {
      const normalizedIds = Array.from(
        new Set((languageIds || ['kadazan-demo']).map((id) => normalizeLanguageId(id)))
      );
      await AsyncStorage.setItem(DICTIONARY_LANGUAGE_IDS_KEY, JSON.stringify(normalizedIds));
    } catch (error) {
      console.error('Persist tracked dictionary languages error:', error);
    }
  };

  const persistMySubmittedApiIds = async (ids) => {
    if (!currentUserId) return;

    try {
      const storageKey = `${MY_SUBMITTED_API_IDS_KEY}:${currentUserId}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(ids));
    } catch (error) {
      console.error('Persist submitted API IDs error:', error);
    }
  };

  const findEntryAcrossLanguages = async (entryId, languageIds = dictionaryLanguageIds) => {
    const normalizedIds = Array.from(
      new Set((languageIds || ['kadazan-demo']).map((id) => normalizeLanguageId(id)))
    );

    const results = await Promise.all(
      normalizedIds.map((languageId) => dictionaryApiService.getEntries({ languageId }))
    );

    const mergedRaw = results.flatMap((list) => (Array.isArray(list) ? list : []));
    return mergedRaw.find((item) => item?.id === entryId) || null;
  };

  const userCanVerifyEntries =
    currentUserRole === 'admin' || currentUserRole === 'moderator' || currentUserRole === 'language_expert';

  const verifyCommunityEntry = async (entry) => {
    if (!userCanVerifyEntries) {
      Alert.alert('Moderator Access', 'Only moderators or language experts can verify entries.');
      return;
    }

    if (!entry) {
      return;
    }

    if (entry.source === 'api' && entry.apiEntryId) {
      try {
        await dictionaryApiService.verifyEntry(entry.apiEntryId);
        await loadDictionaryApiEntries();
        if (selectedWord?.id === entry.id) {
          const updated = await findEntryAcrossLanguages(entry.apiEntryId);
          if (updated) {
            setSelectedWord(mapApiEntryToWord(updated));
          }
        }
        Alert.alert('Verified', 'Entry verified successfully in backend dictionary.');
      } catch (error) {
        console.error('Verify API dictionary entry error:', error);
        Alert.alert('Verification Failed', error?.message || 'Could not verify this entry.');
      }
      return;
    }

    const updatedEntries = communityEntries.map((item) => {
      if (item.id !== entry.id) {
        return item;
      }

      return {
        ...item,
        verificationStatus: 'Verified by language expert',
        verifiedAt: new Date().toISOString(),
      };
    });

    await saveCommunityEntries(updatedEntries);

    if (selectedWord?.id === entry.id) {
      const verifiedEntry = updatedEntries.find((item) => item.id === entry.id);
      if (verifiedEntry) {
        setSelectedWord(verifiedEntry);
      }
    }
  };

  const rejectApiEntry = async (entry) => {
    if (!userCanVerifyEntries) {
      Alert.alert('Moderator Access', 'Only moderators or language experts can reject entries.');
      return;
    }

    if (!entry?.apiEntryId) {
      Alert.alert('Unavailable', 'This entry is not linked to backend dictionary API.');
      return;
    }

    try {
      await dictionaryApiService.deleteEntry(entry.apiEntryId);
      await loadDictionaryApiEntries();
      setSelectedWord(null);
      Alert.alert('Entry Removed', 'The dictionary entry was deleted from backend review queue.');
    } catch (error) {
      console.error('Delete API dictionary entry error:', error);
      Alert.alert('Delete Failed', error?.message || 'Could not delete this entry.');
    }
  };

  const refreshWordStatus = async () => {
    if (!selectedWord?.apiEntryId) return;
    try {
      setIsRefreshingStatus(true);
      const fresh = await findEntryAcrossLanguages(selectedWord.apiEntryId);
      if (fresh?.id) {
        const mapped = mapApiEntryToWord(fresh);
        setSelectedWord(mapped);
        setDictionaryApiEntries((prev) =>
          prev.map((item) => (item.id === mapped.id ? mapped : item))
        );
      }
    } catch (error) {
      console.error('Refresh word status error:', error);
      Alert.alert('Refresh Failed', 'Could not check latest status. Please try again.');
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  const saveFavorites = async (newFavorites) => {
    try {
      await AsyncStorage.setItem('dictionaryFavorites', JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Save favorites error:', error);
    }
  };

  const saveRecentSearch = async (word) => {
    try {
      const updated = [word, ...recentSearches.filter((w) => w !== word)].slice(0, 10);
      await AsyncStorage.setItem('recentSearches', JSON.stringify(updated));
      setRecentSearches(updated);
    } catch (error) {
      console.error('Save recent search error:', error);
    }
  };

  const toggleFavorite = (wordId) => {
    const isFavorite = favorites.includes(wordId);
    const newFavorites = isFavorite
      ? favorites.filter((id) => id !== wordId)
      : [...favorites, wordId];
    saveFavorites(newFavorites);
  };

  const handleWordPress = (word) => {
    setSelectedWord(word);
    saveRecentSearch(word.word);
  };

  const playPronunciation = async (word) => {
    try {
      if (word.pronunciationAudioUri) {
        // Toggle pause/play if this word's audio is already loaded.
        if (pronunciationSoundRef.current && activePronunciationWordId === word.id) {
          if (isPronunciationPlaying) {
            await pronunciationSoundRef.current.pauseAsync();
            setIsPronunciationPlaying(false);
          } else {
            await pronunciationSoundRef.current.playAsync();
            setIsPronunciationPlaying(true);
          }
          return;
        }

        if (pronunciationSoundRef.current) {
          await pronunciationSoundRef.current.unloadAsync();
        }

        const { sound } = await Audio.Sound.createAsync(
          { uri: word.pronunciationAudioUri },
          { shouldPlay: true }
        );

        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          setIsPronunciationPlaying(status.isPlaying);

          if (status.didJustFinish) {
            setIsPronunciationPlaying(false);
            setActivePronunciationWordId(null);
          }
        });

        pronunciationSoundRef.current = sound;
        setActivePronunciationWordId(word.id);
        setIsPronunciationPlaying(true);
        return;
      }

      Alert.alert('Pronunciation', `Playing pronunciation for: ${word.word}\n${word.pronunciation}`);
    } catch (error) {
      console.error('Play pronunciation error:', error);
      Alert.alert('Audio Error', 'Unable to play pronunciation audio on this device.');
    }
  };

  const startPronunciationRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Needed', 'Microphone permission is required to record pronunciation.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      setPronunciationRecording(recording);
      setIsRecordingPronunciation(true);
    } catch (error) {
      console.error('Start pronunciation recording error:', error);
      Alert.alert('Recording Error', 'Could not start pronunciation recording.');
    }
  };

  const stopPronunciationRecording = async () => {
    try {
      if (!pronunciationRecording) {
        return;
      }

      await pronunciationRecording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = pronunciationRecording.getURI();
      const filename = `pronunciation-${Date.now()}.m4a`;

      if (uri) {
        setUploadedPronunciation({
          uri,
          name: filename,
          mimeType: 'audio/m4a',
        });
      }

      setPronunciationRecording(null);
      setIsRecordingPronunciation(false);
    } catch (error) {
      console.error('Stop pronunciation recording error:', error);
      Alert.alert('Recording Error', 'Could not save pronunciation recording.');
      setIsRecordingPronunciation(false);
      setPronunciationRecording(null);
    }
  };

  const resetContributionForm = () => {
    setNewWord('');
    setNewLanguage('');
    setNewMeaningUsage('');
    setNewPronunciation('');
    setNewCulturalContext('');
    setUploadedPronunciation(null);
    setIsRecordingPronunciation(false);
    setPronunciationRecording(null);
  };

  const pickPronunciationAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setUploadedPronunciation(result.assets[0]);
      }
    } catch (error) {
      console.error('Pick pronunciation audio error:', error);
      Alert.alert('Upload Error', 'Could not select pronunciation audio.');
    }
  };

  const addCommunityEntry = async () => {
    if (!newWord.trim() || !newLanguage.trim() || !newMeaningUsage.trim()) {
      Alert.alert('Incomplete Form', 'Please fill in word, language, and meaning/usage.');
      return;
    }

    try {
      setIsSubmittingEntry(true);
      const submittedLanguageId = normalizeLanguageId(newLanguage.trim());
      const response = uploadedPronunciation?.uri
        ? await dictionaryApiService.elicitFromAudio({
            fileUri: uploadedPronunciation.uri,
            fileName: uploadedPronunciation.name,
            mimeType: uploadedPronunciation.mimeType,
          })
        : await dictionaryApiService.elicitFromText({
            anchorText: newMeaningUsage.trim(),
            indigenousResponse: newWord.trim(),
            languageId: submittedLanguageId,
          });

      const draftEntry = response?.draft_dictionary_entry;
      if (!draftEntry) {
        throw new Error('Backend did not return a dictionary draft entry.');
      }

      const mapped = mapApiEntryToWord(draftEntry);
      setDictionaryApiEntries((prev) => {
        const withoutDup = prev.filter((item) => item.id !== mapped.id);
        return sortWordsAtoZ([mapped, ...withoutDup]);
      });

      if (mapped?.id) {
        setMySubmittedApiIds((prev) => {
          const next = Array.from(new Set([mapped.id, ...prev]));
          persistMySubmittedApiIds(next);
          return next;
        });
      }

      const responseLanguageId = normalizeLanguageId(draftEntry?.language_id || submittedLanguageId || 'kadazan-demo');
      const syncIds = [responseLanguageId, submittedLanguageId || 'kadazan-demo'];
      const nextLanguageIds = Array.from(new Set([...dictionaryLanguageIds, ...syncIds]));
      setDictionaryLanguageIds(nextLanguageIds);
      await persistTrackedLanguageIds(nextLanguageIds);
      await loadDictionaryApiEntries(nextLanguageIds);

      resetContributionForm();
      setShowDocumentationProject(false);
      // Navigate directly to word detail so the user can see the verification progress
      setSelectedWord(mapped);
    } catch (error) {
      console.error('Create dictionary entry via API error:', error);
      Alert.alert('Submission Failed', error?.message || 'Could not submit to API. Please try again.');
    } finally {
      setIsSubmittingEntry(false);
    }
  };

  const openScanOptions = () => {
    navigation.navigate('ScanImage');
  };

  const mineWords = dictionaryWords.filter((word) => {
    if (!currentUserId) return false;
    const createdByMatches = String(word?.createdByUserId || '').trim() === currentUserId;
    const isTrackedSubmitted = mySubmittedApiIds.includes(word?.id);
    return createdByMatches || isTrackedSubmitted;
  });

  const mineVerifiedCount = mineWords.filter((word) => word?.statusRaw === 'verified').length;
  const minePendingCount = mineWords.length - mineVerifiedCount;

  const filteredWords = dictionaryWords.filter((word) => {
    const matchesLanguage = selectedLanguage === 'all' || word.language === selectedLanguage;
    const matchesCategory = selectedCategory === 'all' || word.category === selectedCategory;
    const createdByMatches = String(word?.createdByUserId || '').trim() === currentUserId;
    const isTrackedSubmitted = mySubmittedApiIds.includes(word?.id);
    const matchesOwnership = viewMode === 'all' || createdByMatches || isTrackedSubmitted;

    return matchesLanguage && matchesCategory && matchesOwnership;
  });

  const sortedFilteredWords = sortWordsAtoZ(filteredWords);
  const sortedSearchResults = sortWordsAtoZ(
    filteredWords.filter((word) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return false;
      return (
        word.word.toLowerCase().includes(query) ||
        word.translation.toLowerCase().includes(query)
      );
    })
  );

  const renderWordCard = ({ item }) => (
    <TouchableOpacity style={[styles.wordCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => handleWordPress(item)} activeOpacity={0.8}>
      <View style={styles.wordCardHeader}>
        <View style={styles.wordCardInfo}>
          <Text style={[styles.wordText, { color: theme.text }]}>{item.word}</Text>
          <Text style={[styles.translationText, { color: theme.textSecondary }]}>{item.translation}</Text>
          <Text style={[styles.languageText, { color: theme.primary }]}>{item.language}</Text>
          {item.verificationStatus ? (
            <Text style={[styles.verificationBadge, { color: theme.warning || '#F59E0B' }]}>{item.verificationStatus}</Text>
          ) : null}
        </View>
        <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
          <Ionicons
            name={favorites.includes(item.id) ? 'heart' : 'heart-outline'}
            size={24}
            color={favorites.includes(item.id) ? theme.error || '#FF6B6B' : theme.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderWordDetail = () => {
    if (!selectedWord) return null;

    const isVerified =
      selectedWord.statusRaw === 'verified' ||
      selectedWord.verificationStatus === 'Verified by language expert';

    const verificationStages = [
      { key: 'submitted', label: 'Submitted', done: true },
      { key: 'review', label: 'Under Review', done: isVerified, active: !isVerified },
      { key: 'verified', label: 'Verified', done: isVerified },
    ];

    return (
      <View style={[styles.detailContainer, { backgroundColor: theme.background }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setSelectedWord(null)}>
              <Ionicons name="arrow-back" size={28} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.detailTitle, { color: theme.text }]}>Word Details</Text>
            <TouchableOpacity onPress={() => toggleFavorite(selectedWord.id)}>
              <Ionicons
                name={favorites.includes(selectedWord.id) ? 'heart' : 'heart-outline'}
                size={28}
                color={favorites.includes(selectedWord.id) ? theme.error || '#FF6B6B' : theme.text}
              />
            </TouchableOpacity>
          </View>

          {/* Word Card */}
          <View style={[styles.detailCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.detailWord, { color: theme.text }]}>{selectedWord.word}</Text>
            <Text style={[styles.detailTranslation, { color: theme.textSecondary }]}>{selectedWord.translation}</Text>
            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Language</Text>
                <Text style={[styles.metaValue, { color: theme.primary }]}>{selectedWord.language}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Type</Text>
                <Text style={[styles.metaValue, { color: theme.primary }]}>{selectedWord.partOfSpeech}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Category</Text>
                <Text style={[styles.metaValue, { color: theme.primary }]}>{selectedWord.category}</Text>
              </View>
            </View>
          </View>

          {/* Verification Progress Banner — shown right away for API entries */}
          {selectedWord.source === 'api' ? (
            <View style={[
              styles.verificationBanner,
              {
                backgroundColor: isVerified ? (theme.successLight || '#D1FAE5') : (theme.warningLight || '#FEF3C7'),
                borderColor: isVerified ? (theme.success || '#10B981') : (theme.warning || '#F59E0B'),
              },
            ]}>
              <View style={styles.verificationBannerHeader}>
                <Ionicons
                  name={isVerified ? 'checkmark-circle' : 'time-outline'}
                  size={22}
                  color={isVerified ? (theme.success || '#10B981') : (theme.warning || '#F59E0B')}
                />
                <Text style={[
                  styles.verificationBannerTitle,
                  { color: isVerified ? (theme.success || '#10B981') : (theme.warning || '#F59E0B') },
                ]}>
                  {isVerified ? 'Verified by Language Expert' : 'Pending Verification'}
                </Text>
              </View>

              {/* 3-step progress track */}
              <View style={styles.verificationTrack}>
                {verificationStages.map((stage, idx) => (
                  <React.Fragment key={stage.key}>
                    <View style={styles.verificationTrackStep}>
                      <View style={[
                        styles.verificationTrackDot,
                        {
                          backgroundColor: stage.done
                            ? (theme.success || '#10B981')
                            : stage.active
                            ? (theme.warning || '#F59E0B')
                            : (theme.border || '#E5E7EB'),
                        },
                      ]}>
                        {stage.done ? (
                          <Ionicons name="checkmark" size={10} color="#fff" />
                        ) : stage.active ? (
                          <Ionicons name="time" size={10} color="#fff" />
                        ) : null}
                      </View>
                      <Text style={[
                        styles.verificationTrackLabel,
                        {
                          color: stage.done
                            ? (theme.success || '#10B981')
                            : stage.active
                            ? (theme.warning || '#F59E0B')
                            : theme.textSecondary,
                          fontWeight: stage.done || stage.active ? '700' : '400',
                        },
                      ]}>
                        {stage.label}
                      </Text>
                    </View>
                    {idx < verificationStages.length - 1 ? (
                      <View style={[
                        styles.verificationTrackLine,
                        {
                          backgroundColor: verificationStages[idx + 1].done || stage.done
                            ? (theme.success || '#10B981')
                            : (theme.border || '#E5E7EB'),
                        },
                      ]} />
                    ) : null}
                  </React.Fragment>
                ))}
              </View>

              {!isVerified ? (
                <Text style={[styles.verificationBannerHint, { color: theme.textSecondary }]}>
                  A language expert will review your entry. Estimated wait: 24 – 72 hours.
                </Text>
              ) : (
                <Text style={[styles.verificationBannerHint, { color: theme.success || '#10B981' }]}>
                  This word has been approved and is now part of the Living Dictionary.
                </Text>
              )}

              <View style={[styles.verifierMetaCard, { borderColor: theme.border }]}> 
                <Text style={[styles.verifierMetaText, { color: theme.textSecondary }]}>Submitted by: {selectedWord.createdByName || 'Community contributor'}</Text>
                {isVerified ? (
                  <Text style={[styles.verifierMetaText, { color: theme.textSecondary }]}>Verified by: {selectedWord.verifiedByName || 'Language expert'}{selectedWord.verifiedByRole ? ` (${selectedWord.verifiedByRole})` : ''}</Text>
                ) : (
                  <Text style={[styles.verifierMetaText, { color: theme.textSecondary }]}>Review team: language expert / moderator / admin</Text>
                )}
                {selectedWord.verifiedAt ? (
                  <Text style={[styles.verifierMetaText, { color: theme.textSecondary }]}>Verified at: {new Date(selectedWord.verifiedAt).toLocaleString()}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={[styles.refreshStatusBtn, { borderColor: isVerified ? (theme.success || '#10B981') : (theme.warning || '#F59E0B') }]}
                onPress={refreshWordStatus}
                disabled={isRefreshingStatus}
              >
                {isRefreshingStatus ? (
                  <ActivityIndicator size="small" color={isVerified ? (theme.success || '#10B981') : (theme.warning || '#F59E0B')} />
                ) : (
                  <Ionicons name="refresh" size={16} color={isVerified ? (theme.success || '#10B981') : (theme.warning || '#F59E0B')} />
                )}
                <Text style={[styles.refreshStatusText, { color: isVerified ? (theme.success || '#10B981') : (theme.warning || '#F59E0B') }]}>
                  {isRefreshingStatus ? 'Checking...' : 'Refresh Status'}
                </Text>
              </TouchableOpacity>

              {(selectedWord.source === 'community' || selectedWord.source === 'api') && selectedWord.verificationStatus !== 'Verified by language expert' ? (
                <TouchableOpacity
                  style={[styles.secondaryActionBtn, { borderColor: theme.border, marginTop: SPACING.s }]}
                  onPress={() => verifyCommunityEntry(selectedWord)}
                  disabled={!userCanVerifyEntries}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={18}
                    color={userCanVerifyEntries ? theme.primary : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.secondaryActionText,
                      { color: userCanVerifyEntries ? theme.text : theme.textSecondary },
                    ]}
                  >
                    Expert Verify
                  </Text>
                </TouchableOpacity>
              ) : null}

              {selectedWord.source === 'api' && selectedWord.verificationStatus !== 'Verified by language expert' ? (
                <TouchableOpacity
                  style={[styles.secondaryActionBtn, { borderColor: theme.border, marginTop: SPACING.s }]}
                  onPress={() => rejectApiEntry(selectedWord)}
                  disabled={!userCanVerifyEntries}
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={userCanVerifyEntries ? (theme.error || '#EF4444') : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.secondaryActionText,
                      { color: userCanVerifyEntries ? (theme.error || '#EF4444') : theme.textSecondary },
                    ]}
                  >
                    Reject Entry
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {/* Pronunciation */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Pronunciation</Text>
            <View style={[styles.pronunciationCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pronunciationText, { color: theme.text }]}>{selectedWord.pronunciation}</Text>
                <Text style={[styles.pronunciationHint, { color: theme.textSecondary }]}>
                  {selectedWord.pronunciationAudioUri
                    ? activePronunciationWordId === selectedWord.id && isPronunciationPlaying
                      ? 'Playing uploaded pronunciation'
                      : 'Tap to play or pause uploaded pronunciation'
                    : 'No uploaded audio. Text pronunciation only.'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.playBtn}
                onPress={() => playPronunciation(selectedWord)}
              >
                <Ionicons
                  name={
                    selectedWord.pronunciationAudioUri
                      ? activePronunciationWordId === selectedWord.id && isPronunciationPlaying
                        ? 'pause-circle'
                        : 'play-circle'
                      : 'play-circle-outline'
                  }
                  size={48}
                  color={theme.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {selectedWord.meaningAndUsage ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Meaning and Usage</Text>
              <View style={[styles.exampleCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
                <Text style={[styles.exampleText, { color: theme.text }]}>{selectedWord.meaningAndUsage}</Text>
              </View>
            </View>
          ) : null}

          {selectedWord.culturalContext ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Cultural Context</Text>
              <View style={[styles.exampleCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
                <Text style={[styles.exampleText, { color: theme.text }]}>{selectedWord.culturalContext}</Text>
              </View>
            </View>
          ) : null}

          {selectedWord.pronunciationAudioName ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Uploaded Pronunciation</Text>
              <View style={[styles.relatedCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
                <Text style={[styles.relatedText, { color: theme.text }]}>Audio file: {selectedWord.pronunciationAudioName}</Text>
              </View>
            </View>
          ) : null}

          {/* Examples */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Examples</Text>
            {(selectedWord.examples || []).map((example, index) => (
              <View key={index} style={[styles.exampleCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.exampleText, { color: theme.text }]}>{example}</Text>
              </View>
            ))}
          </View>

          {/* Related Words */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Related Words</Text>
            {(selectedWord.relatedWords || []).map((related, index) => (
              <View key={index} style={[styles.relatedCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.relatedText, { color: theme.text }]}>{related}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      </View>
    );
  };

  if (selectedWord) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {renderWordDetail()}
      </SafeAreaView>
    );
  }

  const categories = ['all', ...new Set(dictionaryWords.map((w) => w.category))];
  const languages = ['all', ...new Set(dictionaryWords.map((w) => w.language))];
  const filteredLanguageOptions = languages.filter((lang) => {
    if (lang === 'all') return true;
    const q = languageMenuQuery.trim().toLowerCase();
    if (!q) return true;
    return lang.toLowerCase().includes(q);
  });
  const localVerifiedCount = communityEntries.filter((entry) => entry.verificationStatus === 'Verified by language expert').length;
  const apiVerifiedCount = dictionaryApiEntries.filter((entry) => entry.statusRaw === 'verified').length;
  const apiPendingCount = dictionaryApiEntries.filter((entry) => entry.statusRaw !== 'verified').length;
  const verifiedCount = localVerifiedCount + apiVerifiedCount;
  const pendingCount = (communityEntries.length - localVerifiedCount) + apiPendingCount;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      {!showSearchPage ? (
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('MainTabs', { screen: 'HomeTab' });
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Dictionary</Text>
          <TouchableOpacity onPress={() => Alert.alert('Info', `${dictionaryWords.length} words available`)}>
            <Ionicons name="information-circle" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>
      ) : null}

      {showSearchPage ? (
        <View style={[styles.searchPageContainer, { backgroundColor: theme.background }]}> 
          <View style={[styles.searchPageHeader, { borderBottomColor: theme.border }]}> 
            <TouchableOpacity onPress={() => setShowSearchPage(false)} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <View style={[styles.searchPageInputWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
              <Ionicons name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchPageInput, { color: theme.text }]}
                placeholder="Type word or meaning..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                returnKeyType="search"
                onSubmitEditing={() => {
                  if (searchQuery.trim()) {
                    saveRecentSearch(searchQuery.trim());
                  }
                }}
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={openScanOptions} style={{ marginLeft: 2 }}>
                <Ionicons name="camera" size={18} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {recentSearches.length > 0 ? (
            <View style={styles.recentContainer}>
              <Text style={[styles.recentTitle, { color: theme.textSecondary }]}>Recent Searches</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recentSearches.map((word, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.recentChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => {
                      setSearchQuery(word);
                    }}
                  >
                    <Text style={[styles.recentChipText, { color: theme.text }]}>{word}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={[styles.resultsBanner, { backgroundColor: theme.surfaceVariant }]}> 
            <Text style={[styles.resultsText, { color: theme.textSecondary }]}> 
              {searchQuery.trim().length > 0
                ? `${sortedSearchResults.length} result${sortedSearchResults.length !== 1 ? 's' : ''} found`
                : 'Start typing to search'}
            </Text>
          </View>

          <FlatList
            data={sortedSearchResults}
            renderItem={renderWordCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <FontAwesome5 name="search" size={42} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No search result yet</Text>
                <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>Try another keyword</Text>
              </View>
            }
          />
        </View>
      ) : null}

      {!showSearchPage ? (
        <>

      <View style={styles.modeSwitchWrap}>
        <TouchableOpacity
          style={[
            styles.modeSwitchBtn,
            {
              borderBottomColor: viewMode === 'all' ? theme.primary : 'transparent',
            },
          ]}
          onPress={() => setViewMode('all')}
        >
          <Text style={[styles.modeSwitchText, { color: viewMode === 'all' ? theme.primary : theme.textSecondary }]}>All Words</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeSwitchBtn,
            {
              borderBottomColor: viewMode === 'mine' ? theme.primary : 'transparent',
            },
          ]}
          onPress={() => setViewMode('mine')}
        >
          <Text style={[styles.modeSwitchText, { color: viewMode === 'mine' ? theme.primary : theme.textSecondary }]}>My Contributions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.searchModeBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
          onPress={() => setShowSearchPage(true)}
        >
          <Ionicons name="search" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {viewMode === 'mine' ? (
        <View style={[styles.myContributionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <Text style={[styles.myContributionTitle, { color: theme.text }]}>My Words</Text>
          <View style={styles.myContributionStatsRow}>
            <View style={[styles.myContributionStatBox, { borderColor: theme.border }]}> 
              <Text style={[styles.myContributionStatNumber, { color: theme.primary }]}>{mineWords.length}</Text>
              <Text style={[styles.myContributionStatLabel, { color: theme.textSecondary }]}>Total</Text>
            </View>
            <View style={[styles.myContributionStatBox, { borderColor: theme.border }]}> 
              <Text style={[styles.myContributionStatNumber, { color: theme.warning || '#F59E0B' }]}>{minePendingCount}</Text>
              <Text style={[styles.myContributionStatLabel, { color: theme.textSecondary }]}>Pending</Text>
            </View>
            <View style={[styles.myContributionStatBox, { borderColor: theme.border }]}> 
              <Text style={[styles.myContributionStatNumber, { color: theme.success || '#10B981' }]}>{mineVerifiedCount}</Text>
              <Text style={[styles.myContributionStatLabel, { color: theme.textSecondary }]}>Verified</Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* Language Filter */}
      <View style={{ paddingHorizontal: SPACING.l, marginBottom: SPACING.s }}>
        <TouchableOpacity
          style={[styles.filterToggleBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
          onPress={() => setShowLanguageMenu(true)}
        >
          <Text style={[styles.filterToggleText, { color: theme.text }]}>Language: {selectedLanguage === 'all' ? 'All' : selectedLanguage}</Text>
          <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <View style={{ paddingHorizontal: SPACING.l, marginBottom: SPACING.m }}>
        <TouchableOpacity
          style={[styles.filterToggleBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
          onPress={() => setShowCategoryMenu(true)}
        >
          <Text style={[styles.filterToggleText, { color: theme.text }]}>Category: {selectedCategory === 'all' ? 'All' : selectedCategory}</Text>
          <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showLanguageMenu}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowLanguageMenu(false);
          setLanguageMenuQuery('');
        }}
      >
        <Pressable
          style={styles.menuBackdrop}
          onPress={() => {
            setShowLanguageMenu(false);
            setLanguageMenuQuery('');
          }}
        >
          <Pressable style={[styles.menuCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.menuTitle, { color: theme.text }]}>Select Language</Text>
            <View style={[styles.menuSearchWrap, { borderColor: theme.border, backgroundColor: theme.background }]}> 
              <Ionicons name="search" size={16} color={theme.textSecondary} />
              <TextInput
                style={[styles.menuSearchInput, { color: theme.text }]}
                placeholder="Search language..."
                placeholderTextColor={theme.textSecondary}
                value={languageMenuQuery}
                onChangeText={setLanguageMenuQuery}
                autoFocus
              />
              {languageMenuQuery ? (
                <TouchableOpacity onPress={() => setLanguageMenuQuery('')}>
                  <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>
            <ScrollView style={styles.menuList}>
              {filteredLanguageOptions.map((lang) => {
                const active = selectedLanguage === lang;
                return (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.menuItem, active ? { backgroundColor: theme.surfaceVariant } : null]}
                    onPress={() => {
                      setSelectedLanguage(lang);
                      setShowLanguageMenu(false);
                      setLanguageMenuQuery('');
                    }}
                  >
                    <Text style={[styles.menuItemText, { color: theme.text }]}>{lang === 'all' ? 'All Languages' : lang}</Text>
                    {active ? <Ionicons name="checkmark" size={18} color={theme.primary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showCategoryMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryMenu(false)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setShowCategoryMenu(false)}>
          <Pressable style={[styles.menuCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.menuTitle, { color: theme.text }]}>Select Category</Text>
            <ScrollView style={styles.menuList}>
              {categories.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.menuItem, active ? { backgroundColor: theme.surfaceVariant } : null]}
                    onPress={() => {
                      setSelectedCategory(cat);
                      setShowCategoryMenu(false);
                    }}
                  >
                    <Text style={[styles.menuItemText, { color: theme.text }]}>{cat === 'all' ? 'All Categories' : cat}</Text>
                    {active ? <Ionicons name="checkmark" size={18} color={theme.primary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Results Count */}
      <View style={[styles.resultsBanner, { backgroundColor: theme.surfaceVariant }]}>
        <Text style={[styles.resultsText, { color: theme.textSecondary }]}>
          {sortedFilteredWords.length} word{sortedFilteredWords.length !== 1 ? 's' : ''} found (A-Z)
        </Text>
        {isDictionarySyncing ? (
          <Text style={[styles.resultsText, { color: theme.textSecondary }]}>Syncing dictionary from API...</Text>
        ) : null}
      </View>

      {/* Words List */}
      <FlatList
        data={sortedFilteredWords}
        renderItem={renderWordCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="book" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No words found</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>Try adjusting your search or filters</Text>
          </View>
        }
      />
      </>
      ) : null}

      {showDocumentationProject ? (
        <View style={[styles.floatingFormWrap, { top: insets.top + SPACING.xs }]}> 
          <View style={[styles.bottomFormCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
            <View style={styles.bottomFormHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.projectTitle, { color: theme.text }]}>Collaborative Dictionary Building</Text>
                <Text style={[styles.projectSubtitle, { color: theme.textSecondary }]}>Add words, meaning, usage and cultural context, then attach pronunciation by recording or uploading audio.</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowDocumentationProject(false)}
                style={[styles.closeFormBtn, { borderColor: theme.border }]}
              >
                <Ionicons name="close" size={18} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.bottomFormScroll}
              contentContainerStyle={styles.bottomFormScrollContent}
              showsVerticalScrollIndicator={false}
            >

            <View style={[styles.formSectionCard, { borderColor: theme.border, backgroundColor: theme.background }]}> 
              <Text style={[styles.formSectionTitle, { color: theme.text }]}>Word Information</Text>
              <Text style={[styles.formSectionHint, { color: theme.textSecondary }]}>Required fields are marked clearly so contributors can submit quickly.</Text>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Word *</Text>
              <TextInput
                style={[styles.formInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                placeholder="Enter the new word"
                placeholderTextColor={theme.textSecondary}
                value={newWord}
                onChangeText={setNewWord}
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Language *</Text>
              <TextInput
                style={[styles.formInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                placeholder="Example: Iban, Kadazan-Dusun"
                placeholderTextColor={theme.textSecondary}
                value={newLanguage}
                onChangeText={setNewLanguage}
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Meaning and Usage *</Text>
              <TextInput
                style={[styles.formInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface, minHeight: 88 }]}
                placeholder="Explain the meaning and how this word is used"
                placeholderTextColor={theme.textSecondary}
                value={newMeaningUsage}
                onChangeText={setNewMeaningUsage}
                multiline
              />

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Cultural Context (optional)</Text>
              <TextInput
                style={[styles.formInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface, minHeight: 76 }]}
                placeholder="Add cultural story, tradition, or context"
                placeholderTextColor={theme.textSecondary}
                value={newCulturalContext}
                onChangeText={setNewCulturalContext}
                multiline
              />
            </View>

            <View style={[styles.formSectionCard, { borderColor: theme.border, backgroundColor: theme.background }]}> 
              <Text style={[styles.formSectionTitle, { color: theme.text }]}>Pronunciation Audio</Text>
              <Text style={[styles.formSectionHint, { color: theme.textSecondary }]}>Record correct pronunciation or upload an audio file from phone.</Text>

              <Text style={[styles.fieldLabel, { color: theme.text }]}>Pronunciation Text (optional)</Text>
              <TextInput
                style={[styles.formInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                placeholder="Example: ko-to-bi-an"
                placeholderTextColor={theme.textSecondary}
                value={newPronunciation}
                onChangeText={setNewPronunciation}
              />

              <View style={styles.pronunciationActionRow}>
                <TouchableOpacity
                  style={[
                    styles.secondaryActionBtn,
                    styles.pronunciationActionBtn,
                    { borderColor: isRecordingPronunciation ? (theme.error || '#EF4444') : theme.border },
                  ]}
                  onPress={isRecordingPronunciation ? stopPronunciationRecording : startPronunciationRecording}
                >
                  <Ionicons
                    name={isRecordingPronunciation ? 'stop-circle' : 'mic-circle'}
                    size={18}
                    color={isRecordingPronunciation ? (theme.error || '#EF4444') : theme.primary}
                  />
                  <Text style={[styles.secondaryActionText, { color: theme.text }]}> 
                    {isRecordingPronunciation ? 'Stop Recording' : 'Record Pronunciation'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryActionBtn, styles.pronunciationActionBtn, { borderColor: theme.border }]}
                  onPress={pickPronunciationAudio}
                >
                  <Ionicons name="cloud-upload" size={18} color={theme.primary} />
                  <Text style={[styles.secondaryActionText, { color: theme.text }]}>Upload From Phone</Text>
                </TouchableOpacity>
              </View>
            </View>

            {uploadedPronunciation ? (
              <View style={[styles.selectedAudioCard, { borderColor: theme.border, backgroundColor: theme.background }]}> 
                <Ionicons name="musical-notes" size={16} color={theme.primary} />
                <Text style={[styles.uploadedFileText, { color: theme.textSecondary, flex: 1 }]}>Selected audio: {uploadedPronunciation.name}</Text>
                <TouchableOpacity onPress={() => setUploadedPronunciation(null)}>
                  <Ionicons name="trash-outline" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                { backgroundColor: theme.primary, opacity: isSubmittingEntry ? 0.8 : 1 },
              ]}
              onPress={addCommunityEntry}
              disabled={isSubmittingEntry}
            >
              {isSubmittingEntry ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.primaryActionText}>Submitting...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryActionText}>Add to Living Dictionary</Text>
                </>
              )}
            </TouchableOpacity>

            {isSubmittingEntry ? (
              <Text style={[styles.moderationHint, { color: theme.textSecondary }]}>Uploading and drafting your entry. Please wait...</Text>
            ) : null}

            <Text style={[styles.moderationHint, { color: theme.textSecondary }]}>Verification Review: language experts or moderators check entries. Verified: {verifiedCount}. Pending: {pendingCount}.</Text>
            </ScrollView>
          </View>
        </View>
      ) : null}

      {!showDocumentationProject ? (
        <TouchableOpacity
          style={[styles.bottomAddIcon, { backgroundColor: theme.primary }]}
          onPress={() => setShowDocumentationProject(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.bottomAddIconText}>Living Dictionary</Text>
        </TouchableOpacity>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    marginHorizontal: SPACING.l,
    marginTop: SPACING.m,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    gap: SPACING.s,
  },
  searchTriggerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchTriggerText: {
    fontSize: 15,
  },
  searchPageContainer: {
    flex: 1,
  },
  searchPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    borderBottomWidth: 1,
  },
  searchPageInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: SPACING.s,
    paddingVertical: 8,
  },
  searchPageInput: {
    flex: 1,
    fontSize: 15,
  },
  modeSwitchWrap: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: SPACING.l,
    marginTop: SPACING.m,
    marginBottom: SPACING.m,
    alignItems: 'stretch',
  },
  modeSwitchBtn: {
    flex: 1,
    borderBottomWidth: 2,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSwitchText: {
    fontSize: 14,
    fontWeight: '700',
  },
  searchModeBtn: {
    width: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  searchModeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  myContributionCard: {
    marginHorizontal: SPACING.l,
    marginBottom: SPACING.s,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.m,
  },
  myContributionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  myContributionSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  myContributionStatsRow: {
    marginTop: SPACING.s,
    flexDirection: 'row',
    gap: 8,
  },
  myContributionStatBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  myContributionStatNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  myContributionStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  topPanels: {
    maxHeight: 56,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  featureChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  projectCard: {
    marginHorizontal: SPACING.l,
    marginTop: SPACING.s,
    padding: SPACING.m,
    borderRadius: 14,
    borderWidth: 1,
    gap: SPACING.s,
  },
  floatingFormWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 20,
  },
  bottomFormCard: {
    flex: 1,
    borderRadius: 0,
    borderWidth: 1,
    padding: SPACING.m,
    gap: SPACING.s,
  },
  bottomFormScroll: {
    flex: 1,
  },
  bottomFormScrollContent: {
    gap: SPACING.s,
    paddingBottom: SPACING.m,
  },
  bottomFormHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.s,
  },
  closeFormBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomAddIcon: {
    position: 'absolute',
    right: SPACING.l,
    bottom: SPACING.l,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    ...SHADOWS.small,
  },
  bottomAddIconText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  projectSubtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  formSectionCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.s,
    gap: 8,
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  formSectionHint: {
    fontSize: 12,
    lineHeight: 17,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  secondaryActionBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pronunciationActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pronunciationActionBtn: {
    flex: 1,
    paddingHorizontal: 8,
  },
  selectedAudioCard: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryActionBtn: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  moderationHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  verifierMetaCard: {
    marginTop: SPACING.s,
    borderWidth: 1,
    borderRadius: 10,
    padding: SPACING.s,
    gap: 2,
  },
  verifierMetaText: {
    fontSize: 12,
    lineHeight: 17,
  },
  verificationTimeline: {
    marginTop: SPACING.s,
    gap: 8,
  },
  verificationStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadedFileText: {
    fontSize: 12,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  languagePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  detectedWordsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  emptyDetectedText: {
    fontSize: 12,
  },
  wordPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  translationResultsWrap: {
    marginTop: 4,
  },
  translationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    paddingVertical: 7,
  },
  translationSource: {
    flex: 1,
    fontSize: 13,
  },
  translationTarget: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  verificationBadge: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '700',
  },
  verificationBanner: {
    marginHorizontal: SPACING.l,
    marginTop: SPACING.m,
    marginBottom: SPACING.m,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: SPACING.m,
  },
  verificationBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.s,
  },
  verificationBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  verificationTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  verificationTrackStep: {
    alignItems: 'center',
    gap: 4,
  },
  verificationTrackDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationTrackLabel: {
    fontSize: 10,
    textAlign: 'center',
    maxWidth: 60,
  },
  verificationTrackLine: {
    flex: 1,
    height: 2,
    marginBottom: 14,
    marginHorizontal: 2,
  },
  verificationBannerHint: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: SPACING.s,
  },
  refreshStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: SPACING.m,
    marginTop: 2,
  },
  refreshStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.s,
    fontSize: 15,
    color: COLORS.text,
  },
  recentContainer: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.s,
  },
  recentChip: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs,
    borderRadius: 16,
    marginRight: SPACING.s,
  },
  recentChipText: {
    fontSize: 13,
    color: COLORS.primary,
  },
  filterContainer: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    gap: SPACING.s,
  },
  filterToggleBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterToggleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.l,
  },
  menuCard: {
    borderWidth: 1,
    borderRadius: 14,
    maxHeight: '70%',
    paddingVertical: SPACING.s,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: SPACING.m,
    marginBottom: SPACING.xs,
  },
  menuSearchWrap: {
    marginHorizontal: SPACING.s,
    marginBottom: SPACING.s,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: SPACING.s,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuSearchInput: {
    flex: 1,
    fontSize: 14,
  },
  menuList: {
    paddingHorizontal: SPACING.xs,
  },
  menuItem: {
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: SPACING.s,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: SPACING.s,
  },
  filterBtn: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.surface,
  },
  categoryBtn: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  categoryBtnActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  categoryTextActive: {
    color: COLORS.surface,
  },
  resultsBanner: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
  },
  resultsText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  listContent: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.xl,
  },
  wordCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: SPACING.m,
    marginBottom: SPACING.s,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...SHADOWS.small,
  },
  wordCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordCardInfo: {
    flex: 1,
  },
  wordText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  translationText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  languageText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.m,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  detailCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: SPACING.l,
    marginTop: SPACING.m,
    borderRadius: 16,
    padding: SPACING.l,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
  },
  detailWord: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.s,
  },
  detailTranslation: {
    fontSize: 20,
    color: COLORS.textSecondary,
    marginBottom: SPACING.l,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: SPACING.l,
    marginTop: SPACING.m,
    borderRadius: 16,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.m,
  },
  pronunciationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: SPACING.m,
  },
  pronunciationText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: COLORS.primary,
  },
  pronunciationHint: {
    marginTop: 4,
    fontSize: 12,
  },
  playBtn: {
    padding: SPACING.xs,
  },
  exampleCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: SPACING.m,
    marginBottom: SPACING.s,
  },
  exampleText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  relatedCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: SPACING.s,
    marginBottom: SPACING.s,
  },
  relatedText: {
    fontSize: 14,
    color: COLORS.text,
  },
});

