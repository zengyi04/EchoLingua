# Implementation Details: Elder Voice Preservation

## 1. Feature Overview
Allows users to record and archive "Elder Voices" to preserve cultural heritage. These voices can then be selected as "Narrators" for stories within the app.

## 2. Voice Creation (AIStoryGeneratorScreen.js)
- **New Mode**: Added a "Preserve Voice" toggle in the Voice tab.
- **Workflow**:
  1.  User toggles "Preserve Voice".
  2.  App displays a standard reading passage (training text).
  3.  User records the passage.
  4.  User enters the Elder's Name.
  5.  Recording is saved to `AsyncStorage` (`@echolingua_elder_voices`) as a voice model.

## 3. Voice Selection (StoryScreen.js)
- **Narrator Selector**: Added a "Change Voice" button to the audio player controls.
- **Functionality**:
  - Loads saved voices from storage.
  - Allows switching between "Default AI" and saved "Elder Voices".
  - **Simulation**: Since real-time voice cloning requires a heavy backend (e.g., ElevenLabs), selecting a voice currently updates the UI to show the story is being "Narrated by [Elder Name]" and visualizes the intent. In a production environment, this `voiceId` would be sent to the TTS API.

## 4. Components Added/Modified
- **AsyncStorage Key**: `@echolingua_elder_voices`
- **UI Elements**:
  - `Switch` for Voice Preservation Mode.
  - `TextInput` for Naming the Voice.
  - `Modal` for Voice Selection in Story Screen.
