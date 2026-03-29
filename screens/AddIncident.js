import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import * as Location from "expo-location";
import API, { extractErrorMessage } from "../services/api";
import { encryptEvidence } from "../mobile/encryption";
import { buildReplayHeaders } from "../mobile/requestSecurity";
import ScreenContainer from "../ui/ScreenContainer";
import Card from "../ui/Card";
import PrimaryButton from "../ui/PrimaryButton";
import SecondaryButton from "../ui/SecondaryButton";
import InputField from "../ui/InputField";
import Badge from "../ui/Badge";
import { colors, spacing, typography } from "../ui/theme";

const CATEGORIES = ["verbal", "physical", "financial", "threat"];

export default function AddIncident() {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("verbal");
  const [desc, setDesc] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [locationText, setLocationText] = useState("Auto detect");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const progress = `${step}/4`;

  const submit = async () => {
    try {
      setLoading(true);
      setError("");

      const encrypted = await encryptEvidence(desc, passphrase);
      const analysisRes = await API.post("/incident/analyze", { text: desc });

      let latitude;
      let longitude;
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status === "granted") {
          const pos = await Location.getCurrentPositionAsync({});
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
        }
      } catch {}

      const headers = await buildReplayHeaders();
      await API.post("/incident", {
        type: category,
        encryptedText: encrypted.encrypted,
        evidenceHash: encrypted.hash,
        encryptionMeta: encrypted.meta,
        timestamp: new Date().toISOString(),
        aiResult: analysisRes.data.analysis,
        latitude,
        longitude,
      }, { headers });

      setStep(1); setDesc(""); setPassphrase("");
      alert("Incident submitted securely");
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={typography.sectionTitle}>Report Incident</Text>
      <Text style={[typography.caption, { marginBottom: spacing.md }]}>Step {progress}</Text>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} /></View>

      <Card>
        {step === 1 && (
          <>
            <Text style={styles.label}>Choose category</Text>
            <View style={styles.tileWrap}>
              {CATEGORIES.map((c) => (
                <Pressable key={c} onPress={() => setCategory(c)} style={[styles.tile, category === c && styles.tileActive]}>
                  <Text style={styles.tileText}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <InputField label="Describe incident" value={desc} onChangeText={setDesc} multiline style={{ minHeight: 120 }} />
            <InputField label="Passphrase" secureTextEntry value={passphrase} onChangeText={setPassphrase} placeholder="Only you can decrypt" />
          </>
        )}

        {step === 3 && (
          <>
            <InputField label="Location" value={locationText} onChangeText={setLocationText} />
            <Text style={styles.hint}>GPS will be captured automatically if permission is granted.</Text>
          </>
        )}

        {step === 4 && (
          <>
            <Text style={styles.review}>Review</Text>
            <Badge label={category.toUpperCase()} />
            <Text style={styles.hint}>{desc || 'No description'}</Text>
          </>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.rowButtons}>
          {step > 1 ? <SecondaryButton title="Back" onPress={() => setStep(step - 1)} /> : <View style={{ flex: 1 }} />}
          {step < 4 ? <PrimaryButton title="Next" onPress={() => setStep(step + 1)} style={{ flex: 1 }} /> : <PrimaryButton title={loading ? "Submitting..." : "Submit"} onPress={submit} style={{ flex: 1 }} />}
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  progressTrack: { height: 8, backgroundColor: colors.surface, borderRadius: 999, marginBottom: spacing.lg },
  progressFill: { height: 8, backgroundColor: colors.accent, borderRadius: 999 },
  label: { color: colors.textPrimary, marginBottom: spacing.sm, fontWeight: '700' },
  tileWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { borderWidth: 1, borderColor: colors.surfaceSoft, borderRadius: 12, padding: spacing.md },
  tileActive: { borderColor: colors.primary, backgroundColor: 'rgba(37,99,235,0.2)' },
  tileText: { color: colors.textPrimary, textTransform: 'capitalize' },
  hint: { color: colors.textSecondary, marginTop: spacing.sm },
  review: { color: colors.textPrimary, fontWeight: '700', marginBottom: spacing.sm },
  rowButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, alignItems: 'center' },
  error: { color: colors.danger, marginTop: spacing.sm },
});
