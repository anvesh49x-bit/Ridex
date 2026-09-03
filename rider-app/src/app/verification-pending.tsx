import { router } from 'expo-router';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function VerificationPending() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconCircle}>
          <Text style={styles.check}>✓</Text>
        </View>

        {/* Heading */}
        <Text style={styles.title}>Documents submitted</Text>

        <Text style={styles.subtitle}>
          Thanks for completing your RIDEX rider application.
        </Text>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.activeDot}>
              <View style={styles.innerDot} />
            </View>

            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>Verification in progress</Text>
              <Text style={styles.statusDescription}>
                Our team will review your details and documents before your
                rider account is activated.
              </Text>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timeline}>
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconDone}>
              <Text style={styles.timelineCheck}>✓</Text>
            </View>

            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Application submitted</Text>
              <Text style={styles.timelineSubtitle}>Completed</Text>
            </View>
          </View>

          <View style={styles.line} />

          <View style={styles.timelineItem}>
            <View style={styles.timelineIconActive}>
              <View style={styles.timelineDot} />
            </View>

            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Document verification</Text>
              <Text style={styles.timelineSubtitle}>In progress</Text>
            </View>
          </View>

          <View style={styles.line} />

          <View style={styles.timelineItem}>
            <View style={styles.timelineIconPending}>
              <Text style={styles.pendingNumber}>3</Text>
            </View>

            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Rider account activation</Text>
              <Text style={styles.timelineSubtitle}>Waiting for approval</Text>
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>i</Text>

          <Text style={styles.infoText}>
            You can close the app now. Once your verification is complete,
            your account status can be updated here.
          </Text>
        </View>

        {/* Button */}
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={() => router.replace('/home')}
        >
          <Text style={styles.buttonText}>Continue</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  content: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },

  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#EAF7EF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },

  check: {
    fontSize: 38,
    fontWeight: '700',
    color: '#16A34A',
  },

  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: '#101820',
    textAlign: 'center',
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#667085',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
  },

  statusCard: {
    backgroundColor: '#F6F8F7',
    borderRadius: 18,
    padding: 18,
    marginBottom: 30,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  activeDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DDF3E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2,
  },

  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },

  statusTextContainer: {
    flex: 1,
  },

  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101820',
    marginBottom: 5,
  },

  statusDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: '#667085',
  },

  timeline: {
    marginBottom: 28,
  },

  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  timelineIconDone: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#101820',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  timelineCheck: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  timelineIconActive: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EAF7EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  timelineDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#16A34A',
  },

  timelineIconPending: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F3F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  pendingNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#98A2B3',
  },

  timelineContent: {
    flex: 1,
  },

  timelineTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#101820',
    marginBottom: 3,
  },

  timelineSubtitle: {
    fontSize: 13,
    color: '#98A2B3',
  },

  line: {
    width: 2,
    height: 26,
    backgroundColor: '#E5E7EB',
    marginLeft: 18,
  },

  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 15,
    marginBottom: 28,
  },

  infoIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#101820',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 12,
    fontWeight: '800',
    marginRight: 10,
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#667085',
  },

  button: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#101820',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  arrow: {
    color: '#FFFFFF',
    fontSize: 22,
    marginLeft: 10,
    marginTop: -2,
  },
});