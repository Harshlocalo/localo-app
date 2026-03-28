import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import StoreCard from "@/components/StoreCard";
import Colors from "@/constants/colors";
import { STORES } from "@/data/stores";

const SUGGESTIONS = ["Milk", "Pencil", "Headphones", "Paracetamol", "Notebook", "Charger", "Rice", "Vitamin C"];

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const insets = useSafeAreaInsets();
  const c = Colors.light;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return STORES.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.area.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={[styles.header, { backgroundColor: c.card, paddingTop: topPad + 8 }]}>
        <Text style={[styles.title, { color: c.text }]}>Search</Text>
        <View style={[styles.searchBar, { backgroundColor: c.inputBg, borderColor: c.border }]}>
          <Feather name="search" size={16} color={c.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            placeholder="Search for stores, products..."
            placeholderTextColor={c.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Feather name="x" size={16} color={c.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 90 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {query.trim() === "" ? (
          <View>
            <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
              Popular Searches
            </Text>
            <View style={styles.suggestionsGrid}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.suggestionChip, { backgroundColor: c.card, borderColor: c.border }]}
                  onPress={() => setQuery(s)}
                  activeOpacity={0.8}
                >
                  <Feather name="search" size={12} color={c.textMuted} />
                  <Text style={[styles.suggestionText, { color: c.text }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="search" size={48} color={c.border} />
            <Text style={[styles.emptyTitle, { color: c.text }]}>No results found</Text>
            <Text style={[styles.emptyDesc, { color: c.textSecondary }]}>
              Try searching for "{query}" differently
            </Text>
          </View>
        ) : (
          <View>
            <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
              {results.length} result{results.length !== 1 ? "s" : ""} for "{query}"
            </Text>
            {results.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </View>
        )}
      </ScrollView>
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
  title: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    marginBottom: 12,
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
  sectionLabel: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    marginBottom: 14,
  },
  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  suggestionText: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
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
  },
});
