import React, { useMemo, useState } from 'react';

import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
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
};

/* =========================================================================
   RIDEX COLORS END
   ========================================================================= */


/* =========================================================================
   RIDEX OFFER ASSETS START
   ========================================================================= */

/*
  These files must exist here:

  assets/images/offer-scooter-rider.png
  assets/images/offer-city.png
*/

const OFFER_SCOOTER =
  require('../../assets/images/offer-scooter-rider.png');

const OFFER_CITY =
  require('../../assets/images/offer-city.png');

/* =========================================================================
   RIDEX OFFER ASSETS END
   ========================================================================= */


/* =========================================================================
   RIDEX TYPES START
   ========================================================================= */

type PaymentMethod = 'cash' | 'upi';

type OfferStatus =
  | 'empty'
  | 'within'
  | 'below'
  | 'above';

/* =========================================================================
   RIDEX TYPES END
   ========================================================================= */


/* =========================================================================
   RIDEX HELPERS START
   ========================================================================= */

const roundToFive = (
  value: number,
) => {
  return Math.round(value / 5) * 5;
};


const money = (
  value: number,
) => {
  return `₹${Math.round(value)}`;
};

/* =========================================================================
   RIDEX HELPERS END
   ========================================================================= */


/* =========================================================================
   YOUR OFFER SCREEN START
   ========================================================================= */

export default function MakeOfferScreen() {

  const router = useRouter();

  const params =
    useLocalSearchParams<{
      pickupName?: string;
      pickupAddress?: string;

      dropName?: string;
      dropAddress?: string;

      distanceText?: string;
      durationText?: string;

      minFare?: string;
      maxFare?: string;
      suggestedFare?: string;

      vehicle?: string;
    }>();


  /* =======================================================================
     TRIP DATA START
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

  const minimumFare =
    Number(params.minFare) || 0;

  const maximumFare =
    Number(params.maxFare) || 0;

  const recommendedFare =
    Number(params.suggestedFare) || 0;

  /* =======================================================================
     TRIP DATA END
     ======================================================================= */


  /* =======================================================================
     OFFER STATE START
     ======================================================================= */

  const initialOffer =
    recommendedFare > 0
      ? roundToFive(recommendedFare)
      : minimumFare > 0
        ? roundToFive(minimumFare)
        : 0;


  const [
    offer,
    setOffer,
  ] = useState(
    initialOffer > 0
      ? String(initialOffer)
      : '',
  );


  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState<PaymentMethod>(
    'cash',
  );


  const [
    note,
    setNote,
  ] = useState('');

  /* =======================================================================
     OFFER STATE END
     ======================================================================= */


  /* =======================================================================
     OFFER STATUS START
     ======================================================================= */

  const offerAmount =
    Number(
      offer.replace(
        /[^0-9]/g,
        '',
      ),
    ) || 0;


  const offerStatus: OfferStatus =
    useMemo(() => {

      if (offerAmount <= 0) {
        return 'empty';
      }

      if (
        offerAmount >= minimumFare &&
        offerAmount <= maximumFare
      ) {
        return 'within';
      }

      if (
        minimumFare > 0 &&
        offerAmount < minimumFare
      ) {
        return 'below';
      }

      return 'above';

    }, [
      offerAmount,
      minimumFare,
      maximumFare,
    ]);


  const statusConfig = {

    empty: {
      text: 'Enter your offer',
      color: COLORS.gray,
      background: COLORS.white,
      border: COLORS.border,
      icon: 'information-circle-outline',
    },

    within: {
      text: 'Within range',
      color: COLORS.green,
      background: COLORS.greenVerySoft,
      border: '#BCE7CF',
      icon: 'checkmark-circle',
    },

    below: {
      text: 'Below range',
      color: '#C48100',
      background: COLORS.yellowSoft,
      border: '#E9D58D',
      icon: 'information-circle',
    },

    above: {
      text: 'Above range',
      color: COLORS.blue,
      background: COLORS.blueSoft,
      border: '#C7DBF5',
      icon: 'information-circle',
    },

  }[offerStatus];

  /* =======================================================================
     OFFER STATUS END
     ======================================================================= */


  /* =======================================================================
     QUICK AMOUNTS START
     ======================================================================= */

  const quickAmounts =
    useMemo(() => {

      const center =
        offerAmount ||
        recommendedFare ||
        minimumFare;


      if (center <= 0) {
        return [];
      }


      const values = [
        minimumFare,
        minimumFare + 5,
        center,
        center + 5,
        center + 10,
      ];


      return Array.from(
        new Set(
          values
            .filter(
              value => value > 0,
            )
            .map(
              value =>
                roundToFive(value),
            ),
        ),
      ).slice(0, 5);

    }, [
      minimumFare,
      recommendedFare,
      offerAmount,
    ]);

  /* =======================================================================
     QUICK AMOUNTS END
     ======================================================================= */


  /* =======================================================================
     SEND REQUEST START
     ======================================================================= */

  const handleSendRequest = () => {

    if (offerAmount <= 0) {

      Alert.alert(
        'Enter your offer',
        'Please enter the amount you would like to offer.',
      );

      return;
    }


    Alert.alert(
      'Offer ready',
      `${money(offerAmount)} ${paymentMethod === 'cash' ? 'Cash' : 'UPI'} offer selected.\n\nRider matching will be connected in the next milestone.`,
    );

  };

  /* =======================================================================
     SEND REQUEST END
     ======================================================================= */


  /* =======================================================================
     RENDER START
     ======================================================================= */

  return (

    <SafeAreaView
      style={styles.safeArea}
    >

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >

        <ScrollView
          style={styles.screen}
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >


          {/* ================================================================
              HEADER START
          ================================================================ */}

          <View style={styles.header}>

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
                Your Offer
              </Text>


              <Text
                style={styles.headerSubtitle}
              >
                You set the price, riders make it happen
              </Text>

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
              TRIP CARD START
          ================================================================ */}

          <View
            style={styles.tripCard}
          >

            <View
              style={styles.tripHeaderRow}
            >

              <View
                style={styles.tripLocations}
              >


                {/* PICKUP START */}

                <View
                  style={styles.locationRow}
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

                {/* PICKUP END */}


                {/* DROP START */}

                <View
                  style={styles.locationRow}
                >

                  <View
                    style={styles.timeline}
                  >

                    <View
                      style={styles.dropPin}
                    >

                      <Ionicons
                        name="location"
                        size={18}
                        color={COLORS.white}
                      />

                    </View>

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
                      Drop
                    </Text>


                    <Text
                      style={
                        styles.locationName
                      }
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

                {/* DROP END */}

              </View>


              <Pressable
                style={styles.editButton}
                onPress={() =>
                  router.back()
                }
              >

                <Ionicons
                  name="pencil-outline"
                  size={20}
                  color={COLORS.black}
                />

                <Text
                  style={styles.editText}
                >
                  Edit
                </Text>

              </Pressable>

            </View>


            <View
              style={styles.divider}
            />


            <View
              style={styles.tripStats}
            >

              <View
                style={styles.tripStat}
              >

                <Ionicons
                  name="navigate-outline"
                  size={22}
                  color={COLORS.gray}
                />

                <Text
                  style={styles.tripStatText}
                >
                  {distanceText}
                </Text>

              </View>


              <View
                style={styles.statDivider}
              />


              <View
                style={styles.tripStat}
              >

                <Ionicons
                  name="time-outline"
                  size={22}
                  color={COLORS.gray}
                />

                <Text
                  style={styles.tripStatText}
                >
                  {durationText}
                </Text>

              </View>

            </View>

          </View>

          {/* ================================================================
              TRIP CARD END
          ================================================================ */}


          {/* ================================================================
              SUGGESTED FARE CARD START
          ================================================================ */}

          <View
            style={styles.suggestedCard}
          >

            {/* CITY BACKGROUND */}

            <Image
              source={OFFER_CITY}
              style={styles.cityAsset}
              resizeMode="contain"
            />


            {/* SCOOTER + RIDER */}

            <Image
              source={OFFER_SCOOTER}
              style={styles.scooterAsset}
              resizeMode="contain"
            />


            {/* FARE CONTENT */}

            <View
              style={styles.suggestedContent}
            >

              <View
                style={styles.titleRow}
              >

                <Text
                  style={
                    styles.suggestedTitle
                  }
                >
                  Suggested Fare
                </Text>


                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={COLORS.gray}
                />

              </View>


              <Text
                style={styles.suggestedAmount}
              >

                {minimumFare > 0
                  ? `${money(minimumFare)} – ${money(maximumFare)}`
                  : 'Calculating...'
                }

              </Text>


              <View
                style={
                  styles.suggestionNotice
                }
              >

                <Ionicons
                  name="bulb-outline"
                  size={19}
                  color={COLORS.black}
                />


                <Text
                  style={
                    styles.suggestionText
                  }
                >
                  This is a suggested fare. You can offer any price.
                </Text>

              </View>

            </View>

          </View>

          {/* ================================================================
              SUGGESTED FARE CARD END
          ================================================================ */}


          {/* ================================================================
              OFFER SECTION START
          ================================================================ */}

          <Text
            style={styles.sectionTitle}
          >
            How much would you like to offer?
          </Text>


          {/* OFFER INPUT START */}

          <View
            style={[
              styles.offerBox,

              offerStatus === 'within' &&
                styles.offerBoxActive,
            ]}
          >

            <View
              style={styles.offerInputRow}
            >

              <Text
                style={styles.rupee}
              >
                ₹
              </Text>


              <TextInput
                value={offer}
                onChangeText={
                  value =>
                    setOffer(
                      value.replace(
                        /[^0-9]/g,
                        '',
                      ),
                    )
                }
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={
                  COLORS.muted
                }
                style={styles.offerInput}
                maxLength={5}
              />

            </View>


            <View
              style={[
                styles.statusBadge,

                {
                  backgroundColor:
                    statusConfig.background,

                  borderColor:
                    statusConfig.border,
                },
              ]}
            >

              <Text
                style={[
                  styles.statusText,

                  {
                    color:
                      statusConfig.color,
                  },
                ]}
              >
                {statusConfig.text}
              </Text>


              <Ionicons
                name={
                  statusConfig.icon as any
                }
                size={19}
                color={
                  statusConfig.color
                }
              />

            </View>

          </View>

          {/* OFFER INPUT END */}


          {/* QUICK AMOUNTS START */}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.quickRow
            }
          >

            {quickAmounts.map(
              amount => (

                <Pressable
                  key={amount}
                  style={[
                    styles.quickButton,

                    offerAmount === amount &&
                      styles.quickButtonActive,
                  ]}
                  onPress={() =>
                    setOffer(
                      String(amount),
                    )
                  }
                >

                  <Text
                    style={[
                      styles.quickText,

                      offerAmount === amount &&
                        styles.quickTextActive,
                    ]}
                  >
                    ₹{amount}
                  </Text>

                </Pressable>

              ),
            )}


            <Pressable
              style={styles.quickButton}
              onPress={() =>
                setOffer('')
              }
            >

              <Text
                style={styles.quickText}
              >
                Other
              </Text>

            </Pressable>

          </ScrollView>

          {/* QUICK AMOUNTS END */}


          {/* LOW OFFER TIP START */}

          <View
            style={styles.tipCard}
          >

            <Ionicons
              name="pricetag"
              size={21}
              color={COLORS.blue}
            />


            <View
              style={styles.tipContent}
            >

              <Text
                style={styles.tipTitle}
              >
                Low offers get more responses!
              </Text>


              <Text
                style={styles.tipText}
              >
                Riders are more likely to accept lower offers.
              </Text>

            </View>

          </View>

          {/* LOW OFFER TIP END */}

          {/* ================================================================
              OFFER SECTION END
          ================================================================ */}


          {/* ================================================================
              PAYMENT SECTION START
          ================================================================ */}

          <Text
            style={styles.paymentTitle}
          >
            Payment method
          </Text>


          {/* CASH */}

          <Pressable
            style={styles.paymentCard}
            onPress={() =>
              setPaymentMethod('cash')
            }
          >

            <View
              style={styles.paymentIcon}
            >

              <Ionicons
                name="cash-outline"
                size={23}
                color={COLORS.green}
              />

            </View>


            <View
              style={styles.paymentContent}
            >

              <Text
                style={styles.paymentName}
              >
                Cash
              </Text>


              <Text
                style={styles.paymentSub}
              >
                Pay after the ride
              </Text>

            </View>


            <View
              style={[
                styles.radio,

                paymentMethod === 'cash' &&
                  styles.radioActive,
              ]}
            >

              {paymentMethod === 'cash' && (
                <View
                  style={
                    styles.radioInner
                  }
                />
              )}

            </View>

          </Pressable>


          {/* UPI */}

          <Pressable
            style={styles.paymentCard}
            onPress={() =>
              setPaymentMethod('upi')
            }
          >

            <View
              style={[
                styles.paymentIcon,
                styles.upiIcon,
              ]}
            >

              <Text
                style={styles.upiText}
              >
                UPI
              </Text>

            </View>


            <View
              style={styles.paymentContent}
            >

              <Text
                style={styles.paymentName}
              >
                UPI
              </Text>


              <Text
                style={styles.paymentSub}
              >
                Pay after the ride
              </Text>

            </View>


            <View
              style={[
                styles.radio,

                paymentMethod === 'upi' &&
                  styles.radioActive,
              ]}
            >

              {paymentMethod === 'upi' && (
                <View
                  style={
                    styles.radioInner
                  }
                />
              )}

            </View>

          </Pressable>

          {/* ================================================================
              PAYMENT SECTION END
          ================================================================ */}


          {/* ================================================================
              NOTE SECTION START
          ================================================================ */}

          <Text
            style={styles.noteTitle}
          >
            Note for riders

            <Text
              style={styles.optional}
            >
              {' '}
              (optional)
            </Text>

          </Text>


          <View
            style={styles.noteBox}
          >

            <Ionicons
              name="chatbox-outline"
              size={22}
              color={COLORS.gray}
            />


            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="e.g. I'm near the main road, call me when you arrive"
              placeholderTextColor={
                COLORS.muted
              }
              style={styles.noteInput}
              multiline
              maxLength={160}
            />

          </View>

          {/* ================================================================
              NOTE SECTION END
          ================================================================ */}


          {/* ================================================================
              SEND BUTTON START
          ================================================================ */}

          <Pressable
            style={[
              styles.sendButton,

              offerAmount <= 0 &&
                styles.sendButtonDisabled,
            ]}
            onPress={
              handleSendRequest
            }
          >

            <View
              style={styles.sendContent}
            >

              <Text
                style={styles.sendTitle}
              >
                Send Request to Riders
              </Text>


              <Text
                style={styles.sendSubtitle}
              >
                Riders near you will receive your offer
              </Text>

            </View>


            <Ionicons
              name="arrow-forward"
              size={36}
              color={COLORS.white}
            />

          </Pressable>

          {/* ================================================================
              SEND BUTTON END
          ================================================================ */}


          {/* ================================================================
              SECURITY NOTICE START
          ================================================================ */}

          <View
            style={styles.security}
          >

            <Ionicons
              name="shield-checkmark"
              size={21}
              color={COLORS.green}
            />


            <Text
              style={styles.securityText}
            >
              Your details are safe and will be shared only after you choose a rider.
            </Text>

          </View>

          {/* ================================================================
              SECURITY NOTICE END
          ================================================================ */}


          <View
            style={styles.bottomSpace}
          />

        </ScrollView>

      </KeyboardAvoidingView>

    </SafeAreaView>

  );
}

/* =========================================================================
   YOUR OFFER SCREEN END
   ========================================================================= */


/* =========================================================================
   RIDEX STYLES START
   ========================================================================= */

const styles =
  StyleSheet.create({

    /* ---------------------------------------------------------------------
       SCREEN
       --------------------------------------------------------------------- */

    safeArea: {
      flex: 1,
      backgroundColor:
        COLORS.background,
    },

    keyboard: {
      flex: 1,
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
      fontSize: 24,
      fontWeight: '800',
      color: COLORS.black,
    },

    headerSubtitle: {
      marginTop: 3,
      fontSize: 12,
      color: COLORS.gray,
      textAlign: 'center',
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
       TRIP CARD
       --------------------------------------------------------------------- */

    tripCard: {
      backgroundColor: COLORS.white,
      borderRadius: 23,
      padding: 18,
      marginBottom: 15,

      shadowColor: '#000',
      shadowOpacity: 0.07,
      shadowRadius: 12,
      shadowOffset: {
        width: 0,
        height: 4,
      },

      elevation: 3,
    },

    tripHeaderRow: {
      flexDirection: 'row',
    },

    tripLocations: {
      flex: 1,
    },

    locationRow: {
      minHeight: 78,
      flexDirection: 'row',
    },

    timeline: {
      width: 31,
      alignItems: 'center',
      position: 'relative',
    },

    pickupDot: {
      width: 24,
      height: 24,
      borderRadius: 12,
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
      top: 27,
      height: 51,
      borderLeftWidth: 2,
      borderStyle: 'dashed',
      borderColor: '#9ED5B7',
    },

    dropPin: {
      width: 25,
      height: 25,
      borderRadius: 14,
      backgroundColor: COLORS.red,
      alignItems: 'center',
      justifyContent: 'center',
    },

    locationContent: {
      flex: 1,
      paddingLeft: 8,
    },

    pickupLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: COLORS.green,
    },

    dropLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: COLORS.red,
    },

    locationName: {
      marginTop: 3,
      fontSize: 17,
      fontWeight: '800',
      color: COLORS.black,
    },

    locationAddress: {
      marginTop: 4,
      fontSize: 13,
      color: COLORS.gray,
    },

    editButton: {
      height: 52,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor: COLORS.white,
    },

    editText: {
      fontSize: 14,
      fontWeight: '700',
      color: COLORS.black,
    },

    divider: {
      height: 1,
      backgroundColor: COLORS.border,
      marginTop: 3,
      marginBottom: 14,
    },

    tripStats: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },

    tripStat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 8,
    },

    tripStatText: {
      fontSize: 14,
      fontWeight: '700',
      color: COLORS.black,
    },

    statDivider: {
      width: 1,
      height: 25,
      backgroundColor: COLORS.border,
    },


    /* ---------------------------------------------------------------------
       SUGGESTED FARE CARD
       --------------------------------------------------------------------- */

    suggestedCard: {
      minHeight: 190,
      borderRadius: 23,
      backgroundColor: COLORS.greenVerySoft,
      padding: 19,
      marginBottom: 19,
      overflow: 'hidden',
      position: 'relative',
      flexDirection: 'row',
    },

    suggestedContent: {
      width: '62%',
      zIndex: 3,
    },

    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    suggestedTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: COLORS.black,
    },

    suggestedAmount: {
      marginTop: 11,
      fontSize: 32,
      fontWeight: '800',
      color: COLORS.green,
    },

    suggestionNotice: {
      marginTop: 11,
      paddingHorizontal: 9,
      paddingVertical: 8,
      borderRadius: 9,
      backgroundColor: COLORS.yellowSoft,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },

    suggestionText: {
      flex: 1,
      fontSize: 11,
      lineHeight: 16,
      fontWeight: '600',
      color: COLORS.black,
    },


    /* ---------------------------------------------------------------------
       REAL OFFER ARTWORK
       --------------------------------------------------------------------- */

    cityAsset: {
      position: 'absolute',

      width: 250,
      height: 145,

      right: -48,
      bottom: -2,

      zIndex: 1,
    },

    scooterAsset: {
      position: 'absolute',

      width: 170,
      height: 135,

      right: -3,
      bottom: 6,

      zIndex: 2,
    },


    /* ---------------------------------------------------------------------
       OFFER INPUT
       --------------------------------------------------------------------- */

    sectionTitle: {
      marginBottom: 12,
      fontSize: 19,
      fontWeight: '800',
      color: COLORS.black,
    },

    offerBox: {
      minHeight: 78,
      backgroundColor: COLORS.white,
      borderRadius: 17,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      paddingHorizontal: 17,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    offerBoxActive: {
      borderColor: '#B9E4CC',
    },

    offerInputRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },

    rupee: {
      fontSize: 34,
      color: COLORS.black,
      marginRight: 7,
    },

    offerInput: {
      flex: 1,
      padding: 0,
      fontSize: 36,
      color: COLORS.black,
    },

    statusBadge: {
      minHeight: 44,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    statusText: {
      fontSize: 12,
      fontWeight: '700',
    },


    /* ---------------------------------------------------------------------
       QUICK AMOUNTS
       --------------------------------------------------------------------- */

    quickRow: {
      gap: 9,
      paddingTop: 12,
      paddingBottom: 3,
    },

    quickButton: {
      minWidth: 92,
      height: 59,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: COLORS.border,
      backgroundColor: COLORS.white,
      alignItems: 'center',
      justifyContent: 'center',
    },

    quickButtonActive: {
      backgroundColor: COLORS.greenSoft,
      borderColor: '#BCE7CF',
    },

    quickText: {
      fontSize: 17,
      fontWeight: '600',
      color: COLORS.black,
    },

    quickTextActive: {
      color: COLORS.green,
      fontWeight: '800',
    },


    /* ---------------------------------------------------------------------
       LOW OFFER TIP
       --------------------------------------------------------------------- */

    tipCard: {
      minHeight: 83,
      marginTop: 12,
      marginBottom: 22,
      padding: 14,
      borderRadius: 15,
      backgroundColor: COLORS.blueSoft,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    tipContent: {
      flex: 1,
      marginLeft: 10,
    },

    tipTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: COLORS.black,
    },

    tipText: {
      marginTop: 5,
      fontSize: 13,
      lineHeight: 18,
      color: COLORS.gray,
    },


    /* ---------------------------------------------------------------------
       PAYMENT
       --------------------------------------------------------------------- */

    paymentTitle: {
      marginBottom: 10,
      fontSize: 17,
      fontWeight: '800',
      color: COLORS.black,
    },

    paymentCard: {
      minHeight: 76,
      marginBottom: 10,
      paddingHorizontal: 13,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.white,
      flexDirection: 'row',
      alignItems: 'center',
    },

    paymentIcon: {
      width: 43,
      height: 43,
      borderRadius: 22,
      backgroundColor: COLORS.greenSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },

    upiIcon: {
      backgroundColor: '#F4F4F4',
    },

    upiText: {
      fontSize: 11,
      fontWeight: '800',
      fontStyle: 'italic',
      color: COLORS.gray,
    },

    paymentContent: {
      flex: 1,
      marginLeft: 12,
    },

    paymentName: {
      fontSize: 16,
      fontWeight: '700',
      color: COLORS.black,
    },

    paymentSub: {
      marginTop: 3,
      fontSize: 13,
      color: COLORS.gray,
    },

    radio: {
      width: 27,
      height: 27,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: '#B2B8BF',
      alignItems: 'center',
      justifyContent: 'center',
    },

    radioActive: {
      borderColor: COLORS.green,
    },

    radioInner: {
      width: 13,
      height: 13,
      borderRadius: 7,
      backgroundColor: COLORS.green,
    },


    /* ---------------------------------------------------------------------
       NOTE
       --------------------------------------------------------------------- */

    noteTitle: {
      marginTop: 13,
      marginBottom: 10,
      fontSize: 17,
      fontWeight: '800',
      color: COLORS.black,
    },

    optional: {
      fontWeight: '500',
      color: COLORS.gray,
    },

    noteBox: {
      minHeight: 72,
      marginBottom: 20,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: COLORS.border,
      backgroundColor: COLORS.white,
      flexDirection: 'row',
      alignItems: 'center',
    },

    noteInput: {
      flex: 1,
      marginLeft: 9,
      minHeight: 44,
      fontSize: 14,
      lineHeight: 20,
      color: COLORS.black,
      textAlignVertical: 'center',
    },


    /* ---------------------------------------------------------------------
       SEND BUTTON
       --------------------------------------------------------------------- */

    sendButton: {
      minHeight: 104,
      marginBottom: 17,
      paddingHorizontal: 18,
      borderRadius: 20,
      backgroundColor: COLORS.green,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    sendButtonDisabled: {
      opacity: 0.65,
    },

    sendContent: {
      flex: 1,
    },

    sendTitle: {
      textAlign: 'center',
      fontSize: 18,
      fontWeight: '800',
      color: COLORS.white,
    },

    sendSubtitle: {
      marginTop: 6,
      textAlign: 'center',
      fontSize: 12,
      color: COLORS.white,
    },


    /* ---------------------------------------------------------------------
       SECURITY
       --------------------------------------------------------------------- */

    security: {
      minHeight: 64,
      paddingHorizontal: 14,
      paddingVertical: 11,
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


    /* ---------------------------------------------------------------------
       BOTTOM
       --------------------------------------------------------------------- */

    bottomSpace: {
      height: 30,
    },

  });

/* =========================================================================
   RIDEX STYLES END
   ========================================================================= */