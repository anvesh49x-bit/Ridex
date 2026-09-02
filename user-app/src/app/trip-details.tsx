import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
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
  Map,
  AdvancedMarker,
  Polyline,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';


/*
|--------------------------------------------------------------------------
| GOOGLE CONFIG
|--------------------------------------------------------------------------
*/

const GOOGLE_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;


/*
|--------------------------------------------------------------------------
| COLORS
|--------------------------------------------------------------------------
*/

const COLORS = {

  green: '#079A4B',

  greenDark: '#05833F',

  greenSoft: '#EAF8F1',

  greenVerySoft: '#F1FAF5',

  red: '#EF3154',

  black: '#111820',

  gray: '#737C88',

  muted: '#9AA1AA',

  border: '#E7EAED',

  white: '#FFFFFF',

  mapBackground: '#EEF3F2',

};


/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type Coordinates = {

  lat: number;

  lng: number;

};


type RouteInfo = {

  distanceMeters: number;

  durationMillis: number;

};


type VehicleType =

  | 'bike'

  | 'auto'

  | 'mini'

  | 'sedan';


type Vehicle = {

  id: VehicleType;

  name: string;

  subtitle: string;

  icon: string;

  minFare: number;

  maxFare: number;

};


/*
|--------------------------------------------------------------------------
| VEHICLES
|--------------------------------------------------------------------------
*/

const VEHICLES: Vehicle[] = [

  {

    id: 'bike',

    name: 'Bike',

    subtitle: '1 rider',

    icon: 'bicycle',

    minFare: 68,

    maxFare: 92,

  },

  {

    id: 'auto',

    name: 'Auto',

    subtitle: 'Up to 3',

    icon: 'car',

    minFare: 90,

    maxFare: 130,

  },

  {

    id: 'mini',

    name: 'Mini',

    subtitle: 'Up to 4',

    icon: 'car-sport',

    minFare: 160,

    maxFare: 220,

  },

  {

    id: 'sedan',

    name: 'Sedan',

    subtitle: 'Up to 4',

    icon: 'car-outline',

    minFare: 220,

    maxFare: 320,

  },

];


/*
|--------------------------------------------------------------------------
| FORMAT DISTANCE
|--------------------------------------------------------------------------
*/

const formatDistance = (
  meters: number,
) => {

  if (
    meters < 1000
  ) {

    return `${Math.round(meters)} m`;

  }


  return `${(
    meters / 1000
  ).toFixed(1)} km`;

};


/*
|--------------------------------------------------------------------------
| FORMAT DURATION
|--------------------------------------------------------------------------
*/

const formatDuration = (
  milliseconds: number,
) => {

  const totalMinutes =
    Math.max(
      1,
      Math.round(
        milliseconds /
        60000,
      ),
    );


  if (
    totalMinutes < 60
  ) {

    return `${totalMinutes} min`;

  }


  const hours =
    Math.floor(
      totalMinutes / 60,
    );


  const minutes =
    totalMinutes % 60;


  if (
    minutes === 0
  ) {

    return `${hours} hr`;

  }


  return `${hours} hr ${minutes} min`;

};


/*
|--------------------------------------------------------------------------
| ROAD ROUTE
|--------------------------------------------------------------------------
|
| Uses Google's new Routes Library through
| @vis.gl/react-google-maps.
|
| IMPORTANT:
|
| We request:
|
|     path
|     distanceMeters
|     durationMillis
|
| The path follows actual roads.
|
|--------------------------------------------------------------------------
*/

function RoadRoute({
  pickup,
  drop,
  onRouteReady,
  onRouteInfo,
}: {
  pickup: Coordinates;

  drop: Coordinates;

  onRouteReady?: () => void;

  onRouteInfo?: (
    info: RouteInfo,
  ) => void;

}) {

  /*
  |--------------------------------------------------------------------------
  | GOOGLE ROUTES LIBRARY
  |--------------------------------------------------------------------------
  */

  const routesLibrary =
    useMapsLibrary(
      'routes',
    );


  /*
  |--------------------------------------------------------------------------
  | ROUTE PATH
  |--------------------------------------------------------------------------
  */

  const [
    routePath,
    setRoutePath,
  ] =
    useState<Coordinates[]>(
      [],
    );


  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  const [
    loading,
    setLoading,
  ] =
    useState(true);


  /*
  |--------------------------------------------------------------------------
  | CALCULATE ROUTE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    let cancelled =
      false;


    const calculateRoadRoute =
      async () => {

        /*
        |--------------------------------------------------------------------------
        | WAIT FOR GOOGLE ROUTES LIBRARY
        |--------------------------------------------------------------------------
        */

        if (
          !routesLibrary
        ) {

          return;

        }


        /*
        |--------------------------------------------------------------------------
        | RESET
        |--------------------------------------------------------------------------
        */

        setLoading(
          true,
        );

        setRoutePath(
          [],
        );


        try {

          /*
          |--------------------------------------------------------------------------
          | ROUTE CLASS
          |--------------------------------------------------------------------------
          */

          const Route =
            routesLibrary.Route;


          /*
          |--------------------------------------------------------------------------
          | GOOGLE ROUTES REQUEST
          |--------------------------------------------------------------------------
          */

          const request = {

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

            /*
            |--------------------------------------------------------------------------
            | ONLY REQUEST WHAT RIDEX NEEDS
            |--------------------------------------------------------------------------
            */

            fields: [

              'path',

              'distanceMeters',

              'durationMillis',

            ],

          };


          /*
          |--------------------------------------------------------------------------
          | CALCULATE REAL ROAD ROUTE
          |--------------------------------------------------------------------------
          */

          const result =
            await Route.computeRoutes(
              request,
            );


          /*
          |--------------------------------------------------------------------------
          | COMPONENT UNMOUNTED / ROUTE CHANGED
          |--------------------------------------------------------------------------
          */

          if (
            cancelled
          ) {

            return;

          }


          /*
          |--------------------------------------------------------------------------
          | ROUTES
          |--------------------------------------------------------------------------
          */

          const routes =
            result?.routes ||
            [];


          /*
          |--------------------------------------------------------------------------
          | NO ROUTE FOUND
          |--------------------------------------------------------------------------
          */

          if (
            routes.length === 0
          ) {

            console.warn(
              '[RIDEX] Google returned no road route.',
            );

            setRoutePath(
              [],
            );

            return;

          }


          /*
          |--------------------------------------------------------------------------
          | FIRST / BEST ROUTE
          |--------------------------------------------------------------------------
          */

          const route =
            routes[0];


          /*
          |--------------------------------------------------------------------------
          | DISTANCE
          |--------------------------------------------------------------------------
          */

          const distanceMeters =
            Number(
              route?.distanceMeters,
            );


          /*
          |--------------------------------------------------------------------------
          | DURATION
          |--------------------------------------------------------------------------
          */

          const durationMillis =
            Number(
              route?.durationMillis,
            );


          /*
          |--------------------------------------------------------------------------
          | SEND ROUTE INFO TO SCREEN
          |--------------------------------------------------------------------------
          */

          if (

            Number.isFinite(
              distanceMeters,
            ) &&

            Number.isFinite(
              durationMillis,
            )

          ) {

            onRouteInfo?.({

              distanceMeters,

              durationMillis,

            });

          }


          /*
          |--------------------------------------------------------------------------
          | GOOGLE ROAD PATH
          |--------------------------------------------------------------------------
          */

          const googlePath =
            route?.path ||
            [];


          /*
          |--------------------------------------------------------------------------
          | CONVERT GOOGLE PATH
          |--------------------------------------------------------------------------
          */

          const convertedPath =
            googlePath

              .map(
                (
                  point: any,
                ) => {

                  /*
                  |--------------------------------------------------------------------------
                  | GOOGLE LAT
                  |--------------------------------------------------------------------------
                  */

                  const lat =
                    typeof point?.lat ===
                    'function'

                      ? point.lat()

                      : point?.lat;


                  /*
                  |--------------------------------------------------------------------------
                  | GOOGLE LNG
                  |--------------------------------------------------------------------------
                  */

                  const lng =
                    typeof point?.lng ===
                    'function'

                      ? point.lng()

                      : point?.lng;


                  /*
                  |--------------------------------------------------------------------------
                  | VALIDATE
                  |--------------------------------------------------------------------------
                  */

                  if (

                    typeof lat !==
                      'number' ||

                    typeof lng !==
                      'number' ||

                    !Number.isFinite(
                      lat,
                    ) ||

                    !Number.isFinite(
                      lng,
                    )

                  ) {

                    return null;

                  }


                  return {

                    lat,

                    lng,

                  };

                },
              )

              .filter(

                (
                  point:
                    Coordinates |
                    null,
                ): point is Coordinates =>

                  point !== null,

              );


          /*
          |--------------------------------------------------------------------------
          | VALID ROAD PATH
          |--------------------------------------------------------------------------
          */

          if (
            convertedPath.length >
            1
          ) {

            setRoutePath(
              convertedPath,
            );


            /*
            |--------------------------------------------------------------------------
            | ROUTE READY
            |--------------------------------------------------------------------------
            */

            onRouteReady?.();

          }

          else {

            console.warn(
              '[RIDEX] Google returned an invalid route path.',
            );

            setRoutePath(
              [],
            );

          }

        }

        catch (
          error
        ) {

          console.error(
            '[RIDEX] Road route calculation failed:',
            error,
          );

          setRoutePath(
            [],
          );

        }

        finally {

          if (
            !cancelled
          ) {

            setLoading(
              false,
            );

          }

        }

      };


    calculateRoadRoute();


    /*
    |--------------------------------------------------------------------------
    | CLEANUP
    |--------------------------------------------------------------------------
    */

    return () => {

      cancelled =
        true;

    };


  }, [

    routesLibrary,

    pickup.lat,

    pickup.lng,

    drop.lat,

    drop.lng,

  ]);


  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (
    loading
  ) {

    return (

      <View
        style={
          styles.routeLoading
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
            styles.routeLoadingText
          }
        >
          Finding route…
        </Text>

      </View>

    );

  }


  /*
  |--------------------------------------------------------------------------
  | DRAW ROAD ROUTE
  |--------------------------------------------------------------------------
  */

  if (
    routePath.length >
    1
  ) {

    return (

      <Polyline

        path={
          routePath
        }

        strokeColor={
          COLORS.green
        }

        strokeOpacity={
          0.95
        }

        strokeWeight={
          6
        }

      />

    );

  }


  /*
  |--------------------------------------------------------------------------
  | IMPORTANT
  |--------------------------------------------------------------------------
  |
  | Never draw a straight line between pickup/drop.
  |
  |--------------------------------------------------------------------------
  */

  return null;

}


/*
|--------------------------------------------------------------------------
| TRIP DETAILS SCREEN
|--------------------------------------------------------------------------
*/

export default function TripDetailsScreen() {

  const router =
    useRouter();


  /*
  |--------------------------------------------------------------------------
  | ROUTE PARAMETERS
  |--------------------------------------------------------------------------
  */

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


  /*
  |--------------------------------------------------------------------------
  | PICKUP COORDINATES
  |--------------------------------------------------------------------------
  */

  const pickup =
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

        !Number.isFinite(
          lat,
        ) ||

        !Number.isFinite(
          lng,
        ) ||

        (

          lat === 0 &&

          lng === 0

        )

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


  /*
  |--------------------------------------------------------------------------
  | DROP COORDINATES
  |--------------------------------------------------------------------------
  */

  const drop =
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

        !Number.isFinite(
          lat,
        ) ||

        !Number.isFinite(
          lng,
        ) ||

        (

          lat === 0 &&

          lng === 0

        )

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


  /*
  |--------------------------------------------------------------------------
  | SELECTED VEHICLE
  |--------------------------------------------------------------------------
  */

  const [
    selectedVehicle,
    setSelectedVehicle,
  ] =
    useState<VehicleType>(
      'bike',
    );


  /*
  |--------------------------------------------------------------------------
  | ROUTE READY
  |--------------------------------------------------------------------------
  */

  const [
    routeReady,
    setRouteReady,
  ] =
    useState(false);


  /*
  |--------------------------------------------------------------------------
  | ROUTE INFORMATION
  |--------------------------------------------------------------------------
  */

  const [
    routeInfo,
    setRouteInfo,
  ] =
    useState<RouteInfo | null>(
      null,
    );


  /*
  |--------------------------------------------------------------------------
  | SELECTED VEHICLE DATA
  |--------------------------------------------------------------------------
  */

  const selectedVehicleData =
    VEHICLES.find(
      (
        vehicle,
      ) =>
        vehicle.id ===
        selectedVehicle,
    ) ||
    VEHICLES[0];


  /*
  |--------------------------------------------------------------------------
  | MAP CENTER
  |--------------------------------------------------------------------------
  */

  const mapCenter =
    pickup ||
    drop || {

      lat: 16.5062,

      lng: 80.6480,

    };


  /*
  |--------------------------------------------------------------------------
  | BACK
  |--------------------------------------------------------------------------
  */

  const handleBack =
    () => {

      router.back();

    };


  /*
  |--------------------------------------------------------------------------
  | MAKE OFFER
  |--------------------------------------------------------------------------
  */

  const handleMakeOffer =
    () => {

      router.push({

        pathname:
          '/make-offer' as any,

        params: {

          pickupName:
            params.pickupName ||
            'Current location',

          pickupAddress:
            params.pickupAddress ||
            '',

          pickupLat:
            params.pickupLat ||
            '',

          pickupLng:
            params.pickupLng ||
            '',

          dropName:
            params.dropName ||
            'Destination',

          dropAddress:
            params.dropAddress ||
            '',

          dropLat:
            params.dropLat ||
            '',

          dropLng:
            params.dropLng ||
            '',

          vehicle:
            selectedVehicle,

          minFare:
            String(
              selectedVehicleData.minFare,
            ),

          maxFare:
            String(
              selectedVehicleData.maxFare,
            ),

        },

      });

    };


  /*
  |--------------------------------------------------------------------------
  | DISPLAY LOCATIONS
  |--------------------------------------------------------------------------
  */

  const pickupName =
    params.pickupName ||
    'Current Location';


  const pickupAddress =
    params.pickupAddress ||
    'Current location';


  const dropName =
    params.dropName ||
    'Destination';


  const dropAddress =
    params.dropAddress ||
    '';


  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (

    <SafeAreaView
      style={
        styles.safeArea
      }
    >

      <View
        style={
          styles.screen
        }
      >

        {/* ================================================================
            HEADER
        ================================================================= */}

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
              size={29}
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
              Tell us where you want to go
            </Text>

          </View>


          <View
            style={
              styles.headerSpacer
            }
          />

        </View>


        {/* ================================================================
            CONTENT
        ================================================================= */}

        <ScrollView

          showsVerticalScrollIndicator={
            false
          }

          contentContainerStyle={
            styles.content
          }

        >

          {/* ================================================================
              LOCATIONS CARD
          ================================================================= */}

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
                  styles.timeline
                }
              >

                <View
                  style={
                    styles.pickupDot
                  }
                />

                <View
                  style={
                    styles.timelineLine
                  }
                />

              </View>


              <View
                style={
                  styles.locationInfo
                }
              >

                <Text
                  style={
                    styles.pickupLabel
                  }
                >
                  Pickup location
                </Text>


                <Text
                  style={
                    styles.locationName
                  }

                  numberOfLines={
                    1
                  }
                >
                  {pickupName}
                </Text>


                <Text
                  style={
                    styles.locationAddress
                  }

                  numberOfLines={
                    1
                  }
                >
                  {pickupAddress}
                </Text>

              </View>


              <Pressable
                style={
                  styles.locationAction
                }

                onPress={
                  handleBack
                }
              >

                <Ionicons
                  name="locate-outline"
                  size={24}
                  color={
                    COLORS.black
                  }
                />

              </Pressable>

            </View>


            <View
              style={
                styles.locationDivider
              }
            />


            {/* DROP */}

            <View
              style={
                styles.locationRow
              }
            >

              <View
                style={
                  styles.timeline
                }
              >

                <View
                  style={
                    styles.dropDot
                  }
                />

              </View>


              <View
                style={
                  styles.locationInfo
                }
              >

                <Text
                  style={
                    styles.dropLabel
                  }
                >
                  Drop location
                </Text>


                <Text
                  style={
                    styles.locationName
                  }

                  numberOfLines={
                    1
                  }
                >
                  {dropName}
                </Text>


                <Text
                  style={
                    styles.locationAddress
                  }

                  numberOfLines={
                    1
                  }
                >
                  {dropAddress}
                </Text>

              </View>


              <Pressable
                style={
                  styles.locationAction
                }

                onPress={
                  handleBack
                }
              >

                <Ionicons
                  name="close"
                  size={26}
                  color={
                    COLORS.black
                  }
                />

              </Pressable>

            </View>

          </View>


          {/* ================================================================
              MAP
          ================================================================= */}

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
                    pickup &&
                    drop
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

                  {/* ========================================================
                      PICKUP MARKER
                  ======================================================== */}

                  {pickup && (

                    <AdvancedMarker
                      position={
                        pickup
                      }
                    >

                      <View
                        style={
                          styles.pickupMapMarker
                        }
                      >

                        <View
                          style={
                            styles.pickupMapDot
                        }
                        />

                      </View>

                    </AdvancedMarker>

                  )}


                  {/* ========================================================
                      DROP MARKER
                  ======================================================== */}

                  {drop && (

                    <AdvancedMarker
                      position={
                        drop
                      }
                    >

                      <View
                        style={
                          styles.dropMapMarker
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


                  {/* ========================================================
                      REAL ROAD ROUTE
                  ======================================================== */}

                  {pickup &&
                    drop && (

                    <RoadRoute

                      pickup={
                        pickup
                      }

                      drop={
                        drop
                      }

                      onRouteReady={() => {

                        setRouteReady(
                          true,
                        );

                      }}

                      onRouteInfo={(
                        info,
                      ) => {

                        setRouteInfo(
                          info,
                        );

                      }}

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
                  size={38}
                  color={
                    COLORS.green
                  }
                />


                <Text
                  style={
                    styles.mapFallbackText
                  }
                >
                  Map unavailable
                </Text>

              </View>

            )}


            {/* ================================================================
                ROUTE LOADING
            ================================================================= */}

            {pickup &&
              drop &&
              !routeReady && (

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
                  Finding route…
                </Text>

              </View>

            )}


            {/* ================================================================
                MAP LAYERS
            ================================================================= */}

            <Pressable
              style={
                styles.layersButton
              }
            >

              <Ionicons
                name="layers-outline"
                size={25}
                color={
                  COLORS.black
                }
              />

            </Pressable>


            {/* ================================================================
                PICKUP LABEL
            ================================================================= */}

            <View
              style={[
                styles.mapLabel,

                styles.pickupMapLabel,
              ]}
            >

              <Text
                style={
                  styles.mapLabelTitleGreen
                }
              >
                Pickup
              </Text>


              <Text
                style={
                  styles.mapLabelText
                }
              >
                {pickupName}
              </Text>

            </View>


            {/* ================================================================
                DROP LABEL
            ================================================================= */}

            <View
              style={[
                styles.mapLabel,

                styles.dropMapLabel,
              ]}
            >

              <Text
                style={
                  styles.mapLabelTitleRed
                }
              >
                Drop
              </Text>


              <Text
                style={
                  styles.mapLabelText
                }
              >
                {dropName}
              </Text>

            </View>

          </View>


          {/* ================================================================
              ROUTE SUMMARY
          ================================================================= */}

          <View
            style={
              styles.routeCard
            }
          >

            {/* DISTANCE */}

            <View
              style={
                styles.routeItem
              }
            >

              <View
                style={
                  styles.routeIconCircle
                }
              >

                <Ionicons
                  name="car-outline"
                  size={25}
                  color={
                    COLORS.green
                  }
                />

              </View>


              <View>

                <Text
                  style={
                    styles.routeValue
                  }
                >
                  {routeInfo

                    ? formatDistance(
                        routeInfo.distanceMeters,
                      )

                    : '—'}

                </Text>


                <Text
                  style={
                    styles.routeLabel
                  }
                >
                  Distance
                </Text>

              </View>

            </View>


            <View
              style={
                styles.routeDivider
              }
            />


            {/* TIME */}

            <View
              style={
                styles.routeItem
              }
            >

              <View
                style={
                  styles.routeIconCircle
                }
              >

                <Ionicons
                  name="time-outline"
                  size={25}
                  color={
                    COLORS.green
                  }
                />

              </View>


              <View>

                <Text
                  style={
                    styles.routeValue
                  }
                >
                  {routeInfo

                    ? formatDuration(
                        routeInfo.durationMillis,
                      )

                    : '—'}

                </Text>


                <Text
                  style={
                    styles.routeLabel
                  }
                >
                  Est. time
                </Text>

              </View>

            </View>


            <View
              style={
                styles.routeDivider
              }
            />


            {/* FARE */}

            <View
              style={
                styles.routeItem
              }
            >

              <Text
                style={
                  styles.rupeeSymbol
                }
              >
                ₹
              </Text>


              <View>

                <Text
                  style={
                    styles.routeSmallLabel
                  }
                >
                  Suggested
                </Text>


                <Text
                  style={
                    styles.routeFare
                  }
                >
                  ₹
                  {selectedVehicleData.minFare}
                  {' – ₹'}
                  {selectedVehicleData.maxFare}
                </Text>

              </View>

            </View>

          </View>


          {/* ================================================================
              VEHICLE TITLE
          ================================================================= */}

          <Text
            style={
              styles.sectionTitle
            }
          >
            Choose a vehicle type
          </Text>


          {/* ================================================================
              VEHICLES
          ================================================================= */}

          <ScrollView

            horizontal

            showsHorizontalScrollIndicator={
              false
            }

            contentContainerStyle={
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
                        styles.vehicleIconCircle,

                        active &&
                          styles.vehicleIconCircleActive,

                      ]}
                    >

                      <Ionicons
                        name={
                          vehicle.icon as any
                        }

                        size={
                          vehicle.id ===
                          'bike'
                            ? 38
                            : 34
                        }

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


                    {/* CAPACITY */}

                    <Text
                      style={
                        styles.vehicleSubtitle
                      }
                    >
                      {vehicle.subtitle}
                    </Text>


                    {/* FARE */}

                    <Text
                      style={[
                        styles.vehicleFare,

                        active &&
                          styles.vehicleFareActive,

                      ]}
                    >
                      ₹
                      {vehicle.minFare}
                      {' – ₹'}
                      {vehicle.maxFare}
                    </Text>

                  </Pressable>

                );

              },
            )}

          </ScrollView>


          {/* ================================================================
              PRICE NEGOTIATION
          ================================================================= */}

          <View
            style={
              styles.offerCard
            }
          >

            <View
              style={
                styles.offerIcon
              }
            >

              <Ionicons
                name="shield-checkmark-outline"
                size={28}
                color={
                  COLORS.green
                }
              />

            </View>


            <View
              style={
                styles.offerContent
              }
            >

              <Text
                style={
                  styles.offerTitle
                }
              >
                You set the price,
                riders make it happen.
              </Text>


              <Text
                style={
                  styles.offerSubtitle
                }
              >
                Offer your price and choose
                the best rider for you.
              </Text>

            </View>


            <Ionicons
              name="arrow-forward"
              size={25}
              color={
                COLORS.black
              }
            />

          </View>


          {/* ================================================================
              MAIN CTA
          ================================================================= */}

          <Pressable
            style={
              styles.mainButton
            }

            onPress={
              handleMakeOffer
            }
          >

            <Text
              style={
                styles.mainButtonText
              }
            >
              See Suggested Fare & Make an Offer
            </Text>


            <Ionicons
              name="arrow-forward"
              size={27}
              color={
                COLORS.white
              }
            />

          </Pressable>


          {/* ================================================================
              TRUST
          ================================================================= */}

          <View
            style={
              styles.trustRow
            }
          >

            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color={
                COLORS.green
              }
            />


            <Text
              style={
                styles.trustText
              }
            >
              Transparent fares • Trusted riders
            </Text>

          </View>

        </ScrollView>

      </View>

    </SafeAreaView>

  );

}


/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

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


    /*
    |--------------------------------------------------------------------------
    | HEADER
    |--------------------------------------------------------------------------
    */

    header: {

      height: 82,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal: 22,

      backgroundColor:
        COLORS.white,

    },


    backButton: {

      width: 42,

      height: 42,

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

      fontSize: 23,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    headerSubtitle: {

      marginTop: 3,

      fontSize: 14,

      color:
        COLORS.gray,

    },


    headerSpacer: {

      width: 42,

    },


    /*
    |--------------------------------------------------------------------------
    | CONTENT
    |--------------------------------------------------------------------------
    */

    content: {

      paddingHorizontal: 18,

      paddingBottom: 35,

    },


    /*
    |--------------------------------------------------------------------------
    | LOCATION CARD
    |--------------------------------------------------------------------------
    */

    locationCard: {

      backgroundColor:
        COLORS.white,

      borderRadius: 25,

      paddingHorizontal: 18,

      paddingVertical: 16,

      marginBottom: 12,

      shadowColor:
        '#000',

      shadowOffset: {

        width: 0,

        height: 5,

      },

      shadowOpacity:
        0.08,

      shadowRadius:
        15,

      elevation: 5,

    },


    locationRow: {

      minHeight: 72,

      flexDirection:
        'row',

      alignItems:
        'center',

    },


    timeline: {

      width: 38,

      alignSelf:
        'stretch',

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    pickupDot: {

      width: 19,

      height: 19,

      borderRadius: 10,

      backgroundColor:
        COLORS.green,

      borderWidth: 5,

      borderColor:
        COLORS.greenSoft,

    },


    dropDot: {

      width: 19,

      height: 19,

      borderRadius: 10,

      backgroundColor:
        COLORS.red,

      borderWidth: 5,

      borderColor:
        '#FDECEF',

    },


    timelineLine: {

      position:
        'absolute',

      width: 2,

      height: 37,

      backgroundColor:
        '#E4E7E9',

      top: 44,

    },


    locationInfo: {

      flex: 1,

      paddingLeft: 10,

    },


    pickupLabel: {

      fontSize: 15,

      color:
        COLORS.green,

      fontWeight:
        '700',

    },


    dropLabel: {

      fontSize: 15,

      color:
        COLORS.red,

      fontWeight:
        '700',

    },


    locationName: {

      marginTop: 4,

      fontSize: 20,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    locationAddress: {

      marginTop: 3,

      fontSize: 14,

      color:
        COLORS.gray,

    },


    locationAction: {

      width: 48,

      height: 48,

      borderRadius: 24,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.white,

    },


    locationDivider: {

      height: 1,

      backgroundColor:
        COLORS.border,

      marginLeft: 48,

      marginVertical: 4,

    },


    /*
    |--------------------------------------------------------------------------
    | MAP
    |--------------------------------------------------------------------------
    */

    mapContainer: {

      height: 350,

      borderRadius: 24,

      overflow:
        'hidden',

      marginBottom: 12,

      backgroundColor:
        COLORS.mapBackground,

      position:
        'relative',

    },


    mapFallback: {

      flex: 1,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        COLORS.mapBackground,

    },


    mapFallbackText: {

      marginTop: 8,

      color:
        COLORS.gray,

      fontSize: 14,

    },


    pickupMapMarker: {

      width: 34,

      height: 34,

      borderRadius: 17,

      backgroundColor:
        COLORS.white,

      borderWidth: 3,

      borderColor:
        COLORS.green,

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    pickupMapDot: {

      width: 12,

      height: 12,

      borderRadius: 6,

      backgroundColor:
        COLORS.green,

    },


    dropMapMarker: {

      width: 42,

      height: 42,

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    layersButton: {

      position:
        'absolute',

      right: 14,

      top: 14,

      width: 52,

      height: 52,

      borderRadius: 26,

      backgroundColor:
        COLORS.white,

      alignItems:
        'center',

      justifyContent:
        'center',

      shadowColor:
        '#000',

      shadowOffset: {

        width: 0,

        height: 2,

      },

      shadowOpacity:
        0.12,

      shadowRadius:
        6,

      elevation: 4,

    },


    mapLabel: {

      position:
        'absolute',

      backgroundColor:
        COLORS.white,

      borderRadius: 14,

      paddingHorizontal: 14,

      paddingVertical: 10,

      shadowColor:
        '#000',

      shadowOffset: {

        width: 0,

        height: 3,

      },

      shadowOpacity:
        0.12,

      shadowRadius:
        7,

      elevation: 4,

    },


    pickupMapLabel: {

      left: 16,

      top: 72,

    },


    dropMapLabel: {

      right: 15,

      bottom: 38,

    },


    mapLabelTitleGreen: {

      fontSize: 14,

      fontWeight:
        '800',

      color:
        COLORS.green,

    },


    mapLabelTitleRed: {

      fontSize: 14,

      fontWeight:
        '800',

      color:
        COLORS.red,

    },


    mapLabelText: {

      marginTop: 3,

      fontSize: 14,

      color:
        COLORS.gray,

      maxWidth: 170,

    },


    /*
    |--------------------------------------------------------------------------
    | ROUTE STATUS
    |--------------------------------------------------------------------------
    */

    routeStatus: {

      position:
        'absolute',

      left: 16,

      bottom: 16,

      flexDirection:
        'row',

      alignItems:
        'center',

      backgroundColor:
        COLORS.white,

      paddingHorizontal: 14,

      paddingVertical: 10,

      borderRadius: 18,

      shadowColor:
        '#000',

      shadowOffset: {

        width: 0,

        height: 2,

      },

      shadowOpacity:
        0.12,

      shadowRadius:
        6,

      elevation: 4,

    },


    routeStatusText: {

      marginLeft: 8,

      fontSize: 13,

      fontWeight:
        '600',

      color:
        COLORS.gray,

    },


    routeLoading: {

      position:
        'absolute',

      left: 16,

      bottom: 16,

      flexDirection:
        'row',

      alignItems:
        'center',

      backgroundColor:
        COLORS.white,

      paddingHorizontal: 12,

      paddingVertical: 9,

      borderRadius: 16,

    },


    routeLoadingText: {

      marginLeft: 7,

      fontSize: 12,

      color:
        COLORS.gray,

    },


    /*
    |--------------------------------------------------------------------------
    | ROUTE SUMMARY
    |--------------------------------------------------------------------------
    */

    routeCard: {

      minHeight: 106,

      borderRadius: 23,

      backgroundColor:
        COLORS.white,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-around',

      paddingHorizontal: 8,

      marginBottom: 24,

      shadowColor:
        '#000',

      shadowOffset: {

        width: 0,

        height: 5,

      },

      shadowOpacity:
        0.08,

      shadowRadius:
        14,

      elevation: 4,

    },


    routeItem: {

      flex: 1,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 8,

    },


    routeIconCircle: {

      width: 46,

      height: 46,

      borderRadius: 23,

      backgroundColor:
        COLORS.greenVerySoft,

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    routeValue: {

      fontSize: 18,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    routeLabel: {

      marginTop: 3,

      fontSize: 12,

      color:
        COLORS.gray,

    },


    routeDivider: {

      width: 1,

      height: 55,

      backgroundColor:
        COLORS.border,

    },


    rupeeSymbol: {

      fontSize: 28,

      fontWeight:
        '700',

      color:
        COLORS.green,

    },


    routeSmallLabel: {

      fontSize: 12,

      color:
        COLORS.gray,

    },


    routeFare: {

      marginTop: 2,

      fontSize: 17,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    /*
    |--------------------------------------------------------------------------
    | SECTION
    |--------------------------------------------------------------------------
    */

    sectionTitle: {

      fontSize: 18,

      fontWeight:
        '800',

      color:
        COLORS.black,

      marginBottom: 12,

    },


    /*
    |--------------------------------------------------------------------------
    | VEHICLES
    |--------------------------------------------------------------------------
    */

    vehicleRow: {

      paddingBottom: 18,

      gap: 12,

    },


    vehicleCard: {

      width: 145,

      minHeight: 215,

      borderRadius: 22,

      backgroundColor:
        COLORS.white,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal: 10,

      shadowColor:
        '#000',

      shadowOffset: {

        width: 0,

        height: 3,

      },

      shadowOpacity:
        0.05,

      shadowRadius:
        9,

      elevation: 2,

    },


    vehicleCardActive: {

      borderColor:
        COLORS.green,

      borderWidth: 2,

      backgroundColor:
        '#FBFFFD',

    },


    vehicleIconCircle: {

      width: 86,

      height: 86,

      borderRadius: 43,

      backgroundColor:
        '#F3F8EF',

      alignItems:
        'center',

      justifyContent:
        'center',

      marginBottom: 13,

    },


    vehicleIconCircleActive: {

      backgroundColor:
        '#EFF8E9',

    },


    vehicleName: {

      fontSize: 19,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    vehicleSubtitle: {

      marginTop: 4,

      fontSize: 13,

      color:
        COLORS.gray,

    },


    vehicleFare: {

      marginTop: 13,

      fontSize: 16,

      fontWeight:
        '700',

      color:
        COLORS.black,

    },


    vehicleFareActive: {

      color:
        COLORS.green,

    },


    /*
    |--------------------------------------------------------------------------
    | OFFER CARD
    |--------------------------------------------------------------------------
    */

    offerCard: {

      minHeight: 105,

      borderRadius: 23,

      backgroundColor:
        COLORS.greenVerySoft,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal: 15,

      marginBottom: 16,

    },


    offerIcon: {

      width: 54,

      height: 54,

      borderRadius: 27,

      backgroundColor:
        '#E1F4E8',

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    offerContent: {

      flex: 1,

      marginLeft: 14,

      marginRight: 8,

    },


    offerTitle: {

      fontSize: 16,

      lineHeight: 22,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    offerSubtitle: {

      marginTop: 4,

      fontSize: 13,

      lineHeight: 19,

      color:
        COLORS.gray,

    },


    /*
    |--------------------------------------------------------------------------
    | MAIN CTA
    |--------------------------------------------------------------------------
    */

    mainButton: {

      minHeight: 66,

      borderRadius: 20,

      backgroundColor:
        COLORS.green,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingHorizontal: 20,

      marginBottom: 12,

    },


    mainButtonText: {

      flex: 1,

      textAlign:
        'center',

      fontSize: 17,

      fontWeight:
        '800',

      color:
        COLORS.white,

      marginLeft: 22,

    },


    /*
    |--------------------------------------------------------------------------
    | TRUST
    |--------------------------------------------------------------------------
    */

    trustRow: {

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      paddingVertical: 5,

    },


    trustText: {

      marginLeft: 6,

      fontSize: 12,

      color:
        COLORS.gray,

    },

  });