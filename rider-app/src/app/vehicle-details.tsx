import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const API_URL = 'http://10.134.158.132:3000';

const COLORS = {
  bg: '#FAFAFB',
  card: '#FFFFFF',
  ink: '#0D1117',
  muted: '#6B7280',
  faint: '#9CA3AF',
  border: '#E9EBEF',
  brand: '#0A8F4A',
  brandDark: '#066B37',
  brandTint: '#EAF8F0',
  danger: '#DC2626',
  dangerTint: '#FDEDEC',
};

const GRADIENT_BRAND = [
  COLORS.brand,
  COLORS.brandDark,
] as const;

const GRADIENT_INK = [
  '#171E29',
  '#0A0E14',
] as const;

type VehicleType = 'Bike' | 'Auto' | '';

type BackendVehicle = {
  id: string;
  vehicle_type: string;
  make?: string | null;
  model?: string | null;
  color?: string | null;
  registration_number?: string | null;
  registration_year?: number | null;
  is_active?: boolean;
};

type ApplicationResponse = {
  success?: boolean;
  message?: string;
  vehicle?: BackendVehicle | null;
};

const BIKE_MODELS = [
  'Honda Activa',
  'Honda Activa 6G',
  'Honda Shine',
  'Honda Unicorn',
  'Honda SP 125',
  'Hero Splendor Plus',
  'Hero HF Deluxe',
  'Hero Glamour',
  'Hero Passion Pro',
  'Hero Xtreme 160R',
  'Bajaj Pulsar 150',
  'Bajaj Pulsar NS200',
  'Bajaj CT100',
  'Bajaj Platina',
  'Bajaj Avenger',
  'TVS Jupiter',
  'TVS Ntorq 125',
  'TVS Apache RTR 160',
  'TVS Sport',
  'Yamaha FZ',
  'Yamaha Fascino',
  'Yamaha RayZR',
  'Suzuki Access 125',
  'Suzuki Gixxer',
];

const AUTO_MODELS = [
  'Bajaj RE Compact',
  'Bajaj Maxima C',
  'Bajaj RE Auto',
  'Piaggio Ape City',
  'Piaggio Ape Xtra',
  'TVS King Deluxe',
  'TVS King Duramax',
  'Mahindra Alfa Plus',
  'Mahindra Treo',
  'Atul Gemini',
  'Atul Elite',
];

const COLOR_OPTIONS = [
  { name: 'Black', hex: '#111318' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Red', hex: '#D62828' },
  { name: 'Blue', hex: '#1D4ED8' },
  { name: 'Grey', hex: '#9CA3AF' },
  { name: 'Silver', hex: '#C7CBD1' },
  { name: 'Green', hex: '#15803D' },
  { name: 'Yellow', hex: '#F5C518' },
  { name: 'Maroon', hex: '#7B1E3A' },
  { name: 'Orange', hex: '#EA6A12' },
  { name: 'Matte Black', hex: '#1C1C1E' },
  { name: 'Pearl White', hex: '#F5F5F0' },
];

interface FloatingInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  zIndex?: number;
  suggestions?: string[];
  renderSwatch?: (item: string) => string | undefined;
  editable?: boolean;
}

function FloatingInput({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  autoCapitalize = 'words',
  zIndex = 1,
  suggestions,
  renderSwatch,
  editable = true,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);

  const labelAnim = useRef(
    new Animated.Value(value ? 1 : 0),
  ).current;

  const filtered =
    suggestions && value.trim()
      ? suggestions
          .filter((item) =>
            item
              .toLowerCase()
              .includes(value.trim().toLowerCase()),
          )
          .slice(0, 5)
      : [];

  const showDropdown =
    focused && filtered.length > 0;

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue:
        focused || value.length > 0 ? 1 : 0,
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [focused, value]);

  return (
    <View style={[styles.field, { zIndex }]}>
      <View style={styles.fieldIconWrap}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={
            focused
              ? COLORS.brand
              : COLORS.faint
          }
        />
      </View>

      <Animated.Text
        style={[
          styles.floatingLabel,
          {
            top: labelAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [17, 6],
            }),
            fontSize: labelAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [15, 11.5],
            }),
            color: focused
              ? COLORS.brand
              : COLORS.faint,
          },
        ]}
      >
        {label}
      </Animated.Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() =>
          setTimeout(
            () => setFocused(false),
            120,
          )
        }
        placeholder={
          focused ? placeholder : ''
        }
        placeholderTextColor={COLORS.faint}
        style={[
          styles.floatingInputControl,
          focused &&
            styles.floatingInputControlFocused,
        ]}
        autoCapitalize={autoCapitalize}
        editable={editable}
      />

      {showDropdown && (
        <View style={styles.suggestionBox}>
          {filtered.map((item, index) => {
            const swatch =
              renderSwatch?.(item);

            return (
              <Pressable
                key={item}
                onPress={() => {
                  onChangeText(item);
                  setFocused(false);
                }}
                style={[
                  styles.suggestionItem,
                  index ===
                    filtered.length - 1 &&
                    styles.suggestionItemLast,
                ]}
              >
                {swatch && (
                  <View
                    style={[
                      styles.suggestionSwatch,
                      {
                        backgroundColor:
                          swatch,
                      },
                      swatch === '#FFFFFF' &&
                        styles.suggestionSwatchBorder,
                    ]}
                  />
                )}

                <Text
                  style={
                    styles.suggestionText
                  }
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function VehicleDetailsScreen() {
  const [vehicleType, setVehicleType] =
    useState<VehicleType>('');

  const [vehicleNumber, setVehicleNumber] =
    useState('');

  const [vehicleModel, setVehicleModel] =
    useState('');

  const [vehicleColor, setVehicleColor] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const entrance = useRef(
    new Animated.Value(0),
  ).current;

  const buttonScale = useRef(
    new Animated.Value(1),
  ).current;

  const modelSuggestions =
    vehicleType === 'Auto'
      ? AUTO_MODELS
      : BIKE_MODELS;

  const colorNames =
    COLOR_OPTIONS.map(
      (item) => item.name,
    );

  const swatchFor = (name: string) =>
    COLOR_OPTIONS.find(
      (item) => item.name === name,
    )?.hex;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    loadVehicleDetails();
  }, []);

  const getFirebaseToken = async () => {
    const currentUser =
      getAuth().currentUser;

    if (!currentUser) {
      throw new Error(
        'Your session has expired. Please login again.',
      );
    }

    return currentUser.getIdToken();
  };

  const loadVehicleDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const token =
        await getFirebaseToken();

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

      const data: ApplicationResponse =
        await response.json();

      if (
        !response.ok ||
        data.success !== true
      ) {
        throw new Error(
          data.message ||
            'Unable to load vehicle details.',
        );
      }

      const vehicle =
        data.vehicle;

      if (!vehicle) {
        return;
      }

      const backendType =
        vehicle.vehicle_type?.toLowerCase();

      if (backendType === 'bike') {
        setVehicleType('Bike');
      } else if (
        backendType === 'auto'
      ) {
        setVehicleType('Auto');
      } else {
        setVehicleType('');
      }

      setVehicleNumber(
        vehicle.registration_number
          ?.toUpperCase() ?? '',
      );

      setVehicleModel(
        vehicle.model ?? '',
      );

      setVehicleColor(
        vehicle.color ?? '',
      );
    } catch (err) {
      console.error(
        '[RIDEX VEHICLE] Load error:',
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load vehicle details.',
      );
    } finally {
      setLoading(false);
    }
  };

  const selectType = (
    type: VehicleType,
  ) => {
    if (saving) return;

    Haptics.impactAsync(
      Haptics.ImpactFeedbackStyle.Light,
    );

    setVehicleType(type);
    setVehicleModel('');
    setError('');
  };

  const saveVehicleDetails =
    async () => {
      if (saving) return;

      setError('');

      if (!vehicleType) {
        setError(
          'Please select your vehicle type.',
        );

        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );

        return;
      }

      const registrationNumber =
        vehicleNumber.trim().toUpperCase();

      if (registrationNumber.length < 3) {
        setError(
          'Please enter a valid vehicle number.',
        );

        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );

        return;
      }

      if (!vehicleModel.trim()) {
        setError(
          'Please enter your vehicle model.',
        );

        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );

        return;
      }

      if (!vehicleColor.trim()) {
        setError(
          'Please enter your vehicle color.',
        );

        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );

        return;
      }

      try {
        setSaving(true);

        const token =
          await getFirebaseToken();

        const backendVehicleType =
          vehicleType === 'Bike'
            ? 'bike'
            : 'auto';

        const response = await fetch(
          `${API_URL}/api/rider/application/vehicle`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type':
                'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              vehicleType:
                backendVehicleType,

              /*
               * The current RIDEX UI collects
               * the complete model name rather
               * than a separate manufacturer.
               */
              make: null,

              model:
                vehicleModel.trim(),

              color:
                vehicleColor.trim(),

              registrationNumber,

              registrationYear: null,
            }),
          },
        );

        const data =
          await response.json();

        if (
          !response.ok ||
          data.success !== true
        ) {
          throw new Error(
            data.message ||
              'Unable to save vehicle details.',
          );
        }

        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );

        /*
         * Navigate ONLY after backend
         * confirms the save.
         */
        router.push('/documents');
      } catch (err) {
        console.error(
          '[RIDEX VEHICLE] Save error:',
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to save vehicle details.',
        );

        Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error,
        );
      } finally {
        setSaving(false);
      }
    };

  const pressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loadingScreen}
      >
        <ActivityIndicator
          size="large"
          color={COLORS.brand}
        />

        <Text
          style={styles.loadingText}
        >
          Loading your vehicle details...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <ScrollView
        contentContainerStyle={
          styles.container
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Pressable
            onPress={() => {
              if (saving) return;

              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace(
                  '/personal-details',
                );
              }
            }}
            style={styles.backButton}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={COLORS.ink}
            />
          </Pressable>

          <View>
            <Text style={styles.step}>
              STEP 2 OF 3
            </Text>

            <Text
              style={styles.headerTitle}
            >
              Vehicle details
            </Text>
          </View>
        </View>

        {/* PROGRESS */}

        <View
          style={
            styles.progressContainer
          }
        >
          <LinearGradient
            colors={GRADIENT_BRAND}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressSegment}
          />

          <LinearGradient
            colors={GRADIENT_BRAND}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressSegment}
          />

          <View
            style={
              styles.progressInactive
            }
          />
        </View>

        <Animated.View
          style={{
            opacity: entrance,
            transform: [
              {
                translateY:
                  entrance.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
              },
            ],
            position: 'relative',
            zIndex: 2,
          }}
        >
          {/* INTRO */}

          <View style={styles.intro}>
            <Text style={styles.title}>
              Tell us about{'\n'}your vehicle
            </Text>

            <Text
              style={styles.subtitle}
            >
              Add the vehicle you'll use for
              RIDEX rides.
            </Text>
          </View>

          {/* FORM CARD */}

          <View style={styles.card}>
            <Text
              style={styles.cardLabel}
            >
              Vehicle type
            </Text>

            <View style={styles.typeRow}>
              <Pressable
                onPress={() =>
                  selectType('Bike')
                }
                disabled={saving}
                style={[
                  styles.typeCard,
                  vehicleType === 'Bike' &&
                    styles.typeCardActive,
                ]}
              >
                {vehicleType ===
                  'Bike' && (
                  <View
                    style={styles.typeCheck}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={COLORS.brand}
                    />
                  </View>
                )}

                <View
                  style={[
                    styles.typeIconCircle,
                    vehicleType ===
                      'Bike' &&
                      styles.typeIconCircleActive,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="motorbike"
                    size={22}
                    color={
                      vehicleType ===
                      'Bike'
                        ? '#FFFFFF'
                        : COLORS.muted
                    }
                  />
                </View>

                <Text
                  style={[
                    styles.typeText,
                    vehicleType ===
                      'Bike' &&
                      styles.typeTextActive,
                  ]}
                >
                  Bike
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  selectType('Auto')
                }
                disabled={saving}
                style={[
                  styles.typeCard,
                  vehicleType === 'Auto' &&
                    styles.typeCardActive,
                ]}
              >
                {vehicleType ===
                  'Auto' && (
                  <View
                    style={styles.typeCheck}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={COLORS.brand}
                    />
                  </View>
                )}

                <View
                  style={[
                    styles.typeIconCircle,
                    vehicleType ===
                      'Auto' &&
                      styles.typeIconCircleActive,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="rickshaw"
                    size={22}
                    color={
                      vehicleType ===
                      'Auto'
                        ? '#FFFFFF'
                        : COLORS.muted
                    }
                  />
                </View>

                <Text
                  style={[
                    styles.typeText,
                    vehicleType ===
                      'Auto' &&
                      styles.typeTextActive,
                  ]}
                >
                  Auto
                </Text>
              </Pressable>
            </View>

            <View
              style={styles.divider}
            />

            <FloatingInput
              label="Vehicle number"
              value={vehicleNumber}
              onChangeText={(text) => {
                setVehicleNumber(
                  text.toUpperCase(),
                );
                setError('');
              }}
              placeholder="AP 16 AB 1234"
              icon="card-text-outline"
              autoCapitalize="characters"
              zIndex={30}
              editable={!saving}
            />

            <View
              style={styles.divider}
            />

            <FloatingInput
              label="Vehicle model"
              value={vehicleModel}
              onChangeText={(text) => {
                setVehicleModel(text);
                setError('');
              }}
              placeholder={
                vehicleType === 'Auto'
                  ? 'Bajaj RE Compact'
                  : 'Honda Activa'
              }
              icon="engine-outline"
              suggestions={
                modelSuggestions
              }
              zIndex={20}
              editable={!saving}
            />

            <View
              style={styles.divider}
            />

            <FloatingInput
              label="Vehicle color"
              value={vehicleColor}
              onChangeText={(text) => {
                setVehicleColor(text);
                setError('');
              }}
              placeholder="Black"
              icon="palette-outline"
              suggestions={
                colorNames
              }
              renderSwatch={
                swatchFor
              }
              zIndex={10}
              editable={!saving}
            />
          </View>

          {/* ERROR */}

          {error !== '' && (
            <View
              style={styles.errorBanner}
            >
              <Ionicons
                name="alert-circle"
                size={18}
                color={COLORS.danger}
              />

              <Text
                style={styles.errorText}
              >
                {error}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* BOTTOM */}

        <View style={styles.bottom}>
          <Animated.View
            style={{
              transform: [
                {
                  scale: buttonScale,
                },
              ],
            }}
          >
            <Pressable
              onPress={
                saveVehicleDetails
              }
              onPressIn={pressIn}
              onPressOut={pressOut}
              disabled={saving}
            >
              <LinearGradient
                colors={GRADIENT_INK}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.button,
                  saving &&
                    styles.buttonDisabled,
                ]}
              >
                {saving ? (
                  <>
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.buttonText
                      }
                    >
                      Saving...
                    </Text>
                  </>
                ) : (
                  <>
                    <Text
                      style={
                        styles.buttonText
                      }
                    >
                      Continue
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color="#FFFFFF"
                    />
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <Text style={styles.note}>
            Your vehicle details help us
            verify your rider account.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
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
    color: COLORS.muted,
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.ink,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  step: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: COLORS.brand,
    marginBottom: 2,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.ink,
  },

  progressContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 22,
  },

  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 4,
  },

  progressInactive: {
    flex: 1,
    height: 4,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },

  intro: {
    marginTop: 30,
    marginBottom: 26,
  },

  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: COLORS.ink,
    letterSpacing: -0.8,
  },

  subtitle: {
    marginTop: 10,
    fontSize: 14.5,
    lineHeight: 21,
    color: COLORS.muted,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 6,
    shadowColor: COLORS.ink,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F2F5',
  },

  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },

  typeCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    backgroundColor: '#FCFCFD',
  },

  typeCardActive: {
    borderColor: COLORS.brand,
    backgroundColor: COLORS.brandTint,
  },

  typeCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
  },

  typeIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EEF0F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  typeIconCircleActive: {
    backgroundColor: COLORS.brand,
  },

  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.muted,
  },

  typeTextActive: {
    color: COLORS.brandDark,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: '#F1F2F5',
    marginVertical: 18,
  },

  field: {
    position: 'relative',
  },

  fieldIconWrap: {
    position: 'absolute',
    left: 0,
    bottom: 12,
  },

  floatingLabel: {
    position: 'absolute',
    left: 26,
    fontWeight: '600',
  },

  floatingInputControl: {
    height: 52,
    paddingLeft: 26,
    paddingTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ink,
    borderBottomWidth: 1.5,
    borderBottomColor: 'transparent',
  },

  floatingInputControlFocused: {
    borderBottomColor: COLORS.brand,
  },

  suggestionBox: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 4,
    shadowColor: COLORS.ink,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 8,
  },

  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F6F8',
  },

  suggestionItemLast: {
    borderBottomWidth: 0,
  },

  suggestionSwatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },

  suggestionSwatchBorder: {
    borderWidth: 1,
    borderColor: '#E3E5E9',
  },

  suggestionText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.ink,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.dangerTint,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 18,
  },

  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.danger,
    flexShrink: 1,
  },

  bottom: {
    marginTop: 'auto',
    paddingTop: 28,
    position: 'relative',
    zIndex: 1,
  },

  button: {
    height: 58,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.ink,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 6,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  note: {
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 10,
    fontSize: 11.5,
    lineHeight: 17,
    color: COLORS.faint,
  },
});