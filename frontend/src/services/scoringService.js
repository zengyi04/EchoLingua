import AsyncStorage from '@react-native-async-storage/async-storage';

const QUIZ_RESULTS_KEY = '@echolingua_quiz_results';
const SCENARIO_RESULTS_KEY = '@echolingua_scenario_results';
const USER_PROFILE_KEY = '@echolingua_user_profile';

/**
 * Analyze recorded audio text for grammar, pronunciation, and vocabulary scores
 * Uses pattern matching and heuristics for realistic scoring
 */
export const analyzeRecording = (userText, expectedText, language = 'english') => {
  if (!userText || !expectedText) {
    return { grammar: 0, pronunciation: 0, vocabulary: 0, overall: 0 };
  }

  // Convert to lowercase for comparison
  const user = userText.toLowerCase().trim();
  const expected = expectedText.toLowerCase().trim();

  // 1. VOCABULARY SCORE (0-100)
  // Check word overlap between user response and expected text
  const userWords = user.split(/\s+/);
  const expectedWords = expected.split(/\s+/);
  const matchedWords = userWords.filter(word => 
    expectedWords.some(exp => exp.includes(word) || word.includes(exp))
  );
  const vocabularyScore = Math.min(100, Math.round((matchedWords.length / expectedWords.length) * 100) + 
    (userText.length > expectedText.length * 0.7 ? 10 : 0) // Bonus for substantial response
  );

  // 2. GRAMMAR SCORE (0-100)
  // Check for common grammar patterns and sentence structure
  let grammarScore = 50; // Base score
  
  // Penalize very short responses
  if (userText.length < 10) {
    grammarScore -= 20;
  }
  
  // Reward proper punctuation
  if (userText.includes('?') || userText.includes('.') || userText.includes('!')) {
    grammarScore += 15;
  }
  
  // Check word count alignment (penalize if too different)
  const wordCountDiff = Math.abs(userWords.length - expectedWords.length);
  if (wordCountDiff <= 3) {
    grammarScore += 20;
  } else if (wordCountDiff <= 6) {
    grammarScore += 10;
  } else {
    grammarScore -= 10;
  }

  // Reward if response is substantially similar (high vocabulary match)
  if (vocabularyScore > 70) {
    grammarScore += 25;
  }

  grammarScore = Math.max(0, Math.min(100, grammarScore));

  // 3. PRONUNCIATION SCORE (0-100)
  // Simulate based on text similarity and length
  let pronunciationScore = 55; // Base score

  // Check for text similarity (character-level similarity)
  const similarity = calculateStringSimilarity(user, expected);
  pronunciationScore += Math.round(similarity * 40);

  // Bonus if user response contains key words from expected
  const keyWords = expectedWords.filter(w => w.length > 3); // Words longer than 3 chars are key
  const keyWordMatches = userWords.filter(w => 
    keyWords.some(key => key.includes(w) || w.includes(key))
  );
  pronunciationScore += Math.round((keyWordMatches.length / Math.max(1, keyWords.length)) * 20);

  pronunciationScore = Math.max(0, Math.min(100, pronunciationScore));

  // 4. OVERALL SCORE
  const overall = Math.round((grammarScore + pronunciationScore + vocabularyScore) / 3);

  return {
    grammar: Math.max(0, Math.min(100, grammarScore)),
    pronunciation: Math.max(0, Math.min(100, pronunciationScore)),
    vocabulary: Math.max(0, Math.min(100, vocabularyScore)),
    overall: overall,
  };
};

/**
 * Calculate similarity between two strings (0-1)
 */
const calculateStringSimilarity = (str1, str2) => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
};

/**
 * Calculate edit distance (Levenshtein distance)
 */
const getEditDistance = (s1, s2) => {
  const m = s1.length;
  const n = s2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
};

/**
 * Save scenario practice result
 */
export const saveScenarioResult = async (result) => {
  try {
    const existing = await AsyncStorage.getItem(SCENARIO_RESULTS_KEY);
    const results = existing ? JSON.parse(existing) : [];
    
    const newResult = {
      id: Date.now().toString(),
      scenarioId: result.scenarioId,
      scenarioTitle: result.scenarioTitle,
      caseId: result.caseId,
      caseTitle: result.caseTitle,
      fromLanguage: result.fromLanguage,
      toLanguage: result.toLanguage,
      grammar: result.grammar || 0,
      pronunciation: result.pronunciation || 0,
      vocabulary: result.vocabulary || 0,
      overall: result.overall || 0,
      createdAt: new Date().toISOString(),
    };

    const updated = [newResult, ...results].slice(0, 200);
    await AsyncStorage.setItem(SCENARIO_RESULTS_KEY, JSON.stringify(updated));
    return newResult;
  } catch (error) {
    console.error('Failed to save scenario result:', error);
    return null;
  }
};

/**
 * Get all scenario practice results
 */
export const getScenarioResults = async () => {
  try {
    const results = await AsyncStorage.getItem(SCENARIO_RESULTS_KEY);
    return results ? JSON.parse(results) : [];
  } catch (error) {
    console.error('Failed to get scenario results:', error);
    return [];
  }
};

/**
 * Save quiz result with difficulty and language
 */
export const saveQuizResult = async (result) => {
  try {
    const existing = await AsyncStorage.getItem(QUIZ_RESULTS_KEY);
    const results = existing ? JSON.parse(existing) : [];

    const newResult = {
      id: Date.now().toString(),
      language: result.language,
      difficulty: result.difficulty, // 'easy', 'medium', 'hard'
      score: result.score,
      totalQuestions: result.totalQuestions,
      percentage: Math.round((result.score / result.totalQuestions) * 100),
      quizNumber: result.quizNumber || 1,
      createdAt: new Date().toISOString(),
    };

    const updated = [newResult, ...results].slice(0, 500);
    await AsyncStorage.setItem(QUIZ_RESULTS_KEY, JSON.stringify(updated));
    
    // Update user profile after saving quiz result
    await updateUserProfile();
    
    return newResult;
  } catch (error) {
    console.error('Failed to save quiz result:', error);
    return null;
  }
};

/**
 * Get all quiz results
 */
export const getQuizResults = async () => {
  try {
    const results = await AsyncStorage.getItem(QUIZ_RESULTS_KEY);
    return results ? JSON.parse(results) : [];
  } catch (error) {
    console.error('Failed to get quiz results:', error);
    return [];
  }
};

/**
 * Calculate user level based on quiz performance
 * Returns object with level, totalPoints, metadata
 */
export const calculateUserLevel = async () => {
  try {
    const quizResults = await getQuizResults();
    const scenarioResults = await getScenarioResults();

    if (quizResults.length === 0 && scenarioResults.length === 0) {
      return {
        level: 0,
        title: 'Novice',
        levelType: 'Novice',
        totalPoints: 0,
        badge: '🌱',
        quizzesCompleted: 0,
        scenariosCompleted: 0,
      };
    }

    let totalPoints = 0;
    const levelMap = {};

    // Process Quiz Results
    quizResults.forEach((result) => {
      const key = `${result.difficulty}_${result.quizNumber || 1}`;
      if (!levelMap[key]) {
        levelMap[key] = { attempts: 0, totalScore: 0 };
      }
      levelMap[key].attempts += 1;
      levelMap[key].totalScore += result.percentage;
      totalPoints += result.percentage * 0.5; // Quiz weight
    });

    // Process Scenario Results
    scenarioResults.forEach((result) => {
      totalPoints += result.overall * 0.3; // Scenario weight (lighter than quiz)
    });

    // Determine level tiers (based on >50% = more than half correct)
    const easyQuiz1 = levelMap['easy_1'];
    const easyQuiz2 = levelMap['easy_2'];
    const mediumQuiz1 = levelMap['medium_1'];
    const mediumQuiz2 = levelMap['medium_2'];
    const hardQuiz1 = levelMap['hard_1'];
    const hardQuiz2 = levelMap['hard_2'];

    // Level progression logic (>50% means more than half correct)
    let levelNumber = 0;
    let levelType = 'Novice';
    let badge = '🌱';

    // Easy Quiz 1: Beginner Level 1
    if (easyQuiz1 && (easyQuiz1.totalScore / easyQuiz1.attempts) > 50) {
      levelNumber = 1;
      levelType = 'Beginner Level 1';
      badge = '🌿';
    }

    // Easy Quiz 2: Beginner Level 2
    if (easyQuiz2 && (easyQuiz2.totalScore / easyQuiz2.attempts) > 50) {
      levelNumber = 2;
      levelType = 'Beginner Level 2';
      badge = '🌱';
    }

    // Medium Quiz 1: Intermediate Level 1
    if (mediumQuiz1 && (mediumQuiz1.totalScore / mediumQuiz1.attempts) > 50) {
      levelNumber = 3;
      levelType = 'Intermediate Level 1';
      badge = '🌳';
    }

    // Medium Quiz 2: Intermediate Level 2
    if (mediumQuiz2 && (mediumQuiz2.totalScore / mediumQuiz2.attempts) > 50) {
      levelNumber = 4;
      levelType = 'Intermediate Level 2';
      badge = '🌲';
    }

    // Hard Quiz 1: Advanced Level 1
    if (hardQuiz1 && (hardQuiz1.totalScore / hardQuiz1.attempts) > 50) {
      levelNumber = 5;
      levelType = 'Advanced Level 1';
      badge = '♻️';
    }

    // Hard Quiz 2: Advanced Level 2
    if (hardQuiz2 && (hardQuiz2.totalScore / hardQuiz2.attempts) > 50) {
      levelNumber = 6;
      levelType = 'Advanced Level 2';
      badge = '👑';
    }

    return {
      level: levelNumber,
      title: `Language Guardian (Lvl ${levelNumber})`,
      levelType: levelType,
      totalPoints: Math.round(totalPoints),
      badge: badge,
      quizzesCompleted: quizResults.length,
      scenariosCompleted: scenarioResults.length,
      levelMap: levelMap,
    };
  } catch (error) {
    console.error('Failed to calculate user level:', error);
    return {
      level: 0,
      title: 'Novice',
      levelType: 'Novice',
      totalPoints: 0,
      badge: '🌱',
      quizzesCompleted: 0,
      scenariosCompleted: 0,
    };
  }
};

/**
 * Update user profile with current metrics
 */
export const updateUserProfile = async () => {
  try {
    const levelData = await calculateUserLevel();
    const quizResults = await getQuizResults();
    const scenarioResults = await getScenarioResults();

    const profile = {
      ...levelData,
      recentQuizzes: quizResults.slice(0, 5),
      recentScenarios: scenarioResults.slice(0, 5),
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    return profile;
  } catch (error) {
    console.error('Failed to update user profile:', error);
    return null;
  }
};

/**
 * Get current user profile
 */
export const getUserProfile = async () => {
  try {
    const profile = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (profile) {
      return JSON.parse(profile);
    }
    // Generate initial profile if not exists
    return await calculateUserLevel();
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return null;
  }
};

/**
 * Get average score for specific difficulty
 */
export const getAverageScoreByDifficulty = async (difficulty) => {
  try {
    const results = await getQuizResults();
    const filtered = results.filter(r => r.difficulty === difficulty);
    
    if (filtered.length === 0) return 0;
    
    const total = filtered.reduce((sum, r) => sum + r.percentage, 0);
    return Math.round(total / filtered.length);
  } catch (error) {
    console.error('Failed to get average score:', error);
    return 0;
  }
};
