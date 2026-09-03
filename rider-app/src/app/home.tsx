import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= HEADER ================= */}

        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </TouchableOpacity>

          <View style={styles.onlineTitle}>
            <View style={styles.onlineGreenDot} />
            <Text style={styles.onlineTitleText}>You’re Online</Text>
          </View>

          <TouchableOpacity style={styles.onlineSwitch}>
            <Text style={styles.scooterIcon}>🏍</Text>

            <View style={styles.switchCircle} />

            <Text style={styles.onlineSwitchText}>Online</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.bell}>♧</Text>

            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ================= EARNINGS CARD ================= */}

        <TouchableOpacity activeOpacity={0.9} style={styles.earningsCard}>
          <View style={styles.earningsContent}>
            <Text style={styles.earningsLabel}>Today’s Earnings</Text>

            <Text style={styles.earningsAmount}>₹1,245</Text>

            <View style={styles.ridesCompletedRow}>
              <Text style={styles.ridesCompleted}>
                6 Rides Completed
              </Text>

              <View style={styles.earningsArrow}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            </View>
          </View>

          {/* Wallet illustration */}
          <View style={styles.walletIllustration}>
            <View style={styles.walletBack}>
              <View style={styles.cardLine} />
              <View style={styles.cardLineSmall} />
            </View>

            <View style={styles.wallet}>
              <View style={styles.walletTopLine} />
              <View style={styles.walletButton} />
            </View>
<View style={[styles.coin, styles.coinOne]}>
              <Text style={styles.coinText}>₹</Text>
            </View>

            <View style={[styles.coin, styles.coinTwo]}>
              <Text style={styles.coinText}>₹</Text>
            </View>

            <View style={[styles.coin, styles.coinThree]}>
              <Text style={styles.coinText}>₹</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ================= TODAY SUMMARY ================= */}

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today’s Summary</Text>

            <TouchableOpacity>
              <Text style={styles.viewAll}>
                View all <Text style={styles.viewArrow}>›</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryRow}>
            <SummaryItem
              icon="⌖"
              iconType="green"
              label="Distance"
              value="48.6"
              suffix=" km"
            />

            <View style={styles.summaryDivider} />

            <SummaryItem
              icon="◷"
              iconType="blue"
              label="Online Time"
              value="06h 32m"
            />

            <View style={styles.summaryDivider} />

            <SummaryItem
              icon="♙"
              iconType="orange"
              label="Cash Collected"
              value="₹980"
            />

            <View style={styles.summaryDivider} />

            <SummaryItem
              icon="↑"
              iconType="purple"
              label="Avg. Earnings"
              value="₹207"
              suffix="/ride"
            />
          </View>
        </View>

        {/* ================= QUICK ACTIONS ================= */}

        <View style={styles.quickActions}>
          <QuickAction
            icon="🏍"
            iconType="green"
            title="Ride Requests"
            subtitle="New requests"
          />

          <QuickAction
            icon="▥"
            iconType="blue"
            title="Earnings"
            subtitle="View details"
          />

          <QuickAction
            icon="◷"
            iconType="purple"
            title="Ride History"
            subtitle="Past trips"
          />

          <QuickAction
            icon="●"
            iconType="red"
            title="Profile"
            subtitle="View & edit"
          />
        </View>

        {/* ================= RECENT TRIPS ================= */}

        <View style={styles.recentCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Trips</Text>

            <TouchableOpacity>
              <Text style={styles.viewAll}>
                View all <Text style={styles.viewArrow}>›</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {trips.map((trip, index) => (
            <TripCard key={index} trip={trip} />
          ))}
        </View>

        {/* ================= INCENTIVE ================= */}

        <View style={styles.incentiveCard}>
          <View style={styles.trophyCircle}>
            <Text style={styles.trophy}>♛</Text>
          </View>

          <View style={styles.incentiveText}>
            <Text style={styles.incentiveTitle}>
              Complete 10 rides today
            </Text>

            <Text style={styles.incentiveSubtitle}>
              Earn extra ₹150 incentive
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>6 / 10</Text>

            <View style={styles.progressBackground}>
              <View style={styles.progressFill} />
            </View>
          </View>

          <Text style={styles.incentiveArrow}>›</Text>
        </View>

        {/* Space for bottom navigation */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ================= BOTTOM NAVIGATION ================= */}

      <View style={styles.bottomNav}>
        <BottomNavItem
          icon="⌂"
          label="Home"
          active
        />

        <BottomNavItem
          icon="▱"
          label="Earnings"
        />

        <View style={styles.centerNavWrapper}>
          <TouchableOpacity style={styles.centerRideButton}>
            <Text style={styles.centerRideIcon}>🏍</Text>
          </TouchableOpacity>

          <Text style={styles.centerRideLabel}>Rides</Text>
        </View>

        <BottomNavItem
          icon="▤"
          label="Messages"
          badge="2"
        />

        <BottomNavItem
          icon="⠿"
          label="More"
        />
      </View>
    </SafeAreaView>
  );
}

/* =========================================================
   SUMMARY ITEM
========================================================= */

function SummaryItem({
  icon,
  iconType,
  label,
  value,
  suffix,
}: {
  icon: string;
  iconType: string;
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <View style={styles.summaryItem}>
      <View
        style={[
          styles.summaryIcon,
          iconType === 'green' && styles.summaryIconGreen,
          iconType === 'blue' && styles.summaryIconBlue,
          iconType === 'orange' && styles.summaryIconOrange,
          iconType === 'purple' && styles.summaryIconPurple,
        ]}
      >
        <Text
          style={[
            styles.summaryIconText,
            iconType === 'green' && styles.greenText,
            iconType === 'blue' && styles.blueText,
            iconType === 'orange' && styles.orangeText,
            iconType === 'purple' && styles.purpleText,
          ]}
        >
          {icon}
        </Text>
      </View>

      <Text style={styles.summaryLabel}>{label}</Text>

      <Text style={styles.summaryValue}>
        {value}
        {suffix && (
          <Text style={styles.summarySuffix}>{suffix}</Text>
        )}
      </Text>
    </View>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
  icon,
  iconType,
  title,
  subtitle,
}: {
  icon: string;
  iconType: string;
  title: string;
  subtitle: string;
}) {
  return (
    <TouchableOpacity style={styles.quickActionCard}>
      <View
        style={[
          styles.quickIcon,
          iconType === 'green' && styles.quickGreen,
          iconType === 'blue' && styles.quickBlue,
          iconType === 'purple' && styles.quickPurple,
          iconType === 'red' && styles.quickRed,
        ]}
      >
        <Text
          style={[
            styles.quickIconText,
            iconType === 'green' && styles.greenText,
            iconType === 'blue' && styles.blueText,
            iconType === 'purple' && styles.purpleText,
            iconType === 'red' && styles.redText,
          ]}
        >
          {icon}
        </Text>
      </View>

      <Text style={styles.quickTitle}>{title}</Text>

      <Text style={styles.quickSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

/* =========================================================
   TRIP CARD
========================================================= */

function TripCard({
  trip,
}: {
  trip: {
    time: string;
    from: string;
    to: string;
    distance: string;
    duration: string;
    amount: string;
  };
}) {
  return (
    <TouchableOpacity style={styles.tripCard}>
      <View style={styles.tripMain}>
        <View style={styles.tripTimeBadge}>
          <Text style={styles.tripTime}>{trip.time}</Text>
        </View>

        <View style={styles.locationRow}>
          <View style={styles.greenPin}>
            <View style={styles.pinInner} />
          </View>

          <Text style={styles.locationText}>{trip.from}</Text>
        </View>

        <View style={styles.locationLine} />

        <View style={styles.locationRow}>
          <View style={styles.redPin}>
            <View style={styles.pinInnerRed} />
          </View>

          <Text style={styles.locationText}>{trip.to}</Text>
        </View>
      </View>

      <View style={styles.tripMetric}>
        <Text style={styles.metricValue}>{trip.distance}</Text>
        <Text style={styles.metricLabel}>Distance</Text>
      </View>

      <View style={styles.tripMetric}>
        <Text style={styles.metricValue}>{trip.duration}</Text>
        <Text style={styles.metricLabel}>Duration</Text>
      </View>

      <View style={styles.tripAmount}>
        <Text style={styles.amountText}>{trip.amount}</Text>

        <View style={styles.cashBadge}>
          <Text style={styles.cashIcon}>▣</Text>
          <Text style={styles.cashText}>Cash</Text>
        </View>
      </View>

      <Text style={styles.tripArrow}>›</Text>
    </TouchableOpacity>
  );
}

/* =========================================================
   BOTTOM NAV
========================================================= */

function BottomNavItem({
  icon,
  label,
  active = false,
  badge,
}: {
  icon: string;
  label: string;
  active?: boolean;
  badge?: string;
}) {
  return (
    <TouchableOpacity style={styles.navItem}>
      <View style={styles.navIconWrapper}>
        <Text
          style={[
            styles.navIcon,
            active && styles.navIconActive,
          ]}
        >
          {icon}
        </Text>

        {badge && (
          <View style={styles.navBadge}>
            <Text style={styles.navBadgeText}>{badge}</Text>
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

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  /* HEADER */

  header: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  menuButton: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    gap: 5,
  },

  menuLine: {
    width: 31,
    height: 3,
    borderRadius: 3,
    backgroundColor: '#182230',
  },

  onlineTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 'auto',
    marginLeft: 8,
  },

  onlineGreenDot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#008A38',
    marginRight: 12,
  },

  onlineTitleText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#101820',
  },

  onlineSwitch: {
    height: 46,
    paddingLeft: 9,
    paddingRight: 13,
    borderRadius: 25,
    backgroundColor: '#EAF7EF',
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },

  scooterIcon: {
    fontSize: 17,
    marginRight: 7,
  },

  switchCircle: {
    width: 37,
    height: 37,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#008A38',
    marginRight: 9,
  },

  onlineSwitchText: {
    color: '#087B32',
    fontSize: 15,
    fontWeight: '600',
  },

  notificationButton: {
    width: 43,
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bell: {
    fontSize: 31,
    color: '#182230',
    transform: [{ rotate: '180deg' }],
  },

  notificationBadge: {
    position: 'absolute',
    right: -1,
    top: -2,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#EF233C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  /* EARNINGS */

  earningsCard: {
    height: 234,
    borderRadius: 18,
    backgroundColor: '#00852F',
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: 22,
  },

  earningsContent: {
    paddingLeft: 22,
    paddingTop: 24,
    flex: 1,
    zIndex: 2,
  },

  earningsLabel: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '500',
    marginBottom: 20,
  },

  earningsAmount: {
    color: '#FFFFFF',
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '800',
    marginBottom: 23,
  },

  ridesCompletedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  ridesCompleted: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
  },

  earningsArrow: {
    width: 37,
    height: 37,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  arrowText: {
    color: '#FFFFFF',
    fontSize: 29,
    lineHeight: 30,
  },

  /* WALLET */

  walletIllustration: {
    width: 175,
    height: 150,
    position: 'absolute',
    right: 8,
    bottom: 0,
  },

  walletBack: {
    position: 'absolute',
    width: 100,
    height: 67,
    backgroundColor: '#50B978',
    right: 15,
    top: 25,
    borderRadius: 9,
    transform: [{ rotate: '-20deg' }],
  },

  cardLine: {
    position: 'absolute',
    width: 65,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#9DDBB4',
    top: 15,
    left: 15,
  },

  cardLineSmall: {
    position: 'absolute',
    width: 45,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#9DDBB4',
    top: 28,
    left: 15,
  },

  wallet: {
    position: 'absolute',
    width: 120,
    height: 76,
    right: 22,
    bottom: 22,
    backgroundColor: '#25A85D',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0B7838',
    transform: [{ rotate: '3deg' }],
  },

  walletTopLine: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 16,
    height: 4,
    backgroundColor: '#70D296',
    borderRadius: 3,
  },

  walletButton: {
    position: 'absolute',
    width: 19,
    height: 19,
    borderRadius: 10,
    right: 12,
    top: 28,
    backgroundColor: '#E8F6ED',
  },

  coin: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: '#F4B82A',
    borderWidth: 2,
    borderColor: '#D89B08',
    alignItems: 'center',
    justifyContent: 'center',
  },

  coinOne: {
    width: 31,
    height: 31,
    bottom: 8,
    left: 35,
  },

  coinTwo: {
    width: 38,
    height: 38,
    bottom: 8,
    left: 58,
  },

  coinThree: {
    width: 29,
    height: 29,
    bottom: 28,
    left: 69,
  },

  coinText: {
    color: '#FFF4B8',
    fontSize: 13,
    fontWeight: '800',
  },

  /* SECTION */

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEF0F2',
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 20,
    marginBottom: 20,

    shadowColor: '#000000',
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
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#101820',
  },

  viewAll: {
    color: '#475467',
    fontSize: 15,
    fontWeight: '500',
  },

  viewArrow: {
    fontSize: 25,
    color: '#101820',
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
    marginBottom: 12,
  },

  summaryIconGreen: {
    backgroundColor: '#ECF8F0',
  },

  summaryIconBlue: {
    backgroundColor: '#EEF5FF',
  },

  summaryIconOrange: {
    backgroundColor: '#FFF6E8',
  },

  summaryIconPurple: {
    backgroundColor: '#F5EEFF',
  },

  summaryIconText: {
    fontSize: 26,
    fontWeight: '700',
  },

  greenText: {
    color: '#008A38',
  },

  blueText: {
    color: '#1260D6',
  },

  orangeText: {
    color: '#F39A00',
  },

  purpleText: {
    color: '#7434C6',
  },

  redText: {
    color: '#E63956',
  },

  summaryLabel: {
    fontSize: 12,
    color: '#475467',
    marginBottom: 7,
    textAlign: 'center',
  },

  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#101820',
    textAlign: 'center',
  },

  summarySuffix: {
    fontSize: 11,
    fontWeight: '500',
  },

  summaryDivider: {
    width: 1,
    backgroundColor: '#E8EAED',
    marginHorizontal: 7,
  },

  /* QUICK ACTIONS */

  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },

  quickActionCard: {
    flex: 1,
    minHeight: 156,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#EEF0F2',
    paddingTop: 18,
    paddingHorizontal: 8,
    alignItems: 'center',

    shadowColor: '#000000',
    shadowOpacity: 0.045,
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

  quickGreen: {
    backgroundColor: '#EAF7EF',
  },

  quickBlue: {
    backgroundColor: '#EDF5FF',
  },

  quickPurple: {
    backgroundColor: '#F4ECFF',
  },

  quickRed: {
    backgroundColor: '#FFECEF',
  },

  quickIconText: {
    fontSize: 23,
    fontWeight: '700',
  },

  quickTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#101820',
    textAlign: 'center',
    marginBottom: 6,
  },

  quickSubtitle: {
    fontSize: 12,
    color: '#667085',
    textAlign: 'center',
  },

  /* RECENT TRIPS */

  recentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEF0F2',
    padding: 18,
    marginBottom: 18,

    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  tripCard: {
    minHeight: 111,
    borderWidth: 1,
    borderColor: '#E7EAED',
    borderRadius: 15,
    marginBottom: 10,
    paddingVertical: 13,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  tripMain: {
    flex: 1.75,
    minWidth: 0,
  },

  tripTimeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF9F1',
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginBottom: 8,
  },

  tripTime: {
    color: '#087B32',
    fontSize: 11,
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
    marginRight: 10,
  },

  pinInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },

  redPin: {
    width: 12,
    height: 12,
    borderRadius: 7,
    backgroundColor: '#EF4056',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  pinInnerRed: {
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

  locationLine: {
    height: 7,
    width: 1,
    backgroundColor: '#B8C0C8',
    marginLeft: 5,
  },

  tripMetric: {
    width: 57,
    borderLeftWidth: 1,
    borderLeftColor: '#E8EAED',
    alignItems: 'center',
    justifyContent: 'center',
  },

  metricValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#101820',
    marginBottom: 5,
  },

  metricLabel: {
    fontSize: 10,
    color: '#667085',
  },

  tripAmount: {
    width: 62,
    borderLeftWidth: 1,
    borderLeftColor: '#E8EAED',
    alignItems: 'center',
    justifyContent: 'center',
  },

  amountText: {
    fontSize: 18,
    color: '#008A38',
    fontWeight: '800',
    marginBottom: 6,
  },

  cashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF7EF',
    borderRadius: 9,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  cashIcon: {
    color: '#087B32',
    fontSize: 10,
    marginRight: 3,
  },

  cashText: {
    color: '#087B32',
    fontSize: 9,
    fontWeight: '700',
  },

  tripArrow: {
    fontSize: 28,
    color: '#344054',
    marginLeft: 6,
  },

  /* INCENTIVE */

  incentiveCard: {
    minHeight: 76,
    borderRadius: 15,
    backgroundColor: '#F0FAF3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },

  trophyCircle: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#008A38',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  trophy: {
    color: '#FFFFFF',
    fontSize: 23,
  },

  incentiveText: {
    flex: 1,
  },

  incentiveTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#101820',
    marginBottom: 5,
  },

  incentiveSubtitle: {
    fontSize: 12,
    color: '#475467',
  },

  progressContainer: {
    width: 100,
    marginRight: 9,
  },

  progressText: {
    fontSize: 11,
    color: '#344054',
    fontWeight: '600',
    marginBottom: 6,
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
    backgroundColor: '#008A38',
    borderRadius: 4,
  },

  incentiveArrow: {
    fontSize: 27,
    color: '#344054',
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

    shadowColor: '#000000',
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
    position: 'relative',
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  navIcon: {
    fontSize: 26,
    color: '#344054',
  },

  navIconActive: {
    color: '#008A38',
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
    top: -5,
    right: -11,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF233C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  navBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  centerNavWrapper: {
    width: 75,
    height: 95,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: -35,
  },

  centerRideButton: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: '#008A38',
    borderWidth: 5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 6,
  },

  centerRideIcon: {
    fontSize: 28,
  },

  centerRideLabel: {
    fontSize: 11,
    color: '#344054',
    marginTop: 4,
  },
});