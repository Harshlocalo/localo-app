import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
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

import Colors from "@/constants/colors";
import { useStore, type Product } from "@/context/StoreContext";

const LOW_STOCK_THRESHOLD = 5;

type FilterMode = "all" | "out" | "low";

export default function InventoryScreen() {
  const c = Colors.light;
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { products, sellerStore, updateProductQuantity } = useStore();
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);

  const screenWidth = Dimensions.get("window").width;
  const cardWidth = (screenWidth - 16 * 3) / 2;

  const outOfStock = useMemo(() => products.filter((p) => p.quantity === 0), [products]);
  const lowStock = useMemo(
    () => products.filter((p) => p.quantity > 0 && p.quantity <= LOW_STOCK_THRESHOLD),
    [products]
  );

  const filtered = useMemo(() => {
    let list = products;
    if (filter === "out") list = outOfStock;
    if (filter === "low") list = lowStock;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    return list;
  }, [products, filter, search, outOfStock, lowStock]);

  const restock = (product: Product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateProductQuantity(product.id, 10);
    Alert.alert("Restocked", `${product.name} restocked to ${product.quantity + 10} units.`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={[styles.header, { backgroundColor: c.card, paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={22} color={c.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.text }]}>Inventory Gallery</Text>
          <Text style={[styles.subTitle, { color: c.textSecondary }]} numberOfLines={1}>
            {sellerStore?.name || "Your Store"} • {products.length} items
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {(outOfStock.length > 0 || lowStock.length > 0) && (
        <View style={styles.alertsWrap}>
          {outOfStock.length > 0 && (
            <View style={[styles.alertBanner, { backgroundColor: "#FFE9EB", borderColor: c.primary }]}>
              <Feather name="alert-octagon" size={18} color={c.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.alertTitle, { color: c.primary }]}>
                  {outOfStock.length} item{outOfStock.length !== 1 ? "s" : ""} out of stock
                </Text>
                <Text style={[styles.alertSub, { color: "#7B2D34" }]} numberOfLines={1}>
                  Restock to keep your store visible to shoppers
                </Text>
              </View>
              <TouchableOpacity onPress={() => setFilter("out")}>
                <Text style={[styles.alertAction, { color: c.primary }]}>View</Text>
              </TouchableOpacity>
            </View>
          )}
          {lowStock.length > 0 && (
            <View style={[styles.alertBanner, { backgroundColor: "#FFF8E7", borderColor: "#F39C12" }]}>
              <Feather name="alert-triangle" size={18} color="#F39C12" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.alertTitle, { color: "#9A5B00" }]}>
                  {lowStock.length} item{lowStock.length !== 1 ? "s" : ""} running low
                </Text>
                <Text style={[styles.alertSub, { color: "#9A5B00" }]} numberOfLines={1}>
                  Less than {LOW_STOCK_THRESHOLD + 1} units remaining
                </Text>
              </View>
              <TouchableOpacity onPress={() => setFilter("low")}>
                <Text style={[styles.alertAction, { color: "#9A5B00" }]}>View</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      <View style={styles.controlsRow}>
        <View style={[styles.searchBar, { backgroundColor: c.inputBg, borderColor: c.border }]}>
          <Feather name="search" size={14} color={c.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            placeholder="Search inventory..."
            placeholderTextColor={c.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={14} color={c.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterRow}>
        {(
          [
            { key: "all" as FilterMode, label: "All", count: products.length },
            { key: "out" as FilterMode, label: "Out of Stock", count: outOfStock.length },
            { key: "low" as FilterMode, label: "Low Stock", count: lowStock.length },
          ]
        ).map((tab) => {
          const active = filter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? c.primary : c.card,
                  borderColor: active ? c.primary : c.border,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setFilter(tab.key);
              }}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: active ? "#fff" : c.text },
                ]}
              >
                {tab.label} ({tab.count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 30 }}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Feather name="inbox" size={56} color={c.border} />
            <Text style={[styles.emptyTitle, { color: c.text }]}>
              {filter === "out"
                ? "No out-of-stock items"
                : filter === "low"
                ? "No low-stock items"
                : "No products yet"}
            </Text>
            <Text style={[styles.emptyDesc, { color: c.textSecondary }]}>
              {filter === "all"
                ? "Add your first product from the dashboard"
                : "Great — your stock levels look healthy!"}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((product) => {
              const isOut = product.quantity === 0;
              const isLow = !isOut && product.quantity <= LOW_STOCK_THRESHOLD;
              return (
                <TouchableOpacity
                  key={product.id}
                  style={[
                    styles.card,
                    {
                      width: cardWidth,
                      backgroundColor: c.card,
                      borderColor: isOut ? c.primary : isLow ? "#F39C12" : "transparent",
                      borderWidth: isOut || isLow ? 1.5 : 0,
                    },
                  ]}
                  onPress={() => setSelected(product)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cardImageWrap}>
                    {product.imageUri ? (
                      <Image source={{ uri: product.imageUri }} style={styles.cardImage} />
                    ) : (
                      <View style={[styles.cardImage, styles.cardImagePlaceholder, { backgroundColor: "#FFF0F1" }]}>
                        <Feather name="package" size={34} color={c.primary} />
                      </View>
                    )}
                    {isOut && (
                      <View style={[styles.statusOverlay, { backgroundColor: "rgba(226,55,68,0.85)" }]}>
                        <Feather name="alert-octagon" size={20} color="#fff" />
                        <Text style={styles.statusOverlayText}>OUT OF STOCK</Text>
                      </View>
                    )}
                    {isLow && (
                      <View style={[styles.lowBadge, { backgroundColor: "#F39C12" }]}>
                        <Feather name="alert-triangle" size={10} color="#fff" />
                        <Text style={styles.lowBadgeText}>Low</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={[styles.cardName, { color: c.text }]} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text style={[styles.cardCat, { color: c.primary }]} numberOfLines={1}>
                      {product.category}
                    </Text>
                    <View style={styles.cardFooter}>
                      <View style={styles.qtyPill}>
                        <Feather
                          name="box"
                          size={11}
                          color={isOut ? c.primary : c.textSecondary}
                        />
                        <Text
                          style={[
                            styles.qtyPillText,
                            { color: isOut ? c.primary : c.text },
                          ]}
                        >
                          {product.quantity} {product.quantity === 1 ? "unit" : "units"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={!!selected}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: c.card, paddingBottom: bottomPad + 20 }]}>
            <View style={styles.modalHandle} />
            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {selected.imageUri ? (
                  <Image source={{ uri: selected.imageUri }} style={styles.modalImage} />
                ) : (
                  <View style={[styles.modalImage, { backgroundColor: "#FFF0F1", alignItems: "center", justifyContent: "center" }]}>
                    <Feather name="package" size={56} color={c.primary} />
                  </View>
                )}
                <View style={{ padding: 18 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={[styles.modalTitle, { color: c.text, flex: 1 }]} numberOfLines={2}>
                      {selected.name}
                    </Text>
                    <TouchableOpacity onPress={() => setSelected(null)} style={styles.modalClose}>
                      <Feather name="x" size={18} color={c.text} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.modalCat, { color: c.primary }]}>{selected.category}</Text>

                  {selected.quantity === 0 && (
                    <View style={[styles.modalAlert, { backgroundColor: "#FFE9EB" }]}>
                      <Feather name="alert-octagon" size={16} color={c.primary} />
                      <Text style={[styles.modalAlertText, { color: c.primary }]}>
                        Out of stock — restock now to stay visible
                      </Text>
                    </View>
                  )}

                  {selected.description ? (
                    <Text style={[styles.modalDesc, { color: c.textSecondary }]}>
                      {selected.description}
                    </Text>
                  ) : null}

                  {selected.tags && selected.tags.length > 0 && (
                    <View style={{ marginTop: 12 }}>
                      <Text style={[styles.modalSection, { color: c.textSecondary }]}>Search Tags</Text>
                      <View style={styles.modalTagsWrap}>
                        {selected.tags.map((t) => (
                          <View key={t} style={[styles.modalTag, { backgroundColor: c.inputBg }]}>
                            <Text style={[styles.modalTagText, { color: c.text }]}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  <Text style={[styles.modalSection, { color: c.textSecondary, marginTop: 18 }]}>
                    Stock Management
                  </Text>
                  <View style={styles.stockRow}>
                    <TouchableOpacity
                      style={[styles.stockBtn, { borderColor: c.border }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        updateProductQuantity(selected.id, -1);
                      }}
                    >
                      <Feather name="minus" size={18} color={c.text} />
                    </TouchableOpacity>
                    <View style={[styles.stockDisplay, { backgroundColor: c.inputBg }]}>
                      <Text style={[styles.stockNumber, { color: c.text }]}>{selected.quantity}</Text>
                      <Text style={[styles.stockLabel, { color: c.textMuted }]}>in stock</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.stockBtn, { backgroundColor: c.primary, borderColor: c.primary }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        updateProductQuantity(selected.id, 1);
                      }}
                    >
                      <Feather name="plus" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.restockBtn, { backgroundColor: c.primary }]}
                    onPress={() => restock(selected)}
                    activeOpacity={0.85}
                  >
                    <Feather name="refresh-cw" size={16} color="#fff" />
                    <Text style={styles.restockBtnText}>Quick Restock (+10)</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 14,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 17,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },
  subTitle: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    marginTop: 1,
  },
  alertsWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  alertSub: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    marginTop: 1,
  },
  alertAction: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  controlsRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    height: "100%",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  filterChipText: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardImageWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: 1,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  statusOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  statusOverlayText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.5,
  },
  lowBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  lowBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
  },
  cardBody: {
    padding: 10,
  },
  cardName: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  cardCat: {
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
    marginTop: 1,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  qtyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  qtyPillText: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },
  emptyWrap: {
    paddingTop: 60,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 6,
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    paddingHorizontal: 30,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
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
  modalImage: {
    width: "100%",
    height: 220,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  modalCat: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    marginTop: 2,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  modalAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  modalAlertText: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    flex: 1,
  },
  modalDesc: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    lineHeight: 19,
    marginTop: 12,
  },
  modalSection: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  modalTagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  modalTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  modalTagText: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stockBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  stockDisplay: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stockNumber: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },
  stockLabel: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    marginTop: -2,
  },
  restockBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 14,
  },
  restockBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
});
