import React, { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

type RideRequest = {
  id: number;
  pickup: string;
  drop: string;
  distance: string;
  duration: string;
  fare: string;
  pickupDistance: string;
  payment: string;

  // Temporary mock coordinates.
  // These will come from Supabase later.
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
};

const INITIAL_REQUESTS: RideRequest[] = [
  {
    id: 1,
    pickup: 'Kanchikacherla',
    drop: 'Vijayawada Bus Stand',
    distance: '5.2 km',
    duration: '18 min',
    fare: '₹85',
    pickupDistance: '1.2 km away',
    payment: 'Cash',

    pickupLat: 16.5775,
    pickupLng: 80.3535,

    dropLat: 16.5169,
    dropLng: 80.6201,
  },

  {
    id: 2,
    pickup: 'Benz Circle',
    drop: 'Madhapur',
    distance: '4.8 km',
    duration: '20 min',
    fare: '₹92',
    pickupDistance: '2.1 km away',
    payment: 'Cash',

    pickupLat: 16.5062,
    pickupLng: 80.6480,

    dropLat: 17.4485,
    dropLng: 78.3908,
  },

  {
    id: 3,
    pickup: 'JNTU Metro Station',
    drop: 'Ameerpet',
    distance: '6.7 km',
    duration: '22 min',
    fare: '₹110',
    pickupDistance: '3.4 km away',
    payment: 'Cash',

    pickupLat: 17.4933,
    pickupLng: 78.3915,

    dropLat: 17.4375,
    dropLng: 78.4483,
  },
];

export default function RidesScreen() {
  const [isOnline, setIsOnline] = useState(true);

  const [autoAccept, setAutoAccept] = useState(true);

  const [requests, setRequests] =
    useState<RideRequest[]>(INITIAL_REQUESTS);

  const [counterRideId, setCounterRideId] =
    useState<number | null>(null);

  const [counterAmount, setCounterAmount] =
    useState('');

  const [sortLatest, setSortLatest] =
    useState(true);

  const sortedRequests = useMemo(() => {
    if (!sortLatest) {
      return requests;
    }

    return [...requests].sort((a, b) => b.id - a.id);
  }, [requests, sortLatest]);

  const acceptRide = (request: RideRequest) => {
    const continueToRide = () => {
      setRequests((current) =>
        current.filter(
          (item) => item.id !== request.id
        )
      );

      router.push({
        pathname: '/active-ride',
        params: {
          pickupAddress: request.pickup,
          destinationAddress: request.drop,

          pickupLat: String(request.pickupLat),
          pickupLng: String(request.pickupLng),

          destinationLat: String(request.dropLat),
          destinationLng: String(request.dropLng),

          fare: request.fare.replace('₹', ''),

          passengerName: 'Passenger',
        },
      });
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Accept this ride for ${request.fare}?`
      );

      if (confirmed) {
        continueToRide();
      }

      return;
    }

    Alert.alert(
      'Accept Ride',
      `Accept this ride for ${request.fare}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Accept',
          onPress: continueToRide,
        },
      ]
    );
  };

  const declineRide = (request: RideRequest) => {
    setRequests((current) =>
      current.filter(
        (item) => item.id !== request.id
      )
    );
  };

  const openCounterOffer = (request: RideRequest) => {
    setCounterRideId(request.id);

    setCounterAmount(
      request.fare.replace('₹', '')
    );
  };

  const submitCounterOffer = (request: RideRequest) => {
    const amount = Number(counterAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      if (Platform.OS === 'web') {
        window.alert('Please enter a valid fare.');
      } else {
        Alert.alert(
          'Invalid fare',
          'Please enter a valid fare.'
        );
      }

      return;
    }

    setCounterRideId(null);

    if (Platform.OS === 'web') {
      window.alert(
        `Counter offer of ₹${amount} sent to passenger.`
      );
    } else {
      Alert.alert(
        'Counter Offer Sent',
        `Your offer of ₹${amount} has been sent to the passenger.`
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            Ride Requests
          </Text>

          <View style={styles.onlineRow}>
            <View
              style={[
                styles.onlineDot,
                {
                  backgroundColor: isOnline
                    ? '#16A34A'
                    : '#9CA3AF',
                },
              ]}
            />

            <Text style={styles.onlineText}>
              {isOnline
                ? "You're Online"
                : "You're Offline"}
            </Text>
          </View>
        </View>

        <Switch
          value={isOnline}
          onValueChange={setIsOnline}
          trackColor={{
            false: '#D1D5DB',
            true: '#86EFAC',
          }}
          thumbColor={
            isOnline ? '#16A34A' : '#FFFFFF'
          }
        />
      </View>

      {/* ONLINE STATUS */}
      <View style={styles.statusCard}>
        <View style={styles.statusIcon}>
          <Ionicons
            name={
              isOnline
                ? 'radio'
                : 'radio-outline'
            }
            size={22}
            color={
              isOnline
                ? '#16A34A'
                : '#6B7280'
            }
          />
        </View>

        <View style={styles.statusContent}>
          <Text style={styles.statusTitle}>
            {isOnline
              ? 'Ready for rides'
              : 'You are offline'}
          </Text>

          <Text style={styles.statusSubtitle}>
            {isOnline
              ? 'You will receive nearby ride requests.'
              : 'Go online to receive ride requests.'}
          </Text>
        </View>

        <View
          style={[
            styles.onlineBadge,
            !isOnline && styles.offlineBadge,
          ]}
        >
          <Text
            style={[
              styles.onlineBadgeText,
              !isOnline &&
                styles.offlineBadgeText,
            ]}
          >
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </View>
      </View>

      {/* REQUEST HEADER */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            New Requests
          </Text>

          <Text style={styles.requestCount}>
            {requests.length}{' '}
            {requests.length === 1
              ? 'request'
              : 'requests'}{' '}
            nearby
          </Text>
        </View>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() =>
            setSortLatest((current) => !current)
          }
        >
          <Ionicons
            name="swap-vertical"
            size={16}
            color="#374151"
          />

          <Text style={styles.sortText}>
  {sortLatest ? 'Latest' : 'Nearest'}
</Text>
        </TouchableOpacity>
      </View>

      {/* AUTO ACCEPT */}
      <View style={styles.autoAcceptRow}>
        <View style={styles.autoAcceptLeft}>
          <View style={styles.autoAcceptIcon}>
            <Ionicons
              name="flash"
              size={16}
              color="#16A34A"
            />
          </View>

          <View>
            <Text style={styles.autoAcceptTitle}>
              Auto Accept
            </Text>

            <Text style={styles.autoAcceptSubtitle}>
              Automatically accept suitable rides
            </Text>
          </View>
        </View>

        <Switch
          value={autoAccept}
          onValueChange={setAutoAccept}
          trackColor={{
            false: '#D1D5DB',
            true: '#86EFAC',
          }}
          thumbColor={
            autoAccept
              ? '#16A34A'
              : '#FFFFFF'
          }
        />
      </View>

      {/* REQUESTS */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!isOnline ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="moon-outline"
                size={30}
                color="#6B7280"
              />
            </View>

            <Text style={styles.emptyTitle}>
              You're offline
            </Text>

            <Text style={styles.emptyText}>
              Go online to start receiving ride
              requests from passengers.
            </Text>

            <TouchableOpacity
              style={styles.goOnlineButton}
              onPress={() => setIsOnline(true)}
            >
              <Text style={styles.goOnlineText}>
                Go Online
              </Text>
            </TouchableOpacity>
          </View>
        ) : sortedRequests.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="checkmark-circle-outline"
                size={30}
                color="#16A34A"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No new requests
            </Text>

            <Text style={styles.emptyText}>
              You're all caught up. New ride
              requests will appear here.
            </Text>
          </View>
        ) : (
          sortedRequests.map((request, index) => (
            <View
              key={request.id}
              style={[
                styles.requestCard,
                index === 0 &&
                  styles.newRequestCard,
              ]}
            >
              {/* CARD TOP */}
              <View style={styles.cardTop}>
                <View style={styles.newBadge}>
                  <View style={styles.newBadgeDot} />

                  <Text style={styles.newBadgeText}>
                    {index === 0
                      ? 'NEW REQUEST'
                      : 'REQUEST'}
                  </Text>
                </View>

                <Text style={styles.pickupDistance}>
                  {request.pickupDistance}
                </Text>
              </View>

              {/* LOCATIONS */}
              <View style={styles.locationSection}>
                <View style={styles.timeline}>
                  <View style={styles.pickupDot} />

                  <View style={styles.timelineLine} />

                  <View style={styles.dropDot} />
                </View>

                <View style={styles.locationContent}>
                  <View style={styles.locationBlock}>
                    <Text style={styles.locationLabel}>
                      PICKUP
                    </Text>

                    <Text
                      style={styles.locationText}
                      numberOfLines={1}
                    >
                      {request.pickup}
                    </Text>
                  </View>

                  <View style={styles.locationBlock}>
                    <Text style={styles.locationLabel}>
                      DROP
                    </Text>

                    <Text
                      style={styles.locationText}
                      numberOfLines={1}
                    >
                      {request.drop}
                    </Text>
                  </View>
                </View>
              </View>

              {/* TRIP INFO */}
              <View style={styles.tripInfo}>
                <View style={styles.tripInfoItem}>
                  <Ionicons
                    name="navigate-outline"
                    size={17}
                    color="#6B7280"
                  />

                  <Text style={styles.tripInfoText}>
                    {request.distance}
                  </Text>
                </View>

                <View style={styles.infoDivider} />

                <View style={styles.tripInfoItem}>
                  <Ionicons
                    name="time-outline"
                    size={17}
                    color="#6B7280"
                  />

                  <Text style={styles.tripInfoText}>
                    {request.duration}
                  </Text>
                </View>

                <View style={styles.infoDivider} />

                <View style={styles.tripInfoItem}>
                  <Ionicons
                    name="cash-outline"
                    size={17}
                    color="#6B7280"
                  />

                  <Text style={styles.tripInfoText}>
                    {request.payment}
                  </Text>
                </View>
              </View>

              {/* FARE */}
              <View style={styles.fareSection}>
                <View>
                  <Text style={styles.fareLabel}>
                    PASSENGER OFFER
                  </Text>

                  <Text style={styles.fareText}>
                    {request.fare}
                  </Text>
                </View>

                <View style={styles.suggestedFare}>
                  <Text
                    style={styles.suggestedFareLabel}
                  >
                    SUGGESTED
                  </Text>

                  <Text
                    style={styles.suggestedFareValue}
                  >
                    {request.fare}
                  </Text>
                </View>
              </View>

              {/* COUNTER OFFER */}
              {counterRideId === request.id && (
                <View style={styles.counterSection}>
                  <View style={styles.counterHeader}>
                    <View>
                      <Text
                        style={styles.counterTitle}
                      >
                        Make a Counter Offer
                      </Text>

                      <Text
                        style={styles.counterSubtitle}
                      >
                        Enter the fare you want
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        setCounterRideId(null);
                        setCounterAmount('');
                      }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={23}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>

                  <View
                    style={styles.counterInputRow}
                  >
                    <Text style={styles.rupeeSymbol}>
                      ₹
                    </Text>

                    <TextInput
                      value={counterAmount}
                      onChangeText={setCounterAmount}
                      keyboardType="numeric"
                      placeholder="Enter amount"
                      placeholderTextColor="#9CA3AF"
                      style={styles.counterInput}
                      maxLength={5}
                    />

                    <TouchableOpacity
                      style={styles.sendCounterButton}
                      onPress={() =>
                        submitCounterOffer(request)
                      }
                    >
                      <Ionicons
                        name="send"
                        size={17}
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.sendCounterText
                        }
                      >
                        Send
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ACTIONS */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={() => declineRide(request)}
                >
                  <Text style={styles.declineText}>
                    Decline
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.counterButton}
                  onPress={() =>
                    openCounterOffer(request)
                  }
                >
                  <Text style={styles.counterButtonText}>
                    Counter Offer
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => acceptRide(request)}
                >
                  <Text style={styles.acceptText}>
                    Accept
                  </Text>

                  <Text style={styles.acceptFare}>
                    {request.fare}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.replace('/home')}
        >
          <Ionicons
            name="home-outline"
            size={22}
            color="#9CA3AF"
          />

          <Text style={styles.navLabel}>
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons
            name="wallet-outline"
            size={22}
            color="#9CA3AF"
          />

          <Text style={styles.navLabel}>
            Earnings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.centerNavButton}
          onPress={() => router.push('/rides')}
        >
          <Ionicons
            name="bicycle"
            size={27}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons
            name="chatbubble-outline"
            size={22}
            color="#9CA3AF"
          />

          <Text style={styles.navLabel}>
            Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons
            name="menu-outline"
            size={23}
            color="#9CA3AF"
          />

          <Text style={styles.navLabel}>
            More
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
  },

  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },

  onlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },

  statusCard: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 13,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusContent: {
    flex: 1,
    marginLeft: 11,
  },

  statusTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  statusSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 3,
  },

  onlineBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
  },

  offlineBadge: {
    backgroundColor: '#F3F4F6',
  },

  onlineBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#15803D',
  },

  offlineBadgeText: {
    color: '#6B7280',
  },

  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },

  requestCount: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 3,
  },

  sortButton: {
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  sortText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },

  autoAcceptRow: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  autoAcceptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  autoAcceptIcon: {
    width: 31,
    height: 31,
    borderRadius: 9,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  autoAcceptTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#166534',
    marginLeft: 9,
  },

  autoAcceptSubtitle: {
    fontSize: 10,
    color: '#65A30D',
    marginLeft: 9,
    marginTop: 2,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
  },

  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 15,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  newRequestCard: {
    borderColor: '#86EFAC',
    borderWidth: 1.5,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: '#DCFCE7',
  },

  newBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 5,
  },

  newBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#15803D',
  },

  pickupDistance: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },

  locationSection: {
    flexDirection: 'row',
  },

  timeline: {
    width: 25,
    alignItems: 'center',
    paddingTop: 3,
  },

  pickupDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: '#16A34A',
    backgroundColor: '#FFFFFF',
  },

  timelineLine: {
    width: 1.5,
    height: 30,
    backgroundColor: '#CBD5E1',
  },

  dropDot: {
    width: 11,
    height: 11,
    borderRadius: 2,
    backgroundColor: '#111827',
  },

  locationContent: {
    flex: 1,
    marginLeft: 4,
  },

  locationBlock: {
    minHeight: 49,
  },

  locationLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },

  locationText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginTop: 3,
  },

  tripInfo: {
    marginTop: 8,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  tripInfoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  tripInfoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },

  infoDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E5E7EB',
  },

  fareSection: {
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  fareLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },

  fareText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    marginTop: 2,
  },

  suggestedFare: {
    alignItems: 'flex-end',
  },

  suggestedFareLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#9CA3AF',
  },

  suggestedFareValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: 2,
  },

  counterSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 13,
    padding: 11,
    marginBottom: 11,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  counterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  counterTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },

  counterSubtitle: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },

  counterInputRow: {
    marginTop: 9,
    height: 43,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 11,
  },

  rupeeSymbol: {
    fontSize: 16,
    fontWeight: '800',
    color: '#374151',
  },

  counterInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    outlineStyle: 'none',
  } as any,

  sendCounterButton: {
    height: 35,
    paddingHorizontal: 11,
    marginRight: 4,
    borderRadius: 8,
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  sendCounterText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 7,
  },

  declineButton: {
    flex: 0.8,
    height: 46,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  declineText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },

  counterButton: {
    flex: 1.15,
    height: 46,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  counterButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#374151',
  },

  acceptButton: {
    flex: 1.15,
    height: 46,
    borderRadius: 11,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },

  acceptText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  acceptFare: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 25,
    paddingVertical: 38,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111827',
    marginTop: 13,
  },

  emptyText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 300,
  },

  goOnlineButton: {
    marginTop: 16,
    paddingHorizontal: 22,
    height: 42,
    borderRadius: 11,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  goOnlineText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  bottomSpace: {
    height: 15,
  },

  bottomNav: {
    height: 70,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
  },

  navItem: {
    width: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9CA3AF',
    marginTop: 4,
  },

  centerNavButton: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -25,
    borderWidth: 4,
    borderColor: '#F8FAFC',
    shadowOpacity: 0.2,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 6,
  },
});