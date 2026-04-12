import { useEffect, useRef } from 'react';
import { BackHandler, ToastAndroid, Platform, NativeModules } from 'react-native';

export const useDoubleBackToExit = () => {
  const backPressCount = useRef(0);

  useEffect(() => {
    const backAction = () => {
      // Si ya presionó una vez en los últimos 2 segundos, sale de la app
      if (backPressCount.current === 1) {
        BackHandler.exitApp();
        return true;
      }

      backPressCount.current += 1;

      // Detección de idioma nativa
      const locale = Platform.OS === 'ios'
        ? (NativeModules.SettingsManager?.settings?.AppleLocale || NativeModules.SettingsManager?.settings?.AppleLanguages[0])
        : NativeModules.I18nManager?.localeIdentifier;

      const isSpanish = locale && locale.toLowerCase().includes('es');
      const message = isSpanish ? "Presiona de nuevo para salir" : "Press again to exit";

      // Mostrar Toast nativo (adapta su tema claro/oscuro según el SO)
      if (Platform.OS === 'android') {
        ToastAndroid.show(message, ToastAndroid.SHORT);
      }

      // Reiniciar el contador después de 2 segundos
      setTimeout(() => {
        backPressCount.current = 0;
      }, 2000);

      return true; // Bloquea la acción por defecto
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, []);
};