import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { getAuth } from '@react-native-firebase/auth';

const API_URL = 'http://10.134.158.132:3000';

type Gender = 'male' | 'female' | 'other';

type ApplicationResponse = {
  success?: boolean;
  message?: string;

  application?: {
    id: string;
    status: string;
  } | null;

  riderProfile?: {
    id: string;
    date_of_birth?: string | null;
    gender?: string | null;
    address?: string | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
  } | null;

  profile?: {
    full_name?: string | null;
  } | null;

  user?: {
    full_name?: string | null;
  } | null;
};

export default function PersonalDetailsScreen() {
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPersonalDetails();
  }, []);

  const getFirebaseToken = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('Your session has expired. Please login again.');
    }

    return currentUser.getIdToken();
  };

  const loadPersonalDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const token = await getFirebaseToken();

      const response = await fetch(
        `${API_URL}/api/rider/application`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );

      const data: ApplicationResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Unable to load your personal details.',
        );
      }

      /*
       * Full name belongs to the main profile.
       */
      const savedFullName =
        data.profile?.full_name ??
        data.user?.full_name ??
        '';

      setFullName(savedFullName);

      /*
       * Rider-specific personal information.
       */
      if (data.riderProfile) {
        setDateOfBirth(
          data.riderProfile.date_of_birth ?? '',
        );

        const savedGender =
          data.riderProfile.gender?.toLowerCase();

        if (
          savedGender === 'male' ||
          savedGender === 'female' ||
          savedGender === 'other'
        ) {
          setGender(savedGender);
        } else {
          setGender('');
        }

        setAddress(
          data.riderProfile.address ?? '',
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to load your details.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatDateOfBirth = (value: string) => {
    /*
     * Keep only numbers.
     */
    const digits = value.replace(/\D/g, '');

    /*
     * DDMMYYYY -> DD / MM / YYYY
     */
    if (digits.length <= 2) {
      return digits;
    }

    if (digits.length <= 4) {
      return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
    }

    return `${digits.slice(0, 2)} / ${digits.slice(
      2,
      4,
    )} / ${digits.slice(4, 8)}`;
  };

  const convertDateToBackendFormat = (value: string) => {
    /*
     * UI:
     * DD / MM / YYYY
     *
     * Backend:
     * YYYY-MM-DD
     */
    const digits = value.replace(/\D/g, '');

    if (digits.length !== 8) {
      return null;
    }

    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    const year = digits.slice(4, 8);

    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
    );

    /*
     * Strict date validation.
     */
    if (
      date.getFullYear() !== Number(year) ||
      date.getMonth() !== Number(month) - 1 ||
      date.getDate() !== Number(day)
    ) {
      return null;
    }

    return `${year}-${month}-${day}`;
  };

  const continueNext = async () => {
    if (saving) {
      return;
    }

    setError('');

    const trimmedName = fullName.trim();
    const trimmedAddress = address.trim();

    if (!trimmedName) {
      setError('Please enter your full name.');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Please enter your full name.');
      return;
    }

    const backendDateOfBirth =
      convertDateToBackendFormat(dateOfBirth);

    if (!backendDateOfBirth) {
      setError(
        'Please enter a valid date of birth in DD / MM / YYYY format.',
      );
      return;
    }

    if (!gender) {
      setError('Please select your gender.');
      return;
    }

    try {
      setSaving(true);

      const token = await getFirebaseToken();

      const response = await fetch(
        `${API_URL}/api/rider/application/personal`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            fullName: trimmedName,
            dateOfBirth: backendDateOfBirth,
            gender,
            address: trimmedAddress || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            'Unable to save your personal details.',
        );
      }

      /*
       * Backend confirmed the save.
       * Only now continue to Vehicle Details.
       */
      router.push('/vehicle-details');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to save your personal details.';

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color="#009E4F"
        />

        <Text style={styles.loadingText}>
          Loading your details...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/auth');
              }
            }}
            disabled={saving}
            style={styles.backButton}
          >
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>

          <View>
            <Text style={styles.step}>
              STEP 1 OF 3
            </Text>

            <Text style={styles.headerTitle}>
              Personal details
            </Text>
          </View>
        </View>

        {/* PROGRESS */}

        <View style={styles.progressContainer}>
          <View style={styles.progressActive} />
          <View style={styles.progressInactive} />
          <View style={styles.progressInactive} />
        </View>

        {/* INTRO */}

        <View style={styles.intro}>
          <Text style={styles.title}>
            Tell us about yourself
          </Text>

          <Text style={styles.subtitle}>
            We need a few basic details to set up your rider
            profile.
          </Text>
        </View>

        {/* FORM */}

        <View style={styles.form}>
          {/* FULL NAME */}

          <View style={styles.field}>
            <Text style={styles.label}>
              Full name
            </Text>

            <TextInput
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                setError('');
              }}
              placeholder="Enter your full name"
              placeholderTextColor="#A0A6B0"
              style={styles.input}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!saving}
            />
          </View>

          {/* DOB */}

          <View style={styles.field}>
            <Text style={styles.label}>
              Date of birth
            </Text>

            <TextInput
              value={dateOfBirth}
              onChangeText={(text) => {
                setDateOfBirth(
                  formatDateOfBirth(text),
                );
                setError('');
              }}
              placeholder="DD / MM / YYYY"
              placeholderTextColor="#A0A6B0"
              style={styles.input}
              keyboardType="number-pad"
              maxLength={14}
              editable={!saving}
            />
          </View>

          {/* GENDER */}

          <View style={styles.field}>
            <Text style={styles.label}>
              Gender
            </Text>

            <View style={styles.genderRow}>
              <Pressable
                onPress={() => {
                  setGender('male');
                  setError('');
                }}
                disabled={saving}
                style={[
                  styles.genderButton,
                  gender === 'male' &&
                    styles.genderButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === 'male' &&
                      styles.genderTextActive,
                  ]}
                >
                  Male
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setGender('female');
                  setError('');
                }}
                disabled={saving}
                style={[
                  styles.genderButton,
                  gender === 'female' &&
                    styles.genderButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === 'female' &&
                      styles.genderTextActive,
                  ]}
                >
                  Female
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setGender('other');
                  setError('');
                }}
                disabled={saving}
                style={[
                  styles.genderButton,
                  gender === 'other' &&
                    styles.genderButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === 'other' &&
                      styles.genderTextActive,
                  ]}
                >
                  Other
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ADDRESS */}

          <View style={styles.field}>
            <View style={styles.addressLabelRow}>
              <Text style={styles.label}>
                Address
              </Text>

              <Text style={styles.optional}>
                Optional
              </Text>
            </View>

            <TextInput
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                setError('');
              }}
              placeholder="Enter your address"
              placeholderTextColor="#A0A6B0"
              style={[
                styles.input,
                styles.addressInput,
              ]}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              editable={!saving}
            />
          </View>
        </View>

        {/* ERROR */}

        {error !== '' && (
          <View style={styles.errorContainer}>
            <Text style={styles.error}>
              {error}
            </Text>
          </View>
        )}

        {/* BOTTOM */}

        <View style={styles.bottom}>
          <Pressable
            onPress={continueNext}
            disabled={saving}
            style={({ pressed }) => [
              styles.button,
              pressed &&
                !saving &&
                styles.buttonPressed,
              saving && styles.buttonDisabled,
            ]}
          >
            {saving ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />

                <Text style={styles.buttonText}>
                  Saving...
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.buttonText}>
                  Continue
                </Text>

                <Text style={styles.buttonArrow}>
                  →
                </Text>
              </>
            )}
          </Pressable>

          <Text style={styles.note}>
            Your information is used only to create and
            verify your RIDEX rider account.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#737C8C',
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 34,
    paddingTop: 12,
    paddingBottom: 20,
  },

  /* HEADER */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F5F6F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  backArrow: {
    fontSize: 30,
    lineHeight: 30,
    color: '#101820',
    marginTop: -3,
  },

  step: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#009E4F',
    marginBottom: 3,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#101820',
  },

  /* PROGRESS */

  progressContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 24,
  },

  progressActive: {
    flex: 1,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#009E4F',
  },

  progressInactive: {
    flex: 1,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#E7E9EC',
  },

  /* INTRO */

  intro: {
    marginTop: 38,
  },

  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: '#101820',
    letterSpacing: -0.6,
  },

  subtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: '#737C8C',
  },

  /* FORM */

  form: {
    marginTop: 36,
  },

  field: {
    marginBottom: 25,
  },

  label: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101820',
    marginBottom: 9,
  },

  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  optional: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8A929E',
    marginBottom: 9,
  },

  input: {
    height: 58,
    borderWidth: 1,
    borderColor: '#D9DDE3',
    borderRadius: 15,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#101820',
    backgroundColor: '#FFFFFF',
  },

  addressInput: {
    height: 90,
    paddingTop: 15,
    paddingBottom: 15,
  },

  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },

  genderButton: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D9DDE3',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },

  genderButtonActive: {
    borderColor: '#009E4F',
    backgroundColor: '#F0FAF5',
  },

  genderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#687386',
  },

  genderTextActive: {
    color: '#009E4F',
    fontWeight: '700',
  },

  /* ERROR */

  errorContainer: {
    marginTop: 2,
  },

  error: {
    fontSize: 13,
    lineHeight: 19,
    color: '#D92D20',
  },

  /* BOTTOM */

  bottom: {
    marginTop: 'auto',
    paddingTop: 35,
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
    marginLeft: 10,
  },

  buttonArrow: {
    color: '#FFFFFF',
    fontSize: 24,
    marginLeft: 12,
    marginTop: -2,
  },

  note: {
    textAlign: 'center',
    marginTop: 15,
    paddingHorizontal: 10,
    fontSize: 11.5,
    lineHeight: 17,
    color: '#8A929E',
  },
});