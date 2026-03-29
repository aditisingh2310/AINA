import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import API, { extractErrorMessage } from "../services/api";
import { decryptEvidence } from "../mobile/encryption";
import ErrorState from "../components/ErrorState";
import { getSocket } from "../services/socket";
import ScreenContainer from "../ui/ScreenContainer";
import Card from "../ui/Card";
import InputField from "../ui/InputField";
import Badge from "../ui/Badge";
import SectionHeader from "../ui/SectionHeader";
import { colors, spacing } from "../ui/theme";

const ICONS = { verbal: "account-voice", physical: "hand-back-right", financial: "cash-multiple", threat: "alert-octagon" };

function SkeletonCard() {
  return <View style={styles.skeleton} />;
}

export default function IncidentsScreen() {
  const [data, setData] = useState([]);
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await API.get("/incident");
      setData(res.data);
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
    const socket = getSocket();
    const refresh = () => load();
    socket.on("incident:created", refresh);
    socket.on("sos:triggered", refresh);
    return () => {
      socket.off("incident:created", refresh);
      socket.off("sos:triggered", refresh);
    };
  }, []);

  const decryptItem = (item) => {
    try {
      if (!passphrase) return "Enter passphrase to decrypt";
      return decryptEvidence(item.encryptedText, passphrase, item.encryptionMeta);
    } catch {
      return "Unable to decrypt with current passphrase.";
    }
  };

  return (
    <ScreenContainer>
      <SectionHeader title="Incidents" subtitle="Encrypted timeline" />
      <InputField label="Decryption passphrase" secureTextEntry value={passphrase} onChangeText={setPassphrase} placeholder="Enter passphrase" />
      <ErrorState message={error} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {!loading && !data.length && <Card><Text style={styles.empty}>No incidents nearby. Stay safe!</Text></Card>}

        {data.map((item) => (
          <Card key={item.id}>
            <View style={styles.rowBetween}>
              <View style={styles.rowIcon}>
                <Icon name={ICONS[item.type] || "shield-alert"} size={20} color={colors.primary} />
                <Text style={styles.type}>{item.type}</Text>
              </View>
              <Badge label={`Severity ${item.aiSeverity || "N/A"}`} tone={(item.aiSeverity || 0) >= 8 ? "high" : (item.aiSeverity || 0) >= 5 ? "medium" : "low"} />
            </View>
            <Text style={styles.meta}>📍 {item.latitude ? `${item.latitude.toFixed(3)}, ${item.longitude.toFixed(3)}` : "Location unavailable"}</Text>
            <Text style={styles.meta}>🕒 {new Date(item.timestamp).toLocaleString()}</Text>
            <Text style={styles.body}>{decryptItem(item)}</Text>
          </Card>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  rowIcon: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  type: { color: colors.textPrimary, fontWeight: "700", textTransform: "capitalize" },
  meta: { color: colors.textSecondary, marginBottom: spacing.xs },
  body: { color: colors.textPrimary, marginTop: spacing.sm },
  skeleton: { height: 140, borderRadius: 18, backgroundColor: colors.surface, marginBottom: spacing.md, opacity: 0.5 },
  empty: { color: colors.textSecondary, textAlign: "center" },
});
