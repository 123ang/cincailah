import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useAuth } from '../../context/AuthContext';

const SAMBAL = "#DC2626";

export default function LandingScreen({ navigation }) {
  const { continueAsGuest } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>🍛</Text>
        <Text style={styles.title}>Cincailah</Text>
        <Text style={styles.tagline}>
          Stop arguing about lunch.{"\n"}Decide in 10 seconds.
        </Text>
      </View>

      <View style={styles.features}>
        <FeatureRow icon="🎲" text="Spin a random restaurant for your group" />
        <FeatureRow icon="⚔️" text="Run a live vote — We Fight mode" />
        <FeatureRow icon="🍜" text="Solo food spinner when you eat alone" />
        <FeatureRow icon="🔁" text="Anti-repeat protection built in" />
      </View>

      <View style={styles.buttons}>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => navigation.navigate("Register")}
        >
          <Text style={styles.primaryBtnText}>Get Started 🚀</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.secondaryBtnText}>I already have an account</Text>
        </Pressable>

        <Pressable
          style={styles.guestBtn}
          onPress={continueAsGuest}
        >
          <Text style={styles.guestBtnText}>Use solo (no account) →</Text>
          <Text style={styles.guestSub}>Favourites, history and reminders will stay on this device</Text>
        </Pressable>
      </View>

      <Text style={styles.footer}>Cincailah lah! 🇲🇾</Text>
    </SafeAreaView>
  );
}

function FeatureRow({ icon, text }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    justifyContent: "space-between",
    paddingVertical: 32,
  },
  hero: {
    alignItems: "center",
    marginTop: 20,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 12,
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: SAMBAL,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 17,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 24,
  },
  features: {
    gap: 14,
    paddingVertical: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    padding: 14,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
    flex: 1,
  },
  buttons: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: SAMBAL,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 15,
  },
  guestBtn: {
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: '#FFF7F7',
  },
  guestBtnText: {
    color: SAMBAL,
    fontWeight: '800',
    fontSize: 15,
    textAlign: 'center',
  },
  guestSub: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  footer: {
    textAlign: "center",
    fontSize: 13,
    color: "#D1D5DB",
    fontWeight: "600",
  },
});
