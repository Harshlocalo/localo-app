import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import { useStore } from "@/context/StoreContext";

const AI_PRODUCTS = [
  { name: "Apsara Pencil (Pack of 10)", category: "Stationery", description: "Premium HB grade graphite pencils, smooth writing, ideal for school and office use. FSC certified wood." },
  { name: "Amul Toned Milk 500ml", category: "Grocery", description: "Fresh pasteurized toned milk with 3% fat. Rich in calcium and protein. Best consumed within 2 days." },
  { name: "Boat Rockerz 450 Headphones", category: "Electronics", description: "Wireless Bluetooth 5.0 headphones with 70hr playback, 40mm drivers, soft ear cushions, foldable design." },
  { name: "Dolo 650 (Paracetamol)", category: "Pharmacy", description: "Paracetamol 650mg tablets for fever and mild to moderate pain relief. Pack of 15 tablets." },
  { name: "Classmate Ruled Notebook A4", category: "Stationery", description: "180 pages single line ruled notebook, acid-free paper, durable cover. Ideal for students." },
  { name: "Nataraj Ball Pen Blue (10-pack)", category: "Stationery", description: "Smooth writing ball pen with waterproof ink, ergonomic grip, 1.0mm tip." },
];

interface ProductForm {
  name: string;
  category: string;
  description: string;
  quantity: number;
}

export default function DashboardScreen() {
  const { sellerStore, products, addProduct, updateProductQuantity } = useStore();
  const insets = useSafeAreaInsets();
  const c = Colors.light;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [form, setForm] = useState<ProductForm>({ name: "", category: "", description: "", quantity: 1 });
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const scanAnim = useRef(new Animated.Value(0)).current;

  if (!sellerStore) {
    return (
      <View style={[styles.noStore, { paddingTop: topPad }]}>
        <Feather name="store" size={60} color={c.border} />
        <Text style={[styles.noStoreTitle, { color: c.text }]}>No Store Yet</Text>
        <Text style={[styles.noStoreDesc, { color: c.textSecondary }]}>
          Register your store to access the seller dashboard
        </Text>
        <TouchableOpacity
          style={[styles.registerBtn, { backgroundColor: c.primary }]}
          onPress={() => router.push("/(main)/store-form")}
        >
          <Text style={styles.registerBtnText}>Register Store</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const startAIScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setScanning(true);
    scanAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    setTimeout(() => {
      const mockProduct = AI_PRODUCTS[Math.floor(Math.random() * AI_PRODUCTS.length)];
      setForm({ name: mockProduct.name, category: mockProduct.category, description: mockProduct.description, quantity: 1 });
      setScanning(false);
      scanAnim.stopAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2000);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.category.trim()) {
      Alert.alert("Incomplete", "Please fill in product name and category.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    await addProduct({ ...form, storeId: sellerStore.id });
    setSaving(false);
    setForm({ name: "", category: "", description: "", quantity: 1 });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Product Saved!", "Product has been added to your store.");
  };

  const scanLineTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180],
  });

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={[styles.header, { backgroundColor: c.card, paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={c.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.headerTitle, { color: c.text }]}>Seller Dashboard</Text>
          <Text style={[styles.headerSub, { color: c.primary }]} numberOfLines={1}>
            {sellerStore.name}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 30 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: "#FFF0F1" }]}>
            <Text style={[styles.statNumber, { color: c.primary }]}>{products.length}</Text>
            <Text style={[styles.statLabel, { color: c.textSecondary }]}>Products</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#F0FFF6" }]}>
            <Text style={[styles.statNumber, { color: "#2ECC71" }]}>
              {products.reduce((a, p) => a + p.quantity, 0)}
            </Text>
            <Text style={[styles.statLabel, { color: c.textSecondary }]}>Total Stock</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#FFF8E7" }]}>
            <Text style={[styles.statNumber, { color: "#F39C12" }]}>Active</Text>
            <Text style={[styles.statLabel, { color: c.textSecondary }]}>Status</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: c.card }]}>
          <Text style={[styles.cardTitle, { color: c.text }]}>Add Product</Text>
          <Text style={[styles.cardSub, { color: c.textSecondary }]}>
            Use AI scan or enter manually
          </Text>

          <TouchableOpacity
            style={[styles.scanBtn, { backgroundColor: scanning ? "#333" : "#1A1A1A" }]}
            onPress={startAIScan}
            disabled={scanning}
            activeOpacity={0.85}
          >
            {scanning ? (
              <View style={styles.scannerView}>
                <View style={styles.scannerFrame}>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                  <Animated.View
                    style={[styles.scanLine, { transform: [{ translateY: scanLineTranslateY }] }]}
                  />
                </View>
                <Text style={styles.scannerLabel}>Scanning product...</Text>
              </View>
            ) : (
              <View style={styles.scanBtnContent}>
                <View style={styles.cameraIconWrap}>
                  <Feather name="camera" size={26} color="#fff" />
                </View>
                <Text style={styles.scanBtnTitle}>Scan Product (AI)</Text>
                <Text style={styles.scanBtnSub}>Auto-fill details from camera</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
            <Text style={[styles.dividerText, { color: c.textMuted }]}>or enter manually</Text>
            <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
          </View>

          <View style={{ gap: 12 }}>
            <View>
              <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Product Name</Text>
              <View style={[styles.inputWrapper, { backgroundColor: c.inputBg, borderColor: c.border }]}>
                <TextInput
                  style={[styles.input, { color: c.text }]}
                  placeholder="e.g. Apsara Pencil"
                  placeholderTextColor={c.textMuted}
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                />
              </View>
            </View>
            <View>
              <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Category</Text>
              <View style={[styles.inputWrapper, { backgroundColor: c.inputBg, borderColor: c.border }]}>
                <TextInput
                  style={[styles.input, { color: c.text }]}
                  placeholder="e.g. Stationery"
                  placeholderTextColor={c.textMuted}
                  value={form.category}
                  onChangeText={(v) => setForm((f) => ({ ...f, category: v }))}
                />
              </View>
            </View>
            <View>
              <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Description</Text>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: c.inputBg, borderColor: c.border, height: 90, alignItems: "flex-start", paddingTop: 12 },
                ]}
              >
                <TextInput
                  style={[styles.input, { color: c.text, height: 70 }]}
                  placeholder="Product description..."
                  placeholderTextColor={c.textMuted}
                  multiline
                  value={form.description}
                  onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                />
              </View>
            </View>
            <View>
              <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>Stock Quantity</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={[styles.qtyBtn, { borderColor: c.border }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setForm((f) => ({ ...f, quantity: Math.max(0, f.quantity - 1) }));
                  }}
                >
                  <Feather name="minus" size={18} color={c.text} />
                </TouchableOpacity>
                <View style={[styles.qtyDisplay, { backgroundColor: c.inputBg, borderColor: c.border }]}>
                  <Text style={[styles.qtyNumber, { color: c.text }]}>{form.quantity}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.qtyBtn, { backgroundColor: c.primary, borderColor: c.primary }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setForm((f) => ({ ...f, quantity: f.quantity + 1 }));
                  }}
                >
                  <Feather name="plus" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: c.primary, opacity: saving ? 0.75 : 1 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="save" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Save Product</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {products.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.inventoryTitle, { color: c.text }]}>
              Inventory ({products.length})
            </Text>
            {products.map((product) => (
              <View key={product.id} style={[styles.productItem, { backgroundColor: c.card }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.productName, { color: c.text }]} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={[styles.productCat, { color: c.primary }]}>{product.category}</Text>
                </View>
                <View style={styles.productQtyRow}>
                  <TouchableOpacity
                    style={[styles.smallQtyBtn, { borderColor: c.border }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      updateProductQuantity(product.id, -1);
                    }}
                  >
                    <Feather name="minus" size={12} color={c.text} />
                  </TouchableOpacity>
                  <Text style={[styles.productQty, { color: c.text }]}>{product.quantity}</Text>
                  <TouchableOpacity
                    style={[styles.smallQtyBtn, { backgroundColor: c.primary, borderColor: c.primary }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      updateProductQuantity(product.id, 1);
                    }}
                  >
                    <Feather name="plus" size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  noStore: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 40,
  },
  noStoreTitle: {
    fontSize: 22,
    fontFamily: "Poppins_600SemiBold",
  },
  noStoreDesc: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  registerBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  registerBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
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
    textAlign: "center",
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
  },
  card: {
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    marginBottom: 16,
  },
  scanBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    minHeight: 120,
  },
  scanBtnContent: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  cameraIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  scanBtnTitle: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  scanBtnSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
  scannerView: {
    padding: 20,
    alignItems: "center",
    gap: 16,
  },
  scannerFrame: {
    width: 200,
    height: 200,
    position: "relative",
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
    borderColor: "#E23744",
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#E23744",
    shadowColor: "#E23744",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  scannerLabel: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    marginBottom: 8,
  },
  inputWrapper: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 50,
    justifyContent: "center",
  },
  input: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qtyBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyDisplay: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyNumber: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 54,
    borderRadius: 14,
    marginTop: 20,
    shadowColor: "#E23744",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  inventoryTitle: {
    fontSize: 17,
    fontFamily: "Poppins_600SemiBold",
    marginBottom: 12,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  productName: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },
  productCat: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    marginTop: 2,
  },
  productQtyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  smallQtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  productQty: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    minWidth: 24,
    textAlign: "center",
  },
});
