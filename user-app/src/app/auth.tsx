import React, { useRef, useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  getAuth,
  signInWithPhoneNumber,
} from '@react-native-firebase/auth';

export default function AuthScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  
const [confirmation, setConfirmation] =
  useState<any>(null);
  const [resendSeconds, setResendSeconds] = useState(30);

  const otpRefs = useRef<(TextInput | null)[]>([]);
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startResendTimer = () => {
    if (resendTimerRef.current) {
      clearInterval(resendTimerRef.current);
    }

    setResendSeconds(30);

    resendTimerRef.current = setInterval(() => {
      setResendSeconds((current) => {
        if (current <= 1) {
          if (resendTimerRef.current) {
            clearInterval(resendTimerRef.current);
            resendTimerRef.current = null;
          }

          return 0;
        }

        return current - 1;
      });
    }, 1000);
  };

  const getFirebaseErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/invalid-phone-number':
        return 'Please enter a valid mobile number.';

      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait and try again later.';

      case 'auth/quota-exceeded':
        return 'SMS limit reached. Please try again later.';

      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';

      case 'auth/invalid-verification-code':
        return 'Incorrect OTP. Please check the code and try again.';

      case 'auth/code-expired':
        return 'This OTP has expired. Please request a new one.';

      case 'auth/session-expired':
        return 'Your verification session expired. Please request a new OTP.';

      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const sendOtp = async () => {
    if (phone.length !== 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const auth = getAuth();

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        `+91${phone}`
      );

      setConfirmation(confirmationResult);
      setOtpSent(true);
      setOtp(['', '', '', '', '', '']);
      startResendTimer();

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 150);
    } catch (error) {
      console.error('Firebase send OTP error:', error);

      const firebaseError = error as {
        code?: string;
        message?: string;
      };

      setError(
        getFirebaseErrorMessage(
          firebaseError.code || ''
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (
    value: string,
    index: number
  ) => {
    const digits = value
      .replace(/\D/g, '')
      .slice(-1);

    const nextOtp = [...otp];
    nextOtp[index] = digits;

    setOtp(nextOtp);
    setError('');

    if (digits && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (
    e: any,
    index: number
  ) => {
    if (
      e.nativeEvent.key === 'Backspace' &&
      !otp[index] &&
      index > 0
    ) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async () => {
    const enteredOtp = otp.join('');

    if (enteredOtp.length !== 6) {
      setError('Enter the 6-digit OTP.');
      return;
    }

    if (!confirmation) {
      setError(
        'Verification session expired. Please request a new OTP.'
      );
      return;
    }

    setError('');
    setLoading(true);

    try {
      const userCredential =
        await confirmation.confirm(enteredOtp);

      const firebaseUser = userCredential.user;

      console.log(
        'Firebase authentication successful:',
        firebaseUser.uid
      );

      router.replace('/home');
    } catch (error) {
      console.error('Firebase verify OTP error:', error);

      const firebaseError = error as {
        code?: string;
        message?: string;
      };

      setError(
        getFirebaseErrorMessage(
          firebaseError.code || ''
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendSeconds > 0 || loading) {
      return;
    }

    await sendOtp();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* LOGO */}
        <View style={styles.logoArea}>
          <Image
            source={require('../../assets/images/ridex-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* HERO TEXT */}
        <View style={styles.hero}>
          <Text style={styles.heading}>
            Your ride,
          </Text>

          <Text style={styles.headingGreen}>
            your way
          </Text>

          <Text style={styles.description}>
            Affordable rides, trusted drivers,{'\n'}
            anytime anywhere.
          </Text>
        </View>

        {/* PHONE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Mobile number
          </Text>

          <Text style={styles.sectionSubtitle}>
            We'll send you an OTP to verify your number
          </Text>

          <View
            style={[
              styles.phoneField,
              phoneFocused &&
                styles.phoneFieldFocused,
              otpSent &&
                styles.phoneFieldDisabled,
            ]}
          >
            <View style={styles.country}>
              <Text style={styles.flag}>
                🇮🇳
              </Text>

              <Text style={styles.countryCode}>
                +91
              </Text>

              <Text style={styles.chevron}>
                ˅
              </Text>
            </View>

            <View style={styles.verticalLine} />

            <TextInput
              value={phone}
              onChangeText={(text) => {
                setPhone(
                  text
                    .replace(/\D/g, '')
                    .slice(0, 10)
                );
                setError('');
              }}
              onFocus={() =>
                setPhoneFocused(true)
              }
              onBlur={() =>
                setPhoneFocused(false)
              }
              placeholder="Enter mobile number"
              placeholderTextColor="#A0A6B0"
              keyboardType="phone-pad"
              maxLength={10}
              editable={!otpSent && !loading}
              style={styles.phoneInput}
            />
          </View>
        </View>

        {/* OTP */}
        <View style={styles.otpSection}>

          <View style={styles.otpTitleRow}>
            <View>
              <Text style={styles.sectionTitle}>
                Verification code
              </Text>

              <Text style={styles.sectionSubtitle}>
                {otpSent
                  ? 'Enter the 6-digit code we sent you'
                  : 'OTP will appear here after you continue'}
              </Text>
            </View>

            {otpSent && (
              <Text style={styles.timer}>
                {resendSeconds > 0
                  ? `00:${String(
                      resendSeconds
                    ).padStart(2, '0')}`
                  : 'Ready'}
              </Text>
            )}
          </View>

          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  otpRefs.current[index] = ref;
                }}
                value={digit}
                onChangeText={(value) =>
                  handleOtpChange(
                    value,
                    index
                  )
                }
                onKeyPress={(e) =>
                  handleOtpKeyPress(
                    e,
                    index
                  )
                }
                keyboardType="number-pad"
                maxLength={1}
                editable={otpSent && !loading}
                textAlign="center"
                selectTextOnFocus
                style={[
                  styles.otpBox,
                  !otpSent &&
                    styles.otpBoxInactive,
                  digit &&
                    styles.otpBoxActive,
                ]}
              />
            ))}
          </View>

          {otpSent && (
            <Pressable
              onPress={resendOtp}
              disabled={
                resendSeconds > 0 ||
                loading
              }
              style={styles.resendButton}
            >
              <Text
                style={[
                  styles.resendText,
                  resendSeconds > 0 &&
                    styles.resendTextDisabled,
                ]}
              >
                {resendSeconds > 0
                  ? `Resend OTP in ${resendSeconds}s`
                  : 'Resend OTP'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* ERROR */}
        {error ? (
          <Text style={styles.error}>
            {error}
          </Text>
        ) : null}

        {/* BOTTOM */}
        <View style={styles.bottom}>

          <Pressable
            onPress={
              otpSent
                ? verifyOtp
                : sendOtp
            }
            disabled={loading}
            style={({ pressed }) => [
              styles.button,
              pressed &&
                styles.buttonPressed,
              loading &&
                styles.buttonDisabled,
            ]}
          >
            <Text style={styles.buttonText}>
              {loading
                ? 'Please wait...'
                : otpSent
                  ? 'Verify & Continue'
                  : 'Send OTP'}
            </Text>

            {!loading && (
              <Text style={styles.buttonArrow}>
                →
              </Text>
            )}
          </Pressable>

          <View style={styles.termsArea}>
            <Text style={styles.terms}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsBold}>
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text style={styles.termsBold}>
                Privacy Policy
              </Text>
            </Text>
          </View>

        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
    paddingHorizontal: 34,
    paddingTop: 8,
    paddingBottom: 10,
  },

  logoArea: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },

  logo: {
    width: 103,
    height: 38,
  },

  hero: {
    marginTop: 30,
  },

  heading: {
    fontSize: 36,
    lineHeight: 41,
    fontWeight: '800',
    color: '#101820',
    letterSpacing: -0.8,
  },

  headingGreen: {
    fontSize: 36,
    lineHeight: 41,
    fontWeight: '800',
    color: '#009E4F',
    letterSpacing: -0.8,
  },

  description: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 24,
    color: '#687386',
  },

  section: {
    marginTop: 49,
  },

  sectionTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    color: '#101820',
  },

  sectionSubtitle: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 20,
    color: '#737C8C',
  },

  phoneField: {
    height: 60,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#D9DDE3',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },

  phoneFieldFocused: {
    borderColor: '#009E4F',
    borderWidth: 1.5,
  },

  phoneFieldDisabled: {
    opacity: 0.65,
  },

  country: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  flag: {
    fontSize: 20,
    marginRight: 9,
  },

  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#171D24',
  },

  chevron: {
    marginLeft: 9,
    marginTop: -4,
    fontSize: 20,
    color: '#727A86',
  },

  verticalLine: {
    width: 1,
    height: 30,
    backgroundColor: '#DCE0E5',
    marginLeft: 15,
    marginRight: 15,
  },

  phoneInput: {
    flex: 1,
    height: '100%',
    padding: 0,
    fontSize: 17,
    fontWeight: '500',
    color: '#101820',
  },

  otpSection: {
    marginTop: 38,
  },

  otpTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  timer: {
    fontSize: 14,
    fontWeight: '600',
    color: '#687386',
    marginBottom: 2,
  },

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },

  otpBox: {
    width: 47,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D9DDE3',
    backgroundColor: '#FFFFFF',
    fontSize: 21,
    fontWeight: '600',
    color: '#101820',
  },

  otpBoxInactive: {
    backgroundColor: '#FAFAFA',
  },

  otpBoxActive: {
    borderColor: '#009E4F',
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },

  resendButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
  },

  resendText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#009E4F',
  },

  resendTextDisabled: {
    color: '#9AA1AC',
  },

  error: {
    marginTop: 10,
    fontSize: 13,
    color: '#D92D20',
  },

  bottom: {
    marginTop: 'auto',
  },

  button: {
    height: 60,
    borderRadius: 15,
    backgroundColor: '#101820',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonPressed: {
    opacity: 0.82,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  buttonArrow: {
    color: '#FFFFFF',
    fontSize: 24,
    marginLeft: 12,
    marginTop: -2,
  },

  termsArea: {
    borderTopWidth: 1,
    borderTopColor: '#ECEDEF',
    marginTop: 28,
    paddingTop: 20,
    paddingHorizontal: 5,
  },

  terms: {
    textAlign: 'center',
    fontSize: 12.5,
    lineHeight: 18,
    color: '#7A8290',
  },

  termsBold: {
    color: '#151B22',
    fontWeight: '600',
  },
});