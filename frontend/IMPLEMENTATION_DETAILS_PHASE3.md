# Implementation Details: AI Story Generator Integration

## 1. Navigation Updates (AppNavigator.js)
- **Central Action Button**: The middle tab button ("RecordTab") has been updated.
  - **Component**: Switched from `RecordScreen` to `AIStoryGeneratorScreen`.
  - **Icon**: Changed from a microphone (`mic`) to a magic staff (`magic-staff`) to represent AI creation.
  - **Label**: Remains hidden for a clean, prominent action button look.

## 2. Home Screen Updates (HomeScreen.js)
- **Quick Action Replacement**:
  - Removed: "AI Chat" button.
  - Added: "Snap & Learn" button, linking directly to the camera-based vocabulary feature.

## 3. AI Story Generator Enhancements (AIStoryGeneratorScreen.js)
- **Input Methods**: Added a tabbed interface supporting 3 ways to start a story:
  1.  **Voice**: Record a new audio fragment.
  2.  **Text**: Type a story idea.
  3.  **History/File**: Pick from recent recordings or upload an audio file from the device.
- **Recording Integration**:
  - Newly recorded audio is automatically saved to local history (`@echolingua_recordings`).
  - Reuses the existing recording storage key, so recordings made in the old `RecordScreen` are accessible here.
- **File Upload**: Integrated `expo-document-picker` to allow importing external audio files for story generation.

## User Flow
1.  **Start**: Tap the central "Magic Staff" button on the bottom navigation bar.
2.  **Choose Source**:
    - Tap the microphone to record a new idea.
    - Tap the folder icon ("History/File") to select an old recording or upload a file.
3.  **Generate**: The selected audio is transcribed and transformed into an illustrated story.
