import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from './src/constants/theme';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading resources (e.g., fonts, API check)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500); // Show splash for 2.5 seconds

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="dark" />
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
      <StatusBar style="auto" />
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