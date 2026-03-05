import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const CULTURAL_LOCATIONS = [
  {
    id: 'sarawak-cultural-village',
    name: 'Sarawak Cultural Village',
    description: 'Experience authentic Iban, Bidayuh, and other indigenous cultures',
    latitude: 1.7429,
    longitude: 110.2927,
    type: 'Cultural Center',
    languages: ['Iban', 'Bidayuh', 'Malay'],
    icon: 'home',
    color: '#4CAF50',
  },
  {
    id: 'kuching-waterfront',
    name: 'Kuching Waterfront',
    description: 'Historic waterfront with local markets and cultural events',
    latitude: 1.5596,
    longitude: 110.3467,
    type: 'Market',
    languages: ['Malay', 'Chinese', 'Iban'],
    icon: 'storefront',
    color: '#FF9800',
  },
  {
    id: 'sabah-museum',
    name: 'Sabah State Museum',
    description: 'Learn about Kadazan-Dusun and Murut heritage',
    latitude: 5.9805,
    longitude: 116.0989,
    type: 'Museum',
    languages: ['Kadazan', 'Murut', 'Malay'],
    icon: 'library',
    color: '#9C27B0',
  },
  {
    id: 'kota-kinabalu-market',
    name: 'Gaya Street Sunday Market',
    description: 'Traditional market with local vendors and street food',
    latitude: 5.9738,
    longitude: 116.0718,
    type: 'Market',
    languages: ['Kadazan', 'Chinese', 'Malay'],
    icon: 'basket',
    color: '#FF5722',
  },
  {
    id: 'longhouse-visit',
    name: 'Iban Longhouse Skrang River',
    description: 'Authentic Iban longhouse experience',
    latitude: 1.3382,
    longitude: 111.4645,
    type: 'Cultural Center',
    languages: ['Iban'],
    icon: 'home-modern',
    color: '#4CAF50',
  },
  {
    id: 'tamu-donggongon',
    name: 'Tamu Donggongon',
    description: 'Weekly traditional market - practice Kadazan language',
    latitude: 5.8936,
    longitude: 116.1042,
    type: 'Market',
    languages: ['Kadazan', 'Malay'],
    icon: 'storefront',
    color: '#FF9800',
  },
];

export default function MapScreen({ navigation }) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) {
      return CULTURAL_LOCATIONS;
    }

    const query = searchQuery.toLowerCase();
    return CULTURAL_LOCATIONS.filter((location) => {
      return (
        location.name.toLowerCase().includes(query) ||
        location.description.toLowerCase().includes(query) ||
        location.type.toLowerCase().includes(query) ||
        location.languages.some((language) => language.toLowerCase().includes(query))
      );
    });
  }, [searchQuery]);

  const openInGoogleMaps = (location) => {
    const destination = `${location.latitude},${location.longitude}`;
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    Linking.openURL(webUrl);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('MainTabs', { screen: 'HomeTab' });
            }
          }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={28} color={theme.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Cultural Map</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Web list view</Text>
        </View>
      </View>

      <View style={styles.searchWrapper}>
        <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search locations..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.locationsList}>
        <Text style={[styles.countText, { color: theme.textSecondary }]}>
          {filteredLocations.length} {filteredLocations.length === 1 ? 'place' : 'places'}
        </Text>
        {filteredLocations.map((location) => (
          <View
            key={location.id}
            style={[
              styles.locationCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderLeftColor: location.color,
                shadowColor: theme.shadow,
              },
            ]}
          >
            <View style={[styles.locationIconContainer, { backgroundColor: `${location.color}20` }]}>
              <Ionicons name={location.icon} size={24} color={location.color} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={[styles.locationName, { color: theme.text }]}>{location.name}</Text>
              <Text style={[styles.locationDescription, { color: theme.textSecondary }]}>{location.description}</Text>
              <Text style={[styles.locationType, { color: theme.primary }]}>{location.type}</Text>
              <View style={styles.languageTagsContainer}>
                {location.languages.map((language) => (
                  <View key={language} style={[styles.languageTag, { borderColor: theme.border, backgroundColor: theme.glassMedium }]}>
                    <Text style={[styles.languageTagText, { color: theme.textSecondary }]}>{language}</Text>
                  </View>
                ))}
              </View>
            </View>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => openInGoogleMaps(location)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${location.name} in Google Maps`}
            >
              <MaterialCommunityIcons name="map-search" size={26} color={theme.primary} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: SPACING.s,
  },
  headerCenter: {
    flex: 1,
    marginLeft: SPACING.m,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  searchWrapper: {
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.m,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SPACING.m,
    borderWidth: 1,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
  },
  searchIcon: {
    marginRight: SPACING.s,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: SPACING.s,
  },
  locationsList: {
    padding: SPACING.m,
    paddingBottom: SPACING.xl,
  },
  countText: {
    marginBottom: SPACING.s,
    fontSize: 14,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: SPACING.m,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    ...SHADOWS.small,
  },
  locationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.m,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '700',
  },
  locationDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  locationType: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  languageTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: 8,
  },
  languageTag: {
    borderWidth: 1,
    borderRadius: SPACING.xs,
    paddingHorizontal: SPACING.s,
    paddingVertical: 2,
  },
  languageTagText: {
    fontSize: 11,
  },
  mapButton: {
    padding: SPACING.s,
    marginLeft: SPACING.s,
  },
});
