import { Feather } from "@expo/vector-icons";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
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
import { useAuth } from "@/context/AuthContext";
import { useInquiries } from "@/context/InquiryContext";
import { useStore } from "@/context/StoreContext";
import { STORES, type Store } from "@/data/stores";

type Turn = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
};

type ConvState =
  | { mode: "idle" }
  | { mode: "awaitingStoreChoice"; productName: string; matches: Store[] }
  | { mode: "awaitingConfirm"; productName: string; store: Store };

const GREETING =
  "Hi! I'm Localo, your shopping assistant. Tap the microphone and tell me what product you're looking for. For example, say 'find rice' or 'do you have toor dal'.";

function findStoresForProduct(name: string): Store[] {
  const n = name.toLowerCase();
  const ranked = STORES.map((s) => {
    let score = 0;
    if (s.category.toLowerCase().includes("grocery") && /rice|dal|atta|oil|milk|sugar|tea|chawal|anaaj|loose/i.test(n)) score += 3;
    if (s.category.toLowerCase().includes("stationery") && /pencil|pen|book|copy|notebook|eraser|ruler/i.test(n)) score += 3;
    if (s.category.toLowerCase().includes("pharmacy") && /tablet|paracetamol|medicine|syrup|crocin|dawai/i.test(n)) score += 3;
    if (s.category.toLowerCase().includes("electronics") && /headphone|charger|cable|battery|earphone|adapter/i.test(n)) score += 3;
    if (s.name.toLowerCase().includes(n)) score += 2;
    if (s.description.toLowerCase().includes(n)) score += 1;
    return { store: s, score };
  })
    .sort((a, b) => b.score - a.score)
    .filter((r) => r.score > 0)
    .map((r) => r.store);
  return ranked.length > 0 ? ranked.slice(0, 3) : STORES.slice(0, 3);
}

function parseProduct(text: string): string | null {
  const t = text.toLowerCase().trim();
  const patterns = [
    /(?:find|search|look for|i (?:want|need)|do you have|got any|i'm looking for|get me|show me)\s+(?:any\s+)?(.+?)(?:\s+please|\?|$)/i,
    /(?:is|are)\s+(.+?)\s+available/i,
    /^(.+?)\s+available/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1]) {
      const cleaned = m[1]
        .replace(/\b(near me|nearby|around here|right now|today)\b/gi, "")
        .replace(/[?!.]/g, "")
        .trim();
      if (cleaned.length > 1) return cleaned;
    }
  }
  // Fallback: if user just says product name
  if (t.length < 50 && !/^(yes|no|cancel|stop|help|status|inquiries|hello|hi)/.test(t)) {
    return text.replace(/[?!.]/g, "").trim();
  }
  return null;
}

function isAffirmative(text: string) {
  return /\b(yes|yeah|yep|sure|ok|okay|please|do it|go ahead|haan|theek|haa|ji|sahi)\b/i.test(text);
}
function isNegative(text: string) {
  return /\b(no|nope|cancel|stop|nahi|nahin|mat|don't)\b/i.test(text);
}

export default function AssistantScreen() {
  const c = Colors.light;
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { user } = useAuth();
  const { products } = useStore();
  const { createInquiry, myInquiries, markResponsesSeen } = useInquiries();

  const [turns, setTurns] = useState<Turn[]>([]);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [supported, setSupported] = useState<boolean | null>(null);
  const [textInput, setTextInput] = useState("");
  const [showText, setShowText] = useState(Platform.OS === "web");
  const stateRef = useRef<ConvState>({ mode: "idle" });
  const scrollRef = useRef<ScrollView>(null);
  const lastSpokenInquiryIds = useRef<Set<string>>(new Set());

  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.18,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulse]);

  useEffect(() => {
    (async () => {
      try {
        const available = await ExpoSpeechRecognitionModule.isRecognitionAvailable();
        setSupported(available);
        if (!available) setShowText(true);
      } catch {
        setSupported(false);
        setShowText(true);
      }
    })();
  }, []);

  const speak = useCallback((text: string) => {
    if (Platform.OS !== "web") {
      Speech.stop();
      Speech.speak(text, { language: "en-IN", rate: 0.96, pitch: 1.0 });
    }
  }, []);

  const addTurn = useCallback((role: "user" | "assistant", text: string) => {
    setTurns((prev) => [
      ...prev,
      { id: Date.now().toString() + Math.random().toString(36).slice(2, 6), role, text, timestamp: Date.now() },
    ]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const assistantSay = useCallback(
    (text: string) => {
      addTurn("assistant", text);
      speak(text);
    },
    [addTurn, speak]
  );

  // Greet on first mount
  useEffect(() => {
    const t = setTimeout(() => assistantSay(GREETING), 400);
    return () => clearTimeout(t);
  }, [assistantSay]);

  // Watch for new inquiry responses and announce them
  useEffect(() => {
    const seen = lastSpokenInquiryIds.current;
    const newlyResponded = myInquiries.filter(
      (i) => i.respondedAt && (i.status === "available" || i.status === "unavailable") && !seen.has(i.id)
    );
    if (newlyResponded.length > 0 && turns.length > 0) {
      newlyResponded.forEach((i) => {
        seen.add(i.id);
        const msg =
          i.status === "available"
            ? `Good news! ${i.storeName} confirmed that ${i.productName} is available. You can head over to pick it up.`
            : `${i.storeName} replied that ${i.productName} is not available right now. Would you like me to try another store?`;
        assistantSay(msg);
        if (i.status === "unavailable") {
          stateRef.current = { mode: "awaitingConfirm", productName: i.productName, store: { id: "", name: "another nearby store" } as Store };
        }
      });
      void markResponsesSeen();
    } else if (turns.length === 0) {
      // First load: mark all current responses as already seen so we don't replay them
      myInquiries.forEach((i) => {
        if (i.respondedAt) seen.add(i.id);
      });
    }
  }, [myInquiries, assistantSay, markResponsesSeen, turns.length]);

  const handleProductRequest = useCallback(
    (productName: string) => {
      const matches = findStoresForProduct(productName);
      if (matches.length === 0) {
        assistantSay(`I couldn't find any nearby store likely to have ${productName}. Try saying a different product.`);
        stateRef.current = { mode: "idle" };
        return;
      }
      const top = matches[0];
      const others = matches.slice(1);
      stateRef.current = { mode: "awaitingStoreChoice", productName, matches };
      const othersPart =
        others.length > 0
          ? ` I can also try ${others.map((s) => s.name).join(" or ")} if you'd prefer.`
          : "";
      assistantSay(
        `I found ${matches.length} ${matches.length === 1 ? "store" : "stores"} that may have ${productName}. The closest match is ${top.name} in ${top.area}.${othersPart} Should I send a voice message to ${top.name} to check if it's available? Say yes or no.`
      );
    },
    [assistantSay]
  );

  const sendInquiryFromAssistant = useCallback(
    async (productName: string, store: Store) => {
      if (!user?.name) {
        assistantSay("Please sign in first so I can send your message to the shopkeeper.");
        return;
      }
      if (!store?.id) {
        assistantSay("I don't have another store to try right now. You can search again any time.");
        stateRef.current = { mode: "idle" };
        return;
      }
      await createInquiry({
        productName,
        storeId: store.id,
        storeName: store.name,
        customerName: user.name,
      });
      assistantSay(
        `Done. I've sent a voice message to ${store.name} asking if ${productName} is available. I'll let you know as soon as the shopkeeper replies.`
      );
      stateRef.current = { mode: "idle" };
    },
    [assistantSay, createInquiry, user]
  );

  const processIntent = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      addTurn("user", text);

      const lower = text.toLowerCase();

      // Status / inquiries
      if (/\b(status|inquiries|inquiry|messages|replies|notifications)\b/.test(lower)) {
        const pending = myInquiries.filter((i) => i.status === "pending");
        const responded = myInquiries.filter((i) => i.status !== "pending");
        if (myInquiries.length === 0) {
          assistantSay("You haven't sent any inquiries yet. Just tell me a product you need and I'll handle the rest.");
        } else {
          let msg = "";
          if (pending.length > 0) msg += `You have ${pending.length} pending ${pending.length === 1 ? "reply" : "replies"}. `;
          const last = responded[0];
          if (last) {
            msg +=
              last.status === "available"
                ? `Most recent: ${last.storeName} confirmed ${last.productName} is available.`
                : `Most recent: ${last.storeName} said ${last.productName} is not available.`;
          }
          assistantSay(msg);
        }
        return;
      }

      if (/\b(help|what can you do)\b/.test(lower)) {
        assistantSay(
          "You can ask me to find a product like 'find rice' or 'do you have toor dal'. After I suggest a store, say yes to ask the shopkeeper. You can also say 'check my inquiries' to hear replies."
        );
        return;
      }

      // Conversation continuations
      const state = stateRef.current;
      if (state.mode === "awaitingStoreChoice") {
        if (isAffirmative(lower)) {
          void sendInquiryFromAssistant(state.productName, state.matches[0]);
          return;
        }
        if (isNegative(lower)) {
          assistantSay("Okay, cancelled. Tell me another product whenever you're ready.");
          stateRef.current = { mode: "idle" };
          return;
        }
        // Try matching named store
        const named = state.matches.find((s) => lower.includes(s.name.toLowerCase().split(" ")[0]));
        if (named) {
          void sendInquiryFromAssistant(state.productName, named);
          return;
        }
      }
      if (state.mode === "awaitingConfirm") {
        if (isAffirmative(lower)) {
          // try another store
          const matches = findStoresForProduct(state.productName).filter((s) => s.id !== state.store.id);
          if (matches[0]) {
            stateRef.current = { mode: "awaitingStoreChoice", productName: state.productName, matches };
            assistantSay(`Trying ${matches[0].name} in ${matches[0].area}. Should I send the voice message? Say yes to confirm.`);
          } else {
            assistantSay("I'm out of nearby stores to try for that product. You can ask me to search for something else.");
            stateRef.current = { mode: "idle" };
          }
          return;
        }
        if (isNegative(lower)) {
          assistantSay("Okay, no problem. Just say a product name when you want to try again.");
          stateRef.current = { mode: "idle" };
          return;
        }
      }

      // Default: try to extract a product
      const product = parseProduct(text);
      if (product) {
        handleProductRequest(product);
      } else {
        assistantSay("I didn't catch that. Try saying something like 'find rice' or 'do you have milk'.");
      }
    },
    [addTurn, assistantSay, handleProductRequest, myInquiries, sendInquiryFromAssistant]
  );

  // Speech recognition events
  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results?.[0]?.transcript ?? "";
    if (event.isFinal) {
      setInterim("");
      if (transcript.trim()) processIntent(transcript);
    } else {
      setInterim(transcript);
    }
  });
  useSpeechRecognitionEvent("end", () => {
    setListening(false);
    setInterim("");
  });
  useSpeechRecognitionEvent("error", (event) => {
    setListening(false);
    setInterim("");
    if (event.error && event.error !== "no-speech" && event.error !== "aborted") {
      assistantSay("I had trouble hearing you. Please try again.");
    }
  });

  const startListening = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Speech.stop();
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Microphone needed",
          "Please grant microphone and speech recognition permission so I can hear you."
        );
        return;
      }
      setListening(true);
      ExpoSpeechRecognitionModule.start({
        lang: "en-IN",
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
        requiresOnDeviceRecognition: false,
        addsPunctuation: false,
      });
    } catch (e) {
      setListening(false);
      assistantSay("Voice recognition isn't available on this device. You can type instead.");
      setShowText(true);
    }
  }, [assistantSay]);

  const stopListening = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      /* noop */
    }
    setListening(false);
  }, []);

  const submitText = () => {
    const t = textInput.trim();
    if (!t) return;
    setTextInput("");
    processIntent(t);
  };

  const stopAll = () => {
    Speech.stop();
    stopListening();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={[styles.header, { backgroundColor: c.card, paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Go back">
          <Feather name="arrow-left" size={22} color={c.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.text }]}>Localo Assistant</Text>
          <Text style={[styles.subTitle, { color: c.textSecondary }]} numberOfLines={1}>
            Speak naturally — I'll find it for you
          </Text>
        </View>
        <TouchableOpacity onPress={stopAll} style={styles.iconBtn} accessibilityLabel="Stop speaking">
          <Feather name="volume-x" size={20} color={c.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {turns.map((t) => (
          <View
            key={t.id}
            style={[
              styles.bubbleRow,
              { justifyContent: t.role === "user" ? "flex-end" : "flex-start" },
            ]}
          >
            {t.role === "assistant" && (
              <View style={[styles.avatar, { backgroundColor: c.primary }]}>
                <Feather name="zap" size={14} color="#fff" />
              </View>
            )}
            <View
              style={[
                styles.bubble,
                t.role === "user"
                  ? { backgroundColor: c.primary, borderBottomRightRadius: 4 }
                  : { backgroundColor: c.card, borderBottomLeftRadius: 4 },
              ]}
              accessibilityLabel={`${t.role === "assistant" ? "Assistant" : "You"}: ${t.text}`}
            >
              <Text
                style={[
                  styles.bubbleText,
                  { color: t.role === "user" ? "#fff" : c.text },
                ]}
              >
                {t.text}
              </Text>
            </View>
          </View>
        ))}
        {interim ? (
          <View style={[styles.bubbleRow, { justifyContent: "flex-end" }]}>
            <View style={[styles.bubble, { backgroundColor: "#FFE9EB", borderBottomRightRadius: 4 }]}>
              <Text style={[styles.bubbleText, { color: c.primary, fontStyle: "italic" }]}>{interim}…</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 12 }]}>
        {showText && (
          <View style={[styles.textBar, { backgroundColor: c.card, borderColor: c.border }]}>
            <TextInput
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Or type your question..."
              placeholderTextColor={c.textMuted}
              style={[styles.textInput, { color: c.text }]}
              onSubmitEditing={submitText}
              returnKeyType="send"
            />
            <TouchableOpacity onPress={submitText} style={styles.sendBtn} accessibilityLabel="Send message">
              <Feather name="send" size={18} color={c.primary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.micWrap}>
          <Animated.View
            style={[
              styles.pulseRing,
              {
                backgroundColor: listening ? c.primary : "transparent",
                transform: [{ scale: listening ? pulse : 1 }],
                opacity: listening ? 0.3 : 0,
              },
            ]}
          />
          <TouchableOpacity
            onPress={listening ? stopListening : startListening}
            style={[styles.micBtn, { backgroundColor: listening ? "#1A1A1A" : c.primary }]}
            accessibilityLabel={listening ? "Stop listening" : "Tap to speak to the assistant"}
            accessibilityHint="Activates voice recognition"
            activeOpacity={0.85}
            disabled={supported === false && Platform.OS !== "web"}
          >
            <Feather name={listening ? "square" : "mic"} size={34} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={[styles.micLabel, { color: c.textSecondary }]}>
          {listening ? "Listening… speak now" : supported === false ? "Voice unavailable — type instead" : "Tap the mic to talk"}
        </Text>
        {!showText && (
          <TouchableOpacity onPress={() => setShowText(true)} style={{ marginTop: 6 }}>
            <Text style={[styles.altLink, { color: c.primary }]}>Or type instead</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 12,
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
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginBottom: 10,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5E5",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  textBar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1.5,
    paddingLeft: 16,
    paddingRight: 6,
    height: 46,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    height: "100%",
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF0F1",
    alignItems: "center",
    justifyContent: "center",
  },
  micWrap: {
    width: 110,
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  micBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E23744",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  pulseRing: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  micLabel: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    marginTop: 8,
  },
  altLink: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    textDecorationLine: "underline",
  },
});
