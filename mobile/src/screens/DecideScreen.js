/**
 * Group decision hub — mirrors web DecidePage.
 * Supports the Jiak Hami flowchart filters and decision modes.
 */
import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Switch,
  Modal,
  FlatList,
} from "react-native";
import { apiFetch } from "../lib/api";
import { useToast } from "../components/Toast";

const SAMBAL = "#DC2626";
const PANDAN = "#10B981";

const CUISINE_TAGS = ["Mamak", "Japanese", "Western", "Chinese", "Thai", "Fast Food", "Cafe", "Indian"];
const VIBE_TAGS = ["Aircond", "Cheap", "Atas", "Group Friendly", "Parking", "24hrs", "Delivery"];

export default function DecideScreen({ route, navigation }) {
  const {
    groupId,
    groupName,
    maxReroll = 3,
    decisionModeDefault = "you_pick",
    role,
    createdBy,
    currentUserId,
  } = route.params || {};

  const [budget, setBudget] = useState("");
  const [halal, setHalal] = useState(false);
  const [veg, setVeg] = useState(false);
  const isOwner = role === "owner" || (createdBy && currentUserId && createdBy === currentUserId);
  const [cuisineTags, setCuisineTags] = useState([]);
  const [vibeTags, setVibeTags] = useState([]);
  const [mode, setMode] = useState(isOwner && decisionModeDefault === "you_pick" ? "you_pick" : "we_fight");
  const [loading, setLoading] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [switcherLoading, setSwitcherLoading] = useState(false);
  const [myGroups, setMyGroups] = useState([]);
  const [allowRepeatPicks, setAllowRepeatPicks] = useState(false);

  const { showToast, ToastHost } = useToast();

  const toggleTag = (tag, setter) => {
    setter((prev) => prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]);
  };

  const buildFilters = () => {
    const f = {
      budgetFilter: budget,
      cuisineTags,
      vibeTags,
      halal,
      vegOptions: veg,
    };
    if (allowRepeatPicks) {
      f.allowRepeatPicks = true;
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
        showToast(data?.error || "No restaurants match these filters — try fewer cuisine or vibe tags.", "error");
        return;
      }
      navigation.navigate("Winner", {
        winner: data.winner,
        decisionId: data.decisionId,
        groupId,
        maxReroll: data.maxReroll ?? maxReroll,
        excludeIds: [],
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
    setCuisineTags([]);
    setVibeTags([]);
    setAllowRepeatPicks(false);
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
      maxReroll: 3,
      decisionModeDefault: g.decisionModeDefault ?? "you_pick",
      role: g.role,
      createdBy: g.createdBy,
    });
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Makan mana hari ni? 🤔</Text>
          <View style={styles.groupLine}>
            <Pressable style={styles.groupBadge} onPress={openGroupSwitcher}>
              <View style={styles.dot} />
              <Text style={styles.groupBadgeText}>{groupName}</Text>
              <Text style={styles.groupSwitchHint}>Switch</Text>
            </Pressable>
            <View style={[styles.roleBadge, isOwner ? styles.roleOwner : styles.roleMember]}>
              <Text style={[styles.roleBadgeText, isOwner ? styles.roleOwnerText : styles.roleMemberText]}>
                {isOwner ? "Owner" : "Member"}
              </Text>
            </View>
          </View>
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

      {/* Cuisine type */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>🍜 Cuisine Type</Text>
        <Text style={styles.helperText}>Pick any cuisine types. Leave empty to include all.</Text>
        <View style={styles.tagsWrap}>
          {CUISINE_TAGS.map((t) => (
            <Pressable
              key={t}
              style={[styles.tag, cuisineTags.includes(t) && styles.tagActive]}
              onPress={() => toggleTag(t, setCuisineTags)}
            >
              <Text style={[styles.tagText, cuisineTags.includes(t) && styles.tagTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Cuisine vibe */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>✨ Cuisine Vibe</Text>
        <Text style={styles.helperText}>Pick any vibes. Cuisine and vibe filters work together.</Text>
        <View style={styles.tagsWrap}>
          {VIBE_TAGS.map((t) => (
            <Pressable
              key={t}
              style={[styles.tag, vibeTags.includes(t) && styles.tagActive]}
              onPress={() => toggleTag(t, setVibeTags)}
            >
              <Text style={[styles.tagText, vibeTags.includes(t) && styles.tagTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Halal / vegetarian */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>🥗 Halal / Vegetarian</Text>
        <View style={styles.tagsWrap}>
          <Pressable style={[styles.tag, halal && styles.tagActive]} onPress={() => setHalal(!halal)}>
            <Text style={[styles.tagText, halal && styles.tagTextActive]}>Halal</Text>
          </Pressable>
          <Pressable style={[styles.tag, veg && styles.tagActive]} onPress={() => setVeg(!veg)}>
            <Text style={[styles.tagText, veg && styles.tagTextActive]}>Veg Options</Text>
          </Pressable>
        </View>
      </View>

      {/* Restaurants shortcut */}
      <Pressable
        style={styles.restoLink}
        onPress={() => navigation.navigate("Restaurants", { groupId, groupName })}
      >
        <Text style={styles.restoLinkText}>🍽️ Manage restaurants →</Text>
      </Pressable>

      {/* Same spot can win again */}
      <View style={styles.section}>
        <View style={styles.nearbyRow}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.nearbyLabel}>Same spot can win again</Text>
            <Text style={styles.nearbySub}>
              Skip anti-repeat and allow rerolls to pick the same restaurant
            </Text>
          </View>
          <Switch
            value={allowRepeatPicks}
            onValueChange={setAllowRepeatPicks}
            trackColor={{ true: SAMBAL, false: "#E5E7EB" }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Mode toggle */}
      <View style={styles.modeRow}>
        {[
          ["you_pick", "🎲 You Pick"],
          ["we_fight", "⚔️ We Fight"],
        ].map(([val, label]) => (
          <Pressable
            key={val}
            style={[styles.modeBtn, mode === val && styles.modeBtnActive, val === "you_pick" && !isOwner && styles.modeBtnDisabled]}
            onPress={() => { if (val === "you_pick" && !isOwner) return; setMode(val); }}
          >
            <Text style={[styles.modeBtnText, mode === val && styles.modeBtnTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {!isOwner && (
        <Text style={styles.ownerHint}>Only the group owner can use You Pick.</Text>
      )}

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
  groupLine: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
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
  roleBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, marginTop: 6 },
  roleOwner: { backgroundColor: "#FEF3C7" },
  roleMember: { backgroundColor: "#E0F2FE" },
  roleBadgeText: { fontSize: 10, fontWeight: "800" },
  roleOwnerText: { color: "#92400E" },
  roleMemberText: { color: "#0369A1" },
  settingsBtn: { padding: 8 },
  settingsIcon: { fontSize: 22 },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: "#6B7280", marginBottom: 8 },
  helperText: { fontSize: 12, color: "#9CA3AF", marginBottom: 12 },
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
  modeBtnDisabled: { opacity: 0.45 },
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
