import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Linking,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, GLASS_EFFECTS } from '../constants/theme';

const GOOGLE_MAPS_API_KEY = 'AIzaSyD04MCoHQ_n0U7ODku5-bY5uKeU237_o0k';

const WORLD_SEARCH_API = 'https://nominatim.openstreetmap.org/search';

// Cultural and language learning locations in Borneo
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
  const [region, setRegion] = useState({
    latitude: 1.5535,
    longitude: 110.3593,
    latitudeDelta: 5.0,
    longitudeDelta: 5.0,
  });
  const [userLocation, setUserLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLocations, setFilteredLocations] = useState(CULTURAL_LOCATIONS);
  const [destination, setDestination] = useState(null);
  const [searchingDestination, setSearchingDestination] = useState(false);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    filterLocations(searchQuery);
  }, [searchQuery]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        const userCoords = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        setUserLocation(userCoords);
        setRegion({
          ...userCoords,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        });
      } else {
        Alert.alert(
          'Location Permission',
          'Location permission is needed to show your position on the map.'
        );
      }
    } catch (error) {
      console.error('Location permission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLocations = (query) => {
    if (!query.trim()) {
      setFilteredLocations(CULTURAL_LOCATIONS);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = CULTURAL_LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(lowercaseQuery) ||
        loc.description.toLowerCase().includes(lowercaseQuery) ||
        loc.type.toLowerCase().includes(lowercaseQuery) ||
        loc.languages.some((lang) => lang.toLowerCase().includes(lowercaseQuery))
    );
    setFilteredLocations(filtered);
  };

  const handleMarkerPress = (location) => {
    setDestination(location);
    setSelectedLocation(location);
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  const searchWorldDestination = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    try {
      setSearchingDestination(true);
      const encoded = encodeURIComponent(searchQuery.trim());
      const url = `${WORLD_SEARCH_API}?q=${encoded}&format=json&limit=1`;
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'EchoLinguaBorneo/1.0 (learning-app)',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to search destination.');
      }

      const results = await response.json();
      if (!Array.isArray(results) || results.length === 0) {
        Alert.alert('No Results', 'Could not find that place. Try a more specific destination.');
        return;
      }

      const top = results[0];
      const worldDestination = {
        id: `world-${Date.now()}`,
        name: top.display_name.split(',')[0] || searchQuery.trim(),
        description: top.display_name,
        latitude: parseFloat(top.lat),
        longitude: parseFloat(top.lon),
        type: 'World Destination',
        languages: ['Global'],
        icon: 'pin',
        color: '#1976D2',
      };

      setDestination(worldDestination);
      setSelectedLocation(worldDestination);
      mapRef.current?.animateToRegion({
        latitude: worldDestination.latitude,
        longitude: worldDestination.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      });
    } catch (error) {
      console.error('World destination search failed:', error);
      Alert.alert('Search Error', 'Unable to find destination right now. Please try again.');
    } finally {
      setSearchingDestination(false);
    }
  };

  const openInWaze = (location) => {
    const wazeUrl = Platform.select({
      ios: `waze://?ll=${location.latitude},${location.longitude}&navigate=yes&z=10`,
      android: `waze://?ll=${location.latitude},${location.longitude}&navigate=yes`,
    });

    Linking.canOpenURL(wazeUrl).then((supported) => {
      if (supported) {
        Linking.openURL(wazeUrl);
      } else {
        // Fallback to Waze web or store
        const webUrl = `https://www.waze.com/ul?ll=${location.latitude},${location.longitude}&navigate=yes`;
        Linking.openURL(webUrl).catch(() => {
          Alert.alert(
            'Waze Not Installed',
            'Please install Waze app to use navigation.',
            [
              {
                text: 'Install Waze',
                onPress: () => {
                  const storeUrl = Platform.select({
                    ios: 'https://apps.apple.com/app/waze-navigation-live-traffic/id323229106',
                    android: 'https://play.google.com/store/apps/details?id=com.waze',
                  });
                  Linking.openURL(storeUrl);
                },
              },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
        });
      }
    });
  };

  const openInGoogleMaps = (location) => {
    const hasOrigin = Boolean(userLocation);
    const destinationCoords = `${location.latitude},${location.longitude}`;
    const originCoords = hasOrigin
      ? `${userLocation.latitude},${userLocation.longitude}`
      : '';
    const googleMapsUrl = Platform.select({
      ios: hasOrigin
        ? `maps://app?saddr=${originCoords}&daddr=${destinationCoords}`
        : `maps://app?daddr=${destinationCoords}`,
      android: hasOrigin
        ? `google.navigation:q=${destinationCoords}&mode=d`
        : `google.navigation:q=${destinationCoords}`,
    });

    Linking.openURL(googleMapsUrl).catch(() => {
      // Fallback to web version
      const webUrl = hasOrigin
        ? `https://www.google.com/maps/dir/?api=1&origin=${originCoords}&destination=${destinationCoords}&travelmode=driving`
        : `https://www.google.com/maps/dir/?api=1&destination=${destinationCoords}&travelmode=driving`;
      Linking.openURL(webUrl);
    });
  };

  const centerOnUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  const renderLocationCard = (location) => (
    <TouchableOpacity
      key={location.id}
      style={[styles.locationCard, { borderLeftColor: location.color }]}
      onPress={() => handleMarkerPress(location)}
      activeOpacity={0.7}
    >
      <View style={[styles.locationIconContainer, { backgroundColor: location.color + '20' }]}>
        <Ionicons name={location.icon} size={28} color={location.color} />
      </View>
      <View style={styles.locationInfo}>
        <Text style={styles.locationName}>{location.name}</Text>
        <Text style={styles.locationDescription} numberOfLines={2}>
          {location.description}
        </Text>
        <View style={styles.languageTagsContainer}>
          {location.languages.map((lang, idx) => (
            <View key={idx} style={styles.languageTag}>
              <Text style={styles.languageTagText}>{lang}</Text>
            </View>
          ))}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Cultural Map</Text>
          <Text style={styles.headerSubtitle}>Discover language learning places</Text>
        </View>
        <TouchableOpacity onPress={centerOnUserLocation} style={styles.locationButton}>
          <MaterialCommunityIcons name="crosshairs-gps" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search any world destination..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={searchWorldDestination}
        />
        <TouchableOpacity onPress={searchWorldDestination} disabled={searchingDestination}>
          <Ionicons
            name={searchingDestination ? 'time-outline' : 'locate'}
            size={20}
            color={COLORS.primary}
          />
        </TouchableOpacity>
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {filteredLocations.map((location) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={location.name}
            description={location.description}
            onPress={() => handleMarkerPress(location)}
            pinColor={location.color}
          />
        ))}
        {destination && !filteredLocations.some((item) => item.id === destination.id) && (
          <Marker
            key={destination.id}
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            title={destination.name}
            description={destination.description}
            onPress={() => handleMarkerPress(destination)}
            pinColor={destination.color}
          />
        )}
      </MapView>

      {/* Selected Location Detail Card */}
      {selectedLocation && (
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={styles.detailTitleContainer}>
              <Ionicons name={selectedLocation.icon} size={24} color={selectedLocation.color} />
              <Text style={styles.detailTitle}>{selectedLocation.name}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedLocation(null)}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.detailType}>{selectedLocation.type}</Text>
          <Text style={styles.detailDescription}>{selectedLocation.description}</Text>

          <View style={styles.languageList}>
            <Text style={styles.languageListTitle}>Languages:</Text>
            <View style={styles.languageTagsContainer}>
              {selectedLocation.languages.map((lang, idx) => (
                <View key={idx} style={[styles.languageTag, styles.languageTagLarge]}>
                  <Text style={styles.languageTagText}>{lang}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[styles.navButton, styles.wazeButton]}
              onPress={() => openInWaze(selectedLocation)}
            >
              <MaterialCommunityIcons name="waze" size={24} color={COLORS.surface} />
              <Text style={styles.navButtonText}>Waze</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, styles.googleButton]}
              onPress={() => openInGoogleMaps(selectedLocation)}
            >
              <Ionicons name="navigate" size={24} color={COLORS.surface} />
              <Text style={styles.navButtonText}>Google Maps</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Locations List */}
      {!selectedLocation && (
        <View style={styles.locationsList}>
          <View style={styles.locationsHeader}>
            <Text style={styles.locationsTitle}>
              {filteredLocations.length} {filteredLocations.length === 1 ? 'Place' : 'Places'}
            </Text>
            {searchQuery && (
              <Text style={styles.searchResults}>for "{searchQuery}"</Text>
            )}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.locationsScrollContent}
          >
            {filteredLocations.map((location) => renderLocationCard(location))}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.m,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    backgroundColor: COLORS.glassLight,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.4)',
    ...SHADOWS.small,
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
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  locationButton: {
    padding: SPACING.s,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassLight,
    margin: SPACING.m,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: SPACING.m,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    ...SHADOWS.small,
  },
  searchIcon: {
    marginRight: SPACING.s,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: SPACING.s,
  },
  map: {
    flex: 1,
  },
  locationsList: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.glassLight,
    paddingVertical: SPACING.m,
    borderTopLeftRadius: SPACING.l,
    borderTopRightRadius: SPACING.l,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    ...SHADOWS.large,
    maxHeight: 220,
  },
  locationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.s,
  },
  locationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  searchResults: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: SPACING.s,
  },
  locationsScrollContent: {
    paddingHorizontal: SPACING.m,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.m,
    marginHorizontal: SPACING.s,
    borderRadius: SPACING.m,
    borderLeftWidth: 4,
    width: 320,
    ...SHADOWS.small,
  },
  locationIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  locationDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.s,
  },
  languageTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  languageTag: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.s,
    paddingVertical: 2,
    borderRadius: SPACING.xs,
  },
  languageTagLarge: {
    paddingVertical: 4,
    paddingHorizontal: SPACING.m,
  },
  languageTagText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  detailCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.glassLight,
    borderTopLeftRadius: SPACING.l,
    borderTopRightRadius: SPACING.l,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    padding: SPACING.l,
    ...SHADOWS.large,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  detailTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.m,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  detailType: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '600',
    marginBottom: SPACING.s,
  },
  detailDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.m,
  },
  languageList: {
    marginBottom: SPACING.m,
  },
  languageListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.s,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: SPACING.m,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.m,
    borderRadius: SPACING.m,
    gap: SPACING.s,
    ...SHADOWS.small,
  },
  wazeButton: {
    backgroundColor: '#33CCFF',
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
});
