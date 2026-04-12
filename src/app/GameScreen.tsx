import Constants from "expo-constants";
import * as NavigationBar from "expo-navigation-bar";
import * as ScreenOrientation from "expo-screen-orientation";
import React, { useEffect, useRef, useState } from "react";
import { AppState, Platform, StatusBar, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

export default function GameScreen() {
  const [baseUrl, setBaseUrl] = useState("");
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (Platform.OS !== "web") {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    }

    const hideNavigationBar = async () => {
      if (Platform.OS === "android") {
        await NavigationBar.setVisibilityAsync("hidden");
      }
    };

    hideNavigationBar();

    // Control de segundo plano (Mutea y pausa el juego al salir de la app)
    const appStateSubscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        hideNavigationBar();
        webViewRef.current?.injectJavaScript("if(window.game && window.game.loop) { window.game.sound.mute = false; window.game.loop.wake(); } true;");
      } else if (nextAppState.match(/inactive|background/)) {
        webViewRef.current?.injectJavaScript("if(window.game && window.game.loop) { window.game.sound.mute = true; window.game.loop.sleep(); } true;");
      }
    });

    const getBaseUrl = () => {
      if (Platform.OS === "web") {
        return window.location.origin + "/engine/";
      } else {
        const host = Constants?.expoConfig?.hostUri?.split(":")[0] || "localhost";
        return `http://${host}:8081/engine/`;
      }
    };

    setBaseUrl(getBaseUrl());

    return () => {
      appStateSubscription.remove();
      if (Platform.OS !== "web") ScreenOrientation.unlockAsync();
      if (Platform.OS === "android") NavigationBar.setVisibilityAsync("visible");
    };
  }, []);

  const bootHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style> 
          body { margin: 0; background-color: #000000; overflow: hidden; width: 100vw; height: 100vh; } 
          #game-container { width: 100%; height: 100%; }
        </style>
        <script>
          // Solo activamos el puente si estamos en la app móvil (WebView)
          if (window.ReactNativeWebView) {
            const originalLog = console.log;
            const originalWarn = console.warn;
            const originalError = console.error;

            const sendLog = (type, args) => {
              const message = Array.from(args).map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
              window.ReactNativeWebView.postMessage(JSON.stringify({ type, message }));
            };
            
            console.log = function() { sendLog('log', arguments); originalLog.apply(console, arguments); };
            console.warn = function() { sendLog('warn', arguments); originalWarn.apply(console, arguments); };
            console.error = function() { sendLog('error', arguments); originalError.apply(console, arguments); };
            window.onerror = function(msg, src, lineno) { sendLog('error', ['FATAL:', msg, 'en', src, 'L:', lineno]); return true; };
          }
        </script>
      </head>
      <body>
        <div id="game-container"></div>
        <script>window.BASE_URL = '${baseUrl}';</script>
        <script src="${baseUrl}src/core/preloadScripts.js"></script>
      </body>
    </html>
  `;

  if (!baseUrl) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} translucent={true} />

      {Platform.OS === "web" ? (
        <iframe srcDoc={bootHTML} style={styles.webFrame as any} title="Genesis Engine" />
      ) : (
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html: bootHTML, baseUrl: baseUrl }}
          style={styles.fullScreen}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccess={true}
          scalesPageToFit={false}
          scrollEnabled={false}
          bounces={false} 
          overScrollMode="never"
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === 'error') console.error("🛑 [WEBVIEW ERROR]:", data.message);
              else if (data.type === 'warn') console.warn("⚠️ [WEBVIEW WARN]:", data.message);
              else console.log("🌐 [WEBVIEW LOG]:", data.message);
            } catch(e) {}
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  fullScreen: { flex: 1, backgroundColor: "transparent" },
  webFrame: { flex: 1, width: "100%", height: "100%", borderWidth: 0, backgroundColor: "#000000" },
});