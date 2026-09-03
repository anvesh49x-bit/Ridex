import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

const GREEN = '#0E9F6E';
const TEXT = '#101828';
const MUTED = '#667085';
const BORDER = '#D0D5DD';
const BG = '#F8FAFC';

export default function RiderLoginScreen() {
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const sendOtp = () => {
    if (!/^\d{10}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setOtpSent(true);
  };

  const verifyOtp = () => {
    if (otp !== '123456') {
      setError('For this MVP, use OTP 123456.');
      return;
    }
    setError('');
    router.replace('/home');
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <View style={styles.brandWrap}>
          <View style={styles.logo}><Text style={styles.logoText}>R</Text></View>
          <Text style={styles.brand}>RIDEX</Text>
          <Text style={styles.subtitle}>Rider Partner</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome, Rider</Text>
          <Text style={styles.description}>Sign in to go online, receive ride requests, and earn on every trip.</Text>

          <Text style={styles.label}>Mobile number</Text>
          <View style={styles.phoneRow}>
            <Text style={styles.prefix}>+91</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(value) => setPhone(value.replace(/\D/g, '').slice(0, 10))}
              keyboardType="phone-pad"
              placeholder="Enter mobile number"
              placeholderTextColor="#98A2B3"
              editable={!otpSent}
            />
          </View>

          {otpSent && (
            <>
              <Text style={styles.label}>OTP</Text>
              <TextInput
                style={styles.singleInput}
                value={otp}
                onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#98A2B3"
                maxLength={6}
              />
            </>
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={otpSent ? verifyOtp : sendOtp}>
            <Text style={styles.buttonText}>{otpSent ? 'Verify & Continue' : 'Send OTP'}</Text>
          </Pressable>

          {otpSent && (
            <Pressable onPress={() => { setOtpSent(false); setOtp(''); setError(''); }}>
              <Text style={styles.changeNumber}>Change mobile number</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.footer}>By continuing, you agree to RIDEX partner terms.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  container: { flex: 1, paddingHorizontal: 22, paddingTop: 72, paddingBottom: 24, justifyContent: 'space-between' },
  brandWrap: { alignItems: 'center' },
  logo: { width: 56, height: 56, borderRadius: 18, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  brand: { color: TEXT, fontSize: 30, fontWeight: '900', letterSpacing: 2 },
  subtitle: { color: MUTED, fontSize: 14, marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 22, borderWidth: 1, borderColor: '#EAECF0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  title: { color: TEXT, fontSize: 26, fontWeight: '800', marginBottom: 8 },
  description: { color: MUTED, fontSize: 14, lineHeight: 21, marginBottom: 24 },
  label: { color: TEXT, fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 4 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: BORDER, borderRadius: 14, height: 54, marginBottom: 14 },
  prefix: { paddingHorizontal: 14, color: TEXT, fontWeight: '700', borderRightWidth: 1, borderRightColor: '#EAECF0', lineHeight: 24 },
  input: { flex: 1, height: 52, paddingHorizontal: 14, color: TEXT, fontSize: 16 },
  singleInput: { borderWidth: 1, borderColor: BORDER, borderRadius: 14, height: 54, paddingHorizontal: 16, color: TEXT, fontSize: 18, letterSpacing: 5, marginBottom: 8 },
  error: { color: '#D92D20', fontSize: 13, marginBottom: 10 },
  button: { height: 54, borderRadius: 14, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonPressed: { opacity: 0.88 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  changeNumber: { color: GREEN, textAlign: 'center', fontSize: 14, fontWeight: '700', marginTop: 16 },
  footer: { color: '#98A2B3', textAlign: 'center', fontSize: 12, lineHeight: 18, paddingHorizontal: 24 },
});
