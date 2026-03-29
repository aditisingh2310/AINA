import React, { useEffect, useState } from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { getDemoMode, setDemoMode, injectDemoIncident } from "../mobile/demoMode";
import ScreenContainer from "../ui/ScreenContainer";
import Card from "../ui/Card";
import { typography, colors } from "../ui/theme";

export default function SettingsScreen() {
  const [demoMode, setDemo] = useState(false);

  useEffect(() => {
    getDemoMode().then(setDemo).catch(() => null);
  }, []);

  useEffect(() => {
    let timer;
    if (demoMode) {
      const run = async () => {
        try { await injectDemoIncident(); } catch {}
        timer = setTimeout(run, 30000 + Math.floor(Math.random() * 30000));
      };
      run();
    }
    return () => timer && clearTimeout(timer);
  }, [demoMode]);

  const onToggle = async (value) => {
    setDemo(value);
    await setDemoMode(value);
  };

  return (
    <ScreenContainer>
      <Text style={typography.largeTitle}>Settings</Text>
      <Card>
        <View style={styles.row}>
          <View>
            <Text style={styles.label}>Demo Mode</Text>
            <Text style={styles.note}>Simulate live activity every 30–60 seconds.</Text>
          </View>
          <Switch value={demoMode} onValueChange={onToggle} thumbColor={demoMode ? colors.primary : '#64748B'} />
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  note: { color: colors.textSecondary, marginTop: 4, maxWidth: 220 },
});
