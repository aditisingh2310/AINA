import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { colors, spacing } from './theme';

export default function ScreenContainer({ children }) {
  return <SafeAreaView style={styles.container}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
