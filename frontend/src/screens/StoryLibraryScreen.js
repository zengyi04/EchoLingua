import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl, ScrollView, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { stories } from '../data/mockData';
import { WORLD_LANGUAGES } from '../constants/languages';
import { COLORS, SPACING, SHADOWS, GLASS_EFFECTS } from '../constants/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { storyService } from '../services/api';

const STORIES_STORAGE_KEY = '@echolingua_stories';
const USER_STORAGE_KEY = '@echolingua_current_user';
const SHARED_STORIES_KEY = '@echolingua_shared_stories';
const USERS_DATABASE_KEY = '@echolingua_users_database';
const COMMUNITY_STORIES_KEY = '@echolingua_community_stories';
const NOTIFICATIONS_KEY = '@echolingua_notifications';


export default function StoryLibraryScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const [createdStories, setCreatedStories] = useState([]);
  const [sharedStories, setSharedStories] = useState([]);
  // 'library' | 'creations' | 'shared'
  const [activeTab, setActiveTab] = useState('library');
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedStories, setSelectedStories] = useState([]);

  // Per-story action sheet
  const [actionStory, setActionStory] = useState(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [shareRecipients, setShareRecipients] = useState([]);
  const [isSharingStory, setIsSharingStory] = useState(false);

  // Load current user
  const loadCurrentUser = async () => {
    try {
      const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userJson) {
        const user = JSON.parse(userJson);
        setCurrentUser(user);
        setEmergencyContacts(user.emergencyContacts || []);
      }
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadCreatedStories = async () => {
    try {
      console.log('📚 Loading created stories from backend...');
      // First try to fetch from Backend (User's created stories)
      const backendStories = await storyService.getAllMine();
      console.log('✅ Backend stories loaded:', backendStories);
      setCreatedStories(backendStories || []);
    } catch (error) {
      console.warn('⚠️ Backend fetch failed, falling back to local storage:', error.message);
      // Fallback to LOCAL STORAGE
      try {
        const storiesJson = await AsyncStorage.getItem(STORIES_STORAGE_KEY);
        console.log('📖 Local storage stories:', storiesJson);
        const loadedStories = storiesJson ? JSON.parse(storiesJson) : [];
        console.log('✅ Loaded', loadedStories.length, 'stories from local storage');
        setCreatedStories(loadedStories);
      } catch (localError) {
        console.error('❌ Failed to load local stories:', localError);
        setCreatedStories([]);
      }
    }
  };

  // Load shared stories sent to current user
  const loadSharedStories = async () => {
    try {
      if (!currentUser) {
        setSharedStories([]);
        return;
      }

      const sharedJson = await AsyncStorage.getItem(SHARED_STORIES_KEY);
      const allSharedStories = sharedJson ? JSON.parse(sharedJson) : [];
      
      // Filter stories shared with current user
      const myEmail = currentUser.email?.trim().toLowerCase();
      const myUserId = currentUser.id;

      const mySharedStories = allSharedStories.filter((story) => {
        const emailMatch =
          myEmail &&
          Array.isArray(story.sharedWithEmails) &&
          story.sharedWithEmails.some((email) => email?.trim().toLowerCase() === myEmail);

        const userIdMatch =
          myUserId &&
          Array.isArray(story.sharedWithUserIds) &&
          story.sharedWithUserIds.includes(myUserId);

        return Boolean(emailMatch || userIdMatch);
      });
      
      setSharedStories(mySharedStories);
    } catch (error) {
      console.error('Failed to load shared stories:', error);
    }
  };

  // Load stories when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 StoryLibraryScreen focused - reloading stories');
      
      // Check for tab parameter from navigation
      if (route.params?.initialTab) {
        console.log('📍 Switching to tab:', route.params.initialTab);
        setActiveTab(route.params.initialTab);
        // Clean up params so it doesn't force switch next time if unwanted
        navigation.setParams({ initialTab: undefined });
      }

      loadCurrentUser();
      loadCreatedStories();
      loadSharedStories();
    }, [navigation, route]) // Re-run when navigation or route changes
  );

  // Load shared stories when user is loaded
  useEffect(() => {
    if (currentUser) {
      loadSharedStories();
    }
  }, [currentUser]);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadCurrentUser();
    await loadCreatedStories();
    await loadSharedStories();
    setRefreshing(false);
  };

  // Toggle delete mode
  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode);
    setSelectedStories([]);
  };

  // Open per-story action sheet
  const openActionSheet = (item) => {
    setActionStory(item);
    setShowActionSheet(true);
  };

  // Single story delete (from action sheet)
  const handleDeleteSingle = async (item) => {
    setShowActionSheet(false);
    Alert.alert('Delete Story', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            if (activeTab === 'creations') {
              try { await storyService.delete(item.id); } catch (e) { /* offline ok */ }
              const updatedStories = createdStories.filter(s => s.id !== item.id);
              await AsyncStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(updatedStories));
              setCreatedStories(updatedStories);
            } else if (activeTab === 'shared') {
              const allRaw = await AsyncStorage.getItem(SHARED_STORIES_KEY);
              const all = allRaw ? JSON.parse(allRaw) : [];
              await AsyncStorage.setItem(SHARED_STORIES_KEY, JSON.stringify(all.filter(s => s.id !== item.id)));
              await loadSharedStories();
            }
          } catch (e) {
            Alert.alert('Error', 'Failed to delete story.');
          }
        },
      },
    ]);
  };

  // Open share modal for a story
  const openShareModal = (item) => {
    setActionStory(item);
    setShareRecipients(['community']);
    setShowActionSheet(false);
    setShowShareModal(true);
  };

  const toggleShareRecipient = (key) => {
    setShareRecipients(prev =>
      prev.includes(key) ? prev.filter(r => r !== key) : [...prev, key]
    );
  };

  // Execute share to chosen destinations
  const handleShareNow = async () => {
    if (!actionStory || shareRecipients.length === 0) return;
    setIsSharingStory(true);
    try {
      const story = actionStory;
      // Community
      if (shareRecipients.includes('community')) {
        const raw = await AsyncStorage.getItem(COMMUNITY_STORIES_KEY);
        const existing = raw ? JSON.parse(raw) : [];
        if (!existing.some(s => s.id === story.id)) {
          await AsyncStorage.setItem(COMMUNITY_STORIES_KEY, JSON.stringify([{ ...story, sharedToCommunityAt: new Date().toISOString() }, ...existing]));
        }
        // Notification
        const notifRaw = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
        const notifs = notifRaw ? JSON.parse(notifRaw) : [];
        notifs.unshift({ id: `notif-${Date.now()}`, type: 'community_story', storyId: story.id, storyTitle: story.title, authorName: currentUser?.fullName || 'A user', createdAt: new Date().toISOString(), read: false });
        await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
      }
      // Emergency contacts
      const contactKeys = shareRecipients.filter(r => r !== 'community');
      if (contactKeys.length > 0) {
        const sharedRaw = await AsyncStorage.getItem(SHARED_STORIES_KEY);
        const allShared = sharedRaw ? JSON.parse(sharedRaw) : [];
        const contactEmails = emergencyContacts
          .filter(c => contactKeys.includes(`ec-${c.id}`))
          .map(c => c.email).filter(Boolean);
        const contactUserIds = emergencyContacts
          .filter(c => contactKeys.includes(`ec-${c.id}`))
          .map(c => c.linkedUserId).filter(Boolean);
        allShared.push({
          ...story,
          sharedId: `${story.id}-${Date.now()}`,
          sharedBy: currentUser?.fullName || currentUser?.name || 'A user',
          sharedAt: new Date().toISOString(),
          sharedWithEmails: contactEmails,
          sharedWithUserIds: contactUserIds,
        });
        await AsyncStorage.setItem(SHARED_STORIES_KEY, JSON.stringify(allShared));
      }

      setIsSharingStory(false);
      setShowShareModal(false);
      const destLabel = [
        shareRecipients.includes('community') && 'Community',
        contactKeys.length > 0 && `${contactKeys.length} contact(s)`,
      ].filter(Boolean).join(' & ');
      Alert.alert('Shared! 🎉', `"${story.title}" shared to ${destLabel}.`);
    } catch (e) {
      setIsSharingStory(false);
      Alert.alert('Error', 'Failed to share story.');
    }
  };

  const handleEditPress = () => {
    if (activeTab === 'library') {
      setActiveTab('creations');
      setDeleteMode(true);
      setSelectedStories([]);
      return;
    }

    toggleDeleteMode();
  };

  // Toggle story selection
  const toggleStorySelection = (storyId) => {
    if (selectedStories.includes(storyId)) {
      setSelectedStories(selectedStories.filter(id => id !== storyId));
    } else {
      setSelectedStories([...selectedStories, storyId]);
    }
  };

  // Delete selected stories
  const handleDeleteSelected = async () => {
    if (selectedStories.length === 0) {
      Alert.alert('No Selection', 'Please select stories to delete.');
      return;
    }

    Alert.alert(
      'Delete Stories',
      `Are you sure you want to delete ${selectedStories.length} ${selectedStories.length === 1 ? 'story' : 'stories'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (activeTab === 'creations') {
                // Delete logic
                for (const storyId of selectedStories) {
                  try {
                    // Try to delete from Backend
                    await storyService.delete(storyId);
                  } catch (apiError) {
                    console.warn(`Could not delete story ${storyId} from backend`);
                  }
                }

                // Also update local state and storage as backup
                const updatedStories = createdStories.filter(story => !selectedStories.includes(story.id));
                await AsyncStorage.setItem(STORIES_STORAGE_KEY, JSON.stringify(updatedStories));
                setCreatedStories(updatedStories);
              } else if (activeTab === 'shared') {
                // Delete from shared stories
                const allSharedJson = await AsyncStorage.getItem(SHARED_STORIES_KEY);
                const allSharedStories = allSharedJson ? JSON.parse(allSharedJson) : [];
                const updatedShared = allSharedStories.filter(story => !selectedStories.includes(story.id));
                await AsyncStorage.setItem(SHARED_STORIES_KEY, JSON.stringify(updatedShared));
                await loadSharedStories();
              }
              setSelectedStories([]);
              setDeleteMode(false);
              Alert.alert('Success', 'Stories deleted successfully.');
            } catch (error) {
              console.error('Failed to delete stories:', error);
              Alert.alert('Error', 'Failed to delete stories.');
            }
          }
        }
      ]
    );
  };

  // Determine which list to show
  const displayStories = activeTab === 'library' ? stories : (activeTab === 'creations' ? createdStories : sharedStories);

  const getLanguageFlag = (langName) => {
    if (!langName) return '🌏';
    const lang = WORLD_LANGUAGES.find(l => l.label === langName || l.id === langName.toLowerCase());
    return lang ? lang.flag : '🇲🇾';
  };

  // Returns { emoji, color } based on story content keywords
  const getStoryThumbnail = (item) => {
    const combined = ((item.title || '') + ' ' + (item.summary || item.description || item.text || '')).toLowerCase();

    if (/dragon|serpent|naga|beast|monster|creature/.test(combined))  return { emoji: '🐉', color: '#D94F35' };
    if (/river|sea|ocean|water|lake|fish|boat|stream/.test(combined)) return { emoji: '🌊', color: '#1E88C7' };
    if (/forest|jungle|tree|wood|bamboo|fern|rainforest/.test(combined)) return { emoji: '🌿', color: '#2D7D46' };
    if (/hornbill|bird|eagle|hawk|fly|wing|feather/.test(combined))   return { emoji: '🦅', color: '#8B5E3C' };
    if (/spirit|ghost|ancestor|sacred|ritual|magic|shaman|spell/.test(combined)) return { emoji: '✨', color: '#7B2FBE' };
    if (/warrior|battle|fight|sword|spear|hunt|brave/.test(combined)) return { emoji: '⚔️', color: '#B71C1C' };
    if (/fire|flame|sun|light|star|sky|moon|night/.test(combined))    return { emoji: '🔥', color: '#FF8C00' };
    if (/mountain|hill|cave|rock|stone|peak|earth/.test(combined))    return { emoji: '⛰️', color: '#546E7A' };
    if (/flower|bloom|rice|harvest|garden|plant|paddy/.test(combined)) return { emoji: '🌺', color: '#C2185B' };
    if (/love|heart|family|mother|father|child|home/.test(combined))   return { emoji: '💛', color: '#F9A825' };
    if (/music|song|dance|sing|drum|festival|chant/.test(combined))   return { emoji: '🎵', color: '#6A1B9A' };
    if (/village|tribe|community|people|elder|chief/.test(combined))  return { emoji: '🏡', color: '#5D4037' };
    if (/tiger|bear|boar|deer|monkey|animal|wild/.test(combined))     return { emoji: '🐯', color: '#EF6C00' };
    if (/gold|treasure|wealth|diamond|jewel|rich/.test(combined))     return { emoji: '💎', color: '#0097A7' };

    // Story type fallbacks
    if (item.sharedBy)                           return { emoji: '🤝', color: '#FF9800' };
    if (item.audioUri && !item.isAiGenerated)    return { emoji: '🎙️', color: '#00ACC1' };
    if (item.isAiGenerated)                      return { emoji: '🪄', color: '#5C35B5' };
    return { emoji: '📖', color: '#3E6B48' };
  };

  const renderStoryItem = ({ item }) => {
    const isAiStory = !!item.isAiGenerated;
    const isCommunityRecording = !!item.audioUri && !item.isAiGenerated;
    const isSelected = selectedStories.includes(item.id);
    const isSharedStory = !!item.sharedBy;
    const thumbnail = getStoryThumbnail(item);
    const langFlag = getLanguageFlag(item.language);
    
    return (
      <TouchableOpacity 
        style={[
          styles.storyCard, 
          { 
            backgroundColor: theme.surface, 
            borderColor: isSelected ? theme.primary : 'transparent',
            borderWidth: isSelected ? 2 : 1,
            shadowColor: theme.shadow,
            shadowOpacity: 0.1,
            elevation: 3,
            marginBottom: 12
          }
        ]} 
        onPress={() => {
          if (deleteMode) {
            toggleStorySelection(item.id);
          } else {
            navigation.navigate('Story', { storyId: item.id, story: item });
          }
        }}
        onLongPress={() => !deleteMode && openActionSheet(item)}
        delayLongPress={400}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
            {/* Selection checkbox in delete mode */}
            {deleteMode && (
              <View style={[
                styles.selectionCheckbox,
                { 
                  backgroundColor: isSelected ? theme.primary : theme.surface,
                  borderColor: isSelected ? theme.primary : theme.border
                }
              ]}>
                {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
              </View>
            )}
            {/* Themed story thumbnail */}
            <View style={[
              styles.placeholderImage,
              {
                backgroundColor: thumbnail.color + '22',
                borderWidth: 1,
                borderColor: thumbnail.color + '44',
                opacity: deleteMode ? 0.7 : 1,
                overflow: 'hidden',
              }
            ]}>
              {/* Large faded bg emoji for depth */}
              <Text style={{ position: 'absolute', fontSize: 44, opacity: 0.13, bottom: -4, right: -4 }}>
                {thumbnail.emoji}
              </Text>
              {/* Main emoji */}
              <Text style={{ fontSize: 28 }}>{thumbnail.emoji}</Text>
              {/* Small language flag badge */}
              <View style={{ position: 'absolute', bottom: 3, right: 3, backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 6, padding: 1 }}>
                <Text style={{ fontSize: 10 }}>{langFlag}</Text>
              </View>
            </View>
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
             <Text style={[styles.category, { color: theme.textSecondary, marginBottom: 0, marginRight: 8, fontSize: 11, fontWeight: '700' }]}>
                {isSharedStory ? 'SHARED' : (isCommunityRecording ? 'COMMUNITY' : (isAiStory ? 'AI TALE' : 'FOLKLORE'))}
             </Text>
             <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: theme.textSecondary, marginRight: 8 }} />
             <Text style={{ fontSize: 12, fontWeight: '600', color: theme.primary }}>
               {item.language || 'English'}
             </Text>
             <View style={{ flex: 1 }} />
             {isSharedStory && (
               <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.accent + '20', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 }}>
                 <Ionicons name="people" size={10} color={theme.accent} />
                 <Text style={{ fontSize: 10, color: theme.accent, marginLeft: 2, fontWeight: 'bold'}}>FROM {item.sharedBy}</Text>
               </View>
             )}
             {isAiStory && !isSharedStory && (
               <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.primary + '20', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2 }}>
                 <MaterialCommunityIcons name="robot" size={10} color={theme.primary} />
                 <Text style={{ fontSize: 10, color: theme.primary, marginLeft: 2, fontWeight: 'bold'}}>AI</Text>
               </View>
             )}
          </View>
            <Text style={[styles.title, { color: theme.text, marginTop: 4, marginBottom: 4 }]} numberOfLines={1}>{item.title}</Text>
            <Text style={[styles.storyDesc, { color: theme.textSecondary }]} numberOfLines={2}>
              {item.summary || item.description || item.text || "No description available."}
            </Text>

            <View style={styles.metaRow}>
                {isCommunityRecording ? (
                  <>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="mic" size={12} color={theme.accent} />
                        <Text style={{ color: theme.accent, marginLeft: 4, fontSize: 12, fontWeight: '500' }}>
                          Recording
                        </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                        <Text style={{ color: theme.textSecondary, marginLeft: 4, fontSize: 12 }}>
                           5 min read
                        </Text>
                    </View>
                  </>
                )}
            </View>
        </View>
        <View style={styles.arrowContainer}>
          {deleteMode ? (
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          ) : (
            <TouchableOpacity
              onPress={() => openActionSheet(item)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={{ padding: 4 }}
            >
              <Ionicons name="ellipsis-vertical" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (deleteMode) {
                setDeleteMode(false);
                setSelectedStories([]);
              } else {
                navigation.canGoBack() ? navigation.goBack() : navigation.navigate('HomeTab');
              }
            }}
          >
            <Ionicons name={deleteMode ? "close" : "chevron-back"} size={24} color={theme.primary} />
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { color: theme.primary }]}>{deleteMode ? 'Select Stories' : 'Story Library'}</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              {deleteMode ? `${selectedStories.length} selected` : 'Discover ancient wisdom & tales'}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {deleteMode ? (
              <TouchableOpacity
                onPress={handleDeleteSelected}
                style={{ padding: 8 }}
              >
                <Ionicons name="trash" size={24} color={selectedStories.length > 0 ? theme.error : theme.textSecondary} />
              </TouchableOpacity>
            ) : (
              <>
                {(activeTab === 'creations' || activeTab === 'shared') && (
                  <TouchableOpacity
                    onPress={handleEditPress}
                    style={{ padding: 8 }}
                  >
                    <Ionicons name="create-outline" size={24} color={theme.text} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => navigation.navigate('AIStoryGenerator')}
                  style={{ padding: 8 }}
                >
                  <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>


      
      {/* TABS */}
      <View style={{ flexDirection: 'row', paddingHorizontal: SPACING.m, marginBottom: SPACING.m }}>
         <TouchableOpacity 
          style={{ flex: 1, paddingVertical: 10, borderBottomWidth: activeTab === 'library' ? 3 : 0, borderBottomColor: theme.primary, alignItems: 'center' }}
           onPress={() => setActiveTab('library')}
         >
          <Text numberOfLines={1} style={{ fontWeight: 'bold', fontSize: 13, color: activeTab === 'library' ? theme.primary : theme.textSecondary }}>
            Explore
            </Text>
         </TouchableOpacity>
         <TouchableOpacity 
          style={{ flex: 1, paddingVertical: 10, borderBottomWidth: activeTab === 'creations' ? 3 : 0, borderBottomColor: theme.primary, alignItems: 'center' }}
           onPress={() => setActiveTab('creations')}
         >
          <Text numberOfLines={1} style={{ fontWeight: 'bold', fontSize: 13, color: activeTab === 'creations' ? theme.primary : theme.textSecondary }}>
               My Creations
            </Text>
         </TouchableOpacity>
         <TouchableOpacity 
          style={{ flex: 1, paddingVertical: 10, borderBottomWidth: activeTab === 'shared' ? 3 : 0, borderBottomColor: theme.primary, alignItems: 'center' }}
           onPress={() => setActiveTab('shared')}
         >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text numberOfLines={1} style={{ fontWeight: 'bold', fontSize: 13, color: activeTab === 'shared' ? theme.primary : theme.textSecondary }}>
              Other Creations
              </Text>
              {sharedStories.length > 0 && (
                <View style={{ marginLeft: 6, backgroundColor: theme.accent, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, minWidth: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>{sharedStories.length}</Text>
                </View>
              )}
            </View>
         </TouchableOpacity>
      </View>
      
      <FlatList
        data={displayStories}
        keyExtractor={(item, index) => {
          const sourcePrefix = item.isAiGenerated ? 'ai' : (item.audioUri ? 'community' : 'default');
          return `${sourcePrefix}-${String(item.id)}-${index}`;
        }}
        renderItem={renderStoryItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          activeTab === 'creations' ? (
             <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                <MaterialCommunityIcons name="magic-staff" size={64} color={theme.textSecondary + '40'} />
                <Text style={{ textAlign: 'center', marginTop: 16, color: theme.textSecondary }}>
                   You haven't created any stories yet. Start preserving your heritage today!
                </Text>
             </View>
          ) : activeTab === 'shared' ? (
             <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                <Ionicons name="people-outline" size={64} color={theme.textSecondary + '40'} />
                <Text style={{ textAlign: 'center', marginTop: 16, color: theme.textSecondary }}>
                   No stories shared with you yet. Stories from your emergency contacts will appear here.
                </Text>
             </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      />

      {/* ── Per-story Action Sheet ── */}
      <Modal
        visible={showActionSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionSheet(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }}
          activeOpacity={1}
          onPress={() => setShowActionSheet(false)}
        />
        <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: SPACING.m, paddingBottom: SPACING.xl, paddingHorizontal: SPACING.l, position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          {/* Handle */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: 'center', marginBottom: SPACING.m }} />
          {/* Story title preview */}
          {actionStory && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.m, paddingBottom: SPACING.m, borderBottomWidth: 1, borderBottomColor: theme.border }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: theme.primary + '18', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.m }}>
                <MaterialCommunityIcons name={actionStory.isAiGenerated ? 'auto-fix' : 'book-open-variant'} size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: 15, color: theme.text }} numberOfLines={1}>{actionStory.title}</Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary }}>{actionStory.isAiGenerated ? 'AI Story' : (actionStory.audioUri ? 'Recording' : 'Folklore')}</Text>
              </View>
            </View>
          )}
          {/* Actions */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
            onPress={() => openShareModal(actionStory)}
          >
            <Ionicons name="share-social-outline" size={22} color={theme.primary} style={{ marginRight: SPACING.m }} />
            <Text style={{ fontSize: 16, color: theme.primary, fontWeight: '600' }}>Share Story</Text>
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: theme.border }} />
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14 }}
            onPress={() => handleDeleteSingle(actionStory)}
          >
            <Ionicons name="trash-outline" size={22} color={theme.error || '#E53935'} style={{ marginRight: SPACING.m }} />
            <Text style={{ fontSize: 16, color: theme.error || '#E53935', fontWeight: '600' }}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Share Story Modal ── */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: SPACING.m, paddingBottom: SPACING.xl, maxHeight: '78%' }}>
            {/* Handle + header */}
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: 'center', marginBottom: SPACING.m }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.l, marginBottom: SPACING.m }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text }}>Share Story</Text>
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }} numberOfLines={1}>
                  {actionStory?.title}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowShareModal(false)}
                style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="close" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.l, paddingBottom: SPACING.m }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, letterSpacing: 0.8, marginBottom: SPACING.s }}>SHARE TO</Text>

              {/* Community */}
              <TouchableOpacity
                onPress={() => toggleShareRecipient('community')}
                style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: shareRecipients.includes('community') ? 2 : 1, borderColor: shareRecipients.includes('community') ? theme.primary : theme.border, backgroundColor: shareRecipients.includes('community') ? theme.primary + '0C' : theme.background, padding: SPACING.m, marginBottom: SPACING.s }}
              >
                <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: theme.primary + '22', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.m }}>
                  <Ionicons name="globe" size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>Community</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>Visible to all EchoLingua users</Text>
                </View>
                <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: shareRecipients.includes('community') ? theme.primary : theme.border, backgroundColor: shareRecipients.includes('community') ? theme.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {shareRecipients.includes('community') && <Ionicons name="checkmark" size={14} color="#FFF" />}
                </View>
              </TouchableOpacity>

              {/* Emergency Contacts */}
              {emergencyContacts.length > 0 && (
                <>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary, letterSpacing: 0.8, marginTop: SPACING.s, marginBottom: SPACING.s }}>EMERGENCY CONTACTS</Text>
                  {emergencyContacts.map((c) => {
                    const key = `ec-${c.id}`;
                    const chosen = shareRecipients.includes(key);
                    return (
                      <TouchableOpacity
                        key={key}
                        onPress={() => toggleShareRecipient(key)}
                        style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: chosen ? 2 : 1, borderColor: chosen ? theme.accent : theme.border, backgroundColor: chosen ? theme.accent + '0C' : theme.background, padding: SPACING.m, marginBottom: SPACING.s }}
                      >
                        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: theme.accent + '22', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.m }}>
                          <Text style={{ fontSize: 18, fontWeight: '700', color: theme.accent }}>{c.name?.[0]?.toUpperCase() || '?'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>{c.name}</Text>
                          <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>{c.relation || 'Contact'}</Text>
                        </View>
                        <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: chosen ? theme.accent : theme.border, backgroundColor: chosen ? theme.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                          {chosen && <Ionicons name="checkmark" size={14} color="#FFF" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
              {emergencyContacts.length === 0 && (
                <TouchableOpacity
                  onPress={() => { setShowShareModal(false); navigation.navigate('EmergencyContacts'); }}
                  style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.border, padding: SPACING.m, marginTop: SPACING.s }}
                >
                  <Ionicons name="person-add-outline" size={20} color={theme.accent} style={{ marginRight: SPACING.m }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: '600' }}>No emergency contacts</Text>
                    <Text style={{ color: theme.primary, fontSize: 12, marginTop: 2 }}>Tap to add contacts →</Text>
                  </View>
                </TouchableOpacity>
              )}
            </ScrollView>

            <View style={{ paddingHorizontal: SPACING.l, paddingTop: SPACING.m, gap: SPACING.s, borderTopWidth: 1, borderTopColor: theme.border + '60' }}>
              <TouchableOpacity
                onPress={handleShareNow}
                disabled={shareRecipients.length === 0 || isSharingStory}
                style={{ backgroundColor: theme.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, opacity: shareRecipients.length === 0 || isSharingStory ? 0.45 : 1 }}
              >
                {isSharingStory ? <ActivityIndicator size="small" color="#FFF" /> : (
                  <>
                    <Ionicons name="share-social" size={18} color="#FFF" />
                    <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>Share Now</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowShareModal(false)}
                style={{ borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.border }}
              >
                <Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    backgroundColor: COLORS.glassLight,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.4)',
    ...SHADOWS.small,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: SPACING.s,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  createSection: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
  },
  createCard: {
    backgroundColor: COLORS.accent,
    borderRadius: SPACING.l,
    padding: SPACING.m,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  createIconBg: {
    width: 48, 
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  createTexts: {
    flex: 1,
    marginRight: SPACING.s,
  },
  createTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  createSubtitle: {
    fontSize: 12,
    color: COLORS.surface,
    opacity: 0.9,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: SPACING.l,
    marginTop: SPACING.s,
    marginBottom: SPACING.s,
  },
  listContent: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.xl,
  },
  storyCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.glassLight,
    borderRadius: SPACING.m,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    marginBottom: SPACING.m,
    padding: SPACING.m,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  imageContainer: {
    marginRight: SPACING.m,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: SPACING.s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiGeneratorCard: {
    margin: SPACING.m,
    padding: SPACING.m,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    ...SHADOWS.small,
  },
  aiIconContainer: {
    width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.m
  },
  aiTextContainer: { flex: 1 },
  aiTitle: { fontWeight: 'bold', fontSize: 16 },
  aiSubtitle: { fontSize: 12, marginTop: 4 },
  
  contentContainer: {
    flex: 1,
  },
  category: {
    fontSize: 10,
    color: COLORS.secondary,
    fontWeight: 'bold',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 2,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  arrowContainer: {
    marginLeft: SPACING.s,
  },
  selectionCheckbox: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
});