import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity,  ScrollView, TextInput, Alert, ActivityIndicator, Image, FlatList, Switch, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Octicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS, SPACING, SHADOWS, FONTS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { prepareSingleRecording, stopAndReleaseRecording } from '../services/recordingService';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash';
const STORIES_STORAGE_KEY = '@echolingua_stories';
const RECORDINGS_STORAGE_KEY = '@echolingua_recordings';
const ELDER_VOICES_STORAGE_KEY = '@echolingua_elder_voices';

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

  // Load recordings on mount
  useEffect(() => {
    loadRecordings();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

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
    } catch (e) {
      console.error('Failed to load recordings', e);
    }
  };

  const startRecording = async () => {
    try {
      const active = await prepareSingleRecording();
      setRecording(active);
      setIsRecording(true);
    } catch (error) {
      Alert.alert('Error', 'Could not start recording.');
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
    await processAudioFile(rec.uri);
  };

  const processAudioFile = async (uri) => {
      // 1. Transcribe
      setLoadingMessage('Transcribing audio...');
      const audioResponse = await fetch(uri);
      const buffer = await audioResponse.arrayBuffer();
      const base64Audio = toBase64(new Uint8Array(buffer));

      const transcriptionText = await transcribeAudio(base64Audio);
      
      if (!transcriptionText) {
        throw new Error('Transcription failed');
      }

      // 2. Generate Story
      setLoadingMessage('Weaving the story magic...');
      await generateStoryFromText(transcriptionText);
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

  const transcribeAudio = async (base64Audio) => {
    // MOCK MODE: If backend is unavailable or fails, use this mock
    const useMock = true; 
    
    try {
      if (useMock || !GEMINI_API_KEY) {
        throw new Error('Using Mock Transcription');
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [
                { text: 'Transcribe this audio exactly. Return only the text. If it is already text, fix grammar.' },
                { inline_data: { mime_type: 'audio/mp4', data: base64Audio } }
              ]
            }]
          })
        }
      );
      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (e) {
      console.log('API Transcription failed or skipped, using mock data:', e.message);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return "Long ago, in the deep forests of Borneo, there lived a small mouse deer named Sang Kancil. He was small but very clever, always outsmarting the bigger animals like the crocodile and the tiger.";
    }
  };

  const generateStoryFromText = async (seedText) => {
    // MOCK MODE: If backend is unavailable or fails, use this mock
    const useMock = true;

    try {
      setLoadingMessage('Illustrating and expanding...');
      
      if (useMock || !GEMINI_API_KEY) {
        throw new Error('Using Mock Generation');
      }

      const prompt = `
        You are an expert indigenous storyteller.
        Take this fragment: "${seedText}"
        
        Create a full children's story based on it.
        Return a JSON object with this EXACT structure (no markdown formatting, just raw JSON):
        {
          "title": "Story Title",
          "summary": "Short summary",
          "language": "English (but use indigenous names/concepts)",
          "pages": [
            { "text": "Paragraph 1...", "imagePrompt": "Description of image for page 1" },
            { "text": "Paragraph 2...", "imagePrompt": "Description of image for page 2" },
            { "text": "Paragraph 3...", "imagePrompt": "Description of image for page 3" }
          ]
        }
        Keep it to 3-5 pages.
      `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
          })
        }
      );
      
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const storyObj = JSON.parse(cleanJson);
      
      finishGeneration(storyObj);

    } catch (e) {
      console.log('API Generation failed or skipped, using mock data:', e.message);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockStory = {
        title: "Sang Kancil and the River",
        summary: "A clever mouse deer tricks the crocodiles to cross the river.",
        language: "English / Malay Folklore",
        pages: [
          { 
            text: "One hot afternoon, Sang Kancil the mouse deer wanted to cross the river to eat the delicious fruits on the other side. But the river was full of hungry crocodiles.", 
            imagePrompt: "A small mouse deer standing by a river bank looking at floating crocodiles" 
          },
          { 
            text: "Sang Kancil called out to the King of Crocodiles, 'The King has ordered me to count all the crocodiles in the river for a feast! Line up so I can count you!'", 
            imagePrompt: "Crocodiles lining up across the river forming a bridge" 
          },
          { 
            text: "The foolish crocodiles lined up from one bank to the other. Sang Kancil jumped on their backs, 'One! Two! Three!' he counted as he hopped across.", 
            imagePrompt: "Mouse deer jumping on the backs of crocodiles" 
          },
          { 
            text: "When he reached the other side, he laughed, 'Thank you for the bridge!' and ran off to enjoy the fruits, leaving the angry crocodiles behind.", 
            imagePrompt: "Mouse deer eating fruits on the river bank, crocodiles looking angry in the water" 
          }
        ]
      };
      
      finishGeneration(mockStory);
    }
  };

  const finishGeneration = async (storyObj) => {
      const newStory = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        isAiGenerated: true,
        ...storyObj
      };
      
      // Auto-save to library
      try {
        const existingRaw = await AsyncStorage.getItem(STORIES_STORAGE_KEY);
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const newStories = [newStory, ...existing];
        await AsyncStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(newStories));
      } catch (e) {
        console.error('Failed to auto-save story', e);
      }

      setMode('input');
      setLoadingMessage('');
      navigation.navigate('Story', { story: newStory });
  };



  const saveStory = async () => {
    try {
      const existingRaw = await AsyncStorage.getItem(STORIES_STORAGE_KEY);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const newStories = [generatedStory, ...existing];
      await AsyncStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(newStories));
      
      Alert.alert('Success', 'Story saved to library!');
      navigation.replace('Story', { story: generatedStory });
    } catch (e) {
      Alert.alert('Error', 'Failed to save story.');
    }
  };

  const loadRecordingsFromStorage = async () => {
      try {
        const raw = await AsyncStorage.getItem(RECORDINGS_STORAGE_KEY);
        if (raw) setRecordings(JSON.parse(raw));
      } catch (e) {}
  };

  useEffect(() => {
    loadRecordingsFromStorage();
  }, []);

  // Helper
  function toBase64(bytes) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    while (i < bytes.length) {
      const a = bytes[i++];
      const b = i < bytes.length ? bytes[i++] : undefined;
      const c = i < bytes.length ? bytes[i++] : undefined;
      const triplet = (a << 16) | ((b || 0) << 8) | (c || 0);
      result += chars[(triplet >> 18) & 63];
      result += chars[(triplet >> 12) & 63];
      result += b === undefined ? '=' : chars[(triplet >> 6) & 63];
      result += c === undefined ? '=' : chars[triplet & 63];
    }
    return result;
  }

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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.previewTitle, { color: theme.primary }]}>✨ Story Revived!</Text>
          
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.storyTitle, { color: theme.text }]}>{generatedStory.title}</Text>
            <Text style={[styles.storySummary, { color: theme.textSecondary }]}>{generatedStory.summary}</Text>
            
            <View style={styles.divider} />
            
            {generatedStory.pages.map((page, index) => (
              <View key={index} style={styles.pagePreview}>
                 <View style={[styles.imagePlaceholder, { backgroundColor: theme.secondary + '20' }]}>
                    <MaterialCommunityIcons name="image-outline" size={30} color={theme.secondary} />
                    <Text style={[styles.promptText, { color: theme.textSecondary }]}>Image: {page.imagePrompt}</Text>
                 </View>
                 <Text style={[styles.pageText, { color: theme.text }]}>{page.text}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.button, styles.secondaryBtn, { borderColor: theme.border }]} 
              onPress={() => setMode('input')}
            >
              <Text style={[styles.btnText, { color: theme.text }]}>Discard</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.primaryBtn, { backgroundColor: theme.primary }]} 
              onPress={saveStory}
            >
               <Ionicons name="save-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={[styles.btnText, { color: '#FFF' }]}>Save to Library</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
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
               <TouchableOpacity 
                  style={[styles.generateBtn, { backgroundColor: theme.primary }]}
                  onPress={handleTextGenerate}
               >
                 <MaterialCommunityIcons name="wand" size={20} color="#FFF" style={{ marginRight: 8 }} />
                 <Text style={styles.generateBtnText}>Generate Story</Text>
               </TouchableOpacity>
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
                      onPress={() => {
                         setShowActionModal(false);
                         if (selectedRecording) {
                             navigation.navigate('CommunityStory', {
                                audioUri: selectedRecording.uri,
                                duration: selectedRecording.duration,
                                fileName: selectedRecording.fileName,
                                transcript: selectedRecording.transcript,
                                description: selectedRecording.transcript 
                             });
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
});
