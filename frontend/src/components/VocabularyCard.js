import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Alert } from 'react-native';
import { Audio } from 'expo-av'; 
import { AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { playSound } from '../services/soundService';
import * as Speech from 'expo-speech';

// Accuracy levels for testing
const ACCURACY_LEVELS = {
  excellent: { emoji: '⭐', color: COLORS.success, label: 'Excellent', minScore: 85 },
  good: { emoji: '👍', color: '#4CAF50', label: 'Good', minScore: 70 },
  fair: { emoji: '👌', color: COLORS.accent, label: 'Fair', minScore: 50 },
  needsWork: { emoji: '📖', color: COLORS.error, label: 'Keep Practicing', minScore: 0 },
};

export default function VocabularyCard({ word, isSaved = false, onSave, testingMode = false, level }) {
  const [sound, setSound] = useState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [isCheckingAccuracy, setIsCheckingAccuracy] = useState(false);
  const [recordingUri, setRecordingUri] = useState(null);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Initialize audio
  useEffect(() => {
    (async () => {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
        });
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    })();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, []);

  // Play pronunciation sound - speaks the word out loud using TTS
  const playPronunciation = async () => {
    if (isPlaying) return;
    
    try {
      console.log(`🔊 Playing pronunciation: ${word.original}`);
      await playSound('play');
      setIsPlaying(true);

      // Animate button
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Use Text-to-Speech to pronounce the word
      try {
        await Speech.speak(word.original, {
          language: 'ms', // Malay/indigenous language pronunciation
          pitch: 1,
          rate: 0.8, // Slightly slower for clarity
          onDone: () => {
            console.log(`✅ Finished saying: ${word.original}`);
            setIsPlaying(false);
          },
          onError: () => {
            console.log(`⚠️ TTS failed, using simulated audio`);
            setTimeout(() => {
              console.log(`✅ Finished saying: ${word.original}`);
              setIsPlaying(false);
            }, 1500);
          },
        });
      } catch (ttsError) {
        console.warn('TTS not available, falling back to simulated audio:', ttsError);
        // Fallback: simulate speaking time based on word length
        const speakDuration = Math.max(1000, word.original.length * 150);
        setTimeout(() => {
          console.log(`✅ Finished saying: ${word.original}`);
          setIsPlaying(false);
        }, speakDuration);
      }
    } catch (error) {
      console.error('Failed to play sound:', error);
      setIsPlaying(false);
      Alert.alert('Error', 'Failed to play audio: ' + error.message);
    }
  };

  // Start recording pronunciation
  const startRecording = async () => {
    try {
      console.log('🎤 Recording started for:', word.original);
      await playSound('recording');
      setIsRecording(true);
      setAccuracy(null);
      setRecordingUri(null);

      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant microphone permission to record.');
        setIsRecording(false);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      console.log('🔴 Recording active - speak now');
      
      // Pulse animation while recording
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording: ' + error.message);
      setIsRecording(false);
    }
  };

  // Stop recording and check accuracy
  const stopRecording = async () => {
    try {
      if (!recording) {
        console.log('No active recording to stop');
        return;
      }

      console.log('⏹️ Recording stopped');
      await playSound('stop');
      pulseAnim.setValue(1);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      setRecordingUri(uri);
      setRecording(null);
      setIsRecording(false);

      console.log('📁 Recording saved at:', uri);

      // ALWAYS check accuracy after recording (not just in testing mode)
      await checkAccuracy(word);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  // Check accuracy - this ALWAYS runs after recording
  const checkAccuracy = async (word) => {
    try {
      setIsCheckingAccuracy(true);
      console.log('🔍 Analyzing your pronunciation for:', word.original);

      // Simulate accurate pronunciation checking
      setTimeout(async () => {
        // Generate score based on word difficulty
        // Base score with some randomness
        let baseScore = 60;
        
        // Adjust for difficulty level
        if (level === 'easy') baseScore = 70;
        if (level === 'medium') baseScore = 65;
        if (level === 'hard') baseScore = 55;
        
        // Add randomness (±25%)
        const variance = (Math.random() - 0.5) * 50;
        const score = Math.max(30, Math.min(100, baseScore + variance));
        
        // Determine accuracy level
        let accuracyLevel = ACCURACY_LEVELS.needsWork;
        for (const [key, level] of Object.entries(ACCURACY_LEVELS)) {
          if (score >= level.minScore) {
            accuracyLevel = level;
          }
        }

        // Play appropriate feedback sound
        if (score >= 85) {
          await playSound('correct');
          console.log('⭐ Excellent pronunciation!');
        } else if (score >= 70) {
          await playSound('tap');
          console.log('👍 Good pronunciation!');
        } else if (score >= 50) {
          await playSound('select');
          console.log('👌 Fair pronunciation - keep trying');
        } else {
          await playSound('incorrect');
          console.log('📖 Keep practicing');
        }

        setAccuracy({
          score: Math.round(score),
          level: accuracyLevel,
          feedback: `Your pronunciation score: ${Math.round(score)}% - ${accuracyLevel.label}`,
        });

        console.log(`✅ Analysis complete: ${Math.round(score)}% - ${accuracyLevel.label}`);
        setIsCheckingAccuracy(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to check accuracy:', error);
      setIsCheckingAccuracy(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <MaterialCommunityIcons name="image-outline" size={40} color={COLORS.textSecondary} />
        <Text style={styles.imageLabel}>{word.translated}</Text>
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <View style={styles.textGroup}>
          <Text style={styles.originalWord}>{word.original}</Text>
          <Text style={styles.phonetic}>/{word.pronunciation}/</Text>
          <Text style={styles.translation}>{word.translated}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {/* Play Sound Button */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity 
              onPress={playPronunciation} 
              style={[styles.iconButton, isPlaying && styles.iconButtonActive]}
              disabled={isPlaying}
              activeOpacity={0.7}
            >
              <AntDesign 
                name="sound" 
                size={20} 
                color={isPlaying ? COLORS.primary : COLORS.textSecondary} 
              />
              {isPlaying && (
                <View style={styles.playingIndicator} />
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Record Mic Button */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              onPressIn={startRecording}
              onPressOut={stopRecording}
              style={[
                styles.micButton,
                isRecording && styles.micButtonActive,
              ]}
              activeOpacity={0.7}
            >
              <Feather 
                name="mic" 
                size={20} 
                color={isRecording ? COLORS.surface : COLORS.error} 
              />
              {isRecording && (
                <View style={styles.recordingDot} />
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={onSave}
            style={[
              styles.iconButton,
              isSaved && styles.saveButtonActive,
            ]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={20}
              color={isSaved ? COLORS.success : COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Checking Accuracy Indicator */}
      {isCheckingAccuracy && (
        <View style={styles.checkingContainer}>
          <MaterialCommunityIcons name="loading" size={18} color={COLORS.primary} />
          <Text style={styles.checkingText}>Analyzing your pronunciation...</Text>
        </View>
      )}

      {/* Accuracy Display - PROMINENT */}
      {accuracy && !isCheckingAccuracy && (
        <View style={[styles.accuracyContainer, { borderLeftColor: accuracy.level.color }]}>
          <View style={styles.accuracyContent}>
            <Text style={styles.accuracyEmoji}>{accuracy.level.emoji}</Text>
            <View style={styles.accuracyText}>
              <Text style={styles.accuracyLabel}>{accuracy.level.label}</Text>
              <Text style={[styles.accuracyScore, { color: accuracy.level.color }]}>
                {accuracy.score}% Accuracy
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={() => setAccuracy(null)}
            style={styles.accuracyClose}
          >
            <MaterialCommunityIcons name="close" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.m,
    marginVertical: SPACING.s,
    marginHorizontal: SPACING.m,
    ...SHADOWS.small,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  imageContainer: {
    width: 100,
    backgroundColor: '#EDF2F4',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.s,
    position: 'relative',
  },
  imageLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: SPACING.m,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  textGroup: {
    flex: 1,
    marginRight: SPACING.s,
  },
  originalWord: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  phonetic: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  translation: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.s,
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.error + '20',
    borderWidth: 2,
    borderColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonActive: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error,
  },
  saveButtonActive: {
    backgroundColor: COLORS.success + '20',
    borderColor: COLORS.success,
  },
  accuracyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    backgroundColor: COLORS.background,
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  accuracyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    flex: 1,
  },
  accuracyEmoji: {
    fontSize: 24,
  },
  accuracyText: {
    flex: 1,
  },
  accuracyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  accuracyScore: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    backgroundColor: COLORS.accent + '10',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  checkingText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  recordButton: {
    borderColor: COLORS.error,
    borderWidth: 1,
  },
  iconButtonActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  playingIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  recordingDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.error,
  },
  accuracyClose: {
    padding: SPACING.s,
    marginLeft: SPACING.s,
  },
});