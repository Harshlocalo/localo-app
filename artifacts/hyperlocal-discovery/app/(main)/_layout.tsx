import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Tabs, router } from "expo-router";
import React from "react";
import { Platform, StyleSheet, Text, View, useColorScheme } from "react-native";

import Colors from "@/constants/colors";
import { useCart } from "@/context/CartContext";

function CartTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const { totalItems } = useCart();
  return (
    <View style={{ position: "relative" }}>
      <Feather name="shopping-bag" size={22} color={color} />
      {totalItems > 0 && (
        <View style={[styles.badge, { backgroundColor: Colors.light.primary }]}>
          <Text style={styles.badgeText}>{totalItems > 9 ? "9+" : totalItems}</Text>
        </View>
      )}
    </View>
  );
}

export default function MainLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const c = Colors.light;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.tabIconDefault,
        headerShown: false,
        tabBarLabelStyle: {
          fontFamily: "Poppins_500Medium",
          fontSize: 11,
          marginBottom: isWeb ? 0 : -4,
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : "#fff",
          borderTopWidth: 1,
          borderTopColor: c.border,
          elevation: 0,
          height: isWeb ? 84 : 64,
          paddingBottom: isWeb ? 20 : 8,
          paddingTop: 8,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#fff" }]} />
          ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => <Feather name="search" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, focused }) => <CartTabIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="store-form"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontFamily: "Poppins_700Bold",
  },
});
