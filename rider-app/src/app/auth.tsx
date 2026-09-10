import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  getAuth,
  signInWithPhoneNumber,
  ConfirmationResult,
} from "@react-native-firebase/auth";

const API_URL = "http://10.134.158.132:3000";

type BackendMeResponse = {
  success?: boolean;
  accountStatus?: string;
  capabilities?: {
    passenger?: boolean;
    rider?: boolean;
  };
  riderStatus?: string;
  user?: {
    id: string;
    firebase_uid: string;
    is_active: boolean;
    role: string;
    has_rider_capability?: boolean;
    verification_status?: string | null;
  };
};

export default function AuthScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const [confirmation, setConfirmation] =
    useState<ConfirmationResult | null>(null);

  // Prevent double tapping Send OTP / Verify OTP
  const sendLock = useRef(false);
  const verifyLock = useRef(false);

  /*
   * Clean Firebase session when this screen starts only if there
   * is no existing authenticated user.
   *
   * We intentionally DO NOT sign out an existing Firebase user here.
   */
  useEffect(() => {
    const auth = getAuth();

    if (!auth.currentUser) {
      console.log("[RIDEX AUTH] No Firebase session");
    } else {
      console.log(
        "[RIDEX AUTH] Existing Firebase session:",
        auth.currentUser.uid
      );
    }
  }, []);

  const normalizePhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");

    if (digits.startsWith("91") && digits.length === 12) {
      return `+${digits}`;
    }

    if (digits.length === 10) {
      return `+91${digits}`;
    }

    return value.startsWith("+") ? value : `+${value}`;
  };

  const sendOtp = async () => {
    if (sendLock.current || loading) {
      return;
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    if (!/^\+91\d{10}$/.test(normalizedPhone)) {
      Alert.alert(
        "Invalid phone number",
        "Enter a valid 10-digit Indian mobile number."
      );
      return;
    }

    sendLock.current = true;
    setLoading(true);

    try {
      const auth = getAuth();

      console.log(
        "[RIDEX AUTH] Sending Firebase OTP to:",
        normalizedPhone
      );

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        normalizedPhone
      );

      /*
       * Store ONLY the newest confirmation session.
       * An old OTP must never be reused.
       */
      setConfirmation(confirmationResult);
      setOtp("");
      setOtpSent(true);

      console.log("[RIDEX AUTH] Firebase OTP sent successfully.");
    } catch (error: any) {
      console.error(
        "[RIDEX AUTH] Firebase OTP send error:",
        error
      );

      let message = "Unable to send OTP. Please try again.";

      if (error?.code === "auth/too-many-requests") {
        message =
          "Firebase temporarily blocked OTP requests from this device. Please wait and try again later.";
      }

      Alert.alert("OTP Error", message);
    } finally {
      setLoading(false);

      // Small protection against accidental double taps.
      setTimeout(() => {
        sendLock.current = false;
      }, 800);
    }
  };

  const verifyOtp = async () => {
    if (verifyLock.current || loading) {
      return;
    }

    if (!confirmation) {
      Alert.alert(
        "OTP required",
        "Please request a new OTP first."
      );
      return;
    }

    if (otp.trim().length !== 6) {
      Alert.alert(
        "Invalid OTP",
        "Enter the 6-digit OTP sent to your phone."
      );
      return;
    }

    verifyLock.current = true;
    setLoading(true);

    try {
      console.log("[RIDEX AUTH] Verifying Firebase OTP...");

      /*
       * Firebase verification happens exactly once for this
       * confirmation session.
       */
      await confirmation.confirm(otp.trim());

      const auth = getAuth();
      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        throw new Error(
          "Firebase authentication completed but no current user was found."
        );
      }

      console.log(
        "[RIDEX AUTH] Firebase UID:",
        firebaseUser.uid
      );

      console.log(
        "[RIDEX AUTH] Firebase phone:",
        firebaseUser.phoneNumber
      );

      console.log(
        "[RIDEX AUTH] Firebase authentication successful."
      );

      /*
       * IMPORTANT:
       *
       * We DO NOT navigate here.
       *
       * Firebase auth state changes automatically.
       * _layout.tsx owns the entire post-login navigation flow.
       *
       * This prevents:
       *
       * auth.tsx navigation
       * +
       * _layout.tsx navigation
       *
       * from opening Welcome twice.
       */

      setConfirmation(null);
      setOtp("");

    } catch (error: any) {
      console.error(
        "[RIDEX AUTH] Firebase/RIDEX authentication error:",
        error
      );

      let message = "Authentication failed. Please try again.";

      if (error?.code === "auth/session-expired") {
        message =
          "This OTP session expired. Please request a new OTP.";
        setConfirmation(null);
        setOtp("");
        setOtpSent(false);
      } else if (error?.code === "auth/invalid-verification-code") {
        message =
          "The OTP is incorrect. Please enter the latest OTP.";
      }

      Alert.alert("Verification Error", message);
    } finally {
      setLoading(false);

      setTimeout(() => {
        verifyLock.current = false;
      }, 800);
    }
  };

  const changeNumber = () => {
    setConfirmation(null);
    setOtp("");
    setOtpSent(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.logo}>RIDEX</Text>

          <Text style={styles.title}>
            {otpSent
              ? "Verify your phone"
              : "Welcome to RIDEX Rider"}
          </Text>

          <Text style={styles.subtitle}>
            {otpSent
              ? `Enter the OTP sent to ${normalizePhoneNumber(
                  phoneNumber
                )}`
              : "Sign in with your phone number to continue."}
          </Text>

          {!otpSent ? (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.countryCode}>+91</Text>

                <TextInput
                  value={phoneNumber}
                  onChangeText={(value) =>
                    setPhoneNumber(
                      value.replace(/\D/g, "").slice(0, 10)
                    )
                  }
                  placeholder="Enter mobile number"
                  placeholderTextColor="#888"
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={styles.input}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  loading && styles.buttonDisabled,
                ]}
                onPress={sendOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    Send OTP
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TextInput
                value={otp}
                onChangeText={(value) =>
                  setOtp(value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#888"
                keyboardType="number-pad"
                maxLength={6}
                style={styles.otpInput}
                editable={!loading}
                autoFocus
              />

              <TouchableOpacity
                style={[
                  styles.button,
                  loading && styles.buttonDisabled,
                ]}
                onPress={verifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    Verify OTP
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={changeNumber}
                disabled={loading}
              >
                <Text style={styles.secondaryText}>
                  Use another number
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  logo: {
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 4,
    color: "#111111",
    marginBottom: 45,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111111",
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#666666",
    marginBottom: 30,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 14,
    height: 58,
    paddingHorizontal: 16,
    marginBottom: 18,
  },

  countryCode: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 17,
    color: "#111111",
  },

  otpInput: {
    height: 62,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 14,
    paddingHorizontal: 18,
    fontSize: 25,
    fontWeight: "700",
    letterSpacing: 8,
    textAlign: "center",
    color: "#111111",
    marginBottom: 18,
  },

  button: {
    height: 58,
    borderRadius: 14,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },

  secondaryButton: {
    alignItems: "center",
    marginTop: 22,
    paddingVertical: 10,
  },

  secondaryText: {
    color: "#111111",
    fontSize: 15,
    fontWeight: "700",
  },
});