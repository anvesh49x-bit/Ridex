import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

const COLORS = {
  black: '#0A0A0A',
  blackSoft: '#171717',
  white: '#FFFFFF',
  offWhite: '#F7F7F5',
  softGray: '#E8E8E6',
  gray: '#707070',
  muted: '#A1A1A1',
  gold: '#C9A227',
  goldSoft: '#F4EED2',
  mapBackground: '#ECECEA',
};

type Coordinates = {
  lat: number;
  lng: number;
};

type LocationState = {
  name: string;
  address: string;
  coordinates: Coordinates | null;
};

export default function HomeScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    pickupName?: string;
    pickupAddress?: string;
    pickupLat?: string;
    pickupLng?: string;
    dropName?: string;
    dropAddress?: string;
    dropLat?: string;
    dropLng?: string;
  }>();

  const [pickup, setPickup] = useState<LocationState>({
    name: params.pickupName || 'Current location',
    address: params.pickupAddress || '',
    coordinates: parseCoordinates(params.pickupLat, params.pickupLng),
  });

  const [loadingPickup, setLoadingPickup] = useState(false);
  const [locationError, setLocationError] = useState('');

  const destinationCoordinates = useMemo(
    () => parseCoordinates(params.dropLat, params.dropLng),
    [params.dropLat, params.dropLng],
  );

  const hasDestination = Boolean(destinationCoordinates);

  const mapCenter = useMemo<Coordinates>(() => {
    if (pickup.coordinates) return pickup.coordinates;
    if (destinationCoordinates) return destinationCoordinates;
    return { lat: 16.5062, lng: 80.6480 };
  }, [pickup.coordinates, destinationCoordinates]);

  const loadCurrentPickup = useCallback(async () => {
    try {
      setLoadingPickup(true);
      setLocationError('');

      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setLocationError('Location permission is needed to find your pickup point.');
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const latitude = current.coords.latitude;
      const longitude = current.coords.longitude;

      let address = 'Current location';
      let name = 'Current location';

      try {
        const places = await Location.reverseGeocodeAsync({ latitude, longitude });

        if (places.length > 0) {
          const place = places[0];
          const parts = [
            place.name,
            place.street,
            place.district,
            place.city,
            place.region,
            place.postalCode,
          ].filter(Boolean);

          if (parts.length > 0) {
            address = parts.join(', ');
          }

          name = place.name || place.street || place.city || 'Current location';
        }
      } catch (error) {
        console.warn('RIDEX: Home reverse geocoding failed:', error);
      }

      console.log('RIDEX: Home current GPS location:', latitude, longitude);

      setPickup({
        name,
        address,
        coordinates: { lat: latitude, lng: longitude },
      });
    } catch (error) {
      console.error('RIDEX: Home current location error:', error);
      setLocationError('Unable to find your current location.');
    } finally {
      setLoadingPickup(false);
    }
  }, []);

  useEffect(() => {
    if (params.pickupLat && params.pickupLng) {
      setPickup({
        name: params.pickupName || 'Current location',
        address: params.pickupAddress || '',
        coordinates: parseCoordinates(params.pickupLat, params.pickupLng),
      });
      return;
    }

    loadCurrentPickup();
  }, [
    loadCurrentPickup,
    params.pickupAddress,
    params.pickupLat,
    params.pickupLng,
    params.pickupName,
  ]);

  const openPickupLocation = useCallback(() => {
    router.push({
      pathname: '/location-picker',
      params: { type: 'pickup' },
    });
  }, [router]);

  const openDestinationLocation = useCallback(() => {
    router.push({
      pathname: '/location-picker',
      params: {
        type: 'drop',
        pickupName: pickup.name,
        pickupAddress: pickup.address,
        pickupLat: pickup.coordinates ? String(pickup.coordinates.lat) : '',
        pickupLng: pickup.coordinates ? String(pickup.coordinates.lng) : '',
      },
    });
  }, [router, pickup]);

  const openTripDetails = useCallback(() => {
    if (!pickup.coordinates) {
      loadCurrentPickup();
      return;
    }

    if (!destinationCoordinates) {
      openDestinationLocation();
      return;
    }

    router.push({
      pathname: '/trip-details',
      params: {
        pickupName: pickup.name,
        pickupAddress: pickup.address,
        pickupLat: String(pickup.coordinates.lat),
        pickupLng: String(pickup.coordinates.lng),
        dropName: params.dropName || 'Destination',
        dropAddress: params.dropAddress || '',
        dropLat: String(destinationCoordinates.lat),
        dropLng: String(destinationCoordinates.lng),
      },
    });
  }, [
    destinationCoordinates,
    loadCurrentPickup,
    openDestinationLocation,
    params.dropAddress,
    params.dropName,
    pickup,
    router,
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>RIDEX</Text>
            <Text style={styles.tagline}>Where are you going?</Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="car-outline" size={20} color={COLORS.white} />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.question}>Where are you going?</Text>
          <Text style={styles.helper}>We’ll find your pickup automatically.</Text>

          <View style={styles.locationCard}>
            <View style={styles.routeRail}>
              <View style={styles.pickupDot} />
              <View style={styles.routeLine} />
              <View style={styles.dropDot} />
            </View>

            <View style={styles.locationBody}>
              <View style={styles.locationBlock}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>FROM</Text>
                  <Pressable onPress={openPickupLocation} hitSlop={8}>
                    <Text style={styles.changeText}>Change pickup</Text>
                  </Pressable>
                </View>

                <Pressable onPress={openPickupLocation} style={styles.valueRow}>
                  <View style={styles.valueTextWrap}>
                    <Text style={styles.valueTitle} numberOfLines={1}>
                      {loadingPickup ? 'Finding your location…' : pickup.name}
                    </Text>
                    <Text style={styles.valueAddress} numberOfLines={2}>
                      {loadingPickup ? 'Please wait a moment' : pickup.address || 'Current location'}
                    </Text>
                  </View>
                  {loadingPickup ? (
                    <ActivityIndicator size="small" color={COLORS.gold} />
                  ) : (
                    <Ionicons name="chevron-forward" size={22} color={COLORS.muted} />
                  )}
                </Pressable>
              </View>

              <View style={styles.separator} />

              <View style={styles.locationBlock}>
                <Text style={styles.label}>TO</Text>
                <Pressable onPress={openDestinationLocation} style={styles.destinationButton}>
                  <View style={styles.destinationIcon}>
                    <Ionicons name="search" size={20} color={COLORS.white} />
                  </View>
                  <View style={styles.valueTextWrap}>
                    <Text
                      style={[styles.valueTitle, !params.dropName && styles.placeholderTitle]}
                      numberOfLines={1}
                    >
                      {params.dropName || 'Choose destination'}
                    </Text>
                    <Text
                      style={[styles.valueAddress, !params.dropAddress && styles.placeholderAddress]}
                      numberOfLines={1}
                    >
                      {params.dropAddress || 'Tap here to select where you want to go'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={22} color={COLORS.muted} />
                </Pressable>
              </View>
            </View>
          </View>

          {locationError ? (
            <Pressable onPress={loadCurrentPickup} style={styles.errorCard}>
              <Ionicons name="location-outline" size={19} color={COLORS.black} />
              <Text style={styles.errorText}>{locationError} Tap to retry.</Text>
            </Pressable>
          ) : null}

          <View style={styles.mapCard}>
            <MapView
              style={StyleSheet.absoluteFill}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: mapCenter.lat,
                longitude: mapCenter.lng,
                latitudeDelta: 0.055,
                longitudeDelta: 0.055,
              }}
              showsCompass={false}
              showsScale={false}
              showsBuildings={false}
              showsIndoors={false}
              toolbarEnabled={false}
              zoomEnabled
              scrollEnabled
              rotateEnabled={false}
              pitchEnabled={false}
            >
              {pickup.coordinates ? (
                <Marker
                  coordinate={{
                    latitude: pickup.coordinates.lat,
                    longitude: pickup.coordinates.lng,
                  }}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={styles.mapPickupMarker}>
                    <View style={styles.mapPickupCenter} />
                  </View>
                </Marker>
              ) : null}

              {destinationCoordinates ? (
                <Marker
                  coordinate={{
                    latitude: destinationCoordinates.lat,
                    longitude: destinationCoordinates.lng,
                  }}
                  anchor={{ x: 0.5, y: 1 }}
                >
                  <Ionicons name="location" size={38} color={COLORS.black} />
                </Marker>
              ) : null}
            </MapView>

            <View style={styles.mapLabel}>
              <Ionicons name="navigate-outline" size={16} color={COLORS.gold} />
              <Text style={styles.mapLabelText}>
                {hasDestination ? 'Route ready' : 'Your pickup location'}
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.primaryButton}
            onPress={openTripDetails}
            disabled={loadingPickup}
          >
            <Text style={styles.primaryButtonText}>
              {hasDestination ? 'Continue' : 'Choose destination'}
            </Text>
            <Ionicons name="arrow-forward" size={24} color={COLORS.white} />
          </Pressable>

          <Text style={styles.footerText}>Simple booking. Clear pricing. Your choice.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function parseCoordinates(lat?: string, lng?: string): Coordinates | null {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  if (latitude === 0 && longitude === 0) return null;

  return { lat: latitude, lng: longitude };
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.offWhite },
  screen: { flex: 1, backgroundColor: COLORS.offWhite },
  header: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.black,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  brand: { fontSize: 24, fontWeight: '900', letterSpacing: 2.5, color: COLORS.white },
  tagline: { marginTop: 4, fontSize: 12, color: '#D0D0D0' },
  headerBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 18 },
  question: { fontSize: 28, lineHeight: 34, fontWeight: '900', color: COLORS.black, letterSpacing: -0.6 },
  helper: { marginTop: 5, fontSize: 13, color: COLORS.gray },
  locationCard: {
    marginTop: 18,
    borderRadius: 24,
    padding: 17,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.softGray,
    flexDirection: 'row',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  routeRail: { width: 25, alignItems: 'center', paddingTop: 9 },
  pickupDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.black, borderWidth: 3, borderColor: COLORS.goldSoft },
  routeLine: { width: 2, flex: 1, minHeight: 50, backgroundColor: COLORS.softGray, marginVertical: 3 },
  dropDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.gold },
  locationBody: { flex: 1, marginLeft: 8 },
  locationBlock: { paddingVertical: 2 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, color: COLORS.gray },
  changeText: { fontSize: 12, fontWeight: '800', color: COLORS.black },
  valueRow: { marginTop: 7, minHeight: 55, flexDirection: 'row', alignItems: 'center' },
  valueTextWrap: { flex: 1, marginRight: 10 },
  valueTitle: { fontSize: 17, lineHeight: 21, fontWeight: '800', color: COLORS.black },
  valueAddress: { marginTop: 3, fontSize: 12, lineHeight: 16, color: COLORS.gray },
  placeholderTitle: { color: COLORS.blackSoft },
  placeholderAddress: { color: COLORS.muted },
  separator: { height: 1, backgroundColor: COLORS.softGray, marginVertical: 14 },
  destinationButton: {
    marginTop: 7,
    minHeight: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.softGray,
    backgroundColor: COLORS.offWhite,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  destinationIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: COLORS.black, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  errorCard: { marginTop: 10, borderRadius: 15, backgroundColor: COLORS.goldSoft, paddingHorizontal: 13, paddingVertical: 11, flexDirection: 'row', alignItems: 'center' },
  errorText: { flex: 1, marginLeft: 8, fontSize: 12, fontWeight: '700', color: COLORS.black },
  mapCard: { flex: 1, minHeight: 180, marginTop: 14, borderRadius: 22, overflow: 'hidden', backgroundColor: COLORS.mapBackground, position: 'relative' },
  mapPickupMarker: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.white, borderWidth: 3, borderColor: COLORS.black, alignItems: 'center', justifyContent: 'center' },
  mapPickupCenter: { width: 9, height: 9, borderRadius: 5, backgroundColor: COLORS.gold },
  mapLabel: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 17, backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', shadowColor: '#000000', shadowOpacity: 0.09, shadowRadius: 7, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  mapLabelText: { marginLeft: 6, fontSize: 11, fontWeight: '800', color: COLORS.black },
  primaryButton: { minHeight: 60, marginTop: 14, borderRadius: 19, paddingHorizontal: 20, backgroundColor: COLORS.black, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000000', shadowOpacity: 0.16, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  primaryButtonText: { flex: 1, textAlign: 'center', marginLeft: 22, fontSize: 16, fontWeight: '900', color: COLORS.white, letterSpacing: 0.2 },
  footerText: { marginTop: 9, textAlign: 'center', fontSize: 11, color: COLORS.gray },
});
