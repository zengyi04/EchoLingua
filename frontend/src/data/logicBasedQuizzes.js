/**
 * LOGIC-BASED QUIZ SYSTEM
 * All questions test reasoning, patterns, problem-solving, and critical thinking
 * Progressive difficulty: Easy → Medium → Hard
 * Supports all 25 languages
 */

export const logicBasedQuizzes = {
  // ===== COMMON LOGIC PATTERNS (All Languages) =====
  common: {
    easy: {
      quiz1: [
        {
          question: 'If A is the opposite of B, and B is cold, what is A?',
          options: ['Cold', 'Hot', 'Warm'],
          correctAnswer: 'Hot'
        },
        {
          question: 'Morning comes before what?',
          options: ['Yesterday', 'Night', 'Afternoon'],
          correctAnswer: 'Afternoon'
        },
        {
          question: 'If you have 2 apples and add 1 more, how many do you have?',
          options: ['1', '2', '3'],
          correctAnswer: '3'
        },
        {
          question: 'Fish live in water, and birds live in...',
          options: ['Water', 'Sky', 'Land'],
          correctAnswer: 'Sky'
        },
        {
          question: 'Father is to son as mother is to...?',
          options: ['Father', 'Daughter', 'Brother'],
          correctAnswer: 'Daughter'
        }
      ],
      quiz2: [
        {
          question: 'What do you need to drink when thirsty?',
          options: ['Food', 'Water', 'Sleep'],
          correctAnswer: 'Water'
        },
        {
          question: 'Tree is to forest as house is to...?',
          options: ['Room', 'Village', 'Street'],
          correctAnswer: 'Village'
        },
        {
          question: 'If all birds have wings, does an eagle have wings?',
          options: ['Yes', 'No', 'Maybe'],
          correctAnswer: 'Yes'
        },
        {
          question: 'Sun is bright, moon is...?',
          options: ['Bright', 'Dim', 'Dark'],
          correctAnswer: 'Dim'
        },
        {
          question: 'Which is needed to live: house, food, or air?',
          options: ['House only', 'Food only', 'All three'],
          correctAnswer: 'All three'
        }
      ],
      quiz3: [
        {
          question: 'If fire is hot, ice is...?',
          options: ['Hot', 'Cold', 'Warm'],
          correctAnswer: 'Cold'
        },
        {
          question: 'Running is faster than...?',
          options: ['Flying', 'Walking', 'Swimming'],
          correctAnswer: 'Walking'
        },
        {
          question: 'A group of trees is called a...?',
          options: ['Park', 'Forest', 'Garden'],
          correctAnswer: 'Forest'
        },
        {
          question: 'If 5 > 3 and 3 > 1, then 5 > 1?',
          options: ['Yes', 'No', 'Unknown'],
          correctAnswer: 'Yes'
        },
        {
          question: 'Hand is part of arm, arm is part of...?',
          options: ['Head', 'Body', 'Leg'],
          correctAnswer: 'Body'
        }
      ],
      quiz4: [
        {
          question: 'What comes after Wednesday?',
          options: ['Monday', 'Thursday', 'Friday'],
          correctAnswer: 'Thursday'
        },
        {
          question: 'If all cats are animals, is a cat an animal?',
          options: ['Yes', 'No', 'Maybe'],
          correctAnswer: 'Yes'
        },
        {
          question: 'Silence is the opposite of...?',
          options: ['Music', 'Sound', 'Noise'],
          correctAnswer: 'Sound'
        },
        {
          question: 'Spring comes before what season?',
          options: ['Winter', 'Fall', 'Summer'],
          correctAnswer: 'Summer'
        },
        {
          question: 'A person has two eyes, a spider has...?',
          options: ['2 eyes', '4 eyes', '8 eyes'],
          correctAnswer: '8 eyes'
        }
      ],
      quiz5: [
        {
          question: 'If plants need water and sunlight, do all plants need both?',
          options: ['Yes', 'No', 'Only some'],
          correctAnswer: 'Yes'
        },
        {
          question: 'Yesterday, today, tomorrow - which has not happened yet?',
          options: ['Yesterday', 'Today', 'Tomorrow'],
          correctAnswer: 'Tomorrow'
        },
        {
          question: 'Root is to tree as foundation is to...?',
          options: ['Dirt', 'House', 'Ground'],
          correctAnswer: 'House'
        },
        {
          question: 'A begins with...',
          options: ['Z', 'A', 'M'],
          correctAnswer: 'A'
        },
        {
          question: 'If no birds are fish, but all birds have feathers, which is true?',
          options: ['Fish have feathers', 'Birds are not fish', 'All are fish'],
          correctAnswer: 'Birds are not fish'
        }
      ]
    },

    medium: {
      quiz1: [
        {
          question: 'Why do plants need sunlight?',
          options: ['To make food', 'To sleep', 'To grow slowly'],
          correctAnswer: 'To make food'
        },
        {
          question: 'If A > B and B > C, what is the relationship between A and C?',
          options: ['A < C', 'A > C', 'A = C'],
          correctAnswer: 'A > C'
        },
        {
          question: 'Tradition is passed down through...',
          options: ['Books', 'Generations', 'Technology'],
          correctAnswer: 'Generations'
        },
        {
          question: 'If every language has words, does English have words?',
          options: ['Yes', 'No', 'Maybe'],
          correctAnswer: 'Yes'
        },
        {
          question: 'Which is both a tool and can tell time: clock, hammer, or water?',
          options: ['Clock', 'Hammer', 'Water'],
          correctAnswer: 'Clock'
        }
      ],
      quiz2: [
        {
          question: 'How does language help human survival?',
          options: ['Provides shelter', 'Enables communication', 'Grows food'],
          correctAnswer: 'Enables communication'
        },
        {
          question: 'If cultural traditions strengthen community bonds, why preserve them?',
          options: ['For money', 'For identity and unity', 'For tourists'],
          correctAnswer: 'For identity and unity'
        },
        {
          question: 'Which takes longer: learning 1 language or 3 languages?',
          options: ['1 language', '3 languages', 'Equal time'],
          correctAnswer: '3 languages'
        },
        {
          question: 'What connects all spoken languages?',
          options: ['Words', 'Sound and meaning', 'Writing'],
          correctAnswer: 'Sound and meaning'
        },
        {
          question: 'If old knowledge is valuable and languages contain knowledge, then...',
          options: ['Old languages are valuable', 'Languages are worthless', 'Knowledge is old'],
          correctAnswer: 'Old languages are valuable'
        }
      ],
      quiz3: [
        {
          question: 'A story told repeatedly across generations is likely...',
          options: ['Fictional', 'Important to culture', 'Forgotten'],
          correctAnswer: 'Important to culture'
        },
        {
          question: 'Why do some languages disappear?',
          options: ['They are bad', 'Speakers adopt new languages', 'Grammar is wrong'],
          correctAnswer: 'Speakers adopt new languages'
        },
        {
          question: 'If A teaches B, and B teaches C, where does knowledge originate?',
          options: ['With C', 'With A', 'Unknown'],
          correctAnswer: 'With A'
        },
        {
          question: 'Comparing fast and slow growth, which lasts longer?',
          options: ['Fast growth', 'Slow growth', 'Same duration'],
          correctAnswer: 'Slow growth'
        },
        {
          question: 'What is more valuable: quantity of words or quality of meaning?',
          options: ['Quantity', 'Quality', 'Both equally'],
          correctAnswer: 'Both equally'
        }
      ],
      quiz4: [
        {
          question: 'If traditions define community identity, losing traditions means...',
          options: ['Stronger identity', 'Weaker identity', 'No change'],
          correctAnswer: 'Weaker identity'
        },
        {
          question: 'How do stories preserve history?',
          options: ['Through writing only', 'Through retelling', 'They cannot'],
          correctAnswer: 'Through retelling'
        },
        {
          question: 'Why should young people learn old languages?',
          options: ['To test teachers', 'To preserve heritage', 'No reason'],
          correctAnswer: 'To preserve heritage'
        },
        {
          question: 'If culture changes slowly, what remains constant?',
          options: ['Nothing', 'Core values', 'Everything'],
          correctAnswer: 'Core values'
        },
        {
          question: 'Which requires more effort: maintaining a tradition or abandoning it?',
          options: ['Maintaining', 'Abandoning', 'Equal effort'],
          correctAnswer: 'Maintaining'
        }
      ],
      quiz5: [
        {
          question: 'What problem arises if nobody learns indigenous languages?',
          options: ['More space', 'Knowledge loss', 'Better communication'],
          correctAnswer: 'Knowledge loss'
        },
        {
          question: 'If culture = identity + history + values, can losing language change culture?',
          options: ['No', 'Yes', 'Maybe'],
          correctAnswer: 'Yes'
        },
        {
          question: 'Between recording a language or forgetting it, which helps preservation?',
          options: ['Forgetting', 'Recording', 'Neither'],
          correctAnswer: 'Recording'
        },
        {
          question: 'Why do ancestors pass down stories to descendants?',
          options: ['Entertainment only', 'Teaching and wisdom', 'No reason'],
          correctAnswer: 'Teaching and wisdom'
        },
        {
          question: 'What makes a language endangered?',
          options: ['Few speakers, young people not learning', 'Too many speakers', 'Old words'],
          correctAnswer: 'Few speakers, young people not learning'
        }
      ]
    },

    hard: {
      quiz1: [
        {
          question: 'How do endangered languages reflect broader cultural vulnerability?',
          options: ['They do not', 'Show loss of cultural identity', 'Show growth'],
          correctAnswer: 'Show loss of cultural identity'
        },
        {
          question: 'If recording technology preserves language but people stop speaking it, what is lost?',
          options: ['Nothing', 'Living practice', 'Only grammar'],
          correctAnswer: 'Living practice'
        },
        {
          question: 'Why is intergenerational transmission essential for language survival?',
          options: ['Not essential', 'Creates continuity', 'Costs money'],
          correctAnswer: 'Creates continuity'
        },
        {
          question: 'What paradox exists in cultural globalization?',
          options: ['Connection isolates', 'Spreads unique cultures wildly', 'Homogenizes while connecting'],
          correctAnswer: 'Homogenizes while connecting'
        },
        {
          question: 'If knowledge = language + experience + application, is language essential to knowledge?',
          options: ['No', 'Yes, as foundation', 'Maybe'],
          correctAnswer: 'Yes, as foundation'
        }
      ],
      quiz2: [
        {
          question: 'How do local languages encode ecological knowledge unique to regions?',
          options: ['They do not', 'Through specific vocabulary', 'Through grammar only'],
          correctAnswer: 'Through specific vocabulary'
        },
        {
          question: 'What does language obsolescence indicate about societal change?',
          options: ['No change', 'Value shift away from tradition', 'Random occurrence'],
          correctAnswer: 'Value shift away from tradition'
        },
        {
          question: 'Why is documentation insufficient without living speakers?',
          options: ['Documentation is enough', 'Language evolves through use', 'Speakers are irrelevant'],
          correctAnswer: 'Language evolves through use'
        },
        {
          question: 'Between assimilation and preservation, which benefits cultural pluralism?',
          options: ['Assimilation', 'Preservation', 'Neither'],
          correctAnswer: 'Preservation'
        },
        {
          question: 'How do indigenous narratives differ from recorded history?',
          options: ['No difference', 'Include values and continuity', 'Are always false'],
          correctAnswer: 'Include values and continuity'
        }
      ],
      quiz3: [
        {
          question: 'If 10,000+ languages exist but only a few are dominant, what trends do you predict?',
          options: ['Diversity increases', 'Many languages endangered', 'No change'],
          correctAnswer: 'Many languages endangered'
        },
        {
          question: 'How can modern technology simultaneously threaten and help language preservation?',
          options: ['Only threatens', 'Enables documentation and global learning', 'No effect'],
          correctAnswer: 'Enables documentation and global learning'
        },
        {
          question: 'What is the relationship between linguistic diversity and biological diversity?',
          options: ['None', 'Both concentrated in biodiverse regions', 'Opposite'],
          correctAnswer: 'Both concentrated in biodiverse regions'
        },
        {
          question: 'Why do some argue that language preservation is a human rights issue?',
          options: ['It is not', 'Language = cultural self-determination', 'Cost reasons'],
          correctAnswer: 'Language = cultural self-determination'
        },
        {
          question: 'How does multilingualism in childhood affect cognitive development?',
          options: ['Harms it', 'Enhances mental flexibility', 'No effect'],
          correctAnswer: 'Enhances mental flexibility'
        }
      ],
      quiz4: [
        {
          question: 'If colonization disrupted indigenous languages, what structural changes followed?',
          options: ['None', 'Shift to colonial languages', 'Created new languages'],
          correctAnswer: 'Shift to colonial languages'
        },
        {
          question: 'What creates a linguistic tipping point where language death becomes inevitable?',
          options: ['Always reversible', 'Few speakers, no child learners', 'Random'],
          correctAnswer: 'Few speakers, no child learners'
        },
        {
          question: 'How do endangered languages inform linguistic theory about universal principles?',
          options: ['They do not', 'Through unique grammatical features', 'No relevance'],
          correctAnswer: 'Through unique grammatical features'
        },
        {
          question: 'Between government policy and community action, which more effectively preserves language?',
          options: ['Government only', 'Community-driven with policy support', 'Neither works'],
          correctAnswer: 'Community-driven with policy support'
        },
        {
          question: 'What role does language play in environmental stewardship knowledge?',
          options: ['No role', 'Encodes ecological wisdom', 'Harmful'],
          correctAnswer: 'Encodes ecological wisdom'
        }
      ],
      quiz5: [
        {
          question: 'How does linguistic relativity (Sapir-Whorf hypothesis) relate to cultural preservation?',
          options: ['Unrelated', 'Language shapes worldview, preserving language preserves perspective', 'Disproven'],
          correctAnswer: 'Language shapes worldview, preserving language preserves perspective'
        },
        {
          question: 'What is the long-term consequence if languages disappear faster than linguists document them?',
          options: ['Nothing', 'Irretrievable loss of human knowledge', 'Faster adaptation'],
          correctAnswer: 'Irretrievable loss of human knowledge'
        },
        {
          question: 'How can digital platforms revolutionize language documentation and teaching?',
          options: ['Cannot help', 'Enable global access and interactive learning', 'Harmful'],
          correctAnswer: 'Enable global access and interactive learning'
        },
        {
          question: 'Between revitalization and prevention of extinction, which is more effective?',
          options: ['Revitalization', 'Prevention (easier)', 'Equal'],
          correctAnswer: 'Prevention (easier)'
        },
        {
          question: 'Why is indigenous language preservation linked to sustainable development?',
          options: ['Not linked', 'Traditional knowledge validates sustainability', 'Irrelevant'],
          correctAnswer: 'Traditional knowledge validates sustainability'
        }
      ]
    }
  }
};

export default logicBasedQuizzes;
