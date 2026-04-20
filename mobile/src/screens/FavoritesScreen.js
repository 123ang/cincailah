import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { FAVORITE_SPOTS_KEY } from '../lib/guestStorage';

const SAMBAL = '#DC2626';

export default function FavoritesScreen() {
  const { mode, token } = useAuth();
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    if (mode === 'authed' && token) {
      const raw = await AsyncStorage.getItem(FAVORITE_SPOTS_KEY);
      setItems(raw ? JSON.parse(raw) : []);
      return;
    }
    const raw = await AsyncStorage.getItem(FAVORITE_SPOTS_KEY);
    setItems(raw ? JSON.parse(raw) : []);
  }, [mode, token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const persist = async (next) => {
    setItems(next);
    await AsyncStorage.setItem(FAVORITE_SPOTS_KEY, JSON.stringify(next));
  };

  const addFavorite = async () => {
    if (!name.trim()) return;
    const entry = {
      id: Date.now().toString(),
      name: name.trim(),
      note: note.trim(),
    };
    const next = [entry, ...items];
    await persist(next);
    setName('');
    setNote('');
  };

  const removeFavorite = async (id) => {
    const next = items.filter((item) => item.id !== id);
    await persist(next);
    if (mode === 'authed' && token) {
      await apiFetch('/api/favorites', { method: 'POST', body: { favoriteId: id, remove: true } });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Favourite Spots</Text>
      <Text style={styles.sub}>Keep your go-to places handy on this device.</Text>

      <TextInput
        style={styles.input}
        placeholder="Spot name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Optional note"
        value={note}
        onChangeText={setNote}
      />
      <Pressable style={styles.btn} onPress={addFavorite}>
        <Text style={styles.btnText}>Add favourite</Text>
      </Pressable>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
            </View>
            <Pressable onPress={() => removeFavorite(item.id)}>
              <Text style={styles.delete}>Delete</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No favourites yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  heading: { fontSize: 24, fontWeight: '800', color: '#111827' },
  sub: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  btn: { backgroundColor: SAMBAL, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 },
  btnText: { color: '#fff', fontWeight: '700' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  name: { fontSize: 16, fontWeight: '700', color: '#111827' },
  note: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  delete: { color: SAMBAL, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
});
