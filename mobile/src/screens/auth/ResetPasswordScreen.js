import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { apiFetch } from '../../lib/api';

const SAMBAL = '#DC2626';

export default function ResetPasswordScreen({ route, navigation }) {
  const token = route?.params?.token ?? '';
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!token || password.length < 8) {
      Alert.alert('Invalid input', 'Use a valid reset link and a password with at least 8 characters.');
      return;
    }
    setLoading(true);
    const { ok, data } = await apiFetch('/api/auth/reset-password', {
      method: 'POST',
      body: { token, password },
    });
    setLoading(false);
    if (!ok) {
      Alert.alert('Reset failed', data?.error || 'Could not reset password.');
      return;
    }
    Alert.alert('Password updated', 'You can sign in with your new password now.', [
      { text: 'OK', onPress: () => navigation.navigate('Login') },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Set a new password</Text>
      <Text style={styles.sub}>Choose a new password for your Cincailah account.</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="New password"
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={styles.btn} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Update password</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center' },
  heading: { fontSize: 26, fontWeight: '800', color: '#111827' },
  sub: { fontSize: 15, color: '#6B7280', marginTop: 8, marginBottom: 20 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#F9FAFB' },
  btn: { marginTop: 16, backgroundColor: SAMBAL, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
