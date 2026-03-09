import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  Linking,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS, GLASS_EFFECTS } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const ROUTE_GREEN = '#4CAF50';
const ROUTE_GREEN_DARK = '#2E7D32';

// Google Maps APIs
const GOOGLE_DIRECTIONS_API = 'https://maps.googleapis.com/maps/api/directions/json';
const GOOGLE_PLACES_API = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const USER_STORAGE_KEY = '@echolingua_current_user';

// Map language IDs to expo-speech language codes
const getLanguageCode = (languageLabel) => {
  const languageMap = {
    'English': 'en',
    'Malay': 'ms',
    'Indonesian': 'id',
    'Spanish': 'es',
    'French': 'fr',
    'Mandarin Chinese': 'zh-CN',
    'Japanese': 'ja',
    'Korean': 'ko',
    'German': 'de',
    'Italian': 'it',
    'Portuguese': 'pt',
    'Russian': 'ru',
    'Thai': 'th',
    'Vietnamese': 'vi',
  };
  return languageMap[languageLabel] || 'en'
};

export default function MapScreen({ navigation }) {
  const { theme } = useTheme();
  const [region, setRegion] = useState({
    latitude: 1.5535,
    longitude: 110.3593,
    latitudeDelta: 5.0,
    longitudeDelta: 5.0,
  });
  const [userLocation, setUserLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [originQuery, setOriginQuery] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [activeSearchField, setActiveSearchField] = useState('destination');
  const [originLocation, setOriginLocation] = useState(null);
  const [isFromFocused, setIsFromFocused] = useState(false);
  const [currentLocationLabel, setCurrentLocationLabel] = useState('Current location');
  const [destination, setDestination] = useState(null);
  const [searchingDestination, setSearchingDestination] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [allSearchResults, setAllSearchResults] = useState([]);
  const [directions, setDirections] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [userLanguage, setUserLanguage] = useState('English');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const mapRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const normalizeText = (value) => (value || '').toString().trim().toLowerCase();

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  useEffect(() => {
    requestLocationPermission();
    loadUserLanguagePreference();
  }, []);

  // Autoplay sound when directions are loaded for selected location
  useEffect(() => {
    if (selectedLocation && directions && !isSpeaking) {
      // Delay slightly to ensure directions are fully rendered
      const autoplayTimer = setTimeout(() => {
        autoplayLocationDetails();
      }, 500);
      return () => clearTimeout(autoplayTimer);
    }
  }, [selectedLocation, directions]);

  const loadUserLanguagePreference = async () => {
    try {
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userData) {
        const user = JSON.parse(userData);
        const languages = Array.isArray(user.languages) ? user.languages : [];
        if (languages.length > 0) {
          setUserLanguage(languages[0]);
        }
      }
    } catch (error) {
      console.error('Error loading user language preference:', error);
    }
  };

  const speakLocationDetails = async (location, distance, duration) => {
    try {
      const languageCode = getLanguageCode(userLanguage);
      const details = `Location: ${location.name}. ${location.description}. Distance: ${distance} kilometers. Estimated time: ${duration}.`;
      
      setIsSpeaking(true);
      await Speech.speak(details, {
        language: languageCode,
        pitch: 1.0,
        rate: 0.9,
        onDone: () => {
          setIsSpeaking(false);
        },
        onError: (error) => {
          console.error('Speech error:', error);
          setIsSpeaking(false);
        },
      });
    } catch (error) {
      console.error('Error speaking location details:', error);
      setIsSpeaking(false);
    }
  };

  const stopLocationDetails = async () => {
    try {
      await Speech.stop();
      setIsSpeaking(false);
    } catch (error) {
      console.error('Error stopping speech:', error);
      setIsSpeaking(false);
    }
  };

  const autoplayLocationDetails = async () => {
    if (!selectedLocation || !directions || isSpeaking) return;
    await speakLocationDetails(selectedLocation, directions.distance, directions.duration);
  };

  // Debounced search function
  const handleSearchQueryChange = (field, text) => {
    setActiveSearchField(field);
    if (field === 'origin') {
      setOriginQuery(text);
    } else {
      setDestinationQuery(text);
    }
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If text is empty, hide results
    if (!text.trim()) {
      setShowSearchResults(false);
      setSearchResults([]);
      setAllSearchResults([]);
      return;
    }

    // Debounce search for 600ms
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(field, text);
    }, 600);
  };

  const performSearch = async (field, queryText) => {
    if (!queryText.trim() || !userLocation) {
      return;
    }

    setActiveSearchField(field);

    // Fast local case-insensitive filter while remote search is in progress.
    const normalizedQuery = normalizeText(queryText);
    if (allSearchResults.length > 0) {
      const locallyMatched = allSearchResults.filter((item) => {
        const name = normalizeText(item.name);
        const desc = normalizeText(item.description);
        return name.includes(normalizedQuery) || desc.includes(normalizedQuery);
      });

      if (locallyMatched.length > 0) {
        setSearchResults(locallyMatched.slice(0, 20));
        setShowSearchResults(true);
      }
    }

    await searchPlacesWithGoogle(field, queryText);
  };

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

        // Best effort reverse geocode to show a human-readable current location.
        try {
          const address = await Location.reverseGeocodeAsync(userCoords);
          if (address && address.length > 0) {
            const first = address[0];
            const number = first.streetNumber ? `${first.streetNumber} ` : '';
            const street = first.street || first.name || '';
            const city = first.city || first.subregion || first.region || '';
            const label = `${number}${street}${city ? `, ${city}` : ''}`.trim();
            if (label) {
              setCurrentLocationLabel(label);
            }
          }
        } catch (geocodeError) {
          console.warn('Reverse geocode failed:', geocodeError);
        }
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

  const useCurrentLocationAsOrigin = () => {
    if (!userLocation) {
      Alert.alert('Location unavailable', 'Please enable location first.');
      return;
    }

    const currentAsOrigin = {
      id: 'current-location-origin',
      name: currentLocationLabel,
      description: 'Your current location',
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      type: 'current_location',
      languages: ['Global'],
      icon: 'locate',
      color: ROUTE_GREEN,
    };

    setOriginLocation(currentAsOrigin);
    setOriginQuery(currentLocationLabel);
    setShowSearchResults(false);
    setIsFromFocused(false);

    if (destination) {
      fetchDirections(destination, currentAsOrigin);
    }
  };

  // Helper function to calculate distance between coordinates

  const triggerSearchForField = async (field) => {
    const queryText = field === 'origin' ? originQuery : destinationQuery;

    if (!queryText.trim() || !userLocation) {
      Alert.alert('Error', 'Please enable location and enter a search term');
      return;
    }

    setActiveSearchField(field);
    await searchPlacesWithGoogle(field, queryText);
  };

  // Search places worldwide using Google Places API
  const searchPlacesWithGoogle = async (field, queryText) => {
    if (!queryText.trim() || !userLocation) {
      return;
    }

    try {
      setSearchingDestination(true);
      
      // Use Google Places API Text Search
      const encoded = encodeURIComponent(queryText.trim());
      const url = `${GOOGLE_PLACES_API}?query=${encoded}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        // Convert Google Places results to our format
        const googleResults = data.results.map((result, idx) => ({
          id: `place-${result.place_id}-${idx}`,
          name: result.name,
          description: result.formatted_address,
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          type: result.types?.[0] || 'Location',
          languages: ['Global'],
          icon: 'location',
          color: ROUTE_GREEN_DARK,
          placeId: result.place_id,
        }));

        // Calculate distances and sort by distance (nearest first)
        const resultsWithDistance = googleResults.map(location => ({
          ...location,
          distance: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            location.latitude,
            location.longitude
          )
        })).sort((a, b) => a.distance - b.distance);

        setAllSearchResults(resultsWithDistance);
        setSearchResults(resultsWithDistance.slice(0, 20));
        setShowSearchResults(true);
      } else {
        Alert.alert('No Results', 'Could not find any matching places. Try a different search term.');
        setSearchResults([]);
        setAllSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Google Places search error:', error);
      Alert.alert('Search Error', 'Unable to search places. Please try again.');
    } finally {
      setSearchingDestination(false);
    }
  };

  // Load more results when user scrolls to bottom
  const loadMoreResults = () => {
    if (loadingMore || searchResults.length >= allSearchResults.length) {
      return;
    }

    setLoadingMore(true);
    setTimeout(() => {
      const nextIndex = searchResults.length;
      const moreResults = allSearchResults.slice(nextIndex, nextIndex + 10);
      setSearchResults([...searchResults, ...moreResults]);
      setLoadingMore(false);
    }, 300);
  };

  // Fetch directions from current location to destination
  const fetchDirections = async (dest, originOverride = null) => {
    const activeOrigin = originOverride || originLocation || userLocation;
    if (!activeOrigin || !dest) {
      return;
    }

    try {
      const origin = `${activeOrigin.latitude},${activeOrigin.longitude}`;
      const destination = `${dest.latitude},${dest.longitude}`;
      
      const url = `${GOOGLE_DIRECTIONS_API}?origin=${origin}&destination=${destination}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        
        setDirections({
          distance: leg.distance.text,
          duration: leg.duration.text,
          steps: leg.steps,
        });

        // Decode polyline to get route coordinates
        const points = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(points);
      }
    } catch (error) {
      console.error('Directions fetch error:', error);
    }
  };

  // Decode polyline from Google Directions API
  const decodePolyline = (encoded) => {
    let points = [];
    let index = 0, lat = 0, lng = 0;
    let changes = 0;
    
    while (index < encoded.length) {
      let llat = 0;
      for (let shift = 0; ; shift += 5) {
        let byte = encoded.charCodeAt(index++) - 63;
        llat |= (byte & 0x1f) << shift;
        if (byte < 0x20) break;
      }
      let dlat = ((llat & 1) ? ~(llat >> 1) : (llat >> 1));
      lat += dlat;
      
      let llon = 0;
      for (let shift = 0; ; shift += 5) {
        let byte = encoded.charCodeAt(index++) - 63;
        llon |= (byte & 0x1f) << shift;
        if (byte < 0x20) break;
      }
      let dlng = ((llon & 1) ? ~(llon >> 1) : (llon >> 1));
      lng += dlng;
      
      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5
      });
    }
    return points;
  };

  const handleMarkerPress = (location) => {
    setDestination(location);
    setSelectedLocation(location);
    fetchDirections(location);
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
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

  const renderLocationCard = (location) => {
    // Use the pre-calculated distance if available (from search results)
    // Otherwise calculate it
    let distance = location.distance;
    if (distance === undefined && userLocation) {
      distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        location.latitude,
        location.longitude
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.locationCard, 
          { 
            borderLeftColor: location.color, 
            backgroundColor: theme.surface, 
            borderColor: theme.border,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }
        ]}
        onPress={() => {
          if (activeSearchField === 'origin') {
            setOriginLocation(location);
            setOriginQuery(location.name);
            if (destination) {
              fetchDirections(destination, location);
            }
          } else {
            handleMarkerPress(location);
            setDestination(location);
            setDestinationQuery(location.name);
          }
          setShowSearchResults(false);
          // Animate map to show the selected location
          mapRef.current?.animateToRegion({
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          });
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.locationIconContainer, { backgroundColor: location.color + '20' }]}>
          <Ionicons name={location.icon} size={28} color={location.color} />
        </View>
        <View style={styles.locationInfo}>
          <View style={styles.locationNameRow}>
            <Text style={[styles.locationName, { color: theme.text }]}>{location.name}</Text>
            {distance !== undefined && distance !== null && (
              <Text style={[styles.distanceText, { color: theme.textSecondary }]}>{distance.toFixed(1)} km</Text>
            )}
          </View>
          <Text style={[styles.locationDescription, { color: theme.textSecondary }]} numberOfLines={2}>
            {location.description}
          </Text>
          <View style={styles.languageTagsContainer}>
            {location.languages.map((lang, idx) => (
              <View key={idx} style={[styles.languageTag, { backgroundColor: theme.glassMedium, borderColor: theme.border }]}>
                <Text style={[styles.languageTagText, { color: theme.textSecondary }]}>{lang}</Text>
              </View>
            ))}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading map...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {/* Show destination marker */}
        {destination && (
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

        {originLocation && (
          <Marker
            key={`origin-${originLocation.id}`}
            coordinate={{
              latitude: originLocation.latitude,
              longitude: originLocation.longitude,
            }}
            title={originLocation.name}
            description={'Start location'}
            pinColor={ROUTE_GREEN}
          />
        )}

        {/* Show route polyline from current location to destination */}
        {routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={ROUTE_GREEN}
            strokeWidth={5}
          />
        )}
      </MapView>

      {/* Floating Route Panel */}
      <View style={styles.searchWrapper}>
        <View style={[styles.routePanel, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: theme.shadow }]}> 
          <View style={styles.routePanelHeader}>
            <TouchableOpacity
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('MainTabs', { screen: 'HomeTab' });
                }
              }}
              style={[styles.roundIconButton, { backgroundColor: theme.glassMedium }]}
            >
              <Ionicons name="chevron-back" size={18} color={theme.primary} />
            </TouchableOpacity>
            <Text style={[styles.routeTitle, { color: theme.text }]}>Route Planner</Text>
            <TouchableOpacity onPress={centerOnUserLocation} style={[styles.roundIconButton, { backgroundColor: theme.glassMedium }]}> 
              <MaterialCommunityIcons name="crosshairs-gps" size={18} color={theme.primary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.searchContainer, { backgroundColor: theme.background, borderColor: theme.border }]}> 
            <Ionicons name="locate" size={16} color={ROUTE_GREEN_DARK} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="From (current location or search)"
              placeholderTextColor={theme.textSecondary}
              value={originQuery}
              onChangeText={(text) => handleSearchQueryChange('origin', text)}
              autoCapitalize="none"
              onFocus={() => {
                setActiveSearchField('origin');
                setIsFromFocused(true);
                if (originQuery) setShowSearchResults(true);
              }}
              onBlur={() => {
                setTimeout(() => setIsFromFocused(false), 120);
              }}
            />
            <TouchableOpacity onPress={useCurrentLocationAsOrigin} style={styles.fromLocateButton}>
              <MaterialCommunityIcons name="crosshairs-gps" size={22} color={ROUTE_GREEN_DARK} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => triggerSearchForField('origin')} disabled={searchingDestination}>
              <Ionicons
                name={searchingDestination ? 'time-outline' : 'arrow-forward-circle'}
                size={20}
                color={ROUTE_GREEN_DARK}
              />
            </TouchableOpacity>
            {originQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setOriginQuery('');
                setOriginLocation(null);
                setShowSearchResults(false);
              }}>
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.searchContainer, { backgroundColor: theme.background, borderColor: theme.border }]}> 
            <Ionicons name="search" size={18} color={theme.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search destination..."
              placeholderTextColor={theme.textSecondary}
              value={destinationQuery}
              onChangeText={(text) => handleSearchQueryChange('destination', text)}
              autoCapitalize="none"
              onFocus={() => {
                setActiveSearchField('destination');
                if (destinationQuery) setShowSearchResults(true);
              }}
            />
            <TouchableOpacity onPress={() => triggerSearchForField('destination')} disabled={searchingDestination}>
              <Ionicons
                name={searchingDestination ? 'time-outline' : 'arrow-forward-circle'}
                size={20}
                color={ROUTE_GREEN_DARK}
              />
            </TouchableOpacity>
            {destinationQuery.length > 0 && (
              <TouchableOpacity onPress={() => {
                setDestinationQuery('');
                setShowSearchResults(false);
              }}>
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {directions && (
            <View style={styles.routeSummaryRow}>
              <View style={[styles.routeChip, { backgroundColor: theme.glassMedium, borderColor: theme.border }]}> 
                <Text style={[styles.routeChipTitle, { color: theme.textSecondary }]}>Shortest</Text>
                <Text style={[styles.routeChipValue, { color: theme.text }]}>{directions.duration} • {directions.distance}</Text>
              </View>
              <View style={[styles.routeChip, styles.routeChipGreen]}> 
                <Text style={styles.routeChipTitleGreen}>Greenest</Text>
                <Text style={styles.routeChipValueGreen}>{directions.duration} • {directions.distance}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <View 
            style={[styles.searchResultsDropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={[styles.searchResultsHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.searchResultsTitle, { color: theme.text }]}>
                {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}{allSearchResults.length > searchResults.length ? ` of ${allSearchResults.length}` : ''}
              </Text>
              <Text style={[styles.searchResultsSubtitle, { color: theme.textSecondary }]}>Sorted by distance • Scroll to see more</Text>
            </View>
            <FlatList
              style={{ height: 480 }}
              data={searchResults}
              renderItem={({ item }) => renderLocationCard(item)}
              keyExtractor={(item, index) => item.id || index.toString()}
              showsVerticalScrollIndicator={true}
              onEndReached={loadMoreResults}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                <View style={{ padding: SPACING.l, alignItems: 'center' }}>
                  {loadingMore ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <Text style={[styles.endOfResultsText, { color: theme.textSecondary }]}>
                      {searchResults.length === allSearchResults.length
                        ? `All ${allSearchResults.length} places loaded`
                        : `Showing ${searchResults.length} of ${allSearchResults.length} places`
                      }
                    </Text>
                  )}
                </View>
              }
            />
          </View>
        )}
      </View>

      {/* Selected Location Detail Card */}
      {selectedLocation && (
        <View style={[styles.detailCard, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}>
          <View style={styles.detailHeader}>
            <View style={styles.detailTitleContainer}>
              <Ionicons name={selectedLocation.icon} size={24} color={selectedLocation.color} />
              <Text style={[styles.detailTitle, { color: theme.text }]}>{selectedLocation.name}</Text>
            </View>
            <TouchableOpacity onPress={() => {
              stopLocationDetails();
              setSelectedLocation(null);
            }}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.detailType, { color: theme.primary }]}>{selectedLocation.type}</Text>
          <Text style={[styles.detailDescription, { color: theme.textSecondary }]}>{selectedLocation.description}</Text>

          {/* Show directions info from Google Directions API */}
          {directions && (
            <View style={[styles.directionsBox, { backgroundColor: theme.glassMedium, borderColor: theme.primary }]}>
              <View style={styles.directionsRow}>
                <Ionicons name="navigate" size={20} color={theme.primary} />
                <Text style={[styles.directionsText, { color: theme.text }]}>
                  {directions.distance}
                </Text>
              </View>
              <View style={styles.directionsRow}>
                <Ionicons name="time" size={20} color={theme.secondary} />
                <Text style={[styles.directionsText, { color: theme.text }]}>
                  {directions.duration}
                </Text>
              </View>
            </View>
          )}

          {/* Autoplay speaking indicator with stop control */}
          {directions && (
            <View style={[styles.speakContainer, { backgroundColor: theme.primary }]}>
              <View style={styles.speakStatusRow}>
                {isSpeaking ? (
                  <>
                    <View style={styles.speakingIndicator}>
                      <View style={[styles.speakingDot, { backgroundColor: theme.surface }]} />
                      <Text style={[styles.speakingText, { color: theme.surface }]}>Now Reading...</Text>
                    </View>
                    <TouchableOpacity
                      onPress={stopLocationDetails}
                      style={styles.stopButton}
                    >
                      <Ionicons name="stop-circle" size={28} color={theme.surface} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={[styles.readyToPlayText, { color: theme.surface }]}>
                    📢 Information will be read aloud...
                  </Text>
                )}
              </View>
            </View>
          )}

          <View style={styles.languageList}>
            <Text style={[styles.languageListTitle, { color: theme.text }]}>Location:</Text>
            <View style={styles.languageTagsContainer}>
              <View style={[styles.languageTag, styles.languageTagLarge, { backgroundColor: theme.glassMedium, borderColor: theme.border }]}>
                <Text style={[styles.languageTagText, { color: theme.text }]}>{selectedLocation.type}</Text>
              </View>
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
  searchWrapper: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: SPACING.m,
  },
  routePanel: {
    borderRadius: SPACING.m,
    borderWidth: 1,
    padding: SPACING.s,
    ...SHADOWS.large,
  },
  routePanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.s,
  },
  routeTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  roundIconButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fromLocateButton: {
    marginTop: 6,
    marginRight: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.xs,
    paddingHorizontal: SPACING.m,
    paddingVertical: 7,
    borderRadius: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  fromLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  routeSummaryRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },
  routeChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: SPACING.xs,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  routeChipGreen: {
    backgroundColor: '#E7F6EA',
    borderColor: ROUTE_GREEN,
  },
  routeChipTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  routeChipValue: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  routeChipTitleGreen: {
    fontSize: 11,
    fontWeight: '600',
    color: ROUTE_GREEN_DARK,
  },
  routeChipValueGreen: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    color: ROUTE_GREEN_DARK,
  },
  searchResultsDropdown: {
    position: 'absolute',
    top: 214,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.m,
    ...SHADOWS.large,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 1000,
  },
  searchResultsHeader: {
    padding: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.glassLight,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  searchResultsSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
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
    paddingVertical: SPACING.m,
    borderTopLeftRadius: SPACING.l,
    borderTopRightRadius: SPACING.l,
    borderTopWidth: 1,
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
    width: 334,
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
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: SPACING.l,
    borderTopRightRadius: SPACING.l,
    borderTopWidth: 2,
    borderTopColor: COLORS.primary,
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
    backgroundColor: ROUTE_GREEN,
  },
  googleButton: {
    backgroundColor: ROUTE_GREEN_DARK,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  endOfResultsText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  directionsBox: {
    marginVertical: SPACING.m,
    padding: SPACING.m,
    borderRadius: SPACING.m,
    borderLeftWidth: 4,
    backgroundColor: COLORS.glassMedium,
  },
  directionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  directionsText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.m,
    color: COLORS.text,
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.m,
    marginVertical: SPACING.m,
    borderRadius: SPACING.m,
    gap: SPACING.s,
    backgroundColor: COLORS.primary,
    ...SHADOWS.small,
  },
  speakButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.surface,
  },
  speakContainer: {
    marginVertical: SPACING.m,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderRadius: SPACING.m,
    backgroundColor: COLORS.primary,
    ...SHADOWS.small,
  },
  speakStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.m,
  },
  speakingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.surface,
    opacity: 0.9,
  },
  speakingText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.surface,
  },
  readyToPlayText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.surface,
    textAlign: 'center',
    flex: 1,
  },
  stopButton: {
    padding: SPACING.s,
  },
});
