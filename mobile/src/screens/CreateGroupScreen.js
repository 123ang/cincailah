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
import { apiFetch } from "../lib/api";

const SAMBAL = "#DC2626";

export default function CreateGroupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Give your group a name.");
      return;
    }
    setLoading(true);
    try {
      const { data, ok } = await apiFetch("/api/groups/create", {
        method: "POST",
        body: { name: name.trim() },
      });
      if (!ok) {
        Alert.alert("Error", data?.error || "Failed to create group.");
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
      <Text style={styles.heading}>New Group 🍛</Text>
      <Text style={styles.sub}>
        Give your makan group a name. You will get a unique Makan Code to share.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="e.g. Office Lunch Crew"
        placeholderTextColor="#9CA3AF"
        value={name}
        onChangeText={setName}
        editable={!loading}
        onSubmitEditing={handleCreate}
        autoFocus
      />

      <Pressable
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Create Group</Text>
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
    fontSize: 16,
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
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
