import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

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
  detectLocation: () => void;
  changeLocation: (loc: Location) => Promise<void>;
}

const LocationContext = createContext<LocationContextType | null>(null);
const LOC_KEY = "@hyperlocal_location";

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<Location | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const detectLocation = useCallback(() => {
    setIsDetecting(true);
    setTimeout(async () => {
      const detected = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
      await AsyncStorage.setItem(LOC_KEY, JSON.stringify(detected));
      setLocation(detected);
      setIsDetecting(false);
    }, 2000);
  }, []);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(LOC_KEY);
      if (stored) {
        setLocation(JSON.parse(stored));
      } else {
        detectLocation();
      }
    })();
  }, [detectLocation]);

  const changeLocation = useCallback(async (loc: Location) => {
    await AsyncStorage.setItem(LOC_KEY, JSON.stringify(loc));
    setLocation(loc);
  }, []);

  return (
    <LocationContext.Provider
      value={{ location, allLocations: LOCATIONS, isDetecting, detectLocation, changeLocation }}
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
