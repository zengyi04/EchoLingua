import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, SHADOWS, GLASS_EFFECTS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function LearnScreen() {
  const navigation = useNavigation();
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('HomeTab'))}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Structured Lessons</Text>
        <Text style={styles.headerSubtitle}>Master the basics step-by-step</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Progress Overview */}
        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>Course Progress</Text>
          <View style={styles.progressBarBg}>
             <View style={[styles.progressBarFill, { width: '35%' }]} />
          </View>
          <Text style={styles.progressText}>Unit 1: Greetings • 4/12 Lessons</Text>
        </View>

        {/* Lesson List */}
        <View style={styles.lessonSection}>
           <Text style={styles.sectionTitle}>Living Language Scenarios</Text>
           
           <TouchableOpacity 
             style={styles.lessonItem}
             onPress={() => navigation.navigate('LivingLanguage', { scenario: 'home' })}
             activeOpacity={0.7}
           >
              <View style={[styles.iconBox, { backgroundColor: COLORS.success }]}>
                <Ionicons name="home" size={20} color={COLORS.surface} />
              </View>
              <View style={styles.lessonInfo}>
                 <Text style={styles.lessonTitle}>At Home (Di Rumah)</Text>
                 <Text style={styles.lessonDesc}>Family conversations & daily routines</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
           </TouchableOpacity>

           <TouchableOpacity 
             style={styles.lessonItem}
             onPress={() => navigation.navigate('LivingLanguage', { scenario: 'tamu' })}
             activeOpacity={0.7}
           >
              <View style={[styles.iconBox, { backgroundColor: COLORS.secondary }]}>
                <Ionicons name="basket" size={20} color={COLORS.surface} />
              </View>
              <View style={styles.lessonInfo}>
                 <Text style={styles.lessonTitle}>At the Tamu (Market)</Text>
                 <Text style={styles.lessonDesc}>Bargaining & buying produce</Text>
              </View>
              <Ionicons name="play-circle" size={24} color={COLORS.primary} />
           </TouchableOpacity>

           <TouchableOpacity 
             style={styles.lessonItem}
             onPress={() => navigation.navigate('LivingLanguage', { scenario: 'elders' })}
             activeOpacity={0.7}
           >
              <View style={[styles.iconBox, { backgroundColor: COLORS.accent }]}>
                <Ionicons name="people" size={20} color={COLORS.surface} />
              </View>
              <View style={styles.lessonInfo}>
                 <Text style={styles.lessonTitle}>Greeting Elders</Text>
                 <Text style={styles.lessonDesc}>Respectful terms & gestures</Text>
              </View>
              <View style={styles.tag}><Text style={styles.tagText}>CULTURE</Text></View>
           </TouchableOpacity>

           <TouchableOpacity 
             style={styles.lessonItem}
             onPress={() => navigation.navigate('LivingLanguage', { scenario: 'festival' })}
             activeOpacity={0.7}
           >
              <View style={[styles.iconBox, { backgroundColor: '#E91E63' }]}> 
                <Ionicons name="musical-notes" size={20} color={COLORS.surface} />
              </View>
              <View style={styles.lessonInfo}>
                 <Text style={styles.lessonTitle}>Harvest Festival</Text>
                 <Text style={styles.lessonDesc}>Songs & specialized vocabulary</Text>
              </View>
              <Ionicons name="play-circle" size={24} color={COLORS.primary} />
           </TouchableOpacity>

           <TouchableOpacity 
             style={styles.lessonItem}
             onPress={() => navigation.navigate('LivingLanguage', { scenario: 'school' })}
             activeOpacity={0.7}
           >
              <View style={[styles.iconBox, { backgroundColor: '#3F51B5' }]}> 
                <Ionicons name="school" size={20} color={COLORS.surface} />
              </View>
              <View style={styles.lessonInfo}>
                 <Text style={styles.lessonTitle}>At School</Text>
                 <Text style={styles.lessonDesc}>Classroom phrases and introductions</Text>
              </View>
              <Ionicons name="play-circle" size={24} color={COLORS.primary} />
           </TouchableOpacity>

           <TouchableOpacity 
             style={styles.lessonItem}
             onPress={() => navigation.navigate('LivingLanguage', { scenario: 'clinic' })}
             activeOpacity={0.7}
           >
              <View style={[styles.iconBox, { backgroundColor: '#F44336' }]}> 
                <Ionicons name="medkit" size={20} color={COLORS.surface} />
              </View>
              <View style={styles.lessonInfo}>
                 <Text style={styles.lessonTitle}>At Clinic</Text>
                 <Text style={styles.lessonDesc}>Health and help-seeking conversations</Text>
              </View>
              <Ionicons name="play-circle" size={24} color={COLORS.primary} />
           </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tag: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.l,
    backgroundColor: COLORS.glassLight,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.4)',
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: SPACING.xs,
    marginBottom: SPACING.xs,
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
    padding: SPACING.l,
  },
  progressCard: {
    backgroundColor: COLORS.glassLight,
    borderRadius: SPACING.m,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    padding: SPACING.m,
    marginBottom: SPACING.l,
    ...SHADOWS.small,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.s,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: SPACING.xs,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.m,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassLight,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    padding: SPACING.m,
    borderRadius: SPACING.m,
    marginBottom: SPACING.s,
    ...SHADOWS.small,
  },
  lessonLocked: {
    opacity: 0.6,
    backgroundColor: '#f9f9f9',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  lessonDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});