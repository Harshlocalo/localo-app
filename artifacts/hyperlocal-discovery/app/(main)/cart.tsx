import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useCart } from "@/context/CartContext";

export default function CartScreen() {
  const { items, totalItems, totalPrice, updateQty, removeItem, clearCart } = useCart();
  const insets = useSafeAreaInsets();
  const c = Colors.light;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleCheckout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Order Placed!",
      `Your order of ₹${totalPrice.toFixed(2)} has been placed. Estimated delivery: 30 min`,
      [{ text: "OK", onPress: clearCart }]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={[styles.header, { backgroundColor: c.card, paddingTop: topPad + 8 }]}>
        <Text style={[styles.title, { color: c.text }]}>Your Cart</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={() => {
            Alert.alert("Clear Cart", "Remove all items?", [
              { text: "Cancel", style: "cancel" },
              { text: "Clear", style: "destructive", onPress: clearCart },
            ]);
          }}>
            <Text style={[styles.clearBtn, { color: c.primary }]}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="shopping-bag" size={64} color={c.border} />
          <Text style={[styles.emptyTitle, { color: c.text }]}>Your cart is empty</Text>
          <Text style={[styles.emptyDesc, { color: c.textSecondary }]}>
            Browse stores and add items to get started
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: bottomPad + 120 }}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item) => (
              <View key={item.id} style={[styles.itemCard, { backgroundColor: c.card }]}>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: c.text }]}>{item.name}</Text>
                  <Text style={[styles.itemStore, { color: c.textMuted }]}>{item.storeName}</Text>
                  <Text style={[styles.itemPrice, { color: c.primary }]}>
                    ₹{item.price.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { borderColor: c.border }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      updateQty(item.id, -1);
                    }}
                  >
                    <Feather name="minus" size={14} color={c.text} />
                  </TouchableOpacity>
                  <Text style={[styles.qtyText, { color: c.text }]}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { backgroundColor: c.primary, borderColor: c.primary }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      updateQty(item.id, 1);
                    }}
                  >
                    <Feather name="plus" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.checkoutBar, { backgroundColor: c.card, paddingBottom: bottomPad + 16 }]}>
            <View>
              <Text style={[styles.totalLabel, { color: c.textSecondary }]}>Total ({totalItems} items)</Text>
              <Text style={[styles.totalAmount, { color: c.text }]}>₹{totalPrice.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.checkoutBtn, { backgroundColor: c.primary }]}
              onPress={handleCheckout}
              activeOpacity={0.8}
            >
              <Text style={styles.checkoutBtnText}>Place Order</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  title: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
  },
  clearBtn: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  itemInfo: {
    flex: 1,
    gap: 3,
  },
  itemName: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  itemStore: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
  itemPrice: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    marginTop: 2,
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    minWidth: 20,
    textAlign: "center",
  },
  checkoutBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  totalLabel: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
  },
  totalAmount: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
  },
  checkoutBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: "#E23744",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
});
