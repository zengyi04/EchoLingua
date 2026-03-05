import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import VocabularyCard from '../components/VocabularyCard';
import { vocabularyList } from '../data/mockData';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';

// Organized vocabulary by difficulty level
const VOCABULARY_BY_DIFFICULTY = {
  easy: vocabularyList.filter(word => word.difficulty === 'easy'),
  medium: vocabularyList.filter(word => word.difficulty === 'medium'),
  hard: vocabularyList.filter(word => word.difficulty === 'hard'),
};

export default function VocabularyScreen() {
  const navigation = useNavigation();
  const [selectedLevel, setSelectedLevel] = useState('easy');
  const [savedWords, setSavedWords] = useState({
    easy: [],
    medium: [],
    hard: [],
  });
  const [testingMode, setTestingMode] = useState(false);

  const currentVocabulary = VOCABULARY_BY_DIFFICULTY[selectedLevel];

  const handleSaveWord = (word, level) => {
    // Check if word already saved
    const alreadySaved = savedWords[level].some(w => w.id === word.id);
    
    if (alreadySaved) {
      // Remove from saved
      setSavedWords({
        ...savedWords,
        [level]: savedWords[level].filter(w => w.id !== word.id),
      });
      console.log(`❌ Removed ${word.original} from saved`);
    } else {
      // Add to saved
      setSavedWords({
        ...savedWords,
        [level]: [...savedWords[level], word],
      });
      console.log(`✅ Saved ${word.original} to ${level} collection`);
    }
  };

  const isWordSaved = (word, level) => {
    return savedWords[level].some(w => w.id === word.id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Learn Vocabulary</Text>
          <Text style={styles.headerSubtitle}>Practice pronunciation & test yourself</Text>
        </View>
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => setTestingMode(!testingMode)}
        >
          <MaterialCommunityIcons name="clipboard-check" size={24} color={testingMode ? COLORS.error : COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Testing Mode Banner */}
      {testingMode && (
        <View style={styles.testingBanner}>
          <MaterialCommunityIcons name="lightbulb" size={20} color={COLORS.accent} />
          <Text style={styles.testingText}>Testing Mode: Record and we'll mark your accuracy</Text>
        </View>
      )}

      {/* Difficulty Level Tabs - Improved Layout */}
      <View style={styles.tabsContainer}>
        {['easy', 'medium', 'hard'].map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.tab,
              selectedLevel === level && styles.tabActive,
            ]}
            onPress={() => {
              console.log(`🎯 Switched to ${level} level`);
              setSelectedLevel(level);
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                selectedLevel === level && styles.tabTextActive,
              ]}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
            <Text style={[
              styles.tabCount,
              selectedLevel === level && { color: COLORS.surface + 'CC' }
            ]}>
              {VOCABULARY_BY_DIFFICULTY[level].length} words
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Saved Words Counter */}
      <View style={styles.counterRow}>
        <View style={styles.counterItem}>
          <MaterialCommunityIcons name="bookmark" size={16} color={COLORS.success} />
          <Text style={styles.counterText}>
            {savedWords[selectedLevel].length} saved
          </Text>
        </View>
      </View>

      {/* Vocabulary List */}
      <FlatList
        data={currentVocabulary}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <VocabularyCard
            word={item}
            isSaved={isWordSaved(item, selectedLevel)}
            onSave={() => handleSaveWord(item, selectedLevel)}
            testingMode={testingMode}
            level={selectedLevel}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.l,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.small,
  },
  backButton: {
    paddingRight: SPACING.m,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  testButton: {
    padding: SPACING.s,
  },
  testingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    backgroundColor: COLORS.accent + '20',
    padding: SPACING.m,
    marginHorizontal: SPACING.m,
    marginVertical: SPACING.s,
    borderRadius: SPACING.s,
  },
  testingText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.m,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
    ...SHADOWS.small,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    marginHorizontal: SPACING.xs,
    borderRadius: SPACING.m,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.medium,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  tabTextActive: {
    color: COLORS.surface,
  },
  tabCount: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  counterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  counterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  counterText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
});