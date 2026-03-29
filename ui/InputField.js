import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, spacing, typography } from './theme';

export default function InputField({ label, ...props }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      {!!label && <Text style={[typography.caption, { marginBottom: spacing.sm }]}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceSoft,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
});
