import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

const SAMBAL = "#FF5A00";
const CREAM = "#FFF7EB";
const CREAM_DEEP = "#FFEBCF";
const INK = "#26140B";
const MUTED = "#7A6254";
const LOGO = require("../../../assets/brand/cincailah-logo.jpeg");

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!displayName.trim() || !email.trim() || !password) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const { error } = await register(email.trim().toLowerCase(), password, displayName.trim());
    setLoading(false);
    if (error) {
      Alert.alert("Registration failed", error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandHeader}>
          <Image source={LOGO} style={styles.logo} />
          <Text style={styles.kicker}>NEW MAKAN CREW</Text>
          <Text style={styles.heading}>Create account</Text>
          <Text style={styles.sub}>Join and decide lunch in seconds.</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Display name"
            placeholderTextColor="#9CA3AF"
            value={displayName}
            onChangeText={setDisplayName}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />
          <TextInput
            style={styles.input}
            placeholder="Password (min 8 chars)"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            onSubmitEditing={handleRegister}
          />

          <Pressable
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Create Account</Text>
            )}
          </Pressable>
        </View>

        <Pressable
          onPress={() => navigation.navigate("Login")}
          style={styles.switchRow}
        >
          <Text style={styles.switchText}>
            Already have an account?{" "}
            <Text style={styles.switchLink}>Sign in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: CREAM,
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingVertical: 40,
  },
  brandHeader: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 22,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: CREAM_DEEP,
  },
  logo: {
    width: 62,
    height: 62,
    borderRadius: 20,
    marginBottom: 14,
  },
  kicker: {
    color: SAMBAL,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.3,
  },
  heading: {
    fontSize: 34,
    fontWeight: "900",
    color: INK,
    marginBottom: 6,
    marginTop: 8,
    letterSpacing: -0.8,
  },
  sub: {
    fontSize: 15,
    color: MUTED,
    fontWeight: "700",
    lineHeight: 21,
  },
  form: {
    gap: 12,
  },
  input: {
    borderWidth: 1.5,
    borderColor: CREAM_DEEP,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: INK,
    backgroundColor: "#fff",
  },
  btn: {
    backgroundColor: SAMBAL,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  switchRow: {
    marginTop: 28,
    alignItems: "center",
  },
  switchText: {
    fontSize: 14,
    color: MUTED,
    fontWeight: "700",
  },
  switchLink: {
    color: SAMBAL,
    fontWeight: "700",
  },
});
