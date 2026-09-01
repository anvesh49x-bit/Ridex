import React, { useState } from 'react';

import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

const GREEN = '#079A4B';
const BLACK = '#111820';
const WHITE = '#FFFFFF';
const GRAY = '#737C88';

export default function MapPicker() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    type?: string;
    pickupName?: string;
    pickupAddress?: string;
  }>();

  const type =
    params.type === 'drop'
      ? 'drop'
      : 'pickup';

  const [selectedLocation, setSelectedLocation] =
    useState(
      type === 'pickup'
        ? 'MVR College'
        : 'Vijayawada Railway Station'
    );

  const confirmLocation = () => {
    if (type === 'pickup') {
      router.replace({
        pathname: '/location-picker' as any,
        params: {
          type: 'drop',
          pickupName: selectedLocation,
          pickupAddress: 'Selected on map',
          pickupLat: '16.5062',
          pickupLng: '80.6480',
        },
      });

      return;
    }

    router.replace({
      pathname: '/home' as any,
      params: {
        pickupName:
          params.pickupName ||
          'Current location',

        pickupAddress:
          params.pickupAddress ||
          '',

        dropName:
          selectedLocation,

        dropAddress:
          'Selected on map',

        dropLat: '16.5062',
        dropLng: '80.6480',
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* HEADER */}

        <View style={styles.header}>

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={25}
              color={BLACK}
            />
          </Pressable>

          <Text style={styles.headerTitle}>
            {type === 'pickup'
              ? 'Choose pickup'
              : 'Choose destination'}
          </Text>

          <View style={styles.headerSpacer} />

        </View>


        {/* MAP AREA */}

        <View style={styles.mapArea}>

          {/* Fake map background */}

          <View style={styles.mapGrid}>

            <View style={styles.horizontalRoadOne} />
            <View style={styles.horizontalRoadTwo} />
            <View style={styles.horizontalRoadThree} />

            <View style={styles.verticalRoadOne} />
            <View style={styles.verticalRoadTwo} />

            <View style={styles.parkOne} />
            <View style={styles.parkTwo} />

          </View>


          {/* MAP INSTRUCTION */}

          <View style={styles.mapInstruction}>

            <Text style={styles.mapInstructionText}>
              Move the map to choose a location
            </Text>

          </View>


          {/* CENTER PIN */}

          <View
            style={styles.centerPin}
            pointerEvents="none"
          >

            <Ionicons
              name="location"
              size={48}
              color={GREEN}
            />

          </View>


          {/* CURRENT LOCATION */}

          <Pressable
            style={styles.currentButton}
            onPress={() =>
              setSelectedLocation(
                'Current location'
              )
            }
          >

            <Ionicons
              name="locate"
              size={23}
              color={BLACK}
            />

          </Pressable>


          {/* PLACE OPTIONS */}

          <View style={styles.placeOptions}>

            <Pressable
              style={[
                styles.place,
                selectedLocation ===
                  'MVR College' &&
                  styles.placeSelected,
              ]}
              onPress={() =>
                setSelectedLocation(
                  'MVR College'
                )
              }
            >

              <Ionicons
                name="location-outline"
                size={20}
                color={GREEN}
              />

              <View style={styles.placeText}>

                <Text style={styles.placeTitle}>
                  MVR College
                </Text>

                <Text style={styles.placeAddress}>
                  Mangalagiri Road
                </Text>

              </View>

            </Pressable>


            <Pressable
              style={[
                styles.place,
                selectedLocation ===
                  'Vijayawada Railway Station' &&
                  styles.placeSelected,
              ]}
              onPress={() =>
                setSelectedLocation(
                  'Vijayawada Railway Station'
                )
              }
            >

              <Ionicons
                name="location-outline"
                size={20}
                color={GREEN}
              />

              <View style={styles.placeText}>

                <Text style={styles.placeTitle}>
                  Vijayawada Railway Station
                </Text>

                <Text style={styles.placeAddress}>
                  Railway Station Road
                </Text>

              </View>

            </Pressable>

          </View>

        </View>


        {/* BOTTOM PANEL */}

        <View style={styles.bottomPanel}>

          <Text style={styles.panelTitle}>
            Confirm location
          </Text>

          <Text style={styles.panelSubtitle}>
            {selectedLocation}
          </Text>

          <View style={styles.locationCard}>

            <View style={styles.locationIcon}>

              <Ionicons
                name="location"
                size={21}
                color={GREEN}
              />

            </View>

            <View style={styles.locationInfo}>

              <Text style={styles.locationName}>
                {selectedLocation}
              </Text>

              <Text style={styles.locationAddress}>
                Location selected on map
              </Text>

            </View>

            <Ionicons
              name="checkmark-circle"
              size={24}
              color={GREEN}
            />

          </View>


          <Pressable
            style={styles.confirmButton}
            onPress={confirmLocation}
          >

            <Text style={styles.confirmText}>
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


const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },

  container: {
    flex: 1,
    backgroundColor: WHITE,
  },


  /* HEADER */

  header: {
    height: 62,
    paddingHorizontal: 20,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    backgroundColor: WHITE,
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

  mapArea: {
    flex: 1,
    position: 'relative',

    overflow: 'hidden',

    backgroundColor: '#E8EFEB',
  },

 mapGrid: {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  backgroundColor: '#E8EFEB',
},

  horizontalRoadOne: {
    position: 'absolute',

    width: '120%',
    height: 34,

    left: '-10%',
    top: '28%',

    backgroundColor: WHITE,

    transform: [
      {
        rotate: '-12deg',
      },
    ],
  },

  horizontalRoadTwo: {
    position: 'absolute',

    width: '120%',
    height: 30,

    left: '-10%',
    top: '60%',

    backgroundColor: WHITE,

    transform: [
      {
        rotate: '18deg',
      },
    ],
  },

  horizontalRoadThree: {
    position: 'absolute',

    width: '110%',
    height: 24,

    left: '-5%',
    top: '82%',

    backgroundColor: WHITE,

    transform: [
      {
        rotate: '-8deg',
      },
    ],
  },

  verticalRoadOne: {
    position: 'absolute',

    width: 27,
    height: '120%',

    left: '30%',
    top: '-10%',

    backgroundColor: WHITE,

    transform: [
      {
        rotate: '24deg',
      },
    ],
  },

  verticalRoadTwo: {
    position: 'absolute',

    width: 22,
    height: '120%',

    right: '25%',
    top: '-10%',

    backgroundColor: WHITE,

    transform: [
      {
        rotate: '-28deg',
      },
    ],
  },

  parkOne: {
    position: 'absolute',

    width: 130,
    height: 90,

    left: '8%',
    top: '45%',

    borderRadius: 20,

    backgroundColor: '#D9E9DE',
  },

  parkTwo: {
    position: 'absolute',

    width: 110,
    height: 100,

    right: '8%',
    top: '18%',

    borderRadius: 20,

    backgroundColor: '#D9E9DE',
  },


  /* INSTRUCTION */

  mapInstruction: {
    position: 'absolute',

    top: 18,
    left: 20,
    right: 20,

    alignItems: 'center',
  },

  mapInstructionText: {
    backgroundColor:
      'rgba(255,255,255,0.95)',

    paddingHorizontal: 16,
    paddingVertical: 9,

    borderRadius: 20,

    fontSize: 12,
    fontWeight: '600',

    color: BLACK,
  },


  /* CENTER PIN */

  centerPin: {
    position: 'absolute',

    left: '50%',
    top: '50%',

    marginLeft: -24,
    marginTop: -48,
  },


  /* CURRENT LOCATION */

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


  /* PLACE OPTIONS */

  placeOptions: {
    position: 'absolute',

    left: 18,
    right: 18,
    bottom: 18,

    gap: 8,
  },

  place: {
    width: 250,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: WHITE,

    paddingHorizontal: 12,
    paddingVertical: 10,

    borderRadius: 14,

    elevation: 4,
  },

  placeSelected: {
    borderWidth: 1.5,
    borderColor: GREEN,
  },

  placeText: {
    marginLeft: 9,
    flex: 1,
  },

  placeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: BLACK,
  },

  placeAddress: {
    marginTop: 2,
    fontSize: 11,
    color: GRAY,
  },


  /* BOTTOM */

  bottomPanel: {
    backgroundColor: WHITE,

    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,

    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,

    elevation: 12,
  },

  panelTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: BLACK,
  },

  panelSubtitle: {
    marginTop: 4,

    fontSize: 13,
    color: GRAY,
  },


  /* LOCATION CARD */

  locationCard: {
    minHeight: 66,

    marginTop: 13,

    paddingHorizontal: 12,

    borderRadius: 14,

    backgroundColor: '#F4F7F6',

    flexDirection: 'row',
    alignItems: 'center',
  },

  locationIcon: {
    width: 42,
    height: 42,

    borderRadius: 21,

    backgroundColor: WHITE,

    alignItems: 'center',
    justifyContent: 'center',
  },

  locationInfo: {
    flex: 1,
    marginLeft: 10,
  },

  locationName: {
    fontSize: 14,
    fontWeight: '800',
    color: BLACK,
  },

  locationAddress: {
    marginTop: 3,
    fontSize: 11,
    color: GRAY,
  },


  /* CONFIRM */

  confirmButton: {
    height: 55,

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

});