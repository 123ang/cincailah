/**
 * Group decision hub — decision-first mobile flow.
 */
import React, { useMemo, useState } from "react";
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
  Image,
} from "react-native";
import { apiFetch } from "../lib/api";
import { useToast } from "../components/Toast";

const LOGO = require("../../assets/brand/cincailah-logo.jpeg");

const BRAND = {
  orange: "#FF5A00",
  orangeDark: "#E64000",
  orangeSoft: "#FFE1CC",
  cream: "#FFF7EB",
  creamDeep: "#FFEBCF",
  ink: "#26140B",
  muted: "#7A6254",
  green: "#45B619",
  blue: "#078BCE",
  purple: "#6D2CB7",
  white: "#FFFFFF",
};

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
  const [showFilters, setShowFilters] = useState(false);

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

  const reset = () => {
    setBudget("");
    setHalal(false);
    setVeg(false);
    setCuisineTags([]);
    setVibeTags([]);
    setAllowRepeatPicks(false);
  };

  const applyPreset = (preset) => {
    reset();
    if (preset === "cheap") {
      setBudget("kering");
      setVibeTags(["Cheap"]);
    }
    if (preset === "comfort") {
      setBudget("ok");
      setVibeTags(["Aircond", "Group Friendly"]);
    }
    if (preset === "halal") {
      setHalal(true);
    }
  };

  const activeChips = useMemo(() => {
    const chips = [
      budget ? (budget === "kering" ? "Kering" : budget === "ok" ? "OK lah" : "Belanja") : "Any budget",
      ...cuisineTags,
      ...vibeTags,
      halal ? "Halal" : null,
      veg ? "Veg" : null,
      allowRepeatPicks ? "Repeats OK" : null,
    ];
    return chips.filter(Boolean);
  }, [allowRepeatPicks, budget, cuisineTags, halal, veg, vibeTags]);

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
        showToast("No connection - check your network", "error");
        return;
      }
      if (!ok) {
        showToast(data?.error || "No restaurants match these filters - try fewer tags.", "error");
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
      <View style={styles.hero}>
        <View style={styles.heroRing} />
        <View style={styles.heroTopRow}>
          <Pressable style={styles.groupBadge} onPress={openGroupSwitcher}>
            <View style={styles.dot} />
            <Text style={styles.groupBadgeText} numberOfLines={1}>{groupName}</Text>
            <Text style={styles.groupSwitchHint}>Switch</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("GroupSettings", { groupId, groupName })}
            style={styles.settingsBtn}
          >
            <Text style={styles.settingsIcon}>...</Text>
          </Pressable>
        </View>

        <Text style={styles.kicker}>FAST DECIDE</Text>
        <Text style={styles.heroTitle}>Makan mana hari ni?</Text>
        <Text style={styles.heroSub}>Tap first. Tune filters only when your mood changes.</Text>

        <Pressable
          style={[styles.bigBtn, loading && styles.bigBtnDisabled]}
          onPress={handleDecide}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={BRAND.orange} size="large" />
          ) : (
            <>
              <Image source={LOGO} style={styles.bigBtnLogo} />
              <Text style={styles.bigBtnText}>Cincai lah!</Text>
              <Text style={styles.bigBtnSub}>{mode === "we_fight" ? "Start a vote" : "Pick one now"}</Text>
            </>
          )}
        </Pressable>
      </View>

      <View style={styles.modeRow}>
        {[
          ["you_pick", "You Pick"],
          ["we_fight", "We Fight"],
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

      <View style={styles.moodCard}>
        <View style={styles.moodHeader}>
          <View>
            <Text style={styles.sectionTitle}>Today makan mood</Text>
            <Text style={styles.helperText}>{activeChips.length - 1 > 0 ? `${activeChips.length - 1} active filters` : "Surprise mode"}</Text>
          </View>
          <Pressable style={styles.filterToggle} onPress={() => setShowFilters((v) => !v)}>
            <Text style={styles.filterToggleText}>{showFilters ? "Hide" : "Edit"}</Text>
          </Pressable>
        </View>

        <View style={styles.chipsWrap}>
          {activeChips.map((chip) => (
            <View key={chip} style={styles.chip}>
              <Text style={styles.chipText}>{chip}</Text>
            </View>
          ))}
        </View>

        <View style={styles.presetGrid}>
          <PresetButton label="Surprise me" onPress={() => applyPreset("anything")} />
          <PresetButton label="Cheap easy" onPress={() => applyPreset("cheap")} />
          <PresetButton label="Comfy group" onPress={() => applyPreset("comfort")} />
          <PresetButton label="Halal only" onPress={() => applyPreset("halal")} />
        </View>

        {showFilters && (
          <View style={styles.filtersPanel}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Budget</Text>
              <Pressable onPress={reset}>
                <Text style={styles.resetText}>Reset</Text>
              </Pressable>
            </View>
            <View style={styles.budgetRow}>
              {[
                ["kering", "Kering", "< RM10"],
                ["ok", "OK lah", "RM10-20"],
                ["belanja", "Belanja", "RM20+"],
              ].map(([val, label, sub]) => (
                <Pressable
                  key={val}
                  style={[styles.budgetBtn, budget === val && styles.budgetBtnActive]}
                  onPress={() => setBudget(budget === val ? "" : val)}
                >
                  <Text style={[styles.budgetLabel, budget === val && styles.budgetLabelActive]}>{label}</Text>
                  <Text style={[styles.budgetSub, budget === val && styles.budgetSubActive]}>{sub}</Text>
                </Pressable>
              ))}
            </View>

            <TagGroup
              title="Cuisine"
              options={CUISINE_TAGS}
              selected={cuisineTags}
              onToggle={(tag) => toggleTag(tag, setCuisineTags)}
            />

            <TagGroup
              title="Vibe"
              options={VIBE_TAGS}
              selected={vibeTags}
              onToggle={(tag) => toggleTag(tag, setVibeTags)}
            />

            <View style={styles.togglesGrid}>
              <FilterSwitch label="Halal" value={halal} onValueChange={setHalal} />
              <FilterSwitch label="Veg options" value={veg} onValueChange={setVeg} />
            </View>

            <View style={styles.repeatRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.repeatLabel}>Same spot can win again</Text>
                <Text style={styles.repeatSub}>Skip anti-repeat when everyone wants familiar.</Text>
              </View>
              <Switch
                value={allowRepeatPicks}
                onValueChange={setAllowRepeatPicks}
                trackColor={{ true: BRAND.orange, false: BRAND.creamDeep }}
                thumbColor="#fff"
              />
            </View>
          </View>
        )}
      </View>

      <Pressable
        style={styles.restoLink}
        onPress={() => navigation.navigate("Restaurants", { groupId, groupName })}
      >
        <Text style={styles.restoLinkText}>Manage restaurants</Text>
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
              <ActivityIndicator color={BRAND.orange} style={{ marginTop: 20 }} />
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

function PresetButton({ label, onPress }) {
  return (
    <Pressable style={styles.presetBtn} onPress={onPress}>
      <Text style={styles.presetText}>{label}</Text>
    </Pressable>
  );
}

function TagGroup({ title, options, selected, onToggle }) {
  return (
    <View style={styles.tagGroup}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <View style={styles.tagsWrap}>
        {options.map((tag) => {
          const active = selected.includes(tag);
          return (
            <Pressable
              key={tag}
              style={[styles.tag, active && styles.tagActive]}
              onPress={() => onToggle(tag)}
            >
              <Text style={[styles.tagText, active && styles.tagTextActive]}>{tag}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function FilterSwitch({ label, value, onValueChange }) {
  return (
    <View style={styles.switchCard}>
      <Text style={styles.switchLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: BRAND.green, false: BRAND.creamDeep }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: BRAND.cream },
  container: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 92, gap: 14 },
  hero: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: BRAND.orange,
    borderRadius: 30,
    padding: 20,
    minHeight: 420,
  },
  heroRing: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 24,
    borderColor: "rgba(255,255,255,0.72)",
    borderLeftColor: "transparent",
    right: -78,
    top: 78,
    transform: [{ rotate: "-24deg" }],
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  groupBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND.green },
  groupBadgeText: { flex: 1, fontSize: 12, fontWeight: "900", color: "#fff" },
  groupSwitchHint: { fontSize: 10, color: "rgba(255,255,255,0.72)", fontWeight: "900" },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  settingsIcon: { color: "#fff", fontSize: 17, fontWeight: "900", marginTop: -6 },
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
    marginTop: 28,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 42,
    lineHeight: 42,
    fontWeight: "900",
    letterSpacing: -1.4,
    marginTop: 14,
    maxWidth: 250,
  },
  heroSub: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "700",
    maxWidth: 250,
    marginTop: 10,
  },
  bigBtn: {
    width: 178,
    height: 178,
    borderRadius: 89,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 22,
    borderWidth: 8,
    borderColor: "rgba(255,255,255,0.22)",
  },
  bigBtnDisabled: { opacity: 0.65 },
  bigBtnLogo: { width: 52, height: 52, borderRadius: 18, marginBottom: 6 },
  bigBtnText: { fontSize: 21, fontWeight: "900", color: BRAND.orange, letterSpacing: -0.6 },
  bigBtnSub: { fontSize: 12, color: BRAND.muted, fontWeight: "900", marginTop: 2 },
  modeRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: BRAND.creamDeep,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: "center",
  },
  modeBtnActive: { backgroundColor: BRAND.orange },
  modeBtnDisabled: { opacity: 0.45 },
  modeBtnText: { fontWeight: "900", color: BRAND.muted, fontSize: 14 },
  modeBtnTextActive: { color: "#fff" },
  ownerHint: { color: BRAND.orangeDark, fontSize: 12, fontWeight: "800", textAlign: "center" },
  moodCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND.creamDeep,
  },
  moodHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: BRAND.ink },
  helperText: { fontSize: 12, color: BRAND.muted, marginTop: 2, fontWeight: "700" },
  filterToggle: {
    backgroundColor: BRAND.orangeSoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterToggleText: { color: BRAND.orange, fontSize: 12, fontWeight: "900" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  chip: { backgroundColor: BRAND.orangeSoft, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
  chipText: { color: BRAND.orangeDark, fontSize: 12, fontWeight: "900" },
  presetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  presetBtn: {
    width: "48%",
    backgroundColor: BRAND.cream,
    borderRadius: 15,
    paddingVertical: 10,
    alignItems: "center",
  },
  presetText: { color: BRAND.ink, fontWeight: "900", fontSize: 12 },
  filtersPanel: {
    borderTopWidth: 1,
    borderTopColor: BRAND.creamDeep,
    marginTop: 16,
    paddingTop: 16,
    gap: 16,
  },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionLabel: { fontSize: 12, fontWeight: "900", color: BRAND.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  resetText: { color: BRAND.orange, fontSize: 12, fontWeight: "900" },
  budgetRow: { flexDirection: "row", gap: 8 },
  budgetBtn: {
    flex: 1,
    backgroundColor: BRAND.cream,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  budgetBtnActive: { backgroundColor: BRAND.orange },
  budgetLabel: { fontSize: 13, fontWeight: "900", color: BRAND.ink },
  budgetLabelActive: { color: "#fff" },
  budgetSub: { fontSize: 11, color: BRAND.muted, marginTop: 2, fontWeight: "700" },
  budgetSubActive: { color: "rgba(255,255,255,0.78)" },
  tagGroup: { gap: 0 },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    backgroundColor: BRAND.cream,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
  },
  tagActive: { backgroundColor: "#E7F8DE", borderWidth: 1.5, borderColor: BRAND.green },
  tagText: { fontSize: 13, fontWeight: "800", color: BRAND.ink },
  tagTextActive: { color: "#276D07" },
  togglesGrid: { flexDirection: "row", gap: 8 },
  switchCard: {
    flex: 1,
    backgroundColor: BRAND.cream,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchLabel: { fontSize: 13, color: BRAND.ink, fontWeight: "900" },
  repeatRow: {
    backgroundColor: BRAND.cream,
    borderRadius: 18,
    padding: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  repeatLabel: { fontSize: 14, fontWeight: "900", color: BRAND.ink },
  repeatSub: { fontSize: 12, color: BRAND.muted, marginTop: 2, fontWeight: "600" },
  restoLink: {
    backgroundColor: BRAND.ink,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: "center",
  },
  restoLinkText: { fontSize: 14, color: "#fff", fontWeight: "900" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
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
  modalTitle: { fontSize: 18, fontWeight: "900", color: BRAND.ink },
  modalClose: { fontSize: 14, color: BRAND.orange, fontWeight: "900" },
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.creamDeep,
  },
  groupItemLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  groupItemDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND.green },
  groupItemText: { fontSize: 15, color: BRAND.ink, fontWeight: "800" },
  currentTag: {
    fontSize: 11,
    color: BRAND.orange,
    fontWeight: "900",
    backgroundColor: BRAND.orangeSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  emptySwitcher: { color: BRAND.muted, textAlign: "center", marginTop: 20, fontWeight: "700" },
});
