import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { cancelLunchReminder, getReminderStatus, scheduleLunchReminder } from '../lib/notifications';
import { useAuth } from '../context/AuthContext';

const SAMBAL = '#DC2626';

export default function RemindersScreen() {
  const { mode } = useAuth();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const status = await getReminderStatus();
      setEnabled(Boolean(status));
    })();
  }, []);

  const onToggle = async (value) => {
    if (value) {
      await scheduleLunchReminder(11, 45, { localOnly: mode === 'guest' });
      setEnabled(true);
      Alert.alert('Reminder set', 'You will get a daily lunch reminder at 11:45 AM.');
    } else {
      await cancelLunchReminder();
      setEnabled(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Lunch Reminders</Text>
      <Text style={styles.sub}>Guest mode keeps reminders only on this device.</Text>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Daily lunch reminder</Text>
          <Text style={styles.help}>11:45 AM every day</Text>
        </View>
        <Switch value={enabled} onValueChange={onToggle} trackColor={{ true: SAMBAL, false: '#E5E7EB' }} />
      </View>
      <Pressable style={styles.btn} onPress={() => onToggle(!enabled)}>
        <Text style={styles.btnText}>{enabled ? 'Disable reminder' : 'Enable reminder'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  heading: { fontSize: 24, fontWeight: '800', color: '#111827' },
  sub: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  row: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: { fontSize: 16, fontWeight: '700', color: '#111827' },
  help: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  btn: { marginTop: 20, backgroundColor: SAMBAL, borderRadius: 12, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
});
