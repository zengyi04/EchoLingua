import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Image, FlatList, Switch, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Octicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, SHADOWS, FONTS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { prepareSingleRecording, stopAndReleaseRecording } from '../services/recordingService';
import { translateText } from '../services/translationService';
import { storyApiService } from '../services/storyApiService';
import { WORLD_LANGUAGES, getBorneoLanguages } from '../constants/languages';
import { recordingService as backendRecordingService, storyService } from '../services/api';

const STORIES_STORAGE_KEY = '@echolingua_stories';
const COMMUNITY_STORIES_STORAGE_KEY = '@echolingua_community_stories';
const RECORDINGS_STORAGE_KEY = '@echolingua_recordings';
const ELDER_VOICES_STORAGE_KEY = '@echolingua_elder_voices';
const AI_TEXT_DRAFTS_KEY = '@echolingua_ai_text_drafts';
const isObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ''));

export default function AIStoryGeneratorScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute(); // Access route params

  // Mode: 'input' | 'processing' | 'preview'
  const [mode, setMode] = useState('input');
  
  // Input State
  const [inputType, setInputType] = useState('voice'); // 'voice' | 'text' | 'file'
  const [inputText, setInputText] = useState('');
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState([]);
  
  // Elder Voice State
  // Check if opened in 'train' mode
  const initialTrainMode = route.params?.mode === 'train';
  const [isVoicePreservationMode, setIsVoicePreservationMode] = useState(initialTrainMode);
  const [voiceName, setVoiceName] = useState('');
  const [showVoiceNameModal, setShowVoiceNameModal] = useState(false);
  const [pendingVoiceUri, setPendingVoiceUri] = useState(null);

  // Result State
  const [generatedStory, setGeneratedStory] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Audio playback state
  const [playingRecordingId, setPlayingRecordingId] = useState(null);
  const [sound, setSound] = useState(null);
  const [playbackStatus, setPlaybackStatus] = useState({ position: 0, duration: 1 });
  
  // Action Sheet State
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  
  // Rename State
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newName, setNewName] = useState('');

  // Create Story Modal State
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [storyTitle, setStoryTitle] = useState('');
  const [storyDescription, setStoryDescription] = useState('');
  const [isSavingStory, setIsSavingStory] = useState(false);
  
  // Quick Share (single-page) State
  const [showQuickShareModal, setShowQuickShareModal] = useState(false);
  const [saveShortcut, setSaveShortcut] = useState(null); // 'my_stories' | 'community' | 'contacts'

  // Story generation language selection
  const [storyLanguage, setStoryLanguage] = useState(null);
  const [showStoryLanguageModal, setShowStoryLanguageModal] = useState(false);
  const [storyLangSearchQuery, setStoryLangSearchQuery] = useState('');

  // Recipient Selection State
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState([]); // 'my_stories', 'community', or emergency contact IDs
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [emergencyContactsWithApp, setEmergencyContactsWithApp] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Translation State
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState(null);
  const [langSearchQuery, setLangSearchQuery] = useState('');
  const [quickShareSourceText, setQuickShareSourceText] = useState('');
  const [quickShareTranslatedText, setQuickShareTranslatedText] = useState('');
  const [isQuickSharePreviewLoading, setIsQuickSharePreviewLoading] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslationPreview, setShowTranslationPreview] = useState(false);
  const [translationSource, setTranslationSource] = useState(''); // Original text before translation
  const [translationContext, setTranslationContext] = useState(null); // Store recording context if from voice
  const [translationAction, setTranslationAction] = useState('generate'); // 'generate' | 'share'

  // Load recordings on mount
  useEffect(() => {
    loadRecordings();
    loadUserAndContacts();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // Reload user and emergency contacts when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserAndContacts();
    }, [])
  );

  // Handle updates to route params (e.g. from Library "Train Voice" button)
  useEffect(() => {
    if (route.params?.mode === 'train') {
      setIsVoicePreservationMode(true);
      // Reset other states if needed
      setMode('input');
      setGeneratedStory(null);
    } else {
      setIsVoicePreservationMode(false);
    }
  }, [route.params?.mode]);

  const loadRecordings = async () => {
    try {
      const raw = await AsyncStorage.getItem(RECORDINGS_STORAGE_KEY);
      if (raw) {
        setRecordings(JSON.parse(raw));
      }

      if (currentUser?.id && isObjectId(currentUser.id)) {
        try {
          const backendRecs = await backendRecordingService.getAll(null, currentUser.id);
          if (Array.isArray(backendRecs) && backendRecs.length > 0) {
            const mapped = backendRecs.map((rec) => ({
              id: rec.id,
              uri: rec.audioUrl,
              timestamp: rec.createdAt || new Date().toISOString(),
              fileName: `Recording ${new Date(rec.createdAt || Date.now()).toLocaleTimeString()}`,
              transcript: rec.transcript || '',
            }));
            setRecordings((prev) => {
              const merged = [...mapped, ...prev];
              const dedup = [];
              const seen = new Set();
              merged.forEach((item) => {
                if (!seen.has(item.id)) {
                  seen.add(item.id);
                  dedup.push(item);
                }
              });
              return dedup;
            });
          }
        } catch (backendError) {
          console.warn('Recording list API unavailable, using local recordings only:', backendError?.message || backendError);
        }
      }
    } catch (e) {
      console.error('Failed to load recordings', e);
    }
  };

  // Load current user and emergency contacts
  const loadUserAndContacts = async () => {
    try {
      // Load current user
      const userJson = await AsyncStorage.getItem('@echolingua_current_user');
      if (userJson) {
        const user = JSON.parse(userJson);
        setCurrentUser(user);

        // Load users database and fallback to the canonical user record when needed
        const usersJson = await AsyncStorage.getItem('@echolingua_users_database');
        const allUsers = usersJson ? JSON.parse(usersJson) : [];
        const canonicalUser = allUsers.find((u) =>
          (user.id && u.id === user.id) ||
          (user.email && u.email && u.email.toLowerCase() === String(user.email).toLowerCase())
        );

        // Load emergency contacts from user profile, with DB fallback
        const userContacts = Array.isArray(user.emergencyContacts) && user.emergencyContacts.length > 0
          ? user.emergencyContacts
          : (Array.isArray(canonicalUser?.emergencyContacts) ? canonicalUser.emergencyContacts : []);

        setEmergencyContacts(userContacts);

        // Match emergency contacts with app users using multiple identifiers
        const contactsWithApp = userContacts.map((contact) => {
          const normalizedEmail = contact.email?.trim().toLowerCase();
          const normalizedPhone = contact.phone?.trim();
          const normalizedUsername = contact.username?.trim().toLowerCase();
          const normalizedLinkedName = contact.linkedUserName?.trim().toLowerCase();

          const appUser = allUsers.find((u) => {
            const userEmail = u.email?.trim().toLowerCase();
            const userPhone = u.phone?.trim();
            const userUsername = u.username?.trim().toLowerCase();
            const userFullName = u.fullName?.trim().toLowerCase();

            return (
              (contact.linkedUserId && u.id === contact.linkedUserId) ||
              (normalizedEmail && userEmail && userEmail === normalizedEmail) ||
              (normalizedPhone && userPhone && userPhone === normalizedPhone) ||
              (normalizedUsername && (userUsername === normalizedUsername || userFullName === normalizedUsername)) ||
              (normalizedLinkedName && userFullName === normalizedLinkedName)
            );
          });

          // Keep all profile contacts visible in share modal, with appUser attached when matched
          return {
            ...contact,
            appUser: appUser || null,
          };
        });

        setEmergencyContactsWithApp(contactsWithApp);
      } else {
        setCurrentUser(null);
        setEmergencyContacts([]);
        setEmergencyContactsWithApp([]);
      }
    } catch (e) {
      console.error('Failed to load user and contacts', e);
    }
  };

  const getPreferredLearningLanguage = () => {
    const candidates = Array.isArray(currentUser?.languages)
      ? currentUser.languages
      : typeof currentUser?.languages === 'string' && currentUser.languages.trim()
        ? currentUser.languages.split(',').map((item) => item.trim()).filter(Boolean)
        : [];

    const first = candidates[0];
    if (!first) {
      return 'Kadazan';
    }

    const byId = WORLD_LANGUAGES.find((lang) => lang.id.toLowerCase() === String(first).toLowerCase());
    if (byId) {
      return byId.label;
    }

    const byLabel = WORLD_LANGUAGES.find((lang) => lang.label.toLowerCase() === String(first).toLowerCase());
    if (byLabel) {
      return byLabel.label;
    }

    return first;
  };

  useEffect(() => {
    loadUserAndContacts();
  }, []);

  useEffect(() => {
    if (!storyLanguage) {
      const preferredLabel = getPreferredLearningLanguage();
      const preferred = WORLD_LANGUAGES.find(
        (lang) => lang.label.toLowerCase() === String(preferredLabel).toLowerCase()
      );
      if (preferred) {
        setStoryLanguage(preferred);
      }
    }
  }, [currentUser]);

  const getSelectedStoryLanguage = () => {
    if (storyLanguage) return storyLanguage;
    const preferredLabel = getPreferredLearningLanguage();
    return (
      WORLD_LANGUAGES.find((lang) => lang.label.toLowerCase() === String(preferredLabel).toLowerCase()) ||
      WORLD_LANGUAGES.find((lang) => lang.label.toLowerCase() === 'kadazan') ||
      WORLD_LANGUAGES[0]
    );
  };

  // Same-page translation preview for quick share flow
  useEffect(() => {
    let cancelled = false;

    const buildQuickSharePreview = async () => {
      if (!showQuickShareModal) {
        setQuickShareSourceText('');
        setQuickShareTranslatedText('');
        setIsQuickSharePreviewLoading(false);
        return;
      }

      if (!targetLanguage) {
        setQuickShareTranslatedText('');
        setIsQuickSharePreviewLoading(false);
        return;
      }

      setIsQuickSharePreviewLoading(true);

      let source = selectedRecording?.transcript || '';
      if (!source.trim() && selectedRecording?.uri) {
        source = await transcribeAudio(selectedRecording.uri);
      }

      if (cancelled) {
        return;
      }

      setQuickShareSourceText(source || '');

      if (!source?.trim()) {
        setQuickShareTranslatedText('');
        setIsQuickSharePreviewLoading(false);
        return;
      }

      const translated = await translateText(source, targetLanguage.id);
      if (!cancelled) {
        setQuickShareTranslatedText(translated || source);
        setIsQuickSharePreviewLoading(false);
      }
    };

    buildQuickSharePreview();

    return () => {
      cancelled = true;
    };
  }, [showQuickShareModal, targetLanguage, selectedRecording]);

  // Force reload when share modal opens
  useEffect(() => {
    if (mode === 'share') {
      loadUserAndContacts();
    }
  }, [mode]);

  const startRecording = async () => {
    try {
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Microphone permission is required to record audio.');
        return;
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const active = await prepareSingleRecording();
      setRecording(active);
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      Alert.alert('Error', `Could not start recording: ${error.message}`);
    }
  };

  const stopRecordingAndGenerate = async () => {
    if (!recording) return;

    setMode('processing');
    setLoadingMessage('Listening to your story fragment...');
    
    try {
      const uri = await stopAndReleaseRecording(recording);
      setIsRecording(false);
      setRecording(null);

      if (!uri) {
        setMode('input');
        return;
      }
      
      // Save this new recording to history
      const newRec = {
        id: Date.now().toString(),
        uri: uri,
        timestamp: new Date().toISOString(),
        fileName: isVoicePreservationMode ? `Voice Reading - ${new Date().toLocaleTimeString()}` : `Story Fragment ${new Date().toLocaleTimeString()}`
      };
      
      const updatedRecs = [newRec, ...recordings];
      setRecordings(updatedRecs);
      await AsyncStorage.setItem(RECORDINGS_STORAGE_KEY, JSON.stringify(updatedRecs));

      if (currentUser?.id && isObjectId(currentUser.id)) {
        try {
          const upload = await backendRecordingService.upload(
            uri,
            currentUser.id,
            getSelectedStoryLanguage()?.label || getPreferredLearningLanguage(),
            true,
            'private',
            ''
          );
          const recordingId = upload?.recording?.id;
          if (recordingId) {
            await backendRecordingService.getById(recordingId).catch(() => null);
          }
        } catch (uploadError) {
          console.warn('Recording upload API failed, continuing local flow:', uploadError?.message || uploadError);
        }
      }

      // After recording, open the action sheet to let user decide
      setMode('input'); // Reset mode to ensure modal is visible
      setSelectedRecording(newRec);
      setShowActionModal(true);

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to generate story. Please try again.');
      setMode('input');
    }
  };

  const saveVoiceModel = async () => {
    if (!voiceName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for this voice.');
      return;
    }

    try {
      const newVoice = {
        id: Date.now().toString(),
        name: voiceName,
        uri: pendingVoiceUri,
        dateCreated: new Date().toISOString()
      };

      const existingRaw = await AsyncStorage.getItem(ELDER_VOICES_STORAGE_KEY) || '[]';
      const existingVoices = JSON.parse(existingRaw);
      const updatedVoices = [newVoice, ...existingVoices];

      await AsyncStorage.setItem(ELDER_VOICES_STORAGE_KEY, JSON.stringify(updatedVoices));

      setShowVoiceNameModal(false);
      setVoiceName('');
      setPendingVoiceUri(null);
      
      Alert.alert('Voice Preserved', `${voiceName}'s voice has been archived and is now available for storytelling.`);
      setIsVoicePreservationMode(false); // Reset mode

    } catch (e) {
      console.error('Failed to save voice', e);
      Alert.alert('Error', 'Could not save voice profile.');
    }
  };

  const handleRenameRecording = async () => {
    if (!newName.trim() || !selectedRecording) return;
    
    try {
      const updatedRecs = recordings.map(rec => 
        rec.id === selectedRecording.id ? { ...rec, fileName: newName } : rec
      );
      setRecordings(updatedRecs);
      await AsyncStorage.setItem(RECORDINGS_STORAGE_KEY, JSON.stringify(updatedRecs));
      
      setShowRenameModal(false);
      setNewName('');
      setSelectedRecording(null);
    } catch (e) {
      Alert.alert('Error', 'Could not rename recording.');
    }
  };

  const handlePickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Create a new recording entry for this file
        const newRec = {
           id: Date.now().toString(),
           uri: asset.uri,
           timestamp: new Date().toISOString(),
           fileName: asset.name || `Imported Audio ${new Date().toLocaleTimeString()}`,
           duration: 0 // Duration might not be available immediately
        };

        const updatedRecs = [newRec, ...recordings];
        setRecordings(updatedRecs);
        await AsyncStorage.setItem(RECORDINGS_STORAGE_KEY, JSON.stringify(updatedRecs));

        // Open the action sheet to let user decide what to do with the imported file
        setMode('input');
        setSelectedRecording(newRec);
        setShowActionModal(true);
      }
    } catch (error) {
       console.error(error);
       Alert.alert('Error', 'Could not pick file.');
    }
  };

  const playRecording = async (id, uri) => {
    try {
      if (playingRecordingId === id) {
        // Stop current
        await sound.unloadAsync();
        setSound(null);
        setPlayingRecordingId(null);
        setPlaybackStatus({ position: 0, duration: 1 });
      } else {
        // Stop previous if any
        if (sound) {
          await sound.unloadAsync();
        }
        
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true }
        );
        setSound(newSound);
        setPlayingRecordingId(id);

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
             setPlaybackStatus({
                position: status.positionMillis,
                duration: status.durationMillis || 1,
             });
          }
          if (status.didJustFinish) {
            setPlayingRecordingId(null);
            newSound.unloadAsync();
            setSound(null);
            setPlaybackStatus({ position: 0, duration: 1 });
          }
        });
      }
    } catch (error) {
      console.error('Failed to play sound', error);
      Alert.alert('Error', 'Could not play recording.');
    }
  };

  const deleteRecording = async (id) => {
    try {
      const updatedRecs = recordings.filter(r => r.id !== id);
      setRecordings(updatedRecs);
      await AsyncStorage.setItem(RECORDINGS_STORAGE_KEY, JSON.stringify(updatedRecs));
    } catch (error) {
      console.error('Failed to delete recording', error);
    }
  };

  const shareRecording = (item) => {
    navigation.navigate('CommunityStory', { 
       audioUri: item.uri, 
       duration: item.duration, // Note: duration might not be in all legacy records
       transcript: item.transcript,
       fileName: item.fileName || `Recording ${new Date(item.timestamp).toLocaleDateString()}`
    });
  };

  const handleSelectPriorRecording = async (rec, modeAction = 'story') => {
    // modeAction: 'story' | 'voice'
    if (modeAction === 'voice') {
      setPendingVoiceUri(rec.uri);
      setMode('input');
      setShowVoiceNameModal(true);
      return;
    }

    setMode('processing');
    setLoadingMessage('Analyzing existing recording...');
    try {
      await processAudioFile(rec.uri);
    } catch (error) {
      console.error('Failed to process recording for story:', error);
      Alert.alert(
        'Could Not Generate Story',
        error?.message || 'Transcription failed. Please check your API key and try again.'
      );
      setMode('input');
    }
  };

  const ensureRecordingTranscript = async (rec) => {
    if (!rec) return null;
    if (rec.transcript && rec.transcript.trim()) {
      return rec;
    }

    try {
      setIsTranslating(true);

      const transcriptionText = await transcribeAudio(rec.uri);

      if (!transcriptionText || !transcriptionText.trim()) {
        Alert.alert('Transcription Failed', 'Unable to transcribe this recording. Please try again.');
        return null;
      }

      const updatedRec = { ...rec, transcript: transcriptionText.trim() };
      const updatedRecs = recordings.map((r) => (r.id === rec.id ? updatedRec : r));
      setRecordings(updatedRecs);
      await AsyncStorage.setItem(RECORDINGS_STORAGE_KEY, JSON.stringify(updatedRecs));
      setSelectedRecording(updatedRec);

      return updatedRec;
    } catch (error) {
      console.error('Failed to transcribe selected recording:', error);
      Alert.alert('Transcription Error', 'Could not transcribe recording audio to text.');
      return null;
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslateOrShareRecording = async (rec) => {
    const transcriptReadyRec = await ensureRecordingTranscript(rec);
    if (!transcriptReadyRec) {
      return;
    }
    setTranslationAction('share');
    setSelectedRecording(transcriptReadyRec);
    setShowLanguageModal(true);
  };

  const processAudioFile = async (uri) => {
      console.log('🎙️ Processing audio file for story generation:', uri);
      // 1. Transcribe
      setLoadingMessage('Transcribing audio...');
      const transcriptionText = await transcribeAudio(uri);
      
      console.log('📝 Transcribed text:', transcriptionText);
      if (!transcriptionText) {
        throw new Error('Transcription failed. Please login and ensure backend is running.');
      }

      // 2. Generate Story via Backend AI API
      setLoadingMessage('Generating your story through AI service...');
      await generateStoryFromText(transcriptionText, uri);
  };

  const handleTextGenerate = async () => {
    if (!inputText.trim()) {
      Alert.alert('Empty Input', 'Please type a story fragment first.');
      return;
    }

    setMode('processing');
    setLoadingMessage('Dreaming up the story...');
    await generateStoryFromText(inputText);
  };

  // New function: Translate only for preview (no story generation)
  const handleTranslateForPreview = async (sourceText, context = null) => {
    if (!targetLanguage) {
      Alert.alert('Language Required', 'Please select a target language.');
      return;
    }

    setShowLanguageModal(false);
    setIsTranslating(true);
    setTranslationSource(sourceText);
    setTranslationContext(context);

    try {
      const translated = await translateText(sourceText, targetLanguage.id);
      setTranslatedText(translated);
      setShowTranslationPreview(true);
    } catch (error) {
      console.error('Translation error:', error);
      Alert.alert('Translation Failed', 'Unable to translate. Please try again.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleTranslateAndGenerate = async () => {
    setShowLanguageModal(false);
    
    if (!targetLanguage) {
      // No translation, generate directly
      setMode('processing');
      setLoadingMessage('Dreaming up the story...');
      await generateStoryFromText(inputText);
      return;
    }

    // Translate first, then generate
    setMode('processing');
    setLoadingMessage('Translating text...');
    setIsTranslating(true);
    
    try {
      const translated = await translateText(inputText, targetLanguage.id);
      setTranslatedText(translated);
      setIsTranslating(false);
      
      setLoadingMessage('Dreaming up the story...');
      await generateStoryFromText(translated);
    } catch (error) {
      setIsTranslating(false);
      Alert.alert('Translation Error', 'Failed to translate text. Generating with original text.');
      setLoadingMessage('Dreaming up the story...');
      await generateStoryFromText(inputText);
    }
  };

  const transcribeAudio = async (audioUri) => {
    try {
      return await storyApiService.transcribeAudioFromBackend(audioUri);
    } catch (e) {
      console.error('Transcription failed:', e?.message || e);
      return '';
    }
  };

  const generateStoryFromText = async (seedText, sourceAudioUri = null) => {
    try {
      setLoadingMessage('Contacting AI service to create your story...');
      
      console.log('📖 Starting story generation from seed text:', seedText);
      const selectedLanguage = getSelectedStoryLanguage();
      const preferredLanguage = selectedLanguage?.label || getPreferredLearningLanguage();
      let generationSeedText = seedText;

      // Ensure output language follows user selection (e.g., Thai) by translating input first.
      if (selectedLanguage?.id && selectedLanguage.id !== 'english' && seedText?.trim()) {
        setLoadingMessage(`Translating to ${selectedLanguage.label}...`);
        try {
          const translatedSeed = await translateText(seedText, selectedLanguage.id);
          if (translatedSeed && translatedSeed.trim()) {
            generationSeedText = translatedSeed;
          }
        } catch (translationError) {
          console.warn('Pre-generation translation failed, using original seed:', translationError?.message || translationError);
        }
      }

      // Prepare data for backend AI story endpoint according to API docs
      // The backend expects: annotated_text, grammar_rules, language
      const annotatedText = [
        {
          indigenous_text: generationSeedText,
          malay_translation: seedText // Keep source text as reference
        }
      ];
      
      const grammarRules = [
        'Subject-Verb-Object (SVO)',
        'Simple present tense for narration',
        'Use appropriate cultural context'
      ];

      // Call the backend AI story generation API
      const storyResponse = await storyApiService.generateStory(
        annotatedText,
        grammarRules,
        preferredLanguage
      );

      console.log('✅ Story generated successfully:', storyResponse);
      
      // The backend response includes the story with title, pages, etc.
      // and has already persisted it to the database
      finishGeneration(storyResponse, generationSeedText, sourceAudioUri);

    } catch (error) {
      console.error('❌ Story generation error:', error);
      setMode('input');
      Alert.alert(
        'Story Generation Failed',
        'Could not generate story. Please try again or use the text input method.',
        [{ text: 'OK' }]
      );
    }
  };

  const finishGeneration = async (storyObj, sourceText = '', sourceAudioUri = null) => {
      console.log('🎯 Finalizing story generation:', { title: storyObj.title, pages: storyObj.pages?.length });

      const normalizedPages = (storyObj.pages || []).map((p, index) => ({
        page_number: p.page_number || index + 1,
        text: p.text || p.indigenous_text || '',
        translation: p.translation || p.english_translation || '',
        imagePrompt: p.imagePrompt || p.image_generation_prompt || '',
        image_url: p.image_url || null,
        indigenous_text: p.indigenous_text || p.text || '',
        english_translation: p.english_translation || p.translation || '',
      }));
      
      // The backend returns: { title, pages: [...], language, createdBy }
      // Pages have: page_number, indigenous_text, english_translation, image_generation_prompt, image_url
      const newStory = {
        id: storyObj.id || Date.now().toString(), // Backend may provide ID
        title: storyObj.title || 'Untitled Story',
        summary: storyObj.summary || storyObj.title || '',
        language: getSelectedStoryLanguage()?.label || storyObj.language || 'Kadazan',
        languageId: getSelectedStoryLanguage()?.id || null,
        pages: normalizedPages,
        createdBy: storyObj.createdBy,
        createdAt: storyObj.createdAt || new Date().toISOString(),
        isAiGenerated: true,
        audioUri: null,
        sourceRecordingUri: sourceAudioUri || null,
        transcript: sourceText || inputText.trim(),
        sourceText: sourceText || inputText.trim(),
        // Map pages to the expected format for display
        text: normalizedPages.map((p, i) => `Page ${i + 1}: ${p.text}`).join('\n\n') || ''
      };
      
      console.log('✅ Story object prepared:', newStory);
      setGeneratedStory(newStory);
      setLoadingMessage('');
      setShowCreateStoryModal(false);
      setShowRecipientModal(false);

      // Save to local My Creations silently so the new story is visible in library offline too.
      const existingRaw = await AsyncStorage.getItem(STORIES_STORAGE_KEY);
      const existingStories = existingRaw ? JSON.parse(existingRaw) : [];
      const alreadySaved = existingStories.some((s) => String(s.id) === String(newStory.id));
      if (!alreadySaved) {
        await AsyncStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify([newStory, ...existingStories]));
      }

      navigation.replace('Story', { story: newStory, storyId: newStory.id });
  };

  // Helper function to get unique key for contact
  const getContactRecipientKey = (contact) => {
    return `${contact.id}-${contact.appUser?.id || contact.linkedUserId || 'app'}`;
  };

  // Toggle recipient selection
  const toggleRecipient = (recipientId) => {
    if (selectedRecipients.includes(recipientId)) {
      setSelectedRecipients(selectedRecipients.filter(r => r !== recipientId));
    } else {
      setSelectedRecipients([...selectedRecipients, recipientId]);
    }
  };

  // Proceed from title/description to recipient selection
  const handleProceedToRecipients = () => {
    if (!storyTitle.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your story');
      return;
    }

    setShowCreateStoryModal(false);
    setShowRecipientModal(true);
  };

  // Open the single-page quick share sheet from a recording
  const openQuickShare = (rec) => {
    setSelectedRecording(rec);
    setStoryTitle(rec?.fileName || `Recording ${new Date(rec?.timestamp || Date.now()).toLocaleDateString()}`);
    setSelectedRecipients(['community']);
    setTargetLanguage(null);
    setLangSearchQuery('');
    setQuickShareSourceText(rec?.transcript || '');
    setQuickShareTranslatedText('');
    setIsQuickSharePreviewLoading(false);
    setShowQuickShareModal(true);
  };

  // Handle share from the quick share bottom sheet
  const handleQuickShareNow = async () => {
    if (!storyTitle.trim()) {
      Alert.alert('Title Required', 'Please enter a title.');
      return;
    }

    if (selectedRecipients.length === 0) {
      Alert.alert('Recipient Required', 'Please select at least one destination.');
      return;
    }

    setShowQuickShareModal(false);
    setIsSavingStory(true);

    try {
      let finalText = selectedRecording?.transcript || '';

      // Transcribe if missing
      if (!finalText.trim() && selectedRecording?.uri) {
        try { finalText = await transcribeAudio(selectedRecording.uri) || ''; } catch (e) { /* skip */ }
      }

      // Translate if a target language was picked
      if (targetLanguage && finalText.trim()) {
        if (quickShareTranslatedText.trim()) {
          finalText = quickShareTranslatedText;
        } else {
          try { finalText = await translateText(finalText, targetLanguage.id); } catch (e) { /* fallback */ }
        }
      }

      const quickStory = {
        id: Date.now().toString(),
        title: storyTitle.trim(),
        summary: finalText.substring(0, 200),
        text: finalText,
        sourceText: selectedRecording?.transcript || finalText,
        language: targetLanguage?.label || getPreferredLearningLanguage(),
        createdAt: new Date().toISOString(),
        isAiGenerated: false,
        pages: [],
        ...(selectedRecording && {
          audioUri: selectedRecording.uri,
          duration: selectedRecording.duration,
          transcript: finalText,
        }),
      };

      await performSave(quickStory, storyTitle.trim(), finalText.substring(0, 200), selectedRecipients);
    } catch (e) {
      setIsSavingStory(false);
      Alert.alert('Error', 'Failed to share. Please try again.');
    }
  };

  // Save shared stories to emergency contacts
  const saveSharedStoriesToContacts = async (story, contactIds) => {
    try {
      const contactEmails = [];
      const sharedWithUserIds = [];
      for (const contactId of contactIds) {
        const contact = emergencyContactsWithApp.find(c => getContactRecipientKey(c) === contactId);
        if (contact) {
          const recipientEmail = contact.appUser?.email || contact.email;
          const recipientUserId = contact.appUser?.id || contact.linkedUserId || null;

          if (recipientEmail) {
            contactEmails.push(recipientEmail);
          }

          if (recipientUserId) {
            sharedWithUserIds.push(recipientUserId);
          }
        }
      }

      if (contactEmails.length === 0 && sharedWithUserIds.length === 0) {
        return;
      }

      const sharedJson = await AsyncStorage.getItem('@echolingua_shared_stories');
      const existingShared = sharedJson ? JSON.parse(sharedJson) : [];

      const sharedStory = {
        ...story,
        sharedBy: currentUser?.fullName || 'Anonymous',
        sharedByEmail: currentUser?.email || null,
        sharedWithEmails: contactEmails,
        sharedWithUserIds,
        sharedAt: new Date().toISOString(),
      };

      const updatedShared = [sharedStory, ...existingShared];
      await AsyncStorage.setItem('@echolingua_shared_stories', JSON.stringify(updatedShared));
      
      // Create notifications for emergency contacts
      await createEmergencyContactNotifications(sharedStory, contactIds);
    } catch (error) {
      console.error('Failed to save shared stories:', error);
    }
  };

  // Create notifications for emergency contacts when story is shared
  const createEmergencyContactNotifications = async (sharedStory, contactIds) => {
    try {
      if (!currentUser) return;

      const NOTIFICATIONS_KEY = '@echolingua_notifications';
      const notifData = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      const existingNotifications = notifData ? JSON.parse(notifData) : [];

      // Create notification for each emergency contact
      const newNotifications = [];
      for (const contactId of contactIds) {
        const contact = emergencyContactsWithApp.find(c => getContactRecipientKey(c) === contactId);
        const recipientId = contact?.appUser?.id || contact?.linkedUserId;
        if (contact && recipientId) {
          newNotifications.push({
            id: `notif_${Date.now()}_${recipientId}_${Math.random()}`,
            type: 'shared_story',
            recipientId,
            senderId: currentUser.id,
            senderName: currentUser.fullName || 'Someone',
            title: `${currentUser.fullName || 'Someone'} shared a story with you`,
            message: `"${sharedStory.title}" - Check Other Creation section`,
            storyData: sharedStory,
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
      }

      const updatedNotifications = [...newNotifications, ...existingNotifications];
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
      console.log(`✅ Created ${newNotifications.length} notifications for emergency contacts`);
    } catch (error) {
      console.error('❌ Failed to create emergency contact notifications:', error);
    }
  };

  // Create notifications for all users when a new community story is shared
  const createCommunityStoryNotifications = async (story) => {
    try {
      const USERS_DB_KEY = '@echolingua_users_database';
      const NOTIFICATIONS_KEY = '@echolingua_notifications';
      
      // Get all users
      const usersData = await AsyncStorage.getItem(USERS_DB_KEY);
      if (!usersData) return;
      
      const allUsers = JSON.parse(usersData);
      const notifData = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      const allNotifications = notifData ? JSON.parse(notifData) : [];

      // Create notification for each user except the author
      for (const user of allUsers) {
        if (user.id !== currentUser?.id) {
          const notification = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${user.id}`,
            type: 'story',
            recipientId: user.id,
            senderId: currentUser?.id || 'unknown',
            senderName: currentUser?.fullName || currentUser?.name || 'Someone',
            senderAvatar: currentUser?.profileImage || null,
            title: 'New Community Story',
            message: `${currentUser?.fullName || 'Someone'} shared a new story: "${story.title}"`,
            storyData: story,
            timestamp: new Date().toISOString(),
            read: false,
          };
          allNotifications.push(notification);
        }
      }

      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(allNotifications));
    } catch (error) {
      console.error('Failed to create community story notifications:', error);
    }
  };

  const saveStoryToLibrary = async () => {
    if (!storyTitle.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your story');
      return;
    }

    if (selectedRecipients.length === 0) {
      Alert.alert('Recipient Required', 'Please select at least one destination.');
      return;
    }

    setIsSavingStory(true);
    setShowRecipientModal(false);

    const fullStoryText =
      generatedStory?.pages?.map((page, idx) => `Page ${idx + 1}: ${page.text || page.indigenous_text || ''}`).join('\n\n') || '';
    const resolvedText = (
      fullStoryText || translatedText || generatedStory?.sourceText || generatedStory?.summary || ''
    ).trim();

    await performSave(
      generatedStory,
      storyTitle.trim(),
      storyDescription.trim() || generatedStory?.summary || '',
      selectedRecipients,
      resolvedText
    );
  };

  // Core save logic — used by both saveStoryToLibrary and handleQuickShareNow
  const performSave = async (story, title, description, recipients, textOverride = null) => {
    try {
      const myStoriesSelected = recipients.includes('my_stories');
      const communitySelected = recipients.includes('community');
      const emergencyContactIds = recipients.filter(r => r !== 'my_stories' && r !== 'community');

      const normalizedTitle = title;
      const normalizedDescription = description;
      const normalizedText = textOverride ?? (
        story?.pages?.map((page, idx) => `Page ${idx + 1}: ${page.text || page.indigenous_text || ''}`).join('\n\n') ||
        story?.text || story?.sourceText || story?.summary || ''
      ).trim();

      // Always store typed text locally first (draft history)
      const existingDraftsRaw = await AsyncStorage.getItem(AI_TEXT_DRAFTS_KEY);
      const existingDrafts = existingDraftsRaw ? JSON.parse(existingDraftsRaw) : [];
      const localDraft = {
        id: Date.now().toString(),
        title: normalizedTitle,
        description: normalizedDescription,
        text: normalizedText,
        authorId: currentUser?.id || null,
        authorName: currentUser?.fullName || currentUser?.name || 'Anonymous',
        createdAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(AI_TEXT_DRAFTS_KEY, JSON.stringify([localDraft, ...existingDrafts]));

      // Build clean payload for all share destinations
      const updatedStory = {
        id: story?.id || Date.now().toString(),
        createdAt: story?.createdAt || new Date().toISOString(),
        isAiGenerated: story?.isAiGenerated !== undefined ? story.isAiGenerated : true,
        title: normalizedTitle,
        description: normalizedDescription,
        summary: normalizedDescription,
        text: normalizedText,
        sourceText: normalizedText,
        language: story?.language || getPreferredLearningLanguage(),
        languageId: WORLD_LANGUAGES.find(
          (lang) => lang.label.toLowerCase() === String(story?.language || getPreferredLearningLanguage()).toLowerCase()
        )?.id || null,
        author: currentUser?.fullName || 'AI Generator',
        authorEmail: currentUser?.email || null,
        authorId: currentUser?.id || null,
        authorRole: currentUser?.role || 'learner',
        category: 'AI Generated',
        recipients,
        pages: story?.pages || [],
        ...(story?.audioUri && {
          audioUri: story.audioUri,
          duration: story.duration,
          transcript: story.transcript || story.sourceText || normalizedText,
        }),
      };

      // Save to My Creations (My Creation in Story Library)
      if (myStoriesSelected) {
        try {
          // Only POST to backend if the story was NOT already saved there during AI generation.
          // AI-generated stories have `createdBy` set by the backend; creating again would duplicate them.
          if (!story?.createdBy) {
            try {
              await storyService.create({
                title: normalizedTitle,
                language: updatedStory.language,
                text: normalizedText,
                tags: ['ai-generated'],
                pages: updatedStory.pages || [],
              });
            } catch (createError) {
              console.warn('Manual /stories create endpoint failed, using local save only:', createError?.message || createError);
            }
          }

          const existingRaw = await AsyncStorage.getItem(STORIES_STORAGE_KEY);
          const existing = existingRaw ? JSON.parse(existingRaw) : [];
          const updated = [updatedStory, ...existing];
          await AsyncStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(updated));
          console.log('✅ Story saved to "My Creations" local storage:', {
            title: updatedStory.title,
            totalStories: updated.length,
            storyId: updatedStory.id,
            isBackendGenerated: !!updatedStory.createdBy
          });
        } catch (err) {
          console.error('❌ Failed to save to My Creations:', err);
          Alert.alert('Error', 'Could not save story to My Creations');
        }
      }

      // Save to Community Story (also persisted by backend)
      if (communitySelected) {
        try {
          console.log('📢 Community story already in backend. Marking for community access...');
          // Story is already in backend, just save locally for offline access
          const existingRaw = await AsyncStorage.getItem(COMMUNITY_STORIES_STORAGE_KEY);
          const existing = existingRaw ? JSON.parse(existingRaw) : [];
          
          // Don't duplicate if already saved in My Creations
          const alreadySaved = existing.some(s => s.id === updatedStory.id);
          if (!alreadySaved) {
            await AsyncStorage.setItem(COMMUNITY_STORIES_STORAGE_KEY, JSON.stringify([updatedStory, ...existing]));
          }
          
          console.log('✅ Community story synced locally');
          // Create notifications for all users about new community story
          await createCommunityStoryNotifications(updatedStory);
        } catch (err) {
          console.warn('⚠️ Community story sync issue:', err);
        }
      }

      // Share to Emergency Contacts (Other Creation)
      if (emergencyContactIds.length > 0) {
        await saveSharedStoriesToContacts(updatedStory, emergencyContactIds);
      }
      
      setIsSavingStory(false);

      // Navigate based on selection
      if (communitySelected) {
        Alert.alert(
          'Story Saved! 🎉',
          `"${normalizedTitle}" has been saved to Community Story.`,
          [
            {
              text: 'View Community',
              onPress: () => navigation.navigate('CommunityStory')
            },
            { text: 'OK' }
          ]
        );
      } else if (myStoriesSelected) {
        Alert.alert(
          'Story Saved! 🎉',
          `"${normalizedTitle}" has been saved to My Creations.`,
          [
            {
              text: 'View My Stories',
              onPress: () => navigation.navigate('MainTabs', { screen: 'StoriesTab', params: { initialTab: 'creations' } })
            },
            { text: 'OK' }
          ]
        );
      } else if (emergencyContactIds.length > 0) {
        Alert.alert(
          'Story Saved! 🎉',
          `"${normalizedTitle}" has been shared with ${emergencyContactIds.length} contact(s).`,
          [
            {
              text: 'View Shared',
              onPress: () => navigation.navigate('MainTabs', { screen: 'StoriesTab', params: { initialTab: 'shared' } })
            },
            { text: 'OK' }
          ]
        );
      } else {
        Alert.alert('Story Saved! 🎉', `"${normalizedTitle}" has been saved.`, [{ text: 'OK' }]);
      }

      // Reset form
      setStoryTitle('');
      setStoryDescription('');
      setGeneratedStory(null);
      setSelectedRecipients([]);
    } catch (e) {
      setIsSavingStory(false);
      Alert.alert('Error', 'Failed to save story. Please try again.');
    }
  };

  const saveStory = async () => {
    try {
      const normalizedTitle = generatedStory?.title?.trim() || 'Untitled Story';
      const normalizedDescription = generatedStory?.summary?.trim() || generatedStory?.description?.trim() || '';
      const normalizedText = (
        translatedText ||
        inputText ||
        generatedStory?.sourceText ||
        generatedStory?.summary ||
        ''
      ).trim();

      const cleanStory = {
        id: generatedStory?.id || Date.now().toString(),
        createdAt: generatedStory?.createdAt || new Date().toISOString(),
        isAiGenerated: true,
        title: normalizedTitle,
        description: normalizedDescription,
        summary: normalizedDescription,
        text: normalizedText,
        sourceText: normalizedText,
        author: currentUser?.fullName || 'AI Generator',
        authorEmail: currentUser?.email || null,
        authorId: currentUser?.id || null,
        authorRole: currentUser?.role || 'learner',
        category: 'AI Generated',
      };

      const existingRaw = await AsyncStorage.getItem(STORIES_STORAGE_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const newStories = [cleanStory, ...existing];
      await AsyncStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(newStories));
      
      Alert.alert('Success', 'Story saved to library!');
      navigation.replace('Story', { story: cleanStory });
    } catch (e) {
      Alert.alert('Error', 'Failed to save story.');
    }
  };

    // Wire preview-screen shortcut buttons: My Creations and Community go directly to performSave
    useEffect(() => {
      if (!saveShortcut || saveShortcut === 'contacts') return;
      if (!generatedStory) return;
      const doSave = async () => {
        setIsSavingStory(true);
        const fullStoryText =
          generatedStory?.pages?.map((page, idx) => `Page ${idx + 1}: ${page.text || page.indigenous_text || ''}`).join('\n\n') || '';
        const resolvedText = (fullStoryText || translatedText || generatedStory?.sourceText || generatedStory?.summary || '').trim();
        await performSave(
          generatedStory,
          storyTitle.trim() || generatedStory.title || 'Untitled Story',
          storyDescription.trim() || generatedStory?.summary || '',
          [saveShortcut],
          resolvedText
        );
        setSaveShortcut(null);
      };
      doSave();
    }, [saveShortcut]);

  const loadRecordingsFromStorage = async () => {
      try {
        const raw = await AsyncStorage.getItem(RECORDINGS_STORAGE_KEY);
        if (raw) setRecordings(JSON.parse(raw));
      } catch (e) {}
  };

  useEffect(() => {
    loadRecordingsFromStorage();
  }, []);

  // --- RENDER ---
  
  if (mode === 'processing') {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.text }]}>{loadingMessage}</Text>
      </View>
    );
  }

  if (mode === 'preview' && generatedStory) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => setMode('input')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Your Story is Ready ✨</Text>
        </View>

        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 180 }]}>
          {/* Story card */}
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.s }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: theme.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.m }}>
                <MaterialCommunityIcons name="auto-fix" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.storyTitle, { color: theme.text, marginBottom: 0 }]}>{generatedStory.title}</Text>
                {generatedStory.language && (
                  <Text style={{ fontSize: 12, color: theme.primary, fontWeight: '600', marginTop: 2 }}>{generatedStory.language}</Text>
                )}
              </View>
            </View>
            {!!generatedStory.summary && (
              <Text style={[styles.storySummary, { color: theme.textSecondary }]}>{generatedStory.summary}</Text>
            )}

            <View style={styles.divider} />

            {generatedStory.pages.map((page, index) => (
              <View key={index} style={styles.pagePreview}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: theme.primary + '20', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: theme.primary }}>{index + 1}</Text>
                  </View>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, letterSpacing: 0.5 }}>PAGE {index + 1}</Text>
                </View>
                <Text style={[styles.pageText, { color: theme.text }]}>{page.text || page.indigenous_text}</Text>
                {!!page.translation && (
                  <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 4, fontStyle: 'italic' }}>{page.translation}</Text>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Pinned action buttons */}
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: theme.surface,
          paddingHorizontal: SPACING.l,
          paddingTop: SPACING.m,
          paddingBottom: SPACING.xl,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          gap: SPACING.s,
        }}>
          <Text style={{ fontSize: 12, color: theme.textSecondary, textAlign: 'center', marginBottom: 2 }}>Where do you want to save this story?</Text>

          {/* My Creations */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.secondary + '15', borderRadius: 14, paddingVertical: 13, paddingHorizontal: SPACING.l, borderWidth: 1.5, borderColor: theme.secondary, opacity: isSavingStory ? 0.5 : 1 }}
            disabled={isSavingStory}
            onPress={() => {
              setSelectedRecipients(['my_stories']);
              setShowRecipientModal(false);
              setSaveShortcut('my_stories');
            }}
          >
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.secondary + '25', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.m }}>
              <Ionicons name="bookmarks" size={16} color={theme.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.secondary, fontWeight: '700', fontSize: 15 }}>Save to My Creations</Text>
              <Text style={{ color: theme.secondary + 'AA', fontSize: 12 }}>Private — only visible to you</Text>
            </View>
            {isSavingStory && saveShortcut === 'my_stories' ? <ActivityIndicator size="small" color={theme.secondary} /> : <Ionicons name="chevron-forward" size={18} color={theme.secondary} />}
          </TouchableOpacity>

          {/* Share to Community */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary + '15', borderRadius: 14, paddingVertical: 13, paddingHorizontal: SPACING.l, borderWidth: 1.5, borderColor: theme.primary, opacity: isSavingStory ? 0.5 : 1 }}
            disabled={isSavingStory}
            onPress={() => {
              setSelectedRecipients(['community']);
              setShowRecipientModal(false);
              setSaveShortcut('community');
            }}
          >
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.primary + '25', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.m }}>
              <Ionicons name="globe" size={16} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 15 }}>Share to Community</Text>
              <Text style={{ color: theme.primary + 'AA', fontSize: 12 }}>Visible to all EchoLingua users</Text>
            </View>
            {isSavingStory && saveShortcut === 'community' ? <ActivityIndicator size="small" color={theme.primary} /> : <Ionicons name="chevron-forward" size={18} color={theme.primary} />}
          </TouchableOpacity>

          {/* Share to Emergency Contact */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.accent + '15', borderRadius: 14, paddingVertical: 13, paddingHorizontal: SPACING.l, borderWidth: 1.5, borderColor: theme.accent, opacity: isSavingStory ? 0.5 : 1 }}
            disabled={isSavingStory}
            onPress={() => {
              setSelectedRecipients([]);
              setSaveShortcut('contacts');
              setShowRecipientModal(true);
            }}
          >
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: theme.accent + '25', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.m }}>
              <Ionicons name="people" size={16} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 15 }}>Share to Emergency Contact</Text>
              <Text style={{ color: theme.accent + 'AA', fontSize: 12 }}>Send directly to your contacts</Text>
            </View>
            {isSavingStory && saveShortcut === 'contacts' ? <ActivityIndicator size="small" color={theme.accent} /> : <Ionicons name="chevron-forward" size={18} color={theme.accent} />}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode('input')} style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Discard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
       <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
             {isVoicePreservationMode ? 'Train Elder Voice' : 'AI Story Revival'}
          </Text>
       </View>

       <View style={styles.content}>
          <View style={styles.tabs}>
             <TouchableOpacity 
               style={[styles.tab, inputType === 'voice' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
               onPress={() => {
                  setInputType('voice');
                  setIsVoicePreservationMode(false); // Default to story when switching back
               }}
             >
               <Ionicons name="mic" size={20} color={inputType === 'voice' ? theme.primary : theme.textSecondary} />
               <Text style={[styles.tabText, { color: inputType === 'voice' ? theme.primary : theme.textSecondary }]}>Voice</Text>
             </TouchableOpacity>

             <TouchableOpacity 
               style={[styles.tab, inputType === 'text' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
               onPress={() => setInputType('text')}
             >
                <Ionicons name="text" size={20} color={inputType === 'text' ? theme.primary : theme.textSecondary} />
               <Text style={[styles.tabText, { color: inputType === 'text' ? theme.primary : theme.textSecondary }]}>Text</Text>
             </TouchableOpacity>


             <TouchableOpacity 
               style={[styles.tab, inputType === 'file' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
               onPress={() => setInputType('file')}
             >
                <Ionicons name="folder-open" size={20} color={inputType === 'file' ? theme.primary : theme.textSecondary} />
               <Text style={[styles.tabText, { color: inputType === 'file' ? theme.primary : theme.textSecondary }]}>
                 History
               </Text>
             </TouchableOpacity>
          </View>

          <View style={{ marginBottom: SPACING.m }}>
            <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 }}>
              STORY LANGUAGE
            </Text>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 10,
                paddingHorizontal: SPACING.m,
                paddingVertical: 12,
                backgroundColor: theme.surface,
              }}
              onPress={() => setShowStoryLanguageModal(true)}
            >
              <Ionicons name="language-outline" size={18} color={theme.textSecondary} style={{ marginRight: SPACING.s }} />
              <Text style={{ flex: 1, color: theme.text, fontSize: 15 }}>
                {getSelectedStoryLanguage()?.flag}  {getSelectedStoryLanguage()?.label}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
            <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 6 }}>
              Story generation and narration will use this language.
            </Text>
          </View>

          {inputType === 'voice' && (
             <View style={styles.voiceContainer}>
                {/* Voice Training Prompts */}
                {/* Removed logic based prompts, kept simple instructions if needed, or remove completely */}
                 <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 20 }}>
                     Share a short memory, introduce yourself, or tell a story.
                 </Text>

                <TouchableOpacity 
                  style={[
                    styles.recordBtn, 
                    { backgroundColor: isRecording ? COLORS.error : theme.primary }
                  ]}
                  onPress={isRecording ? stopRecordingAndGenerate : startRecording}
                >
                   <Ionicons name={isRecording ? "stop" : "mic-outline"} size={40} color="#FFF" />
                </TouchableOpacity>
                
                <Text style={[styles.recordLabel, { color: theme.text, marginBottom: 20 }]}>
                  {isRecording ? "Recording in progress..." : "Tap to Record"}
                </Text>

                {/* Quick Mode Switch for Recording */}
                {!isRecording && (
                     <TouchableOpacity 
                        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
                        onPress={handlePickAudioFile}
                     >
                        <Ionicons name="folder-open-outline" size={18} color={theme.primary} style={{ marginRight: 6 }} />
                        <Text style={{ color: theme.primary, fontWeight: '600' }}>Select Audio File</Text>
                     </TouchableOpacity>
                )}
             </View>
          )}

          {inputType === 'text' && (
            <View style={styles.textContainer}>
               <TextInput
                 style={[styles.textInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                 multiline
                 placeholder="Once upon a time, the spirit of the mountain..."
                 placeholderTextColor={theme.textSecondary}
                 value={inputText}
                 onChangeText={setInputText}
               />
               <View style={{ flexDirection: 'row', gap: 8 }}>
                 <TouchableOpacity 
                    style={[styles.generateBtn, { backgroundColor: theme.secondary, flex: 1 }]}
                    onPress={() => {
                      if (!inputText.trim()) {
                        Alert.alert('Empty Input', 'Please enter text to translate.');
                        return;
                      }
                      setTranslationAction('share');
                      setSelectedRecording(null);
                      setShowLanguageModal(true);
                    }}
                 >
                   <Ionicons name="language" size={20} color="#FFF" style={{ marginRight: 8 }} />
                   <Text style={styles.generateBtnText}>Translate</Text>
                 </TouchableOpacity>
                 <TouchableOpacity 
                    style={[styles.generateBtn, { backgroundColor: theme.primary, flex: 1 }]}
                    onPress={handleTextGenerate}
                 >
                   <MaterialCommunityIcons name="auto-fix" size={20} color="#FFF" style={{ marginRight: 8 }} />
                   <Text style={styles.generateBtnText}>Generate Story</Text>
                 </TouchableOpacity>
               </View>
            </View>
          )}

          {inputType === 'file' && (
             <View style={styles.fileContainer}>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                   <Text style={[styles.historyTitle, { color: theme.text, marginBottom: 0, flex: 1 }]}>Recent Recordings</Text>
                   <MaterialCommunityIcons name="history" size={16} color={theme.textSecondary} />
                </View>
                
                <FlatList
                   data={recordings}
                   keyExtractor={(item) => item.id}
                   renderItem={({item}) => (
                      <TouchableOpacity 
                        style={[styles.histItem, { backgroundColor: theme.surface, borderColor: theme.border, padding: 8, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }]}
                        activeOpacity={0.7}
                        onPress={() => {
                           setSelectedRecording(item);
                           setShowActionModal(true);
                        }}
                      >
                         {/* Play/Pause Button - Separate Hit Area */}
                         <TouchableOpacity 
                            onPress={() => playRecording(item.id, item.uri)}
                            style={{ padding: 6 }}
                         >
                            <Ionicons 
                              name={playingRecordingId === item.id ? "pause-circle" : "play-circle"} 
                              size={44} 
                              color={playingRecordingId === item.id ? theme.primary : theme.secondary} 
                            />
                         </TouchableOpacity>

                         {/* File Info */}
                         <View style={{ flex: 1, marginHorizontal: 12 }}>
                            <Text style={[styles.histName, { color: theme.text, fontSize: 16, marginBottom: 4 }]} numberOfLines={1}>
                              {item.fileName || 'Untitled Recording'}
                            </Text>
                            
                            {playingRecordingId === item.id ? (
                               <View style={{ marginTop: 4 }}>
                                  <View style={{ height: 4, backgroundColor: theme.textSecondary + '40', borderRadius: 2 }}>
                                    <View 
                                      style={{ 
                                        width: `${(playbackStatus.position / playbackStatus.duration) * 100}%`, 
                                        height: '100%', 
                                        backgroundColor: theme.primary, 
                                        borderRadius: 2 
                                      }} 
                                    />
                                  </View>
                                  <Text style={{ fontSize: 10, color: theme.primary, marginTop: 2 }}>
                                    {Math.floor(playbackStatus.position / 60000)}:{String(Math.floor((playbackStatus.position % 60000) / 1000)).padStart(2, '0')}
                                  </Text>
                               </View>
                            ) : (
                               <Text style={[styles.histDate, { color: theme.textSecondary, fontSize: 12 }]}>
                                 {new Date(item.timestamp).toLocaleDateString()}
                                 {item.duration ? ` • ${Math.floor(item.duration / 60)}:${String(Math.floor(item.duration % 60)).padStart(2, '0')}` : ''}
                               </Text>
                            )}
                         </View>

                         {/* More Options Indicator */}
                         <Ionicons name="ellipsis-vertical" size={20} color={theme.textSecondary} style={{ padding: 6 }} />

                      </TouchableOpacity>
                   )}
                   ListEmptyComponent={
                     <Text style={{color: theme.textSecondary, textAlign: 'center', marginTop: 20}}>No recordings yet.</Text>
                   }
                />
             </View>
          )}
       </View>

       {/* Recording Action Sheet */}
       <Modal
          visible={showActionModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowActionModal(false)}
       >
          <TouchableOpacity 
             style={[styles.modalOverlay, { justifyContent: 'flex-end', padding: 0 }]} 
             activeOpacity={1} 
             onPress={() => setShowActionModal(false)}
          >
             <View style={[styles.actionSheet, { width: '100%', backgroundColor: theme.surface, paddingBottom: 40, paddingTop: 20, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
                
                <View style={{ gap: 4 }}>
                   <TouchableOpacity 
                      style={[styles.simpleActionRow, { backgroundColor: theme.background }]}
                      onPress={() => {
                         setShowActionModal(false);
                         if (selectedRecording) handleSelectPriorRecording(selectedRecording, 'story');
                      }}
                   >
                      <MaterialCommunityIcons name="auto-fix" size={20} color={theme.primary} />
                      <Text style={[styles.simpleActionText, { color: theme.text }]}>Create Story</Text>
                   </TouchableOpacity>

                   <TouchableOpacity 
                      style={[styles.simpleActionRow, { backgroundColor: theme.background }]}
                      onPress={async () => {
                         setShowActionModal(false);
                         if (selectedRecording) {
                           await handleTranslateOrShareRecording(selectedRecording);
                         }
                      }}
                   >
                      <Ionicons name="language" size={20} color={theme.secondary} />
                      <Text style={[styles.simpleActionText, { color: theme.text }]}>Translate</Text>
                   </TouchableOpacity>

                   <TouchableOpacity 
                      style={[styles.simpleActionRow, { backgroundColor: theme.background }]}
                      onPress={async () => {
                         setShowActionModal(false);
                         if (selectedRecording) {
                           openQuickShare(selectedRecording);
                         }
                      }}
                   >
                      <Ionicons name="share-social-outline" size={20} color={theme.text} />
                      <Text style={[styles.simpleActionText, { color: theme.text }]}>Share</Text>
                   </TouchableOpacity>

                   <TouchableOpacity 
                      style={[styles.simpleActionRow, { backgroundColor: theme.background }]}
                      onPress={() => {
                         setShowActionModal(false);
                         if (selectedRecording) {
                             setNewName(selectedRecording.fileName);
                             setShowRenameModal(true);
                         }
                      }}
                   >
                      <MaterialCommunityIcons name="pencil-outline" size={20} color={theme.textSecondary} />
                      <Text style={[styles.simpleActionText, { color: theme.text }]}>Rename</Text>
                   </TouchableOpacity>

                   <TouchableOpacity 
                      style={[styles.simpleActionRow, { backgroundColor: theme.background }]}
                      onPress={() => {
                         const recToDelete = selectedRecording;
                         setShowActionModal(false);
                         setTimeout(() => {
                            Alert.alert('Delete', 'Delete this recording permanently?', [
                              { text: 'Cancel' },
                              { text: 'Delete', style: 'destructive', onPress: () => recToDelete && deleteRecording(recToDelete.id) }
                            ]);
                         }, 300);
                      }}
                   >
                      <Ionicons name="trash-outline" size={20} color={theme.error} />
                      <Text style={[styles.simpleActionText, { color: theme.error }]}>Delete</Text>
                   </TouchableOpacity>
                   
                   {/* Less common options */}
                   <TouchableOpacity 
                      style={[styles.simpleActionRow, { backgroundColor: theme.background, opacity: 0.8 }]}
                      onPress={() => {
                         setShowActionModal(false);
                         if (selectedRecording) handleSelectPriorRecording(selectedRecording, 'voice');
                      }}
                   >
                      <MaterialCommunityIcons name="account-voice" size={20} color={theme.textSecondary} />
                      <Text style={[styles.simpleActionText, { color: theme.textSecondary }]}>Train Voice Model</Text>
                   </TouchableOpacity>

                </View>
             </View>
          </TouchableOpacity>
       </Modal>

       {/* Elder Voice Naming Modal */}
       <Modal
          visible={showVoiceNameModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowVoiceNameModal(false)}
       >
         <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
           <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
             <Text style={[styles.modalTitle, { color: theme.text }]}>Preserve Elder Voice</Text>
             <Text style={[styles.modalDesc, { color: theme.textSecondary }]}>Enter the name of the elder to identify this voice model:</Text>
             
             <TextInput
               style={[styles.inputField, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
               placeholder="e.g. Elder Kambera"
               placeholderTextColor={theme.textSecondary}
               value={voiceName}
               onChangeText={setVoiceName}
               autoFocus
             />

             <View style={styles.modalActions}>
               <TouchableOpacity onPress={() => setShowVoiceNameModal(false)} style={[styles.modalBtn]}>
                 <Text style={{ color: theme.error }}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={saveVoiceModel} style={[styles.modalBtn, { backgroundColor: theme.primary }]}>
                 <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Archive Voice</Text>
               </TouchableOpacity>
             </View>
           </View>
         </View>
       </Modal>

       {/* Create Story Modal - Title and Description */}
       <Modal
          visible={showCreateStoryModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCreateStoryModal(false)}
       >
         <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
           <View style={[styles.modalContent, { backgroundColor: theme.surface, width: '90%', maxHeight: '70%' }]}>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.m }}>
               <Text style={[styles.modalTitle, { color: theme.text }]}>Save Story to Library</Text>
               <TouchableOpacity onPress={() => setShowCreateStoryModal(false)}>
                 <Ionicons name="close-circle" size={28} color={theme.textSecondary} />
               </TouchableOpacity>
             </View>

             <ScrollView showsVerticalScrollIndicator={false}>
               {/* Title Input */}
               <View style={{ marginBottom: SPACING.m }}>
                 <Text style={[styles.inputLabel, { color: theme.text, marginBottom: 6 }]}>
                   Story Title <Text style={{ color: theme.error }}>*</Text>
                 </Text>
                 <TextInput
                   style={[styles.inputField, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                   value={storyTitle}
                   onChangeText={setStoryTitle}
                   placeholder="Enter a title for your story..."
                   placeholderTextColor={theme.textSecondary}
                   maxLength={100}
                   autoFocus
                 />
                 <Text style={[styles.characterCount, { color: theme.textSecondary }]}>{storyTitle.length}/100</Text>
               </View>

               {/* Description Input */}
               <View style={{ marginBottom: SPACING.m }}>
                 <Text style={[styles.inputLabel, { color: theme.text, marginBottom: 6 }]}>
                   Description (Optional)
                 </Text>
                 <TextInput
                   style={[styles.inputField, { 
                     color: theme.text, 
                     borderColor: theme.border, 
                     backgroundColor: theme.background,
                     height: 100,
                     textAlignVertical: 'top'
                   }]}
                   value={storyDescription}
                   onChangeText={setStoryDescription}
                   placeholder="Describe your story, add cultural context..."
                   placeholderTextColor={theme.textSecondary}
                   maxLength={500}
                   multiline
                   numberOfLines={4}
                 />
                 <Text style={[styles.characterCount, { color: theme.textSecondary }]}>{storyDescription.length}/500</Text>
               </View>

               {/* Info Banner */}
               <View style={{ 
                 flexDirection: 'row', 
                 alignItems: 'center', 
                 backgroundColor: theme.primary + '20', 
                 padding: SPACING.m, 
                 borderRadius: 8,
                 marginBottom: SPACING.m 
               }}>
                 <Ionicons name="information-circle" size={20} color={theme.primary} style={{ marginRight: 8 }} />
                 <Text style={{ color: theme.text, fontSize: 13, flex: 1 }}>
                   Next, you'll choose where to save and share your story
                 </Text>
               </View>
             </ScrollView>

             {/* Continue Button */}
             <View style={styles.modalActions}>
               <TouchableOpacity 
                 onPress={() => setShowCreateStoryModal(false)} 
                 style={[styles.modalBtn, { borderWidth: 1, borderColor: theme.border }]}
               >
                 <Text style={{ color: theme.text }}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 onPress={handleProceedToRecipients} 
                 style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                 disabled={!storyTitle.trim()}
               >
                 <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Continue to Sharing Options</Text>
               </TouchableOpacity>
             </View>
           </View>
         </View>
       </Modal>

       {/* Rename Modal */}
       <Modal
          visible={showRenameModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowRenameModal(false)}
       >
         <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
           <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
             <Text style={[styles.modalTitle, { color: theme.text }]}>Rename Recording</Text>
             
             <TextInput
               style={[styles.inputField, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
               value={newName}
               onChangeText={setNewName}
               autoFocus
               placeholder="Enter new name"
               placeholderTextColor={theme.textSecondary}
             />

             <View style={styles.modalActions}>
               <TouchableOpacity onPress={() => setShowRenameModal(false)} style={[styles.modalBtn]}>
                 <Text style={{ color: theme.error }}>Cancel</Text>
               </TouchableOpacity>
               <TouchableOpacity onPress={handleRenameRecording} style={[styles.modalBtn, { backgroundColor: theme.primary }]}>
                 <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Save</Text>
               </TouchableOpacity>
             </View>
           </View>
         </View>
       </Modal>

       {/* ── Save & Share Story Modal ── */}
       <Modal
          visible={showRecipientModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowRecipientModal(false)}
       >
         <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
           <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: SPACING.m, paddingBottom: SPACING.l, maxHeight: '88%' }}>

             {/* Drag handle */}
             <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: 'center', marginBottom: SPACING.m }} />

             {/* Header */}
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.l, marginBottom: SPACING.m }}>
               <View>
                 <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text }}>Your Story is Ready! ✨</Text>
                 <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>Choose where to save or share it</Text>
               </View>
               <TouchableOpacity
                 onPress={() => setShowRecipientModal(false)}
                 style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}
               >
                 <Ionicons name="close" size={18} color={theme.textSecondary} />
               </TouchableOpacity>
             </View>

             <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: SPACING.l, paddingBottom: SPACING.s }}>

               {/* Story preview card */}
               {generatedStory && (
                 <View style={{ borderRadius: 14, backgroundColor: theme.primary + '10', borderWidth: 1, borderColor: theme.primary + '30', padding: SPACING.m, marginBottom: SPACING.l, flexDirection: 'row', alignItems: 'flex-start' }}>
                   <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: theme.primary + '25', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.m }}>
                     <MaterialCommunityIcons name="auto-fix" size={22} color={theme.primary} />
                   </View>
                   <View style={{ flex: 1 }}>
                     <Text style={{ fontWeight: '700', fontSize: 15, color: theme.text }} numberOfLines={1}>{storyTitle || generatedStory.title || 'Untitled Story'}</Text>
                     <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 3, lineHeight: 17 }} numberOfLines={2}>
                       {generatedStory.summary || storyDescription || 'AI-generated story'}
                     </Text>
                     {generatedStory.pages?.length > 0 && (
                       <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                         <Ionicons name="layers-outline" size={12} color={theme.primary} />
                         <Text style={{ fontSize: 11, color: theme.primary, marginLeft: 4, fontWeight: '600' }}>
                           {generatedStory.pages.length} page{generatedStory.pages.length !== 1 ? 's' : ''}
                         </Text>
                       </View>
                     )}
                   </View>
                 </View>
               )}

               {/* Section: Save */}
               <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, letterSpacing: 0.8, marginBottom: SPACING.s }}>SAVE</Text>

               <TouchableOpacity
                 style={{
                   flexDirection: 'row', alignItems: 'center', borderRadius: 14,
                   borderWidth: selectedRecipients.includes('my_stories') ? 2 : 1,
                   borderColor: selectedRecipients.includes('my_stories') ? theme.secondary : theme.border,
                   backgroundColor: selectedRecipients.includes('my_stories') ? theme.secondary + '0C' : theme.background,
                   padding: SPACING.m, marginBottom: SPACING.s,
                 }}
                 onPress={() => toggleRecipient('my_stories')}
               >
                 <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: theme.secondary + '22', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.m }}>
                   <Ionicons name="bookmarks" size={20} color={theme.secondary} />
                 </View>
                 <View style={{ flex: 1 }}>
                   <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>My Creations</Text>
                   <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>Private — only visible to you</Text>
                 </View>
                 <View style={{ width: 26, height: 26, borderRadius: 6, borderWidth: 2, borderColor: selectedRecipients.includes('my_stories') ? theme.secondary : theme.border, backgroundColor: selectedRecipients.includes('my_stories') ? theme.secondary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                   {selectedRecipients.includes('my_stories') && <Ionicons name="checkmark" size={16} color="#FFF" />}
                 </View>
               </TouchableOpacity>

               {/* Section: Share */}
               <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, letterSpacing: 0.8, marginTop: SPACING.s, marginBottom: SPACING.s }}>SHARE</Text>

               <TouchableOpacity
                 style={{
                   flexDirection: 'row', alignItems: 'center', borderRadius: 14,
                   borderWidth: selectedRecipients.includes('community') ? 2 : 1,
                   borderColor: selectedRecipients.includes('community') ? theme.primary : theme.border,
                   backgroundColor: selectedRecipients.includes('community') ? theme.primary + '0C' : theme.background,
                   padding: SPACING.m, marginBottom: SPACING.s,
                 }}
                 onPress={() => toggleRecipient('community')}
               >
                 <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: theme.primary + '22', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.m }}>
                   <Ionicons name="globe" size={20} color={theme.primary} />
                 </View>
                 <View style={{ flex: 1 }}>
                   <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>Community</Text>
                   <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>Visible to all EchoLingua users</Text>
                 </View>
                 <View style={{ width: 26, height: 26, borderRadius: 6, borderWidth: 2, borderColor: selectedRecipients.includes('community') ? theme.primary : theme.border, backgroundColor: selectedRecipients.includes('community') ? theme.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                   {selectedRecipients.includes('community') && <Ionicons name="checkmark" size={16} color="#FFF" />}
                 </View>
               </TouchableOpacity>

               {/* Emergency Contacts */}
               <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, letterSpacing: 0.8, marginTop: SPACING.s, marginBottom: SPACING.s }}>EMERGENCY CONTACTS</Text>

               {emergencyContactsWithApp.length === 0 ? (
                 <TouchableOpacity
                   onPress={() => { setShowRecipientModal(false); navigation.navigate('EmergencyContacts'); }}
                   style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.border, padding: SPACING.m, backgroundColor: theme.background }}
                 >
                   <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: theme.accent + '15', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.m }}>
                     <Ionicons name="person-add-outline" size={20} color={theme.accent} />
                   </View>
                   <View style={{ flex: 1 }}>
                     <Text style={{ color: theme.text, fontWeight: '600', fontSize: 14 }}>No contacts added yet</Text>
                     <Text style={{ color: theme.primary, fontSize: 12, marginTop: 2 }}>Tap to add emergency contacts →</Text>
                   </View>
                 </TouchableOpacity>
               ) : (
                 emergencyContactsWithApp.map((contact, index) => {
                   const recipientKey = getContactRecipientKey(contact);
                   const isChosen = selectedRecipients.includes(recipientKey);
                   return (
                     <TouchableOpacity
                       key={`contact-${recipientKey}-${index}`}
                       style={{
                         flexDirection: 'row', alignItems: 'center', borderRadius: 14,
                         borderWidth: isChosen ? 2 : 1,
                         borderColor: isChosen ? theme.accent : theme.border,
                         backgroundColor: isChosen ? theme.accent + '0C' : theme.background,
                         padding: SPACING.m, marginBottom: SPACING.s,
                       }}
                       onPress={() => toggleRecipient(recipientKey)}
                     >
                       <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: theme.accent + '22', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.m }}>
                         <Text style={{ fontSize: 18 }}>
                           {contact.name?.[0]?.toUpperCase() || '?'}
                         </Text>
                       </View>
                       <View style={{ flex: 1 }}>
                         <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>{contact.name}</Text>
                         <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>{contact.relation || 'Contact'}</Text>
                       </View>
                       <View style={{ width: 26, height: 26, borderRadius: 6, borderWidth: 2, borderColor: isChosen ? theme.accent : theme.border, backgroundColor: isChosen ? theme.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                         {isChosen && <Ionicons name="checkmark" size={16} color="#FFF" />}
                       </View>
                     </TouchableOpacity>
                   );
                 })
               )}
             </ScrollView>

             {/* Pinned action buttons */}
             <View style={{ paddingHorizontal: SPACING.l, paddingTop: SPACING.m, gap: SPACING.s, borderTopWidth: 1, borderTopColor: theme.border + '60', marginTop: SPACING.s }}>
               {selectedRecipients.length > 0 && (
                 <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                   {selectedRecipients.includes('my_stories') && (
                     <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.secondary + '20', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                       <Ionicons name="bookmarks" size={11} color={theme.secondary} />
                       <Text style={{ fontSize: 11, color: theme.secondary, fontWeight: '700', marginLeft: 4 }}>My Creations</Text>
                     </View>
                   )}
                   {selectedRecipients.includes('community') && (
                     <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary + '20', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                       <Ionicons name="globe" size={11} color={theme.primary} />
                       <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '700', marginLeft: 4 }}>Community</Text>
                     </View>
                   )}
                   {selectedRecipients.filter(r => r !== 'my_stories' && r !== 'community').map(r => {
                     const c = emergencyContactsWithApp.find(ct => getContactRecipientKey(ct) === r);
                     return c ? (
                       <View key={r} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.accent + '20', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                         <Ionicons name="person" size={11} color={theme.accent} />
                         <Text style={{ fontSize: 11, color: theme.accent, fontWeight: '700', marginLeft: 4 }}>{c.name}</Text>
                       </View>
                     ) : null;
                   })}
                 </View>
               )}

               <TouchableOpacity
                 style={{ backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, opacity: selectedRecipients.length === 0 || isSavingStory ? 0.45 : 1 }}
                 onPress={saveStoryToLibrary}
                 disabled={selectedRecipients.length === 0 || isSavingStory}
               >
                 {isSavingStory ? (
                   <ActivityIndicator size="small" color="#FFF" />
                 ) : (
                   <>
                     <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                     <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>
                       {selectedRecipients.length === 0 ? 'Select a destination' : `Save & Share`}
                     </Text>
                   </>
                 )}
               </TouchableOpacity>
               <TouchableOpacity
                 style={{ borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}
                 onPress={() => setShowRecipientModal(false)}
               >
                 <Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: 15 }}>Cancel</Text>
               </TouchableOpacity>
             </View>
           </View>
         </View>
       </Modal>

       {/* ── Quick Share Modal (single page) ── */}
       <Modal
         visible={showQuickShareModal}
         transparent={true}
         animationType="slide"
         onRequestClose={() => setShowQuickShareModal(false)}
       >
         <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' }}>
           <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: SPACING.m, paddingBottom: SPACING.l }}>
             {/* Header */}
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.l, marginBottom: SPACING.m }}>
               <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }}>Share Recording</Text>
               <TouchableOpacity onPress={() => setShowQuickShareModal(false)}>
                 <Ionicons name="close" size={24} color={theme.textSecondary} />
               </TouchableOpacity>
             </View>

             <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 480 }} contentContainerStyle={{ paddingHorizontal: SPACING.l, paddingBottom: SPACING.s }}>
               {/* Title */}
               <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 }}>TITLE</Text>
               <TextInput
                 style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 10, paddingHorizontal: SPACING.m, paddingVertical: 10, color: theme.text, backgroundColor: theme.background, fontSize: 15, marginBottom: SPACING.m }}
                 value={storyTitle}
                 onChangeText={setStoryTitle}
                 placeholder="Story title..."
                 placeholderTextColor={theme.textSecondary}
                 maxLength={100}
               />

               {/* Translation language picker */}
               <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 }}>TRANSLATE TO (OPTIONAL)</Text>
               <TouchableOpacity
                 style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.border, borderRadius: 10, paddingHorizontal: SPACING.m, paddingVertical: 12, backgroundColor: theme.background, marginBottom: SPACING.m }}
                 onPress={() => {
                   setTranslationAction('share');
                   setShowLanguageModal(true);
                 }}
               >
                 <Ionicons name="language-outline" size={18} color={theme.textSecondary} style={{ marginRight: SPACING.s }} />
                 <Text style={{ flex: 1, color: targetLanguage ? theme.text : theme.textSecondary, fontSize: 15 }}>
                   {targetLanguage ? `${targetLanguage.flag}  ${targetLanguage.label}` : 'No translation (tap to choose)'}
                 </Text>
                 {targetLanguage ? (
                   <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => setTargetLanguage(null)}>
                     <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                   </TouchableOpacity>
                 ) : (
                   <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                 )}
               </TouchableOpacity>

               {/* Transcript + Translation preview — always visible */}
               <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 }}>AUDIO TRANSCRIPT</Text>
               <View style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 10, backgroundColor: theme.background, padding: SPACING.m, marginBottom: SPACING.m }}>
                 <Text style={{ color: theme.text, fontSize: 14, lineHeight: 20 }}>
                   {quickShareSourceText || 'No transcript available for this recording.'}
                 </Text>
               </View>

               {targetLanguage && (
                 <View style={{ marginBottom: SPACING.m }}>
                   <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 }}>
                     TRANSLATION — {targetLanguage.flag}  {targetLanguage.label.toUpperCase()}
                   </Text>
                   <View style={[
                     { borderRadius: 10, padding: SPACING.m, overflow: 'hidden' },
                     isQuickSharePreviewLoading
                       ? { borderWidth: 1.5, borderColor: theme.primary, backgroundColor: theme.primary + '08' }
                       : { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.background },
                   ]}>
                     {isQuickSharePreviewLoading ? (
                       <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.m, gap: 10 }}>
                         <ActivityIndicator size="large" color={theme.primary} />
                         <Text style={{ color: theme.primary, fontSize: 14, fontWeight: '600' }}>Translating...</Text>
                       </View>
                     ) : (
                       <Text style={{ color: theme.text, fontSize: 14, lineHeight: 20 }}>
                         {quickShareTranslatedText || 'Translation not available yet.'}
                       </Text>
                     )}
                   </View>
                 </View>
               )}

               {/* Share destination selection */}
               <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 }}>SHARE TO</Text>

               <TouchableOpacity
                 onPress={() => toggleRecipient('community')}
                 style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: selectedRecipients.includes('community') ? 2 : 1, borderColor: selectedRecipients.includes('community') ? theme.primary : theme.border, backgroundColor: selectedRecipients.includes('community') ? theme.primary + '0C' : theme.background, padding: SPACING.m, marginBottom: SPACING.s }}
               >
                 <Ionicons name="globe" size={18} color={theme.primary} style={{ marginRight: 10 }} />
                 <Text style={{ flex: 1, color: theme.text, fontWeight: '600' }}>Community</Text>
                 <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: selectedRecipients.includes('community') ? theme.primary : theme.border, backgroundColor: selectedRecipients.includes('community') ? theme.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                   {selectedRecipients.includes('community') && <Ionicons name="checkmark" size={13} color="#FFF" />}
                 </View>
               </TouchableOpacity>

               <Text style={{ color: theme.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginTop: 2, marginBottom: 6 }}>EMERGENCY CONTACTS</Text>
               {emergencyContactsWithApp.length === 0 ? (
                 <TouchableOpacity
                   onPress={() => { setShowQuickShareModal(false); navigation.navigate('EmergencyContacts'); }}
                   style={{ borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.border, backgroundColor: theme.background, padding: SPACING.m, marginBottom: SPACING.s }}
                 >
                   <Text style={{ color: theme.textSecondary, fontSize: 13 }}>No emergency contacts yet. Tap to add contacts.</Text>
                 </TouchableOpacity>
               ) : (
                 emergencyContactsWithApp.map((contact, index) => {
                   const recipientKey = getContactRecipientKey(contact);
                   const selected = selectedRecipients.includes(recipientKey);
                   return (
                     <TouchableOpacity
                       key={`quick-contact-${recipientKey}-${index}`}
                       onPress={() => toggleRecipient(recipientKey)}
                       style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: selected ? 2 : 1, borderColor: selected ? theme.accent : theme.border, backgroundColor: selected ? theme.accent + '0C' : theme.background, padding: SPACING.m, marginBottom: SPACING.s }}
                     >
                       <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.accent + '20', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                         <Text style={{ color: theme.accent, fontWeight: '700' }}>{contact.name?.[0]?.toUpperCase() || '?'}</Text>
                       </View>
                       <View style={{ flex: 1 }}>
                         <Text style={{ color: theme.text, fontWeight: '600' }}>{contact.name || 'Contact'}</Text>
                         <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{contact.relation || 'Emergency contact'}</Text>
                       </View>
                       <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: selected ? theme.accent : theme.border, backgroundColor: selected ? theme.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                         {selected && <Ionicons name="checkmark" size={13} color="#FFF" />}
                       </View>
                     </TouchableOpacity>
                   );
                 })
               )}
             </ScrollView>

             {/* Buttons */}
             <View style={{ paddingHorizontal: SPACING.l, paddingTop: SPACING.m, gap: SPACING.s }}>
               <TouchableOpacity
                 style={{ backgroundColor: theme.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', opacity: isSavingStory ? 0.45 : 1 }}
                 onPress={handleQuickShareNow}
                 disabled={isSavingStory}
               >
                 {isSavingStory ? (
                   <ActivityIndicator size="small" color="#FFF" />
                 ) : (
                   <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>Share Now</Text>
                 )}
               </TouchableOpacity>
               <TouchableOpacity
                 style={{ borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}
                 onPress={() => setShowQuickShareModal(false)}
               >
                 <Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: 15 }}>Cancel</Text>
               </TouchableOpacity>
             </View>
           </View>
         </View>
       </Modal>

       {/* Story Language Selection Modal */}
       <Modal
          visible={showStoryLanguageModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => { setShowStoryLanguageModal(false); setStoryLangSearchQuery(''); }}
       >
          <Pressable
             style={styles.langMenuBackdrop}
             onPress={() => { setShowStoryLanguageModal(false); setStoryLangSearchQuery(''); }}
          >
             <Pressable style={[styles.langMenuCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
               <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.m, paddingTop: SPACING.m, paddingBottom: SPACING.s }}>
                 <Text style={[styles.langMenuTitle, { color: theme.text }]}>Story Language</Text>
                 <TouchableOpacity onPress={() => { setShowStoryLanguageModal(false); setStoryLangSearchQuery(''); }}>
                   <Ionicons name="close" size={22} color={theme.textSecondary} />
                 </TouchableOpacity>
               </View>

               <View style={[styles.langMenuSearchWrap, { borderColor: theme.border, backgroundColor: theme.background }]}>
                 <Ionicons name="search" size={16} color={theme.textSecondary} />
                 <TextInput
                   style={[styles.langMenuSearchInput, { color: theme.text }]}
                   placeholder="Search language..."
                   placeholderTextColor={theme.textSecondary}
                   value={storyLangSearchQuery}
                   onChangeText={setStoryLangSearchQuery}
                 />
                 {storyLangSearchQuery ? (
                   <TouchableOpacity onPress={() => setStoryLangSearchQuery('')}>
                     <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
                   </TouchableOpacity>
                 ) : null}
               </View>

               <ScrollView style={styles.langMenuList} keyboardShouldPersistTaps="handled">
                 {WORLD_LANGUAGES.filter(lang =>
                   !storyLangSearchQuery.trim() ||
                   lang.label.toLowerCase().includes(storyLangSearchQuery.trim().toLowerCase())
                 ).map((lang) => {
                   const active = getSelectedStoryLanguage()?.id === lang.id;
                   return (
                     <TouchableOpacity
                       key={lang.id}
                       style={[styles.langMenuItem, active ? { backgroundColor: theme.primary + '18' } : null]}
                       onPress={() => {
                         setStoryLanguage(lang);
                         setShowStoryLanguageModal(false);
                         setStoryLangSearchQuery('');
                       }}
                     >
                       <Text style={{ fontSize: 16, marginRight: SPACING.s }}>{lang.flag}</Text>
                       <View style={{ flex: 1 }}>
                         <Text style={[styles.langMenuItemText, { color: theme.text }]}>{lang.label}</Text>
                         {lang.indigenous && (
                           <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '600' }}>Indigenous Borneo</Text>
                         )}
                       </View>
                       {active && <Ionicons name="checkmark" size={18} color={theme.primary} />}
                     </TouchableOpacity>
                   );
                 })}
               </ScrollView>
             </Pressable>
          </Pressable>
       </Modal>

       {/* Language Selection Modal for Translation */}
       <Modal
          visible={showLanguageModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => { setShowLanguageModal(false); setLangSearchQuery(''); }}
       >
          <Pressable
             style={styles.langMenuBackdrop}
             onPress={() => { setShowLanguageModal(false); setLangSearchQuery(''); }}
          >
             <Pressable style={[styles.langMenuCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
               {/* Header */}
               <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.m, paddingTop: SPACING.m, paddingBottom: SPACING.s }}>
                 <Text style={[styles.langMenuTitle, { color: theme.text }]}>Select Language</Text>
                 <TouchableOpacity onPress={() => { setShowLanguageModal(false); setLangSearchQuery(''); }}>
                   <Ionicons name="close" size={22} color={theme.textSecondary} />
                 </TouchableOpacity>
               </View>

               {/* Search Input */}
               <View style={[styles.langMenuSearchWrap, { borderColor: theme.border, backgroundColor: theme.background }]}>
                 <Ionicons name="search" size={16} color={theme.textSecondary} />
                 <TextInput
                   style={[styles.langMenuSearchInput, { color: theme.text }]}
                   placeholder="Search language..."
                   placeholderTextColor={theme.textSecondary}
                   value={langSearchQuery}
                   onChangeText={setLangSearchQuery}
                 />
                 {langSearchQuery ? (
                   <TouchableOpacity onPress={() => setLangSearchQuery('')}>
                     <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
                   </TouchableOpacity>
                 ) : null}
               </View>

               {/* Language List */}
               <ScrollView style={styles.langMenuList} keyboardShouldPersistTaps="handled">
                 {WORLD_LANGUAGES.filter(lang =>
                   !langSearchQuery.trim() ||
                   lang.label.toLowerCase().includes(langSearchQuery.trim().toLowerCase())
                 ).map((lang) => {
                   const active = targetLanguage?.id === lang.id;
                   return (
                     <TouchableOpacity
                       key={lang.id}
                       style={[styles.langMenuItem, active ? { backgroundColor: theme.primary + '18' } : null]}
                       onPress={() => setTargetLanguage(lang)}
                     >
                       <Text style={{ fontSize: 16, marginRight: SPACING.s }}>{lang.flag}</Text>
                       <View style={{ flex: 1 }}>
                         <Text style={[styles.langMenuItemText, { color: theme.text }]}>{lang.label}</Text>
                         {lang.indigenous && (
                           <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '600' }}>Indigenous Borneo</Text>
                         )}
                       </View>
                       {active && <Ionicons name="checkmark" size={18} color={theme.primary} />}
                     </TouchableOpacity>
                   );
                 })}
               </ScrollView>

               {/* Action Buttons */}
               <View style={{ padding: SPACING.m, gap: SPACING.s }}>
                 <TouchableOpacity
                   style={[styles.langMenuConfirmBtn, { backgroundColor: theme.primary, opacity: !targetLanguage ? 0.45 : 1 }]}
                   disabled={!targetLanguage}
                   onPress={() => {
                     // If opened from Quick Share, just close and return — translation happens on "Share Now"
                     if (showQuickShareModal) {
                       setShowLanguageModal(false);
                       setLangSearchQuery('');
                       return;
                     }
                     if (translationAction === 'share') {
                       if (selectedRecording) {
                         handleTranslateForPreview(selectedRecording.transcript, selectedRecording);
                       } else {
                         handleTranslateForPreview(inputText.trim(), null);
                       }
                     } else {
                       handleTranslateAndGenerate();
                     }
                   }}
                 >
                   <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>
                     {showQuickShareModal ? 'Select Language' : (translationAction === 'share' ? 'Translate & Continue' : 'Translate & Generate')}
                   </Text>
                 </TouchableOpacity>
                 {translationAction === 'generate' && !selectedRecording && !showQuickShareModal && (
                   <TouchableOpacity
                     style={[styles.langMenuSkipBtn, { borderColor: theme.border }]}
                     onPress={() => { setTargetLanguage(null); handleTranslateAndGenerate(); }}
                   >
                     <Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: 14 }}>Skip — Generate without translation</Text>
                   </TouchableOpacity>
                 )}
               </View>
             </Pressable>
          </Pressable>
       </Modal>

       {/* Translation Preview Modal */}
       <Modal
          visible={showTranslationPreview}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowTranslationPreview(false)}
       >
         <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
           <View style={[styles.modalContent, { backgroundColor: theme.surface, width: '90%', maxHeight: '80%' }]}>
             <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.m }}>
               <Text style={[styles.modalTitle, { color: theme.text }]}>Translation Preview</Text>
               <TouchableOpacity onPress={() => setShowTranslationPreview(false)}>
                 <Ionicons name="close-circle" size={28} color={theme.textSecondary} />
               </TouchableOpacity>
             </View>

             <ScrollView showsVerticalScrollIndicator={false}>
               <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.m, padding: SPACING.s, backgroundColor: theme.primary + '15', borderRadius: 8 }}>
                 <Ionicons name="language" size={20} color={theme.primary} style={{ marginRight: 8 }} />
                 <Text style={{ color: theme.primary, fontWeight: 'bold' }}>{targetLanguage?.label}</Text>
               </View>

               <View style={{ marginBottom: SPACING.m }}>
                 <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>ORIGINAL</Text>
                 <View style={{ padding: SPACING.m, backgroundColor: theme.background, borderRadius: 8 }}>
                   <Text style={{ color: theme.text, fontSize: 14, lineHeight: 20 }}>{translationSource}</Text>
                 </View>
               </View>

               <View style={{ marginBottom: SPACING.m }}>
                 <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>TRANSLATED</Text>
                 <View style={{ padding: SPACING.m, backgroundColor: theme.primary + '10', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: theme.primary }}>
                   <Text style={{ color: theme.text, fontSize: 14, lineHeight: 20 }}>{translatedText}</Text>
                 </View>
               </View>
             </ScrollView>

             <View style={{ gap: SPACING.s, paddingTop: SPACING.s }}>
               <TouchableOpacity
                 onPress={() => {
                   setShowTranslationPreview(false);
                   const translatedStory = {
                     id: Date.now().toString(),
                     title: translationContext?.fileName || 'Translated Content',
                     summary: translatedText,
                     text: translatedText,
                     sourceText: translationSource,
                     createdAt: new Date().toISOString(),
                     isAiGenerated: false,
                     ...(translationContext && {
                       audioUri: translationContext.uri,
                       duration: translationContext.duration,
                       transcript: translatedText,
                     }),
                   };
                   setGeneratedStory(translatedStory);
                   setStoryTitle(translationContext?.fileName || 'Translated Story');
                   setStoryDescription(translatedText);
                   setShowCreateStoryModal(true);
                 }}
                 style={{ backgroundColor: theme.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
               >
                 <Ionicons name="share-social-outline" size={18} color="#FFF" />
                 <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>Save & Share</Text>
               </TouchableOpacity>
               <TouchableOpacity
                 onPress={() => setShowTranslationPreview(false)}
                 style={{ borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}
               >
                 <Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: 14 }}>Close</Text>
               </TouchableOpacity>
             </View>
           </View>
         </View>
       </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: SPACING.m },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: FONTS.secondary,
  },
  content: { padding: SPACING.m, flex: 1 },
  instructions: { fontSize: 16, marginBottom: SPACING.l, lineHeight: 24, textAlign: 'center' },
  tabs: { flexDirection: 'row', marginBottom: SPACING.l },
  tab: { flex: 1, alignItems: 'center', paddingVertical: SPACING.s, gap: 4 },
  tabText: { fontSize: 14, fontWeight: '600' },
  
  voiceContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xxl },
  preservationToggle: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.l, gap: 10 },
  toggleLabel: { fontWeight: '600' },
  
  // Custom Action Sheet
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  actionSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  sheetSubtitle: { fontSize: 14, textAlign: 'center', color: '#666', marginBottom: 10 },
  actionOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, gap: 15 },
  actionIconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  actionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  cancelBtn: { marginTop: 10, paddingVertical: 15, borderRadius: 12, alignItems: 'center', width: '100%' },
  readingCard: { padding: SPACING.m, borderRadius: 12, marginBottom: SPACING.l, alignItems: 'center' },
  readingTitle: { fontWeight: '700', marginBottom: 8 },
  readingText: { fontStyle: 'italic', textAlign: 'center', fontSize: 16 },

  recordBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.m,
    ...SHADOWS.medium,
  },
  recordLabel: { fontSize: 16 },

  textContainer: { flex: 1 },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.m,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: SPACING.m,
  },
  generateBtn: {
    padding: SPACING.m,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  generateBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  fileContainer: { flex: 1 },
  uploadBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: SPACING.l
  },
  uploadText: { fontWeight: '600' },
  historyTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: SPACING.m },
  histItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: SPACING.s,
    // Removed gap: 12 to handle spacing manually for layout control
  },
  fileIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  histName: { fontWeight: '600', fontSize: 14 },
  histDate: { fontSize: 12 },

  loadingText: { marginTop: SPACING.m, fontSize: 16 },

  scrollContent: { padding: SPACING.m },
  previewTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: SPACING.m, textAlign: 'center' },
  card: { borderRadius: 16, padding: SPACING.m, marginBottom: SPACING.m, ...SHADOWS.small },
  storyTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: SPACING.s },
  storySummary: { fontSize: 14, fontStyle: 'italic', marginBottom: SPACING.m },
  divider: { height: 1, backgroundColor: '#DDD', marginBottom: SPACING.m },
  pagePreview: { marginBottom: SPACING.l },
  imagePlaceholder: { 
    height: 150, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: SPACING.s,
    padding: SPACING.s
  },
  promptText: { fontSize: 12, textAlign: 'center' },
  pageText: { fontSize: 16, lineHeight: 24 },
  
  actionRow: { flexDirection: 'row', gap: SPACING.m },
  button: { flex: 1, padding: SPACING.m, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  secondaryBtn: { borderWidth: 1, backgroundColor: 'transparent' },
  primaryBtn: {},
  btnText: { fontWeight: 'bold', fontSize: 16 },

  // Modal Styles
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.l },
  modalContent: { width: '100%', borderRadius: 16, padding: SPACING.l, alignItems: 'stretch' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: SPACING.s, textAlign: 'center' },
  modalDesc: { fontSize: 14, marginBottom: SPACING.m, textAlign: 'center' },
  inputField: { borderWidth: 1, borderRadius: 8, padding: SPACING.m, marginBottom: SPACING.l },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  characterCount: { fontSize: 12, textAlign: 'right', marginTop: 4, marginBottom: SPACING.m },
  destinationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    borderRadius: 12,
  },
  destinationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.m },
  modalBtn: { paddingVertical: SPACING.s, paddingHorizontal: SPACING.m, borderRadius: 8 },

  // Simple Action Sheet Styles
  simpleActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 4,
  },
  simpleActionText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },

  // Language Picker (Dict-style) Styles
  langMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 15, 30, 0.72)',
    justifyContent: 'center',
    paddingHorizontal: SPACING.l,
  },
  langMenuCard: {
    borderWidth: 1,
    borderRadius: 16,
    maxHeight: '75%',
    overflow: 'hidden',
  },
  langMenuTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  langMenuSearchWrap: {
    marginHorizontal: SPACING.m,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: SPACING.s,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langMenuSearchInput: {
    flex: 1,
    fontSize: 14,
  },
  langMenuList: {
    paddingHorizontal: SPACING.xs,
  },
  langMenuItem: {
    minHeight: 48,
    borderRadius: 10,
    paddingHorizontal: SPACING.s,
    flexDirection: 'row',
    alignItems: 'center',
  },
  langMenuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  langMenuConfirmBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  langMenuSkipBtn: {
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
  },
});
