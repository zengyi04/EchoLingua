import { Audio } from 'expo-av';

let activeRecording = null;
let preparing = false;

export const forceCleanupActiveRecording = async () => {
  if (!activeRecording) {
    return;
  }

  try {
    await activeRecording.stopAndUnloadAsync();
  } catch (error) {
    // Ignore cleanup errors when recording has already stopped.
  }

  activeRecording = null;
};

export const prepareSingleRecording = async () => {
  if (preparing) {
    throw new Error('Recording is still being prepared. Please try again.');
  }

  preparing = true;

  try {
    // Expo allows only one prepared Recording instance at a time.
    await forceCleanupActiveRecording();

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    activeRecording = recording;
    return recording;
  } finally {
    preparing = false;
  }
};

export const stopAndReleaseRecording = async (recording) => {
  if (!recording) {
    return null;
  }

  try {
    await recording.stopAndUnloadAsync();
  } finally {
    if (activeRecording === recording) {
      activeRecording = null;
    }
  }

  return recording.getURI();
};

export const releaseRecordingReference = (recording) => {
  if (activeRecording === recording) {
    activeRecording = null;
  }
};
