import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors, spacing } from './theme';

export default function SecondaryButton({ title, onPress }) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.title}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceSoft,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: { color: colors.textPrimary, fontWeight: '600' },
});
