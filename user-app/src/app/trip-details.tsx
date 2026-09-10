import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from 'react-native-maps';


/* =========================================================================
   RIDEX — TRIP DETAILS
   =========================================================================

   RESPONSIBILITIES

   1. Show pickup + destination
   2. Calculate REAL Google road route
   3. Calculate REAL distance
   4. Calculate REAL traffic-aware duration
   5. Calculate initial RIDEX fare range
   6. Select Bike / Auto
   7. Select fare mode:
        - RIDEX Suggested
        - My Price

   IMPORTANT

   This screen does NOT decide whether a rider wins a ride.

   Rider matching, rider acceptance, counter-offers and ride locking
   are backend responsibilities.

   ========================================================================= */


/* =========================================================================
   GOOGLE CONFIG
   ========================================================================= */

const GOOGLE_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_ROUTES_API_KEY;


/* =========================================================================
   COLORS
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

  border: '#E7EAED',

  white: '#FFFFFF',

  mapBackground: '#EEF3F2',

  yellowSoft: '#FFF7D8',

  yellowText: '#8A6500',

};


/* =========================================================================
   TYPES
   ========================================================================= */

type Coordinates = {

  lat: number;

  lng: number;

};


type VehicleType =

  | 'bike'

  | 'auto';


type PricingMode =

  | 'suggested'

  | 'manual';


type Vehicle = {

  id: VehicleType;

  name: string;

  subtitle: string;

  icon: string;

};


type RouteInfo = {

  distanceText: string;

  durationText: string;

  distanceMeters: number;

  durationSeconds: number;

  polyline: Coordinates[];

};


type FareQuote = {

  minimum: number;

  recommended: number;

  maximum: number;

};


/* =========================================================================
   VEHICLES
   ========================================================================= */

const VEHICLES: Vehicle[] = [

  {

    id: 'bike',

    name: 'Bike',

    subtitle: '1 rider',

    icon: 'bicycle',

  },

  {

    id: 'auto',

    name: 'Auto',

    subtitle: 'Up to 3',

    icon: 'car',

  },

];


/* =========================================================================
   PRICING ENGINE
   ========================================================================= */

const PRICING = {

  bike: {

    base: 20,

    perKm: 7,

    perMinute: 1,

    minimumFare: 40,

  },

  auto: {

    base: 30,

    perKm: 10,

    perMinute: 1.5,

    minimumFare: 60,

  },

};


const roundFare = (
  amount: number,
): number => {

  if (
    !Number.isFinite(amount)
  ) {

    return 0;

  }

  return Math.round(
    amount / 5,
  ) * 5;

};


const calculateSuggestedFare = (

  vehicle: VehicleType,

  distanceMeters: number,

  durationSeconds: number,

): FareQuote | null => {

  if (

    !Number.isFinite(
      distanceMeters,
    ) ||

    !Number.isFinite(
      durationSeconds,
    ) ||

    distanceMeters <= 0 ||

    durationSeconds <= 0

  ) {

    return null;

  }


  const distanceKm =
    distanceMeters / 1000;


  const durationMinutes =
    durationSeconds / 60;


  const rate =
    PRICING[vehicle];


  const calculatedFare =

    rate.base +

    (
      distanceKm *
      rate.perKm
    ) +

    (
      durationMinutes *
      rate.perMinute
    );


  const fairFare =
    Math.max(
      calculatedFare,
      rate.minimumFare,
    );


  const minimum =
    Math.max(

      rate.minimumFare,

      roundFare(
        fairFare * 0.92,
      ),

    );


  const recommended =
    Math.max(

      minimum,

      roundFare(
        fairFare,
      ),

    );


  const maximum =
    Math.max(

      recommended,

      roundFare(
        fairFare * 1.10,
      ),

    );


  return {

    minimum,

    recommended,

    maximum,

  };

};


/* =========================================================================
   MAP HELPER
   ========================================================================= */

function fitNativeMapToRoute(

  mapRef: React.RefObject<MapView>,

  pickup: Coordinates | null,

  drop: Coordinates | null,

  polyline: Coordinates[],

) {

  const points: {

    latitude: number;

    longitude: number;

  }[] = [];


  if (pickup) {

    points.push({

      latitude:
        pickup.lat,

      longitude:
        pickup.lng,

    });

  }


  if (drop) {

    points.push({

      latitude:
        drop.lat,

      longitude:
        drop.lng,

    });

  }


  if (polyline.length > 1) {

    points.push(

      ...polyline.map(
        (point) => ({

          latitude:
            point.lat,

          longitude:
            point.lng,

        }),
      ),

    );

  }


  if (points.length < 2) {

    return;

  }


  mapRef.current?.fitToCoordinates(

    points,

    {

      edgePadding: {

        top: 55,

        right: 45,

        bottom: 75,

        left: 45,

      },

      animated: true,

    },

  );

}


/* =========================================================================
   GOOGLE ROUTES
   ========================================================================= */

async function calculateGoogleRoute(

  pickup: Coordinates,

  drop: Coordinates,

  pickupName?: string,

  pickupAddress?: string,

  dropName?: string,

  dropAddress?: string,

): Promise<RouteInfo> {

  const samePoint =

    Math.abs(
      pickup.lat -
      drop.lat,
    ) < 0.000001 &&

    Math.abs(
      pickup.lng -
      drop.lng,
    ) < 0.000001;


  if (samePoint) {

    throw new Error(
      'Pickup and destination are the same.',
    );

  }


  if (!GOOGLE_API_KEY) {

    throw new Error(
      'Google Maps API key is missing.',
    );

  }


  const requestBody = {

    origin: {

      location: {

        latLng: {

          latitude:
            pickup.lat,

          longitude:
            pickup.lng,

        },

      },

    },

    destination: {

      location: {

        latLng: {

          latitude:
            drop.lat,

          longitude:
            drop.lng,

        },

      },

    },

    travelMode:
      'DRIVE',

    routingPreference:
      'TRAFFIC_AWARE',

    computeAlternativeRoutes:
      false,

    languageCode:
      'en-IN',

    units:
      'METRIC',

  };


  console.log(

    'RIDEX ROUTES API REQUEST:',

    {

      pickup,

      drop,

      pickupName,

      pickupAddress,

      dropName,

      dropAddress,

    },

  );


  const response =
    await fetch(

      'https://routes.googleapis.com/directions/v2:computeRoutes',

      {

        method:
          'POST',

        headers: {

          'Content-Type':
            'application/json',

          'X-Goog-Api-Key':
            GOOGLE_API_KEY,

          'X-Goog-FieldMask':
            [

              'routes.distanceMeters',

              'routes.duration',

              'routes.staticDuration',

              'routes.polyline.encodedPolyline',

            ].join(','),

        },

        body:
          JSON.stringify(
            requestBody,
          ),

      },

    );


  const responseText =
    await response.text();


  if (!response.ok) {

    console.error(

      'RIDEX ROUTES API ERROR:',

      {

        status:
          response.status,

        body:
          responseText,

      },

    );


    throw new Error(

      `Google Routes API failed (${response.status}).`,

    );

  }


  let result: any;


  try {

    result =
      JSON.parse(
        responseText,
      );

  } catch {

    throw new Error(
      'Google returned an invalid route response.',
    );

  }


  const route =
    result?.routes?.[0];


  if (!route) {

    throw new Error(
      'Google returned no route.',
    );

  }


  const distanceMeters =
    Number(
      route.distanceMeters || 0,
    );


  if (
    distanceMeters <= 0
  ) {

    throw new Error(
      'Google returned invalid distance.',
    );

  }


  const distanceKm =
    distanceMeters / 1000;


  const distanceText =

    distanceKm < 1

      ? `${Math.round(
          distanceMeters,
        )} m`

      : `${distanceKm.toFixed(
          1,
        )} km`;


  const parseGoogleDuration =
    (
      value: string,
    ): number => {

      const match =
        value.match(
          /^([0-9]+(?:\.[0-9]+)?)s$/,
        );


      if (!match) {

        return 0;

      }


      const seconds =
        Number(
          match[1],
        );


      return Number.isFinite(
        seconds,
      )

        ? seconds

        : 0;

    };


  const durationSecondsRaw =
    parseGoogleDuration(

      typeof route.duration === 'string'

        ? route.duration

        : '',

    );


  const staticDurationSeconds =
    parseGoogleDuration(

      typeof route.staticDuration === 'string'

        ? route.staticDuration

        : '',

    );


  const durationSeconds =

    Math.max(

      1,

      Math.round(

        durationSecondsRaw > 0

          ? durationSecondsRaw

          : staticDurationSeconds,

      ),

    );


  if (

    !Number.isFinite(
      durationSeconds,
    ) ||

    durationSeconds <= 0

  ) {

    throw new Error(
      'Google returned no usable duration.',
    );

  }


  const durationMinutes =

    Math.max(

      1,

      Math.round(
        durationSeconds / 60,
      ),

    );


  const durationText =
    `${durationMinutes} min`;


  const encodedPolyline =
    route?.polyline?.encodedPolyline || '';


  const decodeGooglePolyline = (

    encoded: string,

  ): Coordinates[] => {

    const points: Coordinates[] = [];

    let index = 0;

    let latitude = 0;

    let longitude = 0;


    while (
      index < encoded.length
    ) {

      let shift = 0;

      let result = 0;

      let byte = 0;


      do {

        byte =
          encoded.charCodeAt(
            index++,
          ) - 63;


        result |=
          (byte & 0x1f) <<
          shift;


        shift += 5;

      } while (

        byte >= 0x20 &&

        index < encoded.length

      );


      const deltaLatitude =

        (result & 1)

          ? ~(result >> 1)

          : result >> 1;


      latitude +=
        deltaLatitude;


      shift = 0;

      result = 0;


      do {

        byte =
          encoded.charCodeAt(
            index++,
          ) - 63;


        result |=
          (byte & 0x1f) <<
          shift;


        shift += 5;

      } while (

        byte >= 0x20 &&

        index < encoded.length

      );


      const deltaLongitude =

        (result & 1)

          ? ~(result >> 1)

          : result >> 1;


      longitude +=
        deltaLongitude;


      points.push({

        lat:
          latitude / 1e5,

        lng:
          longitude / 1e5,

      });

    }


    return points;

  };


  const polyline =

    encodedPolyline

      ? decodeGooglePolyline(
          encodedPolyline,
        )

      : [];


  console.log(

    'RIDEX ROUTE SUCCESS:',

    {

      distance:
        distanceText,

      duration:
        durationText,

      distanceMeters,

      durationSeconds,

      routePoints:
        polyline.length,

    },

  );


  return {

    distanceText,

    durationText,

    distanceMeters,

    durationSeconds,

    polyline,

  };

}


/* =========================================================================
   SCREEN
   ========================================================================= */

export default function TripDetailsScreen() {

  const router =
    useRouter();


  /* -----------------------------------------------------------------------
     ROUTE PARAMETERS
     ----------------------------------------------------------------------- */

  const params =
    useLocalSearchParams<{

      pickupName?: string;

      pickupAddress?: string;

      pickupLat?: string;

      pickupLng?: string;

      dropName?: string;

      dropAddress?: string;

      dropLat?: string;

      dropLng?: string;

    }>();


  /* -----------------------------------------------------------------------
     PICKUP COORDINATES
     ----------------------------------------------------------------------- */

  const pickupCoordinates =
    useMemo<Coordinates | null>(() => {

      const lat =
        Number(
          params.pickupLat,
        );


      const lng =
        Number(
          params.pickupLng,
        );


      if (

        !Number.isFinite(lat) ||

        !Number.isFinite(lng) ||

        lat < -90 ||

        lat > 90 ||

        lng < -180 ||

        lng > 180 ||

        (lat === 0 && lng === 0)

      ) {

        return null;

      }


      return {

        lat,

        lng,

      };

    }, [

      params.pickupLat,

      params.pickupLng,

    ]);


  /* -----------------------------------------------------------------------
     DROP COORDINATES
     ----------------------------------------------------------------------- */

  const dropCoordinates =
    useMemo<Coordinates | null>(() => {

      const lat =
        Number(
          params.dropLat,
        );


      const lng =
        Number(
          params.dropLng,
        );


      if (

        !Number.isFinite(lat) ||

        !Number.isFinite(lng) ||

        lat < -90 ||

        lat > 90 ||

        lng < -180 ||

        lng > 180 ||

        (lat === 0 && lng === 0)

      ) {

        return null;

      }


      return {

        lat,

        lng,

      };

    }, [

      params.dropLat,

      params.dropLng,

    ]);


  /* -----------------------------------------------------------------------
     DISPLAY VALUES
     ----------------------------------------------------------------------- */

  const pickupName =
    params.pickupName ||
    'Current location';


  const pickupAddress =
    params.pickupAddress ||
    '';


  const dropName =
    params.dropName ||
    'Destination';


  const dropAddress =
    params.dropAddress ||
    '';


  /* -----------------------------------------------------------------------
     VEHICLE
     ----------------------------------------------------------------------- */

  const [

    selectedVehicle,

    setSelectedVehicle,

  ] = useState<VehicleType>(
    'bike',
  );


  /* -----------------------------------------------------------------------
     FARE MODE
     -----------------------------------------------------------------------

     Default:

       RIDEX Suggested

     This keeps the booking experience simple for normal users.

     Users who want negotiation control can choose:

       My Price

     ----------------------------------------------------------------------- */

  const [

    pricingMode,

    setPricingMode,

  ] = useState<PricingMode>(
    'suggested',
  );


  /* -----------------------------------------------------------------------
     MAP REF
     ----------------------------------------------------------------------- */

  const mapRef =
    React.useRef<MapView>(
      null!,
    );


  /* -----------------------------------------------------------------------
     ROUTE STATE
     ----------------------------------------------------------------------- */

  const [

    routeInfo,

    setRouteInfo,

  ] = useState<RouteInfo | null>(
    null,
  );


  const [

    routeLoading,

    setRouteLoading,

  ] = useState(true);


  const [

    routeError,

    setRouteError,

  ] = useState(false);


  /* -----------------------------------------------------------------------
     LOAD ROUTE
     ----------------------------------------------------------------------- */

  const loadRoute =
    useCallback(

      async () => {

        if (

          !pickupCoordinates ||

          !dropCoordinates

        ) {

          setRouteInfo(
            null,
          );

          setRouteLoading(
            false,
          );

          setRouteError(
            true,
          );

          return;

        }


        setRouteLoading(
          true,
        );


        setRouteError(
          false,
        );


        try {

          const newRoute =
            await calculateGoogleRoute(

              pickupCoordinates,

              dropCoordinates,

              pickupName,

              pickupAddress,

              dropName,

              dropAddress,

            );


          setRouteInfo(
            newRoute,
          );

        } catch (error) {

          console.error(

            'RIDEX ROUTE ERROR:',

            error,

          );


          setRouteInfo(
            null,
          );

          setRouteError(
            true,
          );

        } finally {

          setRouteLoading(
            false,
          );

        }

      },

      [

        pickupCoordinates,

        dropCoordinates,

        pickupName,

        pickupAddress,

        dropName,

        dropAddress,

      ],

    );


  useEffect(() => {

    loadRoute();

  }, [

    loadRoute,

  ]);


  /* -----------------------------------------------------------------------
     FIT MAP
     ----------------------------------------------------------------------- */

  useEffect(() => {

    if (

      routeInfo &&

      routeInfo.polyline.length > 1

    ) {

      fitNativeMapToRoute(

        mapRef,

        pickupCoordinates,

        dropCoordinates,

        routeInfo.polyline,

      );

    }

  }, [

    routeInfo,

    pickupCoordinates,

    dropCoordinates,

  ]);


  /* -----------------------------------------------------------------------
     FARE
     ----------------------------------------------------------------------- */

  const suggestedFare =
    useMemo(

      () =>

        calculateSuggestedFare(

          selectedVehicle,

          routeInfo?.distanceMeters || 0,

          routeInfo?.durationSeconds || 0,

        ),

      [

        selectedVehicle,

        routeInfo?.distanceMeters,

        routeInfo?.durationSeconds,

      ],

    );


  /* -----------------------------------------------------------------------
     BACK
     ----------------------------------------------------------------------- */

  const handleBack =
    useCallback(() => {

      if (
        router.canGoBack()
      ) {

        router.back();

        return;

      }


      router.replace(
        '/home',
      );

    }, [

      router,

    ]);


  /* -----------------------------------------------------------------------
     CONTINUE
     -----------------------------------------------------------------------

     TEMPORARY BRIDGE

     We still send the user to make-offer.tsx for this implementation
     layer.

     The important change is that Trip Details now owns the fare mode
     and passes it forward.

     Next implementation layer will replace this with:

       POST /api/rides

     ----------------------------------------------------------------------- */

  const handleContinue = useCallback(() => {
    if (!routeInfo) {
      Alert.alert('Route not ready', 'Please wait for the route to load.');
      return;
    }
    if (!suggestedFare) {
      Alert.alert('Fare not ready', 'Please wait for the fare to load.');
      return;
    }
    if (!pickupCoordinates || !dropCoordinates) {
      Alert.alert('Location not ready', 'Please wait for locations to load.');
      return;
    }

    const commonParams = {
      pickupName,
      pickupAddress,
      pickupLat: String(pickupCoordinates.lat),
      pickupLng: String(pickupCoordinates.lng),

      dropName,
      dropAddress,
      dropLat: String(dropCoordinates.lat),
      dropLng: String(dropCoordinates.lng),

      distanceText: routeInfo.distanceText,
      durationText: routeInfo.durationText,

      minFare: String(suggestedFare.minimum),
      maxFare: String(suggestedFare.maximum),
      suggestedFare: String(suggestedFare.recommended),

      vehicle: selectedVehicle,
      pricingMode,
    };

    if (pricingMode === 'suggested') {
      router.push({
        pathname: '/rider-responses',
        params: {
          ...commonParams,
          userOffer: String(suggestedFare.recommended),
        },
      });
      return;
    }

    router.push({
      pathname: '/make-offer',
      params: {
        ...commonParams,
        userOffer: String(suggestedFare.recommended),
      },
    });
  }, [
    router,
    routeInfo,
    suggestedFare,
    pickupCoordinates,
    dropCoordinates,
    pickupName,
    pickupAddress,
    dropName,
    dropAddress,
    selectedVehicle,
    pricingMode,
  ]);


  /* =========================================================================
     UI
     ========================================================================= */

  return (

    <SafeAreaView
      style={
        styles.safeArea
      }
    >

      <ScrollView

        style={
          styles.screen
        }

        contentContainerStyle={
          styles.screenContent
        }

        showsVerticalScrollIndicator={
          false
        }

        keyboardShouldPersistTaps="handled"

      >

        {/* ================================================================
            HEADER
        ================================================================ */}

        <View
          style={
            styles.header
          }
        >

          <Pressable

            style={
              styles.backButton
            }

            onPress={
              handleBack
            }

          >

            <Ionicons

              name="arrow-back"

              size={25}

              color={
                COLORS.black
              }

            />

          </Pressable>


          <View
            style={
              styles.headerCenter
            }
          >

            <Text
              style={
                styles.headerTitle
              }
            >
              Trip Details
            </Text>


            <Text
              style={
                styles.headerSubtitle
              }
            >
              Review your ride
            </Text>

          </View>


          <View
            style={
              styles.headerSpacer
            }
          />

        </View>


        {/* ================================================================
            LOCATIONS
        ================================================================ */}

        <View
          style={
            styles.locationCard
          }
        >

          <View
            style={
              styles.locationRow
            }
          >

            <View
              style={
                styles.markerColumn
              }
            >

              <View
                style={
                  styles.pickupMarker
                }
              >

                <View
                  style={
                    styles.pickupDot
                  }
                />

              </View>

            </View>


            <View
              style={
                styles.locationText
              }
            >

              <Text
                style={
                  styles.pickupLabel
                }
              >
                Pickup
              </Text>


              <Text
                style={
                  styles.locationName
                }
                numberOfLines={1}
              >
                {pickupName}
              </Text>


              {!!pickupAddress && (

                <Text
                  style={
                    styles.locationAddress
                  }
                  numberOfLines={1}
                >
                  {pickupAddress}
                </Text>

              )}

            </View>

          </View>


          <View
            style={
              styles.locationConnector
            }
          />


          <View
            style={
              styles.locationRow
            }
          >

            <View
              style={
                styles.markerColumn
              }
            >

              <Ionicons

                name="location"

                size={34}

                color={
                  COLORS.red
                }

              />

            </View>


            <View
              style={
                styles.locationText
              }
            >

              <Text
                style={
                  styles.dropLabel
                }
              >
                Destination
              </Text>


              <Text
                style={
                  styles.locationName
                }
                numberOfLines={1}
              >
                {dropName}
              </Text>


              {!!dropAddress && (

                <Text
                  style={
                    styles.locationAddress
                  }
                  numberOfLines={1}
                >
                  {dropAddress}
                </Text>

              )}

            </View>

          </View>

        </View>


        {/* ================================================================
            MAP
        ================================================================ */}

        <View
          style={
            styles.mapContainer
          }
        >

          <MapView

            ref={
              mapRef
            }

            style={
              StyleSheet.absoluteFill
            }

            provider={
              PROVIDER_GOOGLE
            }

            initialRegion={{

              latitude:
                (pickupCoordinates ||
                  dropCoordinates)?.lat ||
                16.5062,

              longitude:
                (pickupCoordinates ||
                  dropCoordinates)?.lng ||
                80.6480,

              latitudeDelta:
                pickupCoordinates &&
                dropCoordinates

                  ? Math.max(

                      0.04,

                      Math.abs(

                        pickupCoordinates.lat -
                        dropCoordinates.lat,

                      ) * 1.8,

                    )

                  : 0.04,

              longitudeDelta:
                pickupCoordinates &&
                dropCoordinates

                  ? Math.max(

                      0.04,

                      Math.abs(

                        pickupCoordinates.lng -
                        dropCoordinates.lng,

                      ) * 1.8,

                    )

                  : 0.04,

            }}

            onMapReady={() => {

              fitNativeMapToRoute(

                mapRef,

                pickupCoordinates,

                dropCoordinates,

                routeInfo?.polyline || [],

              );

            }}

            rotateEnabled={
              false
            }

            pitchEnabled={
              false
            }

            toolbarEnabled={
              false
            }

            showsCompass={
              false
            }

            showsTraffic={
              false
            }

            showsBuildings={
              true
            }

    

          >

            {pickupCoordinates && (

              <Marker

                coordinate={{

                  latitude:
                    pickupCoordinates.lat,

                  longitude:
                    pickupCoordinates.lng,

                }}

                anchor={{

                  x: 0.5,

                  y: 0.5,

                }}

                tracksViewChanges={
                  false
                }

              >

                <View
                  style={
                    styles.mapPickupMarker
                  }
                >

                  <View
                    style={
                      styles.mapPickupDot
                    }
                  />

                </View>

              </Marker>

            )}


            {dropCoordinates && (

              <Marker

                coordinate={{

                  latitude:
                    dropCoordinates.lat,

                  longitude:
                    dropCoordinates.lng,

                }}

                anchor={{

                  x: 0.5,

                  y: 1,

                }}

                tracksViewChanges={
                  false
                }

              >

                <View
                  style={
                    styles.mapDropMarker
                  }
                >

                  <Ionicons

                    name="location"

                    size={38}

                    color={
                      COLORS.red
                    }

                  />

                </View>

              </Marker>

            )}


            {routeInfo &&
              routeInfo.polyline.length > 1 && (

              <Polyline

                coordinates={

                  routeInfo.polyline.map(
                    (point) => ({

                      latitude:
                        point.lat,

                      longitude:
                        point.lng,

                    }),
                  )

                }

                strokeColor={
                  COLORS.green
                }

                strokeWidth={
                  5
                }

                lineCap="round"

                lineJoin="round"

              />

            )}

          </MapView>


          {routeLoading && (

            <View
              style={
                styles.routeStatus
              }
            >

              <ActivityIndicator

                size="small"

                color={
                  COLORS.green
                }

              />


              <Text
                style={
                  styles.routeStatusText
                }
              >
                Calculating route...
              </Text>

            </View>

          )}


          {routeError &&
            !routeLoading && (

            <View
              style={
                styles.routeError
              }
            >

              <Ionicons

                name="warning-outline"

                size={17}

                color={
                  COLORS.red
                }

              />


              <Text
                style={
                  styles.routeErrorText
                }
              >
                Route unavailable
              </Text>

            </View>

          )}


          {routeInfo &&
            !routeLoading && (

            <View
              style={
                styles.mapSummary
              }
            >

              <View
                style={
                  styles.mapSummaryItem
                }
              >

                <Ionicons

                  name="navigate-outline"

                  size={17}

                  color={
                    COLORS.green
                  }

                />


                <Text
                  style={
                    styles.mapSummaryText
                  }
                >
                  {routeInfo.distanceText}
                </Text>

              </View>


              <View
                style={
                  styles.mapSummaryDivider
                }
              />


              <View
                style={
                  styles.mapSummaryItem
                }
              >

                <Ionicons

                  name="time-outline"

                  size={17}

                  color={
                    COLORS.green
                  }

                />


                <Text
                  style={
                    styles.mapSummaryText
                  }
                >
                  {routeInfo.durationText}
                </Text>

              </View>

            </View>

          )}

        </View>


        {/* ================================================================
            TRIP SUMMARY
        ================================================================ */}

        <View
          style={
            styles.tripSummary
          }
        >

          <View
            style={
              styles.summaryItem
            }
          >

            <View
              style={
                styles.summaryIcon
              }
            >

              <Ionicons

                name="navigate-outline"

                size={22}

                color={
                  COLORS.green
                }

              />

            </View>


            <View>

              <Text
                style={
                  styles.summaryValue
                }
              >
                {routeInfo
                  ? routeInfo.distanceText
                  : '—'}
              </Text>


              <Text
                style={
                  styles.summaryLabel
                }
              >
                Distance
              </Text>

            </View>

          </View>


          <View
            style={
              styles.summaryDivider
            }
          />


          <View
            style={
              styles.summaryItem
            }
          >

            <View
              style={
                styles.summaryIcon
              }
            >

              <Ionicons

                name="time-outline"

                size={22}

                color={
                  COLORS.green
                }

              />

            </View>


            <View>

              <Text
                style={
                  styles.summaryValue
                }
              >
                {routeInfo
                  ? routeInfo.durationText
                  : '—'}
              </Text>


              <Text
                style={
                  styles.summaryLabel
                }
              >
                Est. time
              </Text>

            </View>

          </View>


          <View
            style={
              styles.summaryDivider
            }
          />


          <View
            style={
              styles.summaryItem
            }
          >

            <View
              style={
                styles.rupeeCircle
              }
            >

              <Text
                style={
                  styles.rupeeText
                }
              >
                ₹
              </Text>

            </View>


            <View>

              <Text
                style={
                  styles.summaryLabel
                }
              >
                Fare range
              </Text>


              <Text
                style={
                  styles.summaryFare
                }
              >

                {suggestedFare

                  ? `₹${suggestedFare.minimum}–₹${suggestedFare.maximum}`

                  : '—'}

              </Text>

            </View>

          </View>

        </View>


        {/* ================================================================
            VEHICLE
        ================================================================ */}

        <Text
          style={
            styles.sectionTitle
          }
        >
          Choose a vehicle
        </Text>


        <View
          style={
            styles.vehicleRow
          }
        >

          {VEHICLES.map(
            (vehicle) => {

              const active =
                selectedVehicle ===
                vehicle.id;


              const vehicleFare =
                calculateSuggestedFare(

                  vehicle.id,

                  routeInfo?.distanceMeters || 0,

                  routeInfo?.durationSeconds || 0,

                );


              return (

                <Pressable

                  key={
                    vehicle.id
                  }

                  style={[

                    styles.vehicleCard,

                    active &&
                      styles.vehicleCardActive,

                  ]}

                  onPress={() => {

                    setSelectedVehicle(
                      vehicle.id,
                    );

                  }}

                >

                  <View
                    style={[

                      styles.vehicleIcon,

                      active &&
                        styles.vehicleIconActive,

                    ]}
                  >

                    <Ionicons

                      name={
                        vehicle.icon as any
                      }

                      size={38}

                      color={

                        active

                          ? COLORS.green

                          : COLORS.black

                      }

                    />

                  </View>


                  <Text
                    style={
                      styles.vehicleName
                    }
                  >
                    {vehicle.name}
                  </Text>


                  <Text
                    style={
                      styles.vehicleSubtitle
                    }
                  >
                    {vehicle.subtitle}
                  </Text>


                  <Text
                    style={[

                      styles.vehicleFare,

                      active &&
                        styles.vehicleFareActive,

                    ]}
                  >

                    {vehicleFare

                      ? `₹${vehicleFare.minimum} – ₹${vehicleFare.maximum}`

                      : 'Calculating...'}

                  </Text>


                  {active &&
                    vehicleFare && (

                    <View
                      style={
                        styles.recommendedBadge
                      }
                    >

                      <Text
                        style={
                          styles.recommendedText
                        }
                      >
                        ₹
                        {
                          vehicleFare.recommended
                        } recommended
                      </Text>

                    </View>

                  )}

                </Pressable>

              );

            },
          )}

        </View>


        {/* ================================================================
            FARE MODE
        ================================================================ */}

        <View
          style={
            styles.fareModeHeader
          }
        >

          <View>

            <Text
              style={
                styles.sectionTitle
              }
            >
              How would you like to set your fare?
            </Text>


            <Text
              style={
                styles.fareModeSubtitle
              }
            >
              You can change this anytime before requesting.
            </Text>

          </View>

        </View>


        {/* RIDEX SUGGESTED */}

        <Pressable

          style={[

            styles.fareModeCard,

            pricingMode === 'suggested' &&
              styles.fareModeCardActive,

          ]}

          onPress={() =>

            setPricingMode(
              'suggested',
            )

          }

        >

          <View
            style={[
              styles.fareModeIcon,
              pricingMode === 'suggested' &&
                styles.fareModeIconActive,
            ]}
          >

            <Ionicons

              name="sparkles-outline"

              size={25}

              color={

                pricingMode === 'suggested'

                  ? COLORS.green

                  : COLORS.black

              }

            />

          </View>


          <View
            style={
              styles.fareModeContent
            }
          >

            <View
              style={
                styles.fareModeTitleRow
              }
            >

              <Text
                style={
                  styles.fareModeTitle
                }
              >
                RIDEX Suggested
              </Text>


              {pricingMode ===
                'suggested' && (

                <View
                  style={
                    styles.selectedCheck
                  }
                >

                  <Ionicons

                    name="checkmark"

                    size={15}

                    color={
                      COLORS.white
                    }

                  />

                </View>

              )}

            </View>


            <Text
              style={
                styles.fareModeDescription
              }
            >
              Let RIDEX suggest a fair price for this trip.
            </Text>


            {suggestedFare && (

              <Text
                style={
                  styles.fareModePrice
                }
              >
                ₹{suggestedFare.recommended}
                {' '}
                recommended
              </Text>

            )}

          </View>

        </Pressable>


        {/* MY PRICE */}

        <Pressable

          style={[

            styles.fareModeCard,

            pricingMode === 'manual' &&
              styles.fareModeCardActive,

          ]}

          onPress={() =>

            setPricingMode(
              'manual',
            )

          }

        >

          <View
            style={[
              styles.fareModeIcon,
              pricingMode === 'manual' &&
                styles.fareModeIconActive,
            ]}
          >

            <Ionicons

              name="options-outline"

              size={25}

              color={

                pricingMode === 'manual'

                  ? COLORS.green

                  : COLORS.black

              }

            />

          </View>


          <View
            style={
              styles.fareModeContent
            }
          >

            <View
              style={
                styles.fareModeTitleRow
              }
            >

              <Text
                style={
                  styles.fareModeTitle
                }
              >
                My Price
              </Text>


              {pricingMode ===
                'manual' && (

                <View
                  style={
                    styles.selectedCheck
                  }
                >

                  <Ionicons

                    name="checkmark"

                    size={15}

                    color={
                      COLORS.white
                    }

                  />

                </View>

              )}

            </View>


            <Text
              style={
                styles.fareModeDescription
              }
            >
              Choose your price within the RIDEX allowed range.
            </Text>


            {suggestedFare && (

              <Text
                style={
                  styles.fareModePrice
                }
              >
                ₹{suggestedFare.minimum}
                {' – ₹'}
                {suggestedFare.maximum}
              </Text>

            )}

          </View>

        </Pressable>


        {/* ================================================================
            FARE EXPLANATION
        ================================================================ */}

        {suggestedFare && (

          <View
            style={
              styles.fareInfoCard
            }
          >

            <View
              style={
                styles.fareInfoIcon
              }
            >

              <Ionicons

                name="shield-checkmark-outline"

                size={24}

                color={
                  COLORS.green
                }

              />

            </View>


            <View
              style={
                styles.fareInfoContent
              }
            >

              <Text
                style={
                  styles.fareInfoTitle
                }
              >

                {pricingMode === 'suggested'

                  ? 'RIDEX recommends ₹' +
                    suggestedFare.recommended

                  : 'Choose between ₹' +
                    suggestedFare.minimum +
                    ' and ₹' +
                    suggestedFare.maximum}

              </Text>


              <Text
                style={
                  styles.fareInfoText
                }
              >

                Riders can accept your fare or send a counter-offer.
                Once a rider is matched, competing offers will no
                longer be available.

              </Text>

            </View>

          </View>

        )}


        {/* ================================================================
            SELECTED FARE
        ================================================================ */}

        {suggestedFare && (

          <View
            style={
              styles.selectedFareCard
            }
          >

            <View>

              <Text
                style={
                  styles.selectedFareLabel
                }
              >
                {selectedVehicle === 'bike'
                  ? 'Bike'
                  : 'Auto'}
                {' • '}
                {pricingMode === 'suggested'
                  ? 'RIDEX Suggested'
                  : 'My Price'}
              </Text>


              <Text
                style={
                  styles.selectedFareAmount
                }
              >

                ₹
                {
                  suggestedFare.recommended
                }

              </Text>

            </View>


            <View
              style={
                styles.goodOfferBadge
              }
            >

              <Ionicons

                name="checkmark-circle"

                size={18}

                color={
                  COLORS.green
                }

              />


              <Text
                style={
                  styles.goodOfferText
                }
              >

                {pricingMode === 'suggested'

                  ? 'Recommended'

                  : `Allowed ₹${suggestedFare.minimum}–₹${suggestedFare.maximum}`}

              </Text>

            </View>

          </View>

        )}


        {/* ================================================================
            MAIN CTA
        ================================================================ */}

        <Pressable

          style={[

            styles.mainButton,

            (!suggestedFare ||
              !routeInfo ||
              routeLoading) &&

              styles.mainButtonDisabled,

          ]}

          disabled={

            !suggestedFare ||

            !routeInfo ||

            routeLoading

          }

          onPress={
            handleContinue
          }

        >

          <Text style={styles.mainButtonText}>
            {pricingMode === 'suggested'
              ? 'Request Ride'
              : 'Continue to Set Your Price'}
          </Text>


          <Ionicons

            name="arrow-forward"

            size={25}

            color={
              COLORS.white
            }

          />

        </Pressable>


        {/* ================================================================
            TRUST
        ================================================================ */}

        <View
          style={
            styles.trustRow
          }
        >

          <Ionicons

            name="shield-checkmark-outline"

            size={17}

            color={
              COLORS.green
            }

          />


          <Text
            style={
              styles.trustText
            }
          >
            Transparent pricing • Trusted rides
          </Text>

        </View>


        <View
          style={
            styles.bottomSpace
          }
        />

      </ScrollView>

    </SafeAreaView>

  );

}


/* =========================================================================
   STYLES
   ========================================================================= */

const styles =
  StyleSheet.create({

    safeArea: {

      flex: 1,

      backgroundColor:
        COLORS.white,

    },


    screen: {

      flex: 1,

      backgroundColor:
        COLORS.white,

    },


    screenContent: {

      paddingHorizontal:
        20,

      paddingBottom:
        40,

    },


    /* HEADER */

    header: {

      minHeight:
        70,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

    },


    backButton: {

      width:
        44,

      height:
        44,

      borderRadius:
        22,

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    headerCenter: {

      flex: 1,

      alignItems:
        'center',

    },


    headerTitle: {

      fontSize:
        21,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    headerSubtitle: {

      marginTop:
        3,

      fontSize:
        12,

      color:
        COLORS.gray,

    },


    headerSpacer: {

      width:
        44,

    },


    /* LOCATION */

    locationCard: {

      position:
        'relative',

      backgroundColor:
        COLORS.white,

      borderRadius:
        22,

      paddingHorizontal:
        16,

      paddingVertical:
        16,

      marginBottom:
        14,

      borderWidth:
        1,

      borderColor:
        COLORS.border,

      shadowColor:
        '#000',

      shadowOffset: {

        width:
          0,

        height:
          4,

      },

      shadowOpacity:
        0.07,

      shadowRadius:
        12,

      elevation:
        4,

    },


    locationRow: {

      flexDirection:
        'row',

      alignItems:
        'center',

      minHeight:
        64,

    },


    markerColumn: {

      width:
        42,

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    pickupMarker: {

      width:
        25,

      height:
        25,

      borderRadius:
        13,

      borderWidth:
        2,

      borderColor:
        COLORS.green,

      backgroundColor:
        COLORS.greenSoft,

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    pickupDot: {

      width:
        8,

      height:
        8,

      borderRadius:
        4,

      backgroundColor:
        COLORS.green,

    },


    locationConnector: {

      position:
        'absolute',

      left:
        36,

      top:
        69,

      width:
        2,

      height:
        42,

      backgroundColor:
        '#B9E3CA',

    },


    locationText: {

      flex:
        1,

      marginLeft:
        9,

    },


    pickupLabel: {

      fontSize:
        13,

      fontWeight:
        '800',

      color:
        COLORS.green,

    },


    dropLabel: {

      fontSize:
        13,

      fontWeight:
        '800',

      color:
        COLORS.red,

    },


    locationName: {

      marginTop:
        3,

      fontSize:
        16,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    locationAddress: {

      marginTop:
        3,

      fontSize:
        12,

      color:
        COLORS.gray,

    },


    /* MAP */

    mapContainer: {

      height:
        275,

      borderRadius:
        22,

      overflow:
        'hidden',

      marginBottom:
        14,

      backgroundColor:
        COLORS.mapBackground,

    },


    mapPickupMarker: {

      width:
        25,

      height:
        25,

      borderRadius:
        13,

      borderWidth:
        2,

      borderColor:
        COLORS.white,

      backgroundColor:
        COLORS.greenSoft,

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    mapPickupDot: {

      width:
        10,

      height:
        10,

      borderRadius:
        5,

      backgroundColor:
        COLORS.green,

    },


    mapDropMarker: {

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    routeStatus: {

      position:
        'absolute',

      top:
        14,

      left:
        14,

      right:
        14,

      borderRadius:
        14,

      paddingHorizontal:
        12,

      paddingVertical:
        10,

      backgroundColor:
        COLORS.white,

      flexDirection:
        'row',

      alignItems:
        'center',

      shadowColor:
        '#000',

      shadowOpacity:
        0.08,

      shadowRadius:
        8,

      elevation:
        3,

    },


    routeStatusText: {

      marginLeft:
        8,

      fontSize:
        12,

      fontWeight:
        '700',

      color:
        COLORS.gray,

    },


    routeError: {

      position:
        'absolute',

      bottom:
        12,

      left:
        12,

      right:
        12,

      borderRadius:
        14,

      paddingHorizontal:
        12,

      paddingVertical:
        9,

      backgroundColor:
        COLORS.white,

      flexDirection:
        'row',

      alignItems:
        'center',

    },


    routeErrorText: {

      marginLeft:
        6,

      fontSize:
        12,

      fontWeight:
        '700',

      color:
        COLORS.red,

    },


    mapSummary: {

      position:
        'absolute',

      left:
        12,

      right:
        12,

      bottom:
        12,

      minHeight:
        42,

      borderRadius:
        14,

      backgroundColor:
        COLORS.white,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      shadowColor:
        '#000',

      shadowOpacity:
        0.08,

      shadowRadius:
        8,

      elevation:
        3,

    },


    mapSummaryItem: {

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      flex:
        1,

    },


    mapSummaryDivider: {

      width:
        1,

      height:
        22,

      backgroundColor:
        COLORS.border,

    },


    mapSummaryText: {

      marginLeft:
        5,

      fontSize:
        12,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    /* TRIP SUMMARY */

    tripSummary: {

      minHeight:
        100,

      borderRadius:
        22,

      backgroundColor:
        COLORS.white,

      borderWidth:
        1,

      borderColor:
        COLORS.border,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-around',

      paddingHorizontal:
        6,

      marginBottom:
        20,

      shadowColor:
        '#000',

      shadowOpacity:
        0.06,

      shadowRadius:
        10,

      shadowOffset: {

        width:
          0,

        height:
          3,

      },

      elevation:
        3,

    },


    summaryItem: {

      flex:
        1,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    summaryIcon: {

      width:
        42,

      height:
        42,

      borderRadius:
        21,

      backgroundColor:
        COLORS.greenVerySoft,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight:
        7,

    },


    summaryDivider: {

      width:
        1,

      height:
        50,

      backgroundColor:
        COLORS.border,

    },


    summaryValue: {

      fontSize:
        16,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    summaryLabel: {

      marginTop:
        2,

      fontSize:
        11,

      color:
        COLORS.gray,

    },


    rupeeCircle: {

      width:
        42,

      height:
        42,

      borderRadius:
        21,

      backgroundColor:
        COLORS.greenVerySoft,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight:
        7,

    },


    rupeeText: {

      fontSize:
        23,

      fontWeight:
        '800',

      color:
        COLORS.green,

    },


    summaryFare: {

      marginTop:
        2,

      fontSize:
        14,

      fontWeight:
        '800',

      color:
        COLORS.green,

    },


    /* SECTION */

    sectionTitle: {

      marginBottom:
        10,

      fontSize:
        18,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    /* VEHICLE */

    vehicleRow: {

      flexDirection:
        'row',

      gap:
        12,

      marginBottom:
        20,

    },


    vehicleCard: {

      flex:
        1,

      minHeight:
        190,

      borderRadius:
        22,

      borderWidth:
        1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.white,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        10,

      shadowColor:
        '#000',

      shadowOpacity:
        0.05,

      shadowRadius:
        8,

      shadowOffset: {

        width:
          0,

        height:
          3,

      },

      elevation:
        2,

    },


    vehicleCardActive: {

      borderWidth:
        2,

      borderColor:
        COLORS.green,

      backgroundColor:
        '#FBFFFD',

    },


    vehicleIcon: {

      width:
        70,

      height:
        70,

      borderRadius:
        35,

      backgroundColor:
        '#F3F7EF',

      alignItems:
        'center',

      justifyContent:
        'center',

      marginBottom:
        10,

    },


    vehicleIconActive: {

      backgroundColor:
        COLORS.greenSoft,

    },


    vehicleName: {

      fontSize:
        18,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    vehicleSubtitle: {

      marginTop:
        3,

      fontSize:
        12,

      color:
        COLORS.gray,

    },


    vehicleFare: {

      marginTop:
        10,

      fontSize:
        14,

      fontWeight:
        '800',

      color:
        COLORS.black,

      textAlign:
        'center',

    },


    vehicleFareActive: {

      color:
        COLORS.green,

    },


    recommendedBadge: {

      marginTop:
        6,

      paddingHorizontal:
        8,

      paddingVertical:
        4,

      borderRadius:
        10,

      backgroundColor:
        COLORS.greenSoft,

    },


    recommendedText: {

      fontSize:
        10,

      fontWeight:
        '800',

      color:
        COLORS.green,

    },


    /* FARE MODE */

    fareModeHeader: {

      marginBottom:
        8,

    },


    fareModeSubtitle: {

      marginTop:
        -6,

      marginBottom:
        10,

      fontSize:
        12,

      color:
        COLORS.gray,

    },


    fareModeCard: {

      minHeight:
        96,

      borderRadius:
        20,

      borderWidth:
        1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.white,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        14,

      marginBottom:
        10,

    },


    fareModeCardActive: {

      borderWidth:
        2,

      borderColor:
        COLORS.green,

      backgroundColor:
        '#FBFFFD',

    },


    fareModeIcon: {

      width:
        50,

      height:
        50,

      borderRadius:
        25,

      backgroundColor:
        '#F4F6F5',

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    fareModeIconActive: {

      backgroundColor:
        COLORS.greenSoft,

    },


    fareModeContent: {

      flex:
        1,

      marginLeft:
        12,

    },


    fareModeTitleRow: {

      flexDirection:
        'row',

      alignItems:
        'center',

    },


    fareModeTitle: {

      fontSize:
        15,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    selectedCheck: {

      width:
        22,

      height:
        22,

      borderRadius:
        11,

      marginLeft:
        7,

      backgroundColor:
        COLORS.green,

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    fareModeDescription: {

      marginTop:
        3,

      fontSize:
        12,

      lineHeight:
        17,

      color:
        COLORS.gray,

    },


    fareModePrice: {

      marginTop:
        5,

      fontSize:
        13,

      fontWeight:
        '800',

      color:
        COLORS.green,

    },


    /* FARE INFO */

    fareInfoCard: {

      minHeight:
        88,

      borderRadius:
        20,

      backgroundColor:
        COLORS.greenVerySoft,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        14,

      marginTop:
        6,

      marginBottom:
        12,

    },


    fareInfoIcon: {

      width:
        50,

      height:
        50,

      borderRadius:
        25,

      backgroundColor:
        COLORS.greenSoft,

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    fareInfoContent: {

      flex:
        1,

      marginLeft:
        12,

    },


    fareInfoTitle: {

      fontSize:
        14,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    fareInfoText: {

      marginTop:
        4,

      fontSize:
        12,

      lineHeight:
        17,

      color:
        COLORS.gray,

    },


    /* SELECTED FARE */

    selectedFareCard: {

      minHeight:
        82,

      borderRadius:
        20,

      borderWidth:
        1,

      borderColor:
        '#CFEADB',

      backgroundColor:
        COLORS.white,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      paddingHorizontal:
        16,

      marginBottom:
        14,

    },


    selectedFareLabel: {

      fontSize:
        12,

      fontWeight:
        '700',

      color:
        COLORS.gray,

    },


    selectedFareAmount: {

      marginTop:
        3,

      fontSize:
        24,

      fontWeight:
        '900',

      color:
        COLORS.green,

    },


    goodOfferBadge: {

      flexDirection:
        'row',

      alignItems:
        'center',

      backgroundColor:
        COLORS.greenSoft,

      borderRadius:
        15,

      paddingHorizontal:
        9,

      paddingVertical:
        7,

      maxWidth:
        170,

    },


    goodOfferText: {

      marginLeft:
        4,

      fontSize:
        10,

      fontWeight:
        '800',

      color:
        COLORS.green,

    },


    /* MAIN CTA */

    mainButton: {

      minHeight:
        64,

      borderRadius:
        20,

      backgroundColor:
        COLORS.green,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal:
        18,

      marginBottom:
        9,

      shadowColor:
        COLORS.green,

      shadowOpacity:
        0.18,

      shadowRadius:
        8,

      shadowOffset: {

        width:
          0,

        height:
          4,

      },

      elevation:
        4,

    },


    mainButtonDisabled: {

      backgroundColor:
        '#C7D1CC',

      shadowOpacity:
        0,

      elevation:
        0,

    },


    mainButtonText: {

      flex:
        1,

      textAlign:
        'center',

      marginLeft:
        25,

      fontSize:
        16,

      fontWeight:
        '800',

      color:
        COLORS.white,

    },


    /* TRUST */

    trustRow: {

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingVertical:
        5,

    },


    trustText: {

      marginLeft:
        6,

      fontSize:
        12,

      color:
        COLORS.gray,

    },


    bottomSpace: {

      height:
        25,

    },

  });