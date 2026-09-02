import React, { useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import {
  APIProvider,
  AdvancedMarker,
  Map,
  Polyline,
  useMap,
} from '@vis.gl/react-google-maps';


/* =========================================================================
   RIDEX GOOGLE CONFIG START
   ========================================================================= */

const GOOGLE_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

/* =========================================================================
   RIDEX GOOGLE CONFIG END
   ========================================================================= */


/* =========================================================================
   RIDEX COLORS START
   ========================================================================= */

const COLORS = {
  green: '#079A4B',
  greenDark: '#05833F',
  greenSoft: '#EAF8F1',
  greenVerySoft: '#F3FAF6',
  red: '#EF3154',
  black: '#111820',
  gray: '#737C88',
  muted: '#9AA1AA',
  border: '#E5E8EB',
  white: '#FFFFFF',
  background: '#FAFBFA',
  mapBackground: '#EEF3F2',
};

/* =========================================================================
   RIDEX COLORS END
   ========================================================================= */


/* =========================================================================
   RIDEX ASSETS START
   ========================================================================= */

const RIDER_ILLUSTRATION =
  require('../../assets/images/offer-scooter-rider.png');

/* =========================================================================
   RIDEX ASSETS END
   ========================================================================= */


/* =========================================================================
   RIDEX TYPES START
   ========================================================================= */

type Coordinates = {
  lat: number;
  lng: number;
};

type RouteInfo = {
  distanceMeters: number;
  durationSeconds: number;
  distanceText: string;
  durationText: string;
  polyline: Coordinates[];
};

type RideParams = {
  pickupName?: string;
  pickupAddress?: string;
  pickupLat?: string;
  pickupLng?: string;

  dropName?: string;
  dropAddress?: string;
  dropLat?: string;
  dropLng?: string;

  distanceText?: string;
  durationText?: string;

  vehicle?: string;

  userOffer?: string;
  finalFare?: string;

  riderId?: string;
  riderName?: string;
  riderInitials?: string;
  riderRating?: string;
  riderTrips?: string;

  vehicleName?: string;
  vehicleNumber?: string;
  riderDistanceKm?: string;
};

/* =========================================================================
   RIDEX TYPES END
   ========================================================================= */


/* =========================================================================
   RIDEX HELPERS START
   ========================================================================= */

const money = (value: number) =>
  `₹${Math.round(value)}`;

const parseCoordinate = (
  value?: string,
): number | null => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return number;
};

const parseCoordinates = (
  lat?: string,
  lng?: string,
): Coordinates | null => {
  const latitude = parseCoordinate(lat);
  const longitude = parseCoordinate(lng);

  if (
    latitude === null ||
    longitude === null ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    (latitude === 0 && longitude === 0)
  ) {
    return null;
  }

  return {
    lat: latitude,
    lng: longitude,
  };
};

/* =========================================================================
   RIDEX HELPERS END
   ========================================================================= */


/* =========================================================================
   RIDEX GOOGLE ROUTE START
   ========================================================================= */

async function calculateGoogleRoute(
  pickup: Coordinates | null,
  drop: Coordinates | null,
  pickupName: string,
  pickupAddress: string,
  dropName: string,
  dropAddress: string,
): Promise<RouteInfo | null> {

  if (!GOOGLE_API_KEY) {
    return null;
  }

  if (typeof window === 'undefined') {
    return null;
  }

  const googleMaps =
    (window as any)?.google?.maps;

  if (!googleMaps) {
    return null;
  }

  const { Route } =
    await googleMaps.importLibrary('routes');

  if (!Route) {
    return null;
  }

  let result: any = null;

  if (pickup && drop) {
    result =
      await Route.computeRoutes({
        origin: pickup,
        destination: drop,
        travelMode: 'DRIVING',
        routingPreference: 'TRAFFIC_AWARE',
        fields: [
          'distanceMeters',
          'durationMillis',
          'path',
        ],
      });
  }

  if (
    !result?.routes ||
    result.routes.length === 0
  ) {
    const origin =
      pickupAddress || pickupName;

    const destination =
      dropAddress || dropName;

    if (!origin || !destination) {
      return null;
    }

    result =
      await Route.computeRoutes({
        origin,
        destination,
        travelMode: 'DRIVING',
        routingPreference: 'TRAFFIC_AWARE',
        fields: [
          'distanceMeters',
          'durationMillis',
          'path',
        ],
      });
  }

  const route =
    result?.routes?.[0];

  if (!route) {
    return null;
  }

  const distanceMeters =
    Number(route.distanceMeters || 0);

  const durationMillis =
    Number(route.durationMillis || 0);

  if (
    distanceMeters <= 0 ||
    durationMillis <= 0
  ) {
    return null;
  }

  const durationSeconds =
    Math.max(
      1,
      Math.round(durationMillis / 1000),
    );

  const durationMinutes =
    Math.max(
      1,
      Math.round(durationSeconds / 60),
    );

  const distanceKm =
    distanceMeters / 1000;

  const distanceText =
    distanceKm < 1
      ? `${Math.round(distanceMeters)} m`
      : `${distanceKm.toFixed(1)} km`;

  const durationText =
    `${durationMinutes} min`;

  const rawPath =
    route.path || [];

  const polyline =
    rawPath
      .map((point: any) => {
        const lat =
          typeof point.lat === 'function'
            ? point.lat()
            : Number(point.lat);

        const lng =
          typeof point.lng === 'function'
            ? point.lng()
            : Number(point.lng);

        return { lat, lng };
      })
      .filter(
        (point: Coordinates) =>
          Number.isFinite(point.lat) &&
          Number.isFinite(point.lng),
      );

  return {
    distanceMeters,
    durationSeconds,
    distanceText,
    durationText,
    polyline,
  };
}

/* =========================================================================
   RIDEX GOOGLE ROUTE END
   ========================================================================= */


/* =========================================================================
   RIDEX MAP COMPONENT START
   ========================================================================= */

function RideMap({
  pickup,
  drop,
  routeInfo,
  riderPosition,
}: {
  pickup: Coordinates | null;
  drop: Coordinates | null;
  routeInfo: RouteInfo | null;
  riderPosition: Coordinates | null;
}) {

  const map =
    useMap();

  useEffect(() => {
    if (!map) {
      return;
    }

    const points: Coordinates[] = [];

    if (pickup) {
      points.push(pickup);
    }

    if (drop) {
      points.push(drop);
    }

    if (riderPosition) {
      points.push(riderPosition);
    }

    if (routeInfo?.polyline?.length) {
      points.push(...routeInfo.polyline);
    }

    if (points.length < 2) {
      return;
    }

    const googleMaps =
      (window as any)?.google?.maps;

    if (!googleMaps) {
      return;
    }

    const bounds =
      new googleMaps.LatLngBounds();

    points.forEach(point => {
      bounds.extend(point);
    });

    map.fitBounds(bounds, 42);

  }, [
    map,
    pickup,
    drop,
    riderPosition,
    routeInfo,
  ]);

  const fallbackCenter =
    pickup ||
    drop || {
      lat: 16.5062,
      lng: 80.6480,
    };

  const routeStart =
    routeInfo?.polyline?.[0] ||
    pickup;

  const routeEnd =
    routeInfo?.polyline?.[
      routeInfo.polyline.length - 1
    ] ||
    drop;

  return (
    <Map
      defaultCenter={fallbackCenter}
      defaultZoom={13}
      gestureHandling="greedy"
      disableDefaultUI
      clickableIcons={false}
      mapId="DEMO_MAP_ID"
      style={{
        width: '100%',
        height: '100%',
      }}
    >

      {routeInfo &&
        routeInfo.polyline.length > 1 && (
          <Polyline
            path={routeInfo.polyline}
            strokeColor={COLORS.green}
            strokeOpacity={0.95}
            strokeWeight={6}
          />
        )}

      {routeStart && (
        <AdvancedMarker
          position={routeStart}
        >
          <View
            style={styles.mapPickupMarker}
          >
            <View
              style={styles.mapPickupDot}
            />
          </View>
        </AdvancedMarker>
      )}

      {routeEnd && (
        <AdvancedMarker
          position={routeEnd}
        >
          <View
            style={styles.mapDropMarker}
          >
            <Ionicons
              name="location"
              size={38}
              color={COLORS.red}
            />
          </View>
        </AdvancedMarker>
      )}

      {riderPosition && (
        <AdvancedMarker
          position={riderPosition}
        >
          <View
            style={styles.riderMarker}
          >
            <Image
              source={RIDER_ILLUSTRATION}
              style={styles.riderMarkerImage}
              resizeMode="contain"
            />
          </View>
        </AdvancedMarker>
      )}

    </Map>
  );
}

/* =========================================================================
   RIDEX MAP COMPONENT END
   ========================================================================= */


/* =========================================================================
   RIDER ON WAY SCREEN START
   ========================================================================= */

export default function RiderOnWayScreen() {

  const router =
    useRouter();

  const { height } =
    useWindowDimensions();

  const params =
    useLocalSearchParams<RideParams>();


  /* =========================================================================
     RIDEX RIDE DATA START
     ========================================================================= */

  const pickupName =
    params.pickupName ||
    'Current Location';

  const pickupAddress =
    params.pickupAddress ||
    '';

  const dropName =
    params.dropName ||
    'Destination';

  const dropAddress =
    params.dropAddress ||
    '';

  const pickup =
    useMemo(
      () =>
        parseCoordinates(
          params.pickupLat,
          params.pickupLng,
        ),
      [
        params.pickupLat,
        params.pickupLng,
      ],
    );

  const drop =
    useMemo(
      () =>
        parseCoordinates(
          params.dropLat,
          params.dropLng,
        ),
      [
        params.dropLat,
        params.dropLng,
      ],
    );

  const riderName =
    params.riderName ||
    'Ramesh B.';

  const riderRating =
    params.riderRating ||
    '4.8';

  const riderTrips =
    params.riderTrips ||
    '320';

  const vehicleName =
    params.vehicleName ||
    'Hero Splendor';

  const vehicleNumber =
    params.vehicleNumber ||
    'AP 39 AB 1234';

  const userOffer =
    Number(params.userOffer) ||
    70;

  const finalFare =
    Number(params.finalFare) ||
    userOffer;

  const riderDistance =
    Number(params.riderDistanceKm) ||
    1.2;

  /* =========================================================================
     RIDEX RIDE DATA END
     ========================================================================= */


  /* =========================================================================
     RIDEX ROUTE STATE START
     ========================================================================= */

  const [routeInfo, setRouteInfo] =
    useState<RouteInfo | null>(null);

  const [routeLoading, setRouteLoading] =
    useState(true);

  const [routeError, setRouteError] =
    useState(false);

  useEffect(() => {

    let cancelled = false;

    const loadRoute =
      async () => {

        try {

          setRouteLoading(true);
          setRouteError(false);

          const route =
            await calculateGoogleRoute(
              pickup,
              drop,
              pickupName,
              pickupAddress,
              dropName,
              dropAddress,
            );

          if (cancelled) {
            return;
          }

          if (!route) {
            setRouteError(true);
            setRouteInfo(null);
            return;
          }

          setRouteInfo(route);

        } catch (error) {

          console.error(
            'RIDEX rider route error:',
            error,
          );

          if (!cancelled) {
            setRouteError(true);
            setRouteInfo(null);
          }

        } finally {

          if (!cancelled) {
            setRouteLoading(false);
          }

        }

      };

    loadRoute();

    return () => {
      cancelled = true;
    };

  }, [
    pickup,
    drop,
    pickupName,
    pickupAddress,
    dropName,
    dropAddress,
  ]);

  /* =========================================================================
     RIDEX ROUTE STATE END
     ========================================================================= */


  /* =========================================================================
     RIDEX RIDER POSITION START
     ========================================================================= */

  const [riderPosition, setRiderPosition] =
    useState<Coordinates | null>(null);

  useEffect(() => {

    if (
      !routeInfo?.polyline ||
      routeInfo.polyline.length < 3
    ) {
      return;
    }

    /*
      MVP simulation only.

      Keep the rider on the REAL Google road path, close to pickup.
      Realtime rider GPS will replace this later.
    */

    const riderIndex =
      Math.max(
        1,
        Math.min(
          routeInfo.polyline.length - 1,
          Math.floor(
            routeInfo.polyline.length * 0.12,
          ),
        ),
      );

    setRiderPosition(
      routeInfo.polyline[riderIndex],
    );

  }, [routeInfo]);

  /* =========================================================================
     RIDEX RIDER POSITION END
     ========================================================================= */


  /* =========================================================================
     RIDEX ETA START
     ========================================================================= */

  const [etaMinutes, setEtaMinutes] =
    useState(4);

  useEffect(() => {

    const timer =
      setInterval(() => {

        setEtaMinutes(current =>
          current > 1
            ? current - 1
            : 1,
        );

      }, 30000);

    return () => {
      clearInterval(timer);
    };

  }, []);

  /* =========================================================================
     RIDEX ETA END
     ========================================================================= */


  /* =========================================================================
     RIDEX OTP START
     ========================================================================= */

  const [otpSeconds, setOtpSeconds] =
    useState(292);

  useEffect(() => {

    const timer =
      setInterval(() => {

        setOtpSeconds(current =>
          current > 0
            ? current - 1
            : 0,
        );

      }, 1000);

    return () => {
      clearInterval(timer);
    };

  }, []);

  const otpTimer =
    useMemo(() => {

      const minutes =
        Math.floor(otpSeconds / 60);

      const seconds =
        otpSeconds % 60;

      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    }, [otpSeconds]);

  /* =========================================================================
     RIDEX OTP END
     ========================================================================= */


  /* =========================================================================
     RIDEX ACTIONS START
     ========================================================================= */

  const handleCall = () => {

    Alert.alert(
      'Call Rider',
      `Calling ${riderName}...`,
    );

  };

  const handleChat = () => {

    Alert.alert(
      'Chat',
      `Chat with ${riderName} will be connected in the next milestone.`,
    );

  };

  const handleCancel = () => {

    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        {
          text: 'Keep Ride',
          style: 'cancel',
        },
        {
          text: 'Cancel Ride',
          style: 'destructive',
          onPress: () =>
            router.replace('/home' as any),
        },
      ],
    );

  };

  const handlePickup = () => {

    Alert.alert(
      'Pickup Location',
      'Pickup confirmation will be connected to realtime rider status in the next milestone.',
    );

  };

  /* =========================================================================
     RIDEX ACTIONS END
     ========================================================================= */


  /* =========================================================================
     RIDEX SINGLE SCREEN LAYOUT START
     ========================================================================= */

  const compact =
    height < 760;

  return (
    <SafeAreaView
      style={styles.safeArea}
    >

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.screen,
          compact &&
            styles.screenCompact,
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >

        {/* ================================================================
            HEADER START
        ================================================================ */}

        <View style={styles.header}>

          <Pressable
            style={styles.headerBack}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={26}
              color={COLORS.black}
            />
          </Pressable>

          <View style={styles.headerCenter}>

            <Text
              style={styles.headerTitle}
              numberOfLines={1}
            >
              Rider on the way
            </Text>

            <Text
              style={styles.headerSubtitle}
              numberOfLines={1}
            >
              Your rider is coming to pickup
            </Text>

          </View>

          <View style={styles.safeRides}>

            <Ionicons
              name="shield-checkmark"
              size={20}
              color={COLORS.green}
            />

            <Text style={styles.safeRidesText}>
              Safe Rides
            </Text>

          </View>

        </View>

        {/* ================================================================
            HEADER END
        ================================================================ */}


        {/* ================================================================
            RIDER SUMMARY START
        ================================================================ */}

        <View
          style={[
            styles.riderCard,
            compact &&
              styles.riderCardCompact,
          ]}
        >

          <View style={styles.riderAvatar}>

            <Image
              source={RIDER_ILLUSTRATION}
              style={styles.riderAvatarImage}
              resizeMode="contain"
            />

          </View>

          <View style={styles.riderInfo}>

            <View style={styles.riderNameRow}>

              <Text
                style={styles.riderName}
                numberOfLines={1}
              >
                {riderName}
              </Text>

              <Ionicons
                name="star"
                size={15}
                color={COLORS.green}
              />

              <Text style={styles.rating}>
                {riderRating}
              </Text>

            </View>

            <View style={styles.vehicleRow}>

              <Ionicons
                name="bicycle-outline"
                size={17}
                color={COLORS.black}
              />

              <Text
                style={styles.vehicleName}
                numberOfLines={1}
              >
                {vehicleName}
              </Text>

            </View>

            <View style={styles.numberPlate}>

              <Text style={styles.numberPlateText}>
                {vehicleNumber}
              </Text>

            </View>

            <View style={styles.verifiedRow}>

              <Ionicons
                name="shield-checkmark"
                size={17}
                color={COLORS.green}
              />

              <Text style={styles.verifiedText}>
                Verified Rider
              </Text>

            </View>

          </View>

          <View style={styles.contactColumn}>

            <Pressable
              style={styles.contactButton}
              onPress={handleCall}
            >

              <View style={styles.contactCircle}>

                <Ionicons
                  name="call"
                  size={19}
                  color={COLORS.green}
                />

              </View>

              <Text style={styles.contactLabel}>
                Call
              </Text>

            </Pressable>

            <Pressable
              style={styles.contactButton}
              onPress={handleChat}
            >

              <View style={styles.contactCircle}>

                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={19}
                  color={COLORS.green}
                />

              </View>

              <Text style={styles.contactLabel}>
                Chat
              </Text>

            </Pressable>

          </View>

        </View>

        {/* ================================================================
            RIDER SUMMARY END
        ================================================================ */}


        {/* ================================================================
            MAP START
        ================================================================ */}

        <View
          style={[
            styles.mapContainer,
            compact &&
              styles.mapContainerCompact,
          ]}
        >

          {GOOGLE_API_KEY ? (

            <APIProvider
              apiKey={GOOGLE_API_KEY}
              libraries={['routes']}
            >

              <RideMap
                pickup={pickup}
                drop={drop}
                routeInfo={routeInfo}
                riderPosition={riderPosition}
              />

            </APIProvider>

          ) : (

            <View style={styles.mapFallback}>

              <Ionicons
                name="map-outline"
                size={36}
                color={COLORS.green}
              />

              <Text style={styles.mapFallbackText}>
                Google Maps API key unavailable
              </Text>

            </View>

          )}

          <View style={styles.mapTopOverlay}>

            <View style={styles.etaCard}>

              <Text style={styles.etaLabel}>
                Rider arriving in
              </Text>

              <Text style={styles.etaValue}>
                {etaMinutes} min
              </Text>

              <Text style={styles.etaDistance}>
                ({riderDistance.toFixed(1)} km away)
              </Text>

            </View>

            <View style={styles.dropBadge}>

              <Text style={styles.dropBadgeLabel}>
                Drop
              </Text>

              <Text
                style={styles.dropBadgeName}
                numberOfLines={2}
              >
                {dropName}
              </Text>

            </View>

          </View>

          <View style={styles.pickupBadge}>

            <Text style={styles.pickupBadgeLabel}>
              Pickup
            </Text>

            <Text
              style={styles.pickupBadgeName}
              numberOfLines={1}
            >
              {pickupName}
            </Text>

          </View>

          <View style={styles.mapLocateButton}>

            <Ionicons
              name="locate-outline"
              size={24}
              color={COLORS.black}
            />

          </View>

          {routeLoading && (

            <View style={styles.routeLoading}>

              <ActivityIndicator
                size="small"
                color={COLORS.green}
              />

              <Text style={styles.routeLoadingText}>
                Loading real route...
              </Text>

            </View>

          )}

          {routeError && !routeLoading && (

            <View style={styles.routeError}>

              <Ionicons
                name="warning-outline"
                size={15}
                color={COLORS.red}
              />

              <Text style={styles.routeErrorText}>
                Route unavailable
              </Text>

            </View>

          )}

        </View>

        {/* ================================================================
            MAP END
        ================================================================ */}


        {/* ================================================================
            BOTTOM INFO START
        ================================================================ */}

        <View
          style={[
            styles.bottomPanel,
            compact &&
              styles.bottomPanelCompact,
          ]}
        >

          <View style={styles.otpRow}>

            <View style={styles.otpIcon}>

              <Ionicons
                name="shield-checkmark"
                size={22}
                color={COLORS.green}
              />

            </View>

            <View style={styles.otpCopy}>

              <Text style={styles.otpTitle}>
                Share OTP with rider
              </Text>

              <Text
                style={styles.otpSubtitle}
                numberOfLines={1}
              >
                Ask rider for the OTP to start the ride
              </Text>

            </View>

            <View style={styles.otpDigits}>

              {['6', '4', '2', '1'].map(
                (digit, index) => (
                  <View
                    key={`${digit}-${index}`}
                    style={styles.otpDigit}
                  >
                    <Text style={styles.otpDigitText}>
                      {digit}
                    </Text>
                  </View>
                ),
              )}

            </View>

            <View style={styles.otpExpiry}>

              <Text style={styles.otpExpiryLabel}>
                Expires
              </Text>

              <Text style={styles.otpExpiryValue}>
                {otpTimer}
              </Text>

            </View>

          </View>


          <View style={styles.tripMiniCard}>

            <View style={styles.tripLocations}>

              <View style={styles.tripPointRow}>

                <View style={styles.greenPoint} />

                <Text
                  style={styles.tripPointText}
                  numberOfLines={1}
                >
                  {pickupName}
                </Text>

              </View>

              <View style={styles.tripLine} />

              <View style={styles.tripPointRow}>

                <View style={styles.redPoint} />

                <Text
                  style={styles.tripPointText}
                  numberOfLines={1}
                >
                  {dropName}
                </Text>

              </View>

            </View>

            <View style={styles.tripStats}>

              <View style={styles.tripStat}>

                <Ionicons
                  name="map-outline"
                  size={17}
                  color={COLORS.gray}
                />

                <Text style={styles.tripStatText}>
                  {routeInfo?.distanceText ||
                    params.distanceText ||
                    '—'}
                </Text>

              </View>

              <View style={styles.tripStat}>

                <Ionicons
                  name="time-outline"
                  size={17}
                  color={COLORS.gray}
                />

                <Text style={styles.tripStatText}>
                  {routeInfo?.durationText ||
                    params.durationText ||
                    '—'}
                </Text>

              </View>

            </View>

            <View style={styles.fareMini}>

              <Text style={styles.fareLabel}>
                Final Fare
              </Text>

              <Text style={styles.fareValue}>
                {money(finalFare)}
              </Text>

            </View>

          </View>


          <View style={styles.tipRow}>

            <Ionicons
              name="bulb-outline"
              size={19}
              color={COLORS.green}
            />

            <Text
              style={styles.tipText}
              numberOfLines={1}
            >
              Call or chat with your rider to coordinate.
            </Text>

          </View>


          <View style={styles.actions}>

            <Pressable
              style={styles.cancelButton}
              onPress={handleCancel}
            >

              <Text style={styles.cancelText}>
                Cancel Ride
              </Text>

            </Pressable>

            <Pressable
              style={styles.pickupButton}
              onPress={handlePickup}
            >

              <Ionicons
                name="shield-checkmark-outline"
                size={27}
                color={COLORS.white}
              />

              <Text
                style={styles.pickupButtonText}
                numberOfLines={1}
              >
                I’m at Pickup
              </Text>

            </Pressable>

          </View>

        </View>

        {/* ================================================================
            BOTTOM INFO END
        ================================================================ */}

      </ScrollView>

    </SafeAreaView>
  );
}

/* =========================================================================
   RIDER ON WAY SCREEN END
   ========================================================================= */


/* =========================================================================
   RIDEX STYLES START
   ========================================================================= */

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollView: {
    flex: 1,
  },

  screen: {
    paddingHorizontal: 14,
    paddingTop: 5,
    paddingBottom: 20,
  },

  screenCompact: {
    paddingTop: 2,
    paddingBottom: 20,
  },

  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerBack: {
    width: 40,
    height: 44,
    justifyContent: 'center',
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },

  headerTitle: {
    color: COLORS.black,
    fontSize: 20,
    fontWeight: '800',
  },

  headerSubtitle: {
    marginTop: 2,
    color: COLORS.gray,
    fontSize: 11,
    fontWeight: '500',
  },

  safeRides: {
    width: 72,
    alignItems: 'center',
  },

  safeRidesText: {
    marginTop: 1,
    color: COLORS.black,
    fontSize: 9,
    fontWeight: '700',
  },

  riderCard: {
    height: 124,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 3,
  },

  riderCardCompact: {
    height: 112,
  },

  riderAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.greenSoft,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },

  riderAvatarImage: {
    width: 72,
    height: 72,
  },

  riderInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },

  riderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  riderName: {
    maxWidth: '70%',
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '800',
    marginRight: 5,
  },

  rating: {
    color: COLORS.black,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 2,
  },

  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  vehicleName: {
    flex: 1,
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },

  numberPlate: {
    alignSelf: 'flex-start',
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#CBD0D4',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  numberPlateText: {
    color: COLORS.black,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  verifiedText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },

  contactColumn: {
    width: 48,
    height: 105,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    marginLeft: 7,
    paddingLeft: 6,
  },

  contactButton: {
    alignItems: 'center',
  },

  contactCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  contactLabel: {
    color: COLORS.black,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },

  mapContainer: {
    height: 500,
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.mapBackground,
    position: 'relative',
  },

  mapContainerCompact: {
    marginTop: 7,
  },

  mapPickupMarker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.greenSoft,
    borderWidth: 3,
    borderColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mapPickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.green,
  },

  mapDropMarker: {
    width: 42,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  riderMarker: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 5,
  },

  riderMarkerImage: {
    width: 48,
    height: 48,
  },

  mapTopOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  etaCard: {
    backgroundColor: COLORS.white,
    borderRadius: 15,
    paddingHorizontal: 13,
    paddingVertical: 9,
    minWidth: 118,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 4,
  },

  etaLabel: {
    color: COLORS.gray,
    fontSize: 10,
    fontWeight: '600',
  },

  etaValue: {
    color: COLORS.green,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 1,
  },

  etaDistance: {
    color: COLORS.gray,
    fontSize: 10,
    marginTop: 1,
  },

  dropBadge: {
    maxWidth: 155,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 3,
  },

  dropBadgeLabel: {
    color: COLORS.red,
    fontSize: 10,
    fontWeight: '800',
  },

  dropBadgeName: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },

  pickupBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    maxWidth: 165,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 3,
  },

  pickupBadgeLabel: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: '800',
  },

  pickupBadgeName: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },

  mapLocateButton: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 3,
  },

  routeLoading: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 3,
  },

  routeLoadingText: {
    color: COLORS.gray,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 6,
  },

  routeError: {
    position: 'absolute',
    top: 80,
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },

  routeErrorText: {
    color: COLORS.red,
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 5,
  },

  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  mapFallbackText: {
    color: COLORS.gray,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },

  bottomPanel: {
    height: 178,
    marginTop: 8,
    position: 'relative',
  },

  bottomPanelCompact: {
    height: 178,
    marginTop: 6,
  },

  otpRow: {
    height: 46,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },

  otpIcon: {
    width: 34,
    height: 34,
    borderRadius: 19,
    backgroundColor: COLORS.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  otpCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
  },

  otpTitle: {
    color: COLORS.black,
    fontSize: 11,
    fontWeight: '800',
  },

  otpSubtitle: {
    color: COLORS.gray,
    fontSize: 8,
    marginTop: 2,
  },

  otpDigits: {
    flexDirection: 'row',
    marginLeft: 5,
  },

  otpDigit: {
    width: 27,
    height: 34,
    borderRadius: 7,
    backgroundColor: COLORS.greenVerySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },

  otpDigitText: {
    color: COLORS.green,
    fontSize: 18,
    fontWeight: '900',
  },

  otpExpiry: {
    width: 47,
    alignItems: 'flex-end',
    marginLeft: 5,
  },

  otpExpiryLabel: {
    color: COLORS.gray,
    fontSize: 8,
  },

  otpExpiryValue: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },

  tripMiniCard: {
    height: 52,
    marginTop: 5,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  tripLocations: {
    flex: 1,
    minWidth: 0,
  },

  tripPointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },

  greenPoint: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.green,
  },

  redPoint: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.red,
  },

  tripPointText: {
    flex: 1,
    color: COLORS.black,
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 7,
  },

  tripLine: {
    width: 1,
    height: 9,
    backgroundColor: COLORS.green,
    marginLeft: 4,
    marginVertical: 1,
  },

  tripStats: {
    width: 78,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    paddingLeft: 9,
  },

  tripStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },

  tripStatText: {
    color: COLORS.black,
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 5,
  },

  fareMini: {
    width: 65,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    paddingLeft: 9,
    alignItems: 'flex-start',
  },

  fareLabel: {
    color: COLORS.gray,
    fontSize: 8,
  },

  fareValue: {
    color: COLORS.green,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 1,
  },

  tipRow: {
    height: 22,
    marginTop: 5,
    borderRadius: 9,
    backgroundColor: COLORS.greenVerySoft,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },

  tipText: {
    flex: 1,
    color: COLORS.gray,
    fontSize: 9,
    fontWeight: '600',
    marginLeft: 6,
  },

  actions: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 45,
    flexDirection: 'row',
    gap: 8,
  },

  cancelButton: {
    flex: 0.85,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: COLORS.red,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelText: {
    color: COLORS.red,
    fontSize: 13,
    fontWeight: '800',
  },

  pickupButton: {
    flex: 1.5,
    borderRadius: 13,
    backgroundColor: COLORS.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  pickupButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },

});

/* =========================================================================
   RIDEX STYLES END
   ========================================================================= */
