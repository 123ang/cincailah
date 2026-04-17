import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import { apiFetch } from "../lib/api";

const SAMBAL = "#DC2626";

const CUISINE_OPTIONS = ["Malay", "Chinese", "Indian", "Japanese", "Western", "Thai", "Korean", "Mamak", "Fusion"];
const VIBE_OPTIONS = ["Aircond", "Outdoor", "Cheap", "Date Night", "Solo", "Fast Food", "Buffet", "Halal"];

export default function AddRestaurantScreen({ route, navigation }) {
  const { groupId, groupName } = route.params || {};

  const [name, setName] = useState("");
  const [priceMin, setPriceMin] = useState("5");
  const [priceMax, setPriceMax] = useState("20");
  const [walkMinutes, setWalkMinutes] = useState("5");
  const [halal, setHalal] = useState(false);
  const [vegOptions, setVegOptions] = useState(false);
  const [cuisineTags, setCuisineTags] = useState([]);
  const [vibeTags, setVibeTags] = useState([]);
  const [mapsUrl, setMapsUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleTag = (arr, setArr, tag) => {
    setArr((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Enter the restaurant name.");
      return;
    }
    setLoading(true);
    try {
      const { data, ok } = await apiFetch("/api/restaurants", {
        method: "POST",
        body: {
          groupId,
          name: name.trim(),
          priceMin: Number(priceMin) || 5,
          priceMax: Number(priceMax) || 20,
          walkMinutes: Number(walkMinutes) || 5,
          halal,
          vegOptions,
          cuisineTags,
          vibeTags,
          mapsUrl: mapsUrl.trim() || null,
        },
      });
      if (!ok) {
        Alert.alert("Error", data?.error || "Failed to add restaurant.");
        return;
      }
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Add Restaurant</Text>
      <Text style={styles.sub}>to {groupName}</Text>

      {/* Name */}
      <Text style={styles.label}>Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="Restaurant name"
        placeholderTextColor="#9CA3AF"
        value={name}
        onChangeText={setName}
        editable={!loading}
        autoFocus
      />

      {/* Price range */}
      <Text style={styles.label}>Price range (RM)</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.inputHalf]}
          placeholder="Min"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          value={priceMin}
          onChangeText={setPriceMin}
          editable={!loading}
        />
        <Text style={styles.dash}>–</Text>
        <TextInput
          style={[styles.input, styles.inputHalf]}
          placeholder="Max"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          value={priceMax}
          onChangeText={setPriceMax}
          editable={!loading}
        />
      </View>

      {/* Walk */}
      <Text style={styles.label}>Walk time (minutes)</Text>
      <TextInput
        style={styles.input}
        placeholder="5"
        placeholderTextColor="#9CA3AF"
        keyboardType="number-pad"
        value={walkMinutes}
        onChangeText={setWalkMinutes}
        editable={!loading}
      />

      {/* Toggles */}
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Halal ✅</Text>
        <Switch value={halal} onValueChange={setHalal} trackColor={{ true: "#10B981" }} thumbColor="#fff" />
      </View>
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Veg options 🌱</Text>
        <Switch value={vegOptions} onValueChange={setVegOptions} trackColor={{ true: "#10B981" }} thumbColor="#fff" />
      </View>

      {/* Cuisine tags */}
      <Text style={styles.label}>Cuisine</Text>
      <View style={styles.tagWrap}>
        {CUISINE_OPTIONS.map((t) => (
          <Pressable
            key={t}
            style={[styles.tag, cuisineTags.includes(t) && styles.tagActive]}
            onPress={() => toggleTag(cuisineTags, setCuisineTags, t)}
          >
            <Text style={[styles.tagText, cuisineTags.includes(t) && styles.tagTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {/* Vibe tags */}
      <Text style={styles.label}>Vibe</Text>
      <View style={styles.tagWrap}>
        {VIBE_OPTIONS.map((t) => (
          <Pressable
            key={t}
            style={[styles.tag, vibeTags.includes(t) && styles.tagActive]}
            onPress={() => toggleTag(vibeTags, setVibeTags, t)}
          >
            <Text style={[styles.tagText, vibeTags.includes(t) && styles.tagTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {/* Maps URL */}
      <Text style={styles.label}>Google Maps URL (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="https://maps.google.com/..."
        placeholderTextColor="#9CA3AF"
        value={mapsUrl}
        onChangeText={setMapsUrl}
        keyboardType="url"
        autoCapitalize="none"
        editable={!loading}
      />

      <Pressable
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleAdd}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Add Restaurant</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#fff" },
  container: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 60 },
  heading: { fontSize: 24, fontWeight: "800", color: "#111827" },
  sub: { fontSize: 14, color: "#6B7280", marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 8, marginTop: 16 },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#F9FAFB",
  },
  inputHalf: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  dash: { fontSize: 18, color: "#9CA3AF" },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  toggleLabel: { fontSize: 15, fontWeight: "600", color: "#374151" },
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagActive: { backgroundColor: "#FEE2E2", borderWidth: 1.5, borderColor: SAMBAL },
  tagText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  tagTextActive: { color: SAMBAL },
  btn: {
    backgroundColor: SAMBAL,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
