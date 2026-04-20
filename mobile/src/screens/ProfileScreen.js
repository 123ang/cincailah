import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../context/AuthContext";
import {
  requestPushPermissions,
  scheduleLunchReminder,
  cancelLunchReminder,
  getReminderStatus,
} from "../lib/notifications";
import { isBiometricAvailable, authenticateWithBiometrics } from "../lib/biometrics";

const SAMBAL = "#DC2626";
const BIOMETRIC_KEY = "cincailah_biometric_enabled";

export default function ProfileScreen({ navigation }) {
  const { user, logout, mode } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    // Check push permission status
    const { status } = await import("expo-notifications").then((n) =>
      n.getPermissionsAsync()
    );
    setPushEnabled(status === "granted");

    // Check reminder
    const rem = await getReminderStatus();
    setReminderEnabled(!!rem);

    // Check biometrics
    const available = await isBiometricAvailable();
    setBiometricAvailable(available);
    const stored = await AsyncStorage.getItem(BIOMETRIC_KEY);
    setBiometricEnabled(stored === "true");
  };

  const handleLogout = async () => {
    Alert.alert("Sign out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          await logout();
          setLoggingOut(false);
        },
      },
    ]);
  };

  const handlePushToggle = async (val) => {
    if (!val) {
      Alert.alert(
        "Turn off notifications",
        "Go to your device settings to revoke notification permission.",
        [{ text: "OK" }]
      );
      return;
    }
    setPushLoading(true);
    const { granted } = await requestPushPermissions();
    setPushEnabled(granted);
    if (!granted) {
      Alert.alert(
        "Permission denied",
        "Enable notifications in your device settings to receive alerts."
      );
    }
    setPushLoading(false);
  };

  const handleReminderToggle = async (val) => {
    setReminderLoading(true);
    if (val) {
      await scheduleLunchReminder(11, 45);
      setReminderEnabled(true);
      Alert.alert("Reminder set", "You'll get a daily lunch nudge at 11:45 AM.");
    } else {
      await cancelLunchReminder();
      setReminderEnabled(false);
    }
    setReminderLoading(false);
  };

  const handleBiometricToggle = async (val) => {
    if (val) {
      const result = await authenticateWithBiometrics("Confirm to enable biometric sign-in");
      if (!result.success) return;
    }
    await AsyncStorage.setItem(BIOMETRIC_KEY, String(val));
    setBiometricEnabled(val);
  };

  const initials = user?.displayName
    ? user.displayName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "?";

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.displayName}>{user?.displayName ?? "—"}</Text>
        <Text style={styles.email}>{user?.email ?? ""}</Text>
        {!user?.emailVerified && (
          <View style={styles.unverifiedBadge}>
            <Text style={styles.unverifiedText}>⚠️ Email not verified</Text>
          </View>
        )}
      </View>

      {/* Notifications */}
      <SectionHeader title="Notifications" />
      <ToggleRow
        label="Push notifications"
        sub="Votes, reminders and updates"
        value={pushEnabled}
        onValueChange={handlePushToggle}
        loading={pushLoading}
      />
      <ToggleRow
        label="Lunch reminder"
        sub="Daily nudge at 11:45 AM"
        value={reminderEnabled}
        onValueChange={handleReminderToggle}
        loading={reminderLoading}
      />

      {/* Security */}
      {biometricAvailable && (
        <>
          <SectionHeader title="Security" />
          <ToggleRow
            label={Platform.OS === "ios" ? "Face ID / Touch ID" : "Biometric unlock"}
            sub="Quick sign-in with your biometrics"
            value={biometricEnabled}
            onValueChange={handleBiometricToggle}
          />
        </>
      )}

      {/* Account */}
      <SectionHeader title="Account" />
      <RowItem label="Mode" value={mode === 'guest' ? 'Guest' : 'Signed in'} />
      <RowItem label="Display name" value={user?.displayName ?? 'Guest'} />
      <RowItem label="Email" value={user?.email} />
      {mode === 'authed' ? (
        <Pressable style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')}>
          <Text style={styles.editBtnText}>Edit profile</Text>
        </Pressable>
      ) : null}

      {/* About */}
      <SectionHeader title="About Cincailah" />
      <InfoCard
        title="How it works"
        body={"• You Pick — the app picks a restaurant based on your filters\n• We Fight — everyone votes, most thumbs-up wins\n• Solo — spin a random food just for yourself"}
      />
      <RowItem label="Version" value="1.0.0" />

      {/* Sign out */}
      <Pressable
        style={[styles.logoutBtn, loggingOut && styles.logoutBtnDisabled]}
        onPress={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? (
          <ActivityIndicator color={SAMBAL} />
        ) : (
          <Text style={styles.logoutText}>Sign Out</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function InfoCard({ title, body }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoCardTitle}>{title}</Text>
      <Text style={styles.infoCardBody}>{body}</Text>
    </View>
  );
}

function RowItem({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value ?? "—"}</Text>
    </View>
  );
}

function ToggleRow({ label, sub, value, onValueChange, loading = false }) {
  return (
    <View style={styles.toggleRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {sub ? <Text style={styles.toggleSub}>{sub}</Text> : null}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color={SAMBAL} />
      ) : (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ true: SAMBAL, false: "#E5E7EB" }}
          thumbColor="#fff"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 60 },
  avatarWrap: { alignItems: "center", marginBottom: 28 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: SAMBAL,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: { fontSize: 28, fontWeight: "900", color: "#fff" },
  displayName: { fontSize: 20, fontWeight: "800", color: "#111827" },
  email: { fontSize: 14, color: "#6B7280", marginTop: 2 },
  unverifiedBadge: {
    marginTop: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  unverifiedText: { fontSize: 12, fontWeight: "600", color: "#92400E" },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9CA3AF",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 24,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
  },
  infoCardTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 8 },
  infoCardBody: { fontSize: 14, color: "#374151", lineHeight: 22 },
  row: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  rowLabel: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  rowValue: { fontSize: 14, color: "#111827", maxWidth: "55%", textAlign: "right" },
  toggleRow: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  toggleLabel: { fontSize: 14, fontWeight: "700", color: "#111827" },
  toggleSub: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  editBtn: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  editBtnText: { color: SAMBAL, fontWeight: '700' },
  logoutBtn: {
    marginTop: 32,
    borderWidth: 1.5,
    borderColor: SAMBAL,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutBtnDisabled: { opacity: 0.5 },
  logoutText: { color: SAMBAL, fontWeight: "700", fontSize: 15 },
});
