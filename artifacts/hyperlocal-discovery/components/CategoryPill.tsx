import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import Colors from "@/constants/colors";

const CATEGORIES = [
  { label: "All", icon: "grid" as const },
  { label: "Grocery", icon: "shopping-cart" as const },
  { label: "Stationery", icon: "edit-3" as const },
  { label: "Electronics", icon: "zap" as const },
  { label: "Pharmacy", icon: "heart" as const },
];

interface Props {
  selected: string;
  onSelect: (cat: string) => void;
}

export default function CategoryPills({ selected, onSelect }: Props) {
  const color = Colors.light;

  return (
    <View style={styles.container}>
      {CATEGORIES.map((cat) => {
        const isActive = selected === cat.label;
        return (
          <TouchableOpacity
            key={cat.label}
            style={[
              styles.pill,
              {
                backgroundColor: isActive ? color.primary : color.card,
                borderColor: isActive ? color.primary : color.border,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(cat.label);
            }}
            activeOpacity={0.8}
          >
            <Feather
              name={cat.icon}
              size={14}
              color={isActive ? "#fff" : color.textSecondary}
            />
            <Text
              style={[
                styles.label,
                { color: isActive ? "#fff" : color.textSecondary },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 4,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  label: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
  },
});
