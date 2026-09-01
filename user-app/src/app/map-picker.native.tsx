import React, { useState } from 'react';

import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import MapView, {
  Marker,
  Region,
} from 'react-native-maps';

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

type LocationType = 'pickup' | 'drop';


/*
|--------------------------------------------------------------------------
| COLORS
|--------------------------------------------------------------------------
*/

const GREEN = '#079A4B';

const BLACK = '#111820';

const WHITE = '#FFFFFF';

const GRAY = '#737C88';


/*
|--------------------------------------------------------------------------
| MAP PICKER
|--------------------------------------------------------------------------
*/

export default function MapPicker() {

  const router = useRouter();


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


  const type: LocationType =
    params.type === 'drop'
      ? 'drop'
      : 'pickup';


  /*
  |--------------------------------------------------------------------------
  | DEFAULT MAP POSITION
  |--------------------------------------------------------------------------
  |
  | Temporary default around Vijayawada region.
  |
  | Real current GPS will replace this later.
  |
  */

  const [region, setRegion] =
    useState<Region>({
      latitude: 16.5062,
      longitude: 80.6480,

      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    });


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

    if (type === 'pickup') {

      router.replace({

        pathname:
          '/location-picker',

        params: {

          type: 'drop',

          pickupName:
            'Selected pickup',

          pickupAddress:
            'Location selected on map',

          pickupLat:
            String(
              region.latitude,
            ),

          pickupLng:
            String(
              region.longitude,
            ),

        },

      });

      return;
    }


    /*
    |--------------------------------------------------------------------------
    | DROP
    |--------------------------------------------------------------------------
    */

    router.replace({

      pathname: '/home',

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
          'Selected location',

        dropAddress:
          'Location selected on map',

        dropLat:
          String(
            region.latitude,
          ),

        dropLng:
          String(
            region.longitude,
          ),

      },

    });

  };


  /*
  |--------------------------------------------------------------------------
  | HEADER TITLE
  |--------------------------------------------------------------------------
  */

  const title =
    type === 'pickup'
      ? 'Choose pickup on map'
      : 'Choose destination on map';


  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (

    <SafeAreaView
      style={styles.safeArea}
    >

      <View
        style={styles.container}
      >


        {/* ================================================================
            HEADER
        ================================================================= */}

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
            {title}
          </Text>


          <View
            style={styles.headerSpacer}
          />

        </View>


        {/* ================================================================
            MAP
        ================================================================= */}

        <View
          style={styles.mapContainer}
        >

          <MapView
            style={styles.map}
            initialRegion={region}
            onRegionChangeComplete={
              setRegion
            }
            showsUserLocation
            showsMyLocationButton={false}
          />


          {/* ============================================================
              CENTER PIN
          ============================================================= */}

          <View
            style={styles.centerPin}
            pointerEvents="none"
          >

            <View
              style={styles.pinHead}
            >

              <Ionicons
                name="location"
                size={39}
                color={GREEN}
              />

            </View>

          </View>


          {/* ============================================================
              CENTER LABEL
          ============================================================= */}

          <View
            style={styles.centerLabel}
            pointerEvents="none"
          >

            <Text
              style={styles.centerLabelText}
            >
              Move the map to set location
            </Text>

          </View>


          {/* ============================================================
              CURRENT LOCATION
          ============================================================= */}

          <Pressable
            style={styles.locateButton}
            onPress={() => {

              /*
               * Real GPS centering will be connected
               * once expo-location is wired in.
               */

            }}
          >

            <Ionicons
              name="locate-outline"
              size={25}
              color={BLACK}
            />

          </Pressable>

        </View>


        {/* ================================================================
            BOTTOM LOCATION PANEL
        ================================================================= */}

        <View
          style={styles.bottomPanel}
        >

          <View
            style={styles.dragHandle}
          />


          <Text
            style={styles.panelTitle}
          >
            Set exact location
          </Text>


          <Text
            style={styles.panelSubtitle}
          >
            Move the map until the pin is
            exactly where you want to be picked
            up.
          </Text>


          {/* Selected coordinates */}

          <View
            style={styles.locationPreview}
          >

            <View
              style={styles.previewIcon}
            >

              <Ionicons
                name="location"
                size={21}
                color={GREEN}
              />

            </View>


            <View
              style={styles.previewText}
            >

              <Text
                style={styles.previewTitle}
              >
                Map location
              </Text>


              <Text
                style={styles.previewAddress}
                numberOfLines={1}
              >
                {region.latitude.toFixed(5)},
                {' '}
                {region.longitude.toFixed(5)}
              </Text>

            </View>

          </View>


          {/* Confirm */}

          <Pressable
            style={styles.confirmButton}
            onPress={
              confirmLocation
            }
          >

            <Text
              style={styles.confirmText}
            >
              Confirm this location
            </Text>


            <Ionicons
              name="checkmark"
              size={23}
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

    backgroundColor:
      WHITE,
  },

  container: {
    flex: 1,

    backgroundColor:
      WHITE,
  },


  /* HEADER */

  header: {
    height: 62,

    paddingHorizontal: 20,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent:
      'space-between',

    backgroundColor:
      WHITE,
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


  /* MAP */

  mapContainer: {
    flex: 1,

    position: 'relative',
  },

  map: {
    flex: 1,
  },


  /* CENTER PIN */

  centerPin: {
    position: 'absolute',

    left: '50%',

    top: '50%',

    marginLeft: -20,

    marginTop: -39,

    width: 40,

    height: 50,

    alignItems: 'center',

    justifyContent: 'center',
  },

  pinHead: {
    alignItems: 'center',

    justifyContent: 'center',
  },


  /* LABEL */

  centerLabel: {
    position: 'absolute',

    top: 20,

    left: 25,

    right: 25,

    alignItems: 'center',
  },

  centerLabelText: {
    backgroundColor:
      'rgba(255,255,255,0.94)',

    paddingHorizontal: 14,

    paddingVertical: 8,

    borderRadius: 20,

    overflow: 'hidden',

    fontSize: 12,

    fontWeight: '600',

    color: BLACK,
  },


  /* LOCATE */

  locateButton: {
    position: 'absolute',

    right: 18,

    bottom: 18,

    width: 50,

    height: 50,

    borderRadius: 15,

    backgroundColor:
      WHITE,

    alignItems: 'center',

    justifyContent: 'center',

    elevation: 6,

    shadowColor: '#000',

    shadowOpacity: 0.15,

    shadowRadius: 8,

    shadowOffset: {
      width: 0,
      height: 3,
    },
  },


  /* BOTTOM PANEL */

  bottomPanel: {
    backgroundColor:
      WHITE,

    paddingHorizontal: 20,

    paddingTop: 9,

    paddingBottom: 18,

    borderTopLeftRadius: 25,

    borderTopRightRadius: 25,

    elevation: 12,

    shadowColor: '#000',

    shadowOpacity: 0.12,

    shadowRadius: 14,

    shadowOffset: {
      width: 0,
      height: -4,
    },
  },

  dragHandle: {
    alignSelf: 'center',

    width: 42,

    height: 4,

    borderRadius: 2,

    backgroundColor: '#D8DDE1',

    marginBottom: 14,
  },

  panelTitle: {
    fontSize: 19,

    fontWeight: '800',

    color: BLACK,
  },

  panelSubtitle: {
    marginTop: 5,

    fontSize: 13,

    lineHeight: 19,

    color: GRAY,
  },


  /* LOCATION PREVIEW */

  locationPreview: {
    marginTop: 15,

    minHeight: 60,

    borderRadius: 14,

    backgroundColor:
      '#F4F7F6',

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 12,
  },

  previewIcon: {
    width: 40,

    height: 40,

    borderRadius: 20,

    backgroundColor:
      WHITE,

    alignItems: 'center',

    justifyContent: 'center',
  },

  previewText: {
    flex: 1,

    marginLeft: 10,
  },

  previewTitle: {
    fontSize: 14,

    fontWeight: '700',

    color: BLACK,
  },

  previewAddress: {
    marginTop: 2,

    fontSize: 11,

    color: GRAY,
  },


  /* CONFIRM */

  confirmButton: {
    height: 55,

    marginTop: 12,

    borderRadius: 16,

    backgroundColor:
      GREEN,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',
  },

  confirmText: {
    color: WHITE,

    fontSize: 16,

    fontWeight: '800',

    marginRight: 10,
  },

});