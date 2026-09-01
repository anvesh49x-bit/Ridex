import React, { useEffect, useState } from 'react';
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

import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from '@vis.gl/react-google-maps';


const GOOGLE_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

const GREEN = '#079A4B';
const BLACK = '#111820';
const GRAY = '#737C88';
const WHITE = '#FFFFFF';


type Coordinates = {
  lat: number;
  lng: number;
};


/*
|--------------------------------------------------------------------------
| DEFAULT LOCATION
|--------------------------------------------------------------------------
|
| Used only until the browser/device gives us the real location.
| Vijayawada is our temporary development center.
|
*/

const DEFAULT_LOCATION: Coordinates = {
  lat: 16.5062,
  lng: 80.6480,
};


/*
|--------------------------------------------------------------------------
| MAP CAMERA
|--------------------------------------------------------------------------
*/

function MapCamera({
  position,
}: {
  position: Coordinates;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) {
      return;
    }

    map.panTo(position);
  }, [
    map,
    position.lat,
    position.lng,
  ]);

  return null;
}


/*
|--------------------------------------------------------------------------
| MAP PICKER
|--------------------------------------------------------------------------
*/

export default function MapPicker() {

  const router = useRouter();

  const params =
    useLocalSearchParams<{
      type?: string;

      pickupName?: string;
      pickupAddress?: string;

      pickupLat?: string;
      pickupLng?: string;
    }>();


  const type =
    params.type === 'drop'
      ? 'drop'
      : 'pickup';


  const [position, setPosition] =
    useState<Coordinates>(
      DEFAULT_LOCATION,
    );


  const [address, setAddress] =
    useState(
      'Move the map to choose a location',
    );


  const [loading, setLoading] =
    useState(false);


  const [locationLoading, setLocationLoading] =
    useState(true);


  /*
  |--------------------------------------------------------------------------
  | GET ADDRESS FROM COORDINATES
  |--------------------------------------------------------------------------
  */

  const reverseGeocode = async (
    coordinates: Coordinates,
  ) => {

    if (!GOOGLE_API_KEY) {
      return;
    }

    try {

      setLoading(true);

      const response =
        await fetch(
          `https://geocode.googleapis.com/v4beta/geocode/location?location.latitude=${coordinates.lat}&location.longitude=${coordinates.lng}`,
          {
            headers: {
              'X-Goog-Api-Key':
                GOOGLE_API_KEY,
            },
          },
        );


      if (!response.ok) {
        throw new Error(
          'Geocoding failed',
        );
      }


      const data =
        await response.json();


      const formattedAddress =
        data.results?.[0]
          ?.formattedAddress;


      if (formattedAddress) {

        setAddress(
          formattedAddress,
        );

      } else {

        setAddress(
          'Selected location',
        );

      }

    } catch (error) {

      console.error(
        'Reverse geocoding error:',
        error,
      );

      setAddress(
        'Selected location',
      );

    } finally {

      setLoading(false);

    }

  };


  /*
  |--------------------------------------------------------------------------
  | GET CURRENT LOCATION
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (
      typeof navigator ===
      'undefined' ||
      !navigator.geolocation
    ) {

      setLocationLoading(false);

      return;

    }


    navigator.geolocation.getCurrentPosition(

      (currentPosition) => {

        const coordinates = {

          lat:
            currentPosition.coords.latitude,

          lng:
            currentPosition.coords.longitude,

        };


        setPosition(
          coordinates,
        );


        reverseGeocode(
          coordinates,
        );


        setLocationLoading(false);

      },

      (error) => {

        console.log(
          'GPS unavailable:',
          error.message,
        );

        /*
        |--------------------------------------------------------------------------
        | Keep Vijayawada as development fallback.
        |--------------------------------------------------------------------------
        */

        reverseGeocode(
          DEFAULT_LOCATION,
        );

        setLocationLoading(false);

      },

      {
        enableHighAccuracy: true,

        timeout: 10000,

        maximumAge: 30000,
      },
    );

  }, []);


  /*
  |--------------------------------------------------------------------------
  | CLICK MAP
  |--------------------------------------------------------------------------
  */

  const handleMapClick = (
    event: any,
  ) => {

    const latitude =
      event.detail.latLng?.lat;

    const longitude =
      event.detail.latLng?.lng;


    if (
      typeof latitude !==
        'number' ||
      typeof longitude !==
        'number'
    ) {

      return;

    }


    const coordinates = {

      lat: latitude,

      lng: longitude,

    };


    setPosition(
      coordinates,
    );


    reverseGeocode(
      coordinates,
    );

  };


  /*
  |--------------------------------------------------------------------------
  | CURRENT LOCATION BUTTON
  |--------------------------------------------------------------------------
  */

  const useCurrentLocation = () => {

    if (
      typeof navigator ===
        'undefined' ||
      !navigator.geolocation
    ) {

      return;

    }


    setLocationLoading(
      true,
    );


    navigator.geolocation.getCurrentPosition(

      (currentPosition) => {

        const coordinates = {

          lat:
            currentPosition.coords.latitude,

          lng:
            currentPosition.coords.longitude,

        };


        setPosition(
          coordinates,
        );


        reverseGeocode(
          coordinates,
        );


        setLocationLoading(
          false,
        );

      },

      () => {

        setLocationLoading(
          false,
        );

      },

      {
        enableHighAccuracy: true,

        timeout: 10000,

        maximumAge: 30000,
      },
    );

  };


  /*
  |--------------------------------------------------------------------------
  | CONFIRM LOCATION
  |--------------------------------------------------------------------------
  */

  const confirmLocation = () => {

    /*
    |--------------------------------------------------------------------------
    | PICKUP
    |--------------------------------------------------------------------------
    */

    if (
      type ===
      'pickup'
    ) {

      router.replace({

        pathname:
          '/location-picker' as any,

        params: {

          type:
            'drop',

          pickupName:
            'Selected pickup',

          pickupAddress:
            address,

          pickupLat:
            String(
              position.lat,
            ),

          pickupLng:
            String(
              position.lng,
            ),

        },

      });

      return;

    }


    /*
    |--------------------------------------------------------------------------
    | DESTINATION
    |--------------------------------------------------------------------------
    */

    router.replace({

      pathname:
        '/home' as any,

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
          'Selected destination',

        dropAddress:
          address,

        dropLat:
          String(
            position.lat,
          ),

        dropLng:
          String(
            position.lng,
          ),

      },

    });

  };


  /*
  |--------------------------------------------------------------------------
  | API KEY CHECK
  |--------------------------------------------------------------------------
  */

  if (!GOOGLE_API_KEY) {

    return (

      <SafeAreaView
        style={styles.safeArea}
      >

        <View
          style={styles.errorContainer}
        >

          <Ionicons
            name="warning-outline"
            size={40}
            color={GREEN}
          />

          <Text
            style={styles.errorTitle}
          >
            Google Maps API key missing
          </Text>

          <Text
            style={styles.errorText}
          >
            Check EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
            in your .env.local file.
          </Text>

        </View>

      </SafeAreaView>

    );

  }


  /*
  |--------------------------------------------------------------------------
  | MAIN UI
  |--------------------------------------------------------------------------
  */

  return (

    <SafeAreaView
      style={styles.safeArea}
    >

      <View
        style={styles.container}
      >

        {/* HEADER */}

        <View
          style={styles.header}
        >

          <Pressable
            style={styles.backButton}
            onPress={() =>
              router.back()
            }
          >

            <Ionicons
              name="arrow-back"
              size={25}
              color={BLACK}
            />

          </Pressable>


          <Text
            style={styles.headerTitle}
          >
            {type === 'pickup'
              ? 'Choose pickup'
              : 'Choose destination'}
          </Text>


          <View
            style={styles.headerSpacer}
          />

        </View>


        {/* MAP */}

        <View
          style={styles.mapContainer}
        >

          <APIProvider
            apiKey={
              GOOGLE_API_KEY
            }
          >

            <Map
              defaultZoom={15}

              defaultCenter={
                DEFAULT_LOCATION
              }

              gestureHandling="greedy"

              disableDefaultUI={true}

              clickableIcons={false}

              onClick={
                handleMapClick
              }

              mapId="RIDEX_MAP"
            >

              <MapCamera
                position={
                  position
                }
              />


              <AdvancedMarker
                position={
                  position
                }
              >

                <View
                  style={
                    styles.marker
                  }
                >

                  <Ionicons
                    name="location"
                    size={40}
                    color={GREEN}
                  />

                </View>

              </AdvancedMarker>

            </Map>

          </APIProvider>


          {/* SEARCH / INSTRUCTION */}

          <View
            style={
              styles.instruction
            }
          >

            <Text
              style={
                styles.instructionText
              }
            >
              Tap anywhere on the map
              to choose a location
            </Text>

          </View>


          {/* CURRENT LOCATION */}

          <Pressable
            style={
              styles.currentButton
            }
            onPress={
              useCurrentLocation
            }
          >

            {locationLoading ? (

              <ActivityIndicator
                size="small"
                color={GREEN}
              />

            ) : (

              <Ionicons
                name="locate"
                size={24}
                color={BLACK}
              />

            )}

          </Pressable>

        </View>


        {/* BOTTOM PANEL */}

        <View
          style={
            styles.bottomPanel
          }
        >

          <Text
            style={
              styles.panelTitle
            }
          >
            Confirm location
          </Text>


          <View
            style={
              styles.addressCard
            }
          >

            <View
              style={
                styles.addressIcon
              }
            >

              <Ionicons
                name="location"
                size={22}
                color={GREEN}
              />

            </View>


            <View
              style={
                styles.addressContent
              }
            >

              <Text
                style={
                  styles.addressTitle
                }
              >
                {loading
                  ? 'Finding address...'
                  : 'Selected location'}
              </Text>


              <Text
                style={
                  styles.addressText
                }
                numberOfLines={
                  2
                }
              >
                {address}
              </Text>

            </View>

          </View>


          <Pressable
            style={
              styles.confirmButton
            }
            onPress={
              confirmLocation
            }
          >

            <Text
              style={
                styles.confirmText
              }
            >
              Confirm this location
            </Text>


            <Ionicons
              name="arrow-forward"
              size={22}
              color={WHITE}
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

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },

  container: {
    flex: 1,
    backgroundColor: WHITE,
  },


  header: {
    height: 62,

    paddingHorizontal: 20,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  backButton: {
    width: 42,
    height: 42,

    alignItems: 'center',

    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,

    textAlign: 'center',

    fontSize: 19,

    fontWeight: '800',

    color: BLACK,
  },

  headerSpacer: {
    width: 42,
  },


  mapContainer: {
    flex: 1,

    position: 'relative',
  },


  instruction: {
    position: 'absolute',

    top: 16,

    left: 20,

    right: 20,

    alignItems: 'center',
  },

  instructionText: {
    backgroundColor:
      'rgba(255,255,255,0.96)',

    paddingHorizontal: 16,

    paddingVertical: 9,

    borderRadius: 20,

    fontSize: 12,

    fontWeight: '700',

    color: BLACK,
  },


  marker: {
    alignItems: 'center',

    justifyContent: 'center',
  },


  currentButton: {
    position: 'absolute',

    right: 18,

    bottom: 22,

    width: 52,

    height: 52,

    borderRadius: 16,

    backgroundColor: WHITE,

    alignItems: 'center',

    justifyContent: 'center',

    elevation: 6,
  },


  bottomPanel: {
    paddingHorizontal: 20,

    paddingTop: 18,

    paddingBottom: 18,

    backgroundColor: WHITE,

    borderTopLeftRadius: 24,

    borderTopRightRadius: 24,

    elevation: 12,
  },

  panelTitle: {
    fontSize: 19,

    fontWeight: '800',

    color: BLACK,
  },


  addressCard: {
    minHeight: 70,

    marginTop: 12,

    paddingHorizontal: 12,

    borderRadius: 15,

    backgroundColor: '#F4F7F6',

    flexDirection: 'row',

    alignItems: 'center',
  },

  addressIcon: {
    width: 43,

    height: 43,

    borderRadius: 22,

    backgroundColor: WHITE,

    alignItems: 'center',

    justifyContent: 'center',
  },

  addressContent: {
    flex: 1,

    marginLeft: 11,
  },

  addressTitle: {
    fontSize: 13,

    fontWeight: '800',

    color: BLACK,
  },

  addressText: {
    marginTop: 3,

    fontSize: 12,

    lineHeight: 17,

    color: GRAY,
  },


  confirmButton: {
    height: 56,

    marginTop: 12,

    borderRadius: 16,

    backgroundColor: GREEN,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  confirmText: {
    marginRight: 10,

    fontSize: 16,

    fontWeight: '800',

    color: WHITE,
  },


  errorContainer: {
    flex: 1,

    alignItems: 'center',

    justifyContent: 'center',

    padding: 30,
  },

  errorTitle: {
    marginTop: 15,

    fontSize: 19,

    fontWeight: '800',

    color: BLACK,

    textAlign: 'center',
  },

  errorText: {
    marginTop: 8,

    fontSize: 14,

    color: GRAY,

    textAlign: 'center',
  },

});