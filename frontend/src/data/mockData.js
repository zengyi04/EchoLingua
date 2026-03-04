export const vocabularyList = [
  { id: 1, original: 'Rumah', translated: 'House', pronunciation: 'roo-mah', image: 'house.png' },
  { id: 2, original: 'Makan', translated: 'Eat', pronunciation: 'mah-kahn', image: 'eat.png' },
  { id: 3, original: 'Selamat Pagi', translated: 'Good Morning', pronunciation: 'suh-lah-mat pah-gee', image: 'morning.png' },
];

export const stories = [
  {
    id: 1,
    title: 'The Legend of Mount Kinabalu',
    originalText: 'Once upon a time, there was a dragon atop the mountain...',
    translatedText: 'Pada zaman dahulu, terdapat seekor naga di puncak gunung...',
    audio: 'legend.mp3',
    pages: [
        { text: "Long ago, a powerful dragon guarded the summit.", translation: "Dahulu kala, seekor naga sakti menjaga puncak itu." },
        { text: "Villagers feared the dragon's wrath.", translation: "Penduduk desa takut akan kemarahan naga itu." }
    ]
  },
  {
    id: 2,
    title: 'Puteri Santubong & Sejinjang',
    originalText: 'Two beautiful princesses lived in the sky...',
    translatedText: 'Dua puteri jelita tinggal di kayangan...',
    audio: 'princess.mp3',
    pages: [
        { text: "Puteri Santubong was an expert weaver.", translation: "Puteri Santubong pakar menenun kain." },
        { text: "Puteri Sejinjang was an expert at pounding rice.", translation: "Puteri Sejinjang pakar menumbuk padi." }
    ]
  },
  {
    id: 3,
    title: 'The Crocodile of the River',
    originalText: 'Bujang Senang was a fearsome warrior...',
    translatedText: 'Bujang Senang adalah seorang pahlawan yang digeruni...',
    audio: 'croc.mp3',
    pages: [
        { text: "He turned into a white crocodile to protect his people.", translation: "Dia bertukar menjadi buaya putih untuk melindungi rakyatnya." },
        { text: "The river became his domain forever.", translation: "Sungai itu menjadi kawasannya selamanya." }
    ]
  }
];

export const quizQuestions = [
  {
    id: 1,
    question: 'What is "Rumah" in English?',
    options: ['Car', 'House', 'Tree', 'River'],
    correctAnswer: 'House'
  },
  {
    id: 2,
    question: 'How do you say "Eat"?',
    options: ['Minum', 'Tidur', 'Makan', 'Jalan'],
    correctAnswer: 'Makan'
  }
];