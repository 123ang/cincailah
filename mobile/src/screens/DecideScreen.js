/**
 * Group decision hub — mirrors web DecidePage.
 * Supports budget, tag, mode filters, nearby 500m filter via expo-location.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  Modal,
  FlatList,
} from "react-native";
import * as Location from "expo-location";
import { apiFetch } from "../lib/api";
import { useToast } from "../components/Toast";

const SAMBAL = "#DC2626";
const PANDAN = "#10B981";

const TAGS = ["Halal", "Veg Options", "Mamak", "Japanese", "Western", "Aircond", "Cheap"];

export default function DecideScreen({ route, navigation }) {
  const {
    groupId,
    groupName,
    maxReroll = 2,
    decisionModeDefault = "you_pick",
  } = route.params || {};

  const [budget, setBudget] = useState("");
  const [halal, setHalal] = useState(false);
  const [veg, setVeg] = useState(false);
  const [tags, setTags] = useState([]);
  const [mode, setMode] = useState(decisionModeDefault);
  const [loading, setLoading] = useState(false);
  const [nearby, setNearby] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switcherLoading, setSwitcherLoading] = useState(false);
  const [myGroups, setMyGroups] = useState([]);

  const { showToast, ToastHost } = useToast();

  const toggleTag = (t) => {
    if (t === "Halal") { setHalal(!halal); return; }
    if (t === "Veg Options") { setVeg(!veg); return; }
    setTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  const isActive = (t) => {
    if (t === "Halal") return halal;
    if (t === "Veg Options") return veg;
    return tags.includes(t);
  };

  const handleNearbyToggle = async (val) => {
    if (val && !userCoords) {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Location needed",
          "Enable location permission to use the Nearby filter."
        );
        setLocLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setLocLoading(false);
    }
    setNearby(val);
  };

  const buildFilters = () => {
    const f = {
      budgetFilter: budget,
      selectedTags: tags,
      halal,
      vegOptions: veg,
    };
    if (nearby && userCoords) {
      f.maxDistanceKm = 0.5;
      f.userLat = userCoords.lat;
      f.userLng = userCoords.lng;
    }
    return f;
  };

  const handleDecide = async () => {
    if (mode === "we_fight") {
      navigation.navigate("Vote", { groupId, groupName, filters: buildFilters() });
      return;
    }
    setLoading(true);
    try {
      const { data, ok, networkError } = await apiFetch("/api/decide", {
        method: "POST",
        body: { groupId, filters: buildFilters(), excludeIds: [] },
      });
      if (networkError) {
        showToast("No connection — check your network", "error");
        return;
      }
      if (!ok) {
        showToast(data?.error || "No restaurants match your filters.", "error");
        return;
      }
      navigation.navigate("Winner", {
        winner: data.winner,
        decisionId: data.decisionId,
        groupId,
        maxReroll,
        excludeIds: [data.winner.id],
        filters: buildFilters(),
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setBudget("");
    setHalal(false);
    setVeg(false);
    setTags([]);
    setNearby(false);
  };

  const openGroupSwitcher = async () => {
    setSwitcherOpen(true);
    setSwitcherLoading(true);
    try {
      const { data, ok } = await apiFetch("/api/groups/list");
      if (ok) setMyGroups(data.groups ?? []);
    } finally {
      setSwitcherLoading(false);
    }
  };

  const switchToGroup = (g) => {
    setSwitcherOpen(false);
    navigation.replace("Decide", {
      groupId: g.id,
      groupName: g.name,
      maxReroll: g.maxReroll ?? 2,
      noRepeatDays: g.noRepeatDays ?? 7,
      decisionModeDefault: g.decisionModeDefault ?? "you_pick",
    });
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Makan mana hari ni? 🤔</Text>
          <Pressable style={styles.groupBadge} onPress={openGroupSwitcher}>
            <View style={styles.dot} />
            <Text style={styles.groupBadgeText}>{groupName}</Text>
            <Text style={styles.groupSwitchHint}>Switch</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => navigation.navigate("GroupSettings", { groupId, groupName })}
          style={styles.settingsBtn}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </Pressable>
      </View>

      {/* Budget */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>💰 Dompet Status</Text>
        <View style={styles.budgetRow}>
          {[
            ["kering", "Kering", "< RM10"],
            ["ok", "OK lah", "RM10–20"],
            ["belanja", "Belanja", "RM20+"],
          ].map(([val, label, sub]) => (
            <Pressable
              key={val}
              style={[styles.budgetBtn, budget === val && styles.budgetBtnActive]}
              onPress={() => setBudget(budget === val ? "" : val)}
            >
              <Text style={[styles.budgetLabel, budget === val && styles.budgetLabelActive]}>
                {label}
              </Text>
              <Text style={[styles.budgetSub, budget === val && styles.budgetSubActive]}>
                {sub}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Tags */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>🏷️ What mood?</Text>
        <View style={styles.tagsWrap}>
          {TAGS.map((t) => (
            <Pressable
              key={t}
              style={[styles.tag, isActive(t) && styles.tagActive]}
              onPress={() => toggleTag(t)}
            >
              <Text style={[styles.tagText, isActive(t) && styles.tagTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Nearby toggle */}
      <View style={styles.section}>
        <View style={styles.nearbyRow}>
          <View>
            <Text style={styles.nearbyLabel}>📍 Within 500m</Text>
            <Text style={styles.nearbySub}>Only show nearby restaurants</Text>
          </View>
          {locLoading ? (
            <ActivityIndicator color={SAMBAL} />
          ) : (
            <Switch
              value={nearby}
              onValueChange={handleNearbyToggle}
              trackColor={{ true: SAMBAL, false: "#E5E7EB" }}
              thumbColor="#fff"
            />
          )}
        </View>
        {nearby && !userCoords && (
          <Text style={styles.locWarning}>Requesting location…</Text>
        )}
      </View>

      {/* Restaurants shortcut */}
      <Pressable
        style={styles.restoLink}
        onPress={() => navigation.navigate("Restaurants", { groupId, groupName })}
      >
        <Text style={styles.restoLinkText}>🍽️ Manage restaurants →</Text>
      </Pressable>

      {/* Mode toggle */}
      <View style={styles.modeRow}>
        {[
          ["you_pick", "🎲 You Pick"],
          ["we_fight", "⚔️ We Fight"],
        ].map(([val, label]) => (
          <Pressable
            key={val}
            style={[styles.modeBtn, mode === val && styles.modeBtnActive]}
            onPress={() => setMode(val)}
          >
            <Text style={[styles.modeBtnText, mode === val && styles.modeBtnTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Big button */}
      <View style={styles.bigBtnWrap}>
        <Pressable
          style={[styles.bigBtn, loading && styles.bigBtnDisabled]}
          onPress={handleDecide}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <>
              <Text style={styles.bigBtnEmoji}>🍛</Text>
              <Text style={styles.bigBtnText}>Cincai lah!</Text>
              <Text style={styles.bigBtnSub}>Tap to decide</Text>
            </>
          )}
        </Pressable>
      </View>

      <Pressable onPress={reset} style={styles.resetBtn}>
        <Text style={styles.resetText}>Reset filters</Text>
      </Pressable>

      <ToastHost />

      <Modal visible={switcherOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Switch Group</Text>
              <Pressable onPress={() => setSwitcherOpen(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </Pressable>
            </View>

            {switcherLoading ? (
              <ActivityIndicator color={SAMBAL} style={{ marginTop: 20 }} />
            ) : (
              <FlatList
                data={myGroups}
                keyExtractor={(g) => g.id}
                renderItem={({ item }) => (
                  <Pressable style={styles.groupItem} onPress={() => switchToGroup(item)}>
                    <View style={styles.groupItemLeft}>
                      <View style={styles.groupItemDot} />
                      <Text style={styles.groupItemText}>{item.name}</Text>
                    </View>
                    {item.id === groupId && <Text style={styles.currentTag}>Current</Text>}
                  </Pressable>
                )}
                ListEmptyComponent={<Text style={styles.emptySwitcher}>No groups found</Text>}
              />
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 80 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  greeting: { fontSize: 20, fontWeight: "800", color: "#111827" },
  groupBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignSelf: "flex-start",
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: PANDAN },
  groupBadgeText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  groupSwitchHint: { fontSize: 10, color: SAMBAL, marginLeft: 6, fontWeight: "700" },
  settingsBtn: { padding: 8 },
  settingsIcon: { fontSize: 22 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: "#6B7280", marginBottom: 12 },
  budgetRow: { flexDirection: "row", gap: 8 },
  budgetBtn: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  budgetBtnActive: { backgroundColor: SAMBAL },
  budgetLabel: { fontSize: 13, fontWeight: "700", color: "#374151" },
  budgetLabelActive: { color: "#fff" },
  budgetSub: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  budgetSubActive: { color: "rgba(255,255,255,0.8)" },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagActive: { backgroundColor: "#D1FAE5", borderWidth: 1.5, borderColor: PANDAN },
  tagText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  tagTextActive: { color: "#065F46" },
  nearbyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nearbyLabel: { fontSize: 14, fontWeight: "700", color: "#111827" },
  nearbySub: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  locWarning: { fontSize: 12, color: "#F59E0B", marginTop: 8 },
  restoLink: { alignItems: "flex-end", marginBottom: 12 },
  restoLinkText: { fontSize: 13, color: SAMBAL, fontWeight: "600" },
  modeRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 6,
    gap: 6,
    marginBottom: 20,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modeBtnActive: { backgroundColor: SAMBAL },
  modeBtnText: { fontWeight: "700", color: "#6B7280", fontSize: 14 },
  modeBtnTextActive: { color: "#fff" },
  bigBtnWrap: { alignItems: "center", marginBottom: 16 },
  bigBtn: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: SAMBAL,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: SAMBAL,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  bigBtnDisabled: { opacity: 0.6 },
  bigBtnEmoji: { fontSize: 36, marginBottom: 4 },
  bigBtnText: { fontSize: 20, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  bigBtnSub: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  resetBtn: { alignItems: "center" },
  resetText: { fontSize: 13, color: "#9CA3AF" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 22,
    minHeight: 300,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
  modalClose: { fontSize: 14, color: SAMBAL, fontWeight: "700" },
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  groupItemLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  groupItemDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: PANDAN },
  groupItemText: { fontSize: 15, color: "#111827", fontWeight: "600" },
  currentTag: {
    fontSize: 11,
    color: SAMBAL,
    fontWeight: "700",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  emptySwitcher: { color: "#9CA3AF", textAlign: "center", marginTop: 20 },
});
