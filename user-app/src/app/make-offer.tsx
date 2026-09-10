import React, { useMemo, useState } from 'react';

import {
  ActivityIndicator,
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
import { getAuth } from '@react-native-firebase/auth';

/* =========================================================================
   RIDEX CONFIG
   ========================================================================= */

const API_BASE_URL = 'http://10.134.158.132:3000';

/* =========================================================================
   COLORS
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
   ASSETS
   ========================================================================= */

const OFFER_SCOOTER =
  require('../../assets/images/offer-scooter-rider.png');

const OFFER_CITY =
  require('../../assets/images/offer-city.png');

/* =========================================================================
   TYPES
   ========================================================================= */

type PaymentMethod = 'cash' | 'upi';

type OfferStatus =
  | 'empty'
  | 'within'
  | 'below'
  | 'above';

/* =========================================================================
   HELPERS
   ========================================================================= */

const roundToFive = (value: number) =>
  Math.round(value / 5) * 5;

const money = (value: number) =>
  `₹${Math.round(value)}`;

/* =========================================================================
   API
   ========================================================================= */

async function getFirebaseToken(): Promise<string> {
  const user = getAuth().currentUser;

  if (!user) {
    throw new Error(
      'You are not logged in. Please login again.',
    );
  }

  return user.getIdToken();
}

async function createRide(payload: {
  pickup: {
    lat: number;
    lng: number;
    name: string;
    address: string;
  };

  drop: {
    lat: number;
    lng: number;
    name: string;
    address: string;
  };

  vehicleType: string;
  passengerOffer: number;
  paymentMethod: PaymentMethod;
  note?: string;
}) {
  const token = await getFirebaseToken();

  const response = await fetch(
    `${API_BASE_URL}/api/rides`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(payload),
    },
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(
      data?.error ||
        data?.message ||
        'Failed to create ride.',
    );
  }

  return data.ride;
}

/* =========================================================================
   SCREEN
   ========================================================================= */

export default function MakeOfferScreen() {
  const router = useRouter();

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

      distanceText?: string;
      durationText?: string;

      minFare?: string;
      maxFare?: string;
      suggestedFare?: string;

      vehicle?: string;
      pricingMode?: string;

      userOffer?: string;
    }>();

  /* =========================================================================
     TRIP DATA
     ========================================================================= */

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

  const pickupLat =
    Number(params.pickupLat);

  const pickupLng =
    Number(params.pickupLng);

  const dropLat =
    Number(params.dropLat);

  const dropLng =
    Number(params.dropLng);

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

  /* =========================================================================
     OFFER STATE
     ========================================================================= */

  const initialOffer =
    Number(params.userOffer) > 0
      ? roundToFive(
          Number(params.userOffer),
        )
      : recommendedFare > 0
        ? roundToFive(
            recommendedFare,
          )
        : minimumFare > 0
          ? roundToFive(
              minimumFare,
            )
          : 0;

  const [offer, setOffer] =
    useState(
      initialOffer > 0
        ? String(initialOffer)
        : '',
    );

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('cash');

  const [note, setNote] =
    useState('');

  const [submitting, setSubmitting] =
    useState(false);

  /* =========================================================================
     OFFER VALUE
     ========================================================================= */

  const offerAmount =
    Number(
      offer.replace(
        /[^0-9]/g,
        '',
      ),
    ) || 0;

  /* =========================================================================
     OFFER STATUS
     ========================================================================= */

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
      text: 'Within suggested range',
      color: COLORS.green,
      background: COLORS.greenVerySoft,
      border: '#BCE7CF',
      icon: 'checkmark-circle',
    },

    below: {
      text: 'Below suggested range',
      color: '#C48100',
      background: COLORS.yellowSoft,
      border: '#E9D58D',
      icon: 'information-circle',
    },

    above: {
      text: 'Above suggested range',
      color: COLORS.blue,
      background: COLORS.blueSoft,
      border: '#C7DBF5',
      icon: 'information-circle',
    },
  }[offerStatus];

  /* =========================================================================
     QUICK AMOUNTS
     ========================================================================= */

  const quickAmounts =
    useMemo(() => {
      const center =
        offerAmount ||
        recommendedFare ||
        minimumFare;

      if (center <= 0) {
        return [];
      }

      return Array.from(
        new Set(
          [
            minimumFare,
            minimumFare + 5,
            center,
            center + 5,
            center + 10,
          ]
            .filter(
              value => value > 0,
            )
            .map(roundToFive),
        ),
      ).slice(0, 5);
    }, [
      minimumFare,
      recommendedFare,
      offerAmount,
    ]);

  /* =========================================================================
     CREATE REAL RIDE
     ========================================================================= */

  const handleSendRequest =
    async () => {
      if (offerAmount <= 0) {
        Alert.alert(
          'Enter your offer',
          'Please enter the amount you would like to offer.',
        );
        return;
      }

      if (
        minimumFare > 0 &&
        maximumFare > 0 &&
        (
          offerAmount < minimumFare ||
          offerAmount > maximumFare
        )
      ) {
        Alert.alert(
          'Choose an amount in the suggested range',
          `For this ride, choose between ${money(
            minimumFare,
          )} and ${money(maximumFare)}.`,
        );
        return;
      }

      if (
        !Number.isFinite(pickupLat) ||
        !Number.isFinite(pickupLng) ||
        !Number.isFinite(dropLat) ||
        !Number.isFinite(dropLng)
      ) {
        Alert.alert(
          'Location unavailable',
          'Pickup or destination coordinates are missing. Please go back and select the locations again.',
        );
        return;
      }

      if (submitting) {
        return;
      }

      setSubmitting(true);

      try {
        const ride =
          await createRide({
            pickup: {
              lat: pickupLat,
              lng: pickupLng,
              name: pickupName,
              address: pickupAddress,
            },

            drop: {
              lat: dropLat,
              lng: dropLng,
              name: dropName,
              address: dropAddress,
            },

            vehicleType:
              params.vehicle ||
              'bike',

            passengerOffer:
              offerAmount,

            paymentMethod,

            note:
              note.trim() ||
              undefined,
          });

        console.log(
          'RIDEX REAL RIDE CREATED:',
          ride,
        );

        router.replace({
          pathname: '/rider-responses',

          params: {
            rideId: String(ride.id),

            pickupName,
            pickupAddress,

            pickupLat:
              String(pickupLat),

            pickupLng:
              String(pickupLng),

            dropName,
            dropAddress,

            dropLat:
              String(dropLat),

            dropLng:
              String(dropLng),

            distanceText,
            durationText,

            vehicle:
              params.vehicle ||
              'bike',

            pricingMode:
              'manual',

            userOffer:
              String(offerAmount),

            paymentMethod,

            note,
          },
        });
      } catch (error) {
        console.error(
          'RIDEX CREATE RIDE ERROR:',
          error,
        );

        Alert.alert(
          'Could not request ride',
          error instanceof Error
            ? error.message
            : 'Something went wrong. Please try again.',
        );
      } finally {
        setSubmitting(false);
      }
    };

  /* =========================================================================
     RENDER
     ========================================================================= */

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
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
        >

          {/* HEADER */}

          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() =>
                router.back()
              }
              disabled={submitting}
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

          {/* TRIP */}

          <View style={styles.tripCard}>
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
                  style={styles.dropLabel}
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

          {/* SUGGESTED FARE */}

          <View
            style={styles.suggestedCard}
          >
            <Image
              source={OFFER_CITY}
              style={styles.cityAsset}
              resizeMode="contain"
            />

            <Image
              source={OFFER_SCOOTER}
              style={styles.scooterAsset}
              resizeMode="contain"
            />

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
                style={
                  styles.suggestedAmount
                }
              >
                {minimumFare > 0
                  ? `${money(
                      minimumFare,
                    )} – ${money(
                      maximumFare,
                    )}`
                  : 'Calculating...'}
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
                  Choose an amount within the suggested range.
                </Text>
              </View>
            </View>
          </View>

          {/* OFFER */}

          <Text
            style={styles.sectionTitle}
          >
            How much would you like to offer?
          </Text>

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
                onChangeText={value =>
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
                editable={!submitting}
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
                    offerAmount ===
                      amount &&
                      styles.quickButtonActive,
                  ]}
                  onPress={() =>
                    setOffer(
                      String(amount),
                    )
                  }
                  disabled={submitting}
                >
                  <Text
                    style={[
                      styles.quickText,
                      offerAmount ===
                        amount &&
                        styles.quickTextActive,
                    ]}
                  >
                    ₹{amount}
                  </Text>
                </Pressable>
              ),
            )}
          </ScrollView>

          {/* PAYMENT */}

          <Text
            style={styles.paymentTitle}
          >
            Payment method
          </Text>

          {(
            [
              ['cash', 'Cash', 'Pay after the ride'],
              ['upi', 'UPI', 'Pay after the ride'],
            ] as const
          ).map(
            ([value, title, subtitle]) => (
              <Pressable
                key={value}
                style={styles.paymentCard}
                onPress={() =>
                  setPaymentMethod(
                    value,
                  )
                }
                disabled={submitting}
              >
                <View
                  style={
                    styles.paymentIcon
                  }
                >
                  <Ionicons
                    name={
                      value === 'cash'
                        ? 'cash-outline'
                        : 'phone-portrait-outline'
                    }
                    size={23}
                    color={COLORS.green}
                  />
                </View>

                <View
                  style={
                    styles.paymentContent
                  }
                >
                  <Text
                    style={
                      styles.paymentName
                    }
                  >
                    {title}
                  </Text>

                  <Text
                    style={
                      styles.paymentSub
                    }
                  >
                    {subtitle}
                  </Text>
                </View>

                <View
                  style={[
                    styles.radio,
                    paymentMethod ===
                      value &&
                      styles.radioActive,
                  ]}
                >
                  {paymentMethod ===
                    value && (
                    <View
                      style={
                        styles.radioInner
                      }
                    />
                  )}
                </View>
              </Pressable>
            ),
          )}

          {/* NOTE */}

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
              placeholder="e.g. I'm near the main road"
              placeholderTextColor={
                COLORS.muted
              }
              style={styles.noteInput}
              multiline
              maxLength={160}
              editable={!submitting}
            />
          </View>

          {/* SEND */}

          <Pressable
            style={[
              styles.sendButton,
              (
                offerAmount <= 0 ||
                submitting
              ) &&
                styles.sendButtonDisabled,
            ]}
            onPress={
              handleSendRequest
            }
            disabled={submitting}
          >
            {submitting ? (
              <View
                style={styles.loadingRow}
              >
                <ActivityIndicator
                  color={COLORS.white}
                />

                <Text
                  style={
                    styles.loadingText
                  }
                >
                  Requesting ride...
                </Text>
              </View>
            ) : (
              <>
                <View
                  style={styles.sendContent}
                >
                  <Text
                    style={styles.sendTitle}
                  >
                    Send Request to Riders
                  </Text>

                  <Text
                    style={
                      styles.sendSubtitle
                    }
                  >
                    Nearby riders will receive your request
                  </Text>
                </View>

                <Ionicons
                  name="arrow-forward"
                  size={36}
                  color={COLORS.white}
                />
              </>
            )}
          </Pressable>

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
              Your ride request is securely sent to the RIDEX backend.
            </Text>
          </View>

          <View
            style={styles.bottomSpace}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* =========================================================================
   STYLES
   ========================================================================= */

const styles =
  StyleSheet.create({
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

    tripCard: {
      backgroundColor: COLORS.white,
      borderRadius: 23,
      padding: 18,
      marginBottom: 15,
      elevation: 3,
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
      backgroundColor:
        COLORS.green,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pickupDotInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor:
        COLORS.white,
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
      backgroundColor:
        COLORS.red,
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

    divider: {
      height: 1,
      backgroundColor:
        COLORS.border,
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
      backgroundColor:
        COLORS.border,
    },

    suggestedCard: {
      minHeight: 190,
      borderRadius: 23,
      backgroundColor:
        COLORS.greenVerySoft,
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
      backgroundColor:
        COLORS.yellowSoft,
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

    sectionTitle: {
      marginBottom: 12,
      fontSize: 19,
      fontWeight: '800',
      color: COLORS.black,
    },

    offerBox: {
      minHeight: 78,
      backgroundColor:
        COLORS.white,
      borderRadius: 17,
      borderWidth: 1.5,
      borderColor:
        COLORS.border,
      paddingHorizontal: 17,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
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
      borderColor:
        COLORS.border,
      backgroundColor:
        COLORS.white,
      alignItems: 'center',
      justifyContent: 'center',
    },

    quickButtonActive: {
      backgroundColor:
        COLORS.greenSoft,
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

    paymentTitle: {
      marginTop: 20,
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
      borderColor:
        COLORS.border,
      backgroundColor:
        COLORS.white,
      flexDirection: 'row',
      alignItems: 'center',
    },

    paymentIcon: {
      width: 43,
      height: 43,
      borderRadius: 22,
      backgroundColor:
        COLORS.greenSoft,
      alignItems: 'center',
      justifyContent: 'center',
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
      backgroundColor:
        COLORS.green,
    },

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
      borderColor:
        COLORS.border,
      backgroundColor:
        COLORS.white,
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
      textAlignVertical:
        'center',
    },

    sendButton: {
      minHeight: 104,
      marginBottom: 17,
      paddingHorizontal: 18,
      borderRadius: 20,
      backgroundColor:
        COLORS.green,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
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

    loadingRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },

    loadingText: {
      fontSize: 16,
      fontWeight: '800',
      color: COLORS.white,
    },

    security: {
      minHeight: 64,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 16,
      backgroundColor:
        COLORS.blueSoft,
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