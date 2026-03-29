import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from './theme';

export default function Badge({ label, tone = 'neutral' }) {
  const bg = tone === 'high' ? colors.danger : tone === 'medium' ? colors.warning : tone === 'low' ? colors.accent : colors.surfaceSoft;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, alignSelf: 'flex-start' },
  text: { color: '#fff', fontWeight: '700', fontSize: 11 },
});
