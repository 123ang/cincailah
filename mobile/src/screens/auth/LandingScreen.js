import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

const LOGO = require("../../../assets/brand/cincailah-logo.jpeg");

const BRAND = {
  orange: "#FF5A00",
  orangeDark: "#E64000",
  orangeSoft: "#FFE1CC",
  cream: "#FFF7EB",
  ink: "#26140B",
  muted: "#7A6254",
  green: "#45B619",
  blue: "#078BCE",
  purple: "#6D2CB7",
};

export default function LandingScreen({ navigation }) {
  const { continueAsGuest } = useAuth();

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.brandRow}>
          <Image source={LOGO} style={styles.navLogo} />
          <View>
            <Text style={styles.brandName}>cincailah</Text>
            <Text style={styles.brandKicker}>makan roulette</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.ringTop} />
          <Text style={styles.kicker}>FAST FOOD ROULETTE</Text>
          <Text style={styles.title}>Spin once. Go makan.</Text>
          <Text style={styles.tagline}>
            Your usual filters stay under the button, so random food feels fast
            instead of troublesome.
          </Text>
          <Image source={LOGO} style={styles.heroLogo} />
        </View>

        <View style={styles.featureGrid}>
          <FeaturePill color={BRAND.green} title="Saved mood" text="Budget, halal and vibes can stay remembered." />
          <FeaturePill color={BRAND.blue} title="Solo first" text="No signup needed when you only want a quick pick." />
          <FeaturePill color={BRAND.purple} title="We Fight" text="Run a group vote when everyone wants a say." />
        </View>

        <View style={styles.buttons}>
          <Pressable style={styles.primaryBtn} onPress={continueAsGuest}>
            <Text style={styles.primaryBtnText}>Try solo spin</Text>
            <Text style={styles.primaryBtnSub}>No account needed</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate("Register")}
          >
            <Text style={styles.secondaryBtnText}>Create group</Text>
          </Pressable>

          <Pressable
            style={styles.loginBtn}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginBtnText}>I already have an account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function FeaturePill({ color, title, text }) {
  return (
    <View style={styles.featurePill}>
      <View style={[styles.featureDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND.cream,
    paddingTop: 18,
  },
  container: {
    padding: 20,
    paddingBottom: 34,
    gap: 18,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 8,
  },
  navLogo: {
    width: 46,
    height: 46,
    borderRadius: 16,
  },
  brandName: {
    color: BRAND.ink,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  brandKicker: {
    color: BRAND.orange,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: BRAND.orange,
    borderRadius: 30,
    padding: 24,
    minHeight: 420,
    justifyContent: "space-between",
  },
  ringTop: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 24,
    borderColor: "rgba(255,255,255,0.75)",
    borderLeftColor: "transparent",
    right: -68,
    top: 116,
    transform: [{ rotate: "-20deg" }],
  },
  kicker: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    color: "#fff",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 13,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  title: {
    color: "#fff",
    fontSize: 58,
    lineHeight: 56,
    fontWeight: "900",
    letterSpacing: -2,
    marginTop: 18,
    maxWidth: 260,
  },
  tagline: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    maxWidth: 285,
    marginTop: 16,
  },
  heroLogo: {
    width: 122,
    height: 122,
    borderRadius: 30,
    alignSelf: "flex-end",
    marginTop: 16,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.72)",
  },
  featureGrid: {
    gap: 10,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: BRAND.orangeSoft,
  },
  featureDot: {
    width: 13,
    height: 44,
    borderRadius: 999,
  },
  featureTitle: {
    color: BRAND.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  featureText: {
    color: BRAND.muted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 2,
  },
  buttons: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: BRAND.orange,
    borderRadius: 20,
    paddingVertical: 17,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 17,
  },
  primaryBtnSub: {
    color: "rgba(255,255,255,0.72)",
    fontWeight: "700",
    fontSize: 12,
    marginTop: 2,
  },
  secondaryBtn: {
    borderWidth: 2,
    borderColor: BRAND.orange,
    borderRadius: 20,
    paddingVertical: 15,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  secondaryBtnText: {
    color: BRAND.orange,
    fontWeight: "900",
    fontSize: 16,
  },
  loginBtn: {
    paddingVertical: 8,
    alignItems: "center",
  },
  loginBtnText: {
    color: BRAND.muted,
    fontWeight: "800",
    fontSize: 14,
  },
});
