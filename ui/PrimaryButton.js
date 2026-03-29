import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing } from './theme';

export default function PrimaryButton({ title, onPress, danger = false, style }) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value) => {
    Animated.spring(scale, { toValue: value, useNativeDriver: true, speed: 35, bounciness: 5 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        onPress={onPress}
        style={[styles.button, danger ? styles.danger : styles.primary, style]}
      >
        <Text style={styles.title}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  primary: { backgroundColor: colors.primary },
  danger: { backgroundColor: colors.danger },
  title: { color: colors.textPrimary, fontWeight: '700', fontSize: 16 },
});
