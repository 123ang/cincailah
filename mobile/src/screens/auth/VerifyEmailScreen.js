import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { apiFetch } from '../../lib/api';

const SAMBAL = '#DC2626';

export default function VerifyEmailScreen({ route, navigation }) {
  const token = route?.params?.token ?? '';
  const [state, setState] = useState('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    (async () => {
      if (!token) {
        setState('error');
        setMessage('Missing verification token.');
        return;
      }
      const { ok, data } = await apiFetch('/api/auth/verify-email', {
        method: 'POST',
        body: { token },
      });
      if (ok) {
        setState('success');
        setMessage('Your email is verified. You can sign in now.');
      } else {
        setState('error');
        setMessage(data?.error || 'Verification failed.');
      }
    })();
  }, [token]);

  return (
    <View style={styles.container}>
      {state === 'loading' ? <ActivityIndicator size="large" color={SAMBAL} /> : <Text style={styles.emoji}>{state === 'success' ? '✅' : '⚠️'}</Text>}
      <Text style={styles.heading}>{state === 'success' ? 'Email verified' : state === 'loading' ? 'Verifying…' : 'Verification problem'}</Text>
      <Text style={styles.sub}>{message}</Text>
      {state !== 'loading' ? (
        <Pressable style={styles.btn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.btnText}>Go to sign in</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 24 },
  emoji: { fontSize: 48, marginBottom: 12 },
  heading: { fontSize: 24, fontWeight: '800', color: '#111827' },
  sub: { fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center', marginBottom: 20 },
  btn: { backgroundColor: SAMBAL, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 14 },
  btnText: { color: '#fff', fontWeight: '700' },
});
