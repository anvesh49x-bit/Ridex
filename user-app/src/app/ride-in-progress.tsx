import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
} from 'react-native-maps';

import { Ionicons } from '@expo/vector-icons';


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
  background: '#F7F9F8',
  blue: '#1877E8',
  blueSoft: '#EEF5FF',
};

/* =========================================================================
   RIDEX COLORS END
   ========================================================================= */


/* =========================================================================
   RIDEX ASSETS START
   ========================================================================= */

const RIDER_IMAGE =
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

const formatDistance = (
  meters: number,
) => {
  const km = meters / 1000;

  if (km < 1) {
    return `${Math.round(meters)} m`;
  }

  return `${km.toFixed(1)} km`;
};

const formatDuration = (
  seconds: number,
) => {
  const minutes =
    Math.max(1, Math.round(seconds / 60));

  return `${minutes} min`;
};

/* =========================================================================
   RIDEX HELPERS END
   ========================================================================= */


/* =========================================================================
   RIDEX GOOGLE ROUTE START
   ========================================================================= */

/*
 * Native-safe route calculation.
 *
 * The old implementation used:
 *
 *   window.google.maps
 *   @vis.gl/react-google-maps
 *
 * Those APIs are browser-only and cause the Android
 * "View config getter callback for component div" crash.
 *
 * We now call Google Directions/Routes over HTTP instead.
 *
 * IMPORTANT:
 * For production, move this request to the RIDEX backend so
 * the Google API key is not exposed in the mobile application.
 */

async function calculateGoogleRoute(
  pickup: Coordinates | null,
  drop: Coordinates | null,
): Promise<RouteInfo | null> {

  if (!pickup || !drop) {
    return null;
  }

  /*
   * Use the existing Google Places API key for the MVP.
   *
   * The native map itself gets its Android key from app.json.
   */
  const apiKey =
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.warn(
      'RIDEX: Google API key unavailable for route calculation.',
    );

    return null;
  }

  try {
    const origin =
      `${pickup.lat},${pickup.lng}`;

    const destination =
      `${drop.lat},${drop.lng}`;

    /*
     * Google Directions API.
     *
     * This is an HTTP request, so it works in React Native.
     */
    const url =
      'https://maps.googleapis.com/maps/api/directions/json' +
      `?origin=${encodeURIComponent(origin)}` +
      `&destination=${encodeURIComponent(destination)}` +
      `&mode=driving` +
      `&departure_time=now` +
      `&key=${encodeURIComponent(apiKey)}`;

    const response =
      await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Google Directions HTTP ${response.status}`,
      );
    }

    const data =
      await response.json();

    if (
      data.status !== 'OK' ||
      !data.routes ||
      data.routes.length === 0
    ) {
      console.warn(
        'RIDEX: Google Directions returned:',
        data.status,
      );

      return null;
    }

    const route =
      data.routes[0];

    const leg =
      route?.legs?.[0];

    if (!leg) {
      return null;
    }

    const distanceMeters =
      Number(
        leg.distance?.value || 0,
      );

    const durationSeconds =
      Number(
        (
          leg.duration_in_traffic ||
          leg.duration
        )?.value || 0,
      );

    if (
      distanceMeters <= 0 ||
      durationSeconds <= 0
    ) {
      return null;
    }

    /*
     * Google returns an encoded overview polyline.
     *
     * Decode it locally so react-native-maps can draw it.
     */
    const encodedPolyline =
      route.overview_polyline?.points;

    const polyline =
      decodeGooglePolyline(
        encodedPolyline,
      );

    return {
      distanceMeters,
      durationSeconds,
      distanceText:
        leg.distance?.text ||
        formatDistance(distanceMeters),
      durationText:
        (
          leg.duration_in_traffic ||
          leg.duration
        )?.text ||
        formatDuration(durationSeconds),
      polyline,
    };

  } catch (error) {

    console.error(
      'RIDEX Google route error:',
      error,
    );

    return null;
  }
}


/* =========================================================================
   RIDEX POLYLINE DECODER START
   ========================================================================= */

function decodeGooglePolyline(
  encoded?: string,
): Coordinates[] {

  if (!encoded) {
    return [];
  }

  const points: Coordinates[] = [];

  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {

    let shift = 0;
    let result = 0;

    let byte: number;

    do {
      byte =
        encoded.charCodeAt(index++) -
        63;

      result |=
        (byte & 0x1f) <<
        shift;

      shift += 5;

    } while (byte >= 0x20);

    const latitudeChange =
      (result & 1)
        ? ~(result >> 1)
        : result >> 1;

    latitude +=
      latitudeChange;

    shift = 0;
    result = 0;

    do {
      byte =
        encoded.charCodeAt(index++) -
        63;

      result |=
        (byte & 0x1f) <<
        shift;

      shift += 5;

    } while (byte >= 0x20);

    const longitudeChange =
      (result & 1)
        ? ~(result >> 1)
        : result >> 1;

    longitude +=
      longitudeChange;

    points.push({
      lat: latitude / 1e5,
      lng: longitude / 1e5,
    });
  }

  return points;
}

/* =========================================================================
   RIDEX POLYLINE DECODER END
   ========================================================================= */


/* =========================================================================
   RIDEX GOOGLE ROUTE END
   ========================================================================= */


/* =========================================================================
   RIDEX MAP COMPONENT START
   ========================================================================= */

function RideInProgressMap({
  pickup,
  drop,
  routeInfo,
  riderPosition,
  onMapReady,
}: {
  pickup: Coordinates | null;
  drop: Coordinates | null;
  routeInfo: RouteInfo | null;
  riderPosition: Coordinates | null;
  onMapReady: () => void;
}) {

  const mapRef =
    useRef<MapView | null>(null);

  const center =
    pickup ||
    drop || {
      lat: 16.5062,
      lng: 80.6480,
    };

  /*
   * Automatically fit the pickup, rider and destination
   * into the visible native map.
   */
  useEffect(() => {

    if (!mapRef.current) {
      return;
    }

    const points: {
      latitude: number;
      longitude: number;
    }[] = [];

    if (pickup) {
      points.push({
        latitude: pickup.lat,
        longitude: pickup.lng,
      });
    }

    if (drop) {
      points.push({
        latitude: drop.lat,
        longitude: drop.lng,
      });
    }

    if (riderPosition) {
      points.push({
        latitude: riderPosition.lat,
        longitude: riderPosition.lng,
      });
    }

    if (routeInfo?.polyline?.length) {
      routeInfo.polyline.forEach(
        point => {
          points.push({
            latitude: point.lat,
            longitude: point.lng,
          });
        },
      );
    }

    if (points.length < 2) {
      return;
    }

    const timer =
      setTimeout(() => {

        mapRef.current?.fitToCoordinates(
          points,
          {
            edgePadding: {
              top: 80,
              right: 70,
              bottom: 150,
              left: 70,
            },
            animated: true,
          },
        );

      }, 250);

    return () => {
      clearTimeout(timer);
    };

  }, [
    pickup,
    drop,
    riderPosition,
    routeInfo,
  ]);

  return (
    <MapView
      ref={mapRef}
      style={styles.nativeMap}
      provider={PROVIDER_GOOGLE}

      initialRegion={{
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      }}

      onMapReady={onMapReady}

      showsCompass={false}
      showsScale={false}
      showsBuildings={false}
      showsIndoors={false}
      showsTraffic={false}
      toolbarEnabled={false}

      zoomEnabled
      scrollEnabled
      rotateEnabled={false}
      pitchEnabled={false}

      loadingEnabled
      moveOnMarkerPress={false}
    >

      {/* ===============================================================
          REAL ROUTE
      =============================================================== */}

      {routeInfo?.polyline &&
        routeInfo.polyline.length > 1 && (
          <Polyline
            coordinates={routeInfo.polyline.map(
              point => ({
                latitude: point.lat,
                longitude: point.lng,
              }),
            )}
            strokeColor={COLORS.green}
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
          />
        )}


      {/* ===============================================================
          RIDER → DESTINATION ROUTE
      =============================================================== */}

      {riderPosition &&
        drop && (
          <Polyline
            coordinates={[
              {
                latitude:
                  riderPosition.lat,
                longitude:
                  riderPosition.lng,
              },
              {
                latitude:
                  drop.lat,
                longitude:
                  drop.lng,
              },
            ]}
            strokeColor={COLORS.blue}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}


      {/* ===============================================================
          PICKUP MARKER
      =============================================================== */}

      {pickup && (
        <Marker
          coordinate={{
            latitude: pickup.lat,
            longitude: pickup.lng,
          }}
          anchor={{
            x: 0.5,
            y: 0.5,
          }}
        >
          <View
            style={styles.pickupMarker}
          >
            <View
              style={styles.pickupMarkerDot}
            />
          </View>
        </Marker>
      )}


      {/* ===============================================================
          DROP MARKER
      =============================================================== */}

      {drop && (
        <Marker
          coordinate={{
            latitude: drop.lat,
            longitude: drop.lng,
          }}
          anchor={{
            x: 0.5,
            y: 1,
          }}
        >
          <View
            style={styles.dropMarker}
          >
            <Ionicons
              name="location"
              size={38}
              color={COLORS.red}
            />
          </View>
        </Marker>
      )}


      {/* ===============================================================
          RIDER MARKER
      =============================================================== */}

      {riderPosition && (
        <Marker
          coordinate={{
            latitude:
              riderPosition.lat,
            longitude:
              riderPosition.lng,
          }}
          anchor={{
            x: 0.5,
            y: 0.5,
          }}
          tracksViewChanges={false}
        >
          <View
            style={styles.mapRiderMarker}
          >
            <Image
              source={RIDER_IMAGE}
              style={styles.mapRiderImage}
              resizeMode="contain"
            />
          </View>
        </Marker>
      )}

    </MapView>
  );
}

/* =========================================================================
   RIDEX MAP COMPONENT END
   ========================================================================= */


/* =========================================================================
   RIDEX RIDE IN PROGRESS SCREEN START
   ========================================================================= */

export default function RideInProgressScreen() {

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

  useEffect(() => {

    let cancelled = false;

    const loadRoute =
      async () => {

        try {

          setRouteLoading(true);

          const route =
            await calculateGoogleRoute(
              pickup,
              drop,
            );

          if (!cancelled) {
            setRouteInfo(route);
          }

        } catch (error) {

          console.error(
            'RIDEX ride route error:',
            error,
          );

          if (!cancelled) {
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
     * MVP fallback:
     *
     * Until realtime rider GPS is connected,
     * display the rider part-way along the route.
     *
     * This will later be replaced with the actual
     * rider location from the backend.
     */

    const riderIndex =
      Math.min(
        routeInfo.polyline.length - 1,
        Math.max(
          1,
          Math.floor(
            routeInfo.polyline.length * 0.48,
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
     RIDEX LIVE RIDE STATE START
     ========================================================================= */

  const [elapsedMinutes, setElapsedMinutes] =
    useState(2);

  useEffect(() => {

    const timer =
      setInterval(() => {

        setElapsedMinutes(
          current => current + 1,
        );

      }, 60000);

    return () => {
      clearInterval(timer);
    };

  }, []);

  /*
   * Keep this value alive for the existing ride-flow state.
   *
   * Later it can be replaced with the actual ride duration
   * coming from the backend.
   */
  void elapsedMinutes;

  /* =========================================================================
     RIDEX LIVE RIDE STATE END
     ========================================================================= */


  /* =========================================================================
     RIDEX MAP STATE START
     ========================================================================= */

  const [mapLoaded, setMapLoaded] =
    useState(false);

  const mapRef =
    useRef<MapView | null>(null);

  /* =========================================================================
     RIDEX MAP STATE END
     ========================================================================= */


  /* =========================================================================
     RIDEX ACTIONS START
     ========================================================================= */

  const handleCall = () => {

    Alert.alert(
      'Call Rider',
      'Calling your rider...',
    );

  };


  const handleChat = () => {

    Alert.alert(
      'Chat',
      'Chat will be connected in the next milestone.',
    );

  };


  const handleSafety = () => {

    Alert.alert(
      'Safety Alert',
      'Your safety tools will be connected to the backend and emergency services in the next milestone.',
    );

  };


  const handleBack = () => {

    Alert.alert(
      'Leave this screen?',
      'Your ride will keep running in the background. You can return to it anytime.',
      [
        {
          text: 'Stay on Ride',
          style: 'cancel',
        },
        {
          text: 'Leave',
          onPress: () => router.back(),
        },
      ],
    );

  };


  const handleLocate = () => {

    if (!mapRef.current) {
      return;
    }

    const point =
      riderPosition ||
      pickup ||
      drop;

    if (!point) {
      return;
    }

    mapRef.current.animateToRegion(
      {
        latitude: point.lat,
        longitude: point.lng,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      },
      500,
    );

  };

  /* =========================================================================
     RIDEX ACTIONS END
     ========================================================================= */


  /* =========================================================================
     RIDEX SINGLE SCREEN START
     ========================================================================= */

  const compact =
    height < 760;

  return (
    <SafeAreaView
      style={styles.safeArea}
    >

      <View
        style={[
          styles.screen,
          compact &&
            styles.screenCompact,
        ]}
      >

        {/* ================================================================
            RIDE HEADER START
        ================================================================ */}

        <View
          style={[
            styles.headerCard,
            compact &&
              styles.headerCardCompact,
          ]}
        >

          <Pressable
            style={styles.headerBack}
            onPress={handleBack}
          >
            <Ionicons
              name="chevron-down"
              size={26}
              color={COLORS.black}
            />
          </Pressable>


          <View
            style={styles.headerCenter}
          >

            <Text
              style={styles.headerTitle}
            >
              Ride in progress
            </Text>

            <Text
              style={styles.headerSubtitle}
            >
              Enjoy your ride
            </Text>

          </View>


          <View
            style={styles.headerActions}
          >

            <Pressable
              style={
                styles.headerActionButton
              }
              onPress={handleCall}
            >
              <Ionicons
                name="call"
                size={19}
                color={COLORS.green}
              />
            </Pressable>


            <Pressable
              style={
                styles.headerActionButton
              }
              onPress={handleChat}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={19}
                color={COLORS.green}
              />
            </Pressable>

          </View>

        </View>

        {/* ================================================================
            RIDE HEADER END
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

          <RideInProgressMap
            pickup={pickup}
            drop={drop}
            routeInfo={routeInfo}
            riderPosition={riderPosition}
            onMapReady={() => {
              setMapLoaded(true);
            }}
          />


          {/* ============================================================
              DROP LABEL
          ============================================================ */}

          <View
            style={styles.dropCard}
          >

            <Text
              style={styles.dropLabel}
            >
              DROP
            </Text>

            <Text
              style={styles.dropName}
              numberOfLines={2}
            >
              {dropName}
            </Text>

          </View>


          {/* ============================================================
              PICKUP LABEL
          ============================================================ */}

          <View
            style={styles.pickupCard}
          >

            <Text
              style={styles.pickupLabel}
            >
              PICKUP
            </Text>

            <Text
              style={styles.pickupName}
              numberOfLines={1}
            >
              {pickupName}
            </Text>

          </View>


          {/* ============================================================
              DESTINATION DISTANCE
          ============================================================ */}

          <View
            style={styles.destinationCard}
          >

            <View
              style={styles.navigationCircle}
            >

              <Ionicons
                name="navigate"
                size={24}
                color={COLORS.blue}
              />

            </View>


            <View
              style={styles.destinationCopy}
            >

              <Text
                style={
                  styles.destinationDistance
                }
              >
                {routeInfo?.distanceText ||
                  params.distanceText ||
                  '5.2 km'}{' '}
                away
              </Text>

              <Text
                style={
                  styles.destinationSubtext
                }
              >
                from destination
              </Text>

            </View>


            <Ionicons
              name="chevron-forward"
              size={22}
              color={COLORS.muted}
            />

          </View>


          {/* ============================================================
              LOCATE
          ============================================================ */}

          <Pressable
            style={styles.locateButton}
            onPress={handleLocate}
          >

            <Ionicons
              name="locate-outline"
              size={24}
              color={COLORS.black}
            />

          </Pressable>


          {/* ============================================================
              SAFETY
          ============================================================ */}

          <Pressable
            style={styles.safetyButton}
            onPress={handleSafety}
          >

            <View
              style={styles.safetyIconCircle}
            >

              <Ionicons
                name="shield"
                size={26}
                color={COLORS.red}
              />

            </View>

            <Text
              style={styles.safetyText}
            >
              Safety
            </Text>

          </Pressable>


          {/* ============================================================
              ROUTE LOADING
          ============================================================ */}

          {routeLoading && (

            <View
              style={styles.routeLoading}
            >

              <ActivityIndicator
                size="small"
                color={COLORS.green}
              />

              <Text
                style={styles.routeLoadingText}
              >
                Loading route...
              </Text>

            </View>

          )}


          {/* ============================================================
              MAP LOADING
          ============================================================ */}

          {!mapLoaded && (

            <View
              pointerEvents="none"
              style={styles.mapLoadingOverlay}
            >

              <ActivityIndicator
                size="small"
                color={COLORS.green}
              />

            </View>

          )}

        </View>

        {/* ================================================================
            MAP END
        ================================================================ */}

      </View>

    </SafeAreaView>
  );
}

/* =========================================================================
   RIDEX RIDE IN PROGRESS SCREEN END
   ========================================================================= */


/* =========================================================================
   RIDEX STYLES START
   ========================================================================= */

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  screen: {
    flex: 1,
  },

  screenCompact: {
    paddingBottom: 0,
  },

  headerCard: {
    height: 68,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    marginHorizontal: 12,
    marginTop: 6,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 10,
  },

  headerCardCompact: {
    height: 60,
  },

  headerBack: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    color: COLORS.black,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  headerSubtitle: {
    color: COLORS.gray,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },

  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },

  headerActionButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor:
      COLORS.greenVerySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mapContainer: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    overflow: 'hidden',
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: '#E9F0ED',
  },

  mapContainerCompact: {
    marginTop: 8,
  },

  nativeMap: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  mapLoadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E9F0ED',
  },

  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mapFallbackText: {
    color: COLORS.gray,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },

  pickupMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor:
      COLORS.greenSoft,
    borderWidth: 3,
    borderColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pickupMarkerDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.green,
  },

  dropMarker: {
    width: 40,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },

  mapRiderMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor:
      COLORS.greenSoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 4,
  },

  mapRiderImage: {
    width: 46,
    height: 46,
  },

  dropCard: {
    position: 'absolute',
    top: 16,
    left: 16,
    maxWidth: 200,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  dropLabel: {
    color: COLORS.red,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  dropName: {
    color: COLORS.black,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
    marginTop: 3,
  },

  pickupCard: {
    position: 'absolute',
    right: 16,
    top: 16,
    maxWidth: 200,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  pickupLabel: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  pickupName: {
    color: COLORS.black,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 3,
  },

  destinationCard: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    right: 16,
    minHeight: 76,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  navigationCircle: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor:
      COLORS.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  destinationCopy: {
    flex: 1,
    marginLeft: 12,
  },

  destinationDistance: {
    color: COLORS.black,
    fontSize: 17,
    fontWeight: '800',
  },

  destinationSubtext: {
    color: COLORS.gray,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },

  locateButton: {
    position: 'absolute',
    right: 16,
    bottom: 104,
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  safetyButton: {
    position: 'absolute',
    right: 16,
    bottom: 158,
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  safetyIconCircle: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  safetyText: {
    color: COLORS.black,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },

  routeLoading: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  routeLoadingText: {
    color: COLORS.gray,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 7,
  },

});

/* =========================================================================
   RIDEX STYLES END
   ========================================================================= */