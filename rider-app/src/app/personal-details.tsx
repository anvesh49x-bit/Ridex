import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

export default function PersonalDetailsScreen() {
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');

  const continueNext = () => {
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!dateOfBirth.trim()) {
      setError('Please enter your date of birth.');
      return;
    }

    if (!gender) {
      setError('Please select your gender.');
      return;
    }

    setError('');

    router.push('/vehicle-details');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >

        {/* HEADER */}

        <View style={styles.header}>

          <Pressable
            onPress={() => router.back()}
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
            We need a few basic details to set up your rider profile.
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
                setDateOfBirth(text);
                setError('');
              }}
              placeholder="DD / MM / YYYY"
              placeholderTextColor="#A0A6B0"
              style={styles.input}
              keyboardType="number-pad"
              maxLength={10}
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
                  setGender('Male');
                  setError('');
                }}
                style={[
                  styles.genderButton,
                  gender === 'Male' && styles.genderButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === 'Male' && styles.genderTextActive,
                  ]}
                >
                  Male
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setGender('Female');
                  setError('');
                }}
                style={[
                  styles.genderButton,
                  gender === 'Female' && styles.genderButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === 'Female' && styles.genderTextActive,
                  ]}
                >
                  Female
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setGender('Other');
                  setError('');
                }}
                style={[
                  styles.genderButton,
                  gender === 'Other' && styles.genderButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === 'Other' && styles.genderTextActive,
                  ]}
                >
                  Other
                </Text>
              </Pressable>

            </View>

          </View>

        </View>

        {/* ERROR */}

        {error !== '' && (
          <Text style={styles.error}>
            {error}
          </Text>
        )}

        {/* BOTTOM */}

        <View style={styles.bottom}>

          <Pressable
            onPress={continueNext}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>
              Continue
            </Text>

            <Text style={styles.buttonArrow}>
              →
            </Text>
          </Pressable>

          <Text style={styles.note}>
            Your information is used only to create and verify your RIDEX rider account.
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

  error: {
    fontSize: 13,
    color: '#D92D20',
    marginTop: 2,
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

  note: {
    textAlign: 'center',
    marginTop: 15,
    paddingHorizontal: 10,
    fontSize: 11.5,
    lineHeight: 17,
    color: '#8A929E',
  },
});