import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";

const MENU_ITEMS = [
  { icon: "heart" as const, label: "Favourites", color: "#E23744" },
  { icon: "clock" as const, label: "Order History", color: "#F39C12" },
  { icon: "map-pin" as const, label: "Saved Addresses", color: "#3498DB" },
  { icon: "bell" as const, label: "Notifications", color: "#9B59B6" },
  { icon: "help-circle" as const, label: "Help & Support", color: "#2ECC71" },
  { icon: "info" as const, label: "About", color: "#95A5A6" },
];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { sellerStore } = useStore();
  const insets = useSafeAreaInsets();
  const c = Colors.light;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={{ paddingBottom: bottomPad + 90 }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[styles.heroHeader, { paddingTop: topPad + 16 }]}
      >
        <View style={styles.avatarRow}>
          <View style={[styles.avatar, { backgroundColor: c.primary }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: c.text }]}>{user?.name}</Text>
            <Text style={[styles.userEmail, { color: c.textSecondary }]}>{user?.email}</Text>
          </View>
          <TouchableOpacity style={[styles.editBtn, { borderColor: c.border }]} activeOpacity={0.7}>
            <Feather name="edit-2" size={16} color={c.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.sellerBanner, { backgroundColor: sellerStore ? "#F0FFF6" : "#FFF0F1", borderColor: sellerStore ? "#2ECC71" : c.primary }]}>
          {sellerStore ? (
            <View style={styles.sellerBannerContent}>
              <View>
                <Text style={[styles.sellerBannerTitle, { color: "#1A7A40" }]}>
                  Your Store: {sellerStore.name}
                </Text>
                <Text style={[styles.sellerBannerSub, { color: "#2ECC71" }]}>
                  {sellerStore.category} · {sellerStore.city}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.dashboardBtn, { backgroundColor: "#2ECC71" }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("/(main)/dashboard");
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.dashboardBtnText}>Dashboard</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.sellerBannerContent}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sellerBannerTitle, { color: c.primary }]}>
                  Grow your business
                </Text>
                <Text style={[styles.sellerBannerSub, { color: c.textSecondary }]}>
                  List your store & reach local customers
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.dashboardBtn, { backgroundColor: c.primary }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("/(main)/store-form");
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.dashboardBtnText}>Become a Seller</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>Account</Text>
        <View style={[styles.menuCard, { backgroundColor: c.card }]}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                index < MENU_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border },
              ]}
              activeOpacity={0.7}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}18` }]}>
                <Feather name={item.icon} size={18} color={item.color} />
              </View>
              <Text style={[styles.menuLabel, { color: c.text }]}>{item.label}</Text>
              <Feather name="chevron-right" size={18} color={c.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.section, { marginTop: 4 }]}>
        <TouchableOpacity
          style={[styles.signOutBtn, { backgroundColor: "#FFF0F1", borderColor: c.primary }]}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={18} color={c.primary} />
          <Text style={[styles.signOutText, { color: c.primary }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heroHeader: {
    backgroundColor: "#fff",
    padding: 20,
    paddingBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E23744",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  userEmail: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  sellerBanner: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
  },
  sellerBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sellerBannerTitle: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 2,
  },
  sellerBannerSub: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
  dashboardBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    flexShrink: 0,
  },
  dashboardBtnText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  menuCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  signOutText: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
});
