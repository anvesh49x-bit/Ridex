import React, { useState } from 'react';
import { router } from 'expo-router';
import RidexSplash from '../components/RidexSplash';

export default function Index() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return (
      <RidexSplash
        onFinish={() => {
          setShowSplash(false);
          router.replace('/auth');
        }}
      />
    );
  }

  return null;
}