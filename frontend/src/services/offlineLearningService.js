// Offline Learning Service
// Manages downloading and caching of lessons, stories, and audio

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const OFFLINE_DATA_KEY = 'offlineContent';
const DOWNLOAD_PROGRESS_KEY = 'downloadProgress';

/**
 * Download and cache content for offline use
 * @param {Object} content - Content to download (lesson, story, vocabulary)
 * @param {Function} progressCallback - Callback for download progress
 * @returns {Promise<Object>} Download result
 */
export const downloadContent = async (content, progressCallback = null) => {
  try {
    const { id, type, title, data, audioUrl } = content;

    // Create offline directory if it doesn't exist
    const offlineDir = `${FileSystem.documentDirectory}offline/`;
    const dirInfo = await FileSystem.getInfoAsync(offlineDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(offlineDir, { intermediates: true });
    }

    let downloadedContent = {
      id,
      type,
      title,
      data,
      downloadedAt: new Date().toISOString(),
      audioPath: null,
    };

    // Download audio file if present
    if (audioUrl) {
      const audioFileName = `${id}_audio.mp3`;
      const audioPath = `${offlineDir}${audioFileName}`;

      const downloadResult = await FileSystem.createDownloadResumable(
        audioUrl,
        audioPath,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          if (progressCallback) {
            progressCallback(progress * 100);
          }
        }
      ).downloadAsync();

      if (downloadResult && downloadResult.uri) {
        downloadedContent.audioPath = downloadResult.uri;
      }
    }

    // Save to offline storage
    const existingContent = await getOfflineContent();
    existingContent.push(downloadedContent);
    await AsyncStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(existingContent));

    return {
      success: true,
      content: downloadedContent,
      message: 'Content downloaded successfully',
    };
  } catch (error) {
    console.error('Download error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to download content',
    };
  }
};

/**
 * Get all offline content
 * @returns {Promise<Array>} Array of downloaded content
 */
export const getOfflineContent = async () => {
  try {
    const stored = await AsyncStorage.getItem(OFFLINE_DATA_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Get offline content error:', error);
    return [];
  }
};

/**
 * Get offline content by type
 * @param {string} type - Type of content (lesson, story, vocabulary)
 * @returns {Promise<Array>} Filtered content
 */
export const getOfflineContentByType = async (type) => {
  try {
    const content = await getOfflineContent();
    return content.filter((item) => item.type === type);
  } catch (error) {
    console.error('Get offline content by type error:', error);
    return [];
  }
};

/**
 * Check if content is available offline
 * @param {string} id - Content ID
 * @returns {Promise<boolean>} True if available offline
 */
export const isContentAvailableOffline = async (id) => {
  try {
    const content = await getOfflineContent();
    return content.some((item) => item.id === id);
  } catch (error) {
    console.error('Check offline availability error:', error);
    return false;
  }
};

/**
 * Delete offline content
 * @param {string} id - Content ID to delete
 * @returns {Promise<Object>} Deletion result
 */
export const deleteOfflineContent = async (id) => {
  try {
    const content = await getOfflineContent();
    const itemToDelete = content.find((item) => item.id === id);

    if (itemToDelete) {
      // Delete audio file if exists
      if (itemToDelete.audioPath) {
        const fileInfo = await FileSystem.getInfoAsync(itemToDelete.audioPath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(itemToDelete.audioPath);
        }
      }

      // Remove from storage
      const updatedContent = content.filter((item) => item.id !== id);
      await AsyncStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(updatedContent));

      return {
        success: true,
        message: 'Content deleted successfully',
      };
    }

    return {
      success: false,
      message: 'Content not found',
    };
  } catch (error) {
    console.error('Delete offline content error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to delete content',
    };
  }
};

/**
 * Clear all offline content
 * @returns {Promise<Object>} Clearance result
 */
export const clearAllOfflineContent = async () => {
  try {
    // Delete all files
    const offlineDir = `${FileSystem.documentDirectory}offline/`;
    const dirInfo = await FileSystem.getInfoAsync(offlineDir);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(offlineDir);
    }

    // Clear storage
    await AsyncStorage.removeItem(OFFLINE_DATA_KEY);

    return {
      success: true,
      message: 'All offline content cleared',
    };
  } catch (error) {
    console.error('Clear offline content error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to clear content',
    };
  }
};

/**
 * Get total size of offline content
 * @returns {Promise<number>} Size in bytes
 */
export const getOfflineContentSize = async () => {
  try {
    const offlineDir = `${FileSystem.documentDirectory}offline/`;
    const dirInfo = await FileSystem.getInfoAsync(offlineDir);

    if (!dirInfo.exists) {
      return 0;
    }

    const files = await FileSystem.readDirectoryAsync(offlineDir);
    let totalSize = 0;

    for (const file of files) {
      const fileInfo = await FileSystem.getInfoAsync(`${offlineDir}${file}`);
      totalSize += fileInfo.size || 0;
    }

    return totalSize;
  } catch (error) {
    console.error('Get offline content size error:', error);
    return 0;
  }
};

/**
 * Format bytes to readable size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Batch download multiple content items
 * @param {Array} contentList - Array of content to download
 * @param {Function} progressCallback - Callback for overall progress
 * @returns {Promise<Object>} Batch download result
 */
export const batchDownload = async (contentList, progressCallback = null) => {
  try {
    const results = [];
    const totalItems = contentList.length;
    let completedItems = 0;

    for (const content of contentList) {
      const result = await downloadContent(content, (itemProgress) => {
        if (progressCallback) {
          const overallProgress = ((completedItems / totalItems) + (itemProgress / 100 / totalItems)) * 100;
          progressCallback(overallProgress);
        }
      });

      results.push(result);
      completedItems++;

      if (progressCallback) {
        progressCallback((completedItems / totalItems) * 100);
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return {
      success: successCount === totalItems,
      total: totalItems,
      successful: successCount,
      failed: totalItems - successCount,
      results: results,
    };
  } catch (error) {
    console.error('Batch download error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Sync offline content (update if needed)
 * @returns {Promise<Object>} Sync result
 */
export const syncOfflineContent = async () => {
  try {
    const content = await getOfflineContent();
    let updatedCount = 0;

    for (const item of content) {
      // Check if content is older than 7 days
      const downloadedAt = new Date(item.downloadedAt);
      const daysSinceDownload = (Date.now() - downloadedAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceDownload > 7) {
        // Re-download to update
        await deleteOfflineContent(item.id);
        await downloadContent({
          id: item.id,
          type: item.type,
          title: item.title,
          data: item.data,
          audioUrl: item.audioPath,
        });
        updatedCount++;
      }
    }

    return {
      success: true,
      updatedCount,
      message: `${updatedCount} items updated`,
    };
  } catch (error) {
    console.error('Sync offline content error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export default {
  downloadContent,
  getOfflineContent,
  getOfflineContentByType,
  isContentAvailableOffline,
  deleteOfflineContent,
  clearAllOfflineContent,
  getOfflineContentSize,
  formatBytes,
  batchDownload,
  syncOfflineContent,
};
