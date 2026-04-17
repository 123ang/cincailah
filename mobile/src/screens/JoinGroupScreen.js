import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { apiFetch } from "../lib/api";

const SAMBAL = "#DC2626";

export default function JoinGroupScreen({ navigation, route }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const incomingCode = route?.params?.code;
    if (incomingCode && typeof incomingCode === "string") {
      setCode(incomingCode.toUpperCase());
    }
  }, [route?.params?.code]);

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      Alert.alert("Enter a code", "Paste the Makan Code from your friend.");
      return;
    }
    setLoading(true);
    try {
      const { data, ok } = await apiFetch("/api/groups/join", {
        method: "POST",
        body: { makanCode: trimmed },
      });
      if (!ok) {
        Alert.alert("Error", data?.error || "Could not join group.");
        return;
      }
      navigation.replace("Decide", {
        groupId: data.group.id,
        groupName: data.group.name,
        maxReroll: data.group.maxReroll,
        noRepeatDays: data.group.noRepeatDays,
        decisionModeDefault: data.group.decisionModeDefault,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Join a Group 🤝</Text>
      <Text style={styles.sub}>
        Enter the Makan Code your friend shared with you.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. MAKAN-A3B2"
        placeholderTextColor="#9CA3AF"
        autoCapitalize="characters"
        value={code}
        onChangeText={setCode}
        editable={!loading}
        onSubmitEditing={handleJoin}
        autoFocus
      />

      <Pressable
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleJoin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Join Group</Text>
        )}
      </Pressable>

      <Pressable
        style={styles.scanBtn}
        onPress={() => navigation.navigate("ScanQr")}
        disabled={loading}
      >
        <Text style={styles.scanBtnText}>Scan QR Instead</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 14,
  },
  heading: { fontSize: 26, fontWeight: "800", color: "#111827" },
  sub: { fontSize: 15, color: "#6B7280", lineHeight: 22 },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    backgroundColor: "#F9FAFB",
    letterSpacing: 2,
  },
  btn: {
    backgroundColor: SAMBAL,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  scanBtn: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  scanBtnText: { color: "#374151", fontWeight: "700", fontSize: 15 },
});
