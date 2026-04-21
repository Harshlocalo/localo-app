import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
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

import StoreCard from "@/components/StoreCard";
import Colors from "@/constants/colors";
import { STORES, type Store } from "@/data/stores";
import { useAuth } from "@/context/AuthContext";
import { useInquiries } from "@/context/InquiryContext";
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
  const [askProduct, setAskProduct] = useState<Product | null>(null);
  const insets = useSafeAreaInsets();
  const c = Colors.light;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { products, sellerStore } = useStore();
  const { user } = useAuth();
  const { createInquiry, unreadResponses, myInquiries } = useInquiries();

  const sendInquiry = async (product: Product, store: Store | { id: string; name: string }) => {
    if (!user?.name) {
      Alert.alert("Sign in required", "Please sign in to ask shopkeepers about products.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await createInquiry({
      productName: product.name,
      storeId: store.id,
      storeName: store.name,
      customerName: user.name,
    });
    setAskProduct(null);
    Alert.alert(
      "Voice message sent!",
      `${store.name} has been notified. You'll get a reply within a few minutes — check your Inquiries.`,
      [
        { text: "OK", style: "cancel" },
        { text: "View Inquiries", onPress: () => router.push("/(main)/inquiries") },
      ]
    );
  };

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
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: c.text }]}>Search</Text>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => router.push("/(main)/inquiries")}
            activeOpacity={0.7}
          >
            <Feather name="bell" size={20} color={c.text} />
            {unreadResponses > 0 && (
              <View style={[styles.bellBadge, { backgroundColor: c.primary }]}>
                <Text style={styles.bellBadgeText}>{unreadResponses > 9 ? "9+" : unreadResponses}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
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
                {productResults.map(({ product, matchedTags }) => {
                  const recentlyAsked = myInquiries.find(
                    (i) => i.productName === product.name && Date.now() - i.createdAt < 10 * 60 * 1000
                  );
                  return (
                    <View key={product.id} style={[styles.productCard, { backgroundColor: c.card }]}>
                      <View style={{ flexDirection: "row", gap: 12 }}>
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
                      <TouchableOpacity
                        style={[
                          styles.askBtn,
                          { backgroundColor: recentlyAsked ? c.inputBg : c.primary },
                        ]}
                        onPress={() => {
                          if (recentlyAsked) {
                            router.push("/(main)/inquiries");
                          } else {
                            setAskProduct(product);
                          }
                        }}
                        activeOpacity={0.85}
                      >
                        <Feather
                          name={recentlyAsked ? "clock" : "mic"}
                          size={14}
                          color={recentlyAsked ? c.textSecondary : "#fff"}
                        />
                        <Text
                          style={[
                            styles.askBtnText,
                            { color: recentlyAsked ? c.textSecondary : "#fff" },
                          ]}
                        >
                          {recentlyAsked
                            ? `Sent — ${recentlyAsked.status === "pending" ? "awaiting reply" : "view reply"}`
                            : "Ask shopkeeper if available (voice)"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
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

      <Modal
        visible={!!askProduct}
        animationType="slide"
        transparent
        onRequestClose={() => setAskProduct(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: c.card, paddingBottom: bottomPad + 20 }]}>
            <View style={styles.modalHandle} />
            <View style={{ paddingHorizontal: 18, paddingTop: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <Text style={[styles.modalTitle, { color: c.text }]}>Ask which store?</Text>
                <TouchableOpacity onPress={() => setAskProduct(null)} style={styles.modalClose}>
                  <Feather name="x" size={18} color={c.text} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.modalSub, { color: c.textSecondary }]}>
                A voice message will be sent to the shopkeeper asking if {askProduct?.name} is available.
              </Text>
            </View>
            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ padding: 18, paddingTop: 14 }}>
              {sellerStore && askProduct?.storeId === sellerStore.id && (
                <TouchableOpacity
                  style={[styles.storePick, { backgroundColor: c.inputBg }]}
                  onPress={() => askProduct && sendInquiry(askProduct, sellerStore)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.storeIcon, { backgroundColor: c.primary }]}>
                    <Feather name="shopping-bag" size={18} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.storeName, { color: c.text }]} numberOfLines={1}>
                      {sellerStore.name}
                    </Text>
                    <Text style={[styles.storeArea, { color: c.textSecondary }]} numberOfLines={1}>
                      {sellerStore.address}
                    </Text>
                  </View>
                  <Feather name="mic" size={18} color={c.primary} />
                </TouchableOpacity>
              )}
              {STORES.slice(0, 8).map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.storePick, { backgroundColor: c.inputBg }]}
                  onPress={() => askProduct && sendInquiry(askProduct, s)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.storeIcon, { backgroundColor: c.primary }]}>
                    <Feather name="shopping-bag" size={18} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.storeName, { color: c.text }]} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Text style={[styles.storeArea, { color: c.textSecondary }]} numberOfLines={1}>
                      {s.area} • {s.category}
                    </Text>
                  </View>
                  <Feather name="mic" size={18} color={c.primary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F4F4F4",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontFamily: "Poppins_700Bold",
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
  askBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 12,
  },
  askBtnText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    overflow: "hidden",
  },
  modalHandle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D5D5D5",
    marginTop: 8,
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  modalSub: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    marginTop: 4,
    lineHeight: 17,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  storePick: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  storeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  storeName: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  storeArea: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    marginTop: 1,
  },
});
