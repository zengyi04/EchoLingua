import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');

const LANGUAGES = [
  { id: 'kad', name: 'Kadazandusun', status: 'Vulnerable', speakers: '180,000', iso: 'dtp' },
  { id: 'iba', name: 'Iban', status: 'Safe', speakers: '750,000', iso: 'iba' },
  { id: 'baj', name: 'Bajau', status: 'Developing', speakers: '400,000', iso: 'bDR' }, 
  { id: 'mur', name: 'Murut', status: 'Threatened', speakers: '20,000', iso: 'mwi' },
  { id: 'mah', name: 'Mah Meri', status: 'Endangered', speakers: '3,000', iso: 'mhe' }, 
];

const QuickAction = ({ title, icon, color, onPress }) => (
  <TouchableOpacity 
    style={styles.actionBtn} 
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={[styles.actionIconBox, { backgroundColor: COLORS.surface }]}>
      {React.cloneElement(icon, { color: color })}
    </View>
    <Text style={styles.actionLabel} numberOfLines={2}>{title}</Text>
  </TouchableOpacity>
);

export default function HomeScreen({ navigation }) {
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [showLangModal, setShowLangModal] = useState(true); // Onboarding: Show on first launch

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section with Language Selector */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
             <View>
                <Text style={styles.greeting}>Selamat Datang,</Text>
                <Text style={styles.appName}>EchoLingua</Text>
             </View>
             {/* Language Selector moved to Profile/Settings */}
          </View>
          <Text style={styles.tagline}>Revitalizing Indigenous Languages</Text>
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
             <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Language</Text>
                
                {/* Data Attribution Badge */}
                <View style={styles.sourceBadge}>
                  <Ionicons name="globe-outline" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.sourceText}>Data verified by Ethnologue & JMM</Text>
                </View>

                {LANGUAGES.map(lang => (
                   <TouchableOpacity 
                      key={lang.id} 
                      style={styles.langOption}
                      onPress={() => {
                         setSelectedLang(lang);
                         setShowLangModal(false);
                      }}
                   >
                     <View>
                        <Text style={[
                           styles.langOptionText, 
                           selectedLang.id === lang.id && styles.activeLangText
                        ]}>{lang.name}</Text>
                        <Text style={styles.langMeta}>
                           {lang.speakers} speakers • {lang.status}
                        </Text>
                     </View>
                      
                      {selectedLang.id === lang.id && (
                         <Ionicons name="checkmark" size={20} color={COLORS.primary} />
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
        <View style={styles.statsCard}>
           <Text style={styles.statsTitle}>Living Language Status</Text>
           <View style={styles.statsRow}>
              <View style={styles.statItem}>
                 <Text style={styles.statNumber}>1,204</Text>
                 <Text style={styles.statLabel}>Words Preserved</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                 <Text style={styles.statNumber}>85</Text>
                 <Text style={styles.statLabel}>Elders Active</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                 <Text style={styles.statNumber}>32</Text>
                 <Text style={styles.statLabel}>New Today</Text>
              </View>
           </View>
        </View>

        {/* Elder Voice Highlight (New Feature) */}
        <View style={styles.elderCard}>
           <View style={styles.elderHeader}>
              <Ionicons name="mic-circle" size={40} color={COLORS.error} />
              <View style={{marginLeft: SPACING.m}}>
                 <Text style={styles.elderTitle}>Elder Voice of the Week</Text>
                 <Text style={styles.elderName}>Nenek Siti - "The River's Song"</Text>
              </View>
           </View>
           <TouchableOpacity style={styles.listenButton} onPress={() => navigation.navigate('StoriesTab')}>
              <Text style={styles.listenText}>Listen Now</Text>
              <Ionicons name="play-circle-outline" size={20} color={COLORS.primary} />
           </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Tools & Discovery</Text>

        <View style={styles.grid}>
          {/* Row 1: AI & Discovery (Wow Features) */}
          <QuickAction 
            title="AI Lens" 
            icon={<MaterialIcons name="image-search" size={24} />}
            color="#E91E63" // Pink
            onPress={() => navigation.navigate('Vocabulary')}
          />
          <QuickAction 
            title="AI Chat" 
            icon={<Ionicons name="chatbubbles-sharp" size={24} />}
            color="#2196F3" // Blue
            onPress={() => alert('Start AI Conversation')}
          />
          <QuickAction 
            title="Map" 
            icon={<FontAwesome5 name="map-marked-alt" size={20} />}
            color="#FF9800" // Orange
            onPress={() => alert('View Dialect Map')}
          />
          <QuickAction 
            title="Learn" 
            icon={<FontAwesome5 name="book-open" size={20} />}
            color={COLORS.primary}
            onPress={() => navigation.navigate('LearnTab')}
          />

          {/* Row 2: Core Learning & Preservation */}
          <QuickAction 
            title="Practice" 
            icon={<MaterialIcons name="translate" size={24} />}
            color={COLORS.secondary}
            onPress={() => navigation.navigate('Vocabulary')}
          />
          <QuickAction 
            title="Quiz" 
            icon={<MaterialIcons name="quiz" size={24} />}
            color={COLORS.accent}
            onPress={() => navigation.navigate('Quiz')}
          />
          <QuickAction 
            title="Stories" 
            icon={<Ionicons name="library" size={24} />}
            color="#009688" // Teal
            onPress={() => navigation.navigate('StoriesTab')}
          />
          <QuickAction 
            title="Record" 
            icon={<MaterialIcons name="mic" size={24} />}
            color={COLORS.error}
            onPress={() => navigation.navigate('RecordTab')}
          />
        </View>
        <View style={styles.dailyWordCard}>
          <Text style={styles.dailyTitle}>Daily Word</Text>
          <Text style={styles.dailyWord}>"Rumah"</Text>
          <Text style={styles.dailyTranslation}>House • /roo-mah/</Text>
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
    paddingBottom: 100, // Extra space for bottom tab
  },
  header: {
    marginBottom: SPACING.l,
    // marginTop removed to reduce space
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
    backgroundColor: COLORS.surface,
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
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#eee',
  },
  elderCard: {
    backgroundColor: '#FFE0B2', // Light Orange/Terracotta
    borderRadius: SPACING.m,
    padding: SPACING.m,
    marginBottom: SPACING.l,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  elderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  elderTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  elderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  listenButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: SPACING.s,
    borderRadius: SPACING.s,
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: SPACING.s,
  },
  listenText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  tipCard: {
    backgroundColor: '#E3F2FD', // Light Blue
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
  sectionTitle: { // Restored missing sectionTitle style
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.m,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', 
    marginBottom: SPACING.l,
    rowGap: SPACING.l,
  },
  actionBtn: {
    width: '23%', // ~1/4th of screen width
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  actionIconBox: {
    width: 60,
    height: 60,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...SHADOWS.small,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    width: '100%',
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  dailyWordCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.l,
    borderRadius: SPACING.m,
    alignItems: 'center',
    ...SHADOWS.medium,
    borderTopWidth: 4,
    borderTopColor: COLORS.accent,
  },
  dailyTitle: {
    fontSize: 14,
    textTransform: 'uppercase',
    color: COLORS.textSecondary,
    marginBottom: SPACING.s,
    letterSpacing: 1,
  },
  dailyWord: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    fontStyle: 'italic',
    marginBottom: SPACING.s,
  },
  dailyTranslation: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
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
    backgroundColor: COLORS.surface,
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
    backgroundColor: '#F5F5F5',
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