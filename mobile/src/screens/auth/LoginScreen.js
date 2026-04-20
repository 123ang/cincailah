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
} from "react-native";
import { useAuth } from "../../context/AuthContext";

const SAMBAL = "#DC2626";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    const emailNorm = email.trim().toLowerCase();

    setLoading(true);
    const { error } = await login(emailNorm, password);
    setLoading(false);

    console.log("[LoginScreen] result", { ok: !error, hasError: Boolean(error) });

    if (error) {
      Alert.alert("Login failed", error);
    }
    // On success the AuthContext updates user and AppNavigator switches to main
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.heading}>Welcome back 👋</Text>
      <Text style={styles.sub}>Sign in to your Cincailah account</Text>

      <View style={styles.form}>
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
        <View style={styles.passwordWrap}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            editable={!loading}
            onSubmitEditing={handleLogin}
          />
          <Pressable
            onPress={() => setShowPassword((v) => !v)}
            style={styles.showPwdHit}
            hitSlop={8}
            disabled={loading}
          >
            <Text style={styles.showPwdLabel}>{showPassword ? "Hide" : "Show"}</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => navigation.navigate("ForgotPassword")}
          style={styles.forgotRow}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>

        <Pressable
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Sign In</Text>
          )}
        </Pressable>
      </View>

      <Pressable
        onPress={() => navigation.navigate("Register")}
        style={styles.switchRow}
      >
        <Text style={styles.switchText}>
          Do not have an account?{" "}
          <Text style={styles.switchLink}>Create one</Text>
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },
  sub: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 32,
  },
  form: {
    gap: 12,
  },
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    backgroundColor: "#F9FAFB",
    paddingRight: 4,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
  },
  showPwdHit: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  showPwdLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: SAMBAL,
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
  forgotRow: {
    alignSelf: "flex-end",
  },
  forgotText: {
    color: SAMBAL,
    fontSize: 13,
    fontWeight: "600",
  },
  btn: {
    backgroundColor: SAMBAL,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  switchRow: {
    marginTop: 28,
    alignItems: "center",
  },
  switchText: {
    fontSize: 14,
    color: "#6B7280",
  },
  switchLink: {
    color: SAMBAL,
    fontWeight: "700",
  },
});
