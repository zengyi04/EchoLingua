import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Image, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { MaterialIcons, Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { stories } from '../data/mockData';
import { COLORS, SPACING, SHADOWS, FONTS, GLASS_EFFECTS } from '../constants/theme';
import { playSound } from '../services/soundService';
import { useTheme } from '../context/ThemeContext';
import { WORLD_LANGUAGES } from '../constants/languages';
import { storyService } from '../services/api';

const ELDER_VOICES_STORAGE_KEY = '@echolingua_elder_voices';
const STORIES_STORAGE_KEY = '@echolingua_stories';
const SHARED_STORIES_KEY = '@echolingua_shared_stories';
const COMMUNITY_STORIES_KEY = '@echolingua_community_stories';
const NOTIFICATIONS_KEY = '@echolingua_notifications';

export default function StoryScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [failedPageImages, setFailedPageImages] = useState({});
  const [showTranslation, setShowTranslation] = useState(false);
  const [isElderMode, setIsElderMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSource, setAudioSource] = useState(null); // 'recorded' or 'tts'

  // Voice Selection State
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null); // null = default TTS
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showContactShareModal, setShowContactShareModal] = useState(false);
  const [selectedContactRecipients, setSelectedContactRecipients] = useState([]);
  const [playbackStatus, setPlaybackStatus] = useState({ position: 0, duration: 1 });
  const [playbackTimingMode, setPlaybackTimingMode] = useState('exact');
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const audioSoundRef = useRef(null);
  const playbackSessionRef = useRef(0);
  const ttsInterval = useRef(null);

  useEffect(() => {
    loadVoices();
    return () => clearInterval(ttsInterval.current);
  }, []);

  const clearTtsProgressTimer = () => {
    if (ttsInterval.current) {
      clearInterval(ttsInterval.current);
      ttsInterval.current = null;
    }
  };

  const resetPlaybackState = () => {
    setIsPlaying(false);
    setAudioSource(null);
    setPlaybackTimingMode('exact');
    setPlaybackStatus({ position: 0, duration: 1 });
  };

  const teardownPlayback = async ({ unloadSound = true, resetProgress = true } = {}) => {
    playbackSessionRef.current += 1;
    Speech.stop();
    clearTtsProgressTimer();

    const activeSound = audioSoundRef.current;
    if (activeSound) {
      try {
        activeSound.setOnPlaybackStatusUpdate(null);
      } catch (error) {
        console.log('Unable to clear audio callback:', error);
      }

      try {
        const status = await activeSound.getStatusAsync();
        if (status?.isLoaded) {
          await activeSound.stopAsync();
          if (unloadSound) {
            await activeSound.unloadAsync();
          }
        }
      } catch (error) {
        console.log('Unable to tear down story audio:', error);
      }

      if (unloadSound) {
        audioSoundRef.current = null;
      }
    }

    setIsPlaying(false);
    if (unloadSound) {
      setAudioSource(null);
    }
    if (resetProgress) {
      setPlaybackStatus({ position: 0, duration: 1 });
    }
  };

  const beginFreshPlayback = async () => {
    await teardownPlayback({ unloadSound: true, resetProgress: true });
    const sessionId = playbackSessionRef.current + 1;
    playbackSessionRef.current = sessionId;
    return sessionId;
  };

  const finishPlaybackSession = async (sessionId, soundToRelease = null) => {
    if (playbackSessionRef.current !== sessionId) {
      return;
    }

    clearTtsProgressTimer();

    if (soundToRelease && audioSoundRef.current === soundToRelease) {
      try {
        soundToRelease.setOnPlaybackStatusUpdate(null);
        await soundToRelease.unloadAsync();
      } catch (error) {
        console.log('Unable to release completed story audio:', error);
      }
      audioSoundRef.current = null;
    }

    resetPlaybackState();
    playSound('complete');
  };

  const startLocalTtsPlayback = async (text) => {
    const trimmedText = text?.trim();
    if (!trimmedText) {
      Alert.alert('Audio Unavailable', 'No readable story content found.');
      return;
    }

    const sessionId = await beginFreshPlayback();
    const textForSpeech = trimmedText.slice(0, 2000);
    const wordCount = textForSpeech.split(/\s+/).filter(Boolean).length;
    const estimatedDurationMs = Math.max(1500, (wordCount / 150) * 60 * 1000);

    setIsPlaying(true);
    setAudioSource('tts');
    setPlaybackTimingMode('estimated');
    setPlaybackStatus({ position: 0, duration: estimatedDurationMs });
    playSound('play');

    const startTime = Date.now();
    ttsInterval.current = setInterval(() => {
      if (playbackSessionRef.current !== sessionId) {
        clearTtsProgressTimer();
        return;
      }

      const elapsed = Date.now() - startTime;
      if (elapsed < estimatedDurationMs) {
        setPlaybackStatus((prev) => ({ ...prev, position: elapsed }));
      } else {
        setPlaybackStatus({ position: estimatedDurationMs, duration: estimatedDurationMs });
        clearTtsProgressTimer();
      }
    }, 200);

    Speech.speak(textForSpeech, {
      language: getSpeechLanguageCode(),
      rate: 0.95,
      pitch: 1.0,
      onDone: () => {
        finishPlaybackSession(sessionId);
      },
      onStopped: () => {
        if (playbackSessionRef.current !== sessionId) {
          return;
        }
        clearTtsProgressTimer();
        resetPlaybackState();
      },
      onError: () => {
        if (playbackSessionRef.current !== sessionId) {
          return;
        }
        clearTtsProgressTimer();
        resetPlaybackState();
        Alert.alert('Audio Error', 'Text-to-speech failed for this story.');
      },
    });
  };

  const startAudioUriPlayback = async (uri) => {
    const sessionId = await beginFreshPlayback();

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, volume: 1.0, progressUpdateIntervalMillis: 250 }
      );

      if (playbackSessionRef.current !== sessionId) {
        await sound.unloadAsync();
        return;
      }

      audioSoundRef.current = sound;
      setAudioSource('recorded');
      setPlaybackTimingMode('exact');
      setIsPlaying(true);
      playSound('play');

      sound.setOnPlaybackStatusUpdate((status) => {
        if (playbackSessionRef.current !== sessionId) {
          return;
        }

        if (status?.isLoaded) {
          setPlaybackStatus({
            position: status.positionMillis || 0,
            duration: status.durationMillis || 1,
          });
        }

        if (status?.didJustFinish) {
          finishPlaybackSession(sessionId, sound);
        }
      });
    } catch (error) {
      console.log('Could not play story audio URI, falling back to speech:', error);
      await startLocalTtsPlayback(buildReadableStoryText());
    }
  };

  const loadVoices = async () => {
    try {
      const raw = await AsyncStorage.getItem(ELDER_VOICES_STORAGE_KEY);
      if (raw) {
        setAvailableVoices(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Failed to load voices', e);
    }
  };


  const route = useRoute();
  const { storyId, story: passedStory } = route.params || {};
  const [storyState, setStoryState] = useState(passedStory || stories.find(s => s.id === storyId) || stories[0]);
  const story = storyState;

  const formatMillis = (millis) => {
    const safeMillis = Number.isFinite(millis) ? Math.max(0, millis) : 0;
    const totalSeconds = Math.floor(safeMillis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  useEffect(() => {
    const loadLatestStory = async () => {
      if (!storyId) return;
      // Only call backend for real MongoDB ObjectIds (24-char hex).
      // Local stories use Date.now() numeric strings – querying them returns 404.
      const isMongoId = /^[a-f0-9]{24}$/i.test(String(storyId));
      if (!isMongoId) return;
      try {
        const backendStory = await storyService.getById(storyId);
        if (backendStory) {
          setStoryState((prev) => ({
            ...prev,
            ...backendStory,
            pages: (backendStory.pages?.length > 0) ? backendStory.pages : prev.pages,
          }));
        }
      } catch (error) {
        console.warn('Story detail API unavailable, using local story payload:', error?.message || error);
      }
    };
    loadLatestStory();
  }, [storyId]);

  const hasStoryPages = Array.isArray(story.pages) && story.pages.length > 0;

  // Treat as community transcript-only story only when it has no page content.
  const isCommunityStory = !!story.audioUri && !hasStoryPages;

  const buildReadableStoryText = () => {
    if (isCommunityStory) {
      return story.transcript || 'No transcript available for this story yet.';
    }

    if (Array.isArray(story.pages) && story.pages.length > 0) {
      return story.pages
        .map((page) => page.text || page.indigenous_text || page.english_translation || '')
        .join(' ');
    }

    if (typeof story.text === 'string' && story.text.trim()) {
      return story.text.trim();
    }

    return story.title || 'Story content unavailable.';
  };

  const getPageImageUri = (page, index) => {
    const pageKey = `${story?.id || 'story'}-${index}`;

    // If an image already failed for this page, render prompt placeholder instead of random stock photos.
    if (failedPageImages[pageKey]) {
      return null;
    }

    if (page?.image_url) {
      return page.image_url;
    }

    const prompt = (page?.imagePrompt || page?.image_generation_prompt || page?.text || page?.indigenous_text || '').trim();
    if (!prompt) {
      return null;
    }

    // Fallback image generation from prompt when backend does not provide image_url.
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=768&nologo=true`;
  };

  const getPageImageSourceLabel = (page, index) => {
    const pageKey = `${story?.id || 'story'}-${index}`;
    if (failedPageImages[pageKey]) {
      return page?.image_url ? 'AI image unavailable on this device/network' : 'Fallback illustration placeholder';
    }

    if (page?.image_url) {
      return 'AI image (backend)';
    }

    const prompt = (page?.imagePrompt || page?.image_generation_prompt || page?.text || page?.indigenous_text || '').trim();
    if (prompt) {
      return 'AI image (prompt-based)';
    }

    return 'No image source';
  };

  const getSpeechLanguageCode = () => {
    const preferredCandidates = Array.isArray(currentUser?.languages)
      ? currentUser.languages
      : typeof currentUser?.languages === 'string' && currentUser.languages.trim()
        ? currentUser.languages.split(',').map((item) => item.trim()).filter(Boolean)
        : [];

    const storyLanguageRaw = story.languageId || story.language || '';
    const preferredRaw = preferredCandidates[0] || '';

    const resolveLanguageId = (value) => {
      if (!value) return '';
      const normalized = String(value).toLowerCase();
      const byId = WORLD_LANGUAGES.find((lang) => lang.id.toLowerCase() === normalized);
      if (byId) return byId.id;
      const byLabel = WORLD_LANGUAGES.find((lang) => lang.label.toLowerCase() === normalized);
      if (byLabel) return byLabel.id;
      return normalized;
    };

    const langId = resolveLanguageId(storyLanguageRaw) || resolveLanguageId(preferredRaw) || 'english';
    const map = {
      english: 'en-US',
      malay: 'ms-MY',
      indonesian: 'id-ID',
      mandarin: 'zh-CN',
      spanish: 'es-ES',
      french: 'fr-FR',
      arabic: 'ar-SA',
      japanese: 'ja-JP',
      korean: 'ko-KR',
      german: 'de-DE',
      portuguese: 'pt-PT',
      thai: 'th-TH',
      vietnamese: 'vi-VN',
      russian: 'ru-RU',
      italian: 'it-IT',
      turkish: 'tr-TR',
      hindi: 'hi-IN',
      iban: 'ms-MY',
      bidayuh: 'ms-MY',
      kadazan: 'ms-MY',
      murut: 'ms-MY',
      melanau: 'ms-MY',
      penan: 'ms-MY',
    };

    return map[langId] || 'en-US';
  };

  const handleShareToCommunity = async () => {
    try {
      const raw = await AsyncStorage.getItem(COMMUNITY_STORIES_KEY);
      const existing = raw ? JSON.parse(raw) : [];
      const alreadyShared = existing.some((s) => String(s.id) === String(story.id));
      if (!alreadyShared) {
        await AsyncStorage.setItem(
          COMMUNITY_STORIES_KEY,
          JSON.stringify([{ ...story, sharedToCommunityAt: new Date().toISOString() }, ...existing])
        );
      }

      const notifRaw = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      const notifs = notifRaw ? JSON.parse(notifRaw) : [];
      notifs.unshift({
        id: `notif-${Date.now()}`,
        type: 'community_story',
        storyId: story.id,
        storyTitle: story.title,
        authorName: currentUser?.fullName || currentUser?.name || 'A user',
        createdAt: new Date().toISOString(),
        read: false,
      });
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));

      Alert.alert('Shared! 🎉', `"${story.title}" shared to Community.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to share to Community.');
    }
  };

  // New handler: Share to Emergency Contact
  const handleShareToEmergencyContact = async () => {
    setShowOptionsModal(false);
    
    // Load current user
    try {
      const userJson = await AsyncStorage.getItem('@echolingua_current_user');
      const currentUser = userJson ? JSON.parse(userJson) : null;
      
      if (!currentUser?.emergencyContacts || currentUser.emergencyContacts.length === 0) {
        Alert.alert(
          'No Contacts Added',
          'You need to add emergency contacts first. Go to Profile > Emergency Contacts to add contacts.',
          [{ text: 'OK' }]
        );
        return;
      }

      setSelectedContactRecipients([]);
      setShowContactShareModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load contacts: ' + error.message);
    }
  };

  const [currentUser, setCurrentUser] = useState(null);

  const toggleContactRecipient = (contactKey) => {
    setSelectedContactRecipients((prev) =>
      prev.includes(contactKey)
        ? prev.filter((key) => key !== contactKey)
        : [...prev, contactKey]
    );
  };

  const confirmShareToContacts = async () => {
    if (selectedContactRecipients.length === 0) {
      Alert.alert('Select Contact', 'Choose at least one emergency contact.');
      return;
    }

    try {
      const userJson = await AsyncStorage.getItem('@echolingua_current_user');
      const user = userJson ? JSON.parse(userJson) : null;
      const contacts = Array.isArray(user?.emergencyContacts) ? user.emergencyContacts : [];

      const selectedContacts = contacts.filter((c, idx) => {
        const key = `ec-${c.id || c.email || idx}`;
        return selectedContactRecipients.includes(key);
      });

      const sharedRaw = await AsyncStorage.getItem(SHARED_STORIES_KEY);
      const allShared = sharedRaw ? JSON.parse(sharedRaw) : [];
      allShared.push({
        ...story,
        sharedId: `${story.id}-${Date.now()}`,
        sharedBy: user?.fullName || user?.name || 'A user',
        sharedAt: new Date().toISOString(),
        sharedWithEmails: selectedContacts.map((c) => c.email).filter(Boolean),
        sharedWithUserIds: selectedContacts.map((c) => c.linkedUserId).filter(Boolean),
      });
      await AsyncStorage.setItem(SHARED_STORIES_KEY, JSON.stringify(allShared));

      setShowContactShareModal(false);
      setSelectedContactRecipients([]);
      Alert.alert('Shared! 🎉', `"${story.title}" shared with ${selectedContacts.length} contact(s).`);
    } catch (error) {
      Alert.alert('Error', 'Failed to share with selected contacts.');
    }
  };

  // Load current user
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const userJson = await AsyncStorage.getItem('@echolingua_current_user');
        if (userJson) {
          setCurrentUser(JSON.parse(userJson));
        }
      } catch (error) {
        console.error('Failed to load current user:', error);
      }
    };
    loadCurrentUser();
  }, []);

  const handleDeleteStory = async () => {
    Alert.alert(
      'Delete Story',
      'Are you sure you want to delete this story permanently?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (story?.id) {
                try {
                  await storyService.delete(story.id);
                } catch (deleteApiError) {
                  // Keep local delete as fallback.
                }
              }

              const stored = await AsyncStorage.getItem(STORIES_STORAGE_KEY);
              if (stored) {
                const stories = JSON.parse(stored);
                const updatedStories = stories.filter(s => s.id !== story.id);
                await AsyncStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(updatedStories));
                Alert.alert('Deleted', 'Story removed from your library.');
                navigation.goBack();
              }
            } catch (error) {
              console.error('Failed to delete story', error);
              Alert.alert('Error', 'Could not delete story.');
            }
          }
        }
      ]
    );
  };

  const speakStoryFallback = async () => {
    await startLocalTtsPlayback(buildReadableStoryText());
  };

  const handleSeek = async (event) => {
    if (audioSource !== 'recorded' || !audioSoundRef.current || progressBarWidth <= 0) return;
    
    try {
      const { locationX } = event.nativeEvent;
      const percentage = Math.max(0, Math.min(1, locationX / progressBarWidth));
      const newPosition = Math.floor(percentage * playbackStatus.duration);
      
      await audioSoundRef.current.setPositionAsync(newPosition);
      setPlaybackStatus(prevStatus => ({ 
        ...prevStatus, 
        position: newPosition 
      }));
    } catch (error) {
      console.log('Error seeking audio:', error);
    }
  };

  const toggleAudio = async () => {
    try {
      // If playing, pause
      if (isPlaying && audioSoundRef.current) {
        console.log('⏸️ Pausing story audio');
        await audioSoundRef.current.pauseAsync();
        playSound('pause');
        setIsPlaying(false);
      }
      // TTS cannot resume accurately, so stop and reset it.
      else if (isPlaying && !audioSoundRef.current && audioSource === 'tts') {
        await teardownPlayback({ unloadSound: true, resetProgress: true });
      }
      // If already has sound but not playing, resume
      else if (audioSoundRef.current && !isPlaying) {
        console.log('▶️ Resuming story audio');
        await audioSoundRef.current.playAsync();
        playSound('play');
        setIsPlaying(true);
      }
      // Otherwise start fresh playback
      else {
        console.log('▶️ Loading and playing story audio');

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
        });

        if (!story.isAiGenerated && story.audioUri) {
          await startAudioUriPlayback(story.audioUri);
        } else {
          console.log('ℹ️ Using generated story text narration');
          await speakStoryFallback();
        }
      }
    } catch (error) {
      console.error('❌ Audio playback error:', error);
      // Final fallback path for playback failures.
      try {
        await speakStoryFallback();
      } catch (_) {
        Alert.alert('Audio Error', 'Could not play story audio: ' + error.message);
        setIsPlaying(false);
      }
    }
  };

  useEffect(() => {
    teardownPlayback({ unloadSound: true, resetProgress: true }).catch(() => {});
  }, [story?.id]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        Speech.stop();
        teardownPlayback({ unloadSound: true, resetProgress: true }).catch(() => {});
      };
    }, [story?.id])
  );

  useEffect(() => {
    return () => {
      teardownPlayback({ unloadSound: true, resetProgress: true }).catch(() => {});
    };
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with Back Button and Three Action Icons */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
         <TouchableOpacity
           onPress={() => {
             if (navigation.canGoBack()) {
               navigation.goBack();
             } else {
               navigation.navigate('MainTabs', { screen: 'HomeTab' });
             }
           }}
           style={styles.backButton}
         >
           <Ionicons name="arrow-back" size={24} color={theme.text} />
         </TouchableOpacity>
         <View style={{ flex: 1 }}>
            <Text style={[styles.category, { color: theme.secondary }]}>FOLKLORE</Text>
            <Text style={[styles.title, { color: theme.text }]}>{story.title}</Text>
            <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={16} color={theme.textSecondary} /> 
                <Text style={[styles.metaText, { color: theme.textSecondary }]}> 5 min read</Text>
                <Text style={[styles.metaDivider, { color: theme.textSecondary }]}>•</Text>
                <Text style={[styles.metaText, { color: theme.textSecondary }]}>Intermediate</Text>
            </View>
         </View>
         
         {/* More Options Menu - Only show for user's content (Community or AI Generated) */}
         {(isCommunityStory || story.isAiGenerated) && (
           <TouchableOpacity 
             onPress={() => setShowOptionsModal(true)}
             style={{ padding: 8 }}
           >
             <Ionicons name="ellipsis-vertical" size={24} color={theme.text} />
           </TouchableOpacity>
         )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Controls */}
        <View style={[
          styles.controlsCard, 
          { 
            backgroundColor: theme.surface, 
            borderWidth: 0, // Removed border
            elevation: 2,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 4, 
          }
        ]}>
          <View style={styles.controlRow}>
            <Text style={[styles.controlLabel, { color: theme.text }]}>Show Translation</Text>
            <Switch 
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor={showTranslation ? theme.surface : theme.textSecondary}
              value={showTranslation} 
              onValueChange={setShowTranslation} 
            />
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.controlRow}>
            <Text style={[styles.controlLabel, { color: theme.text }]}>Elder Mode (Larger Text)</Text>
            <Switch 
              trackColor={{ false: theme.border, true: theme.secondary }}
              thumbColor={isElderMode ? theme.surface : theme.textSecondary}
              value={isElderMode} 
              onValueChange={setIsElderMode} 
            />
          </View>

          {/* Voice Narrator Selection (Only for standard stories) */}
          {!isCommunityStory && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <TouchableOpacity style={styles.controlRow} onPress={() => setShowVoiceModal(true)}>
                <Text style={[styles.controlLabel, { color: theme.text }]}>Narrator Voice</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: theme.primary, marginRight: 8, fontWeight: '600' }}>
                    {selectedVoice ? selectedVoice.name : 'Default AI'}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Audio Player */}
        <TouchableOpacity style={[styles.audioPlayer, isCommunityStory && [styles.audioPlayerDark, { backgroundColor: theme.surface }], !isCommunityStory && { backgroundColor: theme.primary }]} onPress={toggleAudio} activeOpacity={0.9}>
           <View style={[styles.playButton, isCommunityStory && [styles.playButtonDark, { backgroundColor: theme.primary }], !isCommunityStory && { backgroundColor: theme.surface }]}>
             <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={32} color={isCommunityStory ? theme.surface : theme.primary} />
           </View>
           <View style={styles.audioInfo}>
             <Text style={[styles.audioTitle, isCommunityStory && [styles.audioTitleDark, { color: theme.text }], !isCommunityStory && { color: theme.onPrimary || '#FFFFFF' }]}>
               {isCommunityStory ? 'Listen to Recording' : 'Listen to Legend'}
             </Text>
             <Text style={[styles.audioSubtitle, isCommunityStory && [styles.audioSubtitleDark, { color: theme.textSecondary }], !isCommunityStory && { color: 'rgba(255,255,255,0.8)' }]}>
               {isCommunityStory ? `Community Story • ${story.language}` : 'Narrated by Elder Kambera'}
             </Text>
             {isCommunityStory && story.sentByLabel && (
               <Text style={[styles.audioSubtitle, isCommunityStory && [styles.audioSubtitleDark, { color: theme.textSecondary }]]}>
                 {story.sentByLabel}
               </Text>
             )}
             {isCommunityStory && !!story.description && (
               <Text style={[styles.audioDescription, { color: theme.textSecondary }]}>
                 {story.description}
               </Text>
             )}
             {audioSource && isPlaying && (
               <Text style={[styles.audioSourceLabel, { color: isCommunityStory ? theme.text : (theme.onPrimary || '#FFFFFF') }]}>
                 🔊 {audioSource === 'recorded' ? '🎙️ Audio Playback' : '🗣️ Live Voice Reading'}
               </Text>
             )}
             
             {/* Audio Progress Bar */}
             {(audioSource === 'recorded' || audioSource === 'tts') && (isPlaying || playbackStatus.position > 0) && (
               <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                 <View 
                   style={{ flex: 1, height: 30, justifyContent: 'center', marginRight: 8 }}
                   onLayout={(e) => setProgressBarWidth(e.nativeEvent.layout.width)}
                   onResponderRelease={handleSeek}
                   onStartShouldSetResponder={() => isCommunityStory && audioSource === 'recorded' && playbackTimingMode === 'exact'}
                 >
                   {/* Track Background */}
                   <View style={{ height: 4, backgroundColor: theme.textSecondary + '40', borderRadius: 2, width: '100%', position: 'absolute' }} />
                   
                   {/* Progress Fill */}
                   <View 
                     style={{ 
                       width: `${Math.min((playbackStatus.position / playbackStatus.duration) * 100, 100)}%`, 
                       height: 4, 
                       backgroundColor: isCommunityStory ? theme.primary : (theme.onPrimary || '#FFFFFF'), 
                       borderRadius: 2 
                     }} 
                   />

                   {/* Seek Thumb (Only for Recorded Audio) */}
                   {isCommunityStory && audioSource === 'recorded' && playbackTimingMode === 'exact' && (
                     <View 
                       style={{
                         position: 'absolute',
                         left: `${Math.min((playbackStatus.position / playbackStatus.duration) * 100, 100)}%`,
                         width: 12,
                         height: 12,
                         borderRadius: 6,
                         backgroundColor: theme.primary,
                         marginLeft: -6,
                         elevation: 2,
                         shadowColor: "#000",
                         shadowOffset: { width: 0, height: 1 },
                         shadowOpacity: 0.2,
                         shadowRadius: 1.41,
                       }}
                     />
                   )}
                 </View>

                 <Text style={{ fontSize: 10, color: isCommunityStory ? theme.textSecondary : 'rgba(255,255,255,0.8)' }}>
                   {playbackTimingMode === 'exact'
                     ? `${formatMillis(playbackStatus.position)} / ${formatMillis(playbackStatus.duration)}`
                     : `${formatMillis(playbackStatus.position)} / Live voice`}
                 </Text>
               </View>
             )}
           </View>
           <Feather name="headphones" size={24} color={isCommunityStory ? theme.primary : (theme.onPrimary || '#FFFFFF')} style={{ opacity: 0.5 }} />
        </TouchableOpacity>

        {/* Story Content */}
        <View style={[
          styles.contentCard, 
          { 
            backgroundColor: theme.surface, 
            borderWidth: 0,
            elevation: 3,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 8,
          }
        ]}>
          {isCommunityStory ? (
            // Community story: Show transcript
            <View style={styles.pageContainer}>
               <Text style={[
                 styles.storyText, 
                 { color: theme.text },
                 isElderMode && styles.elderText
               ]}>
                  {story.transcript || 'No transcript available.'}
               </Text>
               
               {showTranslation && (
                 <View style={[styles.translationBox, { backgroundColor: theme.glassMedium, borderLeftColor: theme.secondary }]}>
                   <Text style={[styles.translationLabel, { color: theme.secondary }]}>Translation:</Text>
                   <Text style={[styles.translationText, { color: theme.textSecondary }]}>
                     {story.description || story.summary || story.transcript || 'Translation unavailable for this story.'}
                   </Text>
                 </View>
               )}
            </View>
          ) : (
            // Default story: Show pages
            story.pages?.map((page, index) => (
              <View key={index} style={styles.pageContainer}>
                 <Text style={[
                   styles.storyText, 
                   { color: theme.text },
                   isElderMode && styles.elderText
                 ]}>
                    {page.text || page.indigenous_text || page.english_translation || 'No story text available.'}
                 </Text>
                 
                 {showTranslation && (
                   <View style={[styles.translationBox, { backgroundColor: theme.glassMedium, borderLeftColor: theme.secondary }]}>
                     <Text style={[styles.translationLabel, { color: theme.secondary }]}>Translation:</Text>
                     <Text style={[styles.translationText, { color: theme.textSecondary }]}>
                       {page.translation || page.english_translation || 'Translation unavailable for this page.'}
                     </Text>
                   </View>
                 )}
              </View>
            ))
          )}
        </View>
        
        {/* Story Actions: Create Your Own (Only shown for non-user content) */}
        {!(isCommunityStory || story.isAiGenerated) && (
          <TouchableOpacity 
            style={[styles.createStoryButton, { backgroundColor: theme.secondary, marginBottom: 20 }]} 
            onPress={() => navigation.navigate('AIStoryGenerator')}
          >
             <FontAwesome5 name="pencil-alt" size={20} color={theme.onPrimary || '#FFFFFF'} />
             <Text style={[styles.createStoryText, { color: theme.onPrimary || '#FFFFFF' }]}>Create Your Own AI Folktale</Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* Voice Selection Modal */}
      <Modal
        visible={showVoiceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVoiceModal(false)}
      >
        <TouchableOpacity 
           style={styles.modalOverlay} 
           activeOpacity={1} 
           onPress={() => setShowVoiceModal(false)}
        >
           <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                 <Text style={[styles.modalTitle, { color: theme.text }]}>Choose a Narrator</Text>
                 <TouchableOpacity onPress={() => setShowVoiceModal(false)}>
                    <Ionicons name="close" size={24} color={theme.textSecondary} />
                 </TouchableOpacity>
              </View>
              
              <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                Experience the story as told by our revered elders.
              </Text>

              <ScrollView style={{ maxHeight: 300 }}>
                 {/* Default Option */}
                 <TouchableOpacity 
                    style={[styles.voiceOption, !selectedVoice && { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
                    onPress={() => { setSelectedVoice(null); setShowVoiceModal(false); }}
                 >
                    <View style={[styles.voiceIcon, { backgroundColor: theme.primary }]}>
                       <MaterialIcons name="record-voice-over" size={24} color="#FFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                       <Text style={[styles.voiceName, { color: theme.text }]}>Default AI Narrator</Text>
                       <Text style={[styles.voiceDesc, { color: theme.textSecondary }]}>Clear, standard pronunciation</Text>
                    </View>
                    {!selectedVoice && <Ionicons name="checkmark-circle" size={24} color={theme.primary} />}
                 </TouchableOpacity>

                 {/* Saved Elder Voices */}
                 {availableVoices.map((voice) => (
                    <TouchableOpacity 
                       key={voice.id} 
                       style={[styles.voiceOption, selectedVoice?.id === voice.id && { backgroundColor: theme.secondary + '20', borderColor: theme.secondary }]}
                       onPress={() => { setSelectedVoice(voice); setShowVoiceModal(false); }}
                    >
                       <View style={[styles.voiceIcon, { backgroundColor: theme.secondary }]}>
                          <MaterialIcons name="mic" size={24} color="#FFF" />
                       </View>
                       <View style={{ flex: 1 }}>
                          <Text style={[styles.voiceName, { color: theme.text }]}>{voice.name}</Text>
                          <Text style={[styles.voiceDesc, { color: theme.textSecondary }]}>Preserved on {new Date(voice.dateCreated).toLocaleDateString()}</Text>
                       </View>
                       {selectedVoice?.id === voice.id && <Ionicons name="checkmark-circle" size={24} color={theme.secondary} />}
                    </TouchableOpacity>
                 ))}

                 {availableVoices.length === 0 && (
                    <View style={styles.emptyState}>
                       <Text style={{ color: theme.textSecondary, textAlign: 'center', margin: 20 }}>
                          No elder voices preserved yet. Create one in the Story Generator!
                       </Text>
                    </View>
                 )}
              </ScrollView>
           </View>
        </TouchableOpacity>
      </Modal>

      {/* Story Options Dropdown */}
      <Modal
         visible={showOptionsModal}
         transparent={true}
         animationType="fade"
         onRequestClose={() => setShowOptionsModal(false)}
      >
         <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={() => setShowOptionsModal(false)}
         >
            <View style={{ 
               position: 'absolute', 
               top: 80, 
               right: 20, 
               width: 220,
               backgroundColor: theme.surface, 
               borderRadius: 12, 
               padding: 8,
               shadowColor: "#000",
               shadowOffset: { width: 0, height: 2 },
               shadowOpacity: 0.25,
               shadowRadius: 3.84,
               elevation: 5,
               borderWidth: 1,
               borderColor: theme.border
            }}>
               {/* Share to Emergency Contact */}
               <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}
                  onPress={() => {
                     setShowOptionsModal(false);
                     handleShareToEmergencyContact();
                  }}
               >
                  <Ionicons name="people" size={20} color={theme.primary} style={{ marginRight: 12 }} />
                  <Text style={{ color: theme.text, fontSize: 14 }}>Share to Contact</Text>
               </TouchableOpacity>

               {/* Share to Community */}
               <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}
                  onPress={() => {
                     setShowOptionsModal(false);
                     handleShareToCommunity();
                  }}
               >
                  <Ionicons name="share-social" size={20} color={theme.accent || theme.secondary} style={{ marginRight: 12 }} />
                  <Text style={{ color: theme.text, fontSize: 14 }}>Share to Community</Text>
               </TouchableOpacity>

              {/* Delete story */}
               <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}
                  onPress={() => {
                     setShowOptionsModal(false);
                  handleDeleteStory();
                  }}
               >
                <Ionicons name="trash-outline" size={20} color={theme.error || '#E53935'} style={{ marginRight: 12 }} />
                <Text style={{ color: theme.error || '#E53935', fontSize: 14 }}>Delete Story</Text>
               </TouchableOpacity>
            </View>
         </TouchableOpacity>
      </Modal>

      {/* Emergency Contact Selection Modal */}
      <Modal
        visible={showContactShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowContactShareModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 14, paddingBottom: 20, maxHeight: '70%' }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: 'center', marginBottom: 14 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text }}>Share to Emergency Contacts</Text>
              <TouchableOpacity onPress={() => setShowContactShareModal(false)}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}>
              {(currentUser?.emergencyContacts || []).map((contact, idx) => {
                const key = `ec-${contact.id || contact.email || idx}`;
                const chosen = selectedContactRecipients.includes(key);
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => toggleContactRecipient(key)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderRadius: 14,
                      borderWidth: chosen ? 2 : 1,
                      borderColor: chosen ? theme.accent : theme.border,
                      backgroundColor: chosen ? theme.accent + '0C' : theme.background,
                      padding: 14,
                      marginBottom: 10,
                    }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.accent + '22', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Text style={{ color: theme.accent, fontWeight: '700', fontSize: 16 }}>{contact.name?.[0]?.toUpperCase() || '?'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>{contact.name || 'Contact'}</Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{contact.relation || contact.email || 'Emergency contact'}</Text>
                    </View>
                    <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: chosen ? theme.accent : theme.border, backgroundColor: chosen ? theme.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                      {chosen && <Ionicons name="checkmark" size={13} color="#FFF" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={{ paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 }}>
              <TouchableOpacity
                onPress={confirmShareToContacts}
                style={{ backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
              >
                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>Share Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... existing styles ...
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.l, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.s },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalSubtitle: { fontSize: 14, marginBottom: SPACING.l },
  voiceOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: SPACING.m, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: 'transparent', 
    marginBottom: SPACING.s,
    backgroundColor: 'rgba(0,0,0,0.03)' 
  },
  voiceIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.m },
  voiceName: { fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
  voiceDesc: { fontSize: 12 },
  
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.l,
    paddingBottom: SPACING.xxl,
  },
  header: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.m,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.background,
    zIndex: 10,
  },
  backButton: {
    marginRight: SPACING.m,
    marginTop: 4, // Align with text
  },
  category: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: 1.5,
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: 24, // Slightly smaller to fit with back button
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.s,
    lineHeight: 30,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  metaDivider: {
    marginHorizontal: SPACING.s,
    color: COLORS.textSecondary,
  },
  controlsCard: {
    backgroundColor: COLORS.glassLight,
    borderRadius: SPACING.m,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    padding: SPACING.m,
    marginBottom: SPACING.l,
    ...SHADOWS.small,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  controlLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: SPACING.s,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9', // Light green background
    padding: SPACING.m,
    borderRadius: SPACING.l,
    marginBottom: SPACING.l,
    borderWidth: 0, // No border
    // borderColor: COLORS.primary + '20', // transparent primary
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  audioPlayerDark: {
    backgroundColor: COLORS.glassLight,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  playButton: {
    backgroundColor: COLORS.primary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  playButtonDark: {
    backgroundColor: COLORS.secondary,
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    fontWeight: '700',
    color: COLORS.text,
    fontSize: 16,
  },
  audioTitleDark: {
    color: COLORS.text,
  },
  audioSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  audioSubtitleDark: {
    color: COLORS.textSecondary,
  },
  audioDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  audioSourceLabel: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  contentCard: {
    backgroundColor: COLORS.glassLight,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    padding: SPACING.l,
    borderRadius: SPACING.m,
    ...SHADOWS.small,
    minHeight: 300,
  },
  pageContainer: {
    marginBottom: SPACING.l,
    paddingBottom: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  storyText: {
    fontSize: 20,
    lineHeight: 32,
    color: COLORS.text,
    fontFamily: FONTS.medium, // In real app, use a serif font here
  },
  elderText: {
    fontSize: 26,
    lineHeight: 38,
    fontWeight: '600',
  },
  translationBox: {
    marginTop: SPACING.m,
    padding: SPACING.m,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: SPACING.s,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.secondary,
  },
  translationLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  translationText: {
    fontSize: 16,
    color: '#555',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  createStoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    padding: SPACING.l,
    borderRadius: SPACING.l,
    marginTop: SPACING.xl,
    ...SHADOWS.large,
  },
  createStoryText: {
    color: COLORS.surface,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: SPACING.s,
  },
  illustrationPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: SPACING.m,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.m,
    padding: SPACING.m,
    overflow: 'hidden',
  },
  illustrationText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    fontStyle: 'italic',
  },
  imageSourceLabel: {
    fontSize: 11,
    marginTop: -8,
    marginBottom: SPACING.s,
    fontStyle: 'italic',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    borderRadius: 12,
    gap: 12,
    marginBottom: 4,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  cancelButton: {
    padding: SPACING.m,
    borderRadius: 12,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: -10,
  },
});