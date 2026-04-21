import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Image,
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
import { useStore, type Product } from "@/context/StoreContext";

const SUGGESTIONS = ["Rice", "Dal", "Atta", "Milk", "Pencil", "Headphones", "Paracetamol", "Tea"];

function matchScore(product: Product, q: string): { score: number; matchedTags: string[] } {
  const ql = q.toLowerCase();
  let score = 0;
  const matchedTags: string[] = [];
  if (product.name.toLowerCase().includes(ql)) score += 5;
  if (product.category.toLowerCase().includes(ql)) score += 2;
  if (product.description.toLowerCase().includes(ql)) score += 1;
  if (product.tags) {
    for (const t of product.tags) {
      if (t.toLowerCase().includes(ql)) {
        score += 3;
        matchedTags.push(t);
      }
    }
  }
  return { score, matchedTags };
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const insets = useSafeAreaInsets();
  const c = Colors.light;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { products, sellerStore } = useStore();

  const productResults = useMemo(() => {
    if (!query.trim()) return [];
    return products
      .map((p) => ({ product: p, ...matchScore(p, query) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [query, products]);

  const storeResults = useMemo(() => {
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

  const hasResults = productResults.length > 0 || storeResults.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={[styles.header, { backgroundColor: c.card, paddingTop: topPad + 8 }]}>
        <Text style={[styles.title, { color: c.text }]}>Search</Text>
        <View style={[styles.searchBar, { backgroundColor: c.inputBg, borderColor: c.border }]}>
          <Feather name="search" size={16} color={c.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            placeholder="Search rice, dal, products, stores..."
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
        ) : !hasResults ? (
          <View style={styles.emptyContainer}>
            <Feather name="search" size={48} color={c.border} />
            <Text style={[styles.emptyTitle, { color: c.text }]}>No results found</Text>
            <Text style={[styles.emptyDesc, { color: c.textSecondary }]}>
              Try a different keyword for "{query}"
            </Text>
          </View>
        ) : (
          <View>
            {productResults.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
                  Products ({productResults.length})
                </Text>
                {productResults.map(({ product, matchedTags }) => (
                  <View key={product.id} style={[styles.productCard, { backgroundColor: c.card }]}>
                    {product.imageUri ? (
                      <Image source={{ uri: product.imageUri }} style={styles.productImg} />
                    ) : (
                      <View style={[styles.productImg, { backgroundColor: "#FFF0F1", alignItems: "center", justifyContent: "center" }]}>
                        <Feather name="package" size={22} color={c.primary} />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.productName, { color: c.text }]} numberOfLines={1}>
                        {product.name}
                      </Text>
                      <Text style={[styles.productMeta, { color: c.primary }]} numberOfLines={1}>
                        {product.category}
                        {sellerStore ? ` • ${sellerStore.name}` : ""}
                      </Text>
                      {product.description ? (
                        <Text style={[styles.productDesc, { color: c.textSecondary }]} numberOfLines={2}>
                          {product.description}
                        </Text>
                      ) : null}
                      {product.tags && product.tags.length > 0 && (
                        <View style={styles.tagRow}>
                          {product.tags.slice(0, 6).map((tag) => {
                            const isMatch = matchedTags.includes(tag);
                            return (
                              <View
                                key={tag}
                                style={[
                                  styles.tag,
                                  isMatch
                                    ? { backgroundColor: c.primary, borderColor: c.primary }
                                    : { backgroundColor: c.inputBg, borderColor: c.border },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.tagText,
                                    { color: isMatch ? "#fff" : c.textMuted },
                                  ]}
                                >
                                  {tag}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {storeResults.length > 0 && (
              <View>
                <Text style={[styles.sectionLabel, { color: c.textSecondary, marginTop: productResults.length > 0 ? 16 : 0 }]}>
                  Stores ({storeResults.length})
                </Text>
                {storeResults.map((store) => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </View>
            )}
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
  productCard: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  productImg: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  productName: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  productMeta: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    marginTop: 1,
  },
  productDesc: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    marginTop: 4,
    lineHeight: 16,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
  },
});
