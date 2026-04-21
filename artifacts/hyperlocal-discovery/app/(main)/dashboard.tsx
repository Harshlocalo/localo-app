import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Linking,
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
import { useInquiries } from "@/context/InquiryContext";
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
  tags: string[];
  imageUri?: string;
}

const TAG_DICTIONARY: Record<string, string[]> = {
  rice: ["chawal", "anaaj", "grain", "staple", "basmati", "kitchen-essential"],
  basmati: ["rice", "chawal", "long-grain", "aromatic", "premium"],
  dal: ["lentil", "pulses", "protein", "vegetarian", "indian-cooking"],
  toor: ["arhar", "dal", "lentil", "protein"],
  moong: ["dal", "green-lentil", "protein", "healthy"],
  chana: ["chickpea", "kabuli", "protein", "high-fiber"],
  rajma: ["kidney-beans", "protein", "north-indian"],
  atta: ["wheat-flour", "flour", "roti", "chapati", "staple"],
  maida: ["refined-flour", "baking", "flour"],
  sugar: ["sweetener", "cheeni", "kitchen-essential"],
  oil: ["cooking-oil", "tel", "kitchen-essential"],
  ghee: ["clarified-butter", "dairy", "indian-cooking"],
  milk: ["dairy", "doodh", "fresh", "calcium"],
  paneer: ["cottage-cheese", "dairy", "protein", "vegetarian"],
  curd: ["dahi", "yogurt", "dairy", "probiotic"],
  bread: ["bakery", "loaf", "breakfast"],
  egg: ["protein", "anda", "fresh", "breakfast"],
  tea: ["chai", "beverage", "morning", "loose-tea"],
  coffee: ["beverage", "caffeine", "morning"],
  spice: ["masala", "seasoning", "indian-cooking"],
  masala: ["spice-mix", "seasoning", "indian-flavors"],
  haldi: ["turmeric", "spice", "ayurvedic"],
  jeera: ["cumin", "spice", "tempering"],
  salt: ["namak", "seasoning", "kitchen-essential"],
  onion: ["pyaaz", "vegetable", "fresh"],
  potato: ["aloo", "vegetable", "fresh"],
  tomato: ["tamatar", "vegetable", "fresh"],
  vegetable: ["sabzi", "fresh", "produce", "healthy"],
  fruit: ["fresh", "produce", "vitamins", "healthy"],
  snack: ["munchies", "ready-to-eat", "tea-time"],
  biscuit: ["snack", "tea-time", "bakery"],
  soap: ["bath", "personal-care", "hygiene"],
  shampoo: ["hair-care", "personal-care", "bath"],
  detergent: ["laundry", "cleaning", "household"],
};

function generateTags(name: string, category: string): string[] {
  const words = name.toLowerCase().match(/[a-z]+/g) || [];
  const set = new Set<string>();
  words.forEach((w) => {
    if (w.length > 2) set.add(w);
    const matches = TAG_DICTIONARY[w];
    if (matches) matches.forEach((t) => set.add(t));
  });
  const cat = category.toLowerCase();
  if (cat) set.add(cat);
  if (cat === "grocery") set.add("daily-needs");
  if (cat === "stationery") set.add("school-supplies");
  if (cat === "electronics") set.add("gadgets");
  if (cat === "pharmacy") set.add("health");
  set.add("local-store");
  return Array.from(set).slice(0, 8);
}

function generateDescription(name: string, category: string): string {
  const n = name.trim();
  const c = category.trim() || "general";
  const lower = n.toLowerCase();
  const intros = [
    `Fresh, locally-sourced ${n}`,
    `Premium quality ${n}`,
    `Top-grade ${n}`,
    `High-quality ${n}`,
  ];
  const bodies: Record<string, string> = {
    rice: "long-grain, perfectly polished, ideal for daily meals, biryani, and pulao. Stored in moisture-free packaging.",
    dal: "rich in protein and fiber, hand-cleaned, free from impurities. Perfect for everyday Indian cooking.",
    atta: "stone-ground whole wheat flour, retains natural fiber and nutrients. Soft rotis guaranteed.",
    oil: "cold-pressed, light, and ideal for everyday cooking. No added preservatives.",
    milk: "farm-fresh, pasteurized, rich in calcium and protein. Best consumed within 2 days of purchase.",
    spice: "freshly ground, sun-dried, and packed to preserve aroma. Adds authentic Indian flavor.",
    snack: "crispy, crunchy, and perfectly seasoned. Great for tea time or quick hunger pangs.",
  };
  let body = `available at your local store. Perfect addition to your ${c.toLowerCase()} essentials. Hand-picked for quality and freshness.`;
  for (const key of Object.keys(bodies)) {
    if (lower.includes(key)) {
      body = bodies[key];
      break;
    }
  }
  const intro = intros[Math.floor(Math.random() * intros.length)];
  return `${intro} — ${body}`;
}

export default function DashboardScreen() {
  const { sellerStore, products, addProduct, updateProductQuantity } = useStore();
  const { pendingForSeller } = useInquiries();
  const insets = useSafeAreaInsets();
  const c = Colors.light;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [form, setForm] = useState<ProductForm>({ name: "", category: "", description: "", quantity: 1, tags: [], imageUri: undefined });
  const [scanning, setScanning] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<"scan" | "capture">("scan");
  const [capturing, setCapturing] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const scanAnim = useRef(new Animated.Value(0)).current;
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    };
  }, []);

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

  const ensureCameraPermission = async () => {
    let granted = permission?.granted ?? false;
    if (!granted) {
      const res = await requestPermission();
      granted = res.granted;
    }
    if (!granted) {
      Alert.alert(
        "Camera Permission Needed",
        "Please allow camera access to use the scanner.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    }
    return true;
  };

  const startScanAnimation = () => {
    scanAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  };

  const openScanCamera = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (!(await ensureCameraPermission())) return;
    setCameraMode("scan");
    setCameraOpen(true);
    setScanning(true);
    startScanAnimation();
    scanTimerRef.current = setTimeout(() => {
      const mockProduct = AI_PRODUCTS[Math.floor(Math.random() * AI_PRODUCTS.length)];
      const tags = generateTags(mockProduct.name, mockProduct.category);
      setForm({
        name: mockProduct.name,
        category: mockProduct.category,
        description: mockProduct.description,
        quantity: 1,
        tags,
        imageUri: undefined,
      });
      setScanning(false);
      setCameraOpen(false);
      scanAnim.stopAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 2500);
  };

  const openCaptureCamera = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (!(await ensureCameraPermission())) return;
    setCameraMode("capture");
    setCameraOpen(true);
    setScanning(false);
    startScanAnimation();
  };

  const handleShutter = async () => {
    if (capturing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCapturing(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.6, skipProcessing: true });
      const uri = photo?.uri;
      setCameraOpen(false);
      scanAnim.stopAnimation();
      if (uri) {
        setForm((f) => ({ ...f, imageUri: uri }));
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Capture Failed", "Could not take picture. Please try again.");
    } finally {
      setCapturing(false);
    }
  };

  const runAIGenerate = () => {
    if (!form.name.trim()) {
      Alert.alert("Enter a Name", "Please enter the product name first, then tap AI Generate.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAiThinking(true);
    setTimeout(() => {
      const tags = generateTags(form.name, form.category || "Grocery");
      const description = generateDescription(form.name, form.category || "Grocery");
      setForm((f) => ({
        ...f,
        category: f.category || "Grocery",
        description,
        tags,
      }));
      setAiThinking(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 900);
  };

  const removeTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  };

  const closeCamera = () => {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    scanAnim.stopAnimation();
    setScanning(false);
    setCameraOpen(false);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.category.trim()) {
      Alert.alert("Incomplete", "Please fill in product name and category.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    const finalTags = form.tags.length > 0 ? form.tags : generateTags(form.name, form.category);
    await addProduct({ ...form, tags: finalTags, storeId: sellerStore.id });
    setSaving(false);
    setForm({ name: "", category: "", description: "", quantity: 1, tags: [], imageUri: undefined });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Product Saved!", "Product has been added to your store.");
  };

  const scanLineTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180],
  });
  const fullScanLineY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 260],
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
        {pendingForSeller.length > 0 && (
          <TouchableOpacity
            style={[styles.inquiryBanner, { backgroundColor: "#E8F4FF", borderColor: "#1E90FF" }]}
            onPress={() => router.push("/(main)/inquiries")}
            activeOpacity={0.85}
          >
            <View style={[styles.inquiryIcon, { backgroundColor: "#1E90FF" }]}>
              <Feather name="mic" size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inquiryTitle, { color: "#0A4B8C" }]}>
                {pendingForSeller.length} new customer {pendingForSeller.length === 1 ? "voice inquiry" : "voice inquiries"}
              </Text>
              <Text style={[styles.inquirySub, { color: "#1A5F9C" }]} numberOfLines={1}>
                Tap to reply available / not available
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color="#1E90FF" />
          </TouchableOpacity>
        )}

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

          <View style={styles.dualBtnRow}>
            <TouchableOpacity
              style={[styles.dualBtn, { backgroundColor: "#1A1A1A" }]}
              onPress={openScanCamera}
              activeOpacity={0.85}
            >
              <View style={styles.dualIconWrap}>
                <Feather name="zap" size={20} color="#fff" />
              </View>
              <Text style={styles.dualBtnTitle}>AI Scan</Text>
              <Text style={styles.dualBtnSub}>Barcoded items</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dualBtn, { backgroundColor: c.primary }]}
              onPress={openCaptureCamera}
              activeOpacity={0.85}
            >
              <View style={styles.dualIconWrap}>
                <Feather name="camera" size={20} color="#fff" />
              </View>
              <Text style={styles.dualBtnTitle}>Manual Capture</Text>
              <Text style={styles.dualBtnSub}>Rice, dal, loose items</Text>
            </TouchableOpacity>
          </View>

          {form.imageUri && (
            <View style={styles.previewWrap}>
              <Image source={{ uri: form.imageUri }} style={styles.previewImage} resizeMode="cover" />
              <TouchableOpacity
                style={styles.previewClear}
                onPress={() => setForm((f) => ({ ...f, imageUri: undefined }))}
              >
                <Feather name="x" size={14} color="#fff" />
              </TouchableOpacity>
              <View style={styles.previewBadge}>
                <Feather name="check-circle" size={12} color="#fff" />
                <Text style={styles.previewBadgeText}>Photo captured</Text>
              </View>
            </View>
          )}

          <Modal visible={cameraOpen} animationType="slide" onRequestClose={closeCamera} statusBarTranslucent>
            <View style={styles.cameraScreen}>
              <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
              <View style={styles.cameraOverlay} pointerEvents="box-none">
                <View style={[styles.cameraTopBar, { paddingTop: topPad + 8 }]}>
                  <TouchableOpacity onPress={closeCamera} style={styles.cameraCloseBtn}>
                    <Feather name="x" size={22} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.cameraTitle}>
                    {cameraMode === "scan" ? "AI Product Scan" : "Capture Item Photo"}
                  </Text>
                  <View style={{ width: 40 }} />
                </View>

                <View style={styles.cameraCenter}>
                  <View style={styles.bigScannerFrame}>
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />
                    <Animated.View
                      style={[styles.scanLine, { transform: [{ translateY: fullScanLineY }] }]}
                    />
                  </View>
                  <Text style={styles.cameraHint}>
                    {cameraMode === "scan"
                      ? scanning
                        ? "Analyzing product..."
                        : "Point camera at product"
                      : "Frame the item, then tap shutter"}
                  </Text>
                  {scanning && cameraMode === "scan" && (
                    <ActivityIndicator color="#fff" style={{ marginTop: 12 }} />
                  )}
                </View>

                <View style={[styles.cameraFooter, { paddingBottom: bottomPad + 24 }]}>
                  {cameraMode === "capture" ? (
                    <TouchableOpacity
                      style={styles.shutterBtn}
                      onPress={handleShutter}
                      disabled={capturing}
                      activeOpacity={0.85}
                    >
                      {capturing ? (
                        <ActivityIndicator color="#1A1A1A" />
                      ) : (
                        <View style={styles.shutterInner} />
                      )}
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.cameraFooterText}>
                      AI will auto-fill product details
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </Modal>

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
                  style={[styles.input, { color: c.text, flex: 1 }]}
                  placeholder="e.g. Sona Masuri Rice"
                  placeholderTextColor={c.textMuted}
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.aiGenBtn, { borderColor: c.primary, opacity: aiThinking ? 0.7 : 1 }]}
              onPress={runAIGenerate}
              disabled={aiThinking}
              activeOpacity={0.85}
            >
              {aiThinking ? (
                <ActivityIndicator color={c.primary} size="small" />
              ) : (
                <Feather name="cpu" size={16} color={c.primary} />
              )}
              <Text style={[styles.aiGenText, { color: c.primary }]}>
                {aiThinking ? "AI is thinking..." : "AI Generate Description & Tags"}
              </Text>
            </TouchableOpacity>

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
            {form.tags.length > 0 && (
              <View>
                <Text style={[styles.fieldLabel, { color: c.textSecondary }]}>
                  Search Tags ({form.tags.length})
                </Text>
                <Text style={[styles.tagHint, { color: c.textMuted }]}>
                  These help shoppers find your product
                </Text>
                <View style={styles.tagsWrap}>
                  {form.tags.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[styles.tagChip, { backgroundColor: "#FFF0F1", borderColor: c.primary }]}
                      onPress={() => removeTag(tag)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tagChipText, { color: c.primary }]}>{tag}</Text>
                      <Feather name="x" size={11} color={c.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

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
            {(() => {
              const outCount = products.filter((p) => p.quantity === 0).length;
              const lowCount = products.filter((p) => p.quantity > 0 && p.quantity <= 5).length;
              if (outCount === 0 && lowCount === 0) return null;
              return (
                <TouchableOpacity
                  style={[styles.stockAlertBanner, { backgroundColor: outCount > 0 ? "#FFE9EB" : "#FFF8E7", borderColor: outCount > 0 ? c.primary : "#F39C12" }]}
                  onPress={() => router.push("/(main)/inventory")}
                  activeOpacity={0.85}
                >
                  <Feather
                    name={outCount > 0 ? "alert-octagon" : "alert-triangle"}
                    size={18}
                    color={outCount > 0 ? c.primary : "#F39C12"}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.stockAlertTitle, { color: outCount > 0 ? c.primary : "#9A5B00" }]}>
                      {outCount > 0
                        ? `${outCount} item${outCount !== 1 ? "s" : ""} out of stock`
                        : `${lowCount} item${lowCount !== 1 ? "s" : ""} running low`}
                    </Text>
                    <Text style={[styles.stockAlertSub, { color: outCount > 0 ? "#7B2D34" : "#9A5B00" }]} numberOfLines={1}>
                      Tap to manage and restock
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={outCount > 0 ? c.primary : "#9A5B00"} />
                </TouchableOpacity>
              );
            })()}

            <View style={styles.inventoryHeader}>
              <Text style={[styles.inventoryTitle, { color: c.text }]}>
                Inventory ({products.length})
              </Text>
              <TouchableOpacity
                style={[styles.galleryBtn, { backgroundColor: c.primary }]}
                onPress={() => router.push("/(main)/inventory")}
                activeOpacity={0.85}
              >
                <Feather name="grid" size={14} color="#fff" />
                <Text style={styles.galleryBtnText}>Gallery View</Text>
              </TouchableOpacity>
            </View>
            {products.map((product) => (
              <View key={product.id} style={[styles.productItem, { backgroundColor: c.card }]}>
                {product.imageUri ? (
                  <Image source={{ uri: product.imageUri }} style={styles.productThumb} />
                ) : (
                  <View style={[styles.productThumb, { backgroundColor: "#FFF0F1", alignItems: "center", justifyContent: "center" }]}>
                    <Feather name="package" size={18} color={c.primary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.productName, { color: c.text }]} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={[styles.productCat, { color: c.primary }]}>{product.category}</Text>
                  {product.tags && product.tags.length > 0 && (
                    <View style={styles.miniTagsRow}>
                      {product.tags.slice(0, 3).map((t) => (
                        <Text key={t} style={[styles.miniTag, { color: c.textMuted, backgroundColor: c.inputBg }]}>
                          {t}
                        </Text>
                      ))}
                    </View>
                  )}
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
  cameraScreen: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  cameraTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  cameraCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraTitle: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  cameraCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  bigScannerFrame: {
    width: 280,
    height: 280,
    position: "relative",
    overflow: "hidden",
  },
  cameraHint: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
    marginTop: 24,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  cameraFooter: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  cameraFooterText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
  },
  shutterBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderWidth: 4,
    borderColor: "#fff",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
  },
  dualBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  dualBtn: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  dualIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  dualBtnTitle: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  dualBtnSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
  },
  previewWrap: {
    position: "relative",
    width: "100%",
    height: 160,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 14,
    backgroundColor: "#000",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewClear: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  previewBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
  },
  aiGenBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    backgroundColor: "#FFF8F8",
  },
  aiGenText: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  tagHint: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    marginBottom: 8,
    marginTop: -4,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  tagChipText: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
  },
  productThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 10,
  },
  miniTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  miniTag: {
    fontSize: 9,
    fontFamily: "Poppins_500Medium",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stockAlertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  stockAlertTitle: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  stockAlertSub: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    marginTop: 1,
  },
  inventoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  galleryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  galleryBtnText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },
  inquiryBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  inquiryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  inquiryTitle: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  inquirySub: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    marginTop: 1,
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
