import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

const LANGUAGES = [
  { id: 'kad', name: 'Kadazandusun' },
  { id: 'iba', name: 'Iban' },
  { id: 'baj', name: 'Bajau' },
  { id: 'mur', name: 'Murut' },
];

export default function ProfileScreen() {
  const [showLangOptions, setShowLangOptions] = useState(false);
  const [currentLang, setCurrentLang] = useState('Kadazandusun');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Profile Card */}
        <View style={styles.profileCard}>
           <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>JD</Text>
           </View>
           <Text style={styles.userName}>Jane Doe</Text>
           <Text style={styles.userLevel}>Language Guardian (Lvl 3)</Text>
           
           <View style={styles.statsRow}>
              <View style={styles.statItem}>
                 <Text style={styles.statValue}>12</Text>
                 <Text style={styles.statLabel}>Days Streak</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                 <Text style={styles.statValue}>450</Text>
                 <Text style={styles.statLabel}>Words Learned</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                 <Text style={styles.statValue}>4</Text>
                 <Text style={styles.statLabel}>Stories Saved</Text>
              </View>
           </View>
        </View>

        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsGrid}>
           {['First Word', 'Week Warrior', 'Storyteller'].map((badge, index) => (
              <View key={index} style={styles.badgeItem}>
                 <View style={styles.badgeCircle}>
                    <FontAwesome5 name="medal" size={24} color={COLORS.accent} />
                 </View>
                 <Text style={styles.badgeText}>{badge}</Text>
              </View>
           ))}
        </View>

        <Text style={styles.sectionTitle}>Settings</Text>

        {/* Language Settings */}
        <TouchableOpacity style={styles.menuItem} onPress={() => setShowLangOptions(!showLangOptions)}>
           <Ionicons name="globe-outline" size={24} color={COLORS.text} />
           <View style={styles.menuContent}>
              <Text style={styles.menuText}>Language Preference</Text>
              <Text style={styles.menuSubtext}>{currentLang}</Text>
           </View>
           <Ionicons name={showLangOptions ? "chevron-down" : "chevron-forward"} size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {showLangOptions && (
           <View style={styles.langDropdown}>
              {LANGUAGES.map(lang => (
                 <TouchableOpacity 
                    key={lang.id} 
                    style={styles.langOption}
                    onPress={() => {
                       setCurrentLang(lang.name);
                       setShowLangOptions(false);
                    }}
                 >
                    <Text style={styles.langOptionText}>{lang.name}</Text>
                    {currentLang === lang.name && <Ionicons name="checkmark" size={16} color={COLORS.primary} />}
                 </TouchableOpacity>
              ))}
           </View>
        )}

        <TouchableOpacity style={styles.menuItem}>
           <Ionicons name="settings-outline" size={24} color={COLORS.text} />
           <Text style={styles.menuListItem}>General Settings</Text>
           <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
           <Ionicons name="help-circle-outline" size={24} color={COLORS.text} />
           <Text style={styles.menuListItem}>Help & Support</Text>
           <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
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
  content: {
    padding: SPACING.l,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.l,
    padding: SPACING.l,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.medium,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  userLevel: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: SPACING.l,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18, 
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: '80%',
    backgroundColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.m,
    color: COLORS.text,
    marginTop: SPACING.s,
  },
  achievementsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.xl,
  },
  badgeItem: {
    alignItems: 'center',
  },
  badgeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.s,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: SPACING.m,
    marginBottom: SPACING.s,
    ...SHADOWS.small,
  },
  menuContent: {
    flex: 1,
    marginLeft: SPACING.m,
  },
  menuText: {
    fontSize: 16,
    color: COLORS.text,
  },
  menuSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  menuListItem: {
    flex: 1,
    marginLeft: SPACING.m,
    fontSize: 16,
    color: COLORS.text,
  },
  langDropdown: {
    backgroundColor: '#f9f9f9',
    borderRadius: SPACING.m,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    marginTop: -SPACING.xs,
  },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.s,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  langOptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
});