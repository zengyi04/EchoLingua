import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Text, ActivityIndicator, AppState } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from './src/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const appState = useRef(AppState.currentState);
  const sessionStartTime = useRef(Date.now());

  useEffect(() => {
    // Simulate loading resources (e.g., fonts, API check)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500); // Show splash for 2.5 seconds

    return () => clearTimeout(timer);
  }, []);

  // Track app session time
  useEffect(() => {
    // Record session start time
    sessionStartTime.current = Date.now();

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      // Save session time when app unmounts
      saveLearningTime();
      subscription?.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState) => {
    if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
      // App is going to background - save learning time
      await saveLearningTime();
    } else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App is coming to foreground - reset start time
      sessionStartTime.current = Date.now();
    }
    appState.current = nextAppState;
  };

  const saveLearningTime = async () => {
    try {
      const sessionDuration = Math.floor((Date.now() - sessionStartTime.current) / 1000 / 60); // in minutes
      
      if (sessionDuration > 0) {
        const existingTimeStr = await AsyncStorage.getItem('@total_learning_time');
        const existingTime = existingTimeStr ? parseInt(existingTimeStr) : 0;
        const newTotalTime = existingTime + sessionDuration;
        
        await AsyncStorage.setItem('@total_learning_time', newTotalTime.toString());
        console.log(`✅ Learning time saved: +${sessionDuration} min (Total: ${newTotalTime} min)`);
      }
    } catch (error) {
      console.error('Failed to save learning time:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="light" />
        <Image 
          source={require('./assets/appLogo.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
        <Text style={styles.appName}>EchoLingua</Text>
        <Text style={styles.tagline}>Revitalizing Borneo's Voices</Text>
        <ActivityIndicator size="small" color={COLORS.primary} style={styles.loader} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AppNavigator />
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: COLORS.background, // Use theme background
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.secondary,
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  }
});