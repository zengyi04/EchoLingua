// AI Pronunciation Checker Service
// Uses Gemini API for pronunciation analysis

const GEMINI_API_KEY = 'AIzaSyA7sU_uB0fzrT-dRQmyfxmH0wNf_6ZKH5o';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Analyze pronunciation accuracy using AI
 * @param {string} base64Audio - Base64 encoded audio
 * @param {string} targetWord - The word/phrase user is trying to pronounce
 * @param {string} language - Target language (e.g., 'Kadazandusun', 'Iban')
 * @returns {Promise<Object>} Pronunciation analysis result
 */
export const checkPronunciation = async (base64Audio, targetWord, language = 'Kadazandusun') => {
  try {
    const systemContext = `You are a pronunciation expert for ${language}, an indigenous language of Borneo. 
Analyze the user's pronunciation and provide:
1. Accuracy score (0-100)
2. Specific feedback on what sounds were correct or incorrect
3. Suggestions for improvement
4. Phonetic breakdown if needed

Be encouraging and constructive.`;

    const userPrompt = `Analyze the pronunciation of "${targetWord}" in ${language}. 
The audio recording is provided. Please give:
- Accuracy score (0-100)
- What was pronounced correctly
- What needs improvement
- Specific tips for better pronunciation

Format your response as JSON:
{
  "accuracy": <number 0-100>,
  "correctAspects": ["<aspect1>", "<aspect2>"],
  "improvements": ["<tip1>", "<tip2>"],
  "overallFeedback": "<encouraging message>",
  "phoneticBreakdown": "<optional phonetic guide>"
}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemContext }],
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: userPrompt,
              },
              {
                inline_data: {
                  mime_type: 'audio/mp4',
                  data: base64Audio,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Try to parse JSON from response
    let analysis;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      // Fallback: generate structured response from text
      const accuracyMatch = aiResponse.match(/accuracy[:\s]+(\d+)/i);
      const accuracy = accuracyMatch ? parseInt(accuracyMatch[1]) : 75;

      analysis = {
        accuracy: accuracy,
        correctAspects: extractBulletPoints(aiResponse, 'correct|good|well'),
        improvements: extractBulletPoints(aiResponse, 'improve|better|practice|try'),
        overallFeedback: aiResponse.substring(0, 200) + '...',
        phoneticBreakdown: '',
      };
    }

    return {
      success: true,
      ...analysis,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Pronunciation check error:', error);
    return {
      success: false,
      error: error.message,
      accuracy: 0,
      correctAspects: [],
      improvements: ['Unable to analyze pronunciation. Please try again.'],
      overallFeedback: 'Sorry, we encountered an error analyzing your pronunciation.',
    };
  }
};

/**
 * Extract bullet points or list items from text
 * @param {string} text - Text to extract from
 * @param {string} keywords - Regex pattern for keywords
 * @returns {Array<string>} Extracted points
 */
const extractBulletPoints = (text, keywords) => {
  const points = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && new RegExp(keywords, 'i').test(trimmed)) {
      // Remove bullet points, numbers, etc.
      const cleaned = trimmed.replace(/^[-*•\d.)\s]+/, '').trim();
      if (cleaned.length > 10) {
        points.push(cleaned);
      }
    }
  }

  return points.slice(0, 3); // Return max 3 points
};

/**
 * Compare user audio with reference audio (if available)
 * @param {string} userAudioBase64 - User's recording
 * @param {string} referenceAudioBase64 - Reference recording
 * @param {string} targetWord - The word being pronounced
 * @returns {Promise<Object>} Comparison result
 */
export const comparePronunciation = async (userAudioBase64, referenceAudioBase64, targetWord) => {
  try {
    const systemContext = `You are a pronunciation comparison expert. 
Compare two audio recordings of the word "${targetWord}":
1. Reference pronunciation (correct)
2. User pronunciation (to be evaluated)

Provide detailed comparison focusing on:
- Tone accuracy
- Vowel sounds
- Consonant sounds
- Rhythm and stress
- Overall similarity`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemContext }],
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Compare these two pronunciations of "${targetWord}". First audio is the reference, second is the user's attempt.`,
              },
              {
                inline_data: {
                  mime_type: 'audio/mp4',
                  data: referenceAudioBase64,
                },
              },
              {
                inline_data: {
                  mime_type: 'audio/mp4',
                  data: userAudioBase64,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      success: true,
      comparison: aiResponse,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Pronunciation comparison error:', error);
    return {
      success: false,
      error: error.message,
      comparison: 'Unable to compare pronunciations.',
    };
  }
};

/**
 * Get pronunciation tips for a specific word
 * @param {string} word - Word to get tips for
 * @param {string} language - Language of the word
 * @returns {Promise<Object>} Pronunciation tips
 */
export const getPronunciationTips = async (word, language = 'Kadazandusun') => {
  try {
    const systemContext = `You are an expert teacher of ${language}, an indigenous language of Borneo. 
Provide clear, practical pronunciation guidance.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemContext }],
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `How do you pronounce "${word}" in ${language}? 
Provide:
1. Phonetic breakdown
2. Syllable emphasis
3. Common mistakes to avoid
4. Practice tips

Format as JSON:
{
  "phonetic": "<phonetic spelling>",
  "syllables": ["<syl1>", "<syl2>"],
  "emphasis": "<which syllable to stress>",
  "commonMistakes": ["<mistake1>", "<mistake2>"],
  "practiceTips": ["<tip1>", "<tip2>"]
}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON
    let tips;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        tips = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      tips = {
        phonetic: word,
        syllables: [word],
        emphasis: 'First syllable',
        commonMistakes: [],
        practiceTips: [aiResponse.substring(0, 200)],
      };
    }

    return {
      success: true,
      ...tips,
    };
  } catch (error) {
    console.error('Get pronunciation tips error:', error);
    return {
      success: false,
      error: error.message,
      phonetic: word,
      syllables: [],
      emphasis: '',
      commonMistakes: [],
      practiceTips: [],
    };
  }
};

export default {
  checkPronunciation,
  comparePronunciation,
  getPronunciationTips,
};
