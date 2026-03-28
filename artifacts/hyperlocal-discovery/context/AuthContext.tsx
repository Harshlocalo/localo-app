import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USER_KEY = "@hyperlocal_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(USER_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (email: string, _password: string) => {
    const mockUser: User = {
      id: Date.now().toString(),
      name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
    };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(mockUser));
    setUser(mockUser);
  }, []);

  const signUp = useCallback(async (name: string, email: string, _password: string) => {
    const mockUser: User = {
      id: Date.now().toString(),
      name,
      email,
    };
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(mockUser));
    setUser(mockUser);
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isLoggedIn: !!user, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
