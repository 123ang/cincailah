import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

const SAMBAL = "#DC2626";

function extractJoinCode(payload = "") {
  const text = String(payload).trim();
  if (!text) return null;

  // Accept raw code: MAKAN-ABCD
  if (/^MAKAN-[A-Z0-9]+$/i.test(text)) return text.toUpperCase();

  // Accept URL forms:
  // https://cincailah.com/join/MAKAN-ABCD
  // jiakhami://join/MAKAN-ABCD
  const match = text.match(/\/join\/([A-Z0-9-]+)$/i);
  if (match?.[1]) return match[1].toUpperCase();

  return null;
}

export default function ScanQrScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const onBarcodeScanned = ({ data }) => {
    if (scanned) return;
    setScanned(true);

    const code = extractJoinCode(data);
    if (!code) {
      Alert.alert("Invalid QR", "This QR does not contain a valid join code.", [
        { text: "Scan again", onPress: () => setScanned(false) },
      ]);
      return;
    }

    navigation.replace("JoinGroup", { code });
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.info}>Requesting camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Camera access required</Text>
        <Text style={styles.info}>
          Allow camera permission to scan the group QR invite.
        </Text>
        <Pressable style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Allow Camera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={onBarcodeScanned}
      />

      <View style={styles.overlay}>
        <Text style={styles.overlayTitle}>Scan Group QR</Text>
        <Text style={styles.overlaySub}>
          Point your camera at the Cincailah invite QR code
        </Text>
        <View style={styles.frame} />
        {scanned && (
          <Pressable style={styles.btn} onPress={() => setScanned(false)}>
            <Text style={styles.btnText}>Scan again</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: { fontSize: 22, fontWeight: "800", color: "#111827", marginBottom: 8 },
  info: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20 },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 24,
  },
  overlayTitle: { color: "#fff", fontSize: 24, fontWeight: "800", marginBottom: 6 },
  overlaySub: { color: "rgba(255,255,255,0.9)", fontSize: 13, marginBottom: 24 },
  frame: {
    width: 250,
    height: 250,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#fff",
    marginBottom: 24,
  },
  btn: {
    backgroundColor: SAMBAL,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  btnText: { color: "#fff", fontWeight: "700" },
});
