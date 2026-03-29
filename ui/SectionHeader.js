import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, colors, spacing } from './theme';

export default function SectionHeader({ title, subtitle }) {
  return (
    <View style={styles.wrap}>
      <Text style={typography.sectionTitle}>{title}</Text>
      {!!subtitle && <Text style={[typography.caption, { color: colors.textSecondary }]}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { marginBottom: spacing.md } });
