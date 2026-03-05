import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Linking, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, SHADOWS, GLASS_EFFECTS } from '../constants/theme';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { getUserProfile, getAverageScoreByDifficulty } from '../services/scoringService';

const LANGUAGES = [
  { id: 'kad', name: 'Kadazandusun' },
  { id: 'iba', name: 'Iban' },
  { id: 'baj', name: 'Bajau' },
  { id: 'mur', name: 'Murut' },
];

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [userProfile, setUserProfile] = useState(null);
  const [easyAvg, setEasyAvg] = useState(0);
  const [mediumAvg, setMediumAvg] = useState(0);
  const [hardAvg, setHardAvg] = useState(0);
  const [showLangOptions, setShowLangOptions] = useState(false);
  const [currentLang, setCurrentLang] = useState('Kadazandusun');
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [settings, setSettings] = useState({
    dailyReminders: true,
    achievements: true,
    autoplayAudio: true,
  });

  // Load user profile on screen focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserProfile();
    }, [])
  );

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      setUserProfile(profile);
      
      // Load averages by difficulty
      const easy = await getAverageScoreByDifficulty('easy');
      const medium = await getAverageScoreByDifficulty('medium');
      const hard = await getAverageScoreByDifficulty('hard');
      
      setEasyAvg(easy);
      setMediumAvg(medium);
      setHardAvg(hard);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const toggle = (key) => setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topBarBackButton}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('HomeTab'))}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}><Text style={styles.avatarText}>JD</Text></View>
          <Text style={styles.userName}>Jane Doe</Text>
          {userProfile && (
            <>
              <Text style={styles.userLevel}>{userProfile.title}</Text>
              <Text style={styles.levelType}>{userProfile.badge} {userProfile.levelType}</Text>
              <Text style={styles.pointsText}>Points: {userProfile.totalPoints}</Text>
            </>
          )}
        </View>

        {userProfile && (
          <TouchableOpacity 
            style={styles.statsButton} 
            onPress={() => setShowStats(true)}
          >
            <View style={styles.statsContent}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{userProfile.quizzesCompleted}</Text>
                <Text style={styles.statLabel}>Quizzes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{userProfile.scenariosCompleted}</Text>
                <Text style={styles.statLabel}>Scenarios</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>Lvl {userProfile.level}</Text>
                <Text style={styles.statLabel}>Current</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Settings</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => setShowLangOptions((prev) => !prev)}>
          <Ionicons name="globe-outline" size={24} color={COLORS.text} />
          <View style={styles.menuContent}>
            <Text style={styles.menuText}>Language Preference</Text>
            <Text style={styles.menuSubtext}>{currentLang}</Text>
          </View>
          <Ionicons name={showLangOptions ? 'chevron-down' : 'chevron-forward'} size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {showLangOptions && (
          <View style={styles.langDropdown}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.id}
                style={styles.langOption}
                onPress={() => {
                  setCurrentLang(lang.name);
                  setShowLangOptions(false);
                }}
              >
                <Text style={styles.langOptionText}>{lang.name}</Text>
                {currentLang === lang.name ? <Ionicons name="checkmark" size={16} color={COLORS.primary} /> : null}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.menuItem} onPress={() => setShowSettings(true)}>
          <Ionicons name="settings-outline" size={24} color={COLORS.text} />
          <Text style={styles.menuListItem}>General Settings</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setShowHelp(true)}>
          <Ionicons name="help-circle-outline" size={24} color={COLORS.text} />
          <Text style={styles.menuListItem}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showStats} animationType="slide" transparent onRequestClose={() => setShowStats(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Statistics</Text>
              <TouchableOpacity onPress={() => setShowStats(false)}><Ionicons name="close" size={28} color={COLORS.text} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              {userProfile && (
                <>
                  <View style={styles.statSection}>
                    <Text style={styles.statSectionTitle}>Quiz Performance by Difficulty</Text>
                    <View style={styles.difficultyStats}>
                      <View style={styles.diffStat}>
                        <Text style={styles.diffLabel}>Easy</Text>
                        <View style={[styles.diffScore, { borderTopColor: '#4CAF50' }]}>
                          <Text style={styles.diffValue}>{easyAvg}%</Text>
                        </View>
                      </View>
                      <View style={styles.diffStat}>
                        <Text style={styles.diffLabel}>Medium</Text>
                        <View style={[styles.diffScore, { borderTopColor: '#FF9800' }]}>
                          <Text style={styles.diffValue}>{mediumAvg}%</Text>
                        </View>
                      </View>
                      <View style={styles.diffStat}>
                        <Text style={styles.diffLabel}>Hard</Text>
                        <View style={[styles.diffScore, { borderTopColor: '#E53935' }]}>
                          <Text style={styles.diffValue}>{hardAvg}%</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.statSection}>
                    <Text style={styles.statSectionTitle}>Level Progression</Text>
                    <View style={styles.levelInfo}>
                      <View style={styles.levelRow}>
                        <Text style={styles.levelRowLabel}>Current Level:</Text>
                        <Text style={styles.levelRowValue}>{userProfile.level}</Text>
                      </View>
                      <View style={styles.levelRow}>
                        <Text style={styles.levelRowLabel}>Type:</Text>
                        <Text style={styles.levelRowValue}>{userProfile.levelType}</Text>
                      </View>
                      <View style={styles.levelRow}>
                        <Text style={styles.levelRowLabel}>Total Points:</Text>
                        <Text style={styles.levelRowValue}>{userProfile.totalPoints}</Text>
                      </View>
                      <View style={styles.levelRow}>
                        <Text style={styles.levelRowLabel}>Quizzes Completed:</Text>
                        <Text style={styles.levelRowValue}>{userProfile.quizzesCompleted}</Text>
                      </View>
                      <View style={styles.levelRow}>
                        <Text style={styles.levelRowLabel}>Scenarios Practiced:</Text>
                        <Text style={styles.levelRowValue}>{userProfile.scenariosCompleted}</Text>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showSettings} animationType="slide" transparent onRequestClose={() => setShowSettings(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>General Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}><Ionicons name="close" size={28} color={COLORS.text} /></TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleLeft}><Ionicons name="alarm" size={20} color={COLORS.primary} /><Text style={styles.toggleText}>Daily Reminders</Text></View>
                <Switch value={settings.dailyReminders} onValueChange={() => toggle('dailyReminders')} />
              </View>
              <View style={styles.toggleRow}>
                <View style={styles.toggleLeft}><Ionicons name="trophy" size={20} color={COLORS.accent} /><Text style={styles.toggleText}>Achievement Notifications</Text></View>
                <Switch value={settings.achievements} onValueChange={() => toggle('achievements')} />
              </View>
              <View style={styles.toggleRow}>
                <View style={styles.toggleLeft}><Ionicons name="volume-high" size={20} color={COLORS.secondary} /><Text style={styles.toggleText}>Auto-play Audio</Text></View>
                <Switch value={settings.autoplayAudio} onValueChange={() => toggle('autoplayAudio')} />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showHelp} animationType="slide" transparent onRequestClose={() => setShowHelp(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Help & Support</Text>
              <TouchableOpacity onPress={() => setShowHelp(false)}><Ionicons name="close" size={28} color={COLORS.text} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalContent}>
              <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('tel:0169515429')}>
                <Ionicons name="call" size={20} color={COLORS.secondary} />
                <View style={styles.contactTextWrap}><Text style={styles.contactLabel}>Phone</Text><Text style={styles.contactValue}>0169515429</Text></View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('https://wa.me/60169515429')}>
                <FontAwesome5 name="whatsapp" size={20} color="#25D366" />
                <View style={styles.contactTextWrap}><Text style={styles.contactLabel}>WhatsApp</Text><Text style={styles.contactValue}>0169515429</Text></View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactItem} onPress={() => Linking.openURL('mailto:zengyiham@gmail.com')}>
                <Ionicons name="mail" size={20} color={COLORS.accent} />
                <View style={styles.contactTextWrap}><Text style={styles.contactLabel}>Email</Text><Text style={styles.contactValue}>zengyiham@gmail.com</Text></View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.reportButton}
                onPress={() =>
                  Alert.alert('Report a Bug', 'Choose channel', [
                    { text: 'WhatsApp', onPress: () => Linking.openURL('https://wa.me/60169515429?text=Bug%20Report%20for%20EchoLingua%3A%20') },
                    { text: 'Email', onPress: () => Linking.openURL('mailto:zengyiham@gmail.com?subject=Bug Report') },
                    { text: 'Cancel', style: 'cancel' },
                  ])
                }
              >
                <Ionicons name="bug" size={20} color={COLORS.surface} />
                <Text style={styles.reportButtonText}>Report a Bug</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.reportButton, { backgroundColor: COLORS.accent }]}
                onPress={() =>
                  Alert.alert('Suggest Improvement', 'Choose channel', [
                    { text: 'WhatsApp', onPress: () => Linking.openURL('https://wa.me/60169515429?text=Improvement%20Suggestion%20for%20EchoLingua%3A%20') },
                    { text: 'Email', onPress: () => Linking.openURL('mailto:zengyiham@gmail.com?subject=EchoLingua Improvement Suggestion') },
                    { text: 'Cancel', style: 'cancel' },
                  ])
                }
              >
                <Ionicons name="language" size={20} color={COLORS.surface} />
                <Text style={styles.reportButtonText}>Suggest Improvements</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topBarBackButton: { padding: SPACING.xs, marginRight: SPACING.s },
  topBarTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  content: { padding: SPACING.l, paddingBottom: SPACING.xl },
  profileCard: { backgroundColor: COLORS.glassLight, borderColor: 'rgba(255, 255, 255, 0.6)', borderWidth: 1, borderRadius: SPACING.l, padding: SPACING.l, alignItems: 'center', marginBottom: SPACING.l, ...SHADOWS.small },
  avatarContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.s },
  avatarText: { fontSize: 28, fontWeight: '700', color: COLORS.surface },
  userName: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  userLevel: { fontSize: 13, color: COLORS.textSecondary },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.m },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glassLight, borderColor: 'rgba(255, 255, 255, 0.5)', borderWidth: 1, borderRadius: SPACING.m, padding: SPACING.m, marginBottom: SPACING.s, ...SHADOWS.small },
  menuContent: { flex: 1, marginLeft: SPACING.s },
  menuText: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  menuSubtext: { fontSize: 12, color: COLORS.textSecondary },
  menuListItem: { flex: 1, marginLeft: SPACING.s, fontSize: 15, fontWeight: '700', color: COLORS.text },
  langDropdown: { backgroundColor: COLORS.surface, borderRadius: SPACING.m, padding: SPACING.s, marginBottom: SPACING.s },
  langOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.s, paddingHorizontal: SPACING.s },
  langOptionText: { fontSize: 14, color: COLORS.text },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: COLORS.glassLight, borderTopLeftRadius: SPACING.l, borderTopRightRadius: SPACING.l, maxHeight: '85%', borderColor: 'rgba(255, 255, 255, 0.6)', borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.l, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  modalContent: { padding: SPACING.l },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.glassMedium, borderColor: 'rgba(255, 255, 255, 0.4)', borderWidth: 1, borderRadius: SPACING.s, padding: SPACING.m, marginBottom: SPACING.s },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.s, flex: 1 },
  toggleText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  contactItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glassLight, borderColor: 'rgba(255, 255, 255, 0.5)', borderWidth: 1, borderRadius: SPACING.s, padding: SPACING.m, marginBottom: SPACING.s },
  contactTextWrap: { marginLeft: SPACING.s },
  contactLabel: { fontSize: 12, color: COLORS.textSecondary },
  contactValue: { fontSize: 14, color: COLORS.text, fontWeight: '700' },
  reportButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.error, borderRadius: SPACING.s, paddingVertical: SPACING.m, gap: SPACING.s, marginTop: SPACING.s },
  reportButtonText: { color: COLORS.surface, fontWeight: '700' },
  statsButton: { backgroundColor: COLORS.glassLight, borderColor: 'rgba(255, 255, 255, 0.6)', borderWidth: 1, borderRadius: SPACING.m, marginBottom: SPACING.l, ...SHADOWS.small },
  statsContent: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: SPACING.m },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, marginTop: SPACING.xs },
  statDivider: { width: 1, height: 40, backgroundColor: COLORS.border },
  statSection: { marginBottom: SPACING.l },
  statSectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.m },
  difficultyStats: { flexDirection: 'row', gap: SPACING.s, justifyContent: 'space-around' },
  diffStat: { flex: 1, alignItems: 'center' },
  diffLabel: { fontSize: 13, color: COLORS.text, fontWeight: '600', marginBottom: SPACING.xs },
  diffScore: { width: '100%', borderTopWidth: 4, paddingTop: SPACING.s, alignItems: 'center', backgroundColor: COLORS.glassMedium, borderColor: 'rgba(255, 255, 255, 0.4)', borderWidth: 1, borderRadius: SPACING.s, paddingVertical: SPACING.m },
  diffValue: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  levelInfo: { backgroundColor: COLORS.glassMedium, borderColor: 'rgba(255, 255, 255, 0.4)', borderWidth: 1, borderRadius: SPACING.m, padding: SPACING.m },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.s, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  levelRowLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  levelRowValue: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
  levelType: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginTop: SPACING.xs },
  pointsText: { fontSize: 11, color: COLORS.textSecondary, marginTop: SPACING.xs },
});
