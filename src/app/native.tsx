import Constants from "expo-constants";
import * as NavigationBar from "expo-navigation-bar";
import * as ScreenOrientation from "expo-screen-orientation";
import React, { useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useAppStateListener } from "./stateApp";
import GameStatusBar from "./statusBar";
import EngineWebView from "./EngineWebView";
import { useDoubleBackToExit } from "./backHandler";

export default function NativeScreen() {
  const [baseUrl, setBaseUrl] = useState("");
  
  // Alteramos aqui para any para evitar conflitos de tipagem do TypeScript
  const webViewRef = useRef<any>(null);

  useDoubleBackToExit();

  const hideSystemUI = async () => {
    if (Platform.OS === "android") {
      try { await NavigationBar.setVisibilityAsync("hidden"); } catch (e) {}
    }
  };

  useAppStateListener(
    () => {
      console.log('🟢 APP EM PRIMEIRO PLANO'); 
      hideSystemUI();
      webViewRef.current?.injectJavaScript(`window.dispatchEvent(new Event('appForeground')); true;`);
    },
    () => {
      console.log('🌙 APP EM SEGUNDO PLANO / INATIVA'); 
      webViewRef.current?.injectJavaScript(`window.dispatchEvent(new Event('appBackground')); true;`);
    }
  );

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    hideSystemUI();

    const host = Constants?.expoConfig?.hostUri?.split(":")[0] || "localhost";
    setBaseUrl(`http://${host}:8081/engine/`);

    return () => {
      ScreenOrientation.unlockAsync();
      if (Platform.OS === "android") {
        try { NavigationBar.setVisibilityAsync("visible"); } catch (e) {}
      }
    };
  }, []);

  if (!baseUrl) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <GameStatusBar />
      <EngineWebView ref={webViewRef} baseUrl={baseUrl} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" }
});