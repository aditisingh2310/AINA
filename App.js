import React, { Suspense, lazy } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoadingState from "./components/LoadingState";
import { colors } from "./ui/theme";

const LoginScreen = lazy(() => import("./screens/LoginScreen"));
const RegisterScreen = lazy(() => import("./screens/RegisterScreen"));
const HomeScreen = lazy(() => import("./screens/HomeScreen"));
const AddIncident = lazy(() => import("./screens/AddIncident"));
const IncidentsScreen = lazy(() => import("./screens/IncidentsScreen"));
const SOSScreen = lazy(() => import("./screens/SOSScreen"));
const ContactsScreen = lazy(() => import("./screens/ContactsScreen"));
const ReportScreen = lazy(() => import("./screens/ReportScreen"));
const MapScreen = lazy(() => import("./screens/MapScreen"));
const AIInsightsScreen = lazy(() => import("./screens/AIInsightsScreen"));
const SettingsScreen = lazy(() => import("./screens/SettingsScreen"));

const Stack = createNativeStackNavigator();

const darkTheme = {
  dark: true,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.surfaceSoft,
    notification: colors.danger,
  },
};

export default function App() {
  return (
    <NavigationContainer theme={darkTheme}>
      <Suspense fallback={<LoadingState label="Loading screen..." />}>
        <Stack.Navigator
          screenOptions={{
            animation: "slide_from_right",
            headerBackTitleVisible: false,
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.textPrimary,
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="AddIncident" component={AddIncident} options={{ title: "Report Incident" }} />
          <Stack.Screen name="Incidents" component={IncidentsScreen} options={{ title: "Incidents" }} />
          <Stack.Screen name="SOS" component={SOSScreen} options={{ title: "Emergency SOS" }} />
          <Stack.Screen name="Contacts" component={ContactsScreen} />
          <Stack.Screen name="Report" component={ReportScreen} />
          <Stack.Screen name="Map" component={MapScreen} />
          <Stack.Screen name="AIInsights" component={AIInsightsScreen} options={{ title: "AI Insights" }} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
      </Suspense>
    </NavigationContainer>
  );
}
