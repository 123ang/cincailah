import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { apiFetch } from "../../lib/api";

const SAMBAL = "#DC2626";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert("Enter your email", "We will send a reset link there.");
      return;
    }
    setLoading(true);
    try {
      const { ok, data } = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: { email: email.trim().toLowerCase() },
      });
      if (ok) {
        setSent(true);
      } else {
        Alert.alert("Error", data?.error || "Failed to send reset email.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>📬</Text>
        <Text style={styles.heading}>Check your inbox</Text>
        <Text style={styles.sub}>
          If that email is registered, you will get a reset link shortly.
          Open it in a browser to set a new password.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Forgot password?</Text>
      <Text style={styles.sub}>Enter your email and we will send a reset link.</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#9CA3AF"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
        onSubmitEditing={handleSubmit}
      />

      <Pressable
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Send Reset Link</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingBottom: 40,
    gap: 14,
  },
  emoji: { fontSize: 52, textAlign: "center" },
  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
  },
  sub: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  btn: {
    backgroundColor: SAMBAL,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
