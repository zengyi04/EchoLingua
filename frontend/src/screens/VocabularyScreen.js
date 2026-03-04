import React from 'react';
import { View, FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import VocabularyCard from '../components/VocabularyCard';
import { vocabularyList } from '../data/mockData';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';

export default function VocabularyScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
           <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Learn Vocabulary</Text>
          <Text style={styles.headerSubtitle}>Explore words from daily life</Text>
        </View>
      </View>

      {/* Image-to-Vocabulary Action */}
      <TouchableOpacity 
        style={styles.cameraButton}
        onPress={() => alert('Starting Image-to-Vocabulary...')}
        activeOpacity={0.8}
      >
        <Ionicons name="camera" size={24} color={COLORS.surface} />
        <Text style={styles.cameraButtonText}>Snap & Learn</Text>
      </TouchableOpacity>

      <FlatList
        data={vocabularyList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <VocabularyCard word={item} />}
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: SPACING.m,
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
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    margin: SPACING.m,
    padding: SPACING.m,
    borderRadius: SPACING.l,
    ...SHADOWS.medium,
  },
  cameraButtonText: {
    color: COLORS.surface,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: SPACING.s,
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
});