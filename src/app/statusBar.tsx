import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { useAppStateListener } from './stateApp';

export default function GameStatusBar() {
  const [isHidden, setIsHidden] = useState(true);

  // Pasamos directamente las dos funciones
  useAppStateListener(
    () => setIsHidden(true),
    () => setIsHidden(false)
  );

  return <StatusBar hidden={isHidden} />;
}