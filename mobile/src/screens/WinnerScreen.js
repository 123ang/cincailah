/**
 * Winner reveal screen — mirrors web RouletteSpinner result phase.
 * Supports "Not this 🙅" reroll up to maxReroll times.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Animated,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useAudioPlayer } from "expo-audio";
import { apiFetch } from "../lib/api";

const SAMBAL = "#DC2626";
const PANDAN = "#10B981";

export default function WinnerScreen({ route, navigation }) {
  const {
    winner: initialWinner,
    groupId,
    maxReroll = 2,
    excludeIds: initialExcludeIds = [],
    filters = {},
  } = route.params || {};

  const [winner, setWinner] = useState(initialWinner);
  const [excludeIds, setExcludeIds] = useState(initialExcludeIds);
  const [rerollsUsed, setRerollsUsed] = useState(0);
  const [loading, setLoading] = useState(false);

  const scale = useRef(new Animated.Value(0.6)).current;
  const player = useAudioPlayer(require("../../assets/sounds/winner.mp3"));

  useEffect(() => {
    // Bounce-in animation
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start();

    // Sound + haptics
    try { player.play(); } catch {}
    try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
  }, [winner, player, scale]);

  const handleReroll = async () => {
    if (rerollsUsed >= maxReroll) return;
    setLoading(true);
    try {
      const nextExclude = [...excludeIds, winner.id];
      const { data, ok } = await apiFetch("/api/decide", {
        method: "POST",
        body: { groupId, filters, excludeIds: nextExclude },
      });
      if (!ok) {
        Alert.alert("Aiyah…", data?.error || "No more restaurants.");
        return;
      }
      scale.setValue(0.6);
      setWinner(data.winner);
      setExcludeIds(nextExclude);
      setRerollsUsed((n) => n + 1);
    } finally {
      setLoading(false);
    }
  };

  const rerollsLeft = maxReroll - rerollsUsed;

  const cuisineTags = Array.isArray(winner?.cuisineTags) ? winner.cuisineTags : [];
  const vibeTags = Array.isArray(winner?.vibeTags) ? winner.vibeTags : [];

  return (
    <View style={styles.container}>
      <Text style={styles.crown}>🎉 The boss has spoken!</Text>

      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <View style={styles.cardHero}>
          <Text style={styles.heroEmoji}>🍜</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>You Pick</Text>
          </View>
          {rerollsUsed > 0 && (
            <View style={styles.rerollBadge}>
              <Text style={styles.rerollBadgeText}>Reroll {rerollsUsed}/{maxReroll}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.name}>{winner?.name ?? "Unknown"}</Text>
          {cuisineTags.length > 0 && (
            <Text style={styles.cuisine}>{cuisineTags.join(" · ")}</Text>
          )}

          <View style={styles.tagRow}>
            {winner?.halal && <Chip label="✅ Halal" color="#D1FAE5" textColor="#065F46" />}
            {winner?.vegOptions && <Chip label="🌱 Veg" color="#D1FAE5" textColor="#065F46" />}
            {vibeTags.slice(0, 3).map((t) => (
              <Chip key={t} label={t} color="#DBEAFE" textColor="#1E40AF" />
            ))}
          </View>

          <View style={styles.metaRow}>
            <MetaBox label="Budget" value={`RM${winner?.priceMin ?? 0}–${winner?.priceMax ?? 0}`} />
            <MetaBox label="Walk" value={`${winner?.walkMinutes ?? "?"} min 🚶`} />
          </View>

          <View style={styles.actionRow}>
            {winner?.mapsUrl ? (
              <Pressable
                style={styles.goBtn}
                onPress={() => Linking.openURL(winner.mapsUrl)}
              >
                <Text style={styles.goBtnText}>📍 Let us go!</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.goBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.goBtnText}>✅ Confirmed!</Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.rerollBtn, (rerollsLeft <= 0 || loading) && styles.rerollBtnDisabled]}
              onPress={handleReroll}
              disabled={rerollsLeft <= 0 || loading}
            >
              {loading ? (
                <ActivityIndicator color="#374151" size="small" />
              ) : (
                <>
                  <Text style={styles.rerollBtnText}>Not this 🙅</Text>
                  <Text style={styles.rerollSub}>
                    {rerollsLeft > 0 ? `${rerollsLeft} left` : "No more"}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Animated.View>

      <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backBtnText}>← Back to filters</Text>
      </Pressable>
    </View>
  );
}

function Chip({ label, color, textColor }) {
  return (
    <View style={[styles.chip, { backgroundColor: color }]}>
      <Text style={[styles.chipText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

function MetaBox({ label, value }) {
  return (
    <View style={styles.metaBox}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  crown: { fontSize: 15, color: "#6B7280", marginBottom: 16 },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  cardHero: {
    height: 140,
    backgroundColor: SAMBAL,
    justifyContent: "center",
    alignItems: "center",
  },
  heroEmoji: { fontSize: 60 },
  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontWeight: "700", color: SAMBAL },
  rerollBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  rerollBadgeText: { fontSize: 11, fontWeight: "700", color: "#fff" },
  cardBody: { padding: 20 },
  name: { fontSize: 26, fontWeight: "900", color: "#111827" },
  cuisine: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  chipText: { fontSize: 12, fontWeight: "700" },
  metaRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  metaBox: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  metaLabel: { fontSize: 11, color: "#9CA3AF", marginBottom: 2 },
  metaValue: { fontSize: 14, fontWeight: "700", color: "#111827" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  goBtn: {
    flex: 1,
    backgroundColor: PANDAN,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  goBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  rerollBtn: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  rerollBtnDisabled: { opacity: 0.5 },
  rerollBtnText: { fontWeight: "700", color: "#374151", fontSize: 14 },
  rerollSub: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  backBtn: { marginTop: 20 },
  backBtnText: { color: "#9CA3AF", fontSize: 14, fontWeight: "600" },
});
