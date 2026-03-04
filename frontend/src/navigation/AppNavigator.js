import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';

// Screens
import HomeScreen from '../screens/HomeScreen';
import VocabularyScreen from '../screens/VocabularyScreen';
import StoryScreen from '../screens/StoryScreen';
import StoryLibraryScreen from '../screens/StoryLibraryScreen';
import QuizScreen from '../screens/QuizScreen';
import LearnScreen from '../screens/LearnScreen';
import RecordScreen from '../screens/RecordScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 0,
          elevation: 0,
          ...SHADOWS.medium,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 12,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'LearnTab') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'RecordTab') {
            return (
               <View style={styles.floatingButton}>
                 <Ionicons name="mic" size={32} color={COLORS.surface} />
               </View>
            );
          } else if (route.name === 'StoriesTab') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="LearnTab" component={LearnScreen} options={{ tabBarLabel: 'Learn' }} />
      <Tab.Screen name="RecordTab" component={RecordScreen} options={{ tabBarLabel: '' }} />
      <Tab.Screen name="StoriesTab" component={StoryLibraryScreen} options={{ tabBarLabel: 'Stories' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="Vocabulary" component={VocabularyScreen} />
      <Stack.Screen name="Story" component={StoryScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    top: -24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.large,
  },
});