import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import API from "../services/api";
import ScreenContainer from "../ui/ScreenContainer";
import Card from "../ui/Card";
import SectionHeader from "../ui/SectionHeader";
import Badge from "../ui/Badge";
import { colors, spacing, typography } from "../ui/theme";

function ActionCard({ icon, title, description, onPress, danger }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }], marginBottom: spacing.md }}>
      <Pressable onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
        <Card>
          <View style={styles.actionHead}>
            <View style={[styles.iconWrap, { backgroundColor: danger ? "rgba(239,68,68,0.2)" : "rgba(37,99,235,0.2)" }]}>
              <Icon name={icon} size={22} color={danger ? colors.danger : colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>{title}</Text>
              <Text style={styles.actionDesc}>{description}</Text>
            </View>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
}

export default function HomeScreen({ navigation }) {
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    API.get('/incident').then((res) => setRecent(res.data.slice(0, 3))).catch(() => null);
  }, []);

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={typography.largeTitle}>Hi, stay safe 👋</Text>
        <Text style={[typography.caption, { marginBottom: spacing.xl }]}>Your private safety companion is active.</Text>

        <ActionCard icon="file-document-edit-outline" title="Report Incident" description="Securely capture evidence in 4 simple steps." onPress={() => navigation.navigate('AddIncident')} />
        <ActionCard icon="map-marker-radius-outline" title="View Map" description="See nearby activity and risk hotspots." onPress={() => navigation.navigate('Map')} />
        <ActionCard icon="alarm-light-outline" title="Emergency SOS" description="Instantly alert trusted contacts." onPress={() => navigation.navigate('SOS')} danger />

        <SectionHeader title="Recent Incidents" subtitle="Latest encrypted logs" />
        {!recent.length ? (
          <Card><Text style={styles.empty}>No incidents yet. Stay safe!</Text></Card>
        ) : recent.map((item) => (
          <Card key={item.id}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{item.type}</Text>
              <Badge label={`S${item.aiSeverity || 'N/A'}`} tone={(item.aiSeverity || 0) >= 8 ? 'high' : (item.aiSeverity || 0) >= 5 ? 'medium' : 'low'} />
            </View>
            <Text style={styles.cardDesc}>{new Date(item.timestamp).toLocaleString()}</Text>
          </Card>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  actionHead: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { color: colors.textPrimary, fontWeight: '700', fontSize: 16 },
  actionDesc: { color: colors.textSecondary, marginTop: spacing.xs },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: colors.textPrimary, fontWeight: '700', textTransform: 'capitalize' },
  cardDesc: { color: colors.textSecondary, marginTop: spacing.sm },
  empty: { color: colors.textSecondary, textAlign: 'center' },
});
