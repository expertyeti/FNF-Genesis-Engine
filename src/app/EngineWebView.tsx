import React, { forwardRef } from "react";
import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview"; // Importação correta

interface EngineWebViewProps {
  baseUrl: string;
}

// Alteramos WebView para any no primeiro parâmetro do forwardRef
const EngineWebView = forwardRef<any, EngineWebViewProps>(({ baseUrl }, ref) => {
  if (!baseUrl) return null;

  const injectedLoggersAndAudio = `
    const sendLog = (type, args) => {
      const message = Array.from(args).map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type, message }));
      }
    };
    console.log = function() { sendLog('log', arguments); };
    console.warn = function() { sendLog('warn', arguments); };
    console.error = function() { sendLog('error', arguments); };
    window.onerror = function(msg, src, lineno) { sendLog('error', ['FATAL:', msg, 'en', src, 'L:', lineno]); return true; };

    window._audioContexts = [];
    const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;
    if (OriginalAudioContext) {
      window.AudioContext = function() {
        const ctx = new OriginalAudioContext();
        window._audioContexts.push(ctx);
        return ctx;
      };
      window.webkitAudioContext = window.AudioContext;
    }
    true;
  `;

  return (
    <WebView
      ref={ref}
      originWhitelist={["*"]}
      source={{ uri: baseUrl }} 
      injectedJavaScriptBeforeContentLoaded={injectedLoggersAndAudio}
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
          if (data.type === 'error') console.error("🛑 [WEB]:", data.message);
          else if (data.type === 'warn') console.warn("⚠️ [WEB]:", data.message);
          else console.log("🌐 [WEB]:", data.message);
        } catch(e) {}
      }}
    />
  );
});

const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: "transparent" },
});

export default EngineWebView;