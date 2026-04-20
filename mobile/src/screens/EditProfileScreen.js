import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const SAMBAL = '#DC2626';
const BASE_URL = 'https://cincailah.suntzutechnologies.com';

export default function EditProfileScreen({ navigation }) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? null);
  const [halal, setHalal] = useState(false);
  const [vegOptions, setVegOptions] = useState(false);
  const [defaultBudget, setDefaultBudget] = useState('20');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { ok, data } = await apiFetch('/api/user/preferences');
      if (ok && data.preferences) {
        setHalal(Boolean(data.preferences.halal));
        setVegOptions(Boolean(data.preferences.vegOptions));
        setDefaultBudget(String(data.preferences.defaultBudget ?? 20));
      }
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const form = new FormData();
    form.append('type', 'avatar');
    form.append('file', {
      uri: asset.uri,
      name: asset.fileName || 'avatar.jpg',
      type: asset.mimeType || 'image/jpeg',
    });
    const res = await fetch(`${BASE_URL}/api/upload`, { method: 'POST', body: form, headers: {} });
    const data = await res.json();
    if (!res.ok) {
      Alert.alert('Upload failed', data?.error || 'Could not upload avatar.');
      return;
    }
    setAvatarUrl(data.url);
  };

  const save = async () => {
    setLoading(true);
    await apiFetch('/api/user/preferences', {
      method: 'PATCH',
      body: { halal, vegOptions, defaultBudget: Number(defaultBudget) || 20 },
    });
    if (avatarUrl !== user?.avatarUrl) {
      await apiFetch('/api/user/avatar', { method: 'PATCH', body: { avatarUrl } });
    }
    setLoading(false);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Edit profile</Text>
      <Pressable style={styles.avatarWrap} onPress={pickImage}>
        {avatarUrl ? <Image source={{ uri: avatarUrl.startsWith('/') ? `${BASE_URL}${avatarUrl}` : avatarUrl }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarText}>{displayName?.[0]?.toUpperCase() || '?'}</Text></View>}
        <Text style={styles.avatarHint}>Tap to choose avatar</Text>
      </Pressable>
      <Text style={styles.label}>Display name</Text>
      <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />
      <View style={styles.toggleRow}><Text>Halal preference</Text><Switch value={halal} onValueChange={setHalal} /></View>
      <View style={styles.toggleRow}><Text>Veg options preference</Text><Switch value={vegOptions} onValueChange={setVegOptions} /></View>
      <Text style={styles.label}>Default budget</Text>
      <TextInput style={styles.input} value={defaultBudget} onChangeText={setDefaultBudget} keyboardType="number-pad" />
      <Pressable style={styles.btn} onPress={save} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save profile</Text>}</Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  heading: { fontSize: 26, fontWeight: '800', color: '#111827', marginBottom: 16 },
  avatarWrap: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: { backgroundColor: SAMBAL, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '900' },
  avatarHint: { marginTop: 8, color: '#6B7280' },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 8 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F9FAFB' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  btn: { marginTop: 24, backgroundColor: SAMBAL, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
