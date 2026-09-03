import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  APIProvider,
  AdvancedMarker,
  Map,
  Polyline,
  useMap,
} from '@vis.gl/react-google-maps';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GOOGLE_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

type LatLng = {
  lat: number;
  lng: number;
};

type RouteInfo = {
  distanceMeters: number;
  durationSeconds: number;
  path: LatLng[];
};

const DEFAULT_PICKUP: LatLng = {
  lat: 16.5062,
  lng: 80.648,
};

const DEFAULT_DESTINATION: LatLng = {
  lat: 16.5208,
  lng: 80.624,
};

function parseCoordinate(
  value: string | string[] | undefined,
  fallback: number
) {
  const parsed = Number(
    Array.isArray(value) ? value[0] : value
  );

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function formatDistance(meters: number) {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

function formatEta(seconds: number) {
  const minutes = Math.max(
    1,
    Math.ceil(seconds / 60)
  );

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;

  return remaining
    ? `${hours} hr ${remaining} min`
    : `${hours} hr`;
}

function MapCameraController({
  riderLocation,
  pickup,
  destination,
}: {
  riderLocation: LatLng | null;
  pickup: LatLng;
  destination: LatLng;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !window.google) {
      return;
    }

    const bounds =
      new window.google.maps.LatLngBounds();

    if (riderLocation) {
      bounds.extend(riderLocation);
    }

    bounds.extend(pickup);
    bounds.extend(destination);

    map.fitBounds(bounds, 80);
  }, [
    map,
    riderLocation,
    pickup,
    destination,
  ]);

  return null;
}

function NavigationMap({
  riderLocation,
  pickup,
  destination,
  routePath,
}: {
  riderLocation: LatLng | null;
  pickup: LatLng;
  destination: LatLng;
  routePath: LatLng[];
}) {
  const center =
    riderLocation || pickup;

  return (
    <Map
      defaultCenter={center}
      defaultZoom={14}
      mapId="DEMO_MAP_ID"
      gestureHandling="greedy"
      disableDefaultUI={true}
      zoomControl={true}
      fullscreenControl={false}
      streetViewControl={false}
      mapTypeControl={false}
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <MapCameraController
        riderLocation={riderLocation}
        pickup={pickup}
        destination={destination}
      />

      {routePath.length > 1 && (
        <Polyline
          path={routePath}
          strokeColor="#16A34A"
          strokeOpacity={0.95}
          strokeWeight={6}
        />
      )}

      {/* PICKUP */}
      <AdvancedMarker position={pickup}>
        <View style={styles.pickupMarker}>
          <Ionicons
            name="person"
            size={17}
            color="#FFFFFF"
          />
        </View>
      </AdvancedMarker>

      {/* DESTINATION */}
      <AdvancedMarker position={destination}>
        <View style={styles.destinationMarker}>
          <Ionicons
            name="location"
            size={19}
            color="#FFFFFF"
          />
        </View>
      </AdvancedMarker>

      {/* RIDER */}
      {riderLocation && (
        <AdvancedMarker
          position={riderLocation}
        >
          <View style={styles.riderMarkerOuter}>
            <View
              style={styles.riderMarkerInner}
            >
              <Ionicons
                name="bicycle"
                size={18}
                color="#FFFFFF"
              />
            </View>
          </View>
        </AdvancedMarker>
      )}
    </Map>
  );
}

export default function ActiveRideScreen() {
  const params = useLocalSearchParams();

  const pickup = useMemo<LatLng>(
    () => ({
      lat: parseCoordinate(
        params.pickupLat,
        DEFAULT_PICKUP.lat
      ),
      lng: parseCoordinate(
        params.pickupLng,
        DEFAULT_PICKUP.lng
      ),
    }),
    [
      params.pickupLat,
      params.pickupLng,
    ]
  );

  const destination = useMemo<LatLng>(
    () => ({
      lat: parseCoordinate(
        params.destinationLat,
        DEFAULT_DESTINATION.lat
      ),
      lng: parseCoordinate(
        params.destinationLng,
        DEFAULT_DESTINATION.lng
      ),
    }),
    [
      params.destinationLat,
      params.destinationLng,
    ]
  );

  const passengerName =
    typeof params.passengerName === 'string'
      ? params.passengerName
      : 'Passenger';

  const fare =
    typeof params.fare === 'string'
      ? params.fare
      : '40';

  const pickupAddress =
    typeof params.pickupAddress === 'string'
      ? params.pickupAddress
      : 'Passenger pickup';

  const destinationAddress =
    typeof params.destinationAddress ===
    'string'
      ? params.destinationAddress
      : 'Destination';

  const [riderLocation, setRiderLocation] =
    useState<LatLng | null>(null);

  const [routeInfo, setRouteInfo] =
    useState<RouteInfo | null>(null);

  const [loadingRoute, setLoadingRoute] =
    useState(true);

  const [locationError, setLocationError] =
    useState<string | null>(null);

  const [rideStarted, setRideStarted] =
    useState(false);

  const [otp, setOtp] =
    useState('');

  const [showOtp, setShowOtp] =
    useState(false);

  const lastRouteRequest =
    useRef(0);

  const calculateRoute = useCallback(
    async (origin: LatLng) => {
      if (!window.google) {
        return;
      }

      const now = Date.now();

      // Don't request a new route more than
      // once every 5 seconds.
      if (
        now - lastRouteRequest.current <
        5000
      ) {
        return;
      }

      lastRouteRequest.current = now;

      try {
        setLoadingRoute(true);

        const routesLibrary =
          await window.google.maps.importLibrary(
            'routes'
          );

        const RouteClass = (
          routesLibrary as google.maps.RoutesLibrary
        ).Route;

        const response =
          await RouteClass.computeRoutes({
            origin,

            destination: rideStarted
              ? destination
              : pickup,

            travelMode: 'DRIVING',

            routingPreference:
              'TRAFFIC_AWARE',

            fields: [
              'distanceMeters',
              'durationMillis',
              'path',
            ],
          });

        if (!response.routes?.length) {
          setRouteInfo(null);
          return;
        }

        const route =
          response.routes[0];

        const path = (
          route.path || []
        ).map((point) => ({
          lat:
            typeof point.lat === 'function'
              ? point.lat()
              : point.lat,

          lng:
            typeof point.lng === 'function'
              ? point.lng()
              : point.lng,
        }));

        setRouteInfo({
          distanceMeters:
            route.distanceMeters || 0,

          durationSeconds:
            (route.durationMillis || 0) /
            1000,

          path,
        });
      } catch (error) {
        console.error(
          'Route calculation failed:',
          error
        );
      } finally {
        setLoadingRoute(false);
      }
    },
    [
      destination,
      pickup,
      rideStarted,
    ]
  );

  /*
   * BROWSER GPS
   *
   * Chrome uses navigator.geolocation.
   */
  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    if (!navigator.geolocation) {
      setLocationError(
        'Location services are not available in this browser.'
      );

      calculateRoute(pickup);
      return;
    }

    const handleSuccess = (
      position: GeolocationPosition
    ) => {
      const location = {
        lat:
          position.coords.latitude,
        lng:
          position.coords.longitude,
      };

      setRiderLocation(location);
      setLocationError(null);

      calculateRoute(location);
    };

    const handleError = (
      error: GeolocationPositionError
    ) => {
      console.error(
        'GPS error:',
        error
      );

      setLocationError(
        'Location permission is required to show your live position.'
      );

      calculateRoute(pickup);
    };

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    const watchId =
      navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 3000,
        }
      );

    return () => {
      navigator.geolocation.clearWatch(
        watchId
      );
    };
  }, [
    calculateRoute,
    pickup,
  ]);

  /*
   * Recalculate when ride changes from:
   *
   * Rider → Pickup
   *
   * to:
   *
   * Rider → Destination
   */
  useEffect(() => {
    if (riderLocation) {
      // Reset throttle so the new destination
      // gets calculated immediately.
      lastRouteRequest.current = 0;

      calculateRoute(riderLocation);
    }
  }, [rideStarted]);

  const handleStartRide = () => {
    if (otp.length !== 4) {
      return;
    }

    /*
     * DEVELOPMENT OTP
     *
     * Later this will be verified
     * through Supabase.
     */
    if (otp !== '1234') {
      if (Platform.OS === 'web') {
        window.alert(
          'Incorrect OTP. Use 1234 for development.'
        );
      }

      return;
    }

    setShowOtp(false);
    setOtp('');
    setRideStarted(true);

    if (riderLocation) {
      lastRouteRequest.current = 0;

      calculateRoute(
        riderLocation
      );
    }
  };

  const currentRouteDestination =
    rideStarted
      ? destination
      : pickup;

  return (
    <View style={styles.container}>
      {!GOOGLE_API_KEY ? (
        <View
          style={styles.configurationError}
        >
          <Ionicons
            name="warning-outline"
            size={42}
            color="#DC2626"
          />

          <Text
            style={
              styles.configurationTitle
            }
          >
            Google Maps key missing
          </Text>

          <Text
            style={
              styles.configurationText
            }
          >
            Add
            {' '}
            EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
            {' '}
            to rider-app/.env.local and
            restart Expo.
          </Text>
        </View>
      ) : (
        <>
          {/* MAP */}
          <View style={styles.mapContainer}>
            <APIProvider
              apiKey={GOOGLE_API_KEY}
              libraries={['routes']}
            >
              <NavigationMap
                riderLocation={
                  riderLocation
                }
                pickup={
                  currentRouteDestination
                }
                destination={
                  destination
                }
                routePath={
                  routeInfo?.path || []
                }
              />
            </APIProvider>

            {/* BACK */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() =>
                router.back()
              }
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color="#111827"
              />
            </TouchableOpacity>

            {/* NAVIGATION STATUS */}
            <View
              style={
                styles.navigationBadge
              }
            >
              <View
                style={styles.liveDot}
              />

              <Text
                style={
                  styles.navigationBadgeText
                }
              >
                {rideStarted
                  ? 'Navigating to destination'
                  : 'Heading to pickup'}
              </Text>
            </View>

            {/* ROUTE LOADING */}
            {loadingRoute && (
              <View
                style={
                  styles.routeLoading
                }
              >
                <ActivityIndicator
                  size="small"
                  color="#16A34A"
                />

                <Text
                  style={
                    styles.routeLoadingText
                  }
                >
                  Calculating route...
                </Text>
              </View>
            )}

            {/* GPS WARNING */}
            {locationError && (
              <View
                style={
                  styles.locationWarning
                }
              >
                <Ionicons
                  name="location-outline"
                  size={17}
                  color="#92400E"
                />

                <Text
                  style={
                    styles.locationWarningText
                  }
                >
                  GPS permission needed
                  for live rider location
                </Text>
              </View>
            )}

            {/* CURRENT LOCATION */}
            <TouchableOpacity
              style={
                styles.currentLocationButton
              }
              onPress={() => {
                if (riderLocation) {
                  lastRouteRequest.current = 0;

                  calculateRoute(
                    riderLocation
                  );
                }
              }}
            >
              <Ionicons
                name="locate"
                size={24}
                color="#111827"
              />
            </TouchableOpacity>
          </View>

          {/* BOTTOM SHEET */}
          <View
            style={styles.bottomSheet}
          >
            <View
              style={styles.handle}
            />

            {/* STATUS + FARE */}
            <View
              style={styles.statusRow}
            >
              <View>
                <Text
                  style={
                    styles.statusLabel
                  }
                >
                  {rideStarted
                    ? 'RIDE IN PROGRESS'
                    : 'GO TO PICKUP'}
                </Text>

                <Text
                  style={
                    styles.statusTitle
                  }
                >
                  {rideStarted
                    ? destinationAddress
                    : pickupAddress}
                </Text>
              </View>

              <View
                style={
                  styles.fareContainer
                }
              >
                <Text
                  style={
                    styles.fareLabel
                  }
                >
                  FARE
                </Text>

                <Text
                  style={styles.fare}
                >
                  ₹{fare}
                </Text>
              </View>
            </View>

            {/* PASSENGER */}
            <View
              style={
                styles.passengerCard
              }
            >
              <View
                style={styles.avatar}
              >
                <Ionicons
                  name="person"
                  size={22}
                  color="#FFFFFF"
                />
              </View>

              <View
                style={
                  styles.passengerInfo
                }
              >
                <Text
                  style={
                    styles.passengerName
                  }
                >
                  {passengerName}
                </Text>

                <Text
                  style={styles.cashText}
                >
                  Cash payment
                </Text>
              </View>

              <TouchableOpacity
                style={styles.callButton}
              >
                <Ionicons
                  name="call"
                  size={20}
                  color="#16A34A"
                />
              </TouchableOpacity>
            </View>

            {/* DISTANCE + ETA */}
            <View
              style={styles.tripStats}
            >
              <View
                style={styles.stat}
              >
                <Ionicons
                  name="navigate-outline"
                  size={20}
                  color="#16A34A"
                />

                <View>
                  <Text
                    style={
                      styles.statValue
                    }
                  >
                    {routeInfo
                      ? formatDistance(
                          routeInfo.distanceMeters
                        )
                      : '--'}
                  </Text>

                  <Text
                    style={
                      styles.statLabel
                    }
                  >
                    Distance
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.statDivider
                }
              />

              <View
                style={styles.stat}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color="#16A34A"
                />

                <View>
                  <Text
                    style={
                      styles.statValue
                    }
                  >
                    {routeInfo
                      ? formatEta(
                          routeInfo.durationSeconds
                        )
                      : '--'}
                  </Text>

                  <Text
                    style={
                      styles.statLabel
                    }
                  >
                    ETA
                  </Text>
                </View>
              </View>
            </View>

            {/* BEFORE STARTING RIDE */}
            {!rideStarted ? (
              <>
                <TouchableOpacity
                  style={
                    styles.primaryButton
                  }
                  onPress={() =>
                    setShowOtp(true)
                  }
                >
                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    Arrived at Pickup
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={21}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.cancelButton
                  }
                  onPress={() =>
                    router.replace(
                      '/rides'
                    )
                  }
                >
                  <Text
                    style={
                      styles.cancelButtonText
                    }
                  >
                    Cancel Ride
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              /* AFTER OTP */
              <TouchableOpacity
                style={
                  styles.primaryButton
                }
                onPress={() => {
                  if (
                    Platform.OS === 'web'
                  ) {
                    const confirmed =
                      window.confirm(
                        'Complete this ride?'
                      );

                    if (!confirmed) {
                      return;
                    }
                  }

                  router.replace(
                    '/home'
                  );
                }}
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Complete Ride
                </Text>

                <Ionicons
                  name="checkmark"
                  size={21}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* OTP MODAL */}
          {showOtp && (
            <View
              style={styles.otpOverlay}
            >
              <View
                style={styles.otpCard}
              >
                {/* CLOSE */}
                <TouchableOpacity
                  style={styles.otpClose}
                  onPress={() => {
                    setShowOtp(false);
                    setOtp('');
                  }}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color="#111827"
                  />
                </TouchableOpacity>

                {/* ICON */}
                <View
                  style={styles.otpIcon}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={30}
                    color="#16A34A"
                  />
                </View>

                <Text
                  style={styles.otpTitle}
                >
                  Enter Passenger OTP
                </Text>

                <Text
                  style={
                    styles.otpSubtitle
                  }
                >
                  Ask the passenger for the
                  4-digit OTP shown in their
                  app.
                </Text>

                {/* REAL INPUT */}
                <View
                  style={
                    styles.otpInputWrapper
                  }
                >
                  <TextInput
                    value={otp}
                    onChangeText={(
                      value
                    ) => {
                      const cleaned =
                        value
                          .replace(
                            /[^0-9]/g,
                            ''
                          )
                          .slice(0, 4);

                      setOtp(cleaned);
                    }}
                    keyboardType="number-pad"
                    inputMode="numeric"
                    maxLength={4}
                    autoFocus
                    style={
                      styles.otpHiddenInput
                    }
                  />

                  {/* VISUAL BOXES */}
                  <View
                    style={
                      styles.otpInputRow
                    }
                  >
                    {[0, 1, 2, 3].map(
                      (index) => (
                        <View
                          key={index}
                          style={[
                            styles.otpBox,
                            otp[index]
                              ? styles.otpBoxFilled
                              : null,
                          ]}
                        >
                          <Text
                            style={
                              styles.otpDigit
                            }
                          >
                            {otp[index] ||
                              ''}
                          </Text>
                        </View>
                      )
                    )}
                  </View>
                </View>

                {/* START RIDE */}
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    otp.length !== 4 &&
                      styles.disabledButton,
                  ]}
                  disabled={
                    otp.length !== 4
                  }
                  onPress={
                    handleStartRide
                  }
                >
                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    Start Ride
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                {/* DEVELOPMENT ONLY */}
                <Text
                  style={
                    styles.devOtpText
                  }
                >
                  Development OTP: 1234
                </Text>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  mapContainer: {
    flex: 1,
    minHeight: 420,
    position: 'relative',
  },

  configurationError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#FFFFFF',
  },

  configurationTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginTop: 16,
  },

  configurationText: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    marginTop: 10,
  },

  backButton: {
    position: 'absolute',
    top: 18,
    left: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 5,
  },

  navigationBadge: {
    position: 'absolute',
    top: 18,
    left: 76,
    right: 18,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 5,
  },

  liveDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#16A34A',
    marginRight: 9,
  },

  navigationBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },

  routeLoading: {
    position: 'absolute',
    top: 76,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOpacity: 0.12,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 4,
  },

  routeLoadingText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },

  locationWarning: {
    position: 'absolute',
    bottom: 18,
    left: 16,
    right: 72,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },

  locationWarningText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 7,
  },

  currentLocationButton: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 5,
  },

  pickupMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563EB',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  destinationMarker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DC2626',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  riderMarkerOuter: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor:
      'rgba(22,163,74,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  riderMarkerInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#16A34A',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 22,
    shadowOpacity: 0.12,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: -5,
    },
    elevation: 10,
  },

  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 16,
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  statusLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16A34A',
    letterSpacing: 0.8,
  },

  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
    maxWidth: 245,
  },

  fareContainer: {
    alignItems: 'flex-end',
  },

  fareLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
  },

  fare: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    marginTop: 2,
  },

  passengerCard: {
    marginTop: 15,
    padding: 12,
    borderRadius: 15,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  passengerInfo: {
    flex: 1,
    marginLeft: 11,
  },

  passengerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  cashText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },

  callButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tripStats: {
    marginTop: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },

  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  statDivider: {
    width: 1,
    height: 35,
    backgroundColor: '#E5E7EB',
  },

  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },

  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },

  primaryButton: {
    marginTop: 15,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  disabledButton: {
    backgroundColor: '#9CA3AF',
  },

  cancelButton: {
    marginTop: 9,
    alignItems: 'center',
    justifyContent: 'center',
    height: 35,
  },

  cancelButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },

  otpOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor:
      'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },

  otpCard: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
  },

  otpClose: {
    position: 'absolute',
    right: 15,
    top: 15,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  otpIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 6,
  },

  otpTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    marginTop: 15,
  },

  otpSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 7,
  },

  otpInputWrapper: {
    position: 'relative',
    marginTop: 20,
  },

  /*
   * The real TextInput receives keyboard input.
   * The four boxes below display its value.
   */
  otpHiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },

  otpInputRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },

  otpBox: {
    width: 50,
    height: 54,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  otpBoxFilled: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },

  otpDigit: {
    fontSize: 21,
    fontWeight: '800',
    color: '#111827',
  },

  devOtpText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 10,
  },
});