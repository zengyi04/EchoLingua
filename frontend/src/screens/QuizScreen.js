import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { quizQuestions } from '../data/mockData';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function QuizScreen({ navigation }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;

  const handleAnswer = (option) => {
    setSelectedOption(option);
    
    // Slight delay to show selection
    setTimeout(() => {
        const isCorrect = option === currentQuestion.correctAnswer;
        
        if (isCorrect) {
          setScore(prev => prev + 1);
        } else {
             Alert.alert("Oops!", `Correct answer: ${currentQuestion.correctAnswer}`);
        }

        const nextQuestion = currentQuestionIndex + 1;
        if (nextQuestion < quizQuestions.length) {
          setCurrentQuestionIndex(nextQuestion);
          setSelectedOption(null);
        } else {
          setQuizFinished(true);
        }
    }, 500);
  };

  const restartQuiz = () => {
    setScore(0);
    setCurrentQuestionIndex(0);
    setQuizFinished(false);
    setSelectedOption(null);
  };

  if (quizFinished) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultCard}>
          <Ionicons name="trophy" size={80} color={COLORS.accent} />
          <Text style={styles.finishTitle}>Quiz Complete!</Text>
          <Text style={styles.finalScore}>{score} / {quizQuestions.length}</Text>
          <Text style={styles.feedbackText}>
             {score === quizQuestions.length ? "Perfect Score! You're a pro!" : "Great effort! Keep learning."}
          </Text>
          
          <TouchableOpacity style={styles.primaryButton} onPress={restartQuiz}>
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.secondaryButton, { marginTop: SPACING.m }]} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header / Progress */}
      <View style={styles.header}>
        <View style={styles.progressBarBg}>
           <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>Question {currentQuestionIndex + 1}/{quizQuestions.length}</Text>
      </View>

      {/* Question Card */}
      <View style={styles.card}>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
        
        <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOption === option;
              return (
                  <TouchableOpacity 
                    key={index} 
                    style={[
                        styles.optionButton, 
                        isSelected && styles.optionSelected
                    ]} 
                    onPress={() => handleAnswer(option)}
                    disabled={selectedOption !== null}
                  >
                    <Text style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected
                    ]}>{option}</Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color={COLORS.surface} />}
                  </TouchableOpacity>
              );
            })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.l,
  },
  header: {
    marginBottom: SPACING.xl,
    marginTop: SPACING.m,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: SPACING.s,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'right',
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  card: {
    flex: 1,
    padding: SPACING.l,
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  optionsContainer: {
    gap: SPACING.m,
  },
  optionButton: {
    backgroundColor: COLORS.surface,
    padding: SPACING.l,
    borderRadius: SPACING.m,
    borderWidth: 2,
    borderColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.small,
  },
  optionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: COLORS.surface,
    fontWeight: 'bold',
  },
  resultCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  finishTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.l,
  },
  finalScore: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.primary,
    marginVertical: SPACING.m,
  },
  feedbackText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.xl,
    borderRadius: SPACING.m,
    width: '100%',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  primaryButtonText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    padding: SPACING.m,
  },
  secondaryButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});