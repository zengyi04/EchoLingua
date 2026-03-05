// Gamification Service
// Manages points, badges, achievements, and rewards

import AsyncStorage from '@react-native-async-storage/async-storage';

const GAMIFICATION_KEY = 'gamificationData';
const BADGES_KEY = 'userBadges';
const REWARDS_KEY = 'userRewards';

// Badge Definitions
export const BADGES = {
  FIRST_STEPS: {
    id: 'first_steps',
    name: 'First Steps',
    description: 'Complete your first lesson',
    icon: '🌟',
    xp: 50,
  },
  WORD_MASTER: {
    id: 'word_master',
    name: 'Word Master',
    description: 'Learn 50 vocabulary words',
    icon: '📚',
    xp: 200,
  },
  QUIZ_CHAMPION: {
    id: 'quiz_champion',
    name: 'Quiz Champion',
    description: 'Score 100% on any quiz',
    icon: '🏆',
    xp: 300,
  },
  PRONUNCIATION_PRO: {
    id: 'pronunciation_pro',
    name: 'Pronunciation Pro',
    description: 'Achieve 90% pronunciation accuracy',
    icon: '🎤',
    xp: 250,
  },
  STORY_TELLER: {
    id: 'story_teller',
    name: 'Story Teller',
    description: 'Read 10 stories',
    icon: '📖',
    xp: 150,
  },
  STREAK_MASTER: {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Maintain a 7-day learning streak',
    icon: '🔥',
    xp: 400,
  },
  RECORDING_ARTIST: {
    id: 'recording_artist',
    name: 'Recording Artist',
    description: 'Make 20 recordings',
    icon: '🎙️',
    xp: 180,
  },
  LANGUAGE_GUARDIAN: {
    id: 'language_guardian',
    name: 'Language Guardian',
    description: 'Complete all learning levels',
    icon: '🛡️',
    xp: 1000,
  },
  COMMUNITY_STAR: {
    id: 'community_star',
    name: 'Community Star',
    description: 'Share 5 stories with the community',
    icon: '⭐',
    xp: 220,
  },
  CULTURE_EXPLORER: {
    id: 'culture_explorer',
    name: 'Culture Explorer',
    description: 'Learn about 3 different festivals',
    icon: '🎉',
    xp: 160,
  },
  VOCABULARY_MASTER: {
    id: 'vocabulary_master',
    name: 'Vocabulary Master',
    description: 'Learn 100 words',
    icon: '📝',
    xp: 500,
  },
  QUIZ_EXPERT: {
    id: 'quiz_expert',
    name: 'Quiz Expert',
    description: 'Complete 20 quizzes',
    icon: '🎯',
    xp: 350,
  },
};

// Reward Tiers
export const REWARD_TIERS = [
  {
    level: 'Novice',
    minXP: 0,
    maxXP: 999,
    color: '#A8DADC',
    rewards: ['Basic learning materials', 'Starter vocabulary pack'],
  },
  {
    level: 'Beginner',
    minXP: 1000,
    maxXP: 2999,
    color: '#4ECDC4',
    rewards: ['Intermediate lessons', 'Story pack 1', 'Cultural insights'],
  },
  {
    level: 'Intermediate',
    minXP: 3000,
    maxXP: 4999,
    color: '#6366F1',
    rewards: ['Advanced lessons', 'Story pack 2', 'Festival vocabulary'],
  },
  {
    level: 'Advanced',
    minXP: 5000,
    maxXP: 9999,
    color: '#FF6B6B',
    rewards: ['Expert materials', 'Cultural archive access', 'Premium stories'],
  },
  {
    level: 'Expert',
    minXP: 10000,
    maxXP: 999999,
    color: '#FFD700',
    rewards: ['Master title', 'All content unlocked', 'Language Guardian badge'],
  },
];

/**
 * Get user gamification data
 * @returns {Promise<Object>} User gamification data
 */
export const getGamificationData = async () => {
  try {
    const stored = await AsyncStorage.getItem(GAMIFICATION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }

    // Initialize default data
    const defaultData = {
      totalXP: 0,
      level: 'Novice',
      points: 0,
      badges: [],
      rewards: [],
      streak: 0,
      lastActiveDate: new Date().toISOString(),
      stats: {
        lessonsCompleted: 0,
        quizzesCompleted: 0,
        storiesRead: 0,
        recordingsMade: 0,
        wordsLearned: 0,
        pronunciationAccuracy: 0,
      },
    };

    await AsyncStorage.setItem(GAMIFICATION_KEY, JSON.stringify(defaultData));
    return defaultData;
  } catch (error) {
    console.error('Get gamification data error:', error);
    return null;
  }
};

/**
 * Add XP points and check for level up
 * @param {number} xp - XP to add
 * @param {string} reason - Reason for XP gain
 * @returns {Promise<Object>} Result with level up status
 */
export const addXP = async (xp, reason = '') => {
  try {
    const data = await getGamificationData();
    const oldLevel = data.level;
    const newXP = data.totalXP + xp;

    // Determine new level
    let newLevel = oldLevel;
    for (const tier of REWARD_TIERS) {
      if (newXP >= tier.minXP && newXP <= tier.maxXP) {
        newLevel = tier.level;
        break;
      }
    }

    const leveledUp = newLevel !== oldLevel;

    data.totalXP = newXP;
    data.level = newLevel;
    data.points += xp;

    await AsyncStorage.setItem(GAMIFICATION_KEY, JSON.stringify(data));

    return {
      success: true,
      xpGained: xp,
      totalXP: newXP,
      newLevel,
      leveledUp,
      reason,
    };
  } catch (error) {
    console.error('Add XP error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Award badge to user
 * @param {string} badgeId - Badge ID to award
 * @returns {Promise<Object>} Award result
 */
export const awardBadge = async (badgeId) => {
  try {
    const data = await getGamificationData();

    // Check if badge already earned
    if (data.badges.includes(badgeId)) {
      return {
        success: false,
        message: 'Badge already earned',
      };
    }

    const badge = Object.values(BADGES).find((b) => b.id === badgeId);
    if (!badge) {
      return {
        success: false,
        message: 'Badge not found',
      };
    }

    data.badges.push(badgeId);
    await AsyncStorage.setItem(GAMIFICATION_KEY, JSON.stringify(data));

    // Add XP for badge
    await addXP(badge.xp, `Earned badge: ${badge.name}`);

    return {
      success: true,
      badge,
      message: `Congratulations! You earned the ${badge.name} badge!`,
    };
  } catch (error) {
    console.error('Award badge error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Check and award badges based on user stats
 * @param {Object} stats - User stats
 * @returns {Promise<Array>} Newly earned badges
 */
export const checkAndAwardBadges = async (stats) => {
  try {
    const newBadges = [];

    // Check for badge eligibility
    if (stats.lessonsCompleted >= 1) {
      const result = await awardBadge(BADGES.FIRST_STEPS.id);
      if (result.success) newBadges.push(result.badge);
    }

    if (stats.wordsLearned >= 50) {
      const result = await awardBadge(BADGES.WORD_MASTER.id);
      if (result.success) newBadges.push(result.badge);
    }

    if (stats.wordsLearned >= 100) {
      const result = await awardBadge(BADGES.VOCABULARY_MASTER.id);
      if (result.success) newBadges.push(result.badge);
    }

    if (stats.storiesRead >= 10) {
      const result = await awardBadge(BADGES.STORY_TELLER.id);
      if (result.success) newBadges.push(result.badge);
    }

    if (stats.recordingsMade >= 20) {
      const result = await awardBadge(BADGES.RECORDING_ARTIST.id);
      if (result.success) newBadges.push(result.badge);
    }

    if (stats.quizzesCompleted >= 20) {
      const result = await awardBadge(BADGES.QUIZ_EXPERT.id);
      if (result.success) newBadges.push(result.badge);
    }

    if (stats.pronunciationAccuracy >= 90) {
      const result = await awardBadge(BADGES.PRONUNCIATION_PRO.id);
      if (result.success) newBadges.push(result.badge);
    }

    return newBadges;
  } catch (error) {
    console.error('Check and award badges error:', error);
    return [];
  }
};

/**
 * Update user stats and check for achievements
 * @param {Object} statsUpdate - Stats to update
 * @returns {Promise<Object>} Update result with new badges
 */
export const updateStats = async (statsUpdate) => {
  try {
    const data = await getGamificationData();

    // Update stats
    data.stats = {
      ...data.stats,
      ...statsUpdate,
    };

    await AsyncStorage.setItem(GAMIFICATION_KEY, JSON.stringify(data));

    // Check for new badges
    const newBadges = await checkAndAwardBadges(data.stats);

    return {
      success: true,
      stats: data.stats,
      newBadges,
    };
  } catch (error) {
    console.error('Update stats error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get user's earned badges
 * @returns {Promise<Array>} Array of badge objects
 */
export const getUserBadges = async () => {
  try {
    const data = await getGamificationData();
    return data.badges.map((badgeId) => {
      return Object.values(BADGES).find((b) => b.id === badgeId);
    }).filter(Boolean);
  } catch (error) {
    console.error('Get user badges error:', error);
    return [];
  }
};

/**
 * Get available rewards for user's level
 * @returns {Promise<Array>} Array of rewards
 */
export const getAvailableRewards = async () => {
  try {
    const data = await getGamificationData();
    const tier = REWARD_TIERS.find((t) => t.level === data.level);
    return tier ? tier.rewards : [];
  } catch (error) {
    console.error('Get available rewards error:', error);
    return [];
  }
};

/**
 * Update daily streak
 * @returns {Promise<Object>} Streak update result
 */
export const updateStreak = async () => {
  try {
    const data = await getGamificationData();
    const today = new Date().toDateString();
    const lastActive = new Date(data.lastActiveDate).toDateString();

    if (lastActive === today) {
      return {
        success: true,
        streak: data.streak,
        message: 'Already logged in today',
      };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    let newStreak = data.streak;
    if (lastActive === yesterdayStr) {
      // Continuing streak
      newStreak += 1;
    } else {
      // Streak broken
      newStreak = 1;
    }

    data.streak = newStreak;
    data.lastActiveDate = new Date().toISOString();

    await AsyncStorage.setItem(GAMIFICATION_KEY, JSON.stringify(data));

    // Award streak badge if applicable
    if (newStreak >= 7) {
      await awardBadge(BADGES.STREAK_MASTER.id);
    }

    // Award XP for daily login
    await addXP(10, 'Daily login');

    return {
      success: true,
      streak: newStreak,
      message: `${newStreak} day streak!`,
    };
  } catch (error) {
    console.error('Update streak error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get leaderboard (mock implementation)
 * @returns {Promise<Array>} Array of leaderboard entries
 */
export const getLeaderboard = async () => {
  // In a real app, this would fetch from a server
  return [
    { rank: 1, username: 'LanguageMaster123', xp: 15000, level: 'Expert' },
    { rank: 2, username: 'BorneoNative', xp: 12000, level: 'Expert' },
    { rank: 3, username: 'CulturalLearner', xp: 9500, level: 'Advanced' },
    { rank: 4, username: 'YouYou', xp: 5200, level: 'Advanced' },
    { rank: 5, username: 'NewbieLearner', xp: 3800, level: 'Intermediate' },
  ];
};

export default {
  getGamificationData,
  addXP,
  awardBadge,
  checkAndAwardBadges,
  updateStats,
  getUserBadges,
  getAvailableRewards,
  updateStreak,
  getLeaderboard,
  BADGES,
  REWARD_TIERS,
};
