import { authFetch } from './api';

export const communityApiService = {
  listStories: async () => {
    return authFetch('/community/stories');
  },

  likeStory: async (storyId, userId) => {
    return authFetch(`/community/stories/${encodeURIComponent(storyId)}/like?user_id=${encodeURIComponent(userId)}`, {
      method: 'POST',
    });
  },

  commentStory: async (storyId, userId, text) => {
    return authFetch(`/community/stories/${encodeURIComponent(storyId)}/comment?user_id=${encodeURIComponent(userId)}&text=${encodeURIComponent(text)}`, {
      method: 'POST',
    });
  },

  getStoryComments: async (storyId) => {
    return authFetch(`/community/stories/${encodeURIComponent(storyId)}/comments`);
  },

  bookmarkStory: async (storyId, userId) => {
    return authFetch(`/community/stories/${encodeURIComponent(storyId)}/bookmark?user_id=${encodeURIComponent(userId)}`, {
      method: 'POST',
    });
  },

  uploadStory: async ({ createdBy, title, text, language, elderConsent = true }) => {
    return authFetch('/community/stories/upload', {
      method: 'POST',
      body: JSON.stringify({ createdBy, title, text, language, elderConsent }),
    });
  },

  getPendingStories: async () => {
    return authFetch('/community/stories/moderation/pending');
  },

  verifyStory: async (storyId, status) => {
    return authFetch(`/community/stories/moderation/${encodeURIComponent(storyId)}/verify?status=${encodeURIComponent(status)}`, {
      method: 'PUT',
    });
  },

  addXp: async (userId, amount) => {
    return authFetch(`/community/xp/add?user_id=${encodeURIComponent(userId)}&amount=${encodeURIComponent(amount)}`, {
      method: 'POST',
    });
  },

  getXp: async (userId) => {
    return authFetch(`/community/xp/${encodeURIComponent(userId)}`);
  },

  getLeaderboard: async () => {
    return authFetch('/community/leaderboard');
  },

  dailyCheckin: async (userId) => {
    return authFetch(`/community/gamification/checkin?user_id=${encodeURIComponent(userId)}`, {
      method: 'POST',
    });
  },

  createNotification: async (userId, message) => {
    return authFetch(`/community/notifications?user_id=${encodeURIComponent(userId)}&message=${encodeURIComponent(message)}`, {
      method: 'POST',
    });
  },

  getNotifications: async (userId) => {
    return authFetch(`/community/notifications/${encodeURIComponent(userId)}`);
  },

  getVitalityStats: async () => {
    return authFetch('/community/vitality/stats');
  },

  livingLanguageChat: async ({ userId, scenarioId, message }) => {
    return authFetch('/community/living-language/chat', {
      method: 'POST',
      body: JSON.stringify({ userId, scenarioId, message }),
    });
  },
};
