import React, { useCallback } from 'react';

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


/*
|--------------------------------------------------------------------------
| RIDEX HOME PAGE
|--------------------------------------------------------------------------
|
| Main purpose of this screen:
|
| 1. Tell the user immediately what to do.
| 2. Let them choose pickup location.
| 3. Let them choose destination.
| 4. Show selected locations.
| 5. Eventually start the ride-booking flow.
|
| IMPORTANT:
| This page currently uses a visual/mock map.
| Real GPS + Google Maps/Mapbox + Places API will be connected later.
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| COLORS
|--------------------------------------------------------------------------
*/

const COLORS = {
  green: '#079A4B',
  greenLight: '#EAF8F1',

  red: '#EF3154',
  blue: '#1685E8',

  black: '#111820',
  gray: '#737C88',
  lightGray: '#A0A6AD',

  border: '#E7EAED',

  white: '#FFFFFF',

  mapBackground: '#EEF3F2',
  mapRoad: '#D8E0E1',
  mapRoadWhite: '#FFFFFF',
};


/*
|--------------------------------------------------------------------------
| HOME SCREEN
|--------------------------------------------------------------------------
*/

export default function HomeScreen() {

  /*
  |--------------------------------------------------------------------------
  | ROUTER
  |--------------------------------------------------------------------------
  */

  const router = useRouter();


  /*
  |--------------------------------------------------------------------------
  | LOCATION PARAMETERS
  |--------------------------------------------------------------------------
  |
  | The location-picker screen will eventually send the selected locations
  | back here through Expo Router parameters.
  |
  */

  const params = useLocalSearchParams<{
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
  | PICKUP LOCATION
  |--------------------------------------------------------------------------
  |
  | Opens the location selection flow in PICKUP mode.
  |
  */
const openPickupLocation = useCallback(() => {
  router.push({
    pathname: '/location-picker',
    params: {
      type: 'pickup',
    },
  });
}, [router]);
  

  /*
  |--------------------------------------------------------------------------
  | DESTINATION LOCATION
  |--------------------------------------------------------------------------
  |
  | Opens the location selection flow in DROP mode.
  |
  | If pickup was already selected, we pass it along so the picker
  | doesn't lose the user's previous selection.
  |
  */

  const openDestinationLocation = useCallback(() => {

    router.push({
      pathname: '/location-picker',

      params: {
        type: 'drop',

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
  | NOTIFICATIONS
  |--------------------------------------------------------------------------
  |
  | Placeholder for future notification screen.
  |
  */

  const handleNotifications = useCallback(() => {

    // TODO:
    // Navigate to notifications screen later.

  }, []);


  /*
  |--------------------------------------------------------------------------
  | MENU
  |--------------------------------------------------------------------------
  |
  | Placeholder for future side menu.
  |
  */

  const handleMenu = useCallback(() => {

    // TODO:
    // Open side menu later.

  }, []);


  /*
  |--------------------------------------------------------------------------
  | CURRENT LOCATION BUTTON
  |--------------------------------------------------------------------------
  |
  | Real GPS functionality will be connected later.
  |
  */

  const handleLocate = useCallback(() => {

    // TODO:
    // Connect expo-location / map provider here.

  }, []);


  /*
  |--------------------------------------------------------------------------
  | MANAGE QUICK PLACES
  |--------------------------------------------------------------------------
  */

  const handleManagePlaces = useCallback(() => {

    // TODO:
    // Navigate to saved places screen.

  }, []);


  /*
  |--------------------------------------------------------------------------
  | QUICK PLACE
  |--------------------------------------------------------------------------
  |
  | Home / Work / Recent.
  |
  */

  const handleQuickPlace = useCallback(
    (type: 'home' | 'work' | 'recent') => {

      if (type === 'home') {

        // Home address will eventually be stored.
        openDestinationLocation();

        return;
      }


      if (type === 'work') {

        // Work address will eventually be stored.
        openDestinationLocation();

        return;
      }


      if (type === 'recent') {

        // TODO:
        // Open recent locations.

        return;
      }

    },
    [openDestinationLocation],
  );


  /*
  |--------------------------------------------------------------------------
  | BOOK RIDE
  |--------------------------------------------------------------------------
  |
  | We don't start the actual booking yet.
  |
  | Once pickup + destination are selected, this will become:
  |
  | Home
  |   ↓
  | Fare / vehicle selection
  |   ↓
  | Offer price
  |   ↓
  | Find rider
  |
  */

  const handleBookRide = useCallback(() => {

    /*
     * Don't allow booking until destination exists.
     */

    if (!params.dropName) {

      openDestinationLocation();

      return;
    }


    /*
     * TODO:
     * Navigate to ride selection / pricing screen.
     */

  }, [
    params.dropName,
    openDestinationLocation,
  ]);


  /*
  |--------------------------------------------------------------------------
  | BOTTOM NAVIGATION
  |--------------------------------------------------------------------------
  */

  const handleBottomNavigation = useCallback(
    (screen: string) => {

      switch (screen) {

        case 'home':

          // Already on Home.
          break;


        case 'rides':

          // TODO:
          // router.push('/rides');

          break;


        case 'payments':

          // TODO:
          // router.push('/payments');

          break;


        case 'profile':

          // TODO:
          // router.push('/profile');

          break;

      }

    },
    [],
  );


  /*
  |--------------------------------------------------------------------------
  | DISPLAY VALUES
  |--------------------------------------------------------------------------
  */

  const pickupDisplay =
    params.pickupName ||
    'Current location';


  const destinationDisplay =
    params.dropName ||
    'Enter your destination';


  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (

    <SafeAreaView style={styles.safeArea}>

      <View style={styles.screen}>


        {/* ================================================================
            HEADER
        ================================================================= */}

        <View style={styles.header}>

          <View style={styles.headerTextContainer}>

            <Text style={styles.greeting}>
              Good morning 👋
            </Text>

            <Text style={styles.headerSubtitle}>
              Where are you going today?
            </Text>

          </View>


          {/* HEADER ACTIONS */}

          <View style={styles.headerActions}>

            {/* Notifications */}

            <Pressable
              style={styles.headerButton}
              onPress={handleNotifications}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >

              <Ionicons
                name="notifications-outline"
                size={27}
                color={COLORS.black}
              />


              {/* Notification dot */}

              <View style={styles.notificationDot} />

            </Pressable>


            {/* Menu */}

            <Pressable
              style={styles.headerButton}
              onPress={handleMenu}
              accessibilityRole="button"
              accessibilityLabel="Menu"
            >

              <Ionicons
                name="menu-outline"
                size={31}
                color={COLORS.black}
              />

            </Pressable>

          </View>

        </View>


        {/* ================================================================
            PICKUP + DESTINATION CARD
        ================================================================= */}

        <View style={styles.bookingCard}>


          {/* --------------------------------------------------------------
              PICKUP
          -------------------------------------------------------------- */}

          <Pressable
            style={styles.locationRow}
            onPress={openPickupLocation}
            accessibilityRole="button"
            accessibilityLabel="Choose pickup location"
          >

            {/* Green pickup marker */}

            <View
              style={[
                styles.locationMarker,
                styles.pickupMarker,
              ]}
            >

              <View style={styles.markerCenter} />

            </View>


            {/* Pickup text */}

            <View style={styles.locationContent}>

              <Text style={styles.pickupLabel}>
                Pickup location
              </Text>

              <Text
                style={styles.locationValue}
                numberOfLines={1}
              >
                {pickupDisplay}
              </Text>

            </View>


            {/* Arrow */}

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#8A919B"
            />

          </Pressable>


          {/* --------------------------------------------------------------
              DIVIDER
          -------------------------------------------------------------- */}

          <View style={styles.locationDivider} />


          {/* --------------------------------------------------------------
              DESTINATION
          -------------------------------------------------------------- */}

          <Pressable
            style={styles.locationRow}
            onPress={openDestinationLocation}
            accessibilityRole="button"
            accessibilityLabel="Choose destination"
          >

            {/* Red destination marker */}

            <View
              style={[
                styles.locationMarker,
                styles.dropMarker,
              ]}
            >

              <View style={styles.markerCenter} />

            </View>


            {/* Destination text */}

            <View style={styles.locationContent}>

              <Text style={styles.dropLabel}>
                Where are you going?
              </Text>

              <Text
                style={[
                  styles.destinationText,
                  params.dropName &&
                    styles.destinationSelected,
                ]}
                numberOfLines={1}
              >
                {destinationDisplay}
              </Text>

            </View>


            {/* Search button */}

            <View style={styles.searchButton}>

              <Ionicons
                name="search"
                size={21}
                color={COLORS.white}
              />

            </View>

          </Pressable>

        </View>


        {/* ================================================================
            MAP
        ================================================================= */}

        <View style={styles.map}>


          {/* Decorative roads */}

          <View style={styles.mapRoadOne} />

          <View style={styles.mapRoadTwo} />

          <View style={styles.mapRoadThree} />

          <View style={styles.mapRoadFour} />


          {/* Map label */}

          <Text style={styles.mapLabel}>
            Your location
          </Text>


          {/* Current location indicator */}

          <View style={styles.currentLocation}>

            <View style={styles.locationPulse}>

              <View style={styles.locationBlueDot} />

            </View>

          </View>


          {/* Locate button */}

          <Pressable
            style={styles.locateButton}
            onPress={handleLocate}
            accessibilityRole="button"
            accessibilityLabel="Use current location"
          >

            <Ionicons
              name="locate-outline"
              size={25}
              color={COLORS.black}
            />

          </Pressable>

        </View>


        {/* ================================================================
            QUICK PLACES HEADER
        ================================================================= */}

        <View style={styles.sectionHeader}>

          <Text style={styles.sectionTitle}>
            Quick places
          </Text>


          <Pressable
            onPress={handleManagePlaces}
            accessibilityRole="button"
          >

            <Text style={styles.manageText}>
              Manage
            </Text>

          </Pressable>

        </View>


        {/* ================================================================
            QUICK PLACES
        ================================================================= */}

        <View style={styles.quickPlacesRow}>


          {/* HOME */}

          <QuickPlace
            icon="home-outline"
            title="Home"
            subtitle="Add address"
            onPress={() => handleQuickPlace('home')}
          />


          {/* WORK */}

          <QuickPlace
            icon="briefcase-outline"
            title="Work"
            subtitle="Add address"
            onPress={() => handleQuickPlace('work')}
          />


          {/* RECENT */}

          <QuickPlace
            icon="time-outline"
            title="Recent"
            subtitle="View places"
            onPress={() => handleQuickPlace('recent')}
          />

        </View>


        {/* ================================================================
            PRICE / BOOKING CARD
        ================================================================= */}

        <Pressable
          style={styles.priceCard}
          onPress={handleBookRide}
          accessibilityRole="button"
          accessibilityLabel="Start booking a ride"
        >


          {/* Icon */}

          <View style={styles.priceIcon}>

            <Ionicons
              name="pricetag-outline"
              size={25}
              color={COLORS.green}
            />

          </View>


          {/* Text */}

          <View style={styles.priceContent}>

            <Text style={styles.priceTitle}>
              You set the price.
            </Text>

            <Text style={styles.priceSubtitle}>
              Choose a ride that works for you.
            </Text>

          </View>


          {/* Arrow */}

          <View style={styles.priceArrow}>

            <Ionicons
              name="arrow-forward"
              size={21}
              color={COLORS.white}
            />

          </View>

        </Pressable>


        {/* ================================================================
            BOTTOM NAVIGATION
        ================================================================= */}

        <View style={styles.bottomNav}>


          {/* HOME */}

          <BottomItem
            icon="home"
            label="Home"
            active
            onPress={() =>
              handleBottomNavigation('home')
            }
          />


          {/* RIDES */}

          <BottomItem
            icon="time-outline"
            label="Rides"
            onPress={() =>
              handleBottomNavigation('rides')
            }
          />


          {/* BOOK RIDE CENTER BUTTON */}

          <View style={styles.bookContainer}>

            <Pressable
              style={styles.bookButton}
              onPress={handleBookRide}
              accessibilityRole="button"
              accessibilityLabel="Book ride"
            >

              <Ionicons
                name="bicycle"
                size={29}
                color={COLORS.white}
              />

            </Pressable>


            <Text style={styles.bookLabel}>
              Book Ride
            </Text>

          </View>


          {/* PAYMENTS */}

          <BottomItem
            icon="wallet-outline"
            label="Payments"
            onPress={() =>
              handleBottomNavigation('payments')
            }
          />


          {/* PROFILE */}

          <BottomItem
            icon="person-outline"
            label="Profile"
            onPress={() =>
              handleBottomNavigation('profile')
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
      style={styles.quickPlace}
      onPress={onPress}
      accessibilityRole="button"
    >

      {/* Icon */}

      <View style={styles.quickIcon}>

        <Ionicons
          name={icon}
          size={21}
          color={COLORS.green}
        />

      </View>


      {/* Text */}

      <View style={styles.quickText}>

        <Text style={styles.quickTitle}>
          {title}
        </Text>

        <Text style={styles.quickSubtitle}>
          {subtitle}
        </Text>

      </View>

    </Pressable>

  );
}


/*
|--------------------------------------------------------------------------
| BOTTOM NAVIGATION ITEM
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
      style={styles.bottomItem}
      onPress={onPress}
      accessibilityRole="button"
    >

      <Ionicons
        name={icon}
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


      {/* Active underline */}

      {active && (

        <View style={styles.bottomIndicator} />

      )}

    </Pressable>

  );
}


/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({

  /*
  |--------------------------------------------------------------------------
  | SCREEN
  |--------------------------------------------------------------------------
  */

  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
  },


  /*
  |--------------------------------------------------------------------------
  | HEADER
  |--------------------------------------------------------------------------
  */

  header: {
    height: 68,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',
  },

  headerTextContainer: {
    flex: 1,
  },

  greeting: {
    fontSize: 23,

    fontWeight: '800',

    color: COLORS.black,

    letterSpacing: -0.4,
  },

  headerSubtitle: {
    marginTop: 3,

    fontSize: 14,

    color: COLORS.gray,
  },

  headerActions: {
    flexDirection: 'row',

    alignItems: 'center',
  },

  headerButton: {
    width: 42,

    height: 42,

    alignItems: 'center',

    justifyContent: 'center',

    marginLeft: 5,
  },

  notificationDot: {
    position: 'absolute',

    top: 5,

    right: 6,

    width: 9,

    height: 9,

    borderRadius: 5,

    backgroundColor: COLORS.green,

    borderWidth: 1.5,

    borderColor: COLORS.white,
  },


  /*
  |--------------------------------------------------------------------------
  | BOOKING CARD
  |--------------------------------------------------------------------------
  */

  bookingCard: {
    backgroundColor: COLORS.white,

    borderRadius: 20,

    paddingHorizontal: 17,

    paddingVertical: 14,

    shadowColor: '#000',

    shadowOpacity: 0.09,

    shadowRadius: 16,

    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 5,

    zIndex: 10,
  },

  locationRow: {
    minHeight: 49,

    flexDirection: 'row',

    alignItems: 'center',
  },

  locationMarker: {
    width: 27,

    height: 27,

    borderRadius: 14,

    alignItems: 'center',

    justifyContent: 'center',
  },

  pickupMarker: {
    backgroundColor: COLORS.green,
  },

  dropMarker: {
    backgroundColor: COLORS.red,
  },

  markerCenter: {
    width: 8,

    height: 8,

    borderRadius: 4,

    backgroundColor: COLORS.white,
  },

  locationContent: {
    flex: 1,

    marginLeft: 15,

    marginRight: 10,
  },

  pickupLabel: {
    fontSize: 13,

    color: COLORS.green,

    fontWeight: '600',
  },

  locationValue: {
    marginTop: 2,

    fontSize: 16,

    color: COLORS.black,

    fontWeight: '700',
  },

  dropLabel: {
    fontSize: 13,

    color: '#747B84',
  },

  destinationText: {
    marginTop: 2,

    fontSize: 16,

    color: '#606871',

    fontWeight: '600',
  },

  destinationSelected: {
    color: COLORS.black,

    fontWeight: '700',
  },

  locationDivider: {
    height: 1,

    backgroundColor: COLORS.border,

    marginLeft: 42,

    marginVertical: 8,
  },

  searchButton: {
    width: 44,

    height: 44,

    borderRadius: 14,

    backgroundColor: COLORS.green,

    alignItems: 'center',

    justifyContent: 'center',
  },


  /*
  |--------------------------------------------------------------------------
  | MAP
  |--------------------------------------------------------------------------
  */

  map: {
    height: 235,

    marginHorizontal: -20,

    marginTop: -2,

    backgroundColor: COLORS.mapBackground,

    overflow: 'hidden',

    position: 'relative',
  },

  mapRoadOne: {
    position: 'absolute',

    width: 520,

    height: 45,

    backgroundColor: COLORS.mapRoadWhite,

    transform: [
      {
        rotate: '-24deg',
      },
    ],

    left: -130,

    top: 55,
  },

  mapRoadTwo: {
    position: 'absolute',

    width: 550,

    height: 28,

    backgroundColor: COLORS.mapRoad,

    transform: [
      {
        rotate: '25deg',
      },
    ],

    left: -90,

    top: 125,
  },

  mapRoadThree: {
    position: 'absolute',

    width: 500,

    height: 25,

    backgroundColor: COLORS.mapRoadWhite,

    transform: [
      {
        rotate: '43deg',
      },
    ],

    right: -150,

    top: 40,
  },

  mapRoadFour: {
    position: 'absolute',

    width: 450,

    height: 18,

    backgroundColor: COLORS.mapRoad,

    transform: [
      {
        rotate: '-12deg',
      },
    ],

    right: -100,

    bottom: 45,
  },

  mapLabel: {
    position: 'absolute',

    left: 25,

    top: 25,

    fontSize: 13,

    color: '#687681',

    fontWeight: '500',
  },

  currentLocation: {
    position: 'absolute',

    left: '50%',

    top: '52%',

    marginLeft: -27,

    marginTop: -27,
  },

  locationPulse: {
    width: 54,

    height: 54,

    borderRadius: 27,

    backgroundColor: 'rgba(20,130,230,0.13)',

    alignItems: 'center',

    justifyContent: 'center',
  },

  locationBlueDot: {
    width: 19,

    height: 19,

    borderRadius: 10,

    backgroundColor: COLORS.blue,

    borderWidth: 3,

    borderColor: COLORS.white,
  },

  locateButton: {
    position: 'absolute',

    left: 20,

    bottom: 15,

    width: 48,

    height: 48,

    borderRadius: 14,

    backgroundColor: COLORS.white,

    alignItems: 'center',

    justifyContent: 'center',

    shadowColor: '#000',

    shadowOpacity: 0.1,

    shadowRadius: 8,

    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 4,
  },


  /*
  |--------------------------------------------------------------------------
  | QUICK PLACES
  |--------------------------------------------------------------------------
  */

  sectionHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginTop: 13,

    marginBottom: 9,
  },

  sectionTitle: {
    fontSize: 18,

    fontWeight: '800',

    color: COLORS.black,
  },

  manageText: {
    fontSize: 13,

    fontWeight: '700',

    color: COLORS.green,
  },

  quickPlacesRow: {
    flexDirection: 'row',

    gap: 9,
  },

  quickPlace: {
    flex: 1,

    height: 58,

    borderRadius: 15,

    borderWidth: 1,

    borderColor: COLORS.border,

    backgroundColor: COLORS.white,

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 9,
  },

  quickIcon: {
    width: 36,

    height: 36,

    borderRadius: 18,

    backgroundColor: COLORS.greenLight,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 7,
  },

  quickText: {
    flex: 1,
  },

  quickTitle: {
    fontSize: 13,

    fontWeight: '700',

    color: COLORS.black,
  },

  quickSubtitle: {
    marginTop: 1,

    fontSize: 10,

    color: '#858C95',
  },


  /*
  |--------------------------------------------------------------------------
  | PRICE CARD
  |--------------------------------------------------------------------------
  */

  priceCard: {
    height: 82,

    marginTop: 13,

    borderRadius: 18,

    backgroundColor: COLORS.greenLight,

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 13,
  },

  priceIcon: {
    width: 50,

    height: 50,

    borderRadius: 25,

    backgroundColor: COLORS.white,

    alignItems: 'center',

    justifyContent: 'center',
  },

  priceContent: {
    flex: 1,

    marginLeft: 12,
  },

  priceTitle: {
    fontSize: 15,

    fontWeight: '800',

    color: COLORS.black,
  },

  priceSubtitle: {
    marginTop: 3,

    fontSize: 11.5,

    color: '#687681',
  },

  priceArrow: {
    width: 42,

    height: 42,

    borderRadius: 21,

    backgroundColor: COLORS.green,

    alignItems: 'center',

    justifyContent: 'center',
  },


  /*
  |--------------------------------------------------------------------------
  | BOTTOM NAVIGATION
  |--------------------------------------------------------------------------
  */

  bottomNav: {
    position: 'absolute',

    left: 0,

    right: 0,

    bottom: 7,

    height: 72,

    backgroundColor: COLORS.white,

    borderRadius: 21,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-around',

    shadowColor: '#000',

    shadowOpacity: 0.09,

    shadowRadius: 14,

    shadowOffset: {
      width: 0,
      height: -3,
    },

    elevation: 8,
  },

  bottomItem: {
    width: 62,

    height: 62,

    alignItems: 'center',

    justifyContent: 'center',

    position: 'relative',
  },

  bottomLabel: {
    marginTop: 3,

    fontSize: 10.5,

    color: '#777D84',
  },

  bottomLabelActive: {
    color: COLORS.green,

    fontWeight: '700',
  },

  bottomIndicator: {
    position: 'absolute',

    bottom: 1,

    width: 24,

    height: 3,

    borderRadius: 2,

    backgroundColor: COLORS.green,
  },

  bookContainer: {
    width: 78,

    alignItems: 'center',

    marginTop: -28,
  },

  bookButton: {
    width: 60,

    height: 60,

    borderRadius: 30,

    backgroundColor: COLORS.green,

    borderWidth: 4,

    borderColor: COLORS.white,

    alignItems: 'center',

    justifyContent: 'center',

    shadowColor: COLORS.green,

    shadowOpacity: 0.25,

    shadowRadius: 8,

    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 7,
  },

  bookLabel: {
    marginTop: 2,

    fontSize: 10.5,

    color: COLORS.black,

    fontWeight: '600',
  },

});