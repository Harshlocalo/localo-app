import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Linking from "expo-linking";
import React from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Colors from "@/constants/colors";
import type { Store } from "@/data/stores";

interface Props {
  store: Store;
}

export default function StoreCard({ store }: Props) {
  const color = Colors.light;

  const openMap = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const query = encodeURIComponent(store.address);
    const url =
      Platform.OS === "ios"
        ? `maps:?q=${query}`
        : `https://www.google.com/maps/search/?api=1&query=${query}`;
    await Linking.openURL(url);
  };

  return (
    <View style={[styles.card, { backgroundColor: color.card }]}>
      <View style={styles.imageWrapper}>
        <Image source={store.image} style={styles.image} resizeMode="cover" />
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: store.isOpen ? color.success : "#bbb" },
          ]}
        >
          <Text style={styles.statusText}>{store.isOpen ? "Open" : "Closed"}</Text>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={[styles.name, { color: color.text }]} numberOfLines={1}>
            {store.name}
          </Text>
          <View style={styles.ratingChip}>
            <Feather name="star" size={10} color="#FFC107" />
            <Text style={styles.ratingText}>{store.rating}</Text>
          </View>
        </View>
        <Text style={[styles.desc, { color: color.textSecondary }]} numberOfLines={2}>
          {store.description}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="map-pin" size={12} color={color.primary} />
            <Text style={[styles.metaText, { color: color.textMuted }]}>
              {store.distance}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="clock" size={12} color={color.primary} />
            <Text style={[styles.metaText, { color: color.textMuted }]}>
              {store.deliveryTime}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="tag" size={12} color={color.primary} />
            <Text style={[styles.metaText, { color: color.textMuted }]}>
              {store.category}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={openMap}
          style={[styles.mapBtn, { borderColor: color.primary }]}
          activeOpacity={0.8}
        >
          <Feather name="map" size={13} color={color.primary} />
          <Text style={[styles.mapBtnText, { color: color.primary }]}>
            Open Map
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageWrapper: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 160,
    backgroundColor: "#f0f0f0",
  },
  statusBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },
  content: {
    padding: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    flex: 1,
    marginRight: 8,
  },
  ratingChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E6",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: "#E8960A",
  },
  desc: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    lineHeight: 18,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  mapBtnText: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
});
