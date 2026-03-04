import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function RecordScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Preserve Voices</Text>
        <Text style={styles.headerSubtitle}>Record elders & stories for future generations</Text>
      </View>
      
      <View style={styles.content}>
         
         {/* Voice Model Visualization (New) */}
         <View style={styles.modelCard}>
            <View style={styles.modelHeader}>
               <Text style={styles.modelTitle}>AI Voice Model: <Text style={{fontWeight:'bold'}}>Grandpa Jukie</Text></Text>
               <View style={styles.badge}><Text style={styles.badgeText}>ACTIVE</Text></View>
            </View>
            <View style={styles.waveContainer}>
               {/* Mock sound wave bars */}
               {[30, 50, 20, 45, 60, 35, 25, 40, 55, 30].map((h, i) => (
                  <View key={i} style={[styles.waveBar, { height: h }]} />
               ))}
            </View>
            <Text style={styles.modelDesc}>Your recordings are training a digital voice to preserve this dialect for the next generation.</Text>
         </View>

         <View style={styles.micContainer}>
            <View style={styles.micCircle}>
               <Ionicons name="mic" size={64} color={COLORS.surface} />
            </View>
            <Text style={styles.micLabel}>Tap to Contribute</Text>
         </View>

         <View style={styles.optionsGrid}>
            <TouchableOpacity style={styles.optionCard}>
               <MaterialCommunityIcons name="account-voice" size={32} color={COLORS.secondary} />
               <Text style={styles.optionText}>Elder Interview</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.optionCard}>
               <MaterialCommunityIcons name="book-open-variant" size={32} color={COLORS.accent} />
               <Text style={styles.optionText}>Read a Story</Text>
            </TouchableOpacity>
         </View>

         <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
            <Text style={styles.infoText}>
               Your recordings help build the "Living Language" AI model. Each voice matters.
            </Text>
         </View>
      </View>
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
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: SPACING.l,
    alignItems: 'center',
  },
  modelCard: {
    width: '100%',
    backgroundColor: '#FFE0B2', // Soft Orange
    padding: SPACING.m,
    borderRadius: SPACING.m,
    marginBottom: SPACING.xl,
    ...SHADOWS.small,
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  modelTitle: {
    fontSize: 16,
    color: COLORS.text,
  },
  badge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: COLORS.surface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 4,
    marginBottom: SPACING.s,
  },
  waveBar: {
    width: 6,
    backgroundColor: COLORS.secondary,
    borderRadius: 3,
  },
  modelDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  micContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  micCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
    marginBottom: SPACING.m,
  },
  micLabel: {
    fontSize: 18, 
    fontWeight: '600',
    color: COLORS.text,
  },
  optionsGrid: {
    flexDirection: 'row',
    gap: SPACING.m,
    width: '100%',
    marginBottom: SPACING.xl,
  },
  optionCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: SPACING.l,
    borderRadius: SPACING.m,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.small,
  },
  optionText: {
    marginTop: SPACING.s,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    padding: SPACING.m,
    borderRadius: SPACING.m,
    alignItems: 'center',
  },
  infoText: {
    marginLeft: SPACING.s,
    color: COLORS.textSecondary,
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});