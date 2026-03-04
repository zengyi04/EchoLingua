import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Audio } from 'expo-av'; 
import { AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, FONTS } from '../constants/theme';

export default function VocabularyCard({ word }) {
  const [sound, setSound] = React.useState();

  async function playSound() {
    console.log('Loading Sound');
    // Simulated playback
    alert(`Playing pronunciation for: ${word.original}`);
  }

  React.useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading Sound');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  return (
    <View style={styles.card}>
      {/* Image Section */}
      <View style={styles.imageContainer}>
         {/* Placeholder for real image */}
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
          <TouchableOpacity onPress={playSound} style={styles.iconButton}>
            <AntDesign name="sound" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => alert('Recording...')} style={[styles.iconButton, styles.recordButton]}>
            <Feather name="mic" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
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
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  imageContainer: {
    width: 100,
    backgroundColor: '#EDF2F4', // Light gray/blue
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.s,
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
    fontStyle: 'italic',
    marginBottom: 2,
  },
  translation: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'column', // Stack icons vertically
    gap: SPACING.s,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9', // Light green bg
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    backgroundColor: '#FFEBEE', // Light red bg
  },
});