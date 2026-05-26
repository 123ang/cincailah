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
  Image,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

const SAMBAL = "#FF5A00";
const CREAM = "#FFF7EB";
const CREAM_DEEP = "#FFEBCF";
const INK = "#26140B";
const MUTED = "#7A6254";
const LOGO = require("../../../assets/brand/cincailah-logo.jpeg");

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
      <View style={styles.brandHeader}>
        <Image source={LOGO} style={styles.logo} />
        <Text style={styles.kicker}>WELCOME BACK</Text>
        <Text style={styles.heading}>Ready to makan?</Text>
        <Text style={styles.sub}>Sign in and get your group spinning again.</Text>
      </View>

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
    backgroundColor: CREAM,
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingBottom: 40,
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
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: CREAM_DEEP,
    borderRadius: 16,
    backgroundColor: "#fff",
    paddingRight: 4,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: INK,
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
    borderColor: CREAM_DEEP,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: INK,
    backgroundColor: "#fff",
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
