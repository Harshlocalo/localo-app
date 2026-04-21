import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ExpoLocation from "expo-location";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Alert, Linking, Platform } from "react-native";

export interface Location {
  area: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

const LOCATIONS: Location[] = [
  { area: "Andheri West", city: "Mumbai", state: "Maharashtra", lat: 19.136, lng: 72.826 },
  { area: "Koramangala", city: "Bengaluru", state: "Karnataka", lat: 12.935, lng: 77.624 },
  { area: "Connaught Place", city: "New Delhi", state: "Delhi", lat: 28.634, lng: 77.219 },
  { area: "Salt Lake", city: "Kolkata", state: "West Bengal", lat: 22.576, lng: 88.431 },
  { area: "T. Nagar", city: "Chennai", state: "Tamil Nadu", lat: 13.034, lng: 80.234 },
  { area: "Banjara Hills", city: "Hyderabad", state: "Telangana", lat: 17.41, lng: 78.448 },
  { area: "Aundh", city: "Pune", state: "Maharashtra", lat: 18.559, lng: 73.808 },
  { area: "Vastrapur", city: "Ahmedabad", state: "Gujarat", lat: 23.038, lng: 72.524 },
  { area: "Civil Lines", city: "Jaipur", state: "Rajasthan", lat: 26.934, lng: 75.803 },
  { area: "Gomti Nagar", city: "Lucknow", state: "Uttar Pradesh", lat: 26.869, lng: 80.994 },
];

interface LocationContextType {
  location: Location | null;
  allLocations: Location[];
  isDetecting: boolean;
  permissionDenied: boolean;
  detectLocation: () => Promise<void>;
  changeLocation: (loc: Location) => Promise<void>;
}

const LocationContext = createContext<LocationContextType | null>(null);
const LOC_KEY = "@hyperlocal_location";

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

function nearestKnown(lat: number, lng: number): Location {
  let best = LOCATIONS[0];
  let min = Infinity;
  for (const loc of LOCATIONS) {
    const d = distanceKm({ lat, lng }, loc);
    if (d < min) {
      min = d;
      best = loc;
    }
  }
  return best;
}

async function reverseGeocode(lat: number, lng: number): Promise<Partial<Location> | null> {
  try {
    if (Platform.OS === "web") {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
        { headers: { "Accept-Language": "en" } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      const a = data.address || {};
      return {
        area: a.suburb || a.neighbourhood || a.village || a.town || a.city_district || a.city || "Current Area",
        city: a.city || a.town || a.village || a.state_district || "Unknown",
        state: a.state || "",
      };
    }
    const results = await ExpoLocation.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (!results || results.length === 0) return null;
    const r = results[0];
    return {
      area: r.district || r.subregion || r.name || r.street || "Current Area",
      city: r.city || r.subregion || r.region || "Unknown",
      state: r.region || "",
    };
  } catch {
    return null;
  }
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<Location | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const detectLocation = useCallback(async () => {
    setIsDetecting(true);
    try {
      const { status, canAskAgain } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermissionDenied(true);
        setIsDetecting(false);
        const fallback = LOCATIONS[0];
        const stored = await AsyncStorage.getItem(LOC_KEY);
        if (!stored) {
          setLocation(fallback);
          await AsyncStorage.setItem(LOC_KEY, JSON.stringify(fallback));
        }
        if (!canAskAgain) {
          Alert.alert(
            "Location Off",
            "Enable location in Settings to see stores near you. Showing default city for now.",
            [
              { text: "Not Now", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() },
            ]
          );
        }
        return;
      }

      setPermissionDenied(false);
      const pos = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      const geo = await reverseGeocode(latitude, longitude);
      const nearest = nearestKnown(latitude, longitude);
      const detected: Location = {
        area: geo?.area || nearest.area,
        city: geo?.city || nearest.city,
        state: geo?.state || nearest.state,
        lat: latitude,
        lng: longitude,
      };
      setLocation(detected);
      await AsyncStorage.setItem(LOC_KEY, JSON.stringify(detected));
    } catch (e) {
      const stored = await AsyncStorage.getItem(LOC_KEY);
      if (!stored) {
        setLocation(LOCATIONS[0]);
        await AsyncStorage.setItem(LOC_KEY, JSON.stringify(LOCATIONS[0]));
      }
    } finally {
      setIsDetecting(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(LOC_KEY);
      if (stored) {
        setLocation(JSON.parse(stored));
      }
      detectLocation();
    })();
  }, [detectLocation]);

  const changeLocation = useCallback(async (loc: Location) => {
    await AsyncStorage.setItem(LOC_KEY, JSON.stringify(loc));
    setLocation(loc);
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        allLocations: LOCATIONS,
        isDetecting,
        permissionDenied,
        detectLocation,
        changeLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be inside LocationProvider");
  return ctx;
}
