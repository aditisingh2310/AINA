import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Linking } from "react-native";
import API, { extractErrorMessage } from "../services/api";
import ScreenContainer from "../ui/ScreenContainer";
import Card from "../ui/Card";
import PrimaryButton from "../ui/PrimaryButton";
import SectionHeader from "../ui/SectionHeader";
import Badge from "../ui/Badge";
import { colors, spacing } from "../ui/theme";

export default function ReportScreen() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    API.get("/report/summary")
      .then((res) => setReport(res.data))
      .catch((e) => setError(extractErrorMessage(e)));
  }, []);

  const exportJson = async () => {
    const res = await API.get("/report/export/json");
    alert(`JSON report generated with ${res.data.timeline.length} timeline events`);
  };

  const exportPdf = async () => {
    const base = API.defaults.baseURL;
    Linking.openURL(`${base}/report/export/pdf`);
  };

  const maxType = Math.max(1, ...Object.values(report?.byType || {}));

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SectionHeader title="Smart Report" subtitle="AI summary + legal export" />
        {!!error && <Text style={{ color: colors.danger }}>{error}</Text>}

        {report && (
          <>
            <Card>
              <Text style={styles.title}>Overview</Text>
              <View style={styles.row}><Text style={styles.key}>Total Incidents</Text><Badge label={`${report.totalIncidents}`} /></View>
              <View style={styles.row}><Text style={styles.key}>Most Frequent</Text><Text style={styles.val}>{report.mostFrequentType || "N/A"}</Text></View>
              <View style={styles.row}><Text style={styles.key}>Risk Level</Text><Badge label={report.riskLevel} tone={report.riskLevel === 'high' ? 'high' : report.riskLevel === 'medium' ? 'medium' : 'low'} /></View>
            </Card>

            <Card>
              <Text style={styles.title}>Type Distribution</Text>
              {Object.keys(report.byType || {}).map((key) => (
                <View key={key} style={{ marginBottom: spacing.sm }}>
                  <Text style={styles.val}>{key} ({report.byType[key]})</Text>
                  <View style={styles.barTrack}><View style={[styles.barFill, { width: `${(report.byType[key] / maxType) * 100}%` }]} /></View>
                </View>
              ))}
            </Card>

            <Card>
              <Text style={styles.title}>AI Narrative</Text>
              <Text style={styles.val}>{report.legalNarrative || "No narrative available"}</Text>
            </Card>

            <PrimaryButton title="Export JSON" onPress={exportJson} />
            <PrimaryButton title="Export PDF" onPress={exportPdf} />
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.textPrimary, fontWeight: '700', fontSize: 18, marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  key: { color: colors.textSecondary },
  val: { color: colors.textPrimary },
  barTrack: { height: 8, backgroundColor: colors.surfaceSoft, borderRadius: 999, marginTop: spacing.xs },
  barFill: { height: 8, backgroundColor: colors.primary, borderRadius: 999 },
});
