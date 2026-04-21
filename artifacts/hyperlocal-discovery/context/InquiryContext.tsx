import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";

export type InquiryStatus = "pending" | "available" | "unavailable" | "expired";

export interface Inquiry {
  id: string;
  productName: string;
  storeId: string;
  storeName: string;
  customerName: string;
  createdAt: number;
  respondedAt?: number;
  status: InquiryStatus;
  responseNote?: string;
}

interface InquiryContextType {
  inquiries: Inquiry[];
  pendingForSeller: Inquiry[];
  myInquiries: Inquiry[];
  unreadResponses: number;
  createInquiry: (
    data: Omit<Inquiry, "id" | "createdAt" | "status">
  ) => Promise<Inquiry>;
  respondToInquiry: (
    id: string,
    status: "available" | "unavailable",
    note?: string
  ) => Promise<void>;
  markResponsesSeen: () => Promise<void>;
  speakInquiry: (inquiry: Inquiry) => Promise<void>;
}

const InquiryContext = createContext<InquiryContextType | null>(null);

const INQUIRIES_KEY = "@hyperlocal_inquiries";
const SEEN_KEY = "@hyperlocal_inquiries_seen";
const EXPIRY_MS = 5 * 60 * 1000;

export function InquiryProvider({
  children,
  currentUserName,
  sellerStoreId,
}: {
  children: React.ReactNode;
  currentUserName: string | null;
  sellerStoreId: string | null;
}) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [lastSeenAt, setLastSeenAt] = useState<number>(0);

  useEffect(() => {
    (async () => {
      const [str, seenStr] = await Promise.all([
        AsyncStorage.getItem(INQUIRIES_KEY),
        AsyncStorage.getItem(SEEN_KEY),
      ]);
      if (str) setInquiries(JSON.parse(str));
      if (seenStr) setLastSeenAt(Number(seenStr) || 0);
    })();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setInquiries((prev) => {
        const now = Date.now();
        let changed = false;
        const next = prev.map((i) => {
          if (i.status === "pending" && now - i.createdAt > EXPIRY_MS) {
            changed = true;
            return {
              ...i,
              status: "unavailable" as InquiryStatus,
              respondedAt: now,
              responseNote: "Shopkeeper didn't respond — try another store",
            };
          }
          return i;
        });
        if (changed) {
          AsyncStorage.setItem(INQUIRIES_KEY, JSON.stringify(next));
          return next;
        }
        return prev;
      });
    }, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  const persist = useCallback(async (list: Inquiry[]) => {
    await AsyncStorage.setItem(INQUIRIES_KEY, JSON.stringify(list));
  }, []);

  const speakInquiry = useCallback(async (inquiry: Inquiry) => {
    if (Platform.OS === "web") return;
    try {
      const message = `New customer inquiry. ${inquiry.customerName} is asking if ${inquiry.productName} is available at your store. Please tap available or not available to respond.`;
      Speech.stop();
      Speech.speak(message, {
        language: "en-IN",
        rate: 0.95,
        pitch: 1.0,
      });
    } catch {
      // Ignore if speech engine unavailable
    }
  }, []);

  const createInquiry = useCallback(
    async (data: Omit<Inquiry, "id" | "createdAt" | "status">) => {
      const inquiry: Inquiry = {
        ...data,
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        createdAt: Date.now(),
        status: "pending",
      };
      const next = [inquiry, ...inquiries];
      await persist(next);
      setInquiries(next);
      void speakInquiry(inquiry);
      return inquiry;
    },
    [inquiries, persist, speakInquiry]
  );

  const respondToInquiry = useCallback(
    async (id: string, status: "available" | "unavailable", note?: string) => {
      const next = inquiries.map((i) =>
        i.id === id
          ? {
              ...i,
              status,
              respondedAt: Date.now(),
              responseNote:
                note ||
                (status === "available"
                  ? "Yes, the product is in stock — please come over!"
                  : "Sorry, this product isn't available right now."),
            }
          : i
      );
      await persist(next);
      setInquiries(next);
    },
    [inquiries, persist]
  );

  const markResponsesSeen = useCallback(async () => {
    const now = Date.now();
    setLastSeenAt(now);
    await AsyncStorage.setItem(SEEN_KEY, String(now));
  }, []);

  const myInquiries = useMemo(
    () =>
      inquiries
        .filter((i) => i.customerName === currentUserName)
        .sort((a, b) => b.createdAt - a.createdAt),
    [inquiries, currentUserName]
  );

  const pendingForSeller = useMemo(
    () =>
      inquiries
        .filter((i) => sellerStoreId && i.storeId === sellerStoreId && i.status === "pending")
        .sort((a, b) => b.createdAt - a.createdAt),
    [inquiries, sellerStoreId]
  );

  const unreadResponses = useMemo(
    () =>
      myInquiries.filter(
        (i) => i.respondedAt && i.respondedAt > lastSeenAt && i.status !== "pending"
      ).length,
    [myInquiries, lastSeenAt]
  );

  return (
    <InquiryContext.Provider
      value={{
        inquiries,
        pendingForSeller,
        myInquiries,
        unreadResponses,
        createInquiry,
        respondToInquiry,
        markResponsesSeen,
        speakInquiry,
      }}
    >
      {children}
    </InquiryContext.Provider>
  );
}

export function useInquiries() {
  const ctx = useContext(InquiryContext);
  if (!ctx) throw new Error("useInquiries must be inside InquiryProvider");
  return ctx;
}
