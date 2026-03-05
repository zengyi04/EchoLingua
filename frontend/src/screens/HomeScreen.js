import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, GLASS_EFFECTS } from '../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const USERS_DATABASE_KEY = '@echolingua_users_database';
const COMMUNITY_STORIES_KEY = '@echolingua_stories';
const SEEN_STORIES_KEY = '@echolingua_seen_stories';

const { width } = Dimensions.get('window');

const LANGUAGES = [
  { id: 'kad', name: 'Kadazandusun', status: 'Vulnerable', speakers: '180,000', iso: 'dtp' },
  { id: 'iba', name: 'Iban', status: 'Safe', speakers: '750,000', iso: 'iba' },
  { id: 'baj', name: 'Bajau', status: 'Developing', speakers: '400,000', iso: 'bDR' }, 
  { id: 'mur', name: 'Murut', status: 'Threatened', speakers: '20,000', iso: 'mwi' },
  { id: 'mah', name: 'Mah Meri', status: 'Endangered', speakers: '3,000', iso: 'mhe' }, 
];

const QuickAction = ({ title, icon, color, onPress }) => {
  const { theme } = useTheme();
  return (
    <TouchableOpacity 
      style={styles.actionBtn} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.actionIconBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {React.cloneElement(icon, { color: color })}
      </View>
      <Text style={[styles.actionLabel, { color: theme.text }]} numberOfLines={2}>{title}</Text>
    </TouchableOpacity>
  );
};


export default function HomeScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [showLangModal, setShowLangModal] = useState(false); // Language selector hidden by default
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [unreadStoriesCount, setUnreadStoriesCount] = useState(0);

  // Load stats when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadActiveUsersCount();
      loadUnreadStoriesCount();
    }, [])
  );

  const loadActiveUsersCount = async () => {
    try {
      const usersData = await AsyncStorage.getItem(USERS_DATABASE_KEY);
      if (usersData) {
        const users = JSON.parse(usersData);
        const today = new Date().toISOString().split('T')[0]; // Get today's date (YYYY-MM-DD)
        
        // Count users who logged in today (check their lastActive field)
        const activeToday = users.filter(user => {
          if (user.lastActive) {
            const lastActiveDate = new Date(user.lastActive).toISOString().split('T')[0];
            return lastActiveDate === today;
          }
          return false;
        });
        
        setActiveUsersCount(activeToday.length);
      }
    } catch (error) {
      console.error('Failed to load active users count:', error);
      setActiveUsersCount(0);
    }
  };

  const loadUnreadStoriesCount = async () => {
    try {
      const storiesData = await AsyncStorage.getItem(COMMUNITY_STORIES_KEY);
      const seenStoriesData = await AsyncStorage.getItem(SEEN_STORIES_KEY);
      
      if (storiesData) {
        const stories = JSON.parse(storiesData);
        const seenStories = seenStoriesData ? JSON.parse(seenStoriesData) : [];
        const today = new Date().toISOString().split('T')[0]; // Get today's date (YYYY-MM-DD)
        
        // Count stories created today that haven't been seen
        const todayStories = stories.filter(story => {
          if (story.timestamp) {
            const storyDate = new Date(story.timestamp).toISOString().split('T')[0];
            const isToday = storyDate === today;
            const notSeen = !seenStories.includes(story.id);
            return isToday && notSeen;
          }
          return false;
        });
        
        setUnreadStoriesCount(todayStories.length);
      }
    } catch (error) {
      console.error('Failed to load unread stories count:', error);
      setUnreadStoriesCount(0);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section with Logo */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
             <View style={styles.headerTitleContainer}>
                <Image 
                  source={require('../../assets/appLogo.png')} 
                  style={styles.appLogo} 
                  resizeMode="contain"
                />
                <View>
                  <Text style={[styles.greeting, { color: theme.textSecondary }]}>Selamat Datang,</Text>
                  <Text style={[styles.appName, { color: theme.primary }]}>EchoLingua</Text>
                </View>
             </View>
             {/* Language Selector moved to Profile/Settings */}
          </View>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>Revitalizing Indigenous Languages</Text>
        </View>

        {/* Language Selection Modal */}
        <Modal
          visible={showLangModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowLangModal(false)}
        >
          <TouchableOpacity 
             style={styles.modalOverlay} 
             activeOpacity={1} 
             onPress={() => setShowLangModal(false)}
          >
             <View style={[styles.modalContent, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Select Language</Text>
                
                {/* Data Attribution Badge */}
                <View style={[styles.sourceBadge, { backgroundColor: theme.inputBackground }]}>
                  <Ionicons name="globe-outline" size={14} color={theme.textSecondary} />
                  <Text style={[styles.sourceText, { color: theme.textSecondary }]}>Data verified by Ethnologue & JMM</Text>
                </View>

                {LANGUAGES.map(lang => (
                   <TouchableOpacity 
                      key={lang.id} 
                      style={[styles.langOption, { borderBottomColor: theme.border }]}
                      onPress={() => {
                         setSelectedLang(lang);
                         setShowLangModal(false);
                      }}
                   >
                     <View>
                        <Text style={[
                           styles.langOptionText, 
                           { color: theme.text },
                           selectedLang.id === lang.id && [styles.activeLangText, { color: theme.primary }]
                        ]}>{lang.name}</Text>
                        <Text style={[styles.langMeta, { color: theme.textSecondary }]}>
                           {lang.speakers} speakers • {lang.status}
                        </Text>
                     </View>
                      
                      {selectedLang.id === lang.id && (
                         <Ionicons name="checkmark" size={20} color={theme.primary} />
                      )}
                      
                      {/* Endangerment Indicator */}
                      {['Threatened', 'Endangered'].includes(lang.status) && (
                         <View style={styles.warningDot} />
                      )}
                   </TouchableOpacity>
                ))}
             </View>
          </TouchableOpacity>
        </Modal>

        {/* Living Language Stats (New Feature) */}
        <View style={[
           styles.statsCard, 
           { 
             backgroundColor: theme.surface, 
             borderWidth: 0,
             elevation: 4,
             shadowColor: '#000',
             shadowOffset: { width: 0, height: 2 },
             shadowOpacity: 0.1,
             shadowRadius: 8,
             marginBottom: SPACING.medium // Ensure spacing
           }
        ]}>
           <Text style={[styles.statsTitle, { color: theme.text }]}>Living Language Status</Text>
           <View style={styles.statsRow}>
              <View style={styles.statItem}>
                 <Text style={[styles.statNumber, { color: theme.secondary }]}>1,204</Text>
                 <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Words Preserved</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border, alignSelf: 'center', height: 40 }]} />
              <View style={styles.statItem}>
                 <Text style={[styles.statNumber, { color: theme.secondary }]}>{activeUsersCount}</Text>
                 <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Active Today</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border, alignSelf: 'center', height: 40 }]} />
              <View style={styles.statItem}>
                 <Text style={[styles.statNumber, { color: theme.secondary }]}>{unreadStoriesCount}</Text>
                 <Text style={[styles.statLabel, { color: theme.textSecondary }]}>New Community Today</Text>
              </View>
           </View>
        </View>

        <View style={{ height: SPACING.l }} />

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Tools & Discovery</Text>

        <View style={styles.grid}>
          {/* Row 1: Key Features */}
          <QuickAction 
            title="AI Chat" 
            icon={<MaterialCommunityIcons name="robot" size={20} />} 
            color="#E91E63"
            onPress={() => navigation.navigate('AIChat')}
          />
          <QuickAction 
            title="Dictionary" 
            icon={<FontAwesome5 name="book" size={20} />}
            color="#8E44AD" 
            onPress={() => navigation.navigate('Dictionary')}
          />
          <QuickAction 
            title="Map" 
            icon={<FontAwesome5 name="map-marked-alt" size={20} />}
            color="#FF9800" 
            onPress={() => navigation.navigate('Map')}
          />
          <QuickAction 
            title="Quiz" 
            icon={<MaterialIcons name="quiz" size={24} />}
            color={theme.accent}
            onPress={() => navigation.navigate('Quiz')}
          />

          {/* Row 2: Learning & Practice */}
          <QuickAction 
            title="Practice" 
            icon={<MaterialIcons name="translate" size={24} />}
            color={theme.secondary}
            onPress={() => navigation.navigate('Vocabulary')}
          />
          <QuickAction 
            title="Family" 
            icon={<MaterialIcons name="family-restroom" size={24} />}
            color="#E74C3C" 
            onPress={() => navigation.navigate('FamilyLearning')}
          />
          <QuickAction 
            title="Festivals" 
            icon={<MaterialIcons name="festival" size={24} />}
            color="#F39C12" 
            onPress={() => navigation.navigate('CulturalEvents')}
          />
          <QuickAction 
            title="Knowledge" 
            icon={<FontAwesome5 name="scroll" size={20} />}
            color="#9B59B6" 
            onPress={() => navigation.navigate('CulturalKnowledge')}
          />

          {/* Row 3: Others */}
          <QuickAction 
            title="Community" 
            icon={<FontAwesome5 name="users" size={20} />}
            color="#3498DB" 
            onPress={() => navigation.navigate('CommunityStory')}
          />
          <QuickAction 
            title="Progress" 
            icon={<MaterialIcons name="trending-up" size={24} />}
            color="#27AE60" 
            onPress={() => navigation.navigate('ProgressTracker')}
          />
        </View>

        <View style={styles.spotlightSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Cultural Spotlight</Text>
          <View style={[styles.spotlightCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
             <View style={[styles.spotlightHeader, { backgroundColor: theme.secondary }]}>
                <MaterialIcons name="lightbulb" size={20} color="white" />
                <Text style={styles.spotlightLabel}>Did You Know?</Text>
             </View>
             <View style={styles.spotlightBody}>
                <Text style={[styles.spotlightTitle, { color: theme.text }]}>The Sape': Boat Lute</Text>
                <Text style={[styles.spotlightDesc, { color: theme.textSecondary }]}>
                  Traditionally carved from a single block of wood, the Sape' is the iconic musical instrument of the Orang Ulu people in Sarawak, originally used for healing rituals.
                </Text>
             </View>
          </View>
        </View>

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
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.s,
    paddingBottom: SPACING.xl, 
  },
  header: {
    marginBottom: SPACING.l,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
  },
  appLogo: {
    width: 55,
    height: 55,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
  },
  tagline: {
    fontSize: 14,
    color: '#8D99AE',
    marginTop: SPACING.xs,
  },
  statsCard: {
    backgroundColor: COLORS.glassLight,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderRadius: SPACING.m,
    padding: SPACING.m,
    marginBottom: SPACING.l,
    ...SHADOWS.small,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.m,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    minHeight: 60,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#eee',
  },
  
  // Word of the Day Styles
  wordCard: {
    padding: SPACING.l,
    borderRadius: SPACING.l,
    borderWidth: 1,
    position: 'relative',
    ...SHADOWS.small,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  wordLanguage: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  wordTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  wordType: {
    fontSize: 10,
    fontWeight: '700',
  },
  wordContent: {
    alignItems: 'center',
    paddingVertical: SPACING.s,
  },
  mainWord: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  pronunciation: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: SPACING.m,
  },
  divider: {
    height: 1,
    width: '40%',
    marginBottom: SPACING.m,
  },
  wordMeaning: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  playWordButton: {
    position: 'absolute',
    bottom: SPACING.m,
    right: SPACING.m,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  sectionTitle: { 
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.m,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start', 
    marginBottom: 0,
  },
  actionBtn: {
    width: (width - SPACING.l * 2) / 5, // 5 columns dynamic width based on available space
    alignItems: 'center',
    marginBottom: SPACING.l,
    paddingHorizontal: 2,
  },
  actionIconBox: {
    width: 50,
    height: 50,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: COLORS.glassLight,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    ...SHADOWS.small,
  },
  actionLabel: {
    fontSize: 9, 
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    width: '100%',
  },

  // Cultural Spotlight
  spotlightSection: {
    marginTop: 0,
    marginBottom: SPACING.m,
  },
  spotlightCard: {
    borderRadius: SPACING.m,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  spotlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    gap: SPACING.s,
  },
  spotlightLabel: {
    color: '#FFFFFF', // Assuming secondary background is dark/colored
    fontWeight: 'bold',
    fontSize: 14,
  },
  spotlightBody: {
    padding: SPACING.m,
  },
  spotlightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.s,
  },
  spotlightDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Duplicate styles removed here
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassLight,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  langButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: COLORS.glassLight,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderRadius: SPACING.m,
    padding: SPACING.l,
    ...SHADOWS.large,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.s,
    textAlign: 'center',
    color: COLORS.text,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginBottom: SPACING.m,
    backgroundColor: COLORS.inputBackground,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  sourceText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  langOptionText: {
    fontSize: 16,
    color: COLORS.text,
  },
  langMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  warningDot: {
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: COLORS.error,
    marginLeft: 8,
    position: 'absolute',
    right: 0,
    top: 10,
  },
  activeLangText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  tipCard: {
    backgroundColor: '#E3F2FD',
    padding: SPACING.m,
    borderRadius: SPACING.m,
    marginBottom: SPACING.l,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.s,
    gap: SPACING.s,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  tipText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: COLORS.text,
  },
});