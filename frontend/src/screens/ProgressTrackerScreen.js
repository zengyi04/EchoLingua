import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function ProgressTrackerScreen({ navigation }) {
  const [progressData, setProgressData] = useState({
    vocabularyLearned: 0,
    totalVocabulary: 500,
    quizzesTaken: 0,
    quizzesScore: 0,
    pronunciationAccuracy: 0,
    pronunciationAttempts: 0,
    dailyStreak: 0,
    longestStreak: 0,
    totalLearningTime: 0,
    storiesRead: 0,
    recordingsMade: 0,
    level: 'Beginner',
    xp: 0,
    nextLevelXP: 1000,
  });

  const [weeklyActivity, setWeeklyActivity] = useState([
    { day: 'Mon', active: true, xp: 120 },
    { day: 'Tue', active: true, xp: 85 },
    { day: 'Wed', active: false, xp: 0 },
    { day: 'Thu', active: true, xp: 150 },
    { day: 'Fri', active: true, xp: 95 },
    { day: 'Sat', active: false, xp: 0 },
    { day: 'Sun', active: true, xp: 110 },
  ]);

  const [achievements, setAchievements] = useState([
    { id: '1', title: 'First Steps', description: 'Complete your first lesson', unlocked: true, icon: 'star' },
    { id: '2', title: 'Word Master', description: 'Learn 50 vocabulary words', unlocked: true, icon: 'book' },
    { id: '3', title: 'Quiz Champion', description: 'Score 100% on a quiz', unlocked: false, icon: 'trophy' },
    { id: '4', title: 'Pronunciation Pro', description: 'Achieve 90% pronunciation accuracy', unlocked: false, icon: 'mic' },
    { id: '5', title: 'Story Teller', description: 'Read 10 stories', unlocked: true, icon: 'book-open' },
    { id: '6', title: 'Streak Master', description: 'Maintain a 7-day streak', unlocked: false, icon: 'flame' },
    { id: '7', title: 'Recording Artist', description: 'Make 20 recordings', unlocked: true, icon: 'microphone' },
    { id: '8', title: 'Language Guardian', description: 'Complete all levels', unlocked: false, icon: 'shield' },
  ]);

  const [selectedTab, setSelectedTab] = useState('overview'); // overview, achievements, stats

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      // Load quiz results
      const quizResults = await AsyncStorage.getItem('quizResults');
      const scenarioScores = await AsyncStorage.getItem('scenarioScores');
      const userProfile = await AsyncStorage.getItem('userProfile');
      const lastActive = await AsyncStorage.getItem('lastActiveDate');

      let vocabCount = 0;
      let totalQuizzes = 0;
      let totalScore = 0;
      let pronunciationScore = 0;
      let pronunciationCount = 0;
      let storiesCount = 0;
      let recordingsCount = 0;
      let totalXP = 0;

      if (quizResults) {
        const results = JSON.parse(quizResults);
        totalQuizzes = results.length;
        results.forEach((result) => {
          totalScore += result.score || 0;
          vocabCount += result.correctAnswers || 0;
          totalXP += result.score * 10;
        });
      }

      if (scenarioScores) {
        const scores = JSON.parse(scenarioScores);
        Object.values(scores).forEach((scoreData) => {
          if (scoreData.pronunciation) {
            pronunciationScore += scoreData.pronunciation;
            pronunciationCount++;
          }
          recordingsCount++;
          totalXP += scoreData.overall * 5;
        });
      }

      // Calculate daily streak
      const today = new Date().toDateString();
      let streak = 1;
      let longestStreak = 1;

      if (lastActive && lastActive !== today) {
        const lastDate = new Date(lastActive);
        const todayDate = new Date(today);
        const diffTime = Math.abs(todayDate - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          const storedStreak = await AsyncStorage.getItem('dailyStreak');
          streak = storedStreak ? parseInt(storedStreak) + 1 : 1;
        } else {
          streak = 1;
        }
      }

      await AsyncStorage.setItem('lastActiveDate', today);
      await AsyncStorage.setItem('dailyStreak', streak.toString());

      const storedLongestStreak = await AsyncStorage.getItem('longestStreak');
      longestStreak = storedLongestStreak ? Math.max(parseInt(storedLongestStreak), streak) : streak;
      await AsyncStorage.setItem('longestStreak', longestStreak.toString());

      // Determine level based on XP
      let level = 'Beginner';
      let nextLevelXP = 1000;
      if (totalXP >= 5000) {
        level = 'Expert';
        nextLevelXP = 10000;
      } else if (totalXP >= 3000) {
        level = 'Advanced';
        nextLevelXP = 5000;
      } else if (totalXP >= 1000) {
        level = 'Intermediate';
        nextLevelXP = 3000;
      }

      const avgPronunciation = pronunciationCount > 0
        ? Math.round((pronunciationScore / pronunciationCount) * 100) / 100
        : 0;

      setProgressData({
        vocabularyLearned: vocabCount,
        totalVocabulary: 500,
        quizzesTaken: totalQuizzes,
        quizzesScore: totalQuizzes > 0 ? Math.round(totalScore / totalQuizzes) : 0,
        pronunciationAccuracy: avgPronunciation,
        pronunciationAttempts: pronunciationCount,
        dailyStreak: streak,
        longestStreak: longestStreak,
        totalLearningTime: Math.round(totalXP / 10), // rough estimate
        storiesRead: storiesCount,
        recordingsMade: recordingsCount,
        level: level,
        xp: totalXP,
        nextLevelXP: nextLevelXP,
      });

      // Update achievements based on progress
      const updatedAchievements = achievements.map((achievement) => {
        if (achievement.id === '3' && totalQuizzes > 0) {
          // Check if user scored 100% on any quiz
          const perfectScore = quizResults && JSON.parse(quizResults).some(r => r.score === 100);
          return { ...achievement, unlocked: perfectScore };
        }
        if (achievement.id === '4' && avgPronunciation >= 90) {
          return { ...achievement, unlocked: true };
        }
        if (achievement.id === '6' && streak >= 7) {
          return { ...achievement, unlocked: true };
        }
        if (achievement.id === '7' && recordingsCount >= 20) {
          return { ...achievement, unlocked: true };
        }
        return achievement;
      });
      setAchievements(updatedAchievements);
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  const getProgressPercentage = (current, total) => {
    return Math.min(Math.round((current / total) * 100), 100);
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Expert':
        return '#FFD700';
      case 'Advanced':
        return '#FF6B6B';
      case 'Intermediate':
        return '#4ECDC4';
      default:
        return COLORS.primary;
    }
  };

  const renderOverviewTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Level & XP Card */}
      <View style={styles.card}>
        <View style={styles.levelHeader}>
          <View>
            <Text style={styles.levelLabel}>Current Level</Text>
            <Text style={[styles.levelText, { color: getLevelColor(progressData.level) }]}>
              {progressData.level}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="star-circle"
            size={48}
            color={getLevelColor(progressData.level)}
          />
        </View>

        <View style={styles.xpProgressContainer}>
          <View style={styles.xpBar}>
            <View
              style={[
                styles.xpBarFill,
                {
                  width: `${getProgressPercentage(progressData.xp, progressData.nextLevelXP)}%`,
                  backgroundColor: getLevelColor(progressData.level),
                },
              ]}
            />
          </View>
          <Text style={styles.xpText}>
            {progressData.xp} / {progressData.nextLevelXP} XP
          </Text>
        </View>
      </View>

      {/* Daily Streak Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="flame" size={24} color="#FF6B35" />
          <Text style={styles.cardTitle}>Daily Streak</Text>
        </View>
        <View style={styles.streakContainer}>
          <View style={styles.streakItem}>
            <Text style={styles.streakNumber}>{progressData.dailyStreak}</Text>
            <Text style={styles.streakLabel}>Current</Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakItem}>
            <Text style={styles.streakNumber}>{progressData.longestStreak}</Text>
            <Text style={styles.streakLabel}>Longest</Text>
          </View>
        </View>

        {/* Weekly Activity */}
        <Text style={styles.sectionLabel}>This Week</Text>
        <View style={styles.weeklyActivityContainer}>
          {weeklyActivity.map((day) => (
            <View key={day.day} style={styles.dayContainer}>
              <View
                style={[
                  styles.dayCircle,
                  day.active && styles.dayCircleActive,
                  {
                    opacity: day.xp > 0 ? Math.min(day.xp / 150, 1) : 0.2,
                  },
                ]}
              />
              <Text style={styles.dayLabel}>{day.day}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="book" size={28} color={COLORS.primary} />
          <Text style={styles.statNumber}>{progressData.vocabularyLearned}</Text>
          <Text style={styles.statLabel}>Words Learned</Text>
          <View style={styles.miniProgressBar}>
            <View
              style={[
                styles.miniProgressFill,
                {
                  width: `${getProgressPercentage(
                    progressData.vocabularyLearned,
                    progressData.totalVocabulary
                  )}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.statCard}>
          <FontAwesome5 name="clipboard-check" size={28} color="#4ECDC4" />
          <Text style={styles.statNumber}>{progressData.quizzesTaken}</Text>
          <Text style={styles.statLabel}>Quizzes Taken</Text>
          <Text style={styles.statSubtext}>Avg: {progressData.quizzesScore}%</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="mic" size={28} color="#FF6B6B" />
          <Text style={styles.statNumber}>{progressData.pronunciationAccuracy}%</Text>
          <Text style={styles.statLabel}>Pronunciation</Text>
          <Text style={styles.statSubtext}>{progressData.pronunciationAttempts} attempts</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="time" size={28} color="#FFD93D" />
          <Text style={styles.statNumber}>{progressData.totalLearningTime}</Text>
          <Text style={styles.statLabel}>Minutes</Text>
          <Text style={styles.statSubtext}>Total time</Text>
        </View>

        <View style={styles.statCard}>
          <FontAwesome5 name="book-open" size={28} color="#A8DADC" />
          <Text style={styles.statNumber}>{progressData.storiesRead}</Text>
          <Text style={styles.statLabel}>Stories Read</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="recording" size={28} color="#F4A261" />
          <Text style={styles.statNumber}>{progressData.recordingsMade}</Text>
          <Text style={styles.statLabel}>Recordings</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderAchievementsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.achievementsContainer}>
        {achievements.map((achievement) => (
          <View
            key={achievement.id}
            style={[styles.achievementCard, !achievement.unlocked && styles.achievementLocked]}
          >
            <View
              style={[
                styles.achievementIcon,
                { backgroundColor: achievement.unlocked ? COLORS.primary : '#E0E0E0' },
              ]}
            >
              <FontAwesome5
                name={achievement.icon}
                size={24}
                color={achievement.unlocked ? COLORS.surface : '#999'}
              />
            </View>
            <View style={styles.achievementContent}>
              <Text style={[styles.achievementTitle, !achievement.unlocked && styles.textLocked]}>
                {achievement.title}
              </Text>
              <Text style={[styles.achievementDescription, !achievement.unlocked && styles.textLocked]}>
                {achievement.description}
              </Text>
            </View>
            {achievement.unlocked && (
              <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderStatsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Detailed Statistics</Text>

        <View style={styles.detailedStatRow}>
          <Text style={styles.detailedStatLabel}>Vocabulary Progress</Text>
          <Text style={styles.detailedStatValue}>
            {progressData.vocabularyLearned} / {progressData.totalVocabulary}
          </Text>
        </View>

        <View style={styles.detailedStatRow}>
          <Text style={styles.detailedStatLabel}>Average Quiz Score</Text>
          <Text style={styles.detailedStatValue}>{progressData.quizzesScore}%</Text>
        </View>

        <View style={styles.detailedStatRow}>
          <Text style={styles.detailedStatLabel}>Pronunciation Accuracy</Text>
          <Text style={styles.detailedStatValue}>{progressData.pronunciationAccuracy}%</Text>
        </View>

        <View style={styles.detailedStatRow}>
          <Text style={styles.detailedStatLabel}>Current Streak</Text>
          <Text style={styles.detailedStatValue}>{progressData.dailyStreak} days</Text>
        </View>

        <View style={styles.detailedStatRow}>
          <Text style={styles.detailedStatLabel}>Longest Streak</Text>
          <Text style={styles.detailedStatValue}>{progressData.longestStreak} days</Text>
        </View>

        <View style={styles.detailedStatRow}>
          <Text style={styles.detailedStatLabel}>Total Learning Time</Text>
          <Text style={styles.detailedStatValue}>{progressData.totalLearningTime} min</Text>
        </View>

        <View style={styles.detailedStatRow}>
          <Text style={styles.detailedStatLabel}>Stories Read</Text>
          <Text style={styles.detailedStatValue}>{progressData.storiesRead}</Text>
        </View>

        <View style={styles.detailedStatRow}>
          <Text style={styles.detailedStatLabel}>Recordings Made</Text>
          <Text style={styles.detailedStatValue}>{progressData.recordingsMade}</Text>
        </View>

        <View style={styles.detailedStatRow}>
          <Text style={styles.detailedStatLabel}>Total XP</Text>
          <Text style={styles.detailedStatValue}>{progressData.xp}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Learning Insights</Text>
        <Text style={styles.insightText}>
          🎯 You're doing great! Keep up your {progressData.dailyStreak}-day streak!
        </Text>
        <Text style={styles.insightText}>
          📚 You've learned {getProgressPercentage(progressData.vocabularyLearned, progressData.totalVocabulary)}% of available vocabulary.
        </Text>
        <Text style={styles.insightText}>
          🎤 Your pronunciation accuracy is {progressData.pronunciationAccuracy}%. Keep practicing!
        </Text>
        <Text style={styles.insightText}>
          🏆 {achievements.filter((a) => a.unlocked).length} out of {achievements.length} achievements unlocked!
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Progress</Text>
        <TouchableOpacity onPress={() => loadProgressData()}>
          <Ionicons name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {[
          { key: 'overview', label: 'Overview', icon: 'bar-chart' },
          { key: 'achievements', label: 'Achievements', icon: 'trophy' },
          { key: 'stats', label: 'Stats', icon: 'stats-chart' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={selectedTab === tab.key ? COLORS.surface : COLORS.textSecondary}
            />
            <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {selectedTab === 'overview' && renderOverviewTab()}
        {selectedTab === 'achievements' && renderAchievementsTab()}
        {selectedTab === 'stats' && renderStatsTab()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    gap: SPACING.s,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.s,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    gap: SPACING.xs,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: SPACING.l,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...SHADOWS.small,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  levelLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  levelText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  xpProgressContainer: {
    marginTop: SPACING.s,
  },
  xpBar: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  xpText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
    gap: SPACING.s,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: SPACING.l,
  },
  streakItem: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  streakLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  streakDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.m,
  },
  weeklyActivityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E0E0',
    marginBottom: SPACING.xs,
  },
  dayCircleActive: {
    backgroundColor: COLORS.primary,
  },
  dayLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.m,
    marginBottom: SPACING.xl,
  },
  statCard: {
    width: (width - SPACING.l * 2 - SPACING.m) / 2,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: SPACING.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...SHADOWS.small,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.s,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  statSubtext: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  miniProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: SPACING.s,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  achievementsContainer: {
    marginBottom: SPACING.xl,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...SHADOWS.small,
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.m,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  achievementDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  textLocked: {
    color: '#999',
  },
  detailedStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  detailedStatLabel: {
    fontSize: 15,
    color: COLORS.text,
  },
  detailedStatValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  insightText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: SPACING.m,
  },
});
