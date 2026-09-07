require('dotenv').config({ path: '.env.local' });

module.exports = ({ config }) => ({
  ...config,

  android: {
    ...config.android,
  },

  plugins: [
    'expo-router',

    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey:
          process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
      },
    ],

    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Allow Ridex to use your location to find pickup and drop locations.',
      },
    ],

    '@react-native-firebase/app',
    '@react-native-firebase/auth',
  ],
});