import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Image,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { apiFetch } from "../lib/api";
import Constants from "expo-constants";
import { ListSkeleton } from "../components/Skeleton";

const SAMBAL = "#DC2626";
const BASE_URL =
  (Constants.expoConfig?.extra?.apiUrl) || "https://cincailah.com";

export default function RestaurantsScreen({ route, navigation }) {
  const { groupId, groupName } = route.params || {};
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data, ok } = await apiFetch(`/api/restaurants?groupId=${groupId}`);
      if (ok) setRestaurants(data.restaurants ?? []);
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

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {item.photoUrl ? (
        <Image
          source={{ uri: item.photoUrl.startsWith("/") ? `${BASE_URL}${item.photoUrl}` : item.photoUrl }}
          style={styles.photo}
        />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Text style={styles.photoPlaceholderText}>🍽️</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        {item.cuisineTags?.length > 0 && (
          <Text style={styles.cuisine}>{item.cuisineTags.join(" · ")}</Text>
        )}
        <Text style={styles.meta}>
          RM{item.priceMin}–{item.priceMax} · {item.walkMinutes} min 🚶
          {item.halal ? " · ✅ Halal" : ""}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={restaurants}
        keyExtractor={(r) => r.id}
        renderItem={renderItem}
        ListEmptyComponent={
          loading ? (
            <ListSkeleton count={5} />
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🍽️</Text>
              <Text style={styles.emptyTitle}>No restaurants yet</Text>
              <Text style={styles.emptySub}>Add some so Cincailah can decide for you</Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(true); }}
            tintColor={SAMBAL}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>{groupName} Restaurants</Text>
            <Text style={styles.sub}>{restaurants.length} spots in your list</Text>
          </View>
        }
      />

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("AddRestaurant", { groupId, groupName })}
      >
        <Text style={styles.fabText}>+ Add Restaurant</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  heading: { fontSize: 20, fontWeight: "800", color: "#111827" },
  sub: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 16,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  photo: { width: 80, height: 80 },
  photoPlaceholder: { backgroundColor: "#FEE2E2", justifyContent: "center", alignItems: "center" },
  photoPlaceholderText: { fontSize: 28 },
  info: { flex: 1, padding: 12, justifyContent: "center" },
  name: { fontSize: 15, fontWeight: "700", color: "#111827" },
  cuisine: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  meta: { fontSize: 12, color: "#9CA3AF", marginTop: 4 },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#374151" },
  emptySub: { fontSize: 14, color: "#9CA3AF", marginTop: 6, textAlign: "center", paddingHorizontal: 32 },
  fab: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: SAMBAL,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  fabText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
