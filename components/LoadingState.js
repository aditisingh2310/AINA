import React from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { colors } from "../ui/theme";

export default function LoadingState({ label = "Loading..." }) {
  return (
    <View style={{ padding: 20, alignItems: "center", justifyContent: "center", flex: 1, backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ marginTop: 8, color: colors.textSecondary }}>{label}</Text>
    </View>
  );
}
