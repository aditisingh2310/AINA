import React, { useEffect, useState } from "react";
import { Text, ScrollView } from "react-native";
import API, { extractErrorMessage } from "../services/api";
import ScreenContainer from "../ui/ScreenContainer";
import Card from "../ui/Card";
import SectionHeader from "../ui/SectionHeader";
import { colors } from "../ui/theme";

export default function AIInsightsScreen() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    API.get("/ai/insights")
      .then((res) => setData(res.data))
      .catch((e) => setError(extractErrorMessage(e, "Unable to load AI insights")));
  }, []);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <SectionHeader title="AI Insights" subtitle="Patterns detected from your incident timeline" />
        {!!error && <Text style={{ color: colors.danger, marginBottom: 8 }}>{error}</Text>}
        {!data && !error && <Card><Text style={{ color: colors.textSecondary }}>Analyzing patterns...</Text></Card>}

        {data && (
          <>
            <Card>
              <Text style={{ color: colors.textSecondary }}>Most common type</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '700', textTransform: 'capitalize' }}>{data.topIncidentType || "N/A"}</Text>
            </Card>

            <Card>
              <Text style={{ color: colors.textPrimary, fontWeight: '700', marginBottom: 6 }}>Peak Hours</Text>
              {data.peakHours?.map((h) => <Text key={h.hour} style={{ color: colors.textSecondary }}>{h.hour}:00 — {h.count} incidents</Text>)}
            </Card>

            <Card>
              <Text style={{ color: colors.textPrimary, fontWeight: '700', marginBottom: 6 }}>High-Risk Locations</Text>
              {data.riskyAreas?.map((area) => <Text key={area.coord} style={{ color: colors.textSecondary }}>{area.coord} ({area.count})</Text>)}
            </Card>

            <Card>
              <Text style={{ color: colors.textPrimary, fontWeight: '700', marginBottom: 6 }}>Safety Tips</Text>
              {data.safetyTips?.map((tip, idx) => <Text key={idx} style={{ color: colors.textSecondary }}>• {tip}</Text>)}
            </Card>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
