/**
 * Solo mode — local food spinner, no server required.
 * Keeps using the bundled FOODS data + AsyncStorage for favourites.
 */
import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { FOODS } from "../data/foods";
import { CATEGORIES } from "../data/categories";
import { apiFetch, getToken } from "../lib/api";

const SAMBAL = "#DC2626";
const PANDAN = "#10B981";

export default function OwnScreen() {
  const [mode, setMode] = useState("food"); // food | favorite | category
  const [favorites, setFavorites] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(["Malay"]);
  const [current, setCurrent] = useState(FOODS[0]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [result, setResult] = useState(null); // final pick

  const spinAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef(null);

  const loadFavorites = async () => {
    try {
      // If logged in, try to fetch server favorites first
      const token = await getToken();
      if (token) {
        const { data, ok } = await apiFetch("/api/favorites", { token });
        if (ok && Array.isArray(data.favorites)) {
          const mapped = data.favorites.map((f) => ({
            id: f.id,
            name: f.restaurant?.name ?? f.name ?? "Unknown",
          }));
          setFavorites(mapped);
          // Keep local cache in sync
          await AsyncStorage.setItem("favorite_spots", JSON.stringify(mapped));
          return;
        }
      }
      // Fallback to local AsyncStorage
      const raw = await AsyncStorage.getItem("favorite_spots");
      setFavorites(raw ? JSON.parse(raw) : []);
    } catch {
      const raw = await AsyncStorage.getItem("favorite_spots");
      setFavorites(raw ? JSON.parse(raw) : []);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const getCurrentList = () => {
    if (mode === "favorite") return favorites;
    if (mode === "category")
      return FOODS.filter((f) => selectedCategories.includes(f.category));
    return FOODS;
  };

  const saveToHistory = async (item) => {
    try {
      const existing = await AsyncStorage.getItem("food_history");
      const history = existing ? JSON.parse(existing) : [];
      const entry = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        name: item.name,
        type: mode,
        category: item.category || null,
        time: new Date().toLocaleString(),
      };
      await AsyncStorage.setItem(
        "food_history",
        JSON.stringify([entry, ...history].slice(0, 30))
      );

      // Best-effort server sync for logged-in users.
      // If offline or unauthorized, local history is still preserved.
      const token = await getToken();
      if (token) {
        await apiFetch("/api/decisions", {
          method: "POST",
          token,
          body: {
            mode: "solo",
            soloName: item.name,
            category: item.category || null,
          },
        });
      }
    } catch {}
  };

  const startSpin = () => {
    const list = getCurrentList();
    if (mode === "category" && selectedCategories.length === 0) {
      alert("Select at least one category.");
      return;
    }
    if (!list || list.length === 0) {
      alert(
        mode === "favorite"
          ? "No favourites yet. Add some in the Favourites tab."
          : "No food found."
      );
      return;
    }
    if (isShuffling) return;

    setResult(null);
    setIsShuffling(true);

    // Spin animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(spinAnim, { toValue: 1, duration: 300, useNativeDriver: true, easing: Easing.linear }),
        Animated.timing(spinAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();

    intervalRef.current = setInterval(() => {
      setCurrent(list[Math.floor(Math.random() * list.length)]);
    }, 80);

    setTimeout(async () => {
      clearInterval(intervalRef.current);
      spinAnim.stopAnimation();
      Animated.spring(spinAnim, { toValue: 0, useNativeDriver: true }).start();

      const final = list[Math.floor(Math.random() * list.length)];
      setCurrent(final);
      setResult(final);
      setIsShuffling(false);
      await saveToHistory(final);
      try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
    }, 2800);
  };

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    setResult(null);
  };

  const switchMode = (m) => {
    setMode(m);
    setResult(null);
    if (m === "food") setCurrent(FOODS[0]);
    else if (m === "favorite") setCurrent(favorites[0] ?? { name: "No favourites" });
    else {
      const catFoods = FOODS.filter((f) => selectedCategories.includes(f.category));
      setCurrent(catFoods[0] ?? FOODS[0]);
    }
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const showImage = (mode === "food" || mode === "category") && current?.image;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Solo Mode 🎲</Text>
      <Text style={styles.sub}>Decide what to eat by yourself</Text>

      {/* Mode pills */}
      <View style={styles.modeRow}>
        {[["food", "🎲 Spin"], ["favorite", "❤️ Fav"], ["category", "🏷️ Category"]].map(([val, label]) => (
          <Pressable
            key={val}
            style={[styles.modeBtn, mode === val && styles.modeBtnActive]}
            onPress={() => switchMode(val)}
          >
            <Text style={[styles.modeBtnText, mode === val && styles.modeBtnTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Category filter */}
      {mode === "category" && (
        <View style={styles.catWrap}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              style={[styles.catBtn, selectedCategories.includes(cat) && styles.catBtnActive]}
              onPress={() => toggleCategory(cat)}
            >
              <Text style={[styles.catText, selectedCategories.includes(cat) && styles.catTextActive]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Current food card */}
      <View style={styles.foodCard}>
        {showImage ? (
          <Animated.Image
            source={current.image}
            style={[styles.foodImage, isShuffling && { transform: [{ rotate: spin }] }]}
          />
        ) : (
          <View style={styles.foodImagePlaceholder}>
            <Text style={styles.foodEmoji}>🍽️</Text>
          </View>
        )}
        <Text style={[styles.foodName, isShuffling && styles.foodNameShuffle]}>
          {current?.name ?? "—"}
        </Text>
        {current?.category && (
          <Text style={styles.foodCategory}>{current.category}</Text>
        )}
      </View>

      {/* Result banner */}
      {result && !isShuffling && (
        <View style={styles.resultBanner}>
          <Text style={styles.resultTitle}>🎉 Today you eat:</Text>
          <Text style={styles.resultName}>{result.name}</Text>
          {result.category && <Text style={styles.resultCat}>{result.category}</Text>}
        </View>
      )}

      {/* Buttons */}
      <View style={styles.btnRow}>
        <Pressable
          style={[styles.spinBtn, isShuffling && styles.spinBtnDisabled]}
          onPress={startSpin}
          disabled={isShuffling}
        >
          <Text style={styles.spinBtnText}>{isShuffling ? "Spinning…" : "Spin! 🎲"}</Text>
        </Pressable>

        {result && !isShuffling && (
          <Pressable
            style={styles.rerollBtn}
            onPress={() => { setResult(null); startSpin(); }}
          >
            <Text style={styles.rerollBtnText}>Not this 🙅</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 60 },
  heading: { fontSize: 24, fontWeight: "800", color: "#111827" },
  sub: { fontSize: 14, color: "#6B7280", marginTop: 4, marginBottom: 20 },
  modeRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  modeBtn: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  modeBtnActive: { backgroundColor: SAMBAL },
  modeBtnText: { fontSize: 12, fontWeight: "700", color: "#374151" },
  modeBtnTextActive: { color: "#fff" },
  catWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  catBtn: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  catBtnActive: { backgroundColor: PANDAN },
  catText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  catTextActive: { color: "#fff" },
  foodCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 16,
  },
  foodImage: { width: 140, height: 140, borderRadius: 70, marginBottom: 16 },
  foodImagePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  foodEmoji: { fontSize: 52 },
  foodName: { fontSize: 26, fontWeight: "800", color: "#111827" },
  foodNameShuffle: { color: SAMBAL },
  foodCategory: { fontSize: 14, color: "#6B7280", marginTop: 6 },
  resultBanner: {
    backgroundColor: "#D1FAE5",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#6EE7B7",
  },
  resultTitle: { fontSize: 14, fontWeight: "600", color: "#065F46" },
  resultName: { fontSize: 22, fontWeight: "800", color: "#064E3B", marginTop: 4 },
  resultCat: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  btnRow: { flexDirection: "row", gap: 10 },
  spinBtn: {
    flex: 1,
    backgroundColor: SAMBAL,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: SAMBAL,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  spinBtnDisabled: { opacity: 0.5 },
  spinBtnText: { color: "#fff", fontWeight: "800", fontSize: 17 },
  rerollBtn: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  rerollBtnText: { fontWeight: "700", color: "#374151" },
});
