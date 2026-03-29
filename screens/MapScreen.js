import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import API from "../services/api";
import { colors } from "../ui/theme";
import PrimaryButton from "../ui/PrimaryButton";
import LoadingState from "../components/LoadingState";
import { getSocket } from "../services/socket";

function markerColor(severity) {
  if ((severity || 0) >= 8) return "#dc2626";
  if ((severity || 0) >= 5) return "#f59e0b";
  return "#16a34a";
}

export default function MapScreen({ navigation }) {
  const [incidents, setIncidents] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const locPerm = await Location.requestForegroundPermissionsAsync();
    if (locPerm.status === "granted") {
      const pos = await Location.getCurrentPositionAsync({});
      const coords = pos.coords;
      setLocation(coords);
      const res = await API.get(`/incidents/nearby?latitude=${coords.latitude}&longitude=${coords.longitude}`);
      setIncidents(res.data.incidents || []);
    } else {
      const res = await API.get("/incidents/nearby");
      setIncidents(res.data.incidents || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => setLoading(false));

    const socket = getSocket();
    const onCreated = () => load().catch(() => null);
    socket.on("incident:created", onCreated);

    return () => {
      socket.off("incident:created", onCreated);
    };
  }, []);

  if (loading) return <LoadingState label="Loading incident map..." />;

  const initialRegion = {
    latitude: location?.latitude || incidents[0]?.latitude || 12.97,
    longitude: location?.longitude || incidents[0]?.longitude || 77.59,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion} showsUserLocation>
        {incidents.map((incident) => (
          <Marker
            key={incident.id}
            coordinate={{ latitude: incident.latitude, longitude: incident.longitude }}
            pinColor={markerColor(incident.aiSeverity)}
            title={`${incident.type} (${incident.aiSeverity || "N/A"})`}
            description={new Date(incident.timestamp).toLocaleString()}
            onCalloutPress={() => navigation.navigate("Incidents")}
          />
        ))}
      </MapView>
      <View style={styles.footer}>
        <Text style={{ color: colors.textPrimary }}>{incidents.length} incidents visible</Text>
        <PrimaryButton title="Open Reports" onPress={() => navigation.navigate("Report")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  footer: { padding: 12, backgroundColor: colors.surface },
});
