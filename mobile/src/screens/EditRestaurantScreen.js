import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { apiFetch } from '../lib/api';

const SAMBAL = '#DC2626';
const CUISINE_OPTIONS = ['Malay', 'Chinese', 'Indian', 'Japanese', 'Western', 'Thai', 'Korean', 'Mamak', 'Fusion'];
const VIBE_OPTIONS = ['Aircond', 'Outdoor', 'Cheap', 'Date Night', 'Solo', 'Fast Food', 'Buffet', 'Halal'];

export default function EditRestaurantScreen({ route, navigation }) {
  const { restaurantId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', priceMin: '5', priceMax: '20', walkMinutes: '5', halal: false, vegOptions: false,
    cuisineTags: [], vibeTags: [], mapsUrl: '',
  });

  useEffect(() => {
    (async () => {
      const { ok, data } = await apiFetch(`/api/restaurants/${restaurantId}`);
      if (!ok || !data.restaurant) {
        Alert.alert('Error', data?.error || 'Failed to load restaurant.');
        navigation.goBack();
        return;
      }
      const r = data.restaurant;
      setForm({
        name: r.name ?? '',
        priceMin: String(r.priceMin ?? 5),
        priceMax: String(r.priceMax ?? 20),
        walkMinutes: String(r.walkMinutes ?? 5),
        halal: Boolean(r.halal),
        vegOptions: Boolean(r.vegOptions),
        cuisineTags: r.cuisineTags ?? [],
        vibeTags: r.vibeTags ?? [],
        mapsUrl: r.mapsUrl ?? '',
      });
      setLoading(false);
    })();
  }, [restaurantId, navigation]);

  const toggleTag = (key, tag) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(tag) ? prev[key].filter((t) => t !== tag) : [...prev[key], tag],
    }));
  };

  const save = async () => {
    setSaving(true);
    const { ok, data } = await apiFetch(`/api/restaurants/${restaurantId}`, {
      method: 'PATCH',
      body: {
        ...form,
        priceMin: Number(form.priceMin),
        priceMax: Number(form.priceMax),
        walkMinutes: Number(form.walkMinutes),
      },
    });
    setSaving(false);
    if (!ok) {
      Alert.alert('Error', data?.error || 'Failed to save restaurant.');
      return;
    }
    navigation.goBack();
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={SAMBAL} /></View>;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} />
      <Text style={styles.label}>Price range</Text>
      <View style={styles.row}>
        <TextInput style={[styles.input, styles.half]} value={form.priceMin} onChangeText={(v) => setForm((p) => ({ ...p, priceMin: v }))} keyboardType="number-pad" />
        <TextInput style={[styles.input, styles.half]} value={form.priceMax} onChangeText={(v) => setForm((p) => ({ ...p, priceMax: v }))} keyboardType="number-pad" />
      </View>
      <Text style={styles.label}>Walk minutes</Text>
      <TextInput style={styles.input} value={form.walkMinutes} onChangeText={(v) => setForm((p) => ({ ...p, walkMinutes: v }))} keyboardType="number-pad" />
      <View style={styles.toggleRow}><Text>Halal</Text><Switch value={form.halal} onValueChange={(v) => setForm((p) => ({ ...p, halal: v }))} /></View>
      <View style={styles.toggleRow}><Text>Veg options</Text><Switch value={form.vegOptions} onValueChange={(v) => setForm((p) => ({ ...p, vegOptions: v }))} /></View>
      <Text style={styles.label}>Cuisine</Text>
      <View style={styles.tags}>{CUISINE_OPTIONS.map((t) => <Pressable key={t} style={[styles.tag, form.cuisineTags.includes(t) && styles.tagActive]} onPress={() => toggleTag('cuisineTags', t)}><Text style={[styles.tagText, form.cuisineTags.includes(t) && styles.tagTextActive]}>{t}</Text></Pressable>)}</View>
      <Text style={styles.label}>Vibe</Text>
      <View style={styles.tags}>{VIBE_OPTIONS.map((t) => <Pressable key={t} style={[styles.tag, form.vibeTags.includes(t) && styles.tagActive]} onPress={() => toggleTag('vibeTags', t)}><Text style={[styles.tagText, form.vibeTags.includes(t) && styles.tagTextActive]}>{t}</Text></Pressable>)}</View>
      <Text style={styles.label}>Maps URL</Text>
      <TextInput style={styles.input} value={form.mapsUrl} onChangeText={(v) => setForm((p) => ({ ...p, mapsUrl: v }))} autoCapitalize="none" />
      <Pressable style={styles.btn} onPress={save} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save changes</Text>}</Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 24, paddingBottom: 60 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 8 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F9FAFB' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#F3F4F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  tagActive: { backgroundColor: '#FEE2E2', borderColor: SAMBAL, borderWidth: 1.5 },
  tagText: { color: '#374151', fontWeight: '600' },
  tagTextActive: { color: SAMBAL },
  btn: { marginTop: 24, backgroundColor: SAMBAL, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
