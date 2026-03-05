# EchoLingua Borneo - Frontend

React Native Expo project for Indigenous Language Preservation.

## Setup Instructions

Since the environment did not have Node.js available, the project structure was created manually. You will need to install the dependencies before running the app.

1.  Make sure you have Node.js and npm/yarn installed.
2.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
3.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    ```
4.  Start the Expo app:
    ```bash
    npm start
    # or
    npx expo start
    # or
    npm start --tunnel
    ```

## Structure (Member 1 Features)

- **Learning Interface**: `src/screens/VocabularyScreen.js`, `src/screens/QuizScreen.js`
- **Story Interface**: `src/screens/StoryScreen.js` (includes audio controls, bilingual toggle, children's mode)
- **Navigation**: `src/navigation/AppNavigator.js`

## Key Files

- `App.js`: Entry point.
- `src/screens/HomeScreen.js`: Dashboard.
- `src/components/VocabularyCard.js`: Reusable component for words.
