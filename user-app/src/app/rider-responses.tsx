import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
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
import { getAuth } from '@react-native-firebase/auth';

/* =========================================================================
   CONFIG
   ========================================================================= */

const API_BASE_URL = 'http://10.134.158.132:3000';
const POLL_INTERVAL_MS = 3000;

/* =========================================================================
   COLORS
   ========================================================================= */

const COLORS = {
  green: '#079A4B',
  greenDark: '#05783A',
  greenSoft: '#EAF8F1',
  greenLight: '#DDF5E8',

  black: '#111820',
  gray: '#737C88',
  muted: '#9AA1AA',

  white: '#FFFFFF',
  background: '#FAFCFB',
  border: '#E5E9E7',

  red: '#EF3154',
  redSoft: '#FFF1F4',

  yellow: '#F3B51B',
  yellowSoft: '#FFF8DF',
};

/* =========================================================================
   TYPES
   ========================================================================= */

type RideOffer = {
  id: string;
  ride_request_id: string;
  rider_id: string;
  offer_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  display_name?: string | null;
  phone_number?: string | null;
};

type Ride = {
  id: string;
  passenger_id: string;

  pickup_name?: string | null;
  pickup_address?: string | null;

  drop_name?: string | null;
  drop_address?: string | null;

  vehicle_type?: string | null;

  passenger_offer?: number | null;
  agreed_fare?: number | null;

  payment_method?: string | null;
  note?: string | null;

  status: string;
  assigned_rider_id?: string | null;
  matched_at?: string | null;
};

/* =========================================================================
   HELPERS
   ========================================================================= */

const money = (value: number) =>
  `₹${Math.round(value)}`;

async function getFirebaseToken() {
  const user = getAuth().currentUser;

  if (!user) {
    throw new Error(
      'You are not logged in. Please login again.',
    );
  }

  return user.getIdToken();
}

async function apiRequest(
  path: string,
  options: RequestInit = {},
) {
  const token = await getFirebaseToken();

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await response.json();

  if (!response.ok || !data.success) {
    const error = new Error(
      data?.error ||
        data?.message ||
        'RIDEX API request failed.',
    ) as Error & {
      status?: number;
      data?: any;
    };

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

/* =========================================================================
   SCREEN
   ========================================================================= */

export default function RiderResponsesScreen() {
  const router = useRouter();

  const params =
    useLocalSearchParams<{
      rideId?: string;

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

      pricingMode?: string;

      pickupLat?: string;
      pickupLng?: string;
      dropLat?: string;
      dropLng?: string;
    }>();

  /* =========================================================================
     REQUEST DATA
     ========================================================================= */

  const pickupName =
    params.pickupName || 'Current Location';

  const pickupAddress =
    params.pickupAddress || '';

  const dropName =
    params.dropName || 'Destination';

  const dropAddress =
    params.dropAddress || '';

  const distanceText =
    params.distanceText || '—';

  const durationText =
    params.durationText || '—';

  const vehicleType =
    params.vehicle === 'auto'
      ? 'auto'
      : 'bike';

  const userOffer =
    Number(params.userOffer) || 0;

  const pricingMode =
    params.pricingMode === 'suggested'
      ? 'suggested'
      : 'manual';

  /* =========================================================================
     STATE
     ========================================================================= */

  const [rideId, setRideId] =
    useState(params.rideId || '');

  const [ride, setRide] =
    useState<Ride | null>(null);

  const [offers, setOffers] =
    useState<RideOffer[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [creatingRide, setCreatingRide] =
    useState(!params.rideId);

  const [acceptingOfferId, setAcceptingOfferId] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [selectedBoost, setSelectedBoost] =
    useState(0);

  const createdRef = useRef(false);
  const navigatingRef = useRef(false);

  /* =========================================================================
     ANIMATIONS
     ========================================================================= */

  const pulse = useRef(
    new Animated.Value(0),
  ).current;

  const pulse2 = useRef(
    new Animated.Value(0),
  ).current;

  const pulse3 = useRef(
    new Animated.Value(0),
  ).current;

  const contentOpacity = useRef(
    new Animated.Value(0),
  ).current;

  const contentTranslate = useRef(
    new Animated.Value(18),
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),

      Animated.timing(contentTranslate, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [
    contentOpacity,
    contentTranslate,
  ]);

  useEffect(() => {
    const createPulse = (
      value: Animated.Value,
      delay: number,
    ) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),

          Animated.parallel([
            Animated.timing(value, {
              toValue: 1,
              duration: 2200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),

          Animated.timing(value, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );

    const a = createPulse(pulse, 0);
    const b = createPulse(pulse2, 700);
    const c = createPulse(pulse3, 1400);

    a.start();
    b.start();
    c.start();

    return () => {
      a.stop();
      b.stop();
      c.stop();
    };
  }, [
    pulse,
    pulse2,
    pulse3,
  ]);

  const createRingStyle = (
    value: Animated.Value,
  ) => ({
    opacity: value.interpolate({
      inputRange: [0, 0.15, 1],
      outputRange: [0.65, 0.4, 0],
    }),

    transform: [
      {
        scale: value.interpolate({
          inputRange: [0, 1],
          outputRange: [0.7, 1.45],
        }),
      },
    ],
  });

  /* =========================================================================
     CREATE SUGGESTED RIDE
     ========================================================================= */

  const createSuggestedRide =
    useCallback(async () => {
      if (
        createdRef.current ||
        params.rideId
      ) {
        return;
      }

      createdRef.current = true;

      setCreatingRide(true);
      setLoading(true);
      setErrorMessage(null);

      try {
        const pickupLat =
          Number(params.pickupLat);

        const pickupLng =
          Number(params.pickupLng);

        const dropLat =
          Number(params.dropLat);

        const dropLng =
          Number(params.dropLng);

        if (
          !Number.isFinite(pickupLat) ||
          !Number.isFinite(pickupLng) ||
          !Number.isFinite(dropLat) ||
          !Number.isFinite(dropLng)
        ) {
          throw new Error(
            'Pickup or destination coordinates are missing.',
          );
        }

        if (userOffer <= 0) {
          throw new Error(
            'Suggested fare is unavailable.',
          );
        }

        const data = await apiRequest(
          '/api/rides',
          {
            method: 'POST',

            body: JSON.stringify({
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

              vehicleType,

              passengerOffer: userOffer,

              paymentMethod:
                params.paymentMethod ||
                'cash',

              note:
                params.note ||
                undefined,
            }),
          },
        );

        const newRide = data.ride;

        setRideId(String(newRide.id));
        setRide(newRide);
      } catch (error) {
        console.error(
          'RIDEX CREATE RIDE ERROR:',
          error,
        );

        createdRef.current = false;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Could not create ride.',
        );
      } finally {
        setCreatingRide(false);
        setLoading(false);
      }
    }, [
      params,
      pickupName,
      pickupAddress,
      dropName,
      dropAddress,
      vehicleType,
      userOffer,
    ]);

  useEffect(() => {
    if (
      !params.rideId &&
      pricingMode === 'suggested'
    ) {
      createSuggestedRide();
    }
  }, [
    params.rideId,
    pricingMode,
    createSuggestedRide,
  ]);

  /* =========================================================================
     LOAD RIDE
     ========================================================================= */

  const loadRide =
    useCallback(
      async (id: string) => {
        const data = await apiRequest(
          `/api/rides/${id}`,
        );

        const currentRide =
          data.ride as Ride;

        setRide(currentRide);

        return currentRide;
      },
      [],
    );

  /* =========================================================================
     LOAD OFFERS
     ========================================================================= */

  const loadOffers =
    useCallback(
      async (id: string) => {
        const data = await apiRequest(
          `/api/rides/${id}/offers`,
        );

        setOffers(
          Array.isArray(data.offers)
            ? data.offers
            : [],
        );
      },
      [],
    );

  /* =========================================================================
     MATCHED RIDE
     ========================================================================= */

  const navigateToMatchedRide =
    useCallback(
      async (currentRide: Ride) => {
        if (
          navigatingRef.current ||
          currentRide.status !== 'matched' ||
          !currentRide.assigned_rider_id
        ) {
          return;
        }

        navigatingRef.current = true;

        try {
          const finalFare =
            Number(
              currentRide.agreed_fare,
            ) || 0;

          router.replace({
            pathname: '/rider-on-way',

            params: {
              rideId:
                String(currentRide.id),

              pickupName,
              pickupAddress,

              dropName,
              dropAddress,

              distanceText,
              durationText,

              vehicle: vehicleType,

              userOffer:
                String(userOffer),

              finalFare:
                String(finalFare),

              riderId:
                String(
                  currentRide.assigned_rider_id,
                ),
            },
          });
        } catch (error) {
          navigatingRef.current = false;
          throw error;
        }
      },
      [
        router,
        pickupName,
        pickupAddress,
        dropName,
        dropAddress,
        distanceText,
        durationText,
        vehicleType,
        userOffer,
      ],
    );

  /* =========================================================================
     REALTIME-LIKE POLLING
     ========================================================================= */

  useEffect(() => {
    if (!rideId) {
      return;
    }

    let mounted = true;

    const refresh = async () => {
      try {
        const currentRide =
          await loadRide(rideId);

        if (!mounted) {
          return;
        }

        if (
          currentRide.status ===
          'matched'
        ) {
          await navigateToMatchedRide(
            currentRide,
          );

          return;
        }

        if (
          currentRide.status ===
          'cancelled'
        ) {
          setErrorMessage(
            'This ride was cancelled.',
          );
        }

        if (
          pricingMode === 'manual'
        ) {
          await loadOffers(rideId);
        }

        setLoading(false);
      } catch (error) {
        if (!mounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to refresh ride.',
        );

        setLoading(false);
      }
    };

    refresh();

    const interval =
      setInterval(
        refresh,
        POLL_INTERVAL_MS,
      );

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [
    rideId,
    pricingMode,
    loadRide,
    loadOffers,
    navigateToMatchedRide,
  ]);

  /* =========================================================================
     ACCEPT OFFER
     ========================================================================= */

  const handleAcceptOffer =
    async (offer: RideOffer) => {
      if (
        !rideId ||
        acceptingOfferId
      ) {
        return;
      }

      setAcceptingOfferId(offer.id);

      try {
        const data =
          await apiRequest(
            `/api/rides/${rideId}/offers/${offer.id}/accept`,
            {
              method: 'POST',
            },
          );

        const matchedRide =
          data.ride as Ride;

        setRide(matchedRide);

        await navigateToMatchedRide(
          matchedRide,
        );
      } catch (error: any) {
        console.error(
          'RIDEX ACCEPT OFFER ERROR:',
          error,
        );

        if (
          error?.status === 409
        ) {
          Alert.alert(
            'Ride no longer available',
            'Another rider has already accepted this ride.',
          );

          try {
            const currentRide =
              await loadRide(rideId);

            if (
              currentRide.status ===
              'matched'
            ) {
              await navigateToMatchedRide(
                currentRide,
              );
            } else {
              await loadOffers(rideId);
            }
          } catch {
            // UI already handled the error.
          }
        } else {
          Alert.alert(
            'Could not accept rider',
            error instanceof Error
              ? error.message
              : 'Please try again.',
          );
        }
      } finally {
        setAcceptingOfferId(null);
      }
    };

  /* =========================================================================
     CANCEL
     ========================================================================= */

  const handleCancelRide =
    () => {
      if (!rideId) {
        router.back();
        return;
      }

      Alert.alert(
        'Cancel ride request?',
        'Nearby riders will no longer be able to accept this request.',
        [
          {
            text: 'Keep waiting',
            style: 'cancel',
          },
          {
            text: 'Cancel Ride',
            style: 'destructive',
            onPress: async () => {
              try {
                await apiRequest(
                  `/api/rides/${rideId}/cancel`,
                  {
                    method: 'POST',
                  },
                );

                router.replace('/home');
              } catch (error) {
                Alert.alert(
                  'Could not cancel',
                  error instanceof Error
                    ? error.message
                    : 'Please try again.',
                );
              }
            },
          },
        ],
      );
    };

  /* =========================================================================
     OFFERS
     ========================================================================= */

  const pendingOffers =
    useMemo(
      () =>
        offers
          .filter(
            offer =>
              offer.status ===
              'pending',
          )
          .sort(
            (a, b) =>
              Number(
                a.offer_amount,
              ) -
              Number(
                b.offer_amount,
              ),
          ),
      [offers],
    );

  const bestOffer =
    pendingOffers.length
      ? Number(
          pendingOffers[0]
            .offer_amount,
        )
      : 0;

  /* =========================================================================
     RESPONSE DISPLAY
     ========================================================================= */

  /*
   * We intentionally do not invent a fake "32 riders" number.
   *
   * The current backend does not yet expose the total number of riders
   * notified/rejected for a ride.
   *
   * Once that backend metric exists, this section can display:
   * "5 of 32 riders haven't accepted yet".
   */

  const respondedCount =
    offers.length;

  const responseProgress =
    pricingMode === 'manual'
      ? Math.min(
          respondedCount / 5,
          1,
        )
      : 0;

  /* =========================================================================
     BOOST
     ========================================================================= */

  const boostOptions = [
    10,
    20,
    30,
    50,
  ];

  const boostedFare =
    userOffer + selectedBoost;

  const handleBoost =
    (amount: number) => {
      setSelectedBoost(
        previous =>
          previous === amount
            ? 0
            : amount,
      );
    };

  /* =========================================================================
     UI
     ========================================================================= */

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
        <Animated.View
          style={{
            opacity:
              contentOpacity,
            transform: [
              {
                translateY:
                  contentTranslate,
              },
            ],
          }}
        >
          {/* ===============================================================
             HEADER
          =============================================================== */}

          <View
            style={styles.header}
          >
            <Pressable
              style={
                styles.backButton
              }
              onPress={() =>
                router.back()
              }
            >
              <Ionicons
                name="arrow-back"
                size={27}
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
                Finding Riders
              </Text>

              <View
                style={
                  styles.liveRow
                }
              >
                <View
                  style={
                    styles.liveDot
                  }
                />

                <Text
                  style={
                    styles.liveText
                  }
                >
                  {ride?.status ===
                  'matched'
                    ? 'Ride matched'
                    : 'Connecting you with nearby riders'}
                </Text>
              </View>
            </View>

            <View
              style={
                styles.safeBadge
              }
            >
              <Ionicons
                name="shield-checkmark"
                size={21}
                color={
                  COLORS.green
                }
              />

              <Text
                style={
                  styles.safeText
                }
              >
                Safe
              </Text>
            </View>
          </View>

          {/* ===============================================================
             TRIP SUMMARY
          =============================================================== */}

          <View
            style={
              styles.summaryCard
            }
          >
            <View
              style={
                styles.routeColumn
              }
            >
              <View
                style={
                  styles.routeRow
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
                  >
                    <View
                      style={
                        styles.pickupDotInner
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.routeLine
                    }
                  />
                </View>

                <View
                  style={
                    styles.routeContent
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
                    {pickupAddress ||
                      'Pickup location'}
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.routeRow
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
                  >
                    <Ionicons
                      name="location"
                      size={14}
                      color={
                        COLORS.white
                      }
                    />
                  </View>
                </View>

                <View
                  style={
                    styles.routeContent
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
                    {dropAddress ||
                      'Destination'}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={
                styles.tripStats
              }
            >
              <View
                style={
                  styles.statRow
                }
              >
                <Ionicons
                  name="navigate-outline"
                  size={19}
                  color={
                    COLORS.gray
                  }
                />

                <Text
                  style={
                    styles.statText
                  }
                >
                  {distanceText}
                </Text>
              </View>

              <View
                style={
                  styles.statRow
                }
              >
                <Ionicons
                  name="time-outline"
                  size={19}
                  color={
                    COLORS.gray
                  }
                />

                <Text
                  style={
                    styles.statText
                  }
                >
                  {durationText}
                </Text>
              </View>

              <View
                style={
                  styles.statDivider
                }
              />

              <Text
                style={
                  styles.fareLabel
                }
              >
                Your fare
              </Text>

              <Text
                style={
                  styles.fareAmount
                }
              >
                {money(
                  selectedBoost
                    ? boostedFare
                    : userOffer,
                )}
              </Text>
            </View>
          </View>

          {/* ===============================================================
             RADAR
          =============================================================== */}

          <View
            style={
              styles.searchSection
            }
          >
            <View
              style={
                styles.radar
              }
            >
              <Animated.View
                style={[
                  styles.radarRing,
                  createRingStyle(
                    pulse3,
                  ),
                ]}
              />

              <Animated.View
                style={[
                  styles.radarRing,
                  createRingStyle(
                    pulse2,
                  ),
                ]}
              />

              <Animated.View
                style={[
                  styles.radarRing,
                  createRingStyle(
                    pulse,
                  ),
                ]}
              />

              <View
                style={
                  styles.radarSoft
                }
              />

              <View
                style={
                  styles.radarCenter
                }
              >
                <Ionicons
                  name="location"
                  size={28}
                  color={
                    COLORS.white
                  }
                />
              </View>

              <View
                style={[
                  styles.vehicleBubble,
                  styles.vehicleOne,
                ]}
              >
                <Ionicons
                  name={
                    vehicleType ===
                    'bike'
                      ? 'bicycle'
                      : 'car'
                  }
                  size={21}
                  color={
                    COLORS.green
                  }
                />
              </View>

              <View
                style={[
                  styles.vehicleBubble,
                  styles.vehicleTwo,
                ]}
              >
                <Ionicons
                  name="car"
                  size={20}
                  color={
                    COLORS.green
                  }
                />
              </View>

              <View
                style={[
                  styles.vehicleBubble,
                  styles.vehicleThree,
                ]}
              >
                <Ionicons
                  name="bicycle"
                  size={19}
                  color={
                    COLORS.green
                  }
                />
              </View>
            </View>

            <Text
              style={
                styles.searchTitle
              }
            >
              Finding a rider for you…
            </Text>

            <Text
              style={
                styles.searchSubtitle
              }
            >
              We're checking nearby riders now.
            </Text>
          </View>

          {/* ===============================================================
             RESPONSE PROGRESS
          =============================================================== */}

          <View
            style={
              styles.responseCard
            }
          >
            <View
              style={
                styles.responseHeader
              }
            >
              <View
                style={
                  styles.responseIcon
                }
              >
                <Ionicons
                  name="radio-outline"
                  size={21}
                  color={
                    COLORS.green
                  }
                />
              </View>

              <View
                style={
                  styles.responseHeaderText
                }
              >
                <Text
                  style={
                    styles.responseTitle
                  }
                >
                  {pricingMode ===
                  'manual'
                    ? respondedCount > 0
                      ? `${respondedCount} rider${
                          respondedCount ===
                          1
                            ? ''
                            : 's'
                        } responded`
                      : 'Waiting for rider responses'
                    : 'Riders are being notified'}
                </Text>

                <Text
                  style={
                    styles.responseSubtitle
                  }
                >
                  {pricingMode ===
                  'manual'
                    ? 'Riders can accept or send a counter-offer.'
                    : 'The first eligible rider to accept will be matched.'}
                </Text>
              </View>
            </View>

            <View
              style={
                styles.progressTrack
              }
            >
              {pricingMode ===
              'manual' ? (
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.max(
                        responseProgress *
                          100,
                        8,
                      )}%`,
                    },
                  ]}
                />
              ) : (
                <Animated.View
                  style={[
                    styles.indeterminateBar,
                    {
                      transform: [
                        {
                          translateX:
                            pulse.interpolate(
                              {
                                inputRange: [
                                  0,
                                  1,
                                ],
                                outputRange: [
                                  -90,
                                  260,
                                ],
                              },
                            ),
                        },
                      ],
                    },
                  ]}
                />
              )}
            </View>

            <Text
              style={
                styles.progressHint
              }
            >
              {pricingMode ===
              'manual'
                ? respondedCount > 0
                  ? 'More riders may respond shortly.'
                  : 'Sending your request to nearby riders…'
                : 'Searching your area for an available rider…'}
            </Text>
          </View>

          {/* ===============================================================
             BOOST
          =============================================================== */}

          <View
            style={
              styles.boostCard
            }
          >
            <View
              style={
                styles.boostHeader
              }
            >
              <View
                style={
                  styles.boostIcon
                }
              >
                <Ionicons
                  name="flash"
                  size={21}
                  color={
                    COLORS.yellow
                  }
                />
              </View>

              <View
                style={
                  styles.boostHeaderText
                }
              >
                <Text
                  style={
                    styles.boostTitle
                  }
                >
                  Need a ride faster?
                </Text>

                <Text
                  style={
                    styles.boostSubtitle
                  }
                >
                  Add a little extra to attract more riders.
                </Text>
              </View>
            </View>

            <View
              style={
                styles.boostOptions
              }
            >
              {boostOptions.map(
                amount => {
                  const selected =
                    selectedBoost ===
                    amount;

                  return (
                    <Pressable
                      key={
                        amount
                      }
                      onPress={() =>
                        handleBoost(
                          amount,
                        )
                      }
                      style={[
                        styles.boostOption,
                        selected &&
                          styles.boostOptionSelected,
                      ]}
                    >
                      {amount ===
                        30 && (
                        <View
                          style={
                            styles.popularBadge
                          }
                        >
                          <Text
                            style={
                              styles.popularText
                            }
                          >
                            POPULAR
                          </Text>
                        </View>
                      )}

                      <Text
                        style={[
                          styles.boostAmount,
                          selected &&
                            styles.boostAmountSelected,
                        ]}
                      >
                        +₹{amount}
                      </Text>

                      <Text
                        style={[
                          styles.boostSmall,
                          selected &&
                            styles.boostSmallSelected,
                        ]}
                      >
                        {amount ===
                        10
                          ? 'Faster'
                          : amount ===
                              20
                            ? 'More riders'
                            : amount ===
                                30
                              ? 'High chance'
                              : 'Best chance'}
                      </Text>
                    </Pressable>
                  );
                },
              )}
            </View>

            {selectedBoost >
              0 && (
              <Pressable
                style={
                  styles.boostCta
                }
                onPress={() => {
                  /*
                   * IMPORTANT:
                   * This UI selection is ready.
                   * The backend boost endpoint should
                   * be implemented before this changes
                   * the real ride fare.
                   */
                  Alert.alert(
                    'Boost selected',
                    `Your boosted fare is ${money(
                      boostedFare,
                    )}. The ride boost backend will be connected in the next step.`,
                  );
                }}
              >
                <Ionicons
                  name="flash"
                  size={20}
                  color={
                    COLORS.white
                  }
                />

                <Text
                  style={
                    styles.boostCtaText
                  }
                >
                  Boost to{' '}
                  {money(
                    boostedFare,
                  )}
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={19}
                  color={
                    COLORS.white
                  }
                />
              </Pressable>
            )}
          </View>

          {/* ===============================================================
             MANUAL OFFERS
          =============================================================== */}

          {pricingMode ===
            'manual' &&
            pendingOffers.length >
              0 && (
              <View
                style={
                  styles.offersSection
                }
              >
                <View
                  style={
                    styles.offersHeading
                  }
                >
                  <Text
                    style={
                      styles.offersTitle
                    }
                  >
                    Rider offers
                  </Text>

                  <View
                    style={
                      styles.offerCount
                    }
                  >
                    <Text
                      style={
                        styles.offerCountText
                      }
                    >
                      {
                        pendingOffers.length
                      }
                    </Text>
                  </View>
                </View>

                {pendingOffers.map(
                  (
                    offer,
                    index,
                  ) => {
                    const amount =
                      Number(
                        offer.offer_amount,
                      );

                    const isBest =
                      amount ===
                      bestOffer;

                    const accepting =
                      acceptingOfferId ===
                      offer.id;

                    const riderName =
                      offer.display_name ||
                      'RIDEX Rider';

                    const initials =
                      riderName
                        .split(
                          ' ',
                        )
                        .map(
                          part =>
                            part[0],
                        )
                        .join('')
                        .slice(
                          0,
                          2,
                        )
                        .toUpperCase();

                    return (
                      <View
                        key={
                          offer.id
                        }
                        style={
                          styles.offerCard
                        }
                      >
                        <View
                          style={
                            styles.offerTop
                          }
                        >
                          <View
                            style={
                              styles.avatar
                            }
                          >
                            <Text
                              style={
                                styles.avatarText
                              }
                            >
                              {
                                initials
                              }
                            </Text>
                          </View>

                          <View
                            style={
                              styles.riderInfo
                            }
                          >
                            <View
                              style={
                                styles.riderNameRow
                              }
                            >
                              <Text
                                style={
                                  styles.riderName
                                }
                              >
                                {
                                  riderName
                                }
                              </Text>

                              {isBest && (
                                <View
                                  style={
                                    styles.bestBadge
                                  }
                                >
                                  <Text
                                    style={
                                      styles.bestBadgeText
                                    }
                                  >
                                    Best
                                  </Text>
                                </View>
                              )}
                            </View>

                            <Text
                              style={
                                styles.riderMeta
                              }
                            >
                              {vehicleType ===
                              'bike'
                                ? 'Bike rider'
                                : 'Auto rider'}
                            </Text>
                          </View>

                          <Text
                            style={
                              styles.offerPrice
                            }
                          >
                            {money(
                              amount,
                            )}
                          </Text>
                        </View>

                        <Pressable
                          style={
                            styles.acceptButton
                          }
                          onPress={() =>
                            handleAcceptOffer(
                              offer,
                            )
                          }
                          disabled={
                            !!acceptingOfferId
                          }
                        >
                          {accepting ? (
                            <ActivityIndicator
                              color={
                                COLORS.white
                              }
                            />
                          ) : (
                            <>
                              <Text
                                style={
                                  styles.acceptText
                                }
                              >
                                Accept Rider
                              </Text>

                              <Ionicons
                                name="checkmark"
                                size={20}
                                color={
                                  COLORS.white
                                }
                              />
                            </>
                          )}
                        </Pressable>
                      </View>
                    );
                  },
                )}
              </View>
            )}

          {/* ===============================================================
             WAITING STATE
          =============================================================== */}

          {pricingMode ===
            'suggested' && (
            <View
              style={
                styles.waitingRow
              }
            >
              <View
                style={
                  styles.waitingDot
                }
              />

              <Text
                style={
                  styles.waitingText
                }
              >
                Keep this screen open while we find your rider.
              </Text>
            </View>
          )}

          {/* ===============================================================
             CANCEL
          =============================================================== */}

          <Pressable
            style={
              styles.cancelButton
            }
            onPress={
              handleCancelRide
            }
          >
            <Ionicons
              name="close"
              size={21}
              color={
                COLORS.red
              }
            />

            <Text
              style={
                styles.cancelText
              }
            >
              Cancel Ride Request
            </Text>
          </Pressable>

          <View
            style={
              styles.bottomSpace
            }
          />
        </Animated.View>
      </ScrollView>
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

    screen: {
      flex: 1,
    },

    content: {
      paddingHorizontal: 18,
      paddingTop: 4,
      paddingBottom: 30,
    },

    /* HEADER */

    header: {
      minHeight: 76,
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
      paddingHorizontal: 5,
    },

    headerTitle: {
      fontSize: 23,
      fontWeight: '900',
      color: COLORS.black,
    },

    liveRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 3,
      gap: 6,
    },

    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#45D995',
    },

    liveText: {
      fontSize: 11,
      color: COLORS.gray,
    },

    safeBadge: {
      width: 48,
      alignItems: 'center',
    },

    safeText: {
      marginTop: 1,
      fontSize: 9,
      fontWeight: '700',
      color: COLORS.gray,
    },

    /* SUMMARY */

    summaryCard: {
      backgroundColor:
        COLORS.white,
      borderRadius: 22,
      padding: 16,
      flexDirection: 'row',
      borderWidth: 1,
      borderColor:
        COLORS.border,
      marginBottom: 12,
    },

    routeColumn: {
      flex: 1,
    },

    routeRow: {
      flexDirection: 'row',
      minHeight: 67,
    },

    timeline: {
      width: 27,
      alignItems: 'center',
      position: 'relative',
    },

    pickupDot: {
      width: 21,
      height: 21,
      borderRadius: 11,
      backgroundColor:
        COLORS.green,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pickupDotInner: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor:
        COLORS.white,
    },

    routeLine: {
      position: 'absolute',
      top: 23,
      bottom: -4,
      borderLeftWidth: 2,
      borderStyle: 'dashed',
      borderColor:
        '#B4DFC7',
    },

    dropDot: {
      width: 21,
      height: 21,
      borderRadius: 11,
      backgroundColor:
        COLORS.red,
      alignItems: 'center',
      justifyContent: 'center',
    },

    routeContent: {
      flex: 1,
      paddingLeft: 9,
    },

    pickupLabel: {
      fontSize: 12,
      fontWeight: '800',
      color: COLORS.green,
    },

    dropLabel: {
      fontSize: 12,
      fontWeight: '800',
      color: COLORS.red,
    },

    locationName: {
      marginTop: 2,
      fontSize: 16,
      fontWeight: '800',
      color: COLORS.black,
    },

    locationAddress: {
      marginTop: 2,
      fontSize: 11,
      color: COLORS.gray,
    },

    tripStats: {
      width: 91,
      borderLeftWidth: 1,
      borderLeftColor:
        COLORS.border,
      paddingLeft: 12,
      justifyContent:
        'center',
    },

    statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 7,
    },

    statText: {
      fontSize: 12,
      fontWeight: '700',
      color: COLORS.black,
    },

    statDivider: {
      height: 1,
      backgroundColor:
        COLORS.border,
      marginVertical: 5,
    },

    fareLabel: {
      fontSize: 10,
      color: COLORS.gray,
    },

    fareAmount: {
      marginTop: 1,
      fontSize: 22,
      fontWeight: '900',
      color: COLORS.green,
    },

    /* RADAR */

    searchSection: {
      alignItems: 'center',
      paddingTop: 4,
      paddingBottom: 10,
    },

    radar: {
      width: 245,
      height: 210,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },

    radarRing: {
      position: 'absolute',
      width: 160,
      height: 160,
      borderRadius: 80,
      borderWidth: 1.5,
      borderColor:
        '#7FE1AC',
      backgroundColor:
        'rgba(115, 224, 164, 0.06)',
    },

    radarSoft: {
      position: 'absolute',
      width: 122,
      height: 122,
      borderRadius: 61,
      backgroundColor:
        'rgba(115, 224, 164, 0.13)',
    },

    radarCenter: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor:
        COLORS.green,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 5,
      shadowOpacity: 0.15,
      shadowRadius: 10,
      shadowOffset: {
        width: 0,
        height: 4,
      },
    },

    vehicleBubble: {
      position: 'absolute',
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        COLORS.white,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 3,
      shadowOpacity: 0.08,
      shadowRadius: 7,
      shadowOffset: {
        width: 0,
        height: 3,
      },
    },

    vehicleOne: {
      top: 28,
      left: 36,
    },

    vehicleTwo: {
      right: 27,
      top: 91,
    },

    vehicleThree: {
      bottom: 17,
      left: 72,
    },

    searchTitle: {
      marginTop: -2,
      fontSize: 21,
      fontWeight: '900',
      color: COLORS.black,
    },

    searchSubtitle: {
      marginTop: 4,
      fontSize: 12,
      color: COLORS.gray,
    },

    /* RESPONSE */

    responseCard: {
      backgroundColor:
        COLORS.white,
      borderRadius: 19,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      padding: 15,
      marginBottom: 12,
    },

    responseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    responseIcon: {
      width: 43,
      height: 43,
      borderRadius: 22,
      backgroundColor:
        COLORS.greenSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },

    responseHeaderText: {
      flex: 1,
      marginLeft: 11,
    },

    responseTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: COLORS.black,
    },

    responseSubtitle: {
      marginTop: 3,
      fontSize: 11,
      color: COLORS.gray,
    },

    progressTrack: {
      height: 9,
      marginTop: 14,
      borderRadius: 5,
      overflow: 'hidden',
      backgroundColor:
        '#E9ECEB',
    },

    progressFill: {
      height: '100%',
      borderRadius: 5,
      backgroundColor:
        COLORS.green,
    },

    indeterminateBar: {
      height: '100%',
      width: 90,
      borderRadius: 5,
      backgroundColor:
        COLORS.green,
    },

    progressHint: {
      marginTop: 7,
      textAlign: 'center',
      fontSize: 10,
      color: COLORS.gray,
    },

    /* BOOST */
boostCard: {
  backgroundColor:
    '#F0FAF4',
      borderRadius: 20,
      borderWidth: 1,
      borderColor:
        '#D7EFE1',
      padding: 14,
      marginBottom: 12,
    },

    boostHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    boostIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor:
        COLORS.yellowSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },

    boostHeaderText: {
      flex: 1,
      marginLeft: 10,
    },

    boostTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: COLORS.black,
    },

    boostSubtitle: {
      marginTop: 2,
      fontSize: 11,
      color: COLORS.gray,
    },

    boostOptions: {
      flexDirection: 'row',
      gap: 7,
      marginTop: 13,
    },

    boostOption: {
      flex: 1,
      minHeight: 63,
      borderRadius: 14,
      backgroundColor:
        COLORS.white,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 6,
    },

    boostOptionSelected: {
      borderColor:
        COLORS.green,
      backgroundColor:
        COLORS.greenSoft,
      borderWidth: 2,
    },

    popularBadge: {
      position: 'absolute',
      top: -8,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor:
        COLORS.green,
    },

    popularText: {
      fontSize: 7,
      fontWeight: '900',
      color: COLORS.white,
    },

    boostAmount: {
      fontSize: 15,
      fontWeight: '900',
      color: COLORS.black,
    },

    boostAmountSelected: {
      color: COLORS.greenDark,
    },

    boostSmall: {
      marginTop: 2,
      fontSize: 8,
      color: COLORS.gray,
    },

    boostSmallSelected: {
      color: COLORS.green,
    },

    boostCta: {
      height: 48,
      borderRadius: 14,
      marginTop: 12,
      backgroundColor:
        COLORS.greenDark,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },

    boostCtaText: {
      fontSize: 14,
      fontWeight: '900',
      color: COLORS.white,
    },

    /* OFFERS */

    offersSection: {
      marginTop: 2,
      marginBottom: 6,
    },

    offersHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginBottom: 9,
    },

    offersTitle: {
      fontSize: 19,
      fontWeight: '900',
      color: COLORS.black,
    },

    offerCount: {
      minWidth: 30,
      height: 30,
      paddingHorizontal: 8,
      borderRadius: 15,
      backgroundColor:
        COLORS.greenSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },

    offerCountText: {
      fontSize: 13,
      fontWeight: '900',
      color: COLORS.green,
    },

    offerCard: {
      backgroundColor:
        COLORS.white,
      borderRadius: 17,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      padding: 13,
      marginBottom: 9,
    },

    offerTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    avatar: {
      width: 43,
      height: 43,
      borderRadius: 22,
      backgroundColor:
        COLORS.greenSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },

    avatarText: {
      fontSize: 14,
      fontWeight: '900',
      color: COLORS.greenDark,
    },

    riderInfo: {
      flex: 1,
      marginLeft: 10,
    },

    riderNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    riderName: {
      fontSize: 14,
      fontWeight: '800',
      color: COLORS.black,
    },

    riderMeta: {
      marginTop: 3,
      fontSize: 10,
      color: COLORS.gray,
    },

    bestBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor:
        COLORS.greenSoft,
    },

    bestBadgeText: {
      fontSize: 8,
      fontWeight: '900',
      color: COLORS.green,
    },

    offerPrice: {
      fontSize: 21,
      fontWeight: '900',
      color: COLORS.green,
    },

    acceptButton: {
      height: 43,
      borderRadius: 12,
      backgroundColor:
        COLORS.green,
      marginTop: 11,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 7,
    },

    acceptText: {
      fontSize: 13,
      fontWeight: '900',
      color: COLORS.white,
    },

    /* WAITING */

    waitingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 15,
      marginBottom: 13,
    },

    waitingDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor:
        COLORS.green,
      marginRight: 7,
    },

    waitingText: {
      fontSize: 10,
      color: COLORS.gray,
    },

    /* CANCEL */

    cancelButton: {
      height: 50,
      borderRadius: 15,
      borderWidth: 1.5,
      borderColor:
        COLORS.red,
      backgroundColor:
        COLORS.redSoft,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
    },

    cancelText: {
      fontSize: 14,
      fontWeight: '800',
      color: COLORS.red,
    },

    bottomSpace: {
      height: 20,
    },
  });