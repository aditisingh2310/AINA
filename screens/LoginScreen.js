import React, { useState } from "react";
import { Text } from "react-native";
import API, { extractErrorMessage, setAuthToken } from "../services/api";
import ScreenContainer from "../ui/ScreenContainer";
import Card from "../ui/Card";
import InputField from "../ui/InputField";
import PrimaryButton from "../ui/PrimaryButton";
import SecondaryButton from "../ui/SecondaryButton";
import { typography, colors } from "../ui/theme";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.post("/auth/login", { email, password });
      setAuthToken(res.data.token);
      navigation.navigate("Home");
    } catch (e) {
      setError(extractErrorMessage(e, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={typography.largeTitle}>Welcome back</Text>
      <Text style={[typography.caption, { marginBottom: 20 }]}>Secure access to your safety vault</Text>
      <Card>
        <InputField label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <InputField label="Password" secureTextEntry value={password} onChangeText={setPassword} />
        {!!error && <Text style={{ color: colors.danger, marginBottom: 8 }}>{error}</Text>}
        <PrimaryButton title={loading ? "Signing in..." : "Login"} onPress={login} />
        <SecondaryButton title="Create Account" onPress={() => navigation.navigate("Register")} />
      </Card>
    </ScreenContainer>
  );
}
