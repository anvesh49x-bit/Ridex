import React, {
  useCallback,
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
  AdvancedMarker,
  Map,
} from '@vis.gl/react-google-maps';


/*
|--------------------------------------------------------------------------
| RIDEX HOME
|--------------------------------------------------------------------------
|
| IMPORTANT ARCHITECTURE
|
| Home is intentionally kept simple.
|
| Home is responsible for:
|
| 1. Starting the ride flow
| 2. Showing pickup / destination
| 3. Showing a map preview
| 4. Showing quick places
|
| Home is NOT responsible for:
|
| - Route calculation
| - Vehicle selection
| - Fare calculation
| - Price negotiation
| - Rider matching
|
| Those belong to Trip Details and later booking screens.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| GOOGLE
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

  green:
    '#079A4B',

  greenSoft:
    '#EAF8F1',

  red:
    '#EF3154',

  black:
    '#111820',

  gray:
    '#737C88',

  muted:
    '#9AA1AA',

  border:
    '#E7EAED',

  white:
    '#FFFFFF',

  mapBackground:
    '#EEF3F2',

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


type QuickPlaceType =
  | 'home'
  | 'work'
  | 'recent';


/*
|--------------------------------------------------------------------------
| HOME SCREEN
|--------------------------------------------------------------------------
*/

export default function HomeScreen() {

  const router =
    useRouter();


  /*
  |--------------------------------------------------------------------------
  | ROUTE PARAMETERS
  |--------------------------------------------------------------------------
  |
  | These are returned by location-picker.tsx.
  |
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
  | MAP LOADING
  |--------------------------------------------------------------------------
  */

  const [
    mapLoaded,
    setMapLoaded,
  ] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | VALID PICKUP COORDINATES
  |--------------------------------------------------------------------------
  */

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


      /*
      |--------------------------------------------------------------------------
      | Reject invalid coordinates.
      |--------------------------------------------------------------------------
      */

      if (

        !Number.isFinite(lat) ||

        !Number.isFinite(lng)

      ) {

        return null;

      }


      /*
      |--------------------------------------------------------------------------
      | Reject impossible coordinates.
      |--------------------------------------------------------------------------
      */

      if (

        lat < -90 ||

        lat > 90 ||

        lng < -180 ||

        lng > 180

      ) {

        return null;

      }


      /*
      |--------------------------------------------------------------------------
      | 0,0 IS NOT A REAL RIDEX LOCATION
      |--------------------------------------------------------------------------
      */

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


  /*
  |--------------------------------------------------------------------------
  | VALID DESTINATION COORDINATES
  |--------------------------------------------------------------------------
  */

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


  /*
  |--------------------------------------------------------------------------
  | LOCATION STATUS
  |--------------------------------------------------------------------------
  */

  const hasPickup =
    Boolean(
      pickupCoordinates,
    );


  const hasDestination =
    Boolean(
      dropCoordinates,
    );


  const hasCompleteTrip =
    hasPickup &&
    hasDestination;


  /*
  |--------------------------------------------------------------------------
  | MAP CENTER
  |--------------------------------------------------------------------------
  |
  | Kanchikacherla is used as the development fallback because this is
  | currently the RIDEX pilot area.
  |
  */

  const mapCenter =
    pickupCoordinates ||

    dropCoordinates ||

    {

      lat:
        16.5062,

      lng:
        80.6480,

    };


  /*
  |--------------------------------------------------------------------------
  | MAP ZOOM
  |--------------------------------------------------------------------------
  */

  const mapZoom =
    hasCompleteTrip

      ? 13

      : 14;


  /*
  |--------------------------------------------------------------------------
  | OPEN PICKUP
  |--------------------------------------------------------------------------
  */

  const openPickupLocation =
    useCallback(() => {

      router.push({

        pathname:
          '/location-picker',

        params: {

          type:
            'pickup',

        },

      });

    }, [

      router,

    ]);


  /*
  |--------------------------------------------------------------------------
  | OPEN DESTINATION
  |--------------------------------------------------------------------------
  |
  | If pickup already exists, pass it to the picker.
  |
  */

  const openDestinationLocation =
    useCallback(() => {

      router.push({

        pathname:
          '/location-picker',

        params: {

          type:
            'drop',


          pickupName:
            params.pickupName ||
            '',


          pickupAddress:
            params.pickupAddress ||
            '',


          pickupLat:
            params.pickupLat ||
            '',


          pickupLng:
            params.pickupLng ||
            '',

        },

      });

    }, [

      router,

      params.pickupName,

      params.pickupAddress,

      params.pickupLat,

      params.pickupLng,

    ]);


  /*
  |--------------------------------------------------------------------------
  | REVIEW TRIP
  |--------------------------------------------------------------------------
  |
  | Once both locations exist, open the new Trip Details screen.
  |
  */

  const openTripDetails =
    useCallback(() => {

      if (
        !hasCompleteTrip
      ) {

        /*
        | If destination isn't selected, start destination flow.
        */

        openDestinationLocation();

        return;

      }


      router.push({

        pathname:
          '/trip-details',

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

        },

      });

    }, [

      router,

      hasCompleteTrip,

      openDestinationLocation,

      params.pickupName,

      params.pickupAddress,

      params.pickupLat,

      params.pickupLng,

      params.dropName,

      params.dropAddress,

      params.dropLat,

      params.dropLng,

    ]);


  /*
  |--------------------------------------------------------------------------
  | CHANGE PICKUP
  |--------------------------------------------------------------------------
  */

  const changePickup =
    useCallback(() => {

      openPickupLocation();

    }, [

      openPickupLocation,

    ]);


  /*
  |--------------------------------------------------------------------------
  | CHANGE DESTINATION
  |--------------------------------------------------------------------------
  */

  const changeDestination =
    useCallback(() => {

      openDestinationLocation();

    }, [

      openDestinationLocation,

    ]);


  /*
  |--------------------------------------------------------------------------
  | CURRENT LOCATION
  |--------------------------------------------------------------------------
  |
  | The actual current-location functionality already lives in the
  | location picker. Home simply opens pickup selection.
  |
  */

  const handleLocate =
    useCallback(() => {

      openPickupLocation();

    }, [

      openPickupLocation,

    ]);


  /*
  |--------------------------------------------------------------------------
  | QUICK PLACES
  |--------------------------------------------------------------------------
  */

  const handleQuickPlace =
    useCallback(
      (
        type: QuickPlaceType,
      ) => {

        /*
        |--------------------------------------------------------------------------
        | Home / Work
        |--------------------------------------------------------------------------
        |
        | Until saved places are implemented, open destination picker.
        |
        */

        if (

          type === 'home' ||

          type === 'work'

        ) {

          openDestinationLocation();

          return;

        }


        /*
        |--------------------------------------------------------------------------
        | Recent
        |--------------------------------------------------------------------------
        |
        | Recent rides screen will be connected later.
        |
        */

        if (
          type === 'recent'
        ) {

          return;

        }

      },

      [

        openDestinationLocation,

      ],
    );


  /*
  |--------------------------------------------------------------------------
  | NOTIFICATIONS
  |--------------------------------------------------------------------------
  */

  const handleNotifications =
    useCallback(() => {

      /*
      | Future:
      |
      | router.push('/notifications');
      |
      */

    }, []);


  /*
  |--------------------------------------------------------------------------
  | MENU
  |--------------------------------------------------------------------------
  */

  const handleMenu =
    useCallback(() => {

      /*
      | Future:
      |
      | router.push('/menu');
      |
      */

    }, []);


  /*
  |--------------------------------------------------------------------------
  | BOTTOM NAVIGATION
  |--------------------------------------------------------------------------
  */

  const handleBottomNavigation =
    useCallback(
      (
        screen: string,
      ) => {

        switch (
          screen
        ) {

          case 'home':

            break;


          case 'rides':

            /*
            | Future:
            | router.push('/rides');
            */

            break;


          case 'payments':

            /*
            | Future:
            | router.push('/payments');
            */

            break;


          case 'profile':

            /*
            | Future:
            | router.push('/profile');
            */

            break;

        }

      },

      [],
    );


  /*
  |--------------------------------------------------------------------------
  | SCREEN
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

          <View
            style={
              styles.headerText
            }
          >

            <Text
              style={
                styles.greeting
              }
            >
              Good morning 👋
            </Text>


            <Text
              style={
                styles.headerSubtitle
              }
            >
              Where are you going today?
            </Text>

          </View>


          <View
            style={
              styles.headerActions
            }
          >

            {/* NOTIFICATIONS */}

            <Pressable
              style={
                styles.headerButton
              }

              onPress={
                handleNotifications
              }

              hitSlop={
                8
              }
            >

              <Ionicons
                name="notifications-outline"
                size={25}
                color={
                  COLORS.black
                }
              />


              <View
                style={
                  styles.notificationDot
                }
              />

            </Pressable>


            {/* MENU */}

            <Pressable
              style={
                styles.headerButton
              }

              onPress={
                handleMenu
              }

              hitSlop={
                8
              }
            >

              <Ionicons
                name="menu-outline"
                size={30}
                color={
                  COLORS.black
                }
              />

            </Pressable>

          </View>

        </View>


        {/* ================================================================
            MAIN SCROLL
        ================================================================= */}

        <ScrollView

          showsVerticalScrollIndicator={
            false
          }

          contentContainerStyle={
            styles.scrollContent
          }

        >


          {/* ================================================================
              LOCATION CARD
          ================================================================= */}

          <View
            style={
              styles.bookingCard
            }
          >

            {/* PICKUP */}

            <Pressable
              style={
                styles.locationRow
              }

              onPress={
                changePickup
              }
            >

              <View
                style={[
                  styles.locationMarker,

                  styles.pickupMarker,
                ]}
              >

                <View
                  style={
                    styles.markerCenter
                  }
                />

              </View>


              <View
                style={
                  styles.locationContent
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

                  numberOfLines={
                    1
                  }
                >
                  {params.pickupName ||
                    'Current location'}
                </Text>


                {params.pickupAddress && (

                  <Text
                    style={
                      styles.locationAddress
                    }

                    numberOfLines={
                      1
                    }
                  >
                    {params.pickupAddress}
                  </Text>

                )}

              </View>


              <Ionicons
                name="chevron-forward"
                size={20}
                color={
                  COLORS.muted
                }
              />

            </Pressable>


            {/* CONNECTOR */}

            <View
              style={
                styles.locationConnector
              }
            />


            {/* DESTINATION */}

            <Pressable
              style={
                styles.locationRow
              }

              onPress={
                changeDestination
              }
            >

              <View
                style={[
                  styles.locationMarker,

                  styles.dropMarker,
                ]}
              >

                <View
                  style={
                    styles.markerCenter
                  }
                />

              </View>


              <View
                style={
                  styles.locationContent
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
                  style={[
                    styles.locationName,

                    !params.dropName &&
                      styles.placeholderText,

                  ]}

                  numberOfLines={
                    1
                  }
                >
                  {params.dropName ||
                    'Where are you going?'}
                </Text>


                {params.dropAddress && (

                  <Text
                    style={
                      styles.locationAddress
                    }

                    numberOfLines={
                      1
                    }
                  >
                    {params.dropAddress}
                  </Text>

                )}

              </View>


              <View
                style={
                  styles.destinationSearch
                }
              >

                <Ionicons
                  name={
                    params.dropName
                      ? 'chevron-forward'
                      : 'search'
                  }

                  size={
                    params.dropName
                      ? 20
                      : 20
                  }

                  color={
                    params.dropName
                      ? COLORS.muted
                      : COLORS.white
                  }

                />

              </View>

            </Pressable>

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
                    mapZoom
                  }

                  gestureHandling="greedy"

                  disableDefaultUI={
                    true
                  }

                  clickableIcons={
                    false
                  }

                  mapId="DEMO_MAP_ID"

                  onIdle={() =>
                    setMapLoaded(
                      true,
                    )
                  }

                >

                  {/* PICKUP */}

                  {pickupCoordinates && (

                    <AdvancedMarker
                      position={
                        pickupCoordinates
                      }
                    >

                      <View
                        style={
                          styles.mapPickup
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


                  {/* DESTINATION */}

                  {dropCoordinates && (

                    <AdvancedMarker
                      position={
                        dropCoordinates
                      }
                    >

                      <View
                        style={
                          styles.mapDrop
                        }
                      >

                        <Ionicons
                          name="location"
                          size={36}
                          color={
                            COLORS.red
                          }
                        />

                      </View>

                    </AdvancedMarker>

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
                  size={40}
                  color={
                    COLORS.green
                  }
                />


                <Text
                  style={
                    styles.mapFallbackTitle
                  }
                >
                  Map unavailable
                </Text>


                <Text
                  style={
                    styles.mapFallbackText
                  }
                >
                  Google Maps API key is missing.
                </Text>

              </View>

            )}


            {/* MAP LOADING */}

            {!mapLoaded &&
              GOOGLE_API_KEY && (

              <View
                style={
                  styles.mapLoading
                }
              >

                <ActivityIndicator
                  size="small"
                  color={
                    COLORS.green
                  }
                />

              </View>

            )}


            {/* LOCATE BUTTON */}

            <Pressable
              style={
                styles.locateButton
              }

              onPress={
                handleLocate
              }

              hitSlop={
                8
              }
            >

              <Ionicons
                name="locate-outline"
                size={25}
                color={
                  COLORS.black
                }
              />

            </Pressable>


            {/* MAP LABEL */}

            {!hasCompleteTrip && (

              <View
                style={
                  styles.mapHint
                }
              >

                <Ionicons
                  name="navigate-outline"
                  size={16}
                  color={
                    COLORS.green
                  }
                />


                <Text
                  style={
                    styles.mapHintText
                  }
                >
                  Choose a destination to plan your ride
                </Text>

              </View>

            )}

          </View>


          {/* ================================================================
              QUICK PLACES
          ================================================================= */}

          <View
            style={
              styles.sectionHeader
            }
          >

            <Text
              style={
                styles.sectionTitle
              }
            >
              Quick places
            </Text>


            <Pressable
              hitSlop={
                8
              }
            >

              <Text
                style={
                  styles.manageText
                }
              >
                Manage
              </Text>

            </Pressable>

          </View>


          <View
            style={
              styles.quickPlaces
            }
          >

            {/* HOME */}

            <QuickPlace

              icon="home-outline"

              title="Home"

              subtitle="Add address"

              onPress={() =>
                handleQuickPlace(
                  'home',
                )
              }

            />


            {/* WORK */}

            <QuickPlace

              icon="briefcase-outline"

              title="Work"

              subtitle="Add address"

              onPress={() =>
                handleQuickPlace(
                  'work',
                )
              }

            />


            {/* RECENT */}

            <QuickPlace

              icon="time-outline"

              title="Recent"

              subtitle="View places"

              onPress={() =>
                handleQuickPlace(
                  'recent',
                )
              }

            />

          </View>


          {/* ================================================================
              RIDEX VALUE BANNER
          ================================================================= */}

          <View
            style={
              styles.valueBanner
            }
          >

            <View
              style={
                styles.valueIcon
              }
            >

              <Ionicons
                name="shield-checkmark-outline"
                size={27}
                color={
                  COLORS.green
                }
              />

            </View>


            <View
              style={
                styles.valueContent
              }
            >

              <Text
                style={
                  styles.valueTitle
                }
              >
                You set the price.
              </Text>


              <Text
                style={
                  styles.valueSubtitle
                }
              >
                Offer your fare and choose the best rider.
              </Text>

            </View>


            <Ionicons
              name="arrow-forward"
              size={23}
              color={
                COLORS.black
              }
            />

          </View>


          {/* ================================================================
              REVIEW / BOOK BUTTON
          ================================================================= */}

          <Pressable
            style={[
              styles.bookButton,

              !hasCompleteTrip &&
                styles.bookButtonInactive,

            ]}

            onPress={
              openTripDetails
            }
          >

            <Text
              style={
                styles.bookButtonText
              }
            >
              {hasCompleteTrip

                ? 'Review Trip'

                : 'Book a Ride'

              }
            </Text>


            <Ionicons
              name="arrow-forward"
              size={24}
              color={
                COLORS.white
              }
            />

          </Pressable>


          {/* ================================================================
              SMALL TRUST MESSAGE
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
              Safe rides • Transparent pricing
            </Text>

          </View>


        </ScrollView>


        {/* ================================================================
            BOTTOM NAVIGATION
        ================================================================= */}

        <View
          style={
            styles.bottomNav
          }
        >

          <BottomItem

            icon="home"

            label="Home"

            active

            onPress={() =>
              handleBottomNavigation(
                'home',
              )
            }

          />


          <BottomItem

            icon="time-outline"

            label="Rides"

            onPress={() =>
              handleBottomNavigation(
                'rides',
              )
            }

          />


          {/* BOOK RIDE CENTER BUTTON */}

          <View
            style={
              styles.bookContainer
            }
          >

            <Pressable
              style={
                styles.bookCircle
              }

              onPress={
                openTripDetails
              }
            >

              <Ionicons
                name="bicycle"
                size={29}
                color={
                  COLORS.white
                }
              />

            </Pressable>


            <Text
              style={
                styles.bookLabel
              }
            >
              Book Ride
            </Text>

          </View>


          <BottomItem

            icon="wallet-outline"

            label="Payments"

            onPress={() =>
              handleBottomNavigation(
                'payments',
              )
            }

          />


          <BottomItem

            icon="person-outline"

            label="Profile"

            onPress={() =>
              handleBottomNavigation(
                'profile',
              )
            }

          />

        </View>

      </View>

    </SafeAreaView>

  );

}


/*
|--------------------------------------------------------------------------
| QUICK PLACE COMPONENT
|--------------------------------------------------------------------------
*/

function QuickPlace({

  icon,

  title,

  subtitle,

  onPress,

}: {

  icon: any;

  title: string;

  subtitle: string;

  onPress: () => void;

}) {

  return (

    <Pressable

      style={
        styles.quickPlace
      }

      onPress={
        onPress
      }

    >

      <View
        style={
          styles.quickIcon
        }
      >

        <Ionicons
          name={
            icon
          }

          size={22}

          color={
            COLORS.green
          }

        />

      </View>


      <View
        style={
          styles.quickContent
        }
      >

        <Text
          style={
            styles.quickTitle
          }
        >
          {title}
        </Text>


        <Text
          style={
            styles.quickSubtitle
          }
        >
          {subtitle}
        </Text>

      </View>

    </Pressable>

  );

}


/*
|--------------------------------------------------------------------------
| BOTTOM NAV ITEM
|--------------------------------------------------------------------------
*/

function BottomItem({

  icon,

  label,

  active = false,

  onPress,

}: {

  icon: any;

  label: string;

  active?: boolean;

  onPress: () => void;

}) {

  return (

    <Pressable

      style={
        styles.bottomItem
      }

      onPress={
        onPress
      }

    >

      <Ionicons

        name={
          icon
        }

        size={24}

        color={
          active

            ? COLORS.green

            : '#777D84'
        }

      />


      <Text
        style={[
          styles.bottomLabel,

          active &&
            styles.bottomLabelActive,

        ]}
      >
        {label}
      </Text>


      {active && (

        <View
          style={
            styles.bottomIndicator
          }
        />

      )}

    </Pressable>

  );

}


/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({

    /*
    |--------------------------------------------------------------------------
    | SCREEN
    |--------------------------------------------------------------------------
    */

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


    scrollContent: {

      paddingHorizontal: 18,

      paddingBottom: 110,

    },


    /*
    |--------------------------------------------------------------------------
    | HEADER
    |--------------------------------------------------------------------------
    */

    header: {

      height: 78,

      paddingHorizontal: 20,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      backgroundColor:
        COLORS.white,

    },


    headerText: {

      flex: 1,

    },


    greeting: {

      fontSize: 23,

      fontWeight:
        '800',

      color:
        COLORS.black,

      letterSpacing:
        -0.4,

    },


    headerSubtitle: {

      marginTop: 4,

      fontSize: 14,

      color:
        COLORS.gray,

    },


    headerActions: {

      flexDirection:
        'row',

      alignItems:
        'center',

    },


    headerButton: {

      width: 42,

      height: 42,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginLeft: 4,

    },


    notificationDot: {

      position:
        'absolute',

      right: 6,

      top: 5,

      width: 9,

      height: 9,

      borderRadius: 5,

      backgroundColor:
        COLORS.green,

      borderWidth: 1.5,

      borderColor:
        COLORS.white,

    },


    /*
    |--------------------------------------------------------------------------
    | BOOKING CARD
    |--------------------------------------------------------------------------
    */

    bookingCard: {

      backgroundColor:
        COLORS.white,

      borderRadius: 23,

      paddingHorizontal: 16,

      paddingVertical: 12,

      shadowColor:
        '#000',

      shadowOpacity:
        0.09,

      shadowRadius:
        15,

      shadowOffset: {

        width: 0,

        height: 5,

      },

      elevation: 5,

      zIndex: 10,

    },


    locationRow: {

      minHeight: 65,

      flexDirection:
        'row',

      alignItems:
        'center',

    },


    locationMarker: {

      width: 30,

      height: 30,

      borderRadius: 15,

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    pickupMarker: {

      backgroundColor:
        COLORS.green,

    },


    dropMarker: {

      backgroundColor:
        COLORS.red,

    },


    markerCenter: {

      width: 9,

      height: 9,

      borderRadius: 5,

      backgroundColor:
        COLORS.white,

    },


    locationContent: {

      flex: 1,

      marginLeft: 13,

      marginRight: 8,

    },


    pickupLabel: {

      fontSize: 13,

      fontWeight:
        '700',

      color:
        COLORS.green,

    },


    dropLabel: {

      fontSize: 13,

      fontWeight:
        '700',

      color:
        COLORS.red,

    },


    locationName: {

      marginTop: 3,

      fontSize: 16,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    placeholderText: {

      color:
        COLORS.muted,

      fontWeight:
        '600',

    },


    locationAddress: {

      marginTop: 2,

      fontSize: 12,

      color:
        COLORS.gray,

    },


    locationConnector: {

      height: 20,

      width: 2,

      marginLeft: 14,

      backgroundColor:
        '#E2E6E8',

    },


    destinationSearch: {

      width: 43,

      height: 43,

      borderRadius: 14,

      backgroundColor:
        COLORS.green,

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    /*
    |--------------------------------------------------------------------------
    | MAP
    |--------------------------------------------------------------------------
    */

    mapContainer: {

      height: 255,

      marginTop: 13,

      borderRadius: 23,

      overflow:
        'hidden',

      backgroundColor:
        COLORS.mapBackground,

      position:
        'relative',

    },


    mapLoading: {

      position:
        'absolute',

      top: 15,

      left: 15,

      width: 38,

      height: 38,

      borderRadius: 19,

      backgroundColor:
        COLORS.white,

      alignItems:
        'center',

      justifyContent:
        'center',

      shadowColor:
        '#000',

      shadowOpacity:
        0.1,

      shadowRadius:
        6,

      elevation: 3,

    },


    mapPickup: {

      width: 32,

      height: 32,

      borderRadius: 16,

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


    mapPickupDot: {

      width: 11,

      height: 11,

      borderRadius: 6,

      backgroundColor:
        COLORS.green,

    },


    mapDrop: {

      width: 42,

      height: 42,

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    locateButton: {

      position:
        'absolute',

      right: 14,

      bottom: 14,

      width: 49,

      height: 49,

      borderRadius: 16,

      backgroundColor:
        COLORS.white,

      alignItems:
        'center',

      justifyContent:
        'center',

      shadowColor:
        '#000',

      shadowOpacity:
        0.12,

      shadowRadius:
        8,

      shadowOffset: {

        width: 0,

        height: 3,

      },

      elevation: 5,

    },


    mapHint: {

      position:
        'absolute',

      top: 14,

      left: 14,

      right: 75,

      minHeight: 39,

      borderRadius: 20,

      paddingHorizontal: 13,

      flexDirection:
        'row',

      alignItems:
        'center',

      backgroundColor:
        COLORS.white,

      shadowColor:
        '#000',

      shadowOpacity:
        0.08,

      shadowRadius:
        7,

      elevation: 3,

    },


    mapHintText: {

      flex: 1,

      marginLeft: 7,

      fontSize: 12,

      fontWeight:
        '600',

      color:
        COLORS.gray,

    },


    mapFallback: {

      flex: 1,

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    mapFallbackTitle: {

      marginTop: 8,

      fontSize: 16,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    mapFallbackText: {

      marginTop: 3,

      fontSize: 12,

      color:
        COLORS.gray,

    },


    /*
    |--------------------------------------------------------------------------
    | QUICK PLACES
    |--------------------------------------------------------------------------
    */

    sectionHeader: {

      marginTop: 18,

      marginBottom: 10,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

    },


    sectionTitle: {

      fontSize: 18,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    manageText: {

      fontSize: 13,

      fontWeight:
        '700',

      color:
        COLORS.green,

    },


    quickPlaces: {

      flexDirection:
        'row',

      gap: 9,

    },


    quickPlace: {

      flex: 1,

      minHeight: 85,

      borderRadius: 18,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.white,

      padding: 11,

    },


    quickIcon: {

      width: 38,

      height: 38,

      borderRadius: 19,

      backgroundColor:
        COLORS.greenSoft,

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    quickContent: {

      marginTop: 7,

    },


    quickTitle: {

      fontSize: 13,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    quickSubtitle: {

      marginTop: 2,

      fontSize: 11,

      color:
        COLORS.gray,

    },


    /*
    |--------------------------------------------------------------------------
    | VALUE BANNER
    |--------------------------------------------------------------------------
    */

    valueBanner: {

      minHeight: 90,

      marginTop: 17,

      borderRadius: 21,

      paddingHorizontal: 14,

      flexDirection:
        'row',

      alignItems:
        'center',

      backgroundColor:
        '#F0FAF4',

    },


    valueIcon: {

      width: 50,

      height: 50,

      borderRadius: 25,

      backgroundColor:
        '#E0F4E8',

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    valueContent: {

      flex: 1,

      marginLeft: 12,

      marginRight: 8,

    },


    valueTitle: {

      fontSize: 15,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    valueSubtitle: {

      marginTop: 4,

      fontSize: 12,

      lineHeight: 17,

      color:
        COLORS.gray,

    },


    /*
    |--------------------------------------------------------------------------
    | MAIN BOOK BUTTON
    |--------------------------------------------------------------------------
    */

    bookButton: {

      minHeight: 58,

      marginTop: 13,

      borderRadius: 18,

      paddingHorizontal: 20,

      backgroundColor:
        COLORS.green,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    bookButtonInactive: {

      backgroundColor:
        COLORS.green,

    },


    bookButtonText: {

      flex: 1,

      textAlign:
        'center',

      fontSize: 16,

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

      paddingVertical: 8,

    },


    trustText: {

      marginLeft: 6,

      fontSize: 11.5,

      color:
        COLORS.gray,

    },


    /*
    |--------------------------------------------------------------------------
    | BOTTOM NAV
    |--------------------------------------------------------------------------
    */

    bottomNav: {

      position:
        'absolute',

      left: 10,

      right: 10,

      bottom: 7,

      height: 70,

      borderRadius: 22,

      backgroundColor:
        COLORS.white,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-around',

      shadowColor:
        '#000',

      shadowOpacity:
        0.1,

      shadowRadius:
        15,

      shadowOffset: {

        width: 0,

        height: -3,

      },

      elevation: 9,

    },


    bottomItem: {

      width: 62,

      height: 60,

      alignItems:
        'center',

      justifyContent:
        'center',

      position:
        'relative',

    },


    bottomLabel: {

      marginTop: 3,

      fontSize: 10.5,

      color:
        '#777D84',

    },


    bottomLabelActive: {

      color:
        COLORS.green,

      fontWeight:
        '700',

    },


    bottomIndicator: {

      position:
        'absolute',

      bottom: 0,

      width: 23,

      height: 3,

      borderRadius: 2,

      backgroundColor:
        COLORS.green,

    },


    /*
    |--------------------------------------------------------------------------
    | CENTER BOOK BUTTON
    |--------------------------------------------------------------------------
    */

    bookContainer: {

      width: 78,

      alignItems:
        'center',

      marginTop: -27,

    },


    bookCircle: {

      width: 61,

      height: 61,

      borderRadius: 31,

      backgroundColor:
        COLORS.green,

      borderWidth: 4,

      borderColor:
        COLORS.white,

      alignItems:
        'center',

      justifyContent:
        'center',

      shadowColor:
        COLORS.green,

      shadowOpacity:
        0.25,

      shadowRadius:
        8,

      shadowOffset: {

        width: 0,

        height: 4,

      },

      elevation: 7,

    },


    bookLabel: {

      marginTop: 2,

      fontSize: 10.5,

      fontWeight:
        '700',

      color:
        COLORS.black,

    },

  });