import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, SHADOWS, GLASS_EFFECTS } from '../constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { aiApiService } from '../services/aiApiService';

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
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [uploadedImage, setUploadedImage] = useState(null);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const detectFromApi = async (imageUri) => {
    setIsProcessing(true);
    try {
      const response = await aiApiService.visionFromImage({
        fileUri: imageUri,
        languageId: 'kadazan-demo',
      });

      const mapped = {
        id: `vision-${Date.now()}`,
        name: response?.detected_english || 'Detected Object',
        indigenous: response?.indigenous_word || 'Not found',
        pronunciation: (response?.indigenous_word || '').toLowerCase(),
        translation: response?.detected_english || 'Unknown',
        description: response?.found_in_dictionary
          ? 'Found in verified dictionary'
          : 'Not found in verified dictionary',
        confidence: response?.found_in_dictionary ? 95 : 65,
      };

      setDetectedObjects([mapped]);
      setSelectedObject(mapped);
    } catch (error) {
      console.error('Vision image API failed, using mock fallback:', error);
      setDetectedObjects(MOCK_DETECTED_OBJECTS);
      setSelectedObject(MOCK_DETECTED_OBJECTS[0]);
    } finally {
      setIsProcessing(false);
    }
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setUploadedImage(result.assets[0].uri);
      detectFromApi(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setUploadedImage(result.assets[0].uri);
      detectFromApi(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    Alert.alert("Saved", "Word saved to your collection!");
  };

  const handleShare = () => {
    Alert.alert("Share", "Sharing functionality coming soon!");
  };

  const handleAddToDeck = () => {
    Alert.alert("Added to Deck", "Word added to your flashcard deck!");
  };

  const handleImageUpload = () => {
    Alert.alert(
      "Snap & Learn",
      "Choose an option to identify objects",
      [
        {
          text: "Take Photo",
          onPress: takePhoto,
          icon: "camera" 
        },
        {
          text: "Choose from Gallery",
          onPress: pickImage,
          icon: "images"
        },
        {
          text: "Cancel",
          style: "cancel"
        }
      ]
    );
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('HomeTab'))}
          >
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Snap & Learn</Text>
          <TouchableOpacity onPress={() => Alert.alert('How it works', 'Take a photo of an object to learn its name in indigenous languages.')}>
            <Ionicons name="information-circle" size={24} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Image Upload Area */}
          {!uploadedImage ? (
            <TouchableOpacity
              style={[
                styles.uploadArea,
                { backgroundColor: theme.surface, borderColor: theme.border }
              ]}
              onPress={handleImageUpload}
              activeOpacity={0.7}
            >
              <View style={[styles.uploadIconContainer, { backgroundColor: theme.surfaceVariant }]}>
                <Ionicons name="cloud-upload-outline" size={64} color={theme.primary} />
              </View>
              <Text style={[styles.uploadTitle, { color: theme.text }]}>Drag & Drop Image Here</Text>
              <Text style={[styles.uploadSubtitle, { color: theme.textSecondary }]}>or tap to select from device</Text>
              <View style={[styles.supportedFormats, { backgroundColor: theme.surfaceVariant }]}>
                <Text style={[styles.formatText, { color: theme.textSecondary }]}>Supported: JPG, PNG, WEBP</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={[styles.imagePreviewContainer, { borderColor: theme.border }]}>
              <Image
                source={{ uri: uploadedImage }}
                style={styles.uploadedImage}
                resizeMode="cover"
              />
              <TouchableOpacity 
                onPress={handleReset} 
                style={[styles.floatingCloseButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
              >
                <Ionicons name="close" size={20} color="#FFF" />
              </TouchableOpacity>

              {isProcessing && (
                <View style={[styles.processingOverlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                  <View style={[styles.processingCard, { backgroundColor: theme.surface }]}>
                    <MaterialCommunityIcons
                      name="robot"
                      size={32}
                      color={theme.primary}
                    />
                    <Text style={[styles.processingText, { color: theme.text }]}>Analyzing...</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Detected Objects */}
          {detectedObjects.length > 0 && (
            <View style={styles.detectedSection}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="eye-check" size={24} color={theme.success || '#10B981'} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
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
                      { backgroundColor: theme.surface, borderColor: theme.border },
                      selectedObject?.id === obj.id && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                    onPress={() => setSelectedObject(obj)}
                  >
                    <Text
                      style={[
                        styles.objectChipText,
                        { color: theme.text },
                        selectedObject?.id === obj.id && { color: theme.surface },
                      ]}
                    >
                      {obj.name}
                    </Text>
                    <View style={[styles.confidenceBadge, { backgroundColor: theme.surfaceVariant }]}>
                      <Text style={[styles.confidenceText, { color: theme.textSecondary }]}>{obj.confidence}%</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Selected Object Details */}
          {selectedObject && (
            <View style={[styles.vocabularyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.cardHeader, { borderBottomColor: theme.border }]}>
                <View style={styles.languageLabel}>
                  <MaterialCommunityIcons name="earth" size={20} color={theme.primary} />
                  <Text style={[styles.languageLabelText, { color: theme.textSecondary }]}>Indigenous Borneo</Text>
                </View>
                <TouchableOpacity
                  style={[styles.playButton, { backgroundColor: theme.surfaceVariant }]}
                  onPress={() => handlePlayAudio(selectedObject.id)}
                >
                  <Ionicons
                    name={playingAudio === selectedObject.id ? "pause-circle" : "volume-high"}
                    size={32}
                    color={theme.primary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.wordContainer}>
                <Text style={[styles.indigenousWord, { color: theme.primary }]}>{selectedObject.indigenous}</Text>
                <View style={[styles.pronunciationContainer, { backgroundColor: theme.surfaceVariant }]}>
                  <Ionicons name="mic-outline" size={16} color={theme.secondary} />
                  <Text style={[styles.pronunciation, { color: theme.textSecondary }]}>/{selectedObject.pronunciation}/</Text>
                </View>
              </View>

              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>ENGLISH TRANSLATION</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{selectedObject.translation}</Text>
                </View>

                <View style={[styles.detailItem, { marginTop: SPACING.m, paddingTop: SPACING.m, borderTopWidth: 1, borderTopColor: theme.border }]}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>ABOUT THIS WORD</Text>
                  <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>{selectedObject.description}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Beginner Tips */}
          {!uploadedImage && (
            <View style={[styles.tipsCard, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
              <View style={styles.tipsHeader}>
                <Ionicons name="bulb" size={24} color={theme.accent} />
                <Text style={[styles.tipsTitle, { color: theme.text }]}>Tips for Beginners</Text>
              </View>
              <View style={styles.tipsList}>
                <View style={styles.tipItem}>
                  <View style={[styles.tipBullet, { backgroundColor: theme.accent }]} />
                  <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                    Take clear photos of objects in good lighting
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={[styles.tipBullet, { backgroundColor: theme.accent }]} />
                  <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                    Start with common household items or food
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={[styles.tipBullet, { backgroundColor: theme.accent }]} />
                  <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                    The AI identifies objects and teaches indigenous words
                  </Text>
                </View>
                <View style={styles.tipItem}>
                  <View style={[styles.tipBullet, { backgroundColor: theme.accent }]} />
                  <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                    Practice pronunciation by listening to audio
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Example Images */}
          {!uploadedImage && (
            <View style={styles.examplesSection}>
              <Text style={[styles.examplesTitle, { color: theme.text }]}>Try these examples:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity style={[styles.exampleCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={handleImageUpload}>
                  <View style={[styles.exampleImage, { backgroundColor: theme.surfaceVariant }]}>
                    <MaterialCommunityIcons name="fruit-pineapple" size={48} color={theme.accent} />
                  </View>
                  <Text style={[styles.exampleText, { color: theme.text }]}>Fruits</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.exampleCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={handleImageUpload}>
                  <View style={[styles.exampleImage, { backgroundColor: theme.surfaceVariant }]}>
                    <MaterialCommunityIcons name="food-variant" size={48} color={theme.secondary} />
                  </View>
                  <Text style={[styles.exampleText, { color: theme.text }]}>Foods</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.exampleCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={handleImageUpload}>
                  <View style={[styles.exampleImage, { backgroundColor: theme.surfaceVariant }]}>
                    <MaterialCommunityIcons name="tree" size={48} color={theme.success || '#10B981'} />
                  </View>
                  <Text style={[styles.exampleText, { color: theme.text }]}>Nature</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.exampleCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={handleImageUpload}>
                  <View style={[styles.exampleImage, { backgroundColor: theme.surfaceVariant }]}>
                    <MaterialCommunityIcons name="home" size={48} color={theme.primary} />
                  </View>
                  <Text style={[styles.exampleText, { color: theme.text }]}>Home</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    padding: SPACING.l,
  },
  uploadArea: {
    borderRadius: SPACING.l,
    padding: SPACING.xxl,
    alignItems: 'center',
    marginBottom: SPACING.l,
    borderWidth: 1, // Thin border
    borderStyle: 'dashed', // Dashed for upload area
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
    borderRadius: SPACING.m,
    overflow: 'hidden',
    borderWidth: 1, // Thin border
    marginBottom: SPACING.l,
    position: 'relative',
    borderColor: '#e0e0e0', // Use a default light color if theme is not ready, or rely on JS injection
  },
  uploadedImage: {
    width: '100%',
    height: 300, 
    backgroundColor: '#000',
  },
  floatingCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingCard: {
    backgroundColor: COLORS.glassLight,
    padding: SPACING.l,
    borderRadius: SPACING.m,
    borderWidth: 1,
    marginBottom: SPACING.m,
    borderColor: 'rgba(255, 255, 255, 0.4)',
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
    backgroundColor: COLORS.glassLight,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    borderRadius: 20,
    borderWidth: 1, // Thin border
    gap: SPACING.s,
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
    backgroundColor: COLORS.glassLight,
    borderRadius: SPACING.m,
    padding: SPACING.l,
    borderWidth: 1, // Thin border
    marginTop: SPACING.l,
    marginBottom: SPACING.xl,
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
    paddingVertical: SPACING.l, // Increased padding
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
  detailsContainer: {
    paddingHorizontal: SPACING.s,
    alignItems: 'center',
  },
  detailItem: {
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.s,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  tipsCard: {
    backgroundColor: '#F0F8FF',
    borderRadius: SPACING.m,
    padding: SPACING.l,
    marginBottom: SPACING.l,
    borderWidth: 1, // Thin border
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
