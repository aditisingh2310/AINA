import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../services/api";
import { buildReplayHeaders } from "./requestSecurity";

const KEY = "aina_demo_mode";

export async function setDemoMode(enabled) {
  await AsyncStorage.setItem(KEY, enabled ? "1" : "0");
}

export async function getDemoMode() {
  return (await AsyncStorage.getItem(KEY)) === "1";
}

export async function injectDemoIncident() {
  const payload = {
    type: "threat",
    encryptedText: "demo-encrypted-text",
    evidenceHash: "977af66b9812f389abd5ca3f74f99526adca31750f6f298d81ce9df4be8a7f9d",
    encryptionMeta: { demo: true },
    aiResult: { type: "threat", category: "threat", severityScore: 8, who: "unknown", when: "night" },
    latitude: 12.97 + Math.random() * 0.03,
    longitude: 77.59 + Math.random() * 0.03,
    timestamp: new Date().toISOString(),
  };
  const headers = await buildReplayHeaders();
  await API.post("/incident", payload, { headers });
}
