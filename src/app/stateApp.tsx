import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export const useAppStateListener = (onForeground: () => void, onBackground: () => void) => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        onForeground();
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        onBackground();
      }

      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [onForeground, onBackground]);
};