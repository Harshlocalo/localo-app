import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const c = Colors.light;

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/(main)/home");
    } catch {
      Alert.alert("Login Failed", "Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={[styles.container, { paddingTop: topPad + 20, paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 20 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoSection}>
        <View style={[styles.logoCircle, { backgroundColor: c.primary }]}>
          <Feather name="map-pin" size={36} color="#fff" />
        </View>
        <Text style={[styles.appName, { color: c.primary }]}>Localo</Text>
        <Text style={[styles.tagline, { color: c.textSecondary }]}>
          Your hyperlocal discovery app
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: c.card }]}>
        <Text style={[styles.heading, { color: c.text }]}>Welcome back</Text>
        <Text style={[styles.subheading, { color: c.textSecondary }]}>
          Sign in to continue
        </Text>

        <View style={styles.form}>
          <Text style={[styles.label, { color: c.textSecondary }]}>Email</Text>
          <View style={[styles.inputWrapper, { backgroundColor: c.inputBg, borderColor: c.border }]}>
            <Feather name="mail" size={16} color={c.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: c.text }]}
              placeholder="you@example.com"
              placeholderTextColor={c.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={[styles.label, { color: c.textSecondary }]}>Password</Text>
          <View style={[styles.inputWrapper, { backgroundColor: c.inputBg, borderColor: c.border }]}>
            <Feather name="lock" size={16} color={c.textMuted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: c.text }]}
              placeholder="••••••••"
              placeholderTextColor={c.textMuted}
              secureTextEntry={!showPwd}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPwd((v) => !v)} style={styles.eyeBtn}>
              <Feather name={showPwd ? "eye-off" : "eye"} size={16} color={c.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: c.textSecondary }]}>
          Don't have an account?{" "}
        </Text>
        <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
          <Text style={[styles.linkText, { color: c.primary }]}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    alignItems: "center",
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#E23744",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  appName: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    marginTop: 4,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  heading: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    marginBottom: 24,
  },
  form: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    marginBottom: 6,
    marginTop: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    height: "100%",
  },
  eyeBtn: {
    padding: 4,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    shadowColor: "#E23744",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  footer: {
    flexDirection: "row",
    marginTop: 24,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  linkText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
});
