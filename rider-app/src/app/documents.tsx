import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

type DocumentStatus = 'pending' | 'uploaded';

type DocumentItemProps = {
  title: string;
  description: string;
  status: DocumentStatus;
  onPress: () => void;
};

function DocumentItem({
  title,
  description,
  status,
  onPress,
}: DocumentItemProps) {
  const uploaded = status === 'uploaded';

  return (
    <View style={styles.documentCard}>
      <View style={styles.documentIcon}>
        <Text style={styles.documentIconText}>
          {uploaded ? '✓' : '▤'}
        </Text>
      </View>

      <View style={styles.documentInfo}>
        <Text style={styles.documentTitle}>
          {title}
        </Text>

        <Text style={styles.documentDescription}>
          {uploaded ? 'Document uploaded' : description}
        </Text>
      </View>

      <Pressable
        onPress={onPress}
        style={[
          styles.uploadButton,
          uploaded && styles.uploadedButton,
        ]}
      >
        <Text
          style={[
            styles.uploadButtonText,
            uploaded && styles.uploadedButtonText,
          ]}
        >
          {uploaded ? 'Change' : 'Upload'}
        </Text>
      </Pressable>
    </View>
  );
}

export default function DocumentsScreen() {
  const [drivingLicence, setDrivingLicence] =
    useState<DocumentStatus>('pending');

  const [registrationCertificate, setRegistrationCertificate] =
    useState<DocumentStatus>('pending');

  const [insurance, setInsurance] =
    useState<DocumentStatus>('pending');

  const [error, setError] = useState('');

  const allUploaded =
    drivingLicence === 'uploaded' &&
    registrationCertificate === 'uploaded' &&
    insurance === 'uploaded';

  const handleSubmit = () => {
    if (!allUploaded) {
      setError('Please upload all required documents.');
      return;
    }

    setError('');
    router.push('/verification-pending');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
      >

        {/* HEADER */}

        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/vehicle-details');
              }
            }}
            style={styles.backButton}
          >
            <Text style={styles.backArrow}>
              ‹
            </Text>
          </Pressable>

          <View>
            <Text style={styles.step}>
              STEP 3 OF 3
            </Text>

            <Text style={styles.headerTitle}>
              Document verification
            </Text>
          </View>
        </View>

        {/* PROGRESS */}

        <View style={styles.progressContainer}>
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
        </View>

        {/* INTRO */}

        <View style={styles.intro}>
          <Text style={styles.title}>
            Verify your documents
          </Text>

          <Text style={styles.subtitle}>
            Upload clear photos of your documents. We'll
            verify them before you can start accepting rides.
          </Text>
        </View>

        {/* DOCUMENTS */}

        <View style={styles.documents}>

          <DocumentItem
            title="Driving Licence"
            description="Front and back photos required"
            status={drivingLicence}
            onPress={() => {
              setDrivingLicence(
                drivingLicence === 'uploaded'
                  ? 'pending'
                  : 'uploaded'
              );
              setError('');
            }}
          />

          <DocumentItem
            title="Registration Certificate"
            description="Upload your vehicle RC"
            status={registrationCertificate}
            onPress={() => {
              setRegistrationCertificate(
                registrationCertificate === 'uploaded'
                  ? 'pending'
                  : 'uploaded'
              );
              setError('');
            }}
          />

          <DocumentItem
            title="Vehicle Insurance"
            description="Upload your current insurance"
            status={insurance}
            onPress={() => {
              setInsurance(
                insurance === 'uploaded'
                  ? 'pending'
                  : 'uploaded'
              );
              setError('');
            }}
          />

        </View>

        {/* INFO */}

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>
            i
          </Text>

          <Text style={styles.infoText}>
            Make sure the document photos are clear,
            readable, and belong to you.
          </Text>
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
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              !allUploaded && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.buttonText}>
              Submit for verification
            </Text>

            <Text style={styles.buttonArrow}>
              →
            </Text>
          </Pressable>

          <Text style={styles.note}>
            Your documents are securely used only for
            rider verification.
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

  /* INTRO */

  intro: {
    marginTop: 38,
    marginBottom: 30,
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

  /* DOCUMENTS */

  documents: {
    gap: 14,
  },

  documentCard: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: '#D9DDE3',
    borderRadius: 17,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },

  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F0FAF5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  documentIconText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#009E4F',
  },

  documentInfo: {
    flex: 1,
    marginLeft: 13,
    marginRight: 10,
  },

  documentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#101820',
  },

  documentDescription: {
    marginTop: 5,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#737C8C',
  },

  uploadButton: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#101820',
    alignItems: 'center',
    justifyContent: 'center',
  },

  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  uploadedButton: {
    backgroundColor: '#EAF8F1',
    borderWidth: 1,
    borderColor: '#B7E4CB',
  },

  uploadedButtonText: {
    color: '#009E4F',
  },

  /* INFO */

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginTop: 22,
  },

  infoIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#101820',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 13,
    fontWeight: '700',
    marginRight: 10,
  },

  infoText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#687386',
  },

  /* ERROR */

  error: {
    fontSize: 13,
    color: '#D92D20',
    marginTop: 12,
  },

  /* BOTTOM */

  bottom: {
    marginTop: 'auto',
    paddingTop: 28,
  },

  button: {
    height: 60,
    borderRadius: 15,
    backgroundColor: '#101820',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonDisabled: {
    opacity: 0.45,
  },

  buttonPressed: {
    opacity: 0.82,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
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