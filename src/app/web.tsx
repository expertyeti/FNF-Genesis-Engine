import React, { useEffect, useState } from "react";
import { StatusBar, StyleSheet, View } from "react-native";

export default function WebScreen() {
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    setBaseUrl(window.location.origin + "/engine/");
  }, []);

  if (!baseUrl) return <View style={styles.container} />;

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      {/* Carga directamente tu index.html público a través de su URL */}
      <iframe
        src={baseUrl}
        style={styles.webFrame as any}
        title="Genesis Engine Web"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  webFrame: { flex: 1, width: "100%", height: "100%", borderWidth: 0, backgroundColor: "#000000" },
});