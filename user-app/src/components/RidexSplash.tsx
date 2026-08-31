import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

type RidexSplashProps = {
  onFinish: () => void;
};

const SPLASH_DURATION = 2500;
const TRACK_WIDTH = 128;

export default function RidexSplash({ onFinish }: RidexSplashProps) {
  const { width, height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: SPLASH_DURATION,
      useNativeDriver: false, // width interpolation can't use native driver
    }).start();

    const timer = setTimeout(onFinish, SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, [onFinish, progress]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRACK_WIDTH],
  });

  // ---- Layout constants ----
  // Everything below is derived from heroWidth and heroTop so the
  // scooter, route, and logo always stay proportionally in sync —
  // change one number here instead of re-tuning four images by hand.
  const heroWidth = width * 0.88;
  const heroHeight = heroWidth * 0.72;
  const heroTop = height * 0.34;

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Hills — faint strip near the bottom, purely decorative */}
      <Image
        source={require('../../assets/images/splash-hills.png')}
        resizeMode="cover"
        style={[
          styles.hills,
          { width, height: height * 0.16, opacity: 0.25 },
        ]}
      />

      {/* Route/city — reduced size, faded back, sits behind the rider */}
      <Image
        source={require('../../assets/images/splash-route.png')}
        resizeMode="contain"
        style={[
          styles.route,
          {
            width: heroWidth * 0.72,
            height: heroWidth * 0.60,
            top: height * 0.33,
            right: width * 0.05,
            opacity: 0.25,
          },
        ]}
      />

      {/* Rider + scooter — the dominant hero element */}
      <Image
        source={require('../../assets/images/splash-rider.png')}
        resizeMode="contain"
        style={[
          styles.rider,
          {
            width: heroWidth,
            height: heroHeight,
            top: heroTop,
            left: (width - heroWidth) / 2,
          },
        ]}
      />

      {/* Logo — position formula-derived from hero so it always follows it */}
      <Image
        source={require('../../assets/images/ridex-logo.png')}
        resizeMode="contain"
        style={[
          styles.logo,
          {
            width: heroWidth * 0.95,
            height: heroWidth * 0.33,
            top: heroTop + heroHeight + height * 0.02,
          },
        ]}
      />

      {/* Loading bar — pinned near the bottom, above the hills */}
      <View style={[styles.loading, { bottom: height * 0.075 }]}>
        <View style={styles.track}>
          <Animated.View style={[styles.progress, { width: progressWidth }]} />
        </View>
        <Text style={styles.loadingText}>Starting RIDEX...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },

  hills: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    zIndex: 1,
  },

  route: {
    position: 'absolute',
    zIndex: 2,
  },

  rider: {
    position: 'absolute',
    zIndex: 3,
  },

  logo: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 4,
  },

  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },

  track: {
    width: TRACK_WIDTH,
    height: 7,
    borderRadius: 7,
    backgroundColor: '#BDBDBD',
    overflow: 'hidden',
  },

  progress: {
    height: 7,
    borderRadius: 7,
    backgroundColor: '#08A63C',
  },

  loadingText: {
    marginTop: 13,
    fontSize: 21,
    fontWeight: '400',
    color: '#252525',
  },
});