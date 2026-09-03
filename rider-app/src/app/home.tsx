import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

const GREEN = '#0E9F6E';
const TEXT = '#101828';
const MUTED = '#667085';
const BG = '#F8FAFC';

export default function RiderHomeScreen() {
  const [online, setOnline] = useState(false);

  return (
    <View style={styles.screen}>
      <View style={styles.mapPlaceholder}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Good day</Text>
            <Text style={styles.title}>Ready to ride?</Text>
          </View>
          <Pressable style={styles.avatar} onPress={() => router.push('/explore')}>
            <Text style={styles.avatarText}>R</Text>
          </Pressable>
        </View>
        <View style={styles.locationDot} />
        <Text style={styles.mapLabel}>Map will appear here</Text>
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.statusRow}>
          <View>
            <Text style={styles.statusLabel}>Rider status</Text>
            <Text style={styles.statusValue}>{online ? 'You are online' : 'You are offline'}</Text>
          </View>
          <View style={[styles.statusPill, online && styles.onlinePill]}>
            <View style={[styles.statusDot, online && styles.onlineDot]} />
            <Text style={[styles.statusPillText, online && styles.onlineText]}>{online ? 'ONLINE' : 'OFFLINE'}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => setOnline((value) => !value)}
          style={({ pressed }) => [styles.toggleButton, online && styles.offlineButton, pressed && { opacity: 0.88 }]}>
          <View style={[styles.switchTrack, online && styles.switchTrackOn]}>
            <View style={[styles.switchThumb, online && styles.switchThumbOn]} />
          </View>
          <Text style={[styles.toggleText, online && styles.offlineText]}>{online ? 'Go Offline' : 'Go Online'}</Text>
        </Pressable>

        {online ? (
          <View style={styles.radarCard}>
            <View style={styles.radarIcon}><Text style={styles.radarIconText}>⌁</Text></View>
            <View style={styles.radarCopy}>
              <Text style={styles.radarTitle}>Looking for rides</Text>
              <Text style={styles.radarSubtitle}>Nearby requests will appear here.</Text>
            </View>
            <View style={styles.pulse} />
          </View>
        ) : (
          <Text style={styles.helper}>Go online when you're ready to receive nearby ride requests.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  mapPlaceholder: { flex: 1, backgroundColor: '#E8F0EA', position: 'relative', overflow: 'hidden' },
  topBar: { position: 'absolute', top: 58, left: 20, right: 20, zIndex: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { color: MUTED, fontSize: 13, fontWeight: '600' },
  title: { color: TEXT, fontSize: 23, fontWeight: '800', marginTop: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 },
  avatarText: { color: GREEN, fontWeight: '900', fontSize: 18 },
  locationDot: { position: 'absolute', top: '48%', left: '48%', width: 18, height: 18, borderRadius: 9, backgroundColor: GREEN, borderWidth: 4, borderColor: '#fff' },
  mapLabel: { position: 'absolute', top: '54%', alignSelf: 'center', color: '#667085', fontSize: 12, backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28, marginTop: -18 },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: '#D0D5DD', marginBottom: 22 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  statusLabel: { color: MUTED, fontSize: 13 },
  statusValue: { color: TEXT, fontSize: 19, fontWeight: '800', marginTop: 3 },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F2F4F7' },
  onlinePill: { backgroundColor: '#ECFDF3' },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#98A2B3', marginRight: 6 },
  onlineDot: { backgroundColor: GREEN },
  statusPillText: { fontSize: 10, fontWeight: '800', color: MUTED },
  onlineText: { color: GREEN },
  toggleButton: { height: 58, borderRadius: 16, backgroundColor: GREEN, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  offlineButton: { backgroundColor: '#F2F4F7' },
  toggleText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  offlineText: { color: TEXT },
  switchTrack: { width: 42, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.35)', padding: 3 },
  switchTrackOn: { backgroundColor: '#D0D5DD' },
  switchThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' },
  switchThumbOn: { marginLeft: 18, backgroundColor: GREEN },
  helper: { textAlign: 'center', color: MUTED, fontSize: 13, lineHeight: 19, marginTop: 14, paddingHorizontal: 18 },
  radarCard: { marginTop: 14, borderWidth: 1, borderColor: '#D1FADF', backgroundColor: '#F6FEF9', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  radarIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#D1FADF', alignItems: 'center', justifyContent: 'center' },
  radarIconText: { color: GREEN, fontSize: 24, fontWeight: '700' },
  radarCopy: { flex: 1, marginLeft: 12 },
  radarTitle: { color: TEXT, fontWeight: '800', fontSize: 14 },
  radarSubtitle: { color: MUTED, fontSize: 12, marginTop: 3 },
  pulse: { width: 9, height: 9, borderRadius: 5, backgroundColor: GREEN },
});
