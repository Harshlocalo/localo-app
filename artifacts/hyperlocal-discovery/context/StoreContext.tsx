import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface SellerStore {
  id: string;
  name: string;
  address: string;
  city: string;
  pincode: string;
  category: string;
  ownerId: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  quantity: number;
  storeId: string;
}

interface StoreContextType {
  sellerStore: SellerStore | null;
  products: Product[];
  registerStore: (data: Omit<SellerStore, "id">) => Promise<void>;
  addProduct: (product: Omit<Product, "id">) => Promise<void>;
  updateProductQuantity: (id: string, delta: number) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORE_KEY = "@hyperlocal_store";
const PRODUCTS_KEY = "@hyperlocal_products";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [sellerStore, setSellerStore] = useState<SellerStore | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    (async () => {
      const [storeStr, productsStr] = await Promise.all([
        AsyncStorage.getItem(STORE_KEY),
        AsyncStorage.getItem(PRODUCTS_KEY),
      ]);
      if (storeStr) setSellerStore(JSON.parse(storeStr));
      if (productsStr) setProducts(JSON.parse(productsStr));
    })();
  }, []);

  const registerStore = useCallback(async (data: Omit<SellerStore, "id">) => {
    const store: SellerStore = { ...data, id: Date.now().toString() };
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(store));
    setSellerStore(store);
  }, []);

  const addProduct = useCallback(
    async (product: Omit<Product, "id">) => {
      const newProduct: Product = { ...product, id: Date.now().toString() + Math.random().toString(36).substr(2, 5) };
      const updated = [...products, newProduct];
      await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
      setProducts(updated);
    },
    [products]
  );

  const updateProductQuantity = useCallback(
    async (id: string, delta: number) => {
      const updated = products.map((p) =>
        p.id === id ? { ...p, quantity: Math.max(0, p.quantity + delta) } : p
      );
      await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
      setProducts(updated);
    },
    [products]
  );

  return (
    <StoreContext.Provider
      value={{ sellerStore, products, registerStore, addProduct, updateProductQuantity }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
}
