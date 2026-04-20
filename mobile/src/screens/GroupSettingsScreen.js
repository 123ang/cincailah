import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Share,
} from "react-native";
import { apiFetch } from "../lib/api";

const SAMBAL = "#DC2626";

export default function GroupSettingsScreen({ route, navigation }) {
  const { groupId, groupName: initialName } = route.params || {};

  const [group, setGroup] = useState(null);
  const [name, setName] = useState(initialName ?? "");
  const [noRepeatDays, setNoRepeatDays] = useState("7");
  const [maxReroll, setMaxReroll] = useState("2");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, ok } = await apiFetch(`/api/groups/${groupId}`);
      if (ok && data.group) {
        const g = data.group;
        setGroup(g);
        setName(g.name);
        setNoRepeatDays(String(g.noRepeatDays ?? 7));
        setMaxReroll(String(g.maxReroll ?? 2));
      }
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data, ok } = await apiFetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        body: {
          name: name.trim() || undefined,
          noRepeatDays: Number(noRepeatDays) || 7,
          maxReroll: Number(maxReroll) || 2,
        },
      });
      if (!ok) {
        Alert.alert("Error", data?.error || "Failed to save settings.");
        return;
      }
      Alert.alert("Saved!", "Group settings updated.");
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!group) return;
    const makanCode = group.makanCode;
    const webJoinLink = `https://cincailah.suntzutechnologies.com/join/${encodeURIComponent(makanCode)}`;
    await Share.share({
      message: `Join my Cincailah group "${group.name}"!\n\nTap to join: ${webJoinLink}\n\nMakan Code: ${makanCode}\n\nIf the app doesn't open, copy the code into Join Group.`,
    });
  };

  const handleLeave = () => {
    Alert.alert("Leave group", `Are you sure you want to leave "${group?.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          await apiFetch(`/api/groups/${groupId}/leave`, { method: "POST" });
          navigation.navigate("Groups");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={SAMBAL} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Group Settings</Text>
      <Text style={styles.sub}>Makan Code: {group?.makanCode ?? "—"}</Text>

      <Pressable style={styles.shareBtn} onPress={handleShare}>
        <Text style={styles.shareBtnText}>📤 Share Invite Link</Text>
      </Pressable>

      <Text style={styles.label}>Group Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        editable={!saving}
      />

      <Text style={styles.label}>No-repeat window (days)</Text>
      <TextInput
        style={styles.input}
        value={noRepeatDays}
        onChangeText={setNoRepeatDays}
        keyboardType="number-pad"
        editable={!saving}
      />

      <Text style={styles.label}>Max rerolls per decision</Text>
      <TextInput
        style={styles.input}
        value={maxReroll}
        onChangeText={setMaxReroll}
        keyboardType="number-pad"
        editable={!saving}
      />

      <Pressable
        style={[styles.btn, saving && styles.btnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Changes</Text>}
      </Pressable>

      <Pressable style={styles.leaveBtn} onPress={handleLeave}>
        <Text style={styles.leaveBtnText}>Leave Group</Text>
      </Pressable>

      {/* Restaurants & History shortcuts */}
      <View style={styles.shortcuts}>
        <Pressable
          style={styles.shortcut}
          onPress={() => navigation.navigate("Restaurants", { groupId, groupName: name })}
        >
          <Text style={styles.shortcutText}>🍽️ Restaurants</Text>
        </Pressable>
        <Pressable
          style={styles.shortcut}
          onPress={() => navigation.navigate("GroupHistory", { groupId })}
        >
          <Text style={styles.shortcutText}>📜 History</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { flex: 1, backgroundColor: "#fff" },
  container: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 60 },
  heading: { fontSize: 24, fontWeight: "800", color: "#111827" },
  sub: { fontSize: 13, color: "#6B7280", marginBottom: 16 },
  shareBtn: {
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
  },
  shareBtnText: { color: "#1D4ED8", fontWeight: "700" },
  label: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  btn: {
    backgroundColor: SAMBAL,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  leaveBtn: {
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  leaveBtnText: { color: SAMBAL, fontWeight: "700" },
  shortcuts: { flexDirection: "row", gap: 12, marginTop: 28 },
  shortcut: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  shortcutText: { fontWeight: "600", color: "#374151" },
});
