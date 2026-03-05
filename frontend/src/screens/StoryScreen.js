import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { stories } from '../data/mockData';
import { COLORS, SPACING, SHADOWS, FONTS } from '../constants/theme';
import { playSound } from '../services/soundService';

export default function StoryScreen() {
  const navigation = useNavigation();
  const [showTranslation, setShowTranslation] = useState(false);
  const [isChildrenMode, setIsChildrenMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const route = useRoute();
  const { storyId } = route.params || {};
  const story = stories.find(s => s.id === storyId) || stories[0]; 

  const toggleAudio = () => {
    if (isPlaying) {
      console.log('⏸️ Pausing story audio');
      playSound('pause');
      setIsPlaying(false);
    } else {
      console.log('▶️ Playing story audio');
      playSound('play');
      setIsPlaying(true);
      // Simulate audio playback - in production, use expo-av Audio.Sound
      setTimeout(() => {
        setIsPlaying(false);
        playSound('complete');
        console.log('✅ Story audio completed');
      }, 5000); // Auto-stop after 5 seconds (demo)
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
           <Ionicons name="arrow-back" size={24} color={COLORS.text} />
         </TouchableOpacity>
         <View style={{ flex: 1 }}>
            <Text style={styles.category}>FOLKLORE</Text>
            <Text style={styles.title}>{story.title}</Text>
            <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} /> 
                <Text style={styles.metaText}> 5 min read</Text>
                <Text style={styles.metaDivider}>•</Text>
                <Text style={styles.metaText}>Intermediate</Text>
            </View>
         </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Controls */}
        <View style={styles.controlsCard}>
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Show Translation</Text>
            <Switch 
              trackColor={{ false: "#e0e0e0", true: COLORS.primary }}
              thumbColor={COLORS.surface}
              value={showTranslation} 
              onValueChange={setShowTranslation} 
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Children's Mode</Text>
            <Switch 
              trackColor={{ false: "#e0e0e0", true: COLORS.secondary }}
              thumbColor={COLORS.surface}
              value={isChildrenMode} 
              onValueChange={setIsChildrenMode} 
            />
          </View>
        </View>

        {/* Audio Player */}
        <TouchableOpacity style={styles.audioPlayer} onPress={toggleAudio} activeOpacity={0.9}>
           <View style={styles.playButton}>
             <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={32} color={COLORS.surface} />
           </View>
           <View style={styles.audioInfo}>
             <Text style={styles.audioTitle}>Listen to Legend</Text>
             <Text style={styles.audioSubtitle}>Narrated by Elder Kambera</Text>
           </View>
           <Feather name="headphones" size={24} color={COLORS.primary} style={{ opacity: 0.5 }} />
        </TouchableOpacity>

        {/* Story Content */}
        <View style={styles.contentCard}>
          {story.pages.map((page, index) => (
            <View key={index} style={styles.pageContainer}>
               <Text style={[
                 styles.storyText, 
                 isChildrenMode && styles.kidsText
               ]}>
                  {page.text}
               </Text>
               
               {showTranslation && (
                 <View style={styles.translationBox}>
                   <Text style={styles.translationLabel}>Translation:</Text>
                   <Text style={styles.translationText}>{page.translation}</Text>
                 </View>
               )}
            </View>
          ))}
        </View>
        
        {/* Create Your Own Story CTA */}
        <TouchableOpacity style={styles.createStoryButton} onPress={() => alert('Opening Folktale Builder (Demo)')}>
           <FontAwesome5 name="pencil-alt" size={20} color={COLORS.surface} />
           <Text style={styles.createStoryText}>Create Your Own Folktale</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.m,
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
    backgroundColor: '#f0f0f0',
    marginVertical: SPACING.s,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9', // Light green background
    padding: SPACING.m,
    borderRadius: SPACING.l,
    marginBottom: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.primary + '20', // transparent primary
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
    ...SHADOWS.medium,
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    fontWeight: '700',
    color: COLORS.text,
    fontSize: 16,
  },
  audioSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  contentCard: {
    backgroundColor: COLORS.surface,
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
  kidsText: {
    fontSize: 26,
    lineHeight: 38,
    fontFamily: 'monospace', // Or a rounded font
    color: '#2C3E50',
  },
  translationBox: {
    marginTop: SPACING.m,
    padding: SPACING.m,
    backgroundColor: '#FAFAFA',
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
});