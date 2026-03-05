import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const MOCK_DETECTED_OBJECTS = [
  {
    id: '1',
    name: 'Pineapple',
    indigenous: 'Nanas',
    pronunciation: 'na-nas',
    translation: 'Pineapple',
    description: 'A tropical fruit commonly found in Borneo',
    confidence: 95,
  },
  {
    id: '2',
    name: 'Banana',
    indigenous: 'Pisang',
    pronunciation: 'pi-sang',
    translation: 'Banana',
    description: 'Common fruit in local markets',
    confidence: 92,
  },
  {
    id: '3',
    name: 'Leaf',
    indigenous: 'Daun',
    pronunciation: 'da-un',
    translation: 'Leaf',
    description: 'Plant foliage',
    confidence: 88,
  },
];

export default function ImageVocabularyScreen() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleImageUpload = () => {
    console.log('📸 Image uploaded - Sound: camera shutter');
    // Simulate image upload
    setIsProcessing(true);
    setUploadedImage('https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=Tropical+Fruits');
    
    setTimeout(() => {
      console.log('✅ Image processed - Sound: success');
      setDetectedObjects(MOCK_DETECTED_OBJECTS);
      setIsProcessing(false);
      setSelectedObject(MOCK_DETECTED_OBJECTS[0]);
    }, 2000);
  };

  const handlePlayAudio = (objectId) => {
    console.log('🔊 Playing pronunciation - Sound: word audio');
    setPlayingAudio(objectId);
    setTimeout(() => {
      setPlayingAudio(null);
      console.log('✅ Pronunciation finished');
    }, 1500);
  };

  const handleReset = () => {
    setUploadedImage(null);
    setDetectedObjects([]);
    setSelectedObject(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Image to Vocabulary</Text>
          <Text style={styles.headerSubtitle}>
            Upload images to discover indigenous words
          </Text>
        </View>

        <View style={styles.content}>
          {/* Image Upload Area */}
          {!uploadedImage ? (
            <TouchableOpacity
              style={[styles.uploadArea, isDragging && styles.uploadAreaDragging]}
              onPress={handleImageUpload}
              activeOpacity={0.7}
            >
              <View style={styles.uploadIconContainer}>
                <Ionicons name="cloud-upload-outline" size={64} color={COLORS.primary} />
              </View>
              <Text style={styles.uploadTitle}>Drag & Drop Image Here</Text>
              <Text style={styles.uploadSubtitle}>or tap to select from device</Text>
              <View style={styles.supportedFormats}>
                <Text style={styles.formatText}>Supported: JPG, PNG, WEBP</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.imagePreviewContainer}>
              <View style={styles.imageHeader}>
                <Text style={styles.imageHeaderTitle}>Uploaded Image</Text>
                <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
                  <Ionicons name="close-circle" size={24} color={COLORS.error} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: uploadedImage }}
                  style={styles.uploadedImage}
                  resizeMode="cover"
                />
                {isProcessing && (
                  <View style={styles.processingOverlay}>
                    <View style={styles.processingCard}>
                      <MaterialCommunityIcons
                        name="robot"
                        size={48}
                        color={COLORS.primary}
                      />
                      <Text style={styles.processingText}>Analyzing image...</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Detected Objects */}
          {detectedObjects.length > 0 && (
            <View style={styles.detectedSection}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="eye-check" size={24} color={COLORS.success} />
                <Text style={styles.sectionTitle}>
                  Detected Objects ({detectedObjects.length})
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.objectChipsContainer}
              >
                {detectedObjects.map((obj) => (
                  <TouchableOpacity
                    key={obj.id}
                    style={[
                      styles.objectChip,
                      selectedObject?.id === obj.id && styles.objectChipSelected,
                    ]}
                    onPress={() => setSelectedObject(obj)}
                  >
                    <Text
                      style={[
                        styles.objectChipText,
                        selectedObject?.id === obj.id && styles.objectChipTextSelected,
                      ]}
                    >
                      {obj.name}
                    </Text>
                    <View style={styles.confidenceBadge}>
                      <Text style={styles.confidenceText}>{obj.confidence}%</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Selected Object Details */}
          {selectedObject && (
            <View style={styles.vocabularyCard}>
              <View style={styles.cardHeader}>
                <View style={styles.languageLabel}>
                  <MaterialCommunityIcons name="earth" size={20} color={COLORS.primary} />
                  <Text style={styles.languageLabelText}>Indigenous Borneo</Text>
                </View>
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={() => handlePlayAudio(selectedObject.id)}
                >
                  <Ionicons
                    name={playingAudio === selectedObject.id ? "pause-circle" : "volume-high"}
                    size={32}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.wordContainer}>
                <Text style={styles.indigenousWord}>{selectedObject.indigenous}</Text>
                <View style={styles.pronunciationContainer}>
                  <Ionicons name="mic-outline" size={16} color={COLORS.secondary} />
                  <Text style={styles.pronunciation}>/{selectedObject.pronunciation}/</Text>
                </View>
              </View>

              <View style={styles.translationContainer}>
                <View style={styles.translationHeader}>
                  <MaterialCommunityIcons name="translate" size={18} color={COLORS.textSecondary} />
                  <Text style={styles.translationLabel}>English Translation</Text>
                </View>
                <Text style={styles.translationText}>{selectedObject.translation}</Text>
              </View>

              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionTitle}>About this word:</Text>
                <Text style={styles.descriptionText}>{selectedObject.description}</Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="bookmark-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.actionButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="share-social-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <MaterialCommunityIcons name="cards" size={20} color={COLORS.primary} />
                  <Text style={styles.actionButtonText}>Add to Deck</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Beginner Tips */}
          {!uploadedImage && (
            <View style={styles.tipsCard}>
              <View style={styles.tipsHeader}>
                <Ionicons name="bulb" size={24} color={COLORS.accent} />
                <Text style={styles.tipsTitle}>Tips for Beginners</Text>
              </View>
              <View style={styles.tipsList}>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>
                    Take clear photos of objects in good lighting
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>
                    Start with common household items or food
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>
                    The AI identifies objects and teaches indigenous words
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={styles.tipBullet} />
                  <Text style={styles.tipText}>
                    Practice pronunciation by listening to audio
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Example Images */}
          {!uploadedImage && (
            <View style={styles.examplesSection}>
              <Text style={styles.examplesTitle}>Try these examples:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity style={styles.exampleCard} onPress={handleImageUpload}>
                  <View style={styles.exampleImage}>
                    <MaterialCommunityIcons name="fruit-pineapple" size={48} color={COLORS.accent} />
                  </View>
                  <Text style={styles.exampleText}>Fruits</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.exampleCard} onPress={handleImageUpload}>
                  <View style={styles.exampleImage}>
                    <MaterialCommunityIcons name="food-variant" size={48} color={COLORS.secondary} />
                  </View>
                  <Text style={styles.exampleText}>Foods</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.exampleCard} onPress={handleImageUpload}>
                  <View style={styles.exampleImage}>
                    <MaterialCommunityIcons name="tree" size={48} color={COLORS.success} />
                  </View>
                  <Text style={styles.exampleText}>Nature</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.exampleCard} onPress={handleImageUpload}>
                  <View style={styles.exampleImage}>
                    <MaterialCommunityIcons name="home" size={48} color={COLORS.primary} />
                  </View>
                  <Text style={styles.exampleText}>Home</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: SPACING.l,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.small,
  },
  headerTitle: {
    fontSize: 28,
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
  uploadArea: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: SPACING.l,
    padding: SPACING.xxl,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    ...SHADOWS.small,
  },
  uploadAreaDragging: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.success,
  },
  uploadIconContainer: {
    marginBottom: SPACING.m,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.s,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.l,
  },
  supportedFormats: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: SPACING.s,
  },
  formatText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  imagePreviewContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.m,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  imageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  imageHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  resetButton: {
    padding: 4,
  },
  imageWrapper: {
    position: 'relative',
  },
  uploadedImage: {
    width: '100%',
    height: 250,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.l,
    borderRadius: SPACING.m,
    alignItems: 'center',
  },
  processingText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: SPACING.s,
  },
  detectedSection: {
    marginTop: SPACING.l,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginBottom: SPACING.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  objectChipsContainer: {
    gap: SPACING.s,
  },
  objectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: SPACING.s,
    ...SHADOWS.small,
  },
  objectChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  objectChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  objectChipTextSelected: {
    color: COLORS.primary,
  },
  confidenceBadge: {
    backgroundColor: COLORS.success + '30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  vocabularyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.m,
    padding: SPACING.l,
    marginTop: SPACING.l,
    ...SHADOWS.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  languageLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: SPACING.s,
  },
  languageLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  playButton: {
    padding: 4,
  },
  wordContainer: {
    alignItems: 'center',
    marginBottom: SPACING.l,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  indigenousWord: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.s,
  },
  pronunciationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  pronunciation: {
    fontSize: 16,
    color: COLORS.secondary,
    fontStyle: 'italic',
  },
  translationContainer: {
    marginBottom: SPACING.l,
  },
  translationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginBottom: SPACING.s,
  },
  translationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  translationText: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  descriptionContainer: {
    backgroundColor: COLORS.background,
    padding: SPACING.m,
    borderRadius: SPACING.s,
    marginBottom: SPACING.l,
  },
  descriptionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.s,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.m,
    borderRadius: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  tipsCard: {
    backgroundColor: '#F0F8FF',
    borderRadius: SPACING.m,
    padding: SPACING.l,
    marginTop: SPACING.l,
    ...SHADOWS.small,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginBottom: SPACING.m,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  tipsList: {
    gap: SPACING.s,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.s,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    marginTop: 6,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  examplesSection: {
    marginTop: SPACING.l,
  },
  examplesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.m,
  },
  exampleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.m,
    padding: SPACING.l,
    marginRight: SPACING.m,
    alignItems: 'center',
    width: 120,
    ...SHADOWS.small,
  },
  exampleImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  exampleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
});
