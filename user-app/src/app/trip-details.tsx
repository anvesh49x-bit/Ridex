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

import {
  APIProvider,
  AdvancedMarker,
  Map,
  Polyline,
} from '@vis.gl/react-google-maps';


/* =========================================================================
   RIDEX — TRIP DETAILS
   =========================================================================

   PURPOSE
   -------------------------------------------------------------------------
   This page is responsible ONLY for:

   1. Showing pickup and destination
   2. Calculating the REAL Google road route
   3. Getting REAL distance
   4. Getting REAL traffic-aware travel time
   5. Calculating a dynamic suggested fare
   6. Selecting Bike or Auto

   THIS PAGE DOES NOT HANDLE:

   - User offer amount
   - Payment
   - Driver matching
   - Driver acceptance
   - Counter offers
   - Demand/supply pricing
   - Final booking

   Those will be implemented in later screens.


   MAINTENANCE RULE
   -------------------------------------------------------------------------
   Every important section below has a named comment.

   Future changes should be added BETWEEN the relevant START / END comments.

   Example:

   // RIDEX PRICING ENGINE START
   ...
   // RIDEX PRICING ENGINE END

   If we need to change pricing later, we can modify only that section.


   ========================================================================= */


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

  border: '#E7EAED',

  white: '#FFFFFF',

  mapBackground: '#EEF3F2',

  yellowSoft: '#FFF7D8',

  yellowText: '#8A6500',

};

/* =========================================================================
   RIDEX COLORS END
   ========================================================================= */


/* =========================================================================
   RIDEX TYPES START
   ========================================================================= */

type Coordinates = {

  lat: number;

  lng: number;

};


type VehicleType =

  | 'bike'

  | 'auto';


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
   RIDEX TYPES END
   ========================================================================= */


/* =========================================================================
   RIDEX VEHICLES START
   =========================================================================

   MVP ONLY:

   - Bike
   - Auto

   Do NOT add fare values here.

   Fare is calculated by the pricing engine below.

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
   RIDEX VEHICLES END
   ========================================================================= */


/* =========================================================================
   RIDEX PRICING ENGINE START
   =========================================================================

   IMPORTANT

   This is the ONLY place where Trip Details calculates fares.

   The calculation uses:

       REAL GOOGLE DISTANCE
       +
       REAL GOOGLE DURATION
       +
       VEHICLE TYPE

   Formula:

       Base Fare
       + Distance × Per KM
       + Time × Per Minute

   Then we generate:

       Minimum
       Recommended
       Maximum

   These are initial MVP values.

   They are NOT final city launch rates.

   Later we can move this configuration to Supabase/backend.

   ========================================================================= */


/* -------------------------------------------------------------------------
   INITIAL RIDEX MVP RATES
   ------------------------------------------------------------------------- */

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


/* -------------------------------------------------------------------------
   ROUND FARE
   -------------------------------------------------------------------------

   Examples:

       ₹72 → ₹70
       ₹73 → ₹75
       ₹81 → ₹80

   Keeps the rider-facing price clean.
   ------------------------------------------------------------------------- */

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


/* -------------------------------------------------------------------------
   CALCULATE SUGGESTED FARE
   ------------------------------------------------------------------------- */

const calculateSuggestedFare = (

  vehicle: VehicleType,

  distanceMeters: number,

  durationSeconds: number,

): FareQuote | null => {

  /* -----------------------------------------------------------------------
     Validate Google route values
     ----------------------------------------------------------------------- */

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


  /* -----------------------------------------------------------------------
     Convert units
     ----------------------------------------------------------------------- */

  const distanceKm =
    distanceMeters / 1000;


  const durationMinutes =
    durationSeconds / 60;


  /* -----------------------------------------------------------------------
     Vehicle pricing configuration
     ----------------------------------------------------------------------- */

  const rate =
    PRICING[vehicle];


  /* -----------------------------------------------------------------------
     Calculate fair fare
     ----------------------------------------------------------------------- */

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


  /* -----------------------------------------------------------------------
     Minimum fare protection
     ----------------------------------------------------------------------- */

  const fairFare =
    Math.max(
      calculatedFare,
      rate.minimumFare,
    );


  /* -----------------------------------------------------------------------
     Rider-friendly suggested range
     -----------------------------------------------------------------------

     Minimum:
       approximately 8% below fair fare

     Recommended:
       calculated fair fare

     Maximum:
       approximately 10% above fair fare

     ----------------------------------------------------------------------- */

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
   RIDEX PRICING ENGINE END
   ========================================================================= */


/* =========================================================================
   RIDEX REAL GOOGLE ROUTE START
   =========================================================================

   Google Routes API provides:

       distanceMeters
       durationMillis
       path

   routingPreference:

       TRAFFIC_AWARE

   Therefore the ETA is based on Google's traffic-aware routing calculation.

   ========================================================================= */

async function calculateGoogleRoute(

  pickup: Coordinates,

  drop: Coordinates,

  pickupName?: string,

  pickupAddress?: string,

  dropName?: string,

  dropAddress?: string,

): Promise<RouteInfo> {


  /* -----------------------------------------------------------------------
     Validate coordinates
     ----------------------------------------------------------------------- */

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


  /* -----------------------------------------------------------------------
     Google API key
     ----------------------------------------------------------------------- */

  if (!GOOGLE_API_KEY) {

    throw new Error(
      'Google Maps API key is missing.',
    );

  }


  /* -----------------------------------------------------------------------
     Make sure Google Maps is loaded
     ----------------------------------------------------------------------- */

  const googleMaps =
    (
      window as any
    )?.google?.maps;


  if (!googleMaps) {

    throw new Error(
      'Google Maps JavaScript API is not loaded.',
    );

  }


  /* -----------------------------------------------------------------------
     Load current Google Routes Library
     ----------------------------------------------------------------------- */

  const {
    Route,
  } =
    await googleMaps.importLibrary(
      'routes',
    );


  if (!Route) {

    throw new Error(
      'Google Routes library could not be loaded.',
    );

  }


  /* =========================================================================
     REQUEST 1 — EXACT COORDINATES
     ========================================================================= */

  const coordinateRequest = {

    origin: {

      lat:
        pickup.lat,

      lng:
        pickup.lng,

    },

    destination: {

      lat:
        drop.lat,

      lng:
        drop.lng,

    },

    travelMode:
      'DRIVING',

    routingPreference:
      'TRAFFIC_AWARE',

    fields: [

      'distanceMeters',

      'durationMillis',

      'path',

    ],

  };


  console.log(
    'RIDEX ROUTE REQUEST:',
    coordinateRequest,
  );


  let result =
    await Route.computeRoutes(
      coordinateRequest,
    );


  /* =========================================================================
     REQUEST 2 — ADDRESS FALLBACK
     =========================================================================

     If exact coordinates don't return a route, try the selected
     place/address text.

     ========================================================================= */

  if (

    !result?.routes ||

    result.routes.length === 0

  ) {

    const pickupText =
      pickupAddress ||
      pickupName;


    const dropText =
      dropAddress ||
      dropName;


    if (
      pickupText &&
      dropText
    ) {

      console.warn(
        'RIDEX: Coordinate route unavailable. Trying address fallback.',
      );


      result =
        await Route.computeRoutes({

          origin:
            pickupText,

          destination:
            dropText,

          travelMode:
            'DRIVING',

          routingPreference:
            'TRAFFIC_AWARE',

          fields: [

            'distanceMeters',

            'durationMillis',

            'path',

          ],

        });

    }

  }


  /* =========================================================================
     GET ROUTE
     ========================================================================= */

  const route =
    result?.routes?.[0];


  if (!route) {

    throw new Error(
      'Google returned no route.',
    );

  }


  /* =========================================================================
     REAL DISTANCE
     ========================================================================= */

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


  /* =========================================================================
     REAL TRAFFIC-AWARE DURATION
     ========================================================================= */

  const durationMillis =
    Number(
      route.durationMillis || 0,
    );


  if (
    durationMillis <= 0
  ) {

    throw new Error(
      'Google returned invalid duration.',
    );

  }


  const durationSeconds =
    Math.max(

      1,

      Math.round(
        durationMillis / 1000,
      ),

    );


  const durationMinutes =
    Math.max(

      1,

      Math.round(
        durationSeconds / 60,
      ),

    );


  const durationText =
    `${durationMinutes} min`;


  /* =========================================================================
     REAL ROAD-FOLLOWING PATH
     ========================================================================= */

  const rawPath =
    route.path || [];


  const polyline =
    rawPath

      .map(
        (
          point: any,
        ) => {

          const lat =

            typeof point.lat ===
            'function'

              ? point.lat()

              : Number(
                  point.lat,
                );


          const lng =

            typeof point.lng ===
            'function'

              ? point.lng()

              : Number(
                  point.lng,
                );


          return {

            lat,

            lng,

          };

        },
      )

      .filter(
        (
          point: Coordinates,
        ) =>

          Number.isFinite(
            point.lat,
          ) &&

          Number.isFinite(
            point.lng,
          ),
      );


  /* =========================================================================
     FINAL ROUTE RESULT
     ========================================================================= */

  const routeInfo: RouteInfo = {

    distanceText,

    durationText,

    distanceMeters,

    durationSeconds,

    polyline,

  };


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


  return routeInfo;

}

/* =========================================================================
   RIDEX REAL GOOGLE ROUTE END
   ========================================================================= */


/* =========================================================================
   TRIP DETAILS SCREEN START
   ========================================================================= */

export default function TripDetailsScreen() {

  const router =
    useRouter();


  /* =========================================================================
     ROUTE PARAMETERS START
     ========================================================================= */

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

  /* =========================================================================
     ROUTE PARAMETERS END
     ========================================================================= */


  /* =========================================================================
     PICKUP COORDINATES START
     ========================================================================= */

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

        !Number.isFinite(lng)

      ) {

        return null;

      }


      if (

        lat < -90 ||

        lat > 90 ||

        lng < -180 ||

        lng > 180

      ) {

        return null;

      }


      if (

        lat === 0 &&

        lng === 0

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

  /* =========================================================================
     PICKUP COORDINATES END
     ========================================================================= */


  /* =========================================================================
     DROP COORDINATES START
     ========================================================================= */

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

        !Number.isFinite(lng)

      ) {

        return null;

      }


      if (

        lat < -90 ||

        lat > 90 ||

        lng < -180 ||

        lng > 180

      ) {

        return null;

      }


      if (

        lat === 0 &&

        lng === 0

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

  /* =========================================================================
     DROP COORDINATES END
     ========================================================================= */


  /* =========================================================================
     SELECTED VEHICLE START
     ========================================================================= */

  const [

    selectedVehicle,

    setSelectedVehicle,

  ] = useState<VehicleType>(
    'bike',
  );

  /* =========================================================================
     SELECTED VEHICLE END
     ========================================================================= */


  /* =========================================================================
     ROUTE STATE START
     ========================================================================= */

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

  /* =========================================================================
     ROUTE STATE END
     ========================================================================= */


  /* =========================================================================
     CALCULATE ROUTE START
     ========================================================================= */

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

              params.pickupName,

              params.pickupAddress,

              params.dropName,

              params.dropAddress,

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

        params.pickupName,

        params.pickupAddress,

        params.dropName,

        params.dropAddress,

      ],
    );

  /* =========================================================================
     CALCULATE ROUTE END
     ========================================================================= */


  /* =========================================================================
     AUTOMATIC ROUTE CALCULATION START
     ========================================================================= */

  useEffect(() => {

    loadRoute();

  }, [

    loadRoute,

  ]);

  /* =========================================================================
     AUTOMATIC ROUTE CALCULATION END
     ========================================================================= */


  /* =========================================================================
     DISPLAY VALUES START
     ========================================================================= */

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

  /* =========================================================================
     DISPLAY VALUES END
     ========================================================================= */


  /* =========================================================================
     REAL-TIME SUGGESTED FARE START
     =========================================================================

     This is recalculated automatically when:

     - Route distance changes
     - Route duration changes
     - Vehicle changes

     ========================================================================= */

  const suggestedFare =
    useMemo(

      () =>

        calculateSuggestedFare(

          selectedVehicle,

          routeInfo?.distanceMeters ||
            0,

          routeInfo?.durationSeconds ||
            0,

        ),

      [

        selectedVehicle,

        routeInfo?.distanceMeters,

        routeInfo?.durationSeconds,

      ],

    );

  /* =========================================================================
     REAL-TIME SUGGESTED FARE END
     ========================================================================= */


  /* =========================================================================
     MAP CENTER START
     ========================================================================= */

  const mapCenter =
    pickupCoordinates ||
    dropCoordinates || {

      lat:
        16.5062,

      lng:
        80.6480,

    };

  /* =========================================================================
     MAP CENTER END
     ========================================================================= */


  /* =========================================================================
     BACK BUTTON START
     ========================================================================= */

  const handleBack =
    useCallback(() => {

      router.back();

    }, [

      router,

    ]);

  /* =========================================================================
     BACK BUTTON END
     ========================================================================= */


  /* =========================================================================
     CONTINUE BUTTON START
     =========================================================================

     IMPORTANT:

     The next "Your Offer" page is intentionally NOT implemented yet.

     For now, pressing the button confirms that the pricing engine is
     working and shows the calculated values.

     ========================================================================= */

  const handleContinue =
    useCallback(() => {

      if (!suggestedFare) {

        Alert.alert(
          'Fare unavailable',
          'Please wait for the route and fare to finish calculating.',
        );

        return;

      }


      console.log(
        'RIDEX READY FOR OFFER PAGE:',
        {

          vehicle:
            selectedVehicle,

          distance:
            routeInfo?.distanceMeters,

          duration:
            routeInfo?.durationSeconds,

          minimumFare:
            suggestedFare.minimum,

          recommendedFare:
            suggestedFare.recommended,

          maximumFare:
            suggestedFare.maximum,

        },
      );


      Alert.alert(

        'Suggested Fare',

        `${selectedVehicle === 'bike'
          ? 'Bike'
          : 'Auto'}\n\n` +

        `${routeInfo?.distanceText || ''} • ` +

        `${routeInfo?.durationText || ''}\n\n` +

        `Suggested: ₹${suggestedFare.minimum} – ₹${suggestedFare.maximum}\n` +

        `Recommended: ₹${suggestedFare.recommended}`,

      );

    }, [

      suggestedFare,

      selectedVehicle,

      routeInfo,

    ]);

  /* =========================================================================
     CONTINUE BUTTON END
     ========================================================================= */


  /* =========================================================================
     TRIP DETAILS UI START
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

        nestedScrollEnabled

      >


        {/* ================================================================
            HEADER START
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
              Review your route and fare
            </Text>

          </View>


          <View
            style={
              styles.headerSpacer
            }
          />

        </View>

        {/* ================================================================
            HEADER END
        ================================================================ */}


        {/* ================================================================
            LOCATIONS START
        ================================================================ */}

        <View
          style={
            styles.locationCard
          }
        >


          {/* PICKUP */}

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


          {/* VERTICAL CONNECTOR */}

          <View
            style={
              styles.locationConnector
            }
          />


          {/* DESTINATION */}

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
            LOCATIONS END
        ================================================================ */}


        {/* ================================================================
            MAP START
        ================================================================ */}

        <View
          style={
            styles.mapContainer
          }
        >

          {GOOGLE_API_KEY ? (

            <APIProvider
              apiKey={
                GOOGLE_API_KEY
              }
            >

              <Map

                defaultCenter={
                  mapCenter
                }

                defaultZoom={
                  pickupCoordinates &&
                  dropCoordinates
                    ? 13
                    : 14
                }

                gestureHandling="greedy"

                disableDefaultUI={
                  true
                }

                clickableIcons={
                  false
                }

                mapId="DEMO_MAP_ID"

              >


                {/* --------------------------------------------------------
                    PICKUP MARKER
                -------------------------------------------------------- */}

                {pickupCoordinates && (

                  <AdvancedMarker
                    position={
                      pickupCoordinates
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

                  </AdvancedMarker>

                )}


                {/* --------------------------------------------------------
                    DESTINATION MARKER
                -------------------------------------------------------- */}

                {dropCoordinates && (

                  <AdvancedMarker
                    position={
                      dropCoordinates
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

                  </AdvancedMarker>

                )}


                {/* --------------------------------------------------------
                    REAL ROAD-FOLLOWING ROUTE
                -------------------------------------------------------- */}

                {routeInfo &&

                  routeInfo.polyline.length > 1 && (

                    <Polyline

                      path={
                        routeInfo.polyline
                      }

                      strokeColor={
                        COLORS.green
                      }

                      strokeOpacity={
                        0.9
                      }

                      strokeWeight={
                        5
                      }

                    />

                )}

              </Map>

            </APIProvider>

          ) : (

            <View
              style={
                styles.mapFallback
              }
            >

              <Ionicons

                name="map-outline"

                size={42}

                color={
                  COLORS.green
                }

              />


              <Text
                style={
                  styles.mapFallbackText
                }
              >
                Google Maps API key unavailable
              </Text>

            </View>

          )}


          {/* --------------------------------------------------------------
              ROUTE LOADING
          -------------------------------------------------------------- */}

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
                Calculating real route...
              </Text>

            </View>

          )}


          {/* --------------------------------------------------------------
              ROUTE ERROR
          -------------------------------------------------------------- */}

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


          {/* --------------------------------------------------------------
              REAL ROUTE SUMMARY
          -------------------------------------------------------------- */}

          {routeInfo &&
            !routeLoading &&
            routeInfo.distanceMeters > 0 && (

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
            MAP END
        ================================================================ */}


        {/* ================================================================
            REAL TRIP SUMMARY START
        ================================================================ */}

        <View
          style={
            styles.tripSummary
          }
        >


          {/* DISTANCE */}

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

                size={23}

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


          {/* TIME */}

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

                size={23}

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


          {/* FARE */}

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
                Suggested
              </Text>


              <Text
                style={
                  styles.summaryFare
                }
              >

                {suggestedFare

                  ? `₹${suggestedFare.minimum}–₹${suggestedFare.maximum}`

                  : '—'

                }

              </Text>

            </View>

          </View>

        </View>

        {/* ================================================================
            REAL TRIP SUMMARY END
        ================================================================ */}


        {/* ================================================================
            VEHICLE SECTION START
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
            (
              vehicle,
            ) => {

              const active =
                selectedVehicle ===
                vehicle.id;


              const vehicleFare =
                calculateSuggestedFare(

                  vehicle.id,

                  routeInfo?.distanceMeters ||
                    0,

                  routeInfo?.durationSeconds ||
                    0,

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

                  onPress={() =>

                    setSelectedVehicle(
                      vehicle.id,
                    )

                  }

                >


                  {/* VEHICLE ICON */}

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


                  {/* VEHICLE NAME */}

                  <Text
                    style={
                      styles.vehicleName
                    }
                  >
                    {vehicle.name}
                  </Text>


                  {/* VEHICLE CAPACITY */}

                  <Text
                    style={
                      styles.vehicleSubtitle
                    }
                  >
                    {vehicle.subtitle}
                  </Text>


                  {/* VEHICLE REAL-TIME FARE */}

                  <Text
                    style={[

                      styles.vehicleFare,

                      active &&
                        styles.vehicleFareActive,

                    ]}
                  >

                    {vehicleFare

                      ? `₹${vehicleFare.minimum} – ₹${vehicleFare.maximum}`

                      : 'Calculating...'

                    }

                  </Text>


                  {/* RECOMMENDED */}

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
            VEHICLE SECTION END
        ================================================================ */}


        {/* ================================================================
            FARE EXPLANATION START
        ================================================================ */}

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

              name="pricetag-outline"

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
              Suggested fare updates with your trip
            </Text>


            <Text
              style={
                styles.fareInfoText
              }
            >
              Your suggested fare is calculated from
              the real road distance and estimated travel
              time for this trip.
            </Text>

          </View>

        </View>

        {/* ================================================================
            FARE EXPLANATION END
        ================================================================ */}


        {/* ================================================================
            SELECTED FARE HIGHLIGHT START
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
                  : 'Auto'}{' '}
                • Suggested Fare
              </Text>


              <Text
                style={
                  styles.selectedFareAmount
                }
              >
                ₹
                {
                  suggestedFare.minimum
                }
                {' – ₹'}
                {
                  suggestedFare.maximum
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
                ₹
                {
                  suggestedFare.recommended
                }{' '}
                recommended
              </Text>

            </View>

          </View>

        )}

        {/* ================================================================
            SELECTED FARE HIGHLIGHT END
        ================================================================ */}


        {/* ================================================================
            MAIN CTA START
        ================================================================ */}

        <Pressable

          style={[

            styles.mainButton,

            !suggestedFare &&
              styles.mainButtonDisabled,

          ]}

          disabled={
            !suggestedFare
          }

          onPress={
            handleContinue
          }

        >

          <Text
            style={
              styles.mainButtonText
            }
          >
            Continue to Set Your Price
          </Text>


          <Ionicons

            name="arrow-forward"

            size={26}

            color={
              COLORS.white
            }

          />

        </Pressable>

        {/* ================================================================
            MAIN CTA END
        ================================================================ */}


        {/* ================================================================
            TRUST ROW START
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

        {/* ================================================================
            TRUST ROW END
        ================================================================ */}


        {/* ================================================================
            BOTTOM SPACE
        ================================================================ */}

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
   TRIP DETAILS SCREEN END
   ========================================================================= */


/* =========================================================================
   RIDEX STYLES START
   ========================================================================= */

const styles =
  StyleSheet.create({

    /* =====================================================================
       SCREEN
       ===================================================================== */

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


    /* =====================================================================
       HEADER
       ===================================================================== */

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

      flex:
        1,

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


    /* =====================================================================
       LOCATION CARD
       ===================================================================== */

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


    /* =====================================================================
       MAP
       ===================================================================== */

    mapContainer: {

      height:
        275,

      borderRadius:
        23,

      overflow:
        'hidden',

      backgroundColor:
        COLORS.mapBackground,

      marginBottom:
        14,

      position:
        'relative',

    },

    mapFallback: {

      flex:
        1,

      alignItems:
        'center',

      justifyContent:
        'center',

    },

    mapFallbackText: {

      marginTop:
        8,

      fontSize:
        13,

      color:
        COLORS.gray,

    },

    mapPickupMarker: {

      width:
        30,

      height:
        30,

      borderRadius:
        15,

      borderWidth:
        4,

      borderColor:
        COLORS.green,

      backgroundColor:
        COLORS.white,

      alignItems:
        'center',

      justifyContent:
        'center',

    },

    mapPickupDot: {

      width:
        9,

      height:
        9,

      borderRadius:
        5,

      backgroundColor:
        COLORS.green,

    },

    mapDropMarker: {

      width:
        42,

      height:
        42,

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

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        13,

      paddingVertical:
        9,

      borderRadius:
        18,

      backgroundColor:
        COLORS.white,

      shadowColor:
        '#000',

      shadowOpacity:
        0.10,

      shadowRadius:
        8,

      shadowOffset: {

        width:
          0,

        height:
          2,

      },

      elevation:
        5,

    },

    routeStatusText: {

      marginLeft:
        7,

      fontSize:
        12,

      fontWeight:
        '700',

      color:
        COLORS.black,

    },

    routeError: {

      position:
        'absolute',

      top:
        14,

      left:
        14,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        13,

      paddingVertical:
        9,

      borderRadius:
        18,

      backgroundColor:
        COLORS.white,

      elevation:
        5,

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
        14,

      bottom:
        14,

      minHeight:
        43,

      borderRadius:
        22,

      backgroundColor:
        COLORS.white,

      paddingHorizontal:
        14,

      flexDirection:
        'row',

      alignItems:
        'center',

      shadowColor:
        '#000',

      shadowOpacity:
        0.10,

      shadowRadius:
        8,

      shadowOffset: {

        width:
          0,

        height:
          2,

      },

      elevation:
        5,

    },

    mapSummaryItem: {

      flexDirection:
        'row',

      alignItems:
        'center',

    },

    mapSummaryText: {

      marginLeft:
        5,

      fontSize:
        13,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },

    mapSummaryDivider: {

      width:
        1,

      height:
        20,

      backgroundColor:
        COLORS.border,

      marginHorizontal:
        12,

    },


    /* =====================================================================
       TRIP SUMMARY
       ===================================================================== */

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

      gap:
        7,

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


    /* =====================================================================
       SECTION TITLE
       ===================================================================== */

    sectionTitle: {

      marginBottom:
        12,

      fontSize:
        18,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    /* =====================================================================
       VEHICLE CARDS
       ===================================================================== */

    vehicleRow: {

      flexDirection:
        'row',

      gap:
        12,

      marginBottom:
        18,

    },

    vehicleCard: {

      flex:
        1,

      minHeight:
        205,

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
        78,

      height:
        78,

      borderRadius:
        39,

      backgroundColor:
        '#F3F7EF',

      alignItems:
        'center',

      justifyContent:
        'center',

      marginBottom:
        12,

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
        12,

      fontSize:
        15,

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


    /* =====================================================================
       FARE INFORMATION
       ===================================================================== */

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


    /* =====================================================================
       SELECTED FARE
       ===================================================================== */

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
        22,

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
        145,

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


    /* =====================================================================
       MAIN BUTTON
       ===================================================================== */

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


    /* =====================================================================
       TRUST
       ===================================================================== */

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


    /* =====================================================================
       BOTTOM SPACE
       ===================================================================== */

    bottomSpace: {

      height:
        25,

    },

  });

/* =========================================================================
   RIDEX STYLES END
   ========================================================================= */