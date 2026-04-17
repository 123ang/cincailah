/**
 * History screen — works in two modes:
 *  1. Solo (no groupId param): uses local AsyncStorage history
 *  2. Group (groupId param passed via navigation): fetches from /api/decisions
 */
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { apiFetch } from "../lib/api";
import { ListSkeleton } from "../components/Skeleton";

const SAMBAL = "#DC2626";

export default function HistoryScreen({ route }) {
  const groupId = route?.params?.groupId ?? null;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (groupId) {
        const { data, ok } = await apiFetch(`/api/decisions?groupId=${groupId}&limit=30`);
        if (ok) setHistory(data.decisions ?? []);
      } else {
        const raw = await AsyncStorage.getItem("food_history");
        setHistory(raw ? JSON.parse(raw) : []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const renderSoloItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.type}>
        {item.type === "favorite" ? "Favorite Spot" : item.type === "category" ? "Category Spin" : "Food"}
      </Text>
      {item.category ? <Text style={styles.category}>{item.category}</Text> : null}
      <Text style={styles.time}>{item.time}</Text>
    </View>
  );

  const renderGroupItem = ({ item }) => {
    const mode = item.mode === "you_pick" ? "🎲 You Pick" : "⚔️ We Fight";
    const winner = item.winner?.name ?? item.restaurants?.[0]?.name ?? "Unknown";
    const date = new Date(item.createdAt).toLocaleDateString("en-MY", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return (
      <View style={styles.card}>
        <Text style={styles.name}>{winner}</Text>
        <Text style={styles.type}>{mode}</Text>
        <Text style={styles.time}>{date}</Text>
      </View>
    );
  };

  const data = history;
  const isEmpty = !loading && data.length === 0;

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item, idx) => item.id ?? idx.toString()}
        renderItem={groupId ? renderGroupItem : renderSoloItem}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>{groupId ? "Group History" : "Solo History"}</Text>
            <Text style={styles.sub}>{groupId ? "Past group decisions" : "Your solo spins"}</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ListSkeleton count={5} />
          ) : isEmpty ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📜</Text>
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptySub}>Decisions will appear here after you use Cincailah</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
            tintColor={SAMBAL}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  heading: { fontSize: 22, fontWeight: "800", color: "#111827" },
  sub: { fontSize: 14, color: "#6B7280", marginTop: 2 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  name: { fontSize: 17, fontWeight: "700", color: "#111827" },
  type: { fontSize: 13, color: SAMBAL, fontWeight: "600", marginTop: 4 },
  category: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  time: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#374151" },
  emptySub: { fontSize: 14, color: "#9CA3AF", marginTop: 6, textAlign: "center", paddingHorizontal: 32 },
});
