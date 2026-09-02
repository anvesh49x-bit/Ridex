import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';


/*
|--------------------------------------------------------------------------
| TYPES
|--------------------------------------------------------------------------
*/

type LocationType =
  | 'pickup'
  | 'drop';


type LocationResult = {

  id: string;

  name: string;

  address: string;

  latitude: number;

  longitude: number;

};


/*
|--------------------------------------------------------------------------
| COLORS
|--------------------------------------------------------------------------
*/

const COLORS = {

  green: '#079A4B',

  greenLight: '#EAF8F1',

  red: '#EF3154',

  black: '#111820',

  gray: '#737C88',

  lightGray: '#A0A6AD',

  border: '#E5E8EB',

  white: '#FFFFFF',

};


/*
|--------------------------------------------------------------------------
| GOOGLE API
|--------------------------------------------------------------------------
*/

const GOOGLE_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;


/*
|--------------------------------------------------------------------------
| LOCATION PICKER
|--------------------------------------------------------------------------
*/

export default function LocationPicker() {

  const router =
    useRouter();


  /*
  |--------------------------------------------------------------------------
  | PARAMETERS
  |--------------------------------------------------------------------------
  */

  const params =
    useLocalSearchParams<{

      type?: string;

      pickupName?: string;

      pickupAddress?: string;

      pickupLat?: string;

      pickupLng?: string;

    }>();


  /*
  |--------------------------------------------------------------------------
  | LOCATION TYPE
  |--------------------------------------------------------------------------
  */

  const [
    locationType,
    setLocationType,
  ] =
    useState<LocationType>(

      params.type === 'drop'

        ? 'drop'

        : 'pickup',

    );


  /*
  |--------------------------------------------------------------------------
  | SEARCH STATE
  |--------------------------------------------------------------------------
  */

  const [
    query,
    setQuery,
  ] =
    useState('');


  const [
    results,
    setResults,
  ] =
    useState<LocationResult[]>([]);


  const [
    selected,
    setSelected,
  ] =
    useState<LocationResult | null>(
      null,
    );


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  const [
    searched,
    setSearched,
  ] =
    useState(false);


  const searchTimer =
    useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );


  /*
  |--------------------------------------------------------------------------
  | GOOGLE PLACES AUTOCOMPLETE
  |--------------------------------------------------------------------------
  */

  const searchLocations =
    async (
      text: string,
    ) => {

      const cleanText =
        text.trim();


      if (
        cleanText.length < 2
      ) {

        setResults([]);

        setSearched(false);

        return;

      }


      if (
        !GOOGLE_API_KEY
      ) {

        console.error(
          'RIDEX: Missing EXPO_PUBLIC_GOOGLE_PLACES_API_KEY',
        );

        setResults([]);

        setSearched(true);

        return;

      }


      try {

        setLoading(true);

        setSearched(true);


        const response =
          await fetch(

            'https://places.googleapis.com/v1/places:autocomplete',

            {

              method: 'POST',

              headers: {

                'Content-Type':
                  'application/json',

                'X-Goog-Api-Key':
                  GOOGLE_API_KEY,

                'X-Goog-FieldMask':
                  'suggestions.placePrediction.placeId,' +
                  'suggestions.placePrediction.text,' +
                  'suggestions.placePrediction.structuredFormat',

              },

              body:
                JSON.stringify({

                  input:
                    cleanText,

                  includedRegionCodes:
                    ['in'],

                  languageCode:
                    'en',

                }),

            },

          );


        if (
          !response.ok
        ) {

          const errorText =
            await response.text();


          console.error(
            'RIDEX: Google Places error:',
            errorText,
          );


          throw new Error(
            'Google Places request failed',
          );

        }


        const data =
          await response.json();


        const predictions =
          data.suggestions || [];


        const mapped:
          LocationResult[] =

          predictions

            .map(
              (
                suggestion: any,
              ) => {

                const prediction =
                  suggestion.placePrediction;


                if (
                  !prediction
                ) {

                  return null;

                }


                return {

                  id:
                    prediction.placeId,

                  name:
                    prediction
                      .structuredFormat
                      ?.mainText
                      ?.text ||

                    prediction
                      .text
                      ?.text ||

                    'Location',

                  address:
                    prediction
                      .structuredFormat
                      ?.secondaryText
                      ?.text ||

                    prediction
                      .text
                      ?.text ||

                    '',

                  /*
                  |----------------------------------------------------------
                  | Coordinates are retrieved after selection.
                  |----------------------------------------------------------
                  */

                  latitude: 0,

                  longitude: 0,

                };

              },
            )

            .filter(
              Boolean,
            );


        setResults(
          mapped,
        );

      } catch (
        error
      ) {

        console.error(
          'RIDEX: Location search error:',
          error,
        );

        setResults([]);

      } finally {

        setLoading(false);

      }

    };


  /*
  |--------------------------------------------------------------------------
  | DEBOUNCED SEARCH
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (
      searchTimer.current
    ) {

      clearTimeout(
        searchTimer.current,
      );

    }


    if (
      !query.trim()
    ) {

      setResults([]);

      setSearched(false);

      return;

    }


    searchTimer.current =
      setTimeout(
        () => {

          searchLocations(
            query,
          );

        },

        350,

      );


    return () => {

      if (
        searchTimer.current
      ) {

        clearTimeout(
          searchTimer.current,
        );

      }

    };

  }, [
    query,
  ]);


  /*
  |--------------------------------------------------------------------------
  | GET PLACE DETAILS
  |--------------------------------------------------------------------------
  */

  const getPlaceDetails =
    async (
      placeId: string,
    ): Promise<LocationResult | null> => {

      if (
        !GOOGLE_API_KEY
      ) {

        return null;

      }


      try {

        const response =
          await fetch(

            `https://places.googleapis.com/v1/places/${encodeURIComponent(
              placeId,
            )}`,

            {

              headers: {

                'X-Goog-Api-Key':
                  GOOGLE_API_KEY,

                'X-Goog-FieldMask':
                  'id,displayName,formattedAddress,location',

              },

            },

          );


        if (
          !response.ok
        ) {

          const errorText =
            await response.text();


          console.error(
            'RIDEX: Place details error:',
            errorText,
          );


          return null;

        }


        const place =
          await response.json();


        const latitude =
          Number(
            place.location?.latitude,
          );


        const longitude =
          Number(
            place.location?.longitude,
          );


        if (

          !Number.isFinite(
            latitude,
          ) ||

          !Number.isFinite(
            longitude,
          )

        ) {

          return null;

        }


        return {

          id:
            place.id ||
            placeId,

          name:
            place.displayName
              ?.text ||
            'Location',

          address:
            place.formattedAddress ||
            '',

          latitude,

          longitude,

        };

      } catch (
        error
      ) {

        console.error(
          'RIDEX: Place details exception:',
          error,
        );

        return null;

      }

    };


  /*
  |--------------------------------------------------------------------------
  | SELECT SEARCH RESULT
  |--------------------------------------------------------------------------
  */

  const selectLocation =
    async (
      location: LocationResult,
    ) => {

      Keyboard.dismiss();

      setLoading(true);


      try {

        const details =
          await getPlaceDetails(
            location.id,
          );


        if (
          details
        ) {

          setSelected(
            details,
          );

          setQuery(
            details.name,
          );

        } else {

          setSelected(
            location,
          );

          setQuery(
            location.name,
          );

        }


        setResults([]);

      } finally {

        setLoading(false);

      }

    };


  /*
  |--------------------------------------------------------------------------
  | CURRENT LOCATION
  |--------------------------------------------------------------------------
  */

  const useCurrentLocation =
    async () => {

      if (
        locationType !==
        'pickup'
      ) {

        return;

      }


      if (
        typeof navigator ===
        'undefined' ||

        !navigator.geolocation
      ) {

        Alert.alert(
          'Location unavailable',
          'Your device location is not available. Please search for your pickup location instead.',
        );

        return;

      }


      try {

        setLoading(true);


        const position =
          await new Promise<GeolocationPosition>(
            (
              resolve,
              reject,
            ) => {

              navigator.geolocation.getCurrentPosition(

                resolve,

                reject,

                {

                  enableHighAccuracy:
                    true,

                  timeout:
                    15000,

                  maximumAge:
                    30000,

                },

              );

            },
          );


        const latitude =
          position.coords.latitude;


        const longitude =
          position.coords.longitude;


        /*
        |--------------------------------------------------------------------------
        | Reverse geocode
        |--------------------------------------------------------------------------
        */

        let address =
          'Current location';


        if (
          GOOGLE_API_KEY
        ) {

          try {

            const response =
              await fetch(

                `https://geocode.googleapis.com/v4beta/geocode/location?location.latitude=${latitude}&location.longitude=${longitude}`,

                {

                  headers: {

                    'X-Goog-Api-Key':
                      GOOGLE_API_KEY,

                  },

                },

              );


            if (
              response.ok
            ) {

              const data =
                await response.json();


              address =
                data.results?.[0]
                  ?.formattedAddress ||

                'Current location';

            }

          } catch (
            reverseGeocodeError
          ) {

            console.warn(
              'RIDEX: Reverse geocoding failed:',
              reverseGeocodeError,
            );

          }

        }


        const currentLocation:
          LocationResult = {

            id:
              'current-location',

            name:
              'Current location',

            address,

            latitude,

            longitude,

          };


        setSelected(
          currentLocation,
        );

        setQuery(
          'Current location',
        );

        setResults([]);

        setSearched(false);

      } catch (
        error
      ) {

        console.error(
          'RIDEX: Current location error:',
          error,
        );


        Alert.alert(

          'Unable to get location',

          'Please allow location access or search for your pickup manually.',

        );

      } finally {

        setLoading(false);

      }

    };


  /*
  |--------------------------------------------------------------------------
  | CHOOSE ON MAP
  |--------------------------------------------------------------------------
  */

  const openMapPicker =
    () => {

      router.push({

        pathname:
          '/map-picker',

        params: {

          type:
            locationType,

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

    };


  /*
  |--------------------------------------------------------------------------
  | CONTINUE
  |--------------------------------------------------------------------------
  */

  const handleContinue =
    () => {

      if (
        !selected
      ) {

        return;

      }


      /*
      |--------------------------------------------------------------------------
      | PICKUP
      |--------------------------------------------------------------------------
      |
      | Keep the picker open and switch to destination.
      |
      */

      if (
        locationType ===
        'pickup'
      ) {

        /*
        | IMPORTANT:
        |
        | We do NOT navigate to Home here.
        |
        | The selected pickup becomes the parameters
        | for the destination step.
        */

        router.replace({

          pathname:
            '/location-picker',

          params: {

            type:
              'drop',

            pickupName:
              selected.name,

            pickupAddress:
              selected.address,

            pickupLat:
              String(
                selected.latitude,
              ),

            pickupLng:
              String(
                selected.longitude,
              ),

          },

        });

        return;

      }


      /*
      |--------------------------------------------------------------------------
      | DESTINATION
      |--------------------------------------------------------------------------
      |
      | THIS IS THE IMPORTANT FIX.
      |
      | Previously this navigated to /home.
      |
      | Now it goes directly to /trip-details.
      |--------------------------------------------------------------------------
      */

      router.replace({

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
            selected.name,

          dropAddress:
            selected.address,

          dropLat:
            String(
              selected.latitude,
            ),

          dropLng:
            String(
              selected.longitude,
            ),

        },

      });

    };


  /*
  |--------------------------------------------------------------------------
  | BACK
  |--------------------------------------------------------------------------
  */

  const handleBack =
    () => {

      /*
      |--------------------------------------------------------------------------
      | If we are on destination selection after choosing pickup,
      | go back to pickup selection.
      |--------------------------------------------------------------------------
      */

      if (
        locationType ===
          'drop' &&

        params.type !==
          'drop'
      ) {

        router.replace({

          pathname:
            '/location-picker',

          params: {

            type:
              'pickup',

          },

        });

        return;

      }


      router.back();

    };


  /*
  |--------------------------------------------------------------------------
  | PAGE TEXT
  |--------------------------------------------------------------------------
  */

  const title =
    locationType ===
      'pickup'

      ? 'Choose pickup location'

      : 'Where are you going?';


  const placeholder =
    locationType ===
      'pickup'

      ? 'Search pickup location'

      : 'Search destination';


  const buttonText =
    locationType ===
      'pickup'

      ? 'Continue to destination'

      : 'Confirm destination';


  /*
  |--------------------------------------------------------------------------
  | UI
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
          styles.container
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

              size={25}

              color={
                COLORS.black
              }

            />

          </Pressable>


          <Text
            style={
              styles.headerTitle
            }
          >

            {title}

          </Text>


          <View
            style={
              styles.headerSpacer
            }
          />

        </View>


        {/* ================================================================
            STEPS
        ================================================================= */}

        <View
          style={
            styles.steps
          }
        >

          {/* PICKUP */}

          <View
            style={
              styles.step
            }
          >

            <View
              style={[
                styles.stepCircle,

                styles.stepActive,

              ]}
            >

              <Text
                style={
                  styles.stepNumberActive
                }
              >
                1
              </Text>

            </View>


            <Text
              style={[
                styles.stepText,

                locationType ===
                  'pickup' &&
                  styles.stepTextActive,

              ]}
            >
              Pickup
            </Text>

          </View>


          {/* LINE */}

          <View
            style={[
              styles.stepLine,

              locationType ===
                'drop' &&
                styles.stepLineActive,

            ]}
          />


          {/* DESTINATION */}

          <View
            style={
              styles.step
            }
          >

            <View
              style={[
                styles.stepCircle,

                locationType ===
                  'drop' &&
                  styles.stepActive,

              ]}
            >

              <Text
                style={
                  locationType ===
                    'drop'

                    ? styles.stepNumberActive

                    : styles.stepNumber
                }
              >
                2
              </Text>

            </View>


            <Text
              style={[
                styles.stepText,

                locationType ===
                  'drop' &&
                  styles.stepTextActive,

              ]}
            >
              Destination
            </Text>

          </View>

        </View>


        {/* ================================================================
            SEARCH
        ================================================================= */}

        <View
          style={
            styles.searchContainer
          }
        >

          <Ionicons
            name="search"
            size={22}
            color={
              COLORS.gray
            }
          />


          <TextInput

            value={
              query
            }

            onChangeText={
              (text) => {

                setQuery(
                  text,
                );

                setSelected(
                  null,
                );

              }
            }

            placeholder={
              placeholder
            }

            placeholderTextColor="#9AA1AA"

            style={
              styles.searchInput
            }

            autoFocus

            autoCorrect={
              false
            }

            autoCapitalize="words"

            returnKeyType="search"

          />


          {loading && (

            <ActivityIndicator

              size="small"

              color={
                COLORS.green
              }

            />

          )}


          {!loading &&
            query.length > 0 && (

            <Pressable

              onPress={() => {

                setQuery('');

                setSelected(
                  null,
                );

                setResults([]);

                setSearched(
                  false,
                );

              }}

            >

              <Ionicons

                name="close-circle"

                size={21}

                color="#A5ABB2"

              />

            </Pressable>

          )}

        </View>


        {/* ================================================================
            CURRENT LOCATION
        ================================================================= */}

        {locationType ===
          'pickup' && (

          <Pressable

            style={
              styles.currentLocation
            }

            onPress={
              useCurrentLocation
            }

          >

            <View
              style={
                styles.currentIcon
              }
            >

              <Ionicons

                name="locate"

                size={22}

                color={
                  COLORS.green
                }

              />

            </View>


            <View
              style={
                styles.currentText
              }
            >

              <Text
                style={
                  styles.currentTitle
                }
              >
                Use current location
              </Text>


              <Text
                style={
                  styles.currentSubtitle
                }
              >
                Use your phone's GPS location
              </Text>

            </View>


            <Ionicons

              name="chevron-forward"

              size={20}

              color="#9AA1AA"

            />

          </Pressable>

        )}


        {/* ================================================================
            CHOOSE ON MAP
        ================================================================= */}

        <Pressable

          style={
            styles.mapOption
          }

          onPress={
            openMapPicker
          }

        >

          <View
            style={
              styles.mapIcon
            }
          >

            <Ionicons

              name="map-outline"

              size={23}

              color={
                COLORS.green
              }

            />

          </View>


          <View
            style={
              styles.mapText
            }
          >

            <Text
              style={
                styles.mapTitle
              }
            >
              Choose on map
            </Text>


            <Text
              style={
                styles.mapSubtitle
              }
            >
              Pick an exact location on the map
            </Text>

          </View>


          <Ionicons

            name="chevron-forward"

            size={20}

            color="#9AA1AA"

          />

        </Pressable>


        {/* ================================================================
            SELECTED LOCATION
        ================================================================= */}

        {selected && (

          <View
            style={
              styles.selectedCard
            }
          >

            <View
              style={
                styles.selectedIcon
              }
            >

              <Ionicons

                name="location"

                size={21}

                color={
                  COLORS.green
                }

              />

            </View>


            <View
              style={
                styles.selectedContent
              }
            >

              <Text

                style={
                  styles.selectedTitle
                }

                numberOfLines={
                  1
                }

              >
                {selected.name}
              </Text>


              <Text

                style={
                  styles.selectedAddress
                }

                numberOfLines={
                  2
                }

              >
                {selected.address}
              </Text>

            </View>


            <Ionicons

              name="checkmark-circle"

              size={25}

              color={
                COLORS.green
              }

            />

          </View>

        )}


        {/* ================================================================
            SEARCH RESULTS
        ================================================================= */}

        {!selected && (

          <View
            style={
              styles.results
            }
          >

            {loading && (

              <View
                style={
                  styles.loading
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
                    styles.loadingText
                  }
                >
                  Searching locations...
                </Text>

              </View>

            )}


            {!loading &&

              results.map(
                (
                  location,
                ) => (

                  <Pressable

                    key={
                      location.id
                    }

                    style={
                      styles.result
                    }

                    onPress={() =>
                      selectLocation(
                        location,
                      )
                    }

                  >

                    <View
                      style={
                        styles.resultIcon
                      }
                    >

                      <Ionicons

                        name="location-outline"

                        size={21}

                        color={
                          COLORS.green
                        }

                      />

                    </View>


                    <View
                      style={
                        styles.resultContent
                      }
                    >

                      <Text

                        style={
                          styles.resultName
                        }

                        numberOfLines={
                          1
                        }

                      >
                        {location.name}
                      </Text>


                      <Text

                        style={
                          styles.resultAddress
                        }

                        numberOfLines={
                          2
                        }

                      >
                        {location.address}
                      </Text>

                    </View>


                    <Ionicons

                      name="chevron-forward"

                      size={19}

                      color="#A0A6AD"

                    />

                  </Pressable>

                ),
              )}


            {!loading &&

              searched &&

              results.length ===
                0 && (

              <View
                style={
                  styles.empty
                }
              >

                <View
                  style={
                    styles.emptyIcon
                  }
                >

                  <Ionicons

                    name="search-outline"

                    size={28}

                    color="#8A929B"

                  />

                </View>


                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  No matching locations
                </Text>


                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Try a college, landmark,
                  street or nearby area.
                </Text>

              </View>

            )}

          </View>

        )}


        {/* ================================================================
            CONTINUE BUTTON
        ================================================================= */}

        <View
          style={
            styles.bottomArea
          }
        >

          <Pressable

            style={[

              styles.continueButton,

              !selected &&
                styles.continueDisabled,

            ]}

            disabled={
              !selected
            }

            onPress={
              handleContinue
            }

          >

            <Text
              style={[

                styles.continueText,

                !selected &&
                  styles.continueTextDisabled,

              ]}
            >

              {buttonText}

            </Text>


            <Ionicons

              name="arrow-forward"

              size={22}

              color={

                selected

                  ? COLORS.white

                  : COLORS.lightGray

              }

            />

          </Pressable>

        </View>


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


    container: {

      flex: 1,

      backgroundColor:
        COLORS.white,

      paddingHorizontal:
        20,

    },


    /*
    |--------------------------------------------------------------------------
    | HEADER
    |--------------------------------------------------------------------------
    */

    header: {

      height: 62,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

    },


    backButton: {

      width: 42,

      height: 42,

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    headerTitle: {

      flex: 1,

      textAlign:
        'center',

      fontSize: 19,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    headerSpacer: {

      width: 42,

    },


    /*
    |--------------------------------------------------------------------------
    | STEPS
    |--------------------------------------------------------------------------
    */

    steps: {

      height: 50,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    step: {

      flexDirection:
        'row',

      alignItems:
        'center',

    },


    stepCircle: {

      width: 28,

      height: 28,

      borderRadius: 14,

      borderWidth: 1.5,

      borderColor:
        COLORS.border,

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    stepActive: {

      backgroundColor:
        COLORS.green,

      borderColor:
        COLORS.green,

    },


    stepNumber: {

      fontSize: 13,

      fontWeight:
        '700',

      color:
        '#858C95',

    },


    stepNumberActive: {

      fontSize: 13,

      fontWeight:
        '800',

      color:
        COLORS.white,

    },


    stepText: {

      marginLeft: 7,

      fontSize: 13,

      color:
        '#858C95',

      fontWeight:
        '600',

    },


    stepTextActive: {

      color:
        COLORS.green,

    },


    stepLine: {

      width: 45,

      height: 2,

      backgroundColor:
        COLORS.border,

      marginHorizontal:
        10,

    },


    stepLineActive: {

      backgroundColor:
        COLORS.green,

    },


    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    searchContainer: {

      height: 58,

      borderWidth: 1.5,

      borderColor:
        COLORS.border,

      borderRadius: 16,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        16,

      marginTop: 8,

    },


    searchInput: {

      flex: 1,

      marginLeft: 12,

      fontSize: 16,

      color:
        COLORS.black,

      fontWeight:
        '500',

      paddingVertical:
        0,

    },


    /*
    |--------------------------------------------------------------------------
    | CURRENT LOCATION
    |--------------------------------------------------------------------------
    */

    currentLocation: {

      minHeight: 70,

      marginTop: 14,

      borderRadius: 16,

      backgroundColor:
        COLORS.greenLight,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        14,

    },


    currentIcon: {

      width: 42,

      height: 42,

      borderRadius: 21,

      backgroundColor:
        COLORS.white,

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    currentText: {

      flex: 1,

      marginLeft: 12,

    },


    currentTitle: {

      fontSize: 15,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    currentSubtitle: {

      marginTop: 3,

      fontSize: 12,

      color:
        COLORS.gray,

    },


    /*
    |--------------------------------------------------------------------------
    | MAP OPTION
    |--------------------------------------------------------------------------
    */

    mapOption: {

      minHeight: 70,

      marginTop: 10,

      borderRadius: 16,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        14,

    },


    mapIcon: {

      width: 42,

      height: 42,

      borderRadius: 21,

      backgroundColor:
        COLORS.greenLight,

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    mapText: {

      flex: 1,

      marginLeft: 12,

    },


    mapTitle: {

      fontSize: 15,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    mapSubtitle: {

      marginTop: 3,

      fontSize: 12,

      color:
        COLORS.gray,

    },


    /*
    |--------------------------------------------------------------------------
    | SELECTED
    |--------------------------------------------------------------------------
    */

    selectedCard: {

      minHeight: 76,

      marginTop: 12,

      borderRadius: 16,

      borderWidth: 1.5,

      borderColor:
        COLORS.green,

      backgroundColor:
        COLORS.greenLight,

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal:
        14,

    },


    selectedIcon: {

      width: 42,

      height: 42,

      borderRadius: 21,

      backgroundColor:
        COLORS.white,

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    selectedContent: {

      flex: 1,

      marginLeft: 12,

      marginRight: 8,

    },


    selectedTitle: {

      fontSize: 15,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    selectedAddress: {

      marginTop: 3,

      fontSize: 12,

      color:
        COLORS.gray,

    },


    /*
    |--------------------------------------------------------------------------
    | RESULTS
    |--------------------------------------------------------------------------
    */

    results: {

      flex: 1,

      marginTop: 10,

    },


    result: {

      minHeight: 70,

      flexDirection:
        'row',

      alignItems:
        'center',

      borderBottomWidth: 1,

      borderBottomColor:
        '#F0F1F2',

    },


    resultIcon: {

      width: 42,

      height: 42,

      borderRadius: 21,

      backgroundColor:
        COLORS.greenLight,

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    resultContent: {

      flex: 1,

      marginLeft: 12,

      marginRight: 8,

    },


    resultName: {

      fontSize: 15,

      fontWeight:
        '700',

      color:
        COLORS.black,

    },


    resultAddress: {

      marginTop: 3,

      fontSize: 12,

      lineHeight: 17,

      color:
        COLORS.gray,

    },


    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    loading: {

      height: 70,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    loadingText: {

      marginLeft: 9,

      fontSize: 13,

      color:
        COLORS.gray,

    },


    /*
    |--------------------------------------------------------------------------
    | EMPTY
    |--------------------------------------------------------------------------
    */

    empty: {

      alignItems:
        'center',

      paddingTop:
        50,

      paddingHorizontal:
        30,

    },


    emptyIcon: {

      width: 58,

      height: 58,

      borderRadius: 29,

      backgroundColor:
        '#F2F4F5',

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    emptyTitle: {

      marginTop: 14,

      fontSize: 16,

      fontWeight:
        '800',

      color:
        COLORS.black,

    },


    emptyText: {

      marginTop: 6,

      textAlign:
        'center',

      fontSize: 13,

      lineHeight: 19,

      color:
        COLORS.gray,

    },


    /*
    |--------------------------------------------------------------------------
    | BOTTOM
    |--------------------------------------------------------------------------
    */

    bottomArea: {

      paddingTop:
        10,

      paddingBottom:
        12,

      backgroundColor:
        COLORS.white,

    },


    continueButton: {

      height: 56,

      borderRadius: 16,

      backgroundColor:
        COLORS.green,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    continueDisabled: {

      backgroundColor:
        '#E8EAEC',

    },


    continueText: {

      color:
        COLORS.white,

      fontSize: 16,

      fontWeight:
        '800',

      marginRight:
        10,

    },


    continueTextDisabled: {

      color:
        COLORS.lightGray,

    },

  });