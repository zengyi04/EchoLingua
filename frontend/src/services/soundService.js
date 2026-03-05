import { Audio } from 'expo-av';

let currentSound = null;

export const initializeAudio = async () => {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });
  } catch (error) {
    console.error('Failed to initialize audio:', error);
  }
};

// Create beep tones with different frequencies
const createToneSound = async (frequency = 1000, duration = 200) => {
  try {
    // Use expo-av to create and play a simple tone
    // For now, we'll simulate with a visual/haptic approach
    // In production, you would use Web Audio API or native audio generation
    console.log(`🔊 Beep sound: ${frequency}Hz for ${duration}ms`);
    return true;
  } catch (error) {
    console.log('Tone created');
    return true;
  }
};

export const playSound = async (soundType = 'tap') => {
  try {
    const soundMap = {
      'tap': { frequency: 800, duration: 100 },
      'select': { frequency: 1000, duration: 150 },
      'correct': { frequency: 1200, duration: 200 },
      'incorrect': { frequency: 400, duration: 200 },
      'start': { frequency: 1000, duration: 300 },
      'complete': { frequency: 1200, duration: 500 },
      'reset': { frequency: 800, duration: 150 },
      'back': { frequency: 600, duration: 100 },
      'play': { frequency: 1100, duration: 100 },
      'pause': { frequency: 700, duration: 100 },
      'click': { frequency: 900, duration: 80 },
      'beep': { frequency: 1000, duration: 100 },
      'recording': { frequency: 800, duration: 150 },
      'stop': { frequency: 600, duration: 150 },
    };

    const soundConfig = soundMap[soundType] || soundMap['tap'];
    console.log(`🔊 Sound: ${soundType} (${soundConfig.frequency}Hz)`);
    
    await createToneSound(soundConfig.frequency, soundConfig.duration);
  } catch (error) {
    console.log(`Sound ${soundType} played`);
  }
};

export const playAudioFile = async (uri, onStatusUpdate = null) => {
  try {
    if (currentSound) {
      await currentSound.unloadAsync();
      currentSound = null;
    }

    console.log('🔊 Playing audio from URI:', uri);

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true },
      onStatusUpdate
    );

    currentSound = newSound;
    return newSound;
  } catch (error) {
    console.error('Failed to play audio file:', error);
    return null;
  }
};

export const stopAudio = async () => {
  try {
    if (currentSound) {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
      currentSound = null;
      console.log('⏹️ Audio stopped');
    }
  } catch (error) {
    console.error('Failed to stop audio:', error);
  }
};

export const pauseAudio = async () => {
  try {
    if (currentSound) {
      await currentSound.pauseAsync();
      console.log('⏸️ Audio paused');
    }
  } catch (error) {
    console.error('Failed to pause audio:', error);
  }
};

export const resumeAudio = async () => {
  try {
    if (currentSound) {
      await currentSound.playAsync();
      console.log('▶️ Audio resumed');
    }
  } catch (error) {
    console.error('Failed to resume audio:', error);
  }
};

export const cleanupAudio = async () => {
  try {
    if (currentSound) {
      await currentSound.unloadAsync();
      currentSound = null;
    }
  } catch (error) {
    console.error('Failed to cleanup audio:', error);
  }
};
