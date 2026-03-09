# EchoLingua Borneo - Frontend

React Native Expo app for indigenous language learning, preservation, and community participation.

## Setup Instructions

1. Make sure Node.js and npm (or yarn) are installed.
2. Go to the frontend app folder:

```bash
cd frontend
```

3. Install dependencies:

```bash
npm install
# or
yarn install
```

4. Configure environment variables:

```bash
cp .env.example .env
```

Set your Google Maps key in `frontend/.env`:

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

5. Start the Expo app:

```bash
npm start
# or
npx expo start
# or
npm start --tunnel
```

## Complete Feature List

### Core App Experience
- Authentication flow with login and sign-up (`LoginScreen`, `SignUpScreen`)
- Persistent auth session check on app startup (`AppNavigator` + AsyncStorage)
- Bottom-tab navigation for Home, Learn, Record, Stories, and Profile
- Dark glassmorphism visual system applied across screens
- Reusable theming and theme context (`src/constants/theme.js`, `src/context/ThemeContext.js`)

### Learning and Practice
- Living language learning hub (`LivingLanguageScreen`)
- Vocabulary learning cards and word practice with difficulty flows (`VocabularyScreen`, `VocabularyCard`)
- Story learning with audio controls, elder mode, and narrator selection (`StoryScreen`)
- Story library browsing (`StoryLibraryScreen`)
- Logic-based quiz system with progressive difficulty (easy, medium, hard)
- Quiz coverage for all supported languages through shared quiz generation (`src/data/logicBasedQuizzes.js`, `src/data/mockData.js`)

### AI Features
- AI chat for language conversation practice (`AIChatScreen`)
- AI pronunciation analysis, comparison, and pronunciation tips services (`pronunciationCheckerService.js`)
- Translation utility service for language support (`translationService.js`)
- AI story generation flow (`AIStoryGeneratorScreen`)

### Recording and Audio
- In-app voice recording workflow (`RecordScreen`, `recordingService.js`)
- Auto-save recorded audio locally after recording
- Previous recordings list with playback and delete controls
- Share recorded clips to community stories with title, description, and category
- Sound playback helpers (`soundService.js`)

### Community and Contribution
- Community story sharing feed (`CommunityStoryScreen`)
- Upload and publish recorded stories
- Story interactions: like, comment, bookmark
- Story feed tabs and search/filter support (all/following/popular, language/category)
- Community contribution entry point (`CommunityContributionScreen`)

### Progress and Gamification
- Personal progress dashboard (`ProgressTrackerScreen`)
- XP and level progression model (Novice to Expert) (`gamificationService.js`)
- Achievement and badge tracking
- Daily streak tracking and learning activity insights
- Quiz, vocabulary, pronunciation, and learning-time statistics

### Cultural Preservation Modules
- Cultural events and festival learning (`CulturalEventsScreen`)
- Indigenous language dictionary with search, favorites, and recent searches (`DictionaryScreen`)
- Cultural knowledge archive with categories and articles (`CulturalKnowledgeScreen`)
- Geographical and language context view (`MapScreen`)
- Language vitality awareness dashboard (`LanguageVitalityDashboard`)

### Family and Safety Features
- Multi-member family learning mode (`FamilyLearningScreen`)
- Role-based family profiles (parent, child, grandparent, teen)
- Shared and individual progress tracking for family members
- Family story-time experience (`FamilyStoryTimeScreen`)
- Emergency contact reference screen (`EmergencyContactsScreen`)

### Profile and User Data
- User profile screens (`ProfileScreen`, `UserProfileScreen`)
- Local persistence for user data and app state (AsyncStorage)
- In-app notifications screen (`NotificationScreen`)

### Offline and Data Services
- Offline learning content caching support (`offlineLearningService.js`)
- Download single or batch content for offline access
- Offline storage size tracking, cleanup, and sync helpers
- API abstraction layer for backend integrations (`api.js`)
- Scoring utilities for quiz and scenario logic (`scoringService.js`)
- Image scan and OCR-based vocabulary extraction support (`ScanImageScreen`, `ImageVocabularyScreen`, `ocrService.js`)

## Key Paths

- App entry: `App.js`
- Navigation: `src/navigation/AppNavigator.js`
- Theme: `src/constants/theme.js`
- Screens: `src/screens/`
- Services: `src/services/`
- Data: `src/data/`
