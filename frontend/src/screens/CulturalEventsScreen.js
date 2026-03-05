import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';

const FESTIVALS = [
  {
    id: '1',
    name: 'Pesta Kaamatan',
    language: 'Kadazandusun',
    date: 'May 30-31',
    description: 'Harvest festival celebrating the end of the rice planting season',
    icon: '🌾',
    traditions: ['Unduk Ngadau (beauty pageant)', 'Sumazau dance', 'Traditional sports', 'Rice wine drinking ceremony'],
    vocabulary: [
      { word: 'Kaamatan', meaning: 'Harvest', pronunciation: 'kah-ah-mah-tahn' },
      { word: 'Hinava', meaning: 'Traditional raw fish dish', pronunciation: 'hee-nah-vah' },
      { word: 'Sumazau', meaning: 'Traditional dance', pronunciation: 'soo-mah-zow' },
      { word: 'Tapai', meaning: 'Rice wine', pronunciation: 'tah-pie' },
    ],
    greetings: [
      { phrase: 'Kopivosian do Kaamatan', meaning: 'Happy Harvest Festival', pronunciation: 'koh-pee-voh-see-ahn doh kah-ah-mah-tahn' },
    ],
    activities: ['Learn the Sumazau dance', 'Try traditional Kadazandusun dishes', 'Visit Hongkod Koisaan cultural village'],
  },
  {
    id: '2',
    name: 'Gawai Dayak',
    language: 'Iban',
    date: 'June 1-2',
    description: 'Thanksgiving festival of the Iban people celebrating rice harvest',
    icon: '🎉',
    traditions: ['Miring ceremony (offering ritual)', 'Ngajat dance', 'Longhouse celebrations', 'Tuak drinking tradition'],
    vocabulary: [
      { word: 'Gawai', meaning: 'Festival', pronunciation: 'gah-why' },
      { word: 'Ngajat', meaning: 'Warrior dance', pronunciation: 'ngah-jaht' },
      { word: 'Tuak', meaning: 'Rice wine', pronunciation: 'too-ahk' },
      { word: 'Pua Kumbu', meaning: 'Traditional woven cloth', pronunciation: 'poo-ah koom-boo' },
    ],
    greetings: [
      { phrase: 'Gayu Guru Gerai Nyamai', meaning: 'Wishing you good health, long life, and prosperity', pronunciation: 'gah-yoo goo-roo geh-rye nyah-my' },
    ],
    activities: ['Experience Ngajat dance', 'Visit Iban longhouse', 'Learn about Pua Kumbu weaving'],
  },
  {
    id: '3',
    name: 'Regatta Lepa',
    language: 'Bajau',
    date: 'April (varies)',
    description: 'Sea festival featuring decorated boat competitions',
    icon: '⛵',
    traditions: ['Decorated lepa boats parade', 'Traditional sailing competitions', 'Sea-themed performances', 'Seafood feasts'],
    vocabulary: [
      { word: 'Lepa', meaning: 'Traditional boat', pronunciation: 'leh-pah' },
      { word: 'Sama', meaning: 'Sea people/Bajau people', pronunciation: 'sah-mah' },
      { word: 'Igal', meaning: 'Traditional dance', pronunciation: 'ee-gahl' },
      { word: 'Pangalay', meaning: 'Fingernail dance', pronunciation: 'pahn-gah-lie' },
    ],
    greetings: [
      { phrase: 'Salam Sejahtera', meaning: 'Peace be upon you', pronunciation: 'sah-lahm seh-jah-teh-rah' },
    ],
    activities: ['Watch decorated lepa boats', 'Learn Igal dance', 'Explore Bajau maritime culture'],
  },
  {
    id: '4',
    name: 'Pesta Kalimaran',
    language: 'Murut',
    date: 'May (varies)',
    description: 'Cultural festival celebrating Murut heritage and traditions',
    icon: '🏔️',
    traditions: ['Lansaran (traditional trampoline jumping)', 'Magunatip (warrior dance)', 'Bamboo musical performances', 'Traditional games'],
    vocabulary: [
      { word: 'Kalimaran', meaning: 'Celebration', pronunciation: 'kah-lee-mah-rahn' },
      { word: 'Lansaran', meaning: 'Spring board jumping', pronunciation: 'lahn-sah-rahn' },
      { word: 'Tagol', meaning: 'Traditional costume', pronunciation: 'tah-gohl' },
      { word: 'Sompoton', meaning: 'Bamboo mouth organ', pronunciation: 'sohm-poh-tohn' },
    ],
    greetings: [
      { phrase: 'Kopio Pizau', meaning: 'Good wishes', pronunciation: 'koh-pee-oh pee-zow' },
    ],
    activities: ['Try Lansaran jumping', 'Learn Magunatip dance', 'Listen to Sompoton music'],
  },
  {
    id: '5',
    name: 'Hari Gawai',
    language: 'Bidayuh',
    date: 'June 1',
    description: 'Thanksgiving and celebration of unity among Bidayuh people',
    icon: '🎊',
    traditions: ['Traditional bamboo dance', 'Gong performances', 'Community feasts', 'Blessing ceremonies'],
    vocabulary: [
      { word: 'Bidayuh', meaning: 'Land people', pronunciation: 'bee-dah-yoo' },
      { word: 'Tapai', meaning: 'Rice wine', pronunciation: 'tah-pie' },
      { word: 'Bario', meaning: 'Village', pronunciation: 'bah-ree-oh' },
      { word: 'Tanju', meaning: 'Communal drying platform', pronunciation: 'tahn-joo' },
    ],
    greetings: [
      { phrase: 'Selamat Hari Gawai', meaning: 'Happy Gawai Day', pronunciation: 'seh-lah-maht hah-ree gah-why' },
    ],
    activities: ['Join bamboo dance', 'Participate in gong performance', 'Visit Bidayuh village'],
  },
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CulturalEventsScreen({ navigation }) {
  const [selectedFestival, setSelectedFestival] = useState(null);
  const [filterLanguage, setFilterLanguage] = useState('all'); // all, Kadazandusun, Iban, Bajau, Murut

  const filteredFestivals = filterLanguage === 'all'
    ? FESTIVALS
    : FESTIVALS.filter(f => f.language === filterLanguage);

  const renderFestivalCard = ({ item }) => (
    <TouchableOpacity
      style={styles.festivalCard}
      onPress={() => setSelectedFestival(item)}
      activeOpacity={0.8}
    >
      <View style={styles.festivalCardHeader}>
        <Text style={styles.festivalIcon}>{item.icon}</Text>
        <View style={styles.festivalCardInfo}>
          <Text style={styles.festivalName}>{item.name}</Text>
          <Text style={styles.festivalLanguage}>{item.language}</Text>
          <Text style={styles.festivalDate}>{item.date}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={COLORS.primary} />
      </View>
      <Text style={styles.festivalDescription} numberOfLines={2}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  const renderFestivalDetail = () => {
    if (!selectedFestival) return null;

    return (
      <View style={styles.detailContainer}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setSelectedFestival(null)}>
              <Ionicons name="arrow-back" size={28} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.detailTitle}>{selectedFestival.name}</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Icon & Info */}
          <View style={styles.detailHero}>
            <Text style={styles.detailIcon}>{selectedFestival.icon}</Text>
            <Text style={styles.detailLanguage}>{selectedFestival.language}</Text>
            <Text style={styles.detailDate}>{selectedFestival.date}</Text>
            <Text style={styles.detailDescription}>{selectedFestival.description}</Text>
          </View>

          {/* Traditions */}
          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <FontAwesome5 name="star" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Traditions</Text>
            </View>
            {selectedFestival.traditions.map((tradition, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>{tradition}</Text>
              </View>
            ))}
          </View>

          {/* Vocabulary */}
          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="book" size={20} color={COLORS.secondary} />
              <Text style={styles.sectionTitle}>Festival Vocabulary</Text>
            </View>
            {selectedFestival.vocabulary.map((item, index) => (
              <View key={index} style={styles.vocabularyCard}>
                <View style={styles.vocabularyHeader}>
                  <Text style={styles.vocabularyWord}>{item.word}</Text>
                  <TouchableOpacity style={styles.soundBtn}>
                    <Ionicons name="volume-medium" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.vocabularyMeaning}>{item.meaning}</Text>
                <Text style={styles.vocabularyPronunciation}>📢 {item.pronunciation}</Text>
              </View>
            ))}
          </View>

          {/* Greetings */}
          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbubbles" size={20} color="#FF6B6B" />
              <Text style={styles.sectionTitle}>Traditional Greetings</Text>
            </View>
            {selectedFestival.greetings.map((greeting, index) => (
              <View key={index} style={styles.greetingCard}>
                <Text style={styles.greetingPhrase}>{greeting.phrase}</Text>
                <Text style={styles.greetingMeaning}>{greeting.meaning}</Text>
                <Text style={styles.greetingPronunciation}>📢 {greeting.pronunciation}</Text>
              </View>
            ))}
          </View>

          {/* Activities */}
          <View style={styles.detailSection}>
            <View style={styles.sectionHeader}>
              <FontAwesome5 name="tasks" size={20} color="#4ECDC4" />
              <Text style={styles.sectionTitle}>What You Can Do</Text>
            </View>
            {selectedFestival.activities.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityNumber}>
                  <Text style={styles.activityNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.activityText}>{activity}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: SPACING.xxl }} />
        </ScrollView>
      </View>
    );
  };

  if (selectedFestival) {
    return (
      <SafeAreaView style={styles.container}>
        {renderFestivalDetail()}
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Cultural Events</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Language Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {['all', 'Kadazandusun', 'Iban', 'Bajau', 'Murut'].map((lang) => (
          <TouchableOpacity
            key={lang}
            style={[styles.filterBtn, filterLanguage === lang && styles.filterBtnActive]}
            onPress={() => setFilterLanguage(lang)}
          >
            <Text style={[styles.filterText, filterLanguage === lang && styles.filterTextActive]}>
              {lang === 'all' ? 'All Festivals' : lang}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <FontAwesome5 name="info-circle" size={20} color={COLORS.primary} />
        <Text style={styles.infoBannerText}>
          Learn about indigenous festivals and their traditional vocabulary
        </Text>
      </View>

      {/* Festivals List */}
      <FlatList
        data={filteredFestivals}
        renderItem={renderFestivalCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="calendar" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No festivals found</Text>
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
  filterContainer: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    gap: SPACING.s,
  },
  filterBtn: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
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
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: COLORS.surface,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    marginHorizontal: SPACING.l,
    marginBottom: SPACING.m,
    borderRadius: 12,
    gap: SPACING.s,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.xl,
  },
  festivalCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...SHADOWS.small,
  },
  festivalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  festivalIcon: {
    fontSize: 40,
    marginRight: SPACING.m,
  },
  festivalCardInfo: {
    flex: 1,
  },
  festivalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  festivalLanguage: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  festivalDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  festivalDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.m,
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
  detailHero: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: SPACING.l,
    marginTop: SPACING.m,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  detailIcon: {
    fontSize: 64,
    marginBottom: SPACING.m,
  },
  detailLanguage: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  detailDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.m,
  },
  detailDescription: {
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  detailSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: SPACING.l,
    marginTop: SPACING.m,
    borderRadius: 16,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
    gap: SPACING.s,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: SPACING.s,
  },
  bullet: {
    fontSize: 16,
    color: COLORS.primary,
    marginRight: SPACING.s,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  vocabularyCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: SPACING.m,
    marginBottom: SPACING.s,
  },
  vocabularyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  vocabularyWord: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  soundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vocabularyMeaning: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  vocabularyPronunciation: {
    fontSize: 13,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  greetingCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: SPACING.m,
    marginBottom: SPACING.s,
  },
  greetingPhrase: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  greetingMeaning: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  greetingPronunciation: {
    fontSize: 13,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  activityNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.s,
  },
  activityNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
});
