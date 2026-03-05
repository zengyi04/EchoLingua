import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const SCENARIOS = [
  {
    id: '1',
    title: 'At Home',
    icon: 'home',
    iconType: 'Ionicons',
    color: '#4CAF50',
    conversations: [
      { id: '1', indigenous: 'Selamat pagi! Suka ka nginum kopi?', translation: 'Good morning! Would you like some coffee?', speaker: 'elder' },
      { id: '2', indigenous: 'Iya, terima kasih banyak.', translation: 'Yes, thank you very much.', speaker: 'user' },
      { id: '3', indigenous: 'Apa khabar keluarga nuan?', translation: 'How is your family?', speaker: 'elder' },
      { id: '4', indigenous: 'Semua sihat, terima kasih!', translation: 'Everyone is healthy, thank you!', speaker: 'user' },
    ],
  },
  {
    id: '2',
    title: 'At Market',
    icon: 'basket',
    iconType: 'Ionicons',
    color: '#FF9800',
    conversations: [
      { id: '1', indigenous: 'Berapa ringgit sayur tu?', translation: 'How much are these vegetables?', speaker: 'user' },
      { id: '2', indigenous: 'Tiga ringgit sekilo.', translation: 'Three ringgit per kilo.', speaker: 'elder' },
      { id: '3', indigenous: 'Boleh kurang sikit?', translation: 'Can you reduce the price a bit?', speaker: 'user' },
      { id: '4', indigenous: 'Okay, dua ringgit lima puluh.', translation: 'Okay, two ringgit fifty.', speaker: 'elder' },
    ],
  },
  {
    id: '3',
    title: 'Greeting Elders',
    icon: 'people',
    iconType: 'Ionicons',
    color: '#9C27B0',
    conversations: [
      { id: '1', indigenous: 'Selamat datang! Lama sudah sik datai.', translation: 'Welcome! It has been a long time since you visited.', speaker: 'elder' },
      { id: '2', indigenous: 'Terima kasih, pak. Apa khabar?', translation: 'Thank you, sir. How are you?', speaker: 'user' },
      { id: '3', indigenous: 'Alhamdulillah, baik. Duduk, duduk!', translation: 'Alhamdulillah, I am well. Sit, sit!', speaker: 'elder' },
      { id: '4', indigenous: 'Terima kasih. Saya ada bawa buah tangan.', translation: 'Thank you. I brought some gifts.', speaker: 'user' },
    ],
  },
  {
    id: '4',
    title: 'Festival',
    icon: 'musical-notes',
    iconType: 'Ionicons',
    color: '#E91E63',
    conversations: [
      { id: '1', indigenous: 'Gawai Dayak sudah tiba!', translation: 'Gawai Dayak has arrived!', speaker: 'elder' },
      { id: '2', indigenous: 'Mari kita rayakan bersama!', translation: 'Let us celebrate together!', speaker: 'user' },
      { id: '3', indigenous: 'Jangan lupa tuak dan penganan tradisional.', translation: 'Do not forget the rice wine and traditional delicacies.', speaker: 'elder' },
      { id: '4', indigenous: 'Saya akan bawa kuih sarang semut.', translation: 'I will bring kuih sarang semut.', speaker: 'user' },
    ],
  },
];

export default function LivingLanguageScreen() {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [showTranslation, setShowTranslation] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [sound, setSound] = useState(null);

  // Initialize audio
  useEffect(() => {
    (async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
      });
    })();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const handleScenarioSelect = (scenario) => {
    console.log('🎯 Scenario selected - Sound: tap');
    setSelectedScenario(scenario);
    setCurrentStep(0);
  };

  const handleBack = () => {
    setSelectedScenario(null);
    setCurrentStep(0);
  };

  const handleSwitchScenario = (scenario) => {
    console.log('🔄 Switching scenario - Sound: swoosh');
    setSelectedScenario(scenario);
    setCurrentStep(0);
  };

  const handlePlayAudio = async (conversationId) => {
    try {
      console.log('🔊 Playing audio - Sound: speech');
      setPlayingAudio(conversationId);
      
      // Simulate audio playback
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('../../../assets/appLogo.png'), // Placeholder - in production use actual audio files
        { shouldPlay: false }
      ).catch(() => ({ sound: null }));
      
      if (newSound) {
        setSound(newSound);
      }
      
      setTimeout(() => {
        setPlayingAudio(null);
        console.log('✅ Audio finished');
      }, 2000);
    } catch (error) {
      console.log('Audio playback simulated');
      setPlayingAudio(conversationId);
      setTimeout(() => setPlayingAudio(null), 2000);
    }
  };

  const handleNext = () => {
    if (selectedScenario && currentStep < selectedScenario.conversations.length - 1) {
      console.log('➡️ Next - Sound: swoosh');
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      console.log('⬅️ Previous - Sound: swoosh');
      setCurrentStep(currentStep - 1);
    }
  };

  const renderScenarioCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.scenarioCard, { borderLeftColor: item.color }]}
      onPress={() => handleScenarioSelect(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.scenarioIconContainer, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon} size={36} color={item.color} />
      </View>
      <View style={styles.scenarioTextContainer}>
        <Text style={styles.scenarioTitle}>{item.title}</Text>
        <Text style={styles.scenarioSubtitle}>
          {item.conversations.length} conversations
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  const renderConversationBubble = (conversation, index) => {
    const isElderSpeaking = conversation.speaker === 'elder';
    const isCurrentStep = index === currentStep;
    
    return (
      <View
        key={conversation.id}
        style={[
          styles.conversationContainer,
          isElderSpeaking ? styles.elderContainer : styles.userContainer,
          !isCurrentStep && styles.dimmedConversation,
        ]}
      >
        <View
          style={[
            styles.bubble,
            isElderSpeaking ? styles.elderBubble : styles.userBubble,
          ]}
        >
          <View style={styles.bubbleHeader}>
            <Text style={styles.speakerLabel}>
              {isElderSpeaking ? '👴 Elder' : '👤 You'}
            </Text>
            <TouchableOpacity
              onPress={() => handlePlayAudio(conversation.id)}
              style={styles.audioButton}
            >
              <Ionicons
                name={playingAudio === conversation.id ? "pause-circle" : "play-circle"}
                size={24}
                color={isElderSpeaking ? COLORS.primary : COLORS.secondary}
              />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.indigenousText}>{conversation.indigenous}</Text>
          
          {showTranslation && (
            <Text style={styles.translationText}>{conversation.translation}</Text>
          )}
        </View>
      </View>
    );
  };

  if (!selectedScenario) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Living Language Mode</Text>
          <Text style={styles.headerSubtitle}>
            Learn through real-life conversation scenarios
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="information" size={24} color={COLORS.accent} />
            <Text style={styles.infoText}>
              Select a scenario to practice conversations in indigenous Bornean languages
            </Text>
          </View>

          <FlatList
            data={SCENARIOS}
            renderItem={renderScenarioCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.scenarioList}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.conversationHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.conversationTitle}>{selectedScenario.title}</Text>
          <Text style={styles.conversationProgress}>
            {currentStep + 1} / {selectedScenario.conversations.length}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowTranslation(!showTranslation)}
          style={styles.toggleButton}
        >
          <MaterialCommunityIcons
            name={showTranslation ? "eye-outline" : "eye-off-outline"}
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Scenario Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scenarioSelectorContainer}
        contentContainerStyle={styles.scenarioSelectorContent}
      >
        {SCENARIOS.map((scenario) => (
          <TouchableOpacity
            key={scenario.id}
            style={[
              styles.scenarioSelectorButton,
              selectedScenario.id === scenario.id && styles.scenarioSelectorActive,
              { borderColor: scenario.color },
            ]}
            onPress={() => handleSwitchScenario(scenario)}
          >
            <Ionicons name={scenario.icon} size={20} color={scenario.color} />
            <Text
              style={[
                styles.scenarioSelectorText,
                selectedScenario.id === scenario.id && styles.scenarioSelectorTextActive,
              ]}
              numberOfLines={1}
            >
              {scenario.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.conversationContent} showsVerticalScrollIndicator={false}>
        <View style={styles.conversationList}>
          {selectedScenario.conversations.map((conv, index) => 
            renderConversationBubble(conv, index)
          )}
        </View>

        {/* Role-play Interaction */}
        <View style={styles.rolePlaySection}>
          <View style={styles.rolePlayHeader}>
            <MaterialCommunityIcons name="drama-masks" size={24} color={COLORS.secondary} />
            <Text style={styles.rolePlayTitle}>Role-play Practice</Text>
          </View>
          
          <View style={styles.rolePlayActions}>
            <TouchableOpacity
              style={[styles.rolePlayButton, currentStep === 0 && styles.disabledButton]}
              onPress={handlePrevious}
              disabled={currentStep === 0}
            >
              <Ionicons name="play-back" size={20} color={COLORS.surface} />
              <Text style={styles.rolePlayButtonText}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.recordButton}
              onPress={() => alert('Recording your response...')}
            >
              <Ionicons name="mic" size={24} color={COLORS.surface} />
              <Text style={styles.recordButtonText}>Record Response</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.rolePlayButton,
                currentStep === selectedScenario.conversations.length - 1 && styles.disabledButton,
              ]}
              onPress={handleNext}
              disabled={currentStep === selectedScenario.conversations.length - 1}
            >
              <Text style={styles.rolePlayButtonText}>Next</Text>
              <Ionicons name="play-forward" size={20} color={COLORS.surface} />
            </TouchableOpacity>
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
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    margin: SPACING.l,
    padding: SPACING.m,
    borderRadius: SPACING.m,
    gap: SPACING.m,
    ...SHADOWS.small,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  scenarioList: {
    padding: SPACING.l,
    paddingTop: 0,
  },
  scenarioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderRadius: SPACING.m,
    borderLeftWidth: 4,
    ...SHADOWS.small,
  },
  scenarioIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  scenarioTextContainer: {
    flex: 1,
  },
  scenarioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  scenarioSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.small,
  },
  backButton: {
    padding: SPACING.s,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  conversationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  conversationProgress: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  toggleButton: {
    padding: SPACING.s,
  },
  conversationContent: {
    flex: 1,
  },
  conversationList: {
    padding: SPACING.l,
  },
  conversationContainer: {
    marginBottom: SPACING.l,
  },
  elderContainer: {
    alignItems: 'flex-start',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  dimmedConversation: {
    opacity: 0.5,
  },
  bubble: {
    maxWidth: '85%',
    padding: SPACING.m,
    borderRadius: SPACING.m,
    ...SHADOWS.small,
  },
  elderBubble: {
    backgroundColor: '#E8F5E9',
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#E3F2FD',
    borderTopRightRadius: 4,
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  speakerLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  audioButton: {
    padding: 2,
  },
  indigenousText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.s,
    lineHeight: 24,
  },
  translationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  rolePlaySection: {
    backgroundColor: COLORS.surface,
    margin: SPACING.l,
    padding: SPACING.l,
    borderRadius: SPACING.m,
    ...SHADOWS.medium,
  },
  rolePlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginBottom: SPACING.m,
  },
  rolePlayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  rolePlayActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.s,
  },
  rolePlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    borderRadius: SPACING.s,
    flex: 0.3,
    justifyContent: 'center',
  },
  rolePlayButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    borderRadius: SPACING.s,
    flex: 0.4,
    justifyContent: 'center',
  },
  recordButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  disabledButton: {
    opacity: 0.4,
  },
  scenarioSelectorContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  scenarioSelectorContent: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    gap: SPACING.s,
  },
  scenarioSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: SPACING.m,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    marginRight: SPACING.s,
  },
  scenarioSelectorActive: {
    backgroundColor: COLORS.primary + '20',
    borderWidth: 2.5,
  },
  scenarioSelectorText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    maxWidth: 80,
  },
  scenarioSelectorTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});
