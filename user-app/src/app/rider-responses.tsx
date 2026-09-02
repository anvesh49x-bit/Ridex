import React, { useMemo, useState } from 'react';

import {
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


/* =========================================================================
   RIDEX COLORS START
   ========================================================================= */

const COLORS = {
  green: '#079A4B',
  greenDark: '#05833F',
  greenSoft: '#EAF8F1',
  greenVerySoft: '#F3FAF6',

  red: '#EF3154',

  blue: '#2D73C8',
  blueSoft: '#EEF5FF',

  yellowSoft: '#FFF7D8',

  black: '#111820',
  gray: '#737C88',
  muted: '#9AA1AA',

  border: '#E5E8EB',
  white: '#FFFFFF',

  background: '#FAFBFA',

  orange: '#E49A00',
  orangeSoft: '#FFF7E5',
};

/* =========================================================================
   RIDEX COLORS END
   ========================================================================= */


/* =========================================================================
   RIDEX TYPES START
   ========================================================================= */

type VehicleType =
  | 'bike'
  | 'auto';

type SortMode =
  | 'all'
  | 'price'
  | 'nearest';

type Rider = {

  id: string;

  name: string;

  initials: string;

  rating: number;

  trips: number;

  distanceKm: number;

  vehicleType: VehicleType;

  vehicleName: string;

  hasHelmet: boolean;

  offer: number;

  responseSeconds: number;

  available: boolean;
};

/* =========================================================================
   RIDEX TYPES END
   ========================================================================= */


/* =========================================================================
   RIDEX MOCK RIDERS START
   ========================================================================= */

/*
  MVP rider pool.

  This is intentionally local for now.

  Later:
  Replace this array with riders returned from the backend.
*/

const MOCK_RIDERS: Rider[] = [

  {
    id: 'rider-001',
    name: 'Ramesh B.',
    initials: 'RB',
    rating: 4.8,
    trips: 320,
    distanceKm: 1.2,
    vehicleType: 'bike',
    vehicleName: 'Hero Splendor',
    hasHelmet: true,
    offer: 65,
    responseSeconds: 15,
    available: true,
  },

  {
    id: 'rider-002',
    name: 'Suresh K.',
    initials: 'SK',
    rating: 4.6,
    trips: 180,
    distanceKm: 1.8,
    vehicleType: 'bike',
    vehicleName: 'TVS Victor',
    hasHelmet: true,
    offer: 72,
    responseSeconds: 28,
    available: true,
  },

  {
    id: 'rider-003',
    name: 'Praveen M.',
    initials: 'PM',
    rating: 4.7,
    trips: 210,
    distanceKm: 2.3,
    vehicleType: 'bike',
    vehicleName: 'Honda Shine',
    hasHelmet: true,
    offer: 75,
    responseSeconds: 45,
    available: true,
  },

  {
    id: 'rider-004',
    name: 'Rajesh P.',
    initials: 'RP',
    rating: 4.5,
    trips: 145,
    distanceKm: 2.9,
    vehicleType: 'bike',
    vehicleName: 'Bajaj Platina',
    hasHelmet: true,
    offer: 70,
    responseSeconds: 61,
    available: true,
  },

  {
    id: 'rider-005',
    name: 'Kiran S.',
    initials: 'KS',
    rating: 4.4,
    trips: 98,
    distanceKm: 3.7,
    vehicleType: 'bike',
    vehicleName: 'Honda Livo',
    hasHelmet: true,
    offer: 78,
    responseSeconds: 84,
    available: true,
  },

  {
    id: 'rider-006',
    name: 'Mahesh R.',
    initials: 'MR',
    rating: 4.3,
    trips: 76,
    distanceKm: 4.2,
    vehicleType: 'bike',
    vehicleName: 'TVS Sport',
    hasHelmet: true,
    offer: 80,
    responseSeconds: 102,
    available: true,
  },

  {
    id: 'rider-007',
    name: 'Vijay A.',
    initials: 'VA',
    rating: 4.7,
    trips: 240,
    distanceKm: 1.4,
    vehicleType: 'auto',
    vehicleName: 'Bajaj Auto',
    hasHelmet: false,
    offer: 95,
    responseSeconds: 24,
    available: true,
  },

  {
    id: 'rider-008',
    name: 'Naveen T.',
    initials: 'NT',
    rating: 4.5,
    trips: 165,
    distanceKm: 2.1,
    vehicleType: 'auto',
    vehicleName: 'Bajaj RE',
    hasHelmet: false,
    offer: 100,
    responseSeconds: 40,
    available: true,
  },

];

/* =========================================================================
   RIDEX MOCK RIDERS END
   ========================================================================= */


/* =========================================================================
   RIDEX HELPERS START
   ========================================================================= */

const money = (
  amount: number,
) => {

  return `₹${Math.round(amount)}`;

};


const formatResponseTime = (
  seconds: number,
) => {

  if (seconds < 60) {
    return `Responded in ${seconds} sec`;
  }

  const minutes =
    Math.round(seconds / 60);

  return `Responded in ${minutes} min`;

};


/* =========================================================================
   RIDEX HELPERS END
   ========================================================================= */


/* =========================================================================
   RIDER RESPONSES SCREEN START
   ========================================================================= */

export default function RiderResponsesScreen() {

  const router = useRouter();

  const params =
    useLocalSearchParams<{
      pickupName?: string;
      pickupAddress?: string;

      dropName?: string;
      dropAddress?: string;

      distanceText?: string;
      durationText?: string;

      vehicle?: string;

      userOffer?: string;

      paymentMethod?: string;

      note?: string;
    }>();


  /* =======================================================================
     REQUEST DATA START
     ======================================================================= */

  const pickupName =
    params.pickupName ||
    'Current Location';

  const pickupAddress =
    params.pickupAddress ||
    '';

  const dropName =
    params.dropName ||
    'Destination';

  const dropAddress =
    params.dropAddress ||
    '';

  const distanceText =
    params.distanceText ||
    '—';

  const durationText =
    params.durationText ||
    '—';

  const vehicleType: VehicleType =
    params.vehicle === 'auto'
      ? 'auto'
      : 'bike';

  const userOffer =
    Number(params.userOffer) ||
    0;

  /* =======================================================================
     REQUEST DATA END
     ======================================================================= */


  /* =======================================================================
     SORT STATE START
     ======================================================================= */

  const [
    sortMode,
    setSortMode,
  ] = useState<SortMode>('all');

  /* =======================================================================
     SORT STATE END
     ======================================================================= */


  /* =======================================================================
     AUTOMATIC FILTERING START
     ======================================================================= */

  const eligibleRiders =
    useMemo(() => {

      /*
        Automatic marketplace filtering:

        1. Rider must be available.
        2. Vehicle must match the requested vehicle.
        3. Rider must be within 5 km.
      */

      return MOCK_RIDERS.filter(
        rider => {

          if (!rider.available) {
            return false;
          }

          if (
            rider.vehicleType !==
            vehicleType
          ) {
            return false;
          }

          if (
            rider.distanceKm > 5
          ) {
            return false;
          }

          return true;

        },
      );

    }, [
      vehicleType,
    ]);


  const visibleRiders =
    useMemo(() => {

      const riders =
        [...eligibleRiders];


      if (sortMode === 'price') {

        return riders.sort(
          (
            a,
            b,
          ) =>
            a.offer -
            b.offer,
        );

      }


      if (sortMode === 'nearest') {

        return riders.sort(
          (
            a,
            b,
          ) =>
            a.distanceKm -
            b.distanceKm,
        );

      }


      /*
        "All Offers"

        Put the lowest offer first,
        then nearest rider.
      */

      return riders.sort(
        (
          a,
          b,
        ) => {

          if (
            a.offer !==
            b.offer
          ) {
            return (
              a.offer -
              b.offer
            );
          }

          return (
            a.distanceKm -
            b.distanceKm
          );

        },
      );

    }, [
      eligibleRiders,
      sortMode,
    ]);

  /* =======================================================================
     AUTOMATIC FILTERING END
     ======================================================================= */


  /* =======================================================================
     BEST PRICE START
     ======================================================================= */

  const bestOffer =
    visibleRiders.length > 0
      ? Math.min(
          ...visibleRiders.map(
            rider =>
              rider.offer,
          ),
        )
      : 0;

  /* =======================================================================
     BEST PRICE END
     ======================================================================= */


  /* =======================================================================
     ACCEPT RIDER START
     ======================================================================= */

 /* =========================================================================
   RIDEX ACCEPT RIDER START
   ========================================================================= */

const handleAccept = (rider: Rider) => {

  /*
    IMPORTANT RIDEX BUSINESS RULE:

    The first accepted rider locks the ride.

    After this point:
    - other offers are no longer relevant
    - user cannot compare another cheaper offer
    - the selected rider becomes the assigned rider
    - final fare becomes this rider's accepted offer
  */

  router.replace({
    pathname: '/rider-on-way' as any,

    params: {
      pickupName,
      pickupAddress,

      dropName,
      dropAddress,

      distanceText,
      durationText,

      vehicle:
        params.vehicle ||
        'bike',

      userOffer:
        String(userOffer),

      finalFare:
        String(rider.offer),

      riderId:
        rider.id,

      riderName:
        rider.name,

      riderInitials:
        rider.initials,

      riderRating:
        String(rider.rating),

      riderTrips:
        String(rider.trips),

      vehicleName:
        rider.vehicleName,

      riderDistanceKm:
        String(rider.distanceKm),

      vehicleNumber:
        'AP 39 AB 1234',
    },
  });

};

/* =========================================================================
   RIDEX ACCEPT RIDER END
   ========================================================================= */

  /* =======================================================================
     ACCEPT RIDER END
     ======================================================================= */


  /* =======================================================================
     CHAT START
     ======================================================================= */

  const handleChat = (
    rider: Rider,
  ) => {

    Alert.alert(
      'Chat',
      `Chat with ${rider.name} will be connected in the next milestone.`,
    );

  };

  /* =======================================================================
     CHAT END
     ======================================================================= */


  /* =======================================================================
     RENDER START
     ======================================================================= */

  return (

    <SafeAreaView
      style={styles.safeArea}
    >

      <ScrollView
        style={styles.screen}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >


        {/* ================================================================
            HEADER START
        ================================================================ */}

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
              size={28}
              color={COLORS.black}
            />

          </Pressable>


          <View
            style={styles.headerCenter}
          >

            <Text
              style={styles.headerTitle}
            >
              Rider Responses
            </Text>


            <View
              style={styles.liveRow}
            >

              <View
                style={styles.liveDot}
              />

              <Text
                style={styles.liveText}
              >
                Offers from nearby riders
              </Text>

            </View>

          </View>


          <View
            style={styles.safeRides}
          >

            <Ionicons
              name="shield-checkmark"
              size={22}
              color={COLORS.green}
            />

            <Text
              style={styles.safeRidesText}
            >
              Safe Rides
            </Text>

          </View>

        </View>

        {/* ================================================================
            HEADER END
        ================================================================ */}


        {/* ================================================================
            REQUEST SUMMARY START
        ================================================================ */}

        <View
          style={styles.summaryCard}
        >

          <View
            style={styles.summaryLocations}
          >


            {/* PICKUP */}

            <View
              style={styles.summaryLocation}
            >

              <View
                style={styles.timeline}
              >

                <View
                  style={styles.pickupDot}
                >

                  <View
                    style={
                      styles.pickupDotInner
                    }
                  />

                </View>


                <View
                  style={styles.dashedLine}
                />

              </View>


              <View
                style={styles.locationContent}
              >

                <Text
                  style={styles.pickupLabel}
                >
                  Pickup
                </Text>


                <Text
                  style={styles.locationName}
                  numberOfLines={1}
                >
                  {pickupName}
                </Text>


                <Text
                  style={
                    styles.locationAddress
                  }
                  numberOfLines={1}
                >
                  {pickupAddress}
                </Text>

              </View>

            </View>


            {/* DROP */}

            <View
              style={styles.summaryLocation}
            >

              <View
                style={styles.timeline}
              >

                <View
                  style={styles.dropPin}
                >

                  <Ionicons
                    name="location"
                    size={17}
                    color={COLORS.white}
                  />

                </View>

              </View>


              <View
                style={styles.locationContent}
              >

                <Text
                  style={styles.dropLabel}
                >
                  Drop
                </Text>


                <Text
                  style={styles.locationName}
                  numberOfLines={2}
                >
                  {dropName}
                </Text>


                <Text
                  style={
                    styles.locationAddress
                  }
                  numberOfLines={1}
                >
                  {dropAddress}
                </Text>

              </View>

            </View>

          </View>


          <View
            style={styles.summaryRight}
          >

            <View
              style={styles.summaryStat}
            >

              <Ionicons
                name="navigate-outline"
                size={22}
                color={COLORS.gray}
              />

              <Text
                style={styles.summaryStatText}
              >
                {distanceText}
              </Text>

            </View>


            <View
              style={styles.summaryStat}
            >

              <Ionicons
                name="time-outline"
                size={22}
                color={COLORS.gray}
              />

              <Text
                style={styles.summaryStatText}
              >
                {durationText}
              </Text>

            </View>


            <View
              style={styles.summaryDivider}
            />


            <Text
              style={styles.yourOfferLabel}
            >
              Your Offer
            </Text>


            <Text
              style={styles.yourOfferAmount}
            >
              {money(userOffer)}
            </Text>


            <Pressable
              style={styles.editOfferButton}
              onPress={() =>
                router.back()
              }
            >

              <Text
                style={
                  styles.editOfferText
                }
              >
                (You can still edit)
              </Text>


              <Ionicons
                name="pencil-outline"
                size={19}
                color={COLORS.green}
              />

            </Pressable>

          </View>

        </View>

        {/* ================================================================
            REQUEST SUMMARY END
        ================================================================ */}


        {/* ================================================================
            RESPONSE STATUS START
        ================================================================ */}

        <View
          style={styles.responseStatus}
        >

          <View
            style={styles.peopleIcon}
          >

            <Ionicons
              name="people"
              size={28}
              color={COLORS.green}
            />

          </View>


          <View
            style={styles.responseStatusContent}
          >

            <Text
              style={
                styles.responseStatusTitle
              }
            >
              Riders are responding to your offer
            </Text>


            <Text
              style={
                styles.responseStatusText
              }
            >
              Choose the best offer that works for you.
            </Text>

          </View>


          <Pressable
            style={styles.modifyButton}
            onPress={() =>
              router.back()
            }
          >

            <Ionicons
              name="pencil-outline"
              size={18}
              color={COLORS.green}
            />

            <Text
              style={
                styles.modifyButtonText
              }
            >
              Modify Offer
            </Text>

          </Pressable>

        </View>

        {/* ================================================================
            RESPONSE STATUS END
        ================================================================ */}


        {/* ================================================================
            FILTER TABS START
        ================================================================ */}

        <View
          style={styles.tabs}
        >

          <Pressable
            style={[
              styles.tab,

              sortMode === 'all' &&
                styles.tabActive,
            ]}
            onPress={() =>
              setSortMode('all')
            }
          >

            <Text
              style={[
                styles.tabText,

                sortMode === 'all' &&
                  styles.tabTextActive,
              ]}
            >
              All Offers ({eligibleRiders.length})
            </Text>

          </Pressable>


          <Pressable
            style={[
              styles.tab,

              sortMode === 'price' &&
                styles.tabActive,
            ]}
            onPress={() =>
              setSortMode('price')
            }
          >

            <Text
              style={[
                styles.tabText,

                sortMode === 'price' &&
                  styles.tabTextActive,
              ]}
            >
              Best Price
            </Text>


            <Ionicons
              name="swap-vertical"
              size={18}
              color={
                sortMode === 'price'
                  ? COLORS.green
                  : COLORS.gray
              }
            />

          </Pressable>


          <Pressable
            style={[
              styles.tab,

              sortMode === 'nearest' &&
                styles.tabActive,
            ]}
            onPress={() =>
              setSortMode('nearest')
            }
          >

            <Text
              style={[
                styles.tabText,

                sortMode === 'nearest' &&
                  styles.tabTextActive,
              ]}
            >
              Nearest
            </Text>


            <Ionicons
              name="location-outline"
              size={19}
              color={
                sortMode === 'nearest'
                  ? COLORS.green
                  : COLORS.gray
              }
            />

          </Pressable>

        </View>

        {/* ================================================================
            FILTER TABS END
        ================================================================ */}


        {/* ================================================================
            RIDER LIST START
        ================================================================ */}

        {visibleRiders.map(
          (
            rider,
            index,
          ) => {

            const isBest =
              rider.offer ===
                bestOffer &&
              sortMode !== 'nearest';

            const isGoodDeal =
              rider.offer <=
              userOffer;


            return (

              <View
                key={rider.id}
                style={[
                  styles.riderCard,

                  isBest &&
                    styles.bestCard,
                ]}
              >


                {/* BEST PRICE LABEL */}

                {isBest && (
                  <View
                    style={
                      styles.bestBadge
                    }
                  >

                    <Ionicons
                      name="star-outline"
                      size={15}
                      color={COLORS.green}
                    />

                    <Text
                      style={
                        styles.bestBadgeText
                      }
                    >
                      Best Price
                    </Text>

                  </View>
                )}


                <View
                  style={
                    styles.riderMain
                  }
                >


                  {/* AVATAR */}

                  <View
                    style={[
                      styles.avatar,

                      {
                        backgroundColor:
                          index % 3 === 0
                            ? '#DDEFE6'
                            : index % 3 === 1
                              ? '#E9EAF4'
                              : '#F2E7DD',
                      },
                    ]}
                  >

                    <Text
                      style={styles.avatarText}
                    >
                      {rider.initials}
                    </Text>

                  </View>


                  {/* RIDER INFO */}

                  <View
                    style={
                      styles.riderInfo
                    }
                  >

                    <Text
                      style={
                        styles.riderName
                      }
                    >
                      {rider.name}
                    </Text>


                    <View
                      style={
                        styles.ratingRow
                      }
                    >

                      <Ionicons
                        name="star"
                        size={15}
                        color={COLORS.green}
                      />

                      <Text
                        style={
                          styles.ratingText
                        }
                      >
                        {rider.rating}
                      </Text>


                      <Text
                        style={
                          styles.dotSeparator
                        }
                      >
                        •
                      </Text>


                      <Text
                        style={
                          styles.tripsText
                        }
                      >
                        {rider.trips} trips
                      </Text>

                    </View>


                    <Text
                      style={
                        styles.distanceAway
                      }
                    >
                      {rider.distanceKm.toFixed(1)} km away
                    </Text>


                    <View
                      style={
                        styles.vehicleRow
                      }
                    >

                      <Ionicons
                        name={
                          rider.vehicleType ===
                          'bike'
                            ? 'bicycle-outline'
                            : 'car-outline'
                        }
                        size={17}
                        color={COLORS.gray}
                      />

                      <Text
                        style={
                          styles.vehicleText
                        }
                      >
                        {rider.vehicleName}
                      </Text>


                      {rider.hasHelmet && (
                        <>
                          <Ionicons
                            name="shield-checkmark-outline"
                            size={16}
                            color={COLORS.gray}
                          />

                          <Text
                            style={
                              styles.vehicleText
                            }
                          >
                            Helmet
                          </Text>
                        </>
                      )}

                    </View>

                  </View>


                  {/* OFFER + ACTIONS */}

                  <View
                    style={
                      styles.offerColumn
                    }
                  >

                    <View
                      style={[
                        styles.riderOffer,

                        isGoodDeal
                          ? styles.goodOffer
                          : styles.highOffer,
                      ]}
                    >

                      <Text
                        style={[
                          styles.riderOfferAmount,

                          isGoodDeal
                            ? styles.goodOfferText
                            : styles.highOfferText,
                        ]}
                      >
                        {money(rider.offer)}
                      </Text>


                      <Text
                        style={
                          styles.offerComparison
                        }
                      >
                        Your offer: {money(userOffer)}
                      </Text>

                    </View>


                    <Pressable
                      style={
                        styles.acceptButton
                      }
                      onPress={() =>
                        handleAccept(
                          rider,
                        )
                      }
                    >

                      <Text
                        style={
                          styles.acceptText
                        }
                      >
                        Accept
                      </Text>

                    </Pressable>


                    <Pressable
                      style={
                        styles.chatButton
                      }
                      onPress={() =>
                        handleChat(
                          rider,
                        )
                      }
                    >

                      <Ionicons
                        name="chatbox-outline"
                        size={19}
                        color={COLORS.green}
                      />

                      <Text
                        style={
                          styles.chatText
                        }
                      >
                        Chat
                      </Text>

                    </Pressable>

                  </View>

                </View>


                {/* RESPONSE TIME */}

                <View
                  style={styles.responseTime}
                >

                  <Text
                    style={styles.lightning}
                  >
                    ⚡
                  </Text>


                  <Text
                    style={
                      styles.responseTimeText
                    }
                  >
                    {formatResponseTime(
                      rider.responseSeconds,
                    )}
                  </Text>

                </View>

              </View>

            );

          },
        )}


        {/* ================================================================
            RIDER LIST END
        ================================================================ */}


        {/* ================================================================
            WAITING CARD START
        ================================================================ */}

        <View
          style={styles.waitingCard}
        >

          <View
            style={styles.waitingIcon}
          >

            <Ionicons
              name="people"
              size={27}
              color={COLORS.green}
            />

          </View>


          <View
            style={styles.waitingContent}
          >

            <Text
              style={styles.waitingTitle}
            >
              3 more riders are thinking...
            </Text>


            <Text
              style={styles.waitingText}
            >
              You'll be notified when they respond.
            </Text>

          </View>


          <View
            style={styles.threeDots}
          >

            <View
              style={styles.dot}
            />

            <View
              style={styles.dot}
            />

            <View
              style={styles.dot}
            />

          </View>

        </View>

        {/* ================================================================
            WAITING CARD END
        ================================================================ */}


        {/* ================================================================
            SECURITY START
        ================================================================ */}

        <View
          style={styles.security}
        >

          <Ionicons
            name="shield-checkmark"
            size={22}
            color={COLORS.blue}
          />


          <Text
            style={styles.securityText}
          >
            Your details are hidden. They will be shared only after you accept a rider.
          </Text>

        </View>

        {/* ================================================================
            SECURITY END
        ================================================================ */}


        <View
          style={styles.bottomSpace}
        />

      </ScrollView>

    </SafeAreaView>

  );
}

/* =========================================================================
   RIDER RESPONSES SCREEN END
   ========================================================================= */


/* =========================================================================
   RIDEX STYLES START
   ========================================================================= */

const styles =
  StyleSheet.create({

    safeArea: {
      flex: 1,
      backgroundColor:
        COLORS.background,
    },

    screen: {
      flex: 1,
    },

    content: {
      paddingHorizontal: 18,
      paddingTop: 5,
      paddingBottom: 35,
    },


    /* ---------------------------------------------------------------------
       HEADER
       --------------------------------------------------------------------- */

    header: {
      minHeight: 82,
      flexDirection: 'row',
      alignItems: 'center',
    },

    backButton: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
    },

    headerCenter: {
      flex: 1,
      alignItems: 'center',
    },

    headerTitle: {
      fontSize: 23,
      fontWeight: '800',
      color: COLORS.black,
    },

    liveRow: {
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },

    liveDot: {
      width: 11,
      height: 11,
      borderRadius: 6,
      backgroundColor: '#52E6A5',
    },

    liveText: {
      fontSize: 13,
      color: COLORS.gray,
    },

    safeRides: {
      width: 76,
      alignItems: 'center',
    },

    safeRidesText: {
      marginTop: 2,
      fontSize: 10,
      fontWeight: '600',
      color: COLORS.gray,
    },


    /* ---------------------------------------------------------------------
       REQUEST SUMMARY
       --------------------------------------------------------------------- */

    summaryCard: {
      minHeight: 235,
      padding: 18,
      marginBottom: 17,
      borderRadius: 22,
      backgroundColor: COLORS.white,

      shadowColor: '#000',
      shadowOpacity: 0.07,
      shadowRadius: 12,
      shadowOffset: {
        width: 0,
        height: 4,
      },

      elevation: 3,

      flexDirection: 'row',
    },

    summaryLocations: {
      flex: 1,
      paddingRight: 12,
    },

    summaryLocation: {
      minHeight: 92,
      flexDirection: 'row',
    },

    timeline: {
      width: 29,
      alignItems: 'center',
      position: 'relative',
    },

    pickupDot: {
      width: 25,
      height: 25,
      borderRadius: 13,
      backgroundColor: COLORS.green,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pickupDotInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: COLORS.white,
    },

    dashedLine: {
      position: 'absolute',
      top: 28,
      height: 63,
      borderLeftWidth: 2,
      borderStyle: 'dashed',
      borderColor: '#9ED5B7',
    },

    dropPin: {
      width: 26,
      height: 26,
      borderRadius: 14,
      backgroundColor: COLORS.red,
      alignItems: 'center',
      justifyContent: 'center',
    },

    locationContent: {
      flex: 1,
      paddingLeft: 7,
    },

    pickupLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: COLORS.green,
    },

    dropLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: COLORS.red,
    },

    locationName: {
      marginTop: 4,
      fontSize: 17,
      fontWeight: '800',
      color: COLORS.black,
    },

    locationAddress: {
      marginTop: 5,
      fontSize: 13,
      color: COLORS.gray,
    },

    summaryRight: {
      width: 116,
      borderLeftWidth: 1,
      borderLeftColor: COLORS.border,
      paddingLeft: 14,
    },

    summaryStat: {
      marginBottom: 13,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },

    summaryStatText: {
      fontSize: 14,
      fontWeight: '700',
      color: COLORS.black,
    },

    summaryDivider: {
      height: 1,
      backgroundColor: COLORS.border,
      marginBottom: 12,
    },

    yourOfferLabel: {
      fontSize: 13,
      color: COLORS.gray,
    },

    yourOfferAmount: {
      marginTop: 3,
      fontSize: 28,
      fontWeight: '800',
      color: COLORS.green,
    },

    editOfferButton: {
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    editOfferText: {
      fontSize: 11,
      color: COLORS.green,
      fontWeight: '600',
    },


    /* ---------------------------------------------------------------------
       RESPONSE STATUS
       --------------------------------------------------------------------- */

    responseStatus: {
      minHeight: 91,
      marginBottom: 18,
      padding: 14,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: '#D4EDE0',
      backgroundColor: COLORS.greenVerySoft,
      flexDirection: 'row',
      alignItems: 'center',
    },

    peopleIcon: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: '#DFF3E8',
      alignItems: 'center',
      justifyContent: 'center',
    },

    responseStatusContent: {
      flex: 1,
      marginLeft: 12,
    },

    responseStatusTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: COLORS.black,
    },

    responseStatusText: {
      marginTop: 4,
      fontSize: 12,
      color: COLORS.gray,
    },

    modifyButton: {
      minHeight: 48,
      paddingHorizontal: 11,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: COLORS.green,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    modifyButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: COLORS.green,
    },


    /* ---------------------------------------------------------------------
       TABS
       --------------------------------------------------------------------- */

    tabs: {
      minHeight: 55,
      marginBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      flexDirection: 'row',
      alignItems: 'stretch',
    },

    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      borderBottomWidth: 3,
      borderBottomColor: 'transparent',
    },

    tabActive: {
      borderBottomColor: COLORS.green,
    },

    tabText: {
      fontSize: 14,
      fontWeight: '700',
      color: COLORS.gray,
    },

    tabTextActive: {
      color: COLORS.green,
    },


    /* ---------------------------------------------------------------------
       RIDER CARD
       --------------------------------------------------------------------- */

    riderCard: {
      marginBottom: 13,
      padding: 14,
      paddingTop: 18,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.white,
    },

    bestCard: {
      borderColor: '#D1EBDD',
      backgroundColor: COLORS.greenVerySoft,
    },

    bestBadge: {
      position: 'absolute',
      top: 0,
      left: 0,
      paddingHorizontal: 11,
      paddingVertical: 5,
      borderBottomRightRadius: 11,
      backgroundColor: '#DFF3E8',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    bestBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      color: COLORS.green,
    },

    riderMain: {
      flexDirection: 'row',
    },

    avatar: {
      width: 67,
      height: 67,
      borderRadius: 34,
      alignItems: 'center',
      justifyContent: 'center',
    },

    avatarText: {
      fontSize: 19,
      fontWeight: '800',
      color: COLORS.black,
    },

    riderInfo: {
      flex: 1,
      paddingLeft: 12,
      paddingRight: 7,
    },

    riderName: {
      fontSize: 17,
      fontWeight: '800',
      color: COLORS.black,
    },

    ratingRow: {
      marginTop: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    ratingText: {
      fontSize: 13,
      fontWeight: '700',
      color: COLORS.gray,
    },

    dotSeparator: {
      marginHorizontal: 2,
      fontSize: 13,
      color: COLORS.gray,
    },

    tripsText: {
      fontSize: 13,
      color: COLORS.gray,
    },

    distanceAway: {
      marginTop: 6,
      fontSize: 13,
      color: COLORS.black,
    },

    vehicleRow: {
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 5,
    },

    vehicleText: {
      marginRight: 5,
      fontSize: 11,
      color: COLORS.gray,
    },

    offerColumn: {
      width: 116,
      alignItems: 'stretch',
    },

    riderOffer: {
      minHeight: 82,
      paddingHorizontal: 7,
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },

    goodOffer: {
      backgroundColor: '#E3F4EA',
    },

    highOffer: {
      backgroundColor: COLORS.orangeSoft,
    },

    riderOfferAmount: {
      fontSize: 27,
      fontWeight: '800',
    },

    goodOfferText: {
      color: COLORS.green,
    },

    highOfferText: {
      color: COLORS.orange,
    },

    offerComparison: {
      marginTop: 5,
      fontSize: 10,
      color: COLORS.black,
      textAlign: 'center',
    },

    acceptButton: {
      height: 48,
      marginTop: 9,
      borderRadius: 11,
      backgroundColor: COLORS.green,
      alignItems: 'center',
      justifyContent: 'center',
    },

    acceptText: {
      fontSize: 15,
      fontWeight: '800',
      color: COLORS.white,
    },

    chatButton: {
      height: 48,
      marginTop: 7,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: COLORS.green,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },

    chatText: {
      fontSize: 14,
      fontWeight: '700',
      color: COLORS.green,
    },

    responseTime: {
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
      flexDirection: 'row',
      alignItems: 'center',
    },

    lightning: {
      fontSize: 16,
    },

    responseTimeText: {
      marginLeft: 7,
      fontSize: 12,
      color: COLORS.gray,
    },


    /* ---------------------------------------------------------------------
       WAITING
       --------------------------------------------------------------------- */

    waitingCard: {
      minHeight: 94,
      marginTop: 2,
      marginBottom: 17,
      padding: 14,
      borderRadius: 17,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: '#C8CDD2',
      backgroundColor: COLORS.white,
      flexDirection: 'row',
      alignItems: 'center',
    },

    waitingIcon: {
      width: 53,
      height: 53,
      borderRadius: 27,
      backgroundColor: '#E0F4E8',
      alignItems: 'center',
      justifyContent: 'center',
    },

    waitingContent: {
      flex: 1,
      marginLeft: 12,
    },

    waitingTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: COLORS.black,
    },

    waitingText: {
      marginTop: 5,
      fontSize: 12,
      color: COLORS.gray,
    },

    threeDots: {
      flexDirection: 'row',
      gap: 5,
    },

    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: COLORS.green,
    },


    /* ---------------------------------------------------------------------
       SECURITY
       --------------------------------------------------------------------- */

    security: {
      minHeight: 67,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 16,
      backgroundColor: COLORS.blueSoft,
      flexDirection: 'row',
      alignItems: 'center',
    },

    securityText: {
      flex: 1,
      marginLeft: 9,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: '600',
      color: '#355B80',
    },


    bottomSpace: {
      height: 30,
    },

  });

/* =========================================================================
   RIDEX STYLES END
   ========================================================================= */