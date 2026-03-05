import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';

// Sample dictionary data
const DICTIONARY_DATA = [
  {
    id: '1',
    word: 'Kotobian',
    language: 'Kadazandusun',
    translation: 'Good morning',
    pronunciation: 'koh-toh-bee-ahn',
    partOfSpeech: 'Greeting',
    examples: ['Kotobian poinsian - Good morning to you'],
    relatedWords: ['Kotobian tadau - Good day', 'Kopiodong - Good evening'],
    category: 'Greetings',
  },
  {
    id: '2',
    word: 'Aramai',
    language: 'Kadazandusun',
    translation: 'Thank you',
    pronunciation: 'ah-rah-my',
    partOfSpeech: 'Expression',
    examples: ['Aramai dii - Thank you very much'],
    relatedWords: ['Kopiodop - Please', 'Simpuru - Excuse me'],
    category: 'Expressions',
  },
  {
    id: '3',
    word: 'Padi',
    language: 'Kadazandusun',
    translation: 'Rice (plant)',
    pronunciation: 'pah-dee',
    partOfSpeech: 'Noun',
    examples: ['Padi diti - This rice', 'Maganu padi - Plant rice'],
    relatedWords: ['Boros - Rice (cooked)', 'Humod - Farm'],
    category: 'Agriculture',
  },
  {
    id: '4',
    word: 'Selamat pagi',
    language: 'Iban',
    translation: 'Good morning',
    pronunciation: 'seh-lah-mat pah-gee',
    partOfSpeech: 'Greeting',
    examples: ['Selamat pagi kitai - Good morning to all of us'],
    relatedWords: ['Selamat petang - Good afternoon'],
    category: 'Greetings',
  },
  {
    id: '5',
    word: 'Terima kasih',
    language: 'Iban',
    translation: 'Thank you',
    pronunciation: 'teh-ree-mah kah-seh',
    partOfSpeech: 'Expression',
    examples: ['Terima kasih bukai - Thank you very much'],
    relatedWords: ['Tolong - Please'],
    category: 'Expressions',
  },
  {
    id: '6',
    word: 'Ngajat',
    language: 'Iban',
    translation: 'Traditional warrior dance',
    pronunciation: 'ngah-jaht',
    partOfSpeech: 'Noun',
    examples: ['Bengar ngajat - Dance the ngajat'],
    relatedWords: ['Gawai - Festival', 'Pua kumbu - Traditional cloth'],
    category: 'Culture',
  },
  {
    id: '7',
    word: 'Kassianti',
    language: 'Bajau',
    translation: 'Good morning',
    pronunciation: 'kah-see-ahn-tee',
    partOfSpeech: 'Greeting',
    examples: ['Kassianti kam - Good morning to you'],
    relatedWords: ['Salamat - Thank you'],
    category: 'Greetings',
  },
  {
    id: '8',
    word: 'Lepa',
    language: 'Bajau',
    translation: 'Traditional boat',
    pronunciation: 'leh-pah',
    partOfSpeech: 'Noun',
    examples: ['Lepa ditu magayat - The boat is sailing'],
    relatedWords: ['Layag - Sail', 'Laut - Sea'],
    category: 'Maritime',
  },
  {
    id: '9',
    word: 'Pangalay',
    language: 'Bajau',
    translation: 'Traditional fingernail dance',
    pronunciation: 'pahn-gah-lie',
    partOfSpeech: 'Noun',
    examples: ['Igal pangalay - Dance the pangalay'],
    relatedWords: ['Igal - Dance', 'Kulintangan - Gong music'],
    category: 'Culture',
  },
  {
    id: '10',
    word: 'Osonong',
    language: 'Murut',
    translation: 'Good morning',
    pronunciation: 'oh-soh-nohng',
    partOfSpeech: 'Greeting',
    examples: ['Osonong kito - Good morning everyone'],
    relatedWords: ['Tabulud - Thank you'],
    category: 'Greetings',
  },
  {
    id: '11',
    word: 'Lansaran',
    language: 'Murut',
    translation: 'Traditional trampoline',
    pronunciation: 'lahn-sah-rahn',
    partOfSpeech: 'Noun',
    examples: ['Minsibut di lansaran - Jump on the trampoline'],
    relatedWords: ['Magunatip - Warrior dance', 'Sompoton - Bamboo instrument'],
    category: 'Culture',
  },
  {
    id: '12',
    word: 'Monggit',
    language: 'Kadazandusun',
    translation: 'Beautiful',
    pronunciation: 'mohng-geet',
    partOfSpeech: 'Adjective',
    examples: ['Monggit tanak - Beautiful child', 'Sunduan monggit - Very beautiful'],
    relatedWords: ['Otuson - Good', 'Korikatan - Happy'],
    category: 'Descriptive',
  },
  {
    id: '13',
    word: 'Kaamatan',
    language: 'Kadazandusun',
    translation: 'Harvest (festival)',
    pronunciation: 'kah-ah-mah-tahn',
    partOfSpeech: 'Noun',
    examples: ['Pesta Kaamatan - Harvest Festival'],
    relatedWords: ['Padi - Rice', 'Bobohizan - High priestess'],
    category: 'Culture',
  },
  {
    id: '14',
    word: 'Oku',
    language: 'Kadazandusun',
    translation: 'I/Me',
    pronunciation: 'oh-koo',
    partOfSpeech: 'Pronoun',
    examples: ['Oku tomod - I am coming', 'Ngaran ku - My name is'],
    relatedWords: ['Kita - We', 'Ko - You', 'Toi - They'],
    category: 'Grammar',
  },
  {
    id: '15',
    word: 'Apat',
    language: 'Kadazandusun',
    translation: 'Four',
    pronunciation: 'ah-paht',
    partOfSpeech: 'Number',
    examples: ['Apat om tanak - Four children'],
    relatedWords: ['Iso - One', 'Duvo - Two', 'Tolu - Three', 'Limo - Five'],
    category: 'Numbers',
  },
];

export default function DictionaryScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedWord, setSelectedWord] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    loadFavorites();
    loadRecentSearches();
  }, []);

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
    // In a real app, you'd play actual audio
    Alert.alert('Pronunciation', `Playing pronunciation for: ${word.word}\n${word.pronunciation}`);
  };

  const filteredWords = DICTIONARY_DATA.filter((word) => {
    const matchesSearch =
      word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.translation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLanguage = selectedLanguage === 'all' || word.language === selectedLanguage;
    const matchesCategory = selectedCategory === 'all' || word.category === selectedCategory;

    return matchesSearch && matchesLanguage && matchesCategory;
  });

  const renderWordCard = ({ item }) => (
    <TouchableOpacity style={styles.wordCard} onPress={() => handleWordPress(item)} activeOpacity={0.8}>
      <View style={styles.wordCardHeader}>
        <View style={styles.wordCardInfo}>
          <Text style={styles.wordText}>{item.word}</Text>
          <Text style={styles.translationText}>{item.translation}</Text>
          <Text style={styles.languageText}>{item.language}</Text>
        </View>
        <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
          <Ionicons
            name={favorites.includes(item.id) ? 'heart' : 'heart-outline'}
            size={24}
            color={favorites.includes(item.id) ? '#FF6B6B' : COLORS.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderWordDetail = () => {
    if (!selectedWord) return null;

    return (
      <View style={styles.detailContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setSelectedWord(null)}>
              <Ionicons name="arrow-back" size={28} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.detailTitle}>Word Details</Text>
            <TouchableOpacity onPress={() => toggleFavorite(selectedWord.id)}>
              <Ionicons
                name={favorites.includes(selectedWord.id) ? 'heart' : 'heart-outline'}
                size={28}
                color={favorites.includes(selectedWord.id) ? '#FF6B6B' : COLORS.text}
              />
            </TouchableOpacity>
          </View>

          {/* Word Card */}
          <View style={styles.detailCard}>
            <Text style={styles.detailWord}>{selectedWord.word}</Text>
            <Text style={styles.detailTranslation}>{selectedWord.translation}</Text>
            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Language</Text>
                <Text style={styles.metaValue}>{selectedWord.language}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Type</Text>
                <Text style={styles.metaValue}>{selectedWord.partOfSpeech}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Category</Text>
                <Text style={styles.metaValue}>{selectedWord.category}</Text>
              </View>
            </View>
          </View>

          {/* Pronunciation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pronunciation</Text>
            <View style={styles.pronunciationCard}>
              <Text style={styles.pronunciationText}>{selectedWord.pronunciation}</Text>
              <TouchableOpacity
                style={styles.playBtn}
                onPress={() => playPronunciation(selectedWord)}
              >
                <Ionicons name="play-circle" size={48} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Examples */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Examples</Text>
            {selectedWord.examples.map((example, index) => (
              <View key={index} style={styles.exampleCard}>
                <Text style={styles.exampleText}>{example}</Text>
              </View>
            ))}
          </View>

          {/* Related Words */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Related Words</Text>
            {selectedWord.relatedWords.map((related, index) => (
              <View key={index} style={styles.relatedCard}>
                <Text style={styles.relatedText}>{related}</Text>
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
      <SafeAreaView style={styles.container}>
        {renderWordDetail()}
      </SafeAreaView>
    );
  }

  const categories = ['all', ...new Set(DICTIONARY_DATA.map((w) => w.category))];
  const languages = ['all', 'Kadazandusun', 'Iban', 'Bajau', 'Murut'];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('MainTabs', { screen: 'HomeTab' });
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dictionary</Text>
        <TouchableOpacity onPress={() => Alert.alert('Info', `${DICTIONARY_DATA.length} words available`)}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search words or translations..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Recent Searches */}
      {searchQuery.length === 0 && recentSearches.length > 0 && (
        <View style={styles.recentContainer}>
          <Text style={styles.recentTitle}>Recent Searches</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentSearches.map((word, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentChip}
                onPress={() => setSearchQuery(word)}
              >
                <Text style={styles.recentChipText}>{word}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Language Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang}
            style={[styles.filterBtn, selectedLanguage === lang && styles.filterBtnActive]}
            onPress={() => setSelectedLanguage(lang)}
          >
            <Text style={[styles.filterText, selectedLanguage === lang && styles.filterTextActive]}>
              {lang === 'all' ? 'All Languages' : lang}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryBtn, selectedCategory === cat && styles.categoryBtnActive]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
              {cat === 'all' ? 'All Categories' : cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results Count */}
      <View style={styles.resultsBanner}>
        <Text style={styles.resultsText}>
          {filteredWords.length} word{filteredWords.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Words List */}
      <FlatList
        data={filteredWords}
        renderItem={renderWordCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="book" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No words found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        }
      />
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
