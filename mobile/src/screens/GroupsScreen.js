import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { apiFetch } from "../lib/api";
import { ListSkeleton } from "../components/Skeleton";

const SAMBAL = "#DC2626";

export default function GroupsScreen({ navigation }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data, ok } = await apiFetch("/api/groups/list");
      if (ok) setGroups(data.groups ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const renderItem = ({ item }) => (
    <Pressable
      style={styles.groupCard}
      onPress={() =>
        navigation.navigate("Decide", {
          groupId: item.id,
          groupName: item.name,
          maxReroll: item.maxReroll,
          noRepeatDays: item.noRepeatDays,
          decisionModeDefault: item.decisionModeDefault,
        })
      }
    >
      <View style={styles.groupLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupMeta}>
            Code: {item.makanCode} · {item.memberCount ?? "?"} members
          </Text>
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(g) => g.id}
        renderItem={renderItem}
        ListEmptyComponent={
          loading ? (
            <ListSkeleton count={4} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptySub}>
                Create one or join with a Makan Code
              </Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load(true);
            }}
            tintColor={SAMBAL}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>Your Groups 👥</Text>
            <Text style={styles.sub}>Pick a group to decide lunch</Text>
          </View>
        }
      />

      <View style={styles.fab}>
        <Pressable
          style={styles.fabBtn}
          onPress={() => navigation.navigate("CreateGroup")}
        >
          <Text style={styles.fabText}>+ New Group</Text>
        </Pressable>
        <Pressable
          style={styles.fabBtnSecondary}
          onPress={() => navigation.navigate("JoinGroup")}
        >
          <Text style={styles.fabTextSecondary}>Join Group</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  heading: { fontSize: 24, fontWeight: "800", color: "#111827" },
  sub: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  groupCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  groupLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "800", color: SAMBAL },
  groupName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  groupMeta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  chevron: { fontSize: 22, color: "#D1D5DB" },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#374151" },
  emptySub: { fontSize: 14, color: "#9CA3AF", marginTop: 6, textAlign: "center", paddingHorizontal: 32 },
  fab: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    flexDirection: "row",
    gap: 12,
  },
  fabBtn: {
    flex: 1,
    backgroundColor: SAMBAL,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  fabText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  fabBtnSecondary: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  fabTextSecondary: { color: "#374151", fontWeight: "700", fontSize: 15 },
});
