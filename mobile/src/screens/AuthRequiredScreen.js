import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const SAMBAL = '#DC2626';

export default function AuthRequiredScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🔐</Text>
      <Text style={styles.heading}>Sign in to continue</Text>
      <Text style={styles.sub}>This part of Cincailah needs an account.</Text>
      <Pressable style={styles.btn} onPress={() => navigation.navigate('Auth', { screen: 'Login' })}>
        <Text style={styles.btnText}>Go to sign in</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 24 },
  emoji: { fontSize: 48, marginBottom: 12 },
  heading: { fontSize: 24, fontWeight: '800', color: '#111827' },
  sub: { fontSize: 14, color: '#6B7280', marginTop: 8, marginBottom: 20 },
  btn: { backgroundColor: SAMBAL, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 14 },
  btnText: { color: '#fff', fontWeight: '700' },
});
