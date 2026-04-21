import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useInquiries, type Inquiry } from "@/context/InquiryContext";
import { useStore } from "@/context/StoreContext";

function timeAgo(ts: number) {
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function InquiriesScreen() {
  const c = Colors.light;
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { sellerStore } = useStore();
  const { myInquiries, pendingForSeller, inquiries, respondToInquiry, markResponsesSeen, speakInquiry } =
    useInquiries();

  const sellerInquiries = useMemo(() => {
    if (!sellerStore) return [];
    return inquiries
      .filter((i) => i.storeId === sellerStore.id)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [inquiries, sellerStore]);

  const [tab, setTab] = useState<"sent" | "received">(
    sellerStore && pendingForSeller.length > 0 ? "received" : "sent"
  );

  useEffect(() => {
    void markResponsesSeen();
  }, [markResponsesSeen]);

  const respond = async (id: string, status: "available" | "unavailable") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await respondToInquiry(id, status);
  };

  const renderSent = (i: Inquiry) => {
    const statusColors: Record<Inquiry["status"], { bg: string; fg: string; icon: any; label: string }> = {
      pending: { bg: "#FFF8E7", fg: "#9A5B00", icon: "clock", label: "Awaiting reply" },
      available: { bg: "#E6F7EC", fg: "#0F7A3A", icon: "check-circle", label: "Available!" },
      unavailable: { bg: "#FFE9EB", fg: "#B81D2A", icon: "x-circle", label: "Not available" },
      expired: { bg: "#F0F0F0", fg: "#777", icon: "alert-circle", label: "No reply" },
    };
    const s = statusColors[i.status];
    return (
      <View key={i.id} style={[styles.card, { backgroundColor: c.card }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusDot, { backgroundColor: s.fg }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.productName, { color: c.text }]} numberOfLines={1}>
              {i.productName}
            </Text>
            <Text style={[styles.storeMeta, { color: c.textSecondary }]} numberOfLines={1}>
              at {i.storeName}
            </Text>
          </View>
          <Text style={[styles.timeText, { color: c.textMuted }]}>{timeAgo(i.createdAt)}</Text>
        </View>
        <View style={[styles.statusBox, { backgroundColor: s.bg }]}>
          <Feather name={s.icon} size={16} color={s.fg} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusLabel, { color: s.fg }]}>{s.label}</Text>
            {i.responseNote ? (
              <Text style={[styles.statusNote, { color: s.fg }]}>{i.responseNote}</Text>
            ) : null}
          </View>
        </View>
        {i.status === "unavailable" || i.status === "expired" ? (
          <TouchableOpacity
            style={[styles.altBtn, { borderColor: c.primary }]}
            onPress={() => router.push("/(main)/search")}
          >
            <Feather name="search" size={14} color={c.primary} />
            <Text style={[styles.altBtnText, { color: c.primary }]}>Find another store</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  const renderReceived = (i: Inquiry) => {
    const isPending = i.status === "pending";
    const statusColors: Record<Inquiry["status"], { bg: string; fg: string; label: string }> = {
      pending: { bg: "#FFF8E7", fg: "#9A5B00", label: "Pending" },
      available: { bg: "#E6F7EC", fg: "#0F7A3A", label: "You said: Available" },
      unavailable: { bg: "#FFE9EB", fg: "#B81D2A", label: "You said: Not available" },
      expired: { bg: "#F0F0F0", fg: "#777", label: "Expired" },
    };
    const s = statusColors[i.status];
    return (
      <View key={i.id} style={[styles.card, { backgroundColor: c.card }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatarCircle, { backgroundColor: c.primary }]}>
            <Feather name="user" size={16} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.customerName, { color: c.text }]} numberOfLines={1}>
              {i.customerName} is asking
            </Text>
            <Text style={[styles.storeMeta, { color: c.textSecondary }]} numberOfLines={1}>
              {timeAgo(i.createdAt)}
            </Text>
          </View>
        </View>
        <View style={[styles.askBox, { backgroundColor: c.inputBg }]}>
          <Feather name="message-circle" size={14} color={c.textSecondary} />
          <Text style={[styles.askText, { color: c.text }]}>
            "Is <Text style={{ fontFamily: "Poppins_600SemiBold", color: c.primary }}>{i.productName}</Text> available at your store right now?"
          </Text>
        </View>
        {isPending ? (
          <View>
            {Platform.OS !== "web" && (
              <TouchableOpacity
                style={styles.replayBtn}
                onPress={() => speakInquiry(i)}
                activeOpacity={0.7}
              >
                <Feather name="volume-2" size={13} color={c.textSecondary} />
                <Text style={[styles.replayText, { color: c.textSecondary }]}>Play voice message</Text>
              </TouchableOpacity>
            )}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#0F7A3A" }]}
                onPress={() => respond(i.id, "available")}
                activeOpacity={0.85}
              >
                <Feather name="check" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Available</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#B81D2A" }]}
                onPress={() => respond(i.id, "unavailable")}
                activeOpacity={0.85}
              >
                <Feather name="x" size={16} color="#fff" />
                <Text style={styles.actionBtnText}>Not Available</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.statusBox, { backgroundColor: s.bg }]}>
            <Text style={[styles.statusLabel, { color: s.fg }]}>{s.label}</Text>
          </View>
        )}
      </View>
    );
  };

  const data = tab === "sent" ? myInquiries : sellerInquiries;
  const showReceivedTab = !!sellerStore;

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={[styles.header, { backgroundColor: c.card, paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={22} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.text }]}>Inquiries</Text>
        <View style={{ width: 40 }} />
      </View>

      {showReceivedTab && (
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              tab === "sent" && { borderBottomColor: c.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setTab("sent")}
          >
            <Text
              style={[
                styles.tabText,
                { color: tab === "sent" ? c.primary : c.textSecondary },
              ]}
            >
              My Requests ({myInquiries.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              tab === "received" && { borderBottomColor: c.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setTab("received")}
          >
            <Text
              style={[
                styles.tabText,
                { color: tab === "received" ? c.primary : c.textSecondary },
              ]}
            >
              Customer Asks ({sellerInquiries.length})
              {pendingForSeller.length > 0 ? (
                <Text style={{ color: c.primary }}> • {pendingForSeller.length} new</Text>
              ) : null}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 30 }}
        showsVerticalScrollIndicator={false}
      >
        {data.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Feather
              name={tab === "sent" ? "message-square" : "inbox"}
              size={56}
              color={c.border}
            />
            <Text style={[styles.emptyTitle, { color: c.text }]}>
              {tab === "sent" ? "No inquiries yet" : "No customer asks yet"}
            </Text>
            <Text style={[styles.emptyDesc, { color: c.textSecondary }]}>
              {tab === "sent"
                ? "Search a product and tap a store to ask if it's available"
                : "When customers ask about your products, they'll appear here"}
            </Text>
          </View>
        ) : (
          data.map((i) => (tab === "sent" ? renderSent(i) : renderReceived(i)))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 14,
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
    flex: 1,
    fontSize: 17,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5E5",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  card: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  productName: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  customerName: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  storeMeta: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    marginTop: 1,
  },
  timeText: {
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
  },
  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  statusLabel: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
  },
  statusNote: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    marginTop: 2,
  },
  askBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  askText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    lineHeight: 18,
  },
  replayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  replayText: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  altBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginTop: 10,
  },
  altBtnText: {
    fontSize: 12,
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
});
