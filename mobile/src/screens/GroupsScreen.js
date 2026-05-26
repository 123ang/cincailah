import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { apiFetch } from "../lib/api";
import { ListSkeleton } from "../components/Skeleton";

const SAMBAL = "#FF5A00";
const CREAM = "#FFF7EB";
const CREAM_DEEP = "#FFEBCF";
const INK = "#26140B";
const MUTED = "#7A6254";
const LOGO = require("../../assets/brand/cincailah-logo.jpeg");

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
          maxReroll: 3,
          decisionModeDefault: item.decisionModeDefault,
          role: item.role,
          createdBy: item.createdBy,
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
            <View style={styles.hero}>
              <View>
                <Text style={styles.kicker}>GROUP ROULETTE</Text>
                <Text style={styles.heading}>Your makan crews</Text>
                <Text style={styles.sub}>Pick a group and spin without rebuilding filters.</Text>
              </View>
              <Image source={LOGO} style={styles.logo} />
            </View>
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
  container: { flex: 1, backgroundColor: CREAM },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  hero: {
    backgroundColor: SAMBAL,
    borderRadius: 28,
    padding: 20,
    minHeight: 190,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  kicker: {
    alignSelf: "flex-start",
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  heading: { fontSize: 36, lineHeight: 37, fontWeight: "900", color: "#fff", letterSpacing: -1, marginTop: 18, maxWidth: 240 },
  sub: { fontSize: 14, color: "rgba(255,255,255,0.82)", marginTop: 8, fontWeight: "700", lineHeight: 20, maxWidth: 260 },
  logo: { width: 72, height: 72, borderRadius: 22, alignSelf: "flex-end", borderWidth: 3, borderColor: "rgba(255,255,255,0.65)" },
  groupCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 20,
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
    backgroundColor: CREAM_DEEP,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "800", color: SAMBAL },
  groupName: { fontSize: 16, fontWeight: "900", color: INK },
  groupMeta: { fontSize: 12, color: MUTED, marginTop: 2, fontWeight: "700" },
  chevron: { fontSize: 22, color: SAMBAL },
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
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  fabText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  fabBtnSecondary: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: CREAM_DEEP,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  fabTextSecondary: { color: INK, fontWeight: "900", fontSize: 15 },
});
