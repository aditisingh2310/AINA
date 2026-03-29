import React from "react";
import { View, Text } from "react-native";
import { colors } from "../ui/theme";

export default function ErrorState({ message }) {
  if (!message) return null;
  return (
    <View style={{ backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: "rgba(239,68,68,0.35)" }}>
      <Text style={{ color: colors.danger }}>{message}</Text>
    </View>
  );
}
