import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { stories } from '../data/mockData';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function StoryLibraryScreen() {
  const navigation = useNavigation();

  const renderStoryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.storyCard} 
      onPress={() => navigation.navigate('Story', { storyId: item.id })}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
          {/* Placeholder for story image */}
          <View style={[styles.placeholderImage, { backgroundColor: COLORS.secondary }]}>
             <Ionicons name="book" size={32} color={COLORS.surface} />
          </View>
      </View>
      <View style={styles.contentContainer}>
          <Text style={styles.category}>FOLKLORE</Text>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.metaRow}>
              <View style={styles.aiBadge}>
                  <MaterialCommunityIcons name="robot" size={12} color={COLORS.primary} />
                  <Text style={styles.aiBadgeText}>AI Illustrated</Text>
              </View>
              <Text style={styles.metaText}> • 5 min</Text>
          </View>
      </View>
      <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Story Library</Text>
        <Text style={styles.headerSubtitle}>Discover ancient wisdom & tales</Text>
      </View>


      {/* NEW: AI Story Generator Call-to-Action */}
      <View style={styles.createSection}>
          <TouchableOpacity style={styles.createCard} activeOpacity={0.9} onPress={() => navigation.navigate('RecordTab')}>
              <View style={styles.createIconBg}>
                  <MaterialCommunityIcons name="magic-staff" size={24} color={COLORS.surface} />
              </View>
              <View style={styles.createTexts}>
                  <Text style={styles.createTitle}>Create AI Folktale</Text>
                  <Text style={styles.createSubtitle}>Turn elder recordings into illustrated e-books instantly.</Text>
              </View>
              <Ionicons name="arrow-forward-circle" size={32} color={COLORS.surface} />
          </TouchableOpacity>
      </View>
      
      <Text style={styles.sectionHeader}>Community Archive</Text>
      
      <FlatList
        data={stories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderStoryItem}
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
    paddingBottom: SPACING.m,
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
  createSection: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
  },
  createCard: {
    backgroundColor: COLORS.accent,
    borderRadius: SPACING.l,
    padding: SPACING.m,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  createIconBg: {
    width: 48, 
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  createTexts: {
    flex: 1,
    marginRight: SPACING.s,
  },
  createTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  createSubtitle: {
    fontSize: 12,
    color: COLORS.surface,
    opacity: 0.9,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: SPACING.l,
    marginTop: SPACING.s,
    marginBottom: SPACING.s,
  },
  listContent: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.xl,
  },
  storyCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.m,
    marginBottom: SPACING.m,
    padding: SPACING.m,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  imageContainer: {
    marginRight: SPACING.m,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: SPACING.s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  category: {
    fontSize: 10,
    color: COLORS.secondary,
    fontWeight: 'bold',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 2,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  arrowContainer: {
    marginLeft: SPACING.s,
  },
});