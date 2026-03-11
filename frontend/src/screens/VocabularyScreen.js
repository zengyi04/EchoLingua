import React, { useMemo, useState } from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import VocabularyCard from '../components/VocabularyCard';
import { COLORS, SPACING, SHADOWS, GLASS_EFFECTS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { UNIFIED_LANGUAGE_OPTIONS } from '../constants/translationLanguages';

const SPEECH_CODES = {
  malay: 'ms-MY',
  english: 'en-US',
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
  cantonese: 'zh-HK',
  tagalog: 'fil-PH',
  urdu: 'ur-PK',
  tamil: 'ta-IN',
};

const LANGUAGE_OPTIONS = UNIFIED_LANGUAGE_OPTIONS.map((language) => ({
  id: language.id,
  label: language.label,
  flag: language.flag,
  speechCode: SPEECH_CODES[language.id] || 'en-US',
}));

const STARTER_VOCABULARY = [
  { id: 'starter-1', original: 'Kopivosian', translated: 'Hello', pronunciation: 'ko-pi-vo-sian', difficulty: 'easy', category: 'Greeting' },
  { id: 'starter-2', original: 'Oou', translated: 'Yes', pronunciation: 'o-oh', difficulty: 'easy', category: 'Daily Life' },
  { id: 'starter-3', original: 'Aiso', translated: 'No', pronunciation: 'ai-so', difficulty: 'easy', category: 'Daily Life' },
  { id: 'starter-4', original: 'Waig', translated: 'Water', pronunciation: 'wa-ig', difficulty: 'easy', category: 'Daily Life' },
  { id: 'starter-5', original: 'Tuhun', translated: 'Please', pronunciation: 'too-hun', difficulty: 'easy', category: 'Conversation' },
  { id: 'starter-6', original: 'Kotohuadan', translated: 'Thank you', pronunciation: 'ko-to-hua-dan', difficulty: 'easy', category: 'Conversation' },
  { id: 'starter-7', original: 'Om', translated: 'Come', pronunciation: 'ohm', difficulty: 'easy', category: 'Action' },
  { id: 'starter-8', original: 'Mangan', translated: 'Eat', pronunciation: 'ma-ngan', difficulty: 'easy', category: 'Action' },
  { id: 'starter-9', original: 'Minum', translated: 'Drink', pronunciation: 'mi-num', difficulty: 'easy', category: 'Action' },
  { id: 'starter-10', original: 'Usang', translated: 'Rain', pronunciation: 'u-sang', difficulty: 'easy', category: 'Nature' },
  { id: 'starter-11', original: 'Huminodun', translated: 'Huminodun', pronunciation: 'hu-mi-no-dun', difficulty: 'medium', category: 'Culture' },
  { id: 'starter-12', original: 'Kaamatan', translated: 'Harvest festival', pronunciation: 'kaa-maa-tan', difficulty: 'medium', category: 'Culture' },
  { id: 'starter-13', original: 'Sumazau', translated: 'Traditional dance', pronunciation: 'su-ma-zau', difficulty: 'medium', category: 'Culture' },
  { id: 'starter-14', original: 'Tadau', translated: 'Sun / day', pronunciation: 'ta-dau', difficulty: 'medium', category: 'Nature' },
  { id: 'starter-15', original: 'Vangkad', translated: 'Walk', pronunciation: 'vang-kad', difficulty: 'medium', category: 'Action' },
  { id: 'starter-16', original: 'Walai', translated: 'House', pronunciation: 'wa-lai', difficulty: 'medium', category: 'Place' },
  { id: 'starter-17', original: 'Tama', translated: 'Father', pronunciation: 'ta-ma', difficulty: 'medium', category: 'Family' },
  { id: 'starter-18', original: 'Indu', translated: 'Mother', pronunciation: 'in-du', difficulty: 'medium', category: 'Family' },
  { id: 'starter-19', original: 'Tobpinaai', translated: 'Friend', pronunciation: 'tob-pi-na-ai', difficulty: 'medium', category: 'People' },
  { id: 'starter-20', original: 'Parai', translated: 'Rice plant', pronunciation: 'pa-rai', difficulty: 'medium', category: 'Food' },
  { id: 'starter-21', original: 'Kinorohingan', translated: 'Creator deity', pronunciation: 'ki-no-ro-hi-ngan', difficulty: 'hard', category: 'Belief' },
  { id: 'starter-22', original: 'Bobohizan', translated: 'Ritual priestess', pronunciation: 'bo-bo-hi-zan', difficulty: 'hard', category: 'Culture' },
  { id: 'starter-23', original: 'Nunuk Ragang', translated: 'Ancestral settlement', pronunciation: 'nu-nuk ra-gang', difficulty: 'hard', category: 'History' },
  { id: 'starter-24', original: 'Tagazo', translated: 'Buffalo', pronunciation: 'ta-ga-zo', difficulty: 'hard', category: 'Nature' },
  { id: 'starter-25', original: 'Koubasanan', translated: 'Forest', pronunciation: 'kou-ba-sa-nan', difficulty: 'hard', category: 'Nature' },
  { id: 'starter-26', original: 'Pogun', translated: 'Village land', pronunciation: 'po-gun', difficulty: 'hard', category: 'Place' },
  { id: 'starter-27', original: 'Tinongilan', translated: 'Story / legend', pronunciation: 'ti-no-ngi-lan', difficulty: 'hard', category: 'Culture' },
  { id: 'starter-28', original: 'Gayo Ngaran', translated: 'Great name / honor', pronunciation: 'ga-yo nga-ran', difficulty: 'hard', category: 'Values' },
];

export default function VocabularyScreen() {
  const { theme } = useTheme();
  // Vocabulary is fully local mock data (no backend dependency).
  const [vocabularyList] = useState(STARTER_VOCABULARY);

  const VOCABULARY_BY_DIFFICULTY = useMemo(() => ({
    easy: vocabularyList.filter((word) => word.difficulty === 'easy'),
    medium: vocabularyList.filter((word) => word.difficulty === 'medium' || !word.difficulty),
    hard: vocabularyList.filter((word) => word.difficulty === 'hard'),
  }), [vocabularyList]);
  const navigation = useNavigation();
  const [selectedLevel, setSelectedLevel] = useState('easy');
  const [savedWords, setSavedWords] = useState({ easy: [], medium: [], hard: [] });
  const [testingMode, setTestingMode] = useState(false);
  const [activeView, setActiveView] = useState('vocabulary');
  const [fromLanguage, setFromLanguage] = useState(
    LANGUAGE_OPTIONS.find((language) => language.id === 'malay') || LANGUAGE_OPTIONS[0]
  );
  const [toLanguage, setToLanguage] = useState(
    LANGUAGE_OPTIONS.find((language) => language.id === 'english') || LANGUAGE_OPTIONS[0]
  );
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectingLanguageType, setSelectingLanguageType] = useState('from');

  const currentVocabulary = VOCABULARY_BY_DIFFICULTY[selectedLevel];
  const collectedVocabulary = useMemo(
    () =>
      Object.entries(savedWords).flatMap(([level, words]) =>
        words.map((word) => ({ ...word, savedLevel: level }))
      ),
    [savedWords]
  );

  const handleSaveWord = (word, level) => {
    const alreadySaved = savedWords[level].some((w) => w.id === word.id);
    if (alreadySaved) {
      setSavedWords({
        ...savedWords,
        [level]: savedWords[level].filter((w) => w.id !== word.id),
      });
      return;
    }
    setSavedWords({
      ...savedWords,
      [level]: [...savedWords[level], word],
    });
  };

  const isWordSaved = (word, level) => savedWords[level].some((w) => w.id === word.id);

  const selectLanguage = (lang) => {
    if (selectingLanguageType === 'from') {
      setFromLanguage(lang);
    } else {
      setToLanguage(lang);
    }
    setShowLanguageModal(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.headerSideAction}
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
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Vocabulary</Text>
        </View>
        <TouchableOpacity style={styles.headerSideAction} onPress={() => setTestingMode(!testingMode)}>
          <MaterialCommunityIcons
            name="clipboard-check"
            size={24}
            color={testingMode ? theme.error : theme.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={[styles.languageSelectionContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.languageLabel, { color: theme.text }]}>Learning:</Text>
        <TouchableOpacity
          style={[styles.languageButton, { backgroundColor: theme.glassLight, borderColor: theme.border }]}
          onPress={() => {
            setSelectingLanguageType('from');
            setShowLanguageModal(true);
          }}
        >
          <Text style={[styles.languageText, { color: theme.text }]}>{fromLanguage.flag} {fromLanguage.label}</Text>
        </TouchableOpacity>
        <Ionicons name="arrow-forward" size={20} color={theme.textSecondary} />
        <TouchableOpacity
          style={[styles.languageButton, { backgroundColor: theme.glassLight, borderColor: theme.border }]}
          onPress={() => {
            setSelectingLanguageType('to');
            setShowLanguageModal(true);
          }}
        >
          <Text style={[styles.languageText, { color: theme.text }]}>{toLanguage.flag} {toLanguage.label}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.viewSwitcher, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
        <TouchableOpacity
          style={[
            styles.viewButton,
            { borderColor: theme.border, backgroundColor: theme.glassLight },
            activeView === 'vocabulary' && { backgroundColor: theme.primary, borderColor: theme.primary },
          ]}
          onPress={() => setActiveView('vocabulary')}
        >
          <MaterialCommunityIcons name="book-open-page-variant" size={16} color={activeView === 'vocabulary' ? theme.surface : theme.primary} />
          <Text style={[styles.viewButtonText, { color: activeView === 'vocabulary' ? theme.surface : theme.text }]}>Vocabulary</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.viewButton,
            { borderColor: theme.border, backgroundColor: theme.glassLight },
            activeView === 'collections' && { backgroundColor: theme.primary, borderColor: theme.primary },
          ]}
          onPress={() => setActiveView('collections')}
        >
          <MaterialCommunityIcons name="bookmark-multiple" size={16} color={activeView === 'collections' ? theme.surface : theme.primary} />
          <Text style={[styles.viewButtonText, { color: activeView === 'collections' ? theme.surface : theme.text }]}>Collections</Text>
        </TouchableOpacity>
      </View>

      {testingMode && (
        <View style={[styles.testingBanner, { backgroundColor: theme.primary + '20' }]}>
          <MaterialCommunityIcons name="lightbulb" size={18} color={theme.primary} />
          <Text style={[styles.testingText, { color: theme.primary }]}>Testing mode enabled: record speech and check accuracy.</Text>
        </View>
      )}

      {activeView === 'vocabulary' && (
        <View style={[styles.tabsContainer, { backgroundColor: theme.surface }]}> 
          {['easy', 'medium', 'hard'].map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.tab, { backgroundColor: theme.glassLight, borderColor: theme.border }, selectedLevel === level && { backgroundColor: theme.primary, borderColor: theme.primary }]}
              onPress={() => setSelectedLevel(level)}
            >
              <Text style={[styles.tabText, { color: theme.textSecondary }, selectedLevel === level && { color: theme.surface, fontWeight: 'bold' }]}> 
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
              <Text style={[styles.tabCount, { color: theme.textSecondary, opacity: 0.7 }, selectedLevel === level && { color: theme.surface }]}>{VOCABULARY_BY_DIFFICULTY[level].length} words</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.counterRow}>
        <MaterialCommunityIcons name="book-multiple" size={16} color={theme.success} />
        <Text style={[styles.counterText, { color: theme.textSecondary }]}>
          {activeView === 'vocabulary'
            ? `${VOCABULARY_BY_DIFFICULTY[selectedLevel].length} words • ${savedWords[selectedLevel].length} saved`
            : `${collectedVocabulary.length} words in your collection`}
        </Text>
      </View>

      {activeView === 'vocabulary' ? (
        <FlatList
          data={currentVocabulary}
          keyExtractor={(item, index) => String(item.id || `${selectedLevel}-${index}`)}
          renderItem={({ item }) => (
            <VocabularyCard
              word={item}
              isSaved={isWordSaved(item, selectedLevel)}
              onSave={() => handleSaveWord(item, selectedLevel)}
              testingMode={testingMode}
              level={selectedLevel}
              fromLanguage={fromLanguage}
              toLanguage={toLanguage}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyCollectionContainer}>
              <MaterialCommunityIcons name="book-open-page-variant-outline" size={42} color={theme.textSecondary} />
              <Text style={[styles.emptyCollectionTitle, { color: theme.text }]}>No words in this level yet</Text>
              <Text style={[styles.emptyCollectionText, { color: theme.textSecondary }]}>Try another level.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={collectedVocabulary}
          keyExtractor={(item, index) => `${item.savedLevel}-${item.id || index}`}
          renderItem={({ item }) => (
            <VocabularyCard
              word={item}
              isSaved={true}
              onSave={() => handleSaveWord(item, item.savedLevel)}
              testingMode={testingMode}
              level={item.savedLevel}
              fromLanguage={fromLanguage}
              toLanguage={toLanguage}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyCollectionContainer}>
              <MaterialCommunityIcons name="bookmark-off-outline" size={42} color={theme.textSecondary} />
              <Text style={[styles.emptyCollectionTitle, { color: theme.text }]}>No saved vocabulary yet</Text>
              <Text style={[styles.emptyCollectionText, { color: theme.textSecondary }]}>Save words from Easy, Medium, or Hard tabs, then view them here.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={showLanguageModal} transparent animationType="slide" onRequestClose={() => setShowLanguageModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Select {selectingLanguageType === 'from' ? 'Source' : 'Translation'} Language
              </Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={26} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.languageList}>
              {LANGUAGE_OPTIONS.map((lang) => (
                <TouchableOpacity
                  key={lang.id}
                  style={[
                    styles.languageOption,
                    { backgroundColor: theme.background, borderColor: theme.border }
                  ]}
                  onPress={() => selectLanguage(lang)}
                >
                  <Text style={[styles.languageOptionText, { color: theme.text }]}>{lang.flag} {lang.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backButton: { padding: SPACING.xs },
  headerContent: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  headerSubtitle: { fontSize: 13, color: COLORS.textSecondary },
  headerSideAction: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageSelectionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
    backgroundColor: COLORS.glassLight,
    paddingVertical: SPACING.s,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.4)',
  },
  languageLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  languageButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SPACING.s,
    paddingVertical: 6,
    paddingHorizontal: SPACING.s,
  },
  languageText: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  viewSwitcher: {
    flexDirection: 'row',
    gap: SPACING.s,
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.s,
    paddingBottom: SPACING.s,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.4)',
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderRadius: SPACING.s,
    paddingVertical: SPACING.s,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  testingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    backgroundColor: COLORS.accent + '20',
    padding: SPACING.s,
    margin: SPACING.m,
    borderRadius: SPACING.s,
  },
  testingText: { fontSize: 12, color: COLORS.accent, flex: 1 },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.glassLight,
    padding: SPACING.s,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.4)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.s,
    borderRadius: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 4,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  tabTextActive: { color: COLORS.surface },
  tabCount: { fontSize: 11, color: COLORS.textSecondary },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    backgroundColor: COLORS.glassLight,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  counterText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  listContent: { paddingBottom: SPACING.xl },
  emptyCollectionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.xxl,
    gap: SPACING.s,
  },
  emptyCollectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyCollectionText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.glassLight,
    borderTopLeftRadius: SPACING.l,
    borderTopRightRadius: SPACING.l,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: SPACING.s },
  languageList: { padding: SPACING.m },
  languageOption: {
    backgroundColor: COLORS.background,
    borderRadius: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.m,
    marginBottom: SPACING.s,
  },
  languageOptionText: { fontSize: 15, color: COLORS.text, fontWeight: '600' },
});
