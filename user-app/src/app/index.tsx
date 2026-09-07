import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { getAuth } from '@react-native-firebase/auth';

import RidexSplash from '../components/RidexSplash';

const API_BASE_URL = 'http://10.134.158.132:3000';

export default function Index() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (showSplash) {
      return;
    }

    const checkAuthentication = async () => {
      try {
        const auth = getAuth();

        /*
         * Firebase automatically restores the previously
         * authenticated user when the app starts.
         */
        const firebaseUser = auth.currentUser;

        /*
         * No Firebase session exists.
         * Send the user to phone authentication.
         */
        if (!firebaseUser) {
          router.replace('/auth');
          return;
        }

        console.log(
          'Existing Firebase session found:',
          firebaseUser.uid
        );

        /*
         * Get a fresh Firebase ID token.
         *
         * This proves to the RIDEX backend that the
         * current user is authenticated.
         */
        const idToken = await firebaseUser.getIdToken();

        /*
         * Ask RIDEX backend to find/create the user's
         * RIDEX profile.
         */
        const response = await fetch(
          `${API_BASE_URL}/api/auth/me`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${idToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const data = await response.json();

        console.log(
          'RIDEX existing-user authentication:',
          data
        );

        /*
         * Firebase session exists but RIDEX backend
         * rejected it.
         *
         * Send the user back to authentication.
         */
        if (!response.ok) {
          router.replace('/auth');
          return;
        }

        /*
         * User is already authenticated with both
         * Firebase and RIDEX.
         *
         * No OTP required.
         */
        router.replace('/home');
      } catch (error) {
        console.error(
          'Authentication check failed:',
          error
        );

        /*
         * If anything goes wrong while restoring
         * the session, safely send the user to auth.
         */
        router.replace('/auth');
      }
    };

    checkAuthentication();
  }, [showSplash]);

  if (showSplash) {
    return (
      <RidexSplash
        onFinish={() => {
          setShowSplash(false);
        }}
      />
    );
  }

  return null;
}