import { useEffect, useRef, useState } from 'react';
import {
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// ---------------------------------------------------------------------------
// DEPENDENCIES — run before using this screen:
//   npx expo install expo-linear-gradient expo-haptics
//   (@expo/vector-icons ships with Expo by default)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// DESIGN TOKENS
// Centralising these makes the "premium" feel easy to tune from one place
// instead of hunting through styles.
// ---------------------------------------------------------------------------

const COLORS_TOKENS = {
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

const GRADIENT_BRAND = [COLORS_TOKENS.brand, COLORS_TOKENS.brandDark] as const;
const GRADIENT_INK = ['#171E29', '#0A0E14'] as const;

// ---------------------------------------------------------------------------
// SUGGESTION DATA
// ---------------------------------------------------------------------------

type VehicleType = 'Bike' | 'Auto' | '';

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

const COLOR_OPTIONS: { name: string; hex: string }[] = [
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

// ---------------------------------------------------------------------------
// FLOATING-LABEL INPUT WITH SUGGESTIONS
// ---------------------------------------------------------------------------

interface FloatingInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  zIndex?: number;
  suggestions?: string[];
  renderSwatch?: (item: string) => string | undefined; // returns a hex code
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
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const filtered =
    suggestions && value.trim().length > 0
      ? suggestions
          .filter((item) =>
            item.toLowerCase().includes(value.trim().toLowerCase())
          )
          .slice(0, 5)
      : [];

  const showDropdown = focused && filtered.length > 0;

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: focused || value.length > 0 ? 1 : 0,
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [focused, value]);

  useEffect(() => {
    Animated.timing(dropdownAnim, {
      toValue: showDropdown ? 1 : 0,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [showDropdown]);

  return (
    <View style={[styles.field, { zIndex }]}>
      <View style={styles.fieldIconWrap}>
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={focused ? COLORS_TOKENS.brand : COLORS_TOKENS.faint}
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
            color: focused ? COLORS_TOKENS.brand : COLORS_TOKENS.faint,
          },
        ]}
      >
        {label}
      </Animated.Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 120)}
        placeholder={focused ? placeholder : ''}
        placeholderTextColor={COLORS_TOKENS.faint}
        style={[
          styles.floatingInputControl,
          focused && styles.floatingInputControlFocused,
        ]}
        autoCapitalize={autoCapitalize}
      />

      {showDropdown && (
        <Animated.View
          style={[
            styles.suggestionBox,
            {
              opacity: dropdownAnim,
              transform: [
                {
                  translateY: dropdownAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-6, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {filtered.map((item, index) => {
            const swatch = renderSwatch?.(item);
            return (
              <Pressable
                key={item}
                onPress={() => {
                  onChangeText(item);
                  setFocused(false);
                }}
                style={({ pressed }) => [
                  styles.suggestionItem,
                  index === filtered.length - 1 && styles.suggestionItemLast,
                  pressed && styles.suggestionItemPressed,
                ]}
              >
                {swatch && (
                  <View
                    style={[
                      styles.suggestionSwatch,
                      { backgroundColor: swatch },
                      swatch === '#FFFFFF' && styles.suggestionSwatchBorder,
                    ]}
                  />
                )}
                <Text style={styles.suggestionText}>{item}</Text>
              </Pressable>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// SCREEN
// ---------------------------------------------------------------------------

export default function VehicleDetailsScreen() {
  const [vehicleType, setVehicleType] = useState<VehicleType>('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [error, setError] = useState('');

  const modelSuggestions = vehicleType === 'Auto' ? AUTO_MODELS : BIKE_MODELS;
  const colorNames = COLOR_OPTIONS.map((c) => c.name);
  const swatchFor = (name: string) =>
    COLOR_OPTIONS.find((c) => c.name === name)?.hex;

  const isComplete =
    !!vehicleType &&
    vehicleNumber.trim().length > 0 &&
    vehicleModel.trim().length > 0 &&
    vehicleColor.trim().length > 0;

  // Entrance animation — a subtle fade + rise, standard on premium onboarding flows.
  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  // Button press micro-interaction.
  const buttonScale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(buttonScale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
    }).start();
  const pressOut = () =>
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
    }).start();

  const selectType = (type: VehicleType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVehicleType(type);
    setVehicleModel('');
    setError('');
  };

  const continueNext = () => {
    if (!vehicleType) {
      setError('Please select your vehicle type.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (!vehicleNumber.trim()) {
      setError('Please enter your vehicle number.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (!vehicleModel.trim()) {
      setError('Please enter your vehicle model.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (!vehicleColor.trim()) {
      setError('Please enter your vehicle color.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setError('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/documents');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={COLORS_TOKENS.ink} />
          </Pressable>

          <View>
            <Text style={styles.step}>STEP 2 OF 3</Text>
            <Text style={styles.headerTitle}>Vehicle details</Text>
          </View>
        </View>

        {/* PROGRESS */}
        <View style={styles.progressContainer}>
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
          <View style={styles.progressInactive} />
        </View>

        <Animated.View
          style={{
            opacity: entrance,
            transform: [
              {
                translateY: entrance.interpolate({
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
            <Text style={styles.title}>Tell us about{'\n'}your vehicle</Text>
            <Text style={styles.subtitle}>
              Add the vehicle you'll use for RIDEX rides.
            </Text>
          </View>

          {/* FORM CARD */}
          <View style={styles.card}>
            {/* VEHICLE TYPE */}
            <Text style={styles.cardLabel}>Vehicle type</Text>
            <View style={styles.typeRow}>
              {(
                [
                  { key: 'Bike', icon: 'motorbike', title: 'Bike' },
                  { key: 'Auto', icon: 'rickshaw', title: 'Auto' },
                ] as const
              ).map((option) => {
                const active = vehicleType === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => selectType(option.key)}
                    style={[styles.typeCard, active && styles.typeCardActive]}
                  >
                    {active && (
                      <View style={styles.typeCheck}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={COLORS_TOKENS.brand}
                        />
                      </View>
                    )}
                    <View
                      style={[
                        styles.typeIconCircle,
                        active && styles.typeIconCircleActive,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={option.icon}
                        size={22}
                        color={active ? '#FFFFFF' : COLORS_TOKENS.muted}
                      />
                    </View>
                    <Text
                      style={[styles.typeText, active && styles.typeTextActive]}
                    >
                      {option.title}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.divider} />

            {/* VEHICLE NUMBER */}
            <FloatingInput
              label="Vehicle number"
              value={vehicleNumber}
              onChangeText={(t) => {
                setVehicleNumber(t.toUpperCase());
                setError('');
              }}
              placeholder="AP 16 AB 1234"
              icon="card-text-outline"
              autoCapitalize="characters"
              zIndex={30}
            />

            <View style={styles.divider} />

            {/* VEHICLE MODEL */}
            <FloatingInput
              label="Vehicle model"
              value={vehicleModel}
              onChangeText={(t) => {
                setVehicleModel(t);
                setError('');
              }}
              placeholder={
                vehicleType === 'Auto' ? 'Bajaj RE Compact' : 'Honda Activa'
              }
              icon="engine-outline"
              suggestions={modelSuggestions}
              zIndex={20}
            />

            <View style={styles.divider} />

            {/* VEHICLE COLOR */}
            <FloatingInput
              label="Vehicle color"
              value={vehicleColor}
              onChangeText={(t) => {
                setVehicleColor(t);
                setError('');
              }}
              placeholder="Black"
              icon="palette-outline"
              suggestions={colorNames}
              renderSwatch={swatchFor}
              zIndex={10}
            />
          </View>

          {/* ERROR */}
          {error !== '' && (
            <View style={styles.errorBanner}>
              <Ionicons
                name="alert-circle"
                size={18}
                color={COLORS_TOKENS.danger}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </Animated.View>

        {/* BOTTOM */}
        <View style={styles.bottom}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Pressable
              onPress={continueNext}
              onPressIn={pressIn}
              onPressOut={pressOut}
            >
              <LinearGradient
                colors={GRADIENT_INK}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.button, !isComplete && styles.buttonMuted]}
              >
                <Text style={styles.buttonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <Text style={styles.note}>
            Your vehicle details help us verify your rider account.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS_TOKENS.bg,
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },

  /* HEADER */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS_TOKENS.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D1117',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  step: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: COLORS_TOKENS.brand,
    marginBottom: 2,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS_TOKENS.ink,
    letterSpacing: -0.2,
  },

  /* PROGRESS */

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
    backgroundColor: COLORS_TOKENS.border,
  },

  /* INTRO */

  intro: {
    marginTop: 30,
    marginBottom: 26,
  },

  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: COLORS_TOKENS.ink,
    letterSpacing: -0.8,
  },

  subtitle: {
    marginTop: 10,
    fontSize: 14.5,
    lineHeight: 21,
    color: COLORS_TOKENS.muted,
  },

  /* FORM CARD */

  card: {
    backgroundColor: COLORS_TOKENS.card,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 6,
    shadowColor: '#0D1117',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F2F5',
  },

  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS_TOKENS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  divider: {
    height: 1,
    backgroundColor: '#F1F2F5',
    marginVertical: 18,
  },

  /* VEHICLE TYPE */

  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },

  typeCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS_TOKENS.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    backgroundColor: '#FCFCFD',
  },

  typeCardActive: {
    borderColor: COLORS_TOKENS.brand,
    backgroundColor: COLORS_TOKENS.brandTint,
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
    backgroundColor: COLORS_TOKENS.brand,
  },

  typeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS_TOKENS.muted,
  },

  typeTextActive: {
    color: COLORS_TOKENS.brandDark,
    fontWeight: '700',
  },

  /* FLOATING INPUT */

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
    color: COLORS_TOKENS.ink,
    borderBottomWidth: 1.5,
    borderBottomColor: 'transparent',
  },

  floatingInputControlFocused: {
    borderBottomColor: COLORS_TOKENS.brand,
  },

  /* SUGGESTIONS */

  suggestionBox: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS_TOKENS.border,
    paddingVertical: 4,
    shadowColor: '#0D1117',
    shadowOffset: { width: 0, height: 8 },
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

  suggestionItemPressed: {
    backgroundColor: '#F7FAF8',
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
    color: COLORS_TOKENS.ink,
  },

  /* ERROR */

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS_TOKENS.dangerTint,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 18,
  },

  errorText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS_TOKENS.danger,
    flexShrink: 1,
  },

  /* BOTTOM */

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
    shadowColor: COLORS_TOKENS.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 6,
  },

  buttonMuted: {
    opacity: 0.55,
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
    color: COLORS_TOKENS.faint,
  },
});