import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';

export default function UserProfileScreen({ navigation, route }) {
  const { userId, userName } = route.params || {};
  const [userStories, setUserStories] = useState([]);
  const [userStats, setUserStats] = useState({
    storiesCount: 0,
    followers: 156,
    following: 89,
    totalLikes: 0,
  });
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      // Load all stories and filter by user
      const storedStories = await AsyncStorage.getItem('communityStories');
      if (storedStories) {
        const allStories = JSON.parse(storedStories);
        const filtered = allStories.filter(
          (story) => story.userId === userId || story.author === userName
        );
        setUserStories(filtered);

        // Calculate stats
        const totalLikes = filtered.reduce((sum, story) => sum + story.likes, 0);
        setUserStats({
          ...userStats,
          storiesCount: filtered.length,
          totalLikes,
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing);
    setUserStats({
      ...userStats,
      followers: userStats.followers + (isFollowing ? -1 : 1),
    });
  };

  const renderStoryItem = ({ item }) => (
    <TouchableOpacity style={styles.storyItem}>
      <View style={styles.storyItemContent}>
        <Text style={styles.storyItemTitle}>{item.title}</Text>
        <Text style={styles.storyItemDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.storyItemMeta}>
          <Text style={styles.storyItemMetaText}>
            {item.language} • {item.category}
          </Text>
          <View style={styles.storyItemStats}>
            <Ionicons name="heart" size={14} color="#FF4458" />
            <Text style={styles.storyItemStatsText}>{item.likes}</Text>
            <Ionicons name="chatbubble" size={14} color={COLORS.textSecondary} style={{ marginLeft: 8 }} />
            <Text style={styles.storyItemStatsText}>{item.comments}</Text>
          </View>
        </View>
      </View>
      {item.audioUri && (
        <Ionicons name="musical-notes" size={24} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <Text style={styles.userName}>{userName || 'Anonymous User'}</Text>
          <Text style={styles.userBio}>
            Passionate about preserving indigenous languages and sharing cultural stories
          </Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.storiesCount}</Text>
              <Text style={styles.statLabel}>Stories</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.totalLikes}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
          </View>

          {/* Follow Button */}
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={handleFollowToggle}
          >
            <Ionicons
              name={isFollowing ? 'checkmark-circle' : 'add-circle'}
              size={20}
              color={isFollowing ? COLORS.primary : COLORS.surface}
            />
            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* User's Stories Section */}
        <View style={styles.storiesSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="book" size={22} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Shared Stories</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{userStats.storiesCount}</Text>
            </View>
          </View>

          {userStories.length > 0 ? (
            <FlatList
              data={userStories}
              renderItem={renderStoryItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.storiesList}
            />
          ) : (
            <View style={styles.emptyState}>
              <FontAwesome5 name="book-open" size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyStateText}>No stories shared yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.m,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarEmoji: {
    fontSize: 48,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  userBio: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.l,
    paddingHorizontal: SPACING.xl,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: SPACING.m,
    marginBottom: SPACING.l,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m,
    borderRadius: 24,
    gap: SPACING.xs,
    ...SHADOWS.small,
  },
  followingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  followButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.surface,
  },
  followingButtonText: {
    color: COLORS.primary,
  },
  storiesSection: {
    padding: SPACING.l,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
    gap: SPACING.s,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  countBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: SPACING.s,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  storiesList: {
    gap: SPACING.m,
  },
  storyItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...SHADOWS.small,
  },
  storyItemContent: {
    flex: 1,
  },
  storyItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  storyItemDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.s,
  },
  storyItemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storyItemMetaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  storyItemStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  storyItemStatsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.m,
  },
});
