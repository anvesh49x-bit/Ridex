import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
const trips = [
  {
    time: 'Today, 8:42 PM',
    from: 'Kanchikacherla',
    to: 'Vijayawada Bus Stand',
    distance: '5.2 km',
    duration: '18 min',
    amount: '₹85',
  },
  {
    time: 'Today, 7:15 PM',
    from: 'Madhapur',
    to: 'Hitech City',
    distance: '3.8 km',
    duration: '14 min',
    amount: '₹62',
  },
  {
    time: 'Today, 5:48 PM',
    from: 'JNTU Metro Station',
    to: 'Ameerpet',
    distance: '6.7 km',
    duration: '22 min',
    amount: '₹96',
  },
  {
    time: 'Today, 4:12 PM',
    from: 'Secunderabad',
    to: 'Paradise Circle',
    distance: '4.5 km',
    duration: '16 min',
    amount: '₹75',
  },
];

export default function Home() {
  const [online, setOnline] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.root}>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >

          {/* HEADER */}
          <View style={styles.header}>

            <TouchableOpacity style={styles.menuButton}>
              <Ionicons name="menu" size={32} color="#101820" />
            </TouchableOpacity>

            <View style={styles.onlineTitle}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: online ? '#008A38' : '#98A2B3' },
                ]}
              />

              <Text style={styles.onlineTitleText}>
                {online ? "You're Online" : "You're Offline"}
              </Text>
            </View>

            <View style={styles.headerRight}>

              <View
                style={[
                  styles.onlineControl,
                  online && styles.onlineControlActive,
                ]}
              >
                <Ionicons
                  name="bicycle"
                  size={19}
                  color={online ? '#FFFFFF' : '#667085'}
                />

                <Switch
                  value={online}
                  onValueChange={setOnline}
                  trackColor={{
                    false: '#E5E7EB',
                    true: '#008A38',
                  }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E5E7EB"
                />

                <Text
                  style={[
                    styles.onlineText,
                    !online && styles.offlineText,
                  ]}
                >
                  {online ? 'Online' : 'Offline'}
                </Text>
              </View>

              <TouchableOpacity style={styles.notificationButton}>
                <Ionicons
                  name="notifications-outline"
                  size={31}
                  color="#101820"
                />

                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>3</Text>
                </View>
              </TouchableOpacity>

            </View>
          </View>

          {/* EARNINGS CARD */}
          <TouchableOpacity style={styles.earningsCard} activeOpacity={0.9}>

            <View style={styles.earningsContent}>
              <Text style={styles.earningsLabel}>
                Today's Earnings
              </Text>

              <Text style={styles.earningsAmount}>
                ₹1,245
              </Text>

              <View style={styles.completedRow}>
                <Text style={styles.completedText}>
                  6 Rides Completed
                </Text>

                <View style={styles.roundArrow}>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#FFFFFF"
                  />
                </View>
              </View>
            </View>

            {/* Wallet illustration */}
            <View style={styles.walletArea}>

              <Ionicons
                name="trending-up"
                size={85}
                color="rgba(255,255,255,0.08)"
                style={styles.trendIcon}
              />

              <View style={styles.walletBack}>
                <View style={styles.walletCardLine} />
                <View style={styles.walletCardLineSmall} />
              </View>

              <View style={styles.wallet}>
                <View style={styles.walletTop} />

                <View style={styles.walletButton}>
                  <View style={styles.walletButtonInner} />
                </View>
              </View>

              <View style={[styles.coin, styles.coin1]}>
                <Text style={styles.coinText}>₹</Text>
              </View>

              <View style={[styles.coin, styles.coin2]}>
                <Text style={styles.coinText}>₹</Text>
              </View>

              <View style={[styles.coin, styles.coin3]}>
                <Text style={styles.coinText}>₹</Text>
              </View>

            </View>
          </TouchableOpacity>

          {/* SUMMARY */}
          <View style={styles.card}>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Today's Summary
              </Text>

              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAll}>
                  View all
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color="#344054"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.summaryRow}>

              <SummaryItem
                icon="navigate-outline"
                iconColor="#008A38"
                iconBg="#ECF8F0"
                label="Distance"
                value="48.6"
                suffix=" km"
              />

              <SummaryDivider />

              <SummaryItem
                icon="time-outline"
                iconColor="#1260D6"
                iconBg="#EEF5FF"
                label="Online Time"
                value="06h 32m"
              />

              <SummaryDivider />

              <SummaryItem
                icon="cash-outline"
                iconColor="#F39A00"
                iconBg="#FFF6E8"
                label="Cash Collected"
                value="₹980"
              />

              <SummaryDivider />

              <SummaryItem
                icon="arrow-up-circle-outline"
                iconColor="#7434C6"
                iconBg="#F5EEFF"
                label="Avg. Earnings"
                value="₹207"
                suffix="/ride"
              />

            </View>
          </View>

          {/* QUICK ACTIONS */}
          <View style={styles.quickActions}>

            <QuickAction
              icon="bicycle"
              iconColor="#008A38"
              iconBg="#ECF8F0"
              title="Ride Requests"
              subtitle="New requests"
            />

            <QuickAction
              icon="bar-chart-outline"
              iconColor="#1260D6"
              iconBg="#EEF5FF"
              title="Earnings"
              subtitle="View details"
            />

            <QuickAction
              icon="time-outline"
              iconColor="#7434C6"
              iconBg="#F5EEFF"
              title="Ride History"
              subtitle="Past trips"
            />

            <QuickAction
              icon="person"
              iconColor="#E63956"
              iconBg="#FFECEF"
              title="Profile"
              subtitle="View & edit"
            />

          </View>

          {/* RECENT TRIPS */}
          <View style={styles.card}>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Recent Trips
              </Text>

              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAll}>
                  View all
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color="#344054"
                />
              </TouchableOpacity>
            </View>

            {trips.map((trip, index) => (
              <TripCard
                key={index}
                trip={trip}
              />
            ))}

          </View>

          {/* INCENTIVE */}
          <TouchableOpacity style={styles.incentiveCard}>

            <View style={styles.trophyCircle}>
              <Ionicons
                name="trophy"
                size={23}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.incentiveText}>
              <Text style={styles.incentiveTitle}>
                Complete 10 rides today
              </Text>

              <Text style={styles.incentiveSubtitle}>
                Earn extra ₹150 incentive
              </Text>
            </View>

            <View style={styles.progressArea}>
              <Text style={styles.progressText}>
                6 / 10
              </Text>

              <View style={styles.progressBackground}>
                <View style={styles.progressFill} />
              </View>
            </View>

            <Ionicons
              name="chevron-forward"
              size={22}
              color="#344054"
            />

          </TouchableOpacity>

          <View style={{ height: 100 }} />

        </ScrollView>

        {/* BOTTOM NAV */}
        <View style={styles.bottomNav}>

          <BottomItem
            icon="home"
            label="Home"
            active
          />

          <BottomItem
            icon="wallet-outline"
            label="Earnings"
          />

         <View style={styles.centerWrapper}>
  <TouchableOpacity
    style={styles.centerButton}
    onPress={() => router.push('/rides')}
  >
    <Ionicons
      name="bicycle"
      size={30}
      color="#FFFFFF"
    />
  </TouchableOpacity>

            <Text style={styles.centerLabel}>
              Rides
            </Text>
          </View>

          <BottomItem
            icon="chatbubble-ellipses-outline"
            label="Messages"
            badge="2"
          />

          <BottomItem
            icon="grid-outline"
            label="More"
          />

        </View>
      </View>
    </SafeAreaView>
  );
}

/* SUMMARY ITEM */

function SummaryItem({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  suffix,
}: any) {
  return (
    <View style={styles.summaryItem}>

      <View
        style={[
          styles.summaryIcon,
          { backgroundColor: iconBg },
        ]}
      >
        <Ionicons
          name={icon}
          size={26}
          color={iconColor}
        />
      </View>

      <Text style={styles.summaryLabel}>
        {label}
      </Text>

      <Text style={styles.summaryValue}>
        {value}

        {suffix && (
          <Text style={styles.summarySuffix}>
            {suffix}
          </Text>
        )}
      </Text>

    </View>
  );
}

function SummaryDivider() {
  return <View style={styles.summaryDivider} />;
}

/* QUICK ACTION */

function QuickAction({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
}: any) {
  return (
    <TouchableOpacity style={styles.quickCard}>

      <View
        style={[
          styles.quickIcon,
          { backgroundColor: iconBg },
        ]}
      >
        <Ionicons
          name={icon}
          size={26}
          color={iconColor}
        />
      </View>

      <Text style={styles.quickTitle}>
        {title}
      </Text>

      <Text style={styles.quickSubtitle}>
        {subtitle}
      </Text>

    </TouchableOpacity>
  );
}

/* TRIP */

function TripCard({ trip }: any) {
  return (
    <TouchableOpacity style={styles.tripCard}>

      <View style={styles.tripLocations}>

        <View style={styles.timeBadge}>
          <Text style={styles.timeText}>
            {trip.time}
          </Text>
        </View>

        <View style={styles.locationRow}>
          <View style={styles.greenPin}>
            <View style={styles.pinDot} />
          </View>

          <Text style={styles.locationText}>
            {trip.from}
          </Text>
        </View>

        <View style={styles.locationConnector} />

        <View style={styles.locationRow}>
          <View style={styles.redPin}>
            <View style={styles.pinDot} />
          </View>

          <Text style={styles.locationText}>
            {trip.to}
          </Text>
        </View>

      </View>

      <View style={styles.tripMetric}>
        <Text style={styles.metricValue}>
          {trip.distance}
        </Text>

        <Text style={styles.metricLabel}>
          Distance
        </Text>
      </View>

      <View style={styles.tripMetric}>
        <Text style={styles.metricValue}>
          {trip.duration}
        </Text>

        <Text style={styles.metricLabel}>
          Duration
        </Text>
      </View>

      <View style={styles.tripAmount}>

        <Text style={styles.amountText}>
          {trip.amount}
        </Text>

        <View style={styles.cashBadge}>
          <Ionicons
            name="cash-outline"
            size={12}
            color="#087B32"
          />

          <Text style={styles.cashText}>
            Cash
          </Text>
        </View>

      </View>

      <Ionicons
        name="chevron-forward"
        size={23}
        color="#344054"
      />

    </TouchableOpacity>
  );
}

/* BOTTOM NAV */

function BottomItem({
  icon,
  label,
  active = false,
  badge,
}: any) {
  return (
    <TouchableOpacity style={styles.navItem}>

      <View style={styles.navIconWrapper}>

        <Ionicons
          name={icon}
          size={27}
          color={active ? '#008A38' : '#344054'}
        />

        {badge && (
          <View style={styles.navBadge}>
            <Text style={styles.navBadgeText}>
              {badge}
            </Text>
          </View>
        )}

      </View>

      <Text
        style={[
          styles.navLabel,
          active && styles.navLabelActive,
        ]}
      >
        {label}
      </Text>

    </TouchableOpacity>
  );
}

/* STYLES */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  root: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 20,
  },

  /* HEADER */

  header: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuButton: {
    width: 42,
    height: 42,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  onlineTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
    flex: 1,
  },

  statusDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    marginRight: 11,
  },

  onlineTitleText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#101820',
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  onlineControl: {
    height: 44,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 23,
    backgroundColor: '#F2F4F7',
    flexDirection: 'row',
    alignItems: 'center',
  },

  onlineControlActive: {
    backgroundColor: '#EAF7EF',
  },

  onlineText: {
    color: '#087B32',
    fontSize: 14,
    fontWeight: '600',
  },

  offlineText: {
    color: '#667085',
  },

  notificationButton: {
    width: 43,
    height: 43,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#EF233C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  /* EARNINGS */

  earningsCard: {
    height: 134,
    borderRadius: 18,
    backgroundColor: '#00852F',
    overflow: 'hidden',
    marginBottom: 20,
    flexDirection: 'row',
  },

  earningsContent: {
    flex: 1,
    paddingLeft: 22,
    paddingTop: 25,
    zIndex: 2,
  },

  earningsLabel: {
    color: '#FFFFFF',
    fontSize: 19,
    marginBottom: 18,
  },

  earningsAmount: {
    color: '#FFFFFF',
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '800',
    marginBottom: 20,
  },

  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  completedText: {
    color: '#FFFFFF',
    fontSize: 17,
  },

  roundArrow: {
    width: 37,
    height: 37,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 11,
  },

  /* WALLET */

  walletArea: {
    width: 180,
    height: 170,
    position: 'absolute',
    right: 0,
    bottom: 0,
  },

  trendIcon: {
    position: 'absolute',
    right: -2,
    top: 5,
  },

  walletBack: {
    position: 'absolute',
    width: 108,
    height: 69,
    right: 23,
    top: 24,
    borderRadius: 9,
    backgroundColor: '#55C47F',
    transform: [{ rotate: '-19deg' }],
  },

  walletCardLine: {
    position: 'absolute',
    left: 15,
    top: 17,
    width: 67,
    height: 5,
    borderRadius: 4,
    backgroundColor: '#9BE0B6',
  },

  walletCardLineSmall: {
    position: 'absolute',
    left: 15,
    top: 29,
    width: 45,
    height: 5,
    borderRadius: 4,
    backgroundColor: '#9BE0B6',
  },

  wallet: {
    position: 'absolute',
    width: 125,
    height: 78,
    right: 19,
    bottom: 25,
    borderRadius: 10,
    backgroundColor: '#27A95E',
    borderWidth: 2,
    borderColor: '#087B32',
    transform: [{ rotate: '3deg' }],
  },

  walletTop: {
    position: 'absolute',
    top: 16,
    left: 14,
    right: 14,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#72D499',
  },

  walletButton: {
    position: 'absolute',
    right: 13,
    top: 29,
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: '#EAF7EF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  walletButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B9C5BD',
  },

  coin: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: '#F4B82A',
    borderWidth: 2,
    borderColor: '#D99C0A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  coin1: {
    width: 31,
    height: 31,
    left: 27,
    bottom: 9,
  },

  coin2: {
    width: 39,
    height: 39,
    left: 50,
    bottom: 8,
  },

  coin3: {
    width: 29,
    height: 29,
    left: 68,
    bottom: 29,
  },

  coinText: {
    color: '#FFF4B8',
    fontWeight: '800',
    fontSize: 12,
  },

  /* CARDS */

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEF0F2',
    padding: 18,
    marginBottom: 18,

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 2,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 19,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#101820',
  },

  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  viewAll: {
    fontSize: 14,
    color: '#475467',
    marginRight: 3,
  },

  /* SUMMARY */

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },

  summaryIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },

  summaryLabel: {
    fontSize: 11,
    color: '#475467',
    textAlign: 'center',
    marginBottom: 6,
  },

  summaryValue: {
    fontSize: 16,
    color: '#101820',
    fontWeight: '800',
    textAlign: 'center',
  },

  summarySuffix: {
    fontSize: 10,
    fontWeight: '500',
  },

  summaryDivider: {
    width: 1,
    backgroundColor: '#E8EAED',
    marginHorizontal: 5,
  },

  /* QUICK ACTIONS */

  quickActions: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 18,
  },

  quickCard: {
    flex: 1,
    height: 155,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#EEF0F2',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingTop: 17,

    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  quickIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },

  quickTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#101820',
    textAlign: 'center',
    marginBottom: 6,
  },

  quickSubtitle: {
    fontSize: 11,
    color: '#667085',
  },

  /* TRIPS */

  tripCard: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: '#E7EAED',
    borderRadius: 15,
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  tripLocations: {
    flex: 1.65,
  },

  timeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF9F1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 7,
  },

  timeText: {
    fontSize: 10,
    color: '#087B32',
    fontWeight: '700',
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  greenPin: {
    width: 12,
    height: 12,
    borderRadius: 7,
    backgroundColor: '#008A38',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  redPin: {
    width: 12,
    height: 12,
    borderRadius: 7,
    backgroundColor: '#EF4056',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  pinDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },

  locationText: {
    fontSize: 12,
    color: '#101820',
    fontWeight: '500',
    flexShrink: 1,
  },

  locationConnector: {
    width: 1,
    height: 8,
    backgroundColor: '#B8C0C8',
    marginLeft: 5,
  },

  tripMetric: {
    width: 55,
    borderLeftWidth: 1,
    borderLeftColor: '#E8EAED',
    alignItems: 'center',
    justifyContent: 'center',
  },

  metricValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#101820',
    marginBottom: 5,
  },

  metricLabel: {
    fontSize: 9,
    color: '#667085',
  },

  tripAmount: {
    width: 60,
    borderLeftWidth: 1,
    borderLeftColor: '#E8EAED',
    alignItems: 'center',
    justifyContent: 'center',
  },

  amountText: {
    color: '#008A38',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 5,
  },

  cashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF7EF',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  cashText: {
    color: '#087B32',
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 3,
  },

  /* INCENTIVE */

  incentiveCard: {
    minHeight: 76,
    borderRadius: 15,
    backgroundColor: '#F0FAF3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  trophyCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#008A38',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  incentiveText: {
    flex: 1,
  },

  incentiveTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#101820',
    marginBottom: 5,
  },

  incentiveSubtitle: {
    fontSize: 11,
    color: '#475467',
  },

  progressArea: {
    width: 92,
    marginRight: 8,
  },

  progressText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#344054',
    marginBottom: 5,
  },

  progressBackground: {
    width: '100%',
    height: 6,
    borderRadius: 4,
    backgroundColor: '#CFE8D7',
    overflow: 'hidden',
  },

  progressFill: {
    width: '60%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#008A38',
  },

  /* BOTTOM NAV */

  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 84,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: -3,
    },

    elevation: 10,
  },

  navItem: {
    width: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navIconWrapper: {
    height: 29,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  navLabel: {
    fontSize: 11,
    color: '#344054',
    marginTop: 4,
  },

  navLabelActive: {
    color: '#008A38',
    fontWeight: '700',
  },

  navBadge: {
    position: 'absolute',
    top: -7,
    right: -12,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF233C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  navBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },

  centerWrapper: {
    width: 75,
    height: 96,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -34,
  },

  centerButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#008A38',
    borderWidth: 5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 7,
  },

  centerLabel: {
    fontSize: 11,
    color: '#344054',
    marginTop: 4,
  },
});