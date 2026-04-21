import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CategoryPills from "@/components/CategoryPill";
import StoreCard from "@/components/StoreCard";
import Colors from "@/constants/colors";
import { STORES } from "@/data/stores";
import { useLocation } from "@/context/LocationContext";

export default function HomeScreen() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const { location, isDetecting, allLocations, changeLocation } = useLocation();
  const insets = useSafeAreaInsets();
  const c = Colors.light;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filteredStores = useMemo(() => {
    let stores = STORES;

    if (location && !isDetecting) {
      stores = stores.filter(
        (s) => s.city === location.city || s.area === location.area
      );
      if (stores.length === 0) {
        stores = STORES.slice(0, 5);
      }
    }

    if (category !== "All") {
      stores = stores.filter((s) => s.category === category);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      stores = stores.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      );
    }

    return stores;
  }, [location, isDetecting, category, search]);

  const locationLabel = location
    ? `${location.area}, ${location.city}`
    : "Detecting...";

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View
        style={[
          styles.header,
          { backgroundColor: c.card, paddingTop: topPad + 8 },
        ]}
      >
        <TouchableOpacity
          style={styles.locationRow}
          onPress={() => setShowLocationPicker(true)}
          activeOpacity={0.7}
        >
          <Feather name="map-pin" size={16} color={c.primary} />
          {isDetecting ? (
            <View style={styles.detectingRow}>
              <ActivityIndicator size="small" color={c.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.locationText, { color: c.textSecondary }]}>
                Detecting location...
              </Text>
            </View>
          ) : (
            <Text style={[styles.locationText, { color: c.text }]} numberOfLines={1}>
              {locationLabel}
            </Text>
          )}
          <Feather name="chevron-down" size={16} color={c.textMuted} style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        <View style={[styles.searchBar, { backgroundColor: c.inputBg, borderColor: c.border }]}>
          <Feather name="search" size={16} color={c.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            placeholder="Search stores, products..."
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={c.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: 16, paddingBottom: bottomPad + 90 }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        <View style={{ backgroundColor: c.background, paddingBottom: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 0 }}>
            <CategoryPills selected={category} onSelect={setCategory} />
          </ScrollView>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>
            {isDetecting ? "Loading Stores..." : `Stores Near You`}
          </Text>
          <Text style={[styles.sectionCount, { color: c.textMuted }]}>
            {filteredStores.length} found
          </Text>
        </View>

        {isDetecting ? (
          <View style={styles.detectingContainer}>
            <ActivityIndicator size="large" color={c.primary} />
            <Text style={[styles.detectingLabel, { color: c.textSecondary }]}>
              Finding stores near you...
            </Text>
          </View>
        ) : filteredStores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="map" size={48} color={c.border} />
            <Text style={[styles.emptyTitle, { color: c.text }]}>No stores found</Text>
            <Text style={[styles.emptyDesc, { color: c.textSecondary }]}>
              Try a different category or location
            </Text>
          </View>
        ) : (
          filteredStores.map((store) => <StoreCard key={store.id} store={store} />)
        )}
      </ScrollView>

      <Modal
        visible={showLocationPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: c.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: c.card, borderBottomColor: c.border }]}>
            <Text style={[styles.modalTitle, { color: c.text }]}>Change Location</Text>
            <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
              <Feather name="x" size={22} color={c.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={allLocations}
            keyExtractor={(item) => item.area}
            contentContainerStyle={{ padding: 16, gap: 10 }}
            ListHeaderComponent={
              <TouchableOpacity
                style={[styles.mapPickerBtn, { backgroundColor: c.primary }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowLocationPicker(false);
                  router.push("/(main)/map-picker");
                }}
                activeOpacity={0.85}
              >
                <Feather name="map" size={18} color="#fff" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.mapPickerTitle}>Choose on Map</Text>
                  <Text style={styles.mapPickerSub}>Drag pin to set exact location</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#fff" />
              </TouchableOpacity>
            }
            renderItem={({ item }) => {
              const isSelected = location?.area === item.area;
              return (
                <TouchableOpacity
                  style={[
                    styles.locationItem,
                    {
                      backgroundColor: isSelected ? "#FFF0F1" : c.card,
                      borderColor: isSelected ? c.primary : c.border,
                    },
                  ]}
                  onPress={async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    await changeLocation(item);
                    setShowLocationPicker(false);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.locationItemLeft}>
                    <Feather name="map-pin" size={16} color={isSelected ? c.primary : c.textMuted} />
                    <View>
                      <Text style={[styles.locationItemArea, { color: isSelected ? c.primary : c.text }]}>
                        {item.area}
                      </Text>
                      <Text style={[styles.locationItemCity, { color: c.textSecondary }]}>
                        {item.city}, {item.state}
                      </Text>
                    </View>
                  </View>
                  {isSelected && <Feather name="check" size={16} color={c.primary} />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  detectingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    flex: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 46,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    height: "100%",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Poppins_600SemiBold",
  },
  sectionCount: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },
  detectingContainer: {
    paddingTop: 60,
    alignItems: "center",
    gap: 16,
  },
  detectingLabel: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  locationItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  locationItemArea: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  locationItemCity: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    marginTop: 1,
  },
  mapPickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    marginBottom: 6,
  },
  mapPickerTitle: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  mapPickerSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    marginTop: 1,
  },
});
