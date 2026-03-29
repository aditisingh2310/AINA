import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import API, { extractErrorMessage } from "../services/api";
import { captureCurrentLocation, recordEmergencyAudio } from "../mobile/sos";
import { encryptEvidence } from "../mobile/encryption";
import { enqueueSOS, syncOfflineQueues } from "../mobile/offlineQueue";
import { buildReplayHeaders } from "../mobile/requestSecurity";
import ScreenContainer from "../ui/ScreenContainer";
import SecondaryButton from "../ui/SecondaryButton";
import { colors, typography } from "../ui/theme";

export default function SOSScreen() {
  const [status, setStatus] = useState("Ready");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [cancelled, setCancelled] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    syncOfflineQueues();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const postSOSWithRetry = async (payload) => {
    let attempt = 0;
    while (attempt < 3) {
      try {
        const headers = await buildReplayHeaders();
        await API.post("/sos/trigger", { ...payload, retryCount: attempt }, { headers });
        return;
      } catch {
        attempt += 1;
      }
    }
    throw new Error("Network retry exhausted");
  };

  const runCountdown = async () => {
    setCancelled(false);
    for (let i = 3; i >= 1; i -= 1) {
      if (cancelled) throw new Error("Cancelled");
      setCountdown(i);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setCountdown(0);
  };

  const triggerSOS = async () => {
    try {
      setError("");
      setStatus("Confirming SOS...");
      await runCountdown();

      setStatus("Capturing location...");
      const location = await captureCurrentLocation();

      setStatus("Recording emergency audio...");
      const audio = await recordEmergencyAudio(30);

      setStatus("Encrypting audio...");
      const encryptedAudio = await encryptEvidence(audio.base64, "sos-default-passphrase");
      const payload = { location, encryptedAudioBase64: encryptedAudio.encrypted, encryptionMeta: encryptedAudio.meta };

      const network = await NetInfo.fetch();
      if (!network.isConnected) {
        await enqueueSOS(payload);
        setStatus("SOS queued offline. Will auto-send once online.");
        return;
      }

      setStatus("Sending SOS...");
      await postSOSWithRetry(payload);
      setStatus("SOS sent successfully");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError(extractErrorMessage(e));
      setStatus("SOS cancelled or failed");
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.center}>
        <Text style={typography.sectionTitle}>Emergency SOS</Text>
        <Text style={styles.subtitle}>Hold calm. Tap to trigger with 3-second safety countdown.</Text>

        <Animated.View style={[styles.glow, { transform: [{ scale: pulse }] }]}>
          <Pressable onPress={triggerSOS}>
            <LinearGradient colors={["#EF4444", "#B91C1C"]} style={styles.sosButton}>
              <Text style={styles.sosText}>SOS</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {!!countdown && (
          <View style={styles.countdownBox}>
            <Text style={styles.countdown}>{countdown}</Text>
            <SecondaryButton title="Cancel" onPress={() => { setCancelled(true); setCountdown(0); }} />
          </View>
        )}

        <Text style={styles.status}>Status: {status}</Text>
        {!!error && <Text style={styles.error}>{error}</Text>}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  subtitle: { color: colors.textSecondary, marginTop: 6, marginBottom: 20, textAlign: "center" },
  glow: { shadowColor: colors.danger, shadowOpacity: 0.45, shadowRadius: 24, elevation: 10 },
  sosButton: { width: 220, height: 220, borderRadius: 110, alignItems: "center", justifyContent: "center" },
  sosText: { color: "white", fontSize: 54, fontWeight: "800" },
  countdownBox: { marginTop: 18, alignItems: "center" },
  countdown: { color: colors.danger, fontSize: 48, fontWeight: "800" },
  status: { color: colors.textPrimary, marginTop: 10 },
  error: { color: colors.danger, marginTop: 6 },
});
