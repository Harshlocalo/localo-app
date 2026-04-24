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
import { useStore } from "@/context/StoreContext";

const CATEGORIES = ["Grocery", "Stationery", "Electronics", "Pharmacy", "Fashion", "Food & Beverages", "Books", "Other"];

export default function StoreFormScreen() {
  const [storeName, setStoreName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const { registerStore } = useStore();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const c = Colors.light;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSubmit = async () => {
    if (!storeName.trim() || !address.trim() || !city.trim() || !pincode.trim() || !category) {
      Alert.alert("Incomplete Form", "Please fill in all fields.");
      return;
    }
    if (pincode.length !== 6) {
      Alert.alert("Invalid Pincode", "Pincode must be 6 digits.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    await registerStore({
      name: storeName.trim(),
      address: address.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      category,
      ownerId: user?.id || "",
    });
    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Store Registered!", "Your store is now live on Localo.", [
      { text: "Go to Dashboard", onPress: () => router.replace("/(main)/dashboard") },
    ]);
  };

  const Field = ({
    label,
    value,
    onChange,
    placeholder,
    keyboardType,
    icon,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    keyboardType?: "default" | "numeric";
    icon: keyof typeof Feather.glyphMap;
  }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.label, { color: c.textSecondary }]}>{label}</Text>
      <View style={[styles.inputWrapper, { backgroundColor: c.inputBg, borderColor: c.border }]}>
        <Feather name={icon} size={16} color={c.textMuted} style={{ marginRight: 10 }} />
        <TextInput
          style={[styles.input, { color: c.text }]}
          placeholder={placeholder}
          placeholderTextColor={c.textMuted}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType || "default"}
        />
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={[styles.header, { backgroundColor: c.card, paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={22} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>Register Your Store</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: bottomPad + 30 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: c.card }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconBg, { backgroundColor: "#FFF0F1" }]}>
              <Feather name="shopping-bag" size={22} color={c.primary} />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: c.text }]}>Store Details</Text>
              <Text style={[styles.cardSub, { color: c.textSecondary }]}>
                Fill in your store information
              </Text>
            </View>
          </View>

          <Field
            label="Store Name"
            value={storeName}
            onChange={setStoreName}
            placeholder="e.g. Fresh Basket Mart"
            icon="shopping-bag"
          />
          <Field
            label="Full Address"
            value={address}
            onChange={setAddress}
            placeholder="Shop No., Street, Locality"
            icon="map-pin"
          />
          <Field
            label="City"
            value={city}
            onChange={setCity}
            placeholder="e.g. Mumbai"
            icon="navigation"
          />
          <Field
            label="Pincode"
            value={pincode}
            onChange={(v) => setPincode(v.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit pincode"
            icon="hash"
            keyboardType="numeric"
          />

          <Text style={[styles.label, { color: c.textSecondary, marginBottom: 10 }]}>
            Store Category
          </Text>
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: isSelected ? c.primary : c.inputBg,
                      borderColor: isSelected ? c.primary : c.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCategory(cat);
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: isSelected ? "#fff" : c.textSecondary },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: c.primary, opacity: loading ? 0.75 : 1 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="check-circle" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Register Store</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Poppins_600SemiBold",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 22,
  },
  cardIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: "Poppins_600SemiBold",
  },
  cardSub: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    marginTop: 1,
  },
  label: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    height: "100%",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 4,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  categoryChipText: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 54,
    borderRadius: 14,
    shadowColor: "#E23744",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
});
