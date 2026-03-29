import React, { useState } from "react";
import { Text } from "react-native";
import API, { extractErrorMessage } from "../services/api";
import ScreenContainer from "../ui/ScreenContainer";
import Card from "../ui/Card";
import InputField from "../ui/InputField";
import PrimaryButton from "../ui/PrimaryButton";
import { typography, colors } from "../ui/theme";

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const register = async () => {
    try {
      setLoading(true);
      setError("");
      await API.post("/auth/register", { email, password });
      navigation.navigate("Login");
    } catch (e) {
      setError(extractErrorMessage(e, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Text style={typography.largeTitle}>Create account</Text>
      <Text style={[typography.caption, { marginBottom: 20 }]}>Your encrypted safety profile</Text>
      <Card>
        <InputField label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <InputField label="Password" secureTextEntry value={password} onChangeText={setPassword} placeholder="Min 8 chars" />
        {!!error && <Text style={{ color: colors.danger, marginBottom: 8 }}>{error}</Text>}
        <PrimaryButton title={loading ? "Creating..." : "Register"} onPress={register} />
      </Card>
    </ScreenContainer>
  );
}
