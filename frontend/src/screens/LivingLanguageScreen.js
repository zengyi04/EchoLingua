import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { useRoute } from '@react-navigation/native';

const SCENARIOS = [
  {
    id: 'home',
    title: 'At Home',
    icon: 'home',
    color: '#4CAF50',
    cases: [
      {
        id: 'morning-routine',
        title: 'Morning Routine',
        conversations: [
          { id: '1', indigenous: 'Selamat pagi! Suka ka nginum kopi?', translation: 'Good morning! Would you like some coffee?', speaker: 'elder' },
          { id: '2', indigenous: 'Iya, terima kasih banyak.', translation: 'Yes, thank you very much.', speaker: 'user' },
          { id: '3', indigenous: 'Apa khabar keluarga nuan?', translation: 'How is your family?', speaker: 'elder' },
          { id: '4', indigenous: 'Semua sihat, terima kasih.', translation: 'Everyone is healthy, thank you.', speaker: 'user' },
        ],
      },
      {
        id: 'meal-time',
        title: 'Meal Time',
        conversations: [
          { id: '1', indigenous: 'Kita makai tengah hari sama-sama.', translation: 'Let us have lunch together.', speaker: 'elder' },
          { id: '2', indigenous: 'Baik, saya tolong susun pinggan.', translation: 'Okay, I will help arrange the plates.', speaker: 'user' },
          { id: '3', indigenous: 'Ambik nasi, sayur, enggau ikan.', translation: 'Take rice, vegetables, and fish.', speaker: 'elder' },
          { id: '4', indigenous: 'Sedap amat masakan tok.', translation: 'This food is very delicious.', speaker: 'user' },
        ],
      },
    ],
  },
  {
    id: 'market',
    title: 'At Market',
    icon: 'basket',
    color: '#FF9800',
    cases: [
      {
        id: 'buy-vegetables',
        title: 'Buy Vegetables',
        conversations: [
          { id: '1', indigenous: 'Berapa ringgit sayur tu?', translation: 'How much are these vegetables?', speaker: 'user' },
          { id: '2', indigenous: 'Tiga ringgit sekilo.', translation: 'Three ringgit per kilo.', speaker: 'elder' },
          { id: '3', indigenous: 'Boleh kurang sikit?', translation: 'Can you reduce the price a bit?', speaker: 'user' },
          { id: '4', indigenous: 'Boleh, dua ringgit lima puluh.', translation: 'Okay, two ringgit fifty.', speaker: 'elder' },
        ],
      },
      {
        id: 'buy-fish',
        title: 'Buy Fish',
        conversations: [
          { id: '1', indigenous: 'Ikan tok segar ka?', translation: 'Is this fish fresh?', speaker: 'user' },
          { id: '2', indigenous: 'Sangat segar, ditangkap pagi tok.', translation: 'Very fresh, caught this morning.', speaker: 'elder' },
          { id: '3', indigenous: 'Aku ambik dua kilo.', translation: 'I will take two kilos.', speaker: 'user' },
          { id: '4', indigenous: 'Terima kasih, sila datang agi.', translation: 'Thank you, please come again.', speaker: 'elder' },
        ],
      },
    ],
  },
  {
    id: 'elders',
    title: 'Greeting Elders',
    icon: 'people',
    color: '#9C27B0',
    cases: [
      {
        id: 'visit-grandparents',
        title: 'Visit Grandparents',
        conversations: [
          { id: '1', indigenous: 'Selamat datai, lama kitak sik datai.', translation: 'Welcome, it has been a long time since you visited.', speaker: 'elder' },
          { id: '2', indigenous: 'Terima kasih. Apa khabar aki ngan ini?', translation: 'Thank you. How are grandpa and grandma?', speaker: 'user' },
          { id: '3', indigenous: 'Kami sihat, syukur.', translation: 'We are healthy, grateful.', speaker: 'elder' },
          { id: '4', indigenous: 'Bagus, saya gaga datai nuan hari tok.', translation: 'Great, I am happy to visit you today.', speaker: 'user' },
        ],
      },
      {
        id: 'ask-blessing',
        title: 'Ask for Blessing',
        conversations: [
          { id: '1', indigenous: 'Pak, minta doa sebelum aku berangkat.', translation: 'Sir, I ask for your prayer before I leave.', speaker: 'user' },
          { id: '2', indigenous: 'Semoga nuan selamat di perjalanan.', translation: 'May you be safe on your journey.', speaker: 'elder' },
          { id: '3', indigenous: 'Terima kasih atas nasihat nuan.', translation: 'Thank you for your advice.', speaker: 'user' },
          { id: '4', indigenous: 'Ingat adat enggau hormat selalu.', translation: 'Always remember tradition and respect.', speaker: 'elder' },
        ],
      },
    ],
  },
  {
    id: 'school',
    title: 'At School',
    icon: 'school',
    color: '#3F51B5',
    cases: [
      {
        id: 'introduce-yourself',
        title: 'Introduce Yourself',
        conversations: [
          { id: '1', indigenous: 'Nama aku Daniel. Nama nuan sapa?', translation: 'My name is Daniel. What is your name?', speaker: 'user' },
          { id: '2', indigenous: 'Nama aku Lina. Aku ari kampung seberang.', translation: 'My name is Lina. I am from the village across the river.', speaker: 'elder' },
          { id: '3', indigenous: 'Kelas kitak mulai pukul berapa?', translation: 'What time does your class begin?', speaker: 'user' },
          { id: '4', indigenous: 'Pukul lapan pagi, jangan lambat.', translation: 'At eight in the morning, do not be late.', speaker: 'elder' },
        ],
      },
      {
        id: 'ask-teacher-help',
        title: 'Ask Teacher Help',
        conversations: [
          { id: '1', indigenous: 'Cikgu, aku sik faham latihan tok.', translation: 'Teacher, I do not understand this exercise.', speaker: 'user' },
          { id: '2', indigenous: 'Baik, kita belajar langkah demi langkah.', translation: 'Okay, we will learn step by step.', speaker: 'elder' },
          { id: '3', indigenous: 'Terima kasih cikgu, aku cuba agi.', translation: 'Thank you teacher, I will try again.', speaker: 'user' },
          { id: '4', indigenous: 'Bagus, teruskan usaha nuan.', translation: 'Good, keep up your effort.', speaker: 'elder' },
        ],
      },
    ],
  },
  {
    id: 'clinic',
    title: 'At Clinic',
    icon: 'medkit',
    color: '#F44336',
    cases: [
      {
        id: 'register-counter',
        title: 'Register Counter',
        conversations: [
          { id: '1', indigenous: 'Aku datang berubat, di sini ka daftar?', translation: 'I came for treatment, do I register here?', speaker: 'user' },
          { id: '2', indigenous: 'Iya, sila isi borang tok.', translation: 'Yes, please fill this form.', speaker: 'elder' },
          { id: '3', indigenous: 'Bilik doktor nombor berapa?', translation: 'What is the doctor room number?', speaker: 'user' },
          { id: '4', indigenous: 'Nombor tiga, tunggu giliran.', translation: 'Number three, wait for your turn.', speaker: 'elder' },
        ],
      },
      {
        id: 'describe-symptom',
        title: 'Describe Symptom',
        conversations: [
          { id: '1', indigenous: 'Sejak semalam aku demam enggau batuk.', translation: 'Since yesterday I have fever and cough.', speaker: 'user' },
          { id: '2', indigenous: 'Baik, aku periksa suhu nuan dulu.', translation: 'Okay, I will check your temperature first.', speaker: 'elder' },
          { id: '3', indigenous: 'Perlu ubat berapa kali sehari?', translation: 'How many times per day should I take medicine?', speaker: 'user' },
          { id: '4', indigenous: 'Tiga kali selepas makan.', translation: 'Three times after meals.', speaker: 'elder' },
        ],
      },
    ],
  },
  {
    id: 'festival',
    title: 'Festival',
    icon: 'musical-notes',
    color: '#E91E63',
    cases: [
      {
        id: 'festival-prep',
        title: 'Festival Preparation',
        conversations: [
          { id: '1', indigenous: 'Gawai Dayak sudah dekat.', translation: 'Gawai Dayak is near.', speaker: 'elder' },
          { id: '2', indigenous: 'Mari kita siap rumah panjang.', translation: 'Let us prepare the longhouse.', speaker: 'user' },
          { id: '3', indigenous: 'Jangan lupa penganan tradisional.', translation: 'Do not forget traditional delicacies.', speaker: 'elder' },
          { id: '4', indigenous: 'Baik, aku bawa kuih dari rumah.', translation: 'Okay, I will bring cakes from home.', speaker: 'user' },
        ],
      },
      {
        id: 'festival-greeting',
        title: 'Festival Greeting',
        conversations: [
          { id: '1', indigenous: 'Selamat Gawai, gayu guru gerai nyamai.', translation: 'Happy Gawai, long life and prosperity.', speaker: 'elder' },
          { id: '2', indigenous: 'Selamat Gawai! Semoga tahun tok lebih manah.', translation: 'Happy Gawai! May this year be better.', speaker: 'user' },
          { id: '3', indigenous: 'Mari kita menari bersama.', translation: 'Let us dance together.', speaker: 'elder' },
          { id: '4', indigenous: 'Iya, aku ikut menari.', translation: 'Yes, I will join the dance.', speaker: 'user' },
        ],
      },
    ],
  },
];

export default function LivingLanguageScreen() {
  const route = useRoute();
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showTranslation, setShowTranslation] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [playingAudio, setPlayingAudio] = useState(null);

  // Initialize audio
  useEffect(() => {
    (async () => {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
      });
    })();

    return () => {
      Speech.stop();
    };
  }, []);

  useEffect(() => {
    const routeKey = route.params?.scenario;
    if (!routeKey) {
      return;
    }

    const normalized = routeKey === 'tamu' ? 'market' : routeKey;
    const found = SCENARIOS.find((item) => item.id === normalized);
    if (found) {
      setSelectedScenario(found);
      setSelectedCase(found.cases[0]);
      setCurrentStep(0);
    }
  }, [route.params]);

  const activeConversations = useMemo(() => selectedCase?.conversations || [], [selectedCase]);

  const handleScenarioSelect = (scenario) => {
    console.log('🎯 Scenario selected - Sound: tap');
    setSelectedScenario(scenario);
    setSelectedCase(scenario.cases[0]);
    setCurrentStep(0);
    setPlayingAudio(null);
    Speech.stop();
  };

  const handleBack = () => {
    setSelectedScenario(null);
    setSelectedCase(null);
    setCurrentStep(0);
    setPlayingAudio(null);
    Speech.stop();
  };

  const handleSwitchScenario = (scenario) => {
    console.log('🔄 Switching scenario - Sound: swoosh');
    setSelectedScenario(scenario);
    setSelectedCase(scenario.cases[0]);
    setCurrentStep(0);
    setPlayingAudio(null);
    Speech.stop();
  };

  const handleSwitchCase = (caseItem) => {
    setSelectedCase(caseItem);
    setCurrentStep(0);
    setPlayingAudio(null);
    Speech.stop();
  };

  const handlePlayAudio = async (conversationId, text) => {
    try {
      if (!text) {
        return;
      }

      if (playingAudio === conversationId) {
        Speech.stop();
        setPlayingAudio(null);
        return;
      }

      console.log('🔊 Playing audio - Speech');
      setPlayingAudio(conversationId);
      Speech.stop();
      Speech.speak(text, {
        language: 'ms-MY',
        rate: 0.9,
        pitch: 1,
        onDone: () => {
          setPlayingAudio(null);
          console.log('✅ Audio finished');
        },
        onStopped: () => {
          setPlayingAudio(null);
        },
        onError: () => {
          setPlayingAudio(null);
          Alert.alert('Audio Error', 'Could not play this sentence.');
        },
      });
    } catch (error) {
      console.log('Audio playback failed:', error);
      Alert.alert('Audio Error', 'Playback failed. Please try again.');
      setPlayingAudio(null);
    }
  };

  const handlePlayCase = () => {
    if (!activeConversations.length) {
      return;
    }

    const lines = activeConversations.map((item) => item.indigenous).join(' . ');
    setPlayingAudio('case-all');
    Speech.stop();
    Speech.speak(lines, {
      language: 'ms-MY',
      rate: 0.9,
      onDone: () => {
        setPlayingAudio(null);
      },
      onStopped: () => setPlayingAudio(null),
      onError: () => {
        setPlayingAudio(null);
        Alert.alert('Audio Error', 'Could not play this case audio.');
      },
    });
  };

  const handleNext = () => {
    if (activeConversations.length && currentStep < activeConversations.length - 1) {
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
          {item.cases?.length || 0} cases
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
              onPress={() => handlePlayAudio(conversation.id, conversation.indigenous)}
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
              Select a scenario, then choose a case and press play to hear each sentence.
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
            {selectedCase?.title || 'Case'} • {currentStep + 1} / {activeConversations.length || 1}
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

      {/* Case Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.caseSelectorContainer}
        contentContainerStyle={styles.scenarioSelectorContent}
      >
        {(selectedScenario.cases || []).map((caseItem) => (
          <TouchableOpacity
            key={caseItem.id}
            style={[
              styles.caseSelectorButton,
              selectedCase?.id === caseItem.id && styles.caseSelectorActive,
              { borderColor: selectedScenario.color },
            ]}
            onPress={() => handleSwitchCase(caseItem)}
          >
            <Text
              style={[
                styles.caseSelectorText,
                selectedCase?.id === caseItem.id && styles.caseSelectorTextActive,
              ]}
              numberOfLines={1}
            >
              {caseItem.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.casePlayRow}>
        <TouchableOpacity style={styles.casePlayButton} onPress={handlePlayCase}>
          <Ionicons
            name={playingAudio === 'case-all' ? 'pause-circle' : 'play-circle'}
            size={22}
            color={COLORS.surface}
          />
          <Text style={styles.casePlayText}>Play Full Case</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.conversationContent} showsVerticalScrollIndicator={false}>
        <View style={styles.conversationList}>
          {activeConversations.map((conv, index) => 
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
                currentStep === activeConversations.length - 1 && styles.disabledButton,
              ]}
              onPress={handleNext}
              disabled={currentStep === activeConversations.length - 1}
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
  caseSelectorContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  caseSelectorButton: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: SPACING.m,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    marginRight: SPACING.s,
  },
  caseSelectorActive: {
    backgroundColor: COLORS.secondary + '20',
    borderWidth: 2,
  },
  caseSelectorText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    maxWidth: 140,
  },
  caseSelectorTextActive: {
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  casePlayRow: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
  },
  casePlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.s,
    backgroundColor: COLORS.primary,
    borderRadius: SPACING.m,
    paddingVertical: SPACING.s,
    ...SHADOWS.small,
  },
  casePlayText: {
    color: COLORS.surface,
    fontWeight: '700',
    fontSize: 13,
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
