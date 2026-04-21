import { Feather } from "@expo/vector-icons";
import * as ExpoLocation from "expo-location";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useLocation } from "@/context/LocationContext";

let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== "web") {
  const maps = require("react-native-maps");
  MapView = maps.default;
  Marker = maps.Marker;
}

export default function MapPickerScreen() {
  const c = Colors.light;
  const insets = useSafeAreaInsets();
  const { location, changeLocation } = useLocation();
  const mapRef = useRef<any>(null);

  const initialLat = location?.lat ?? 19.076;
  const initialLng = location?.lng ?? 72.877;

  const [coord, setCoord] = useState({ lat: initialLat, lng: initialLng });
  const [addressLabel, setAddressLabel] = useState<string>("Move map to set location");
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);

  const resolveAddress = async (lat: number, lng: number) => {
    setResolving(true);
    try {
      if (Platform.OS === "web") {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        const a = data.address || {};
        const area =
          a.suburb || a.neighbourhood || a.village || a.town || a.city_district || a.city || "Selected area";
        const city = a.city || a.town || a.village || a.state_district || "Unknown";
        const state = a.state || "";
        setAddressLabel(`${area}, ${city}${state ? `, ${state}` : ""}`);
        return { area, city, state };
      }
      const results = await ExpoLocation.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results && results.length > 0) {
        const r = results[0];
        const area = r.district || r.subregion || r.name || r.street || "Selected area";
        const city = r.city || r.subregion || r.region || "Unknown";
        const state = r.region || "";
        setAddressLabel(`${area}, ${city}${state ? `, ${state}` : ""}`);
        return { area, city, state };
      }
    } catch {
      setAddressLabel("Address unavailable");
    } finally {
      setResolving(false);
    }
    return { area: "Selected area", city: "Unknown", state: "" };
  };

  useEffect(() => {
    resolveAddress(initialLat, initialLng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegionChange = (region: { latitude: number; longitude: number }) => {
    setCoord({ lat: region.latitude, lng: region.longitude });
  };

  const handleRegionChangeComplete = (region: { latitude: number; longitude: number }) => {
    resolveAddress(region.latitude, region.longitude);
  };

  const useCurrentLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const pos = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      const { latitude, longitude } = pos.coords;
      setCoord({ lat: latitude, lng: longitude });
      mapRef.current?.animateToRegion?.(
        { latitude, longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 },
        500
      );
      resolveAddress(latitude, longitude);
    } catch {}
  };

  const confirm = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaving(true);
    const addr = await resolveAddress(coord.lat, coord.lng);
    await changeLocation({
      area: addr.area,
      city: addr.city,
      state: addr.state,
      lat: coord.lat,
      lng: coord.lng,
    });
    setSaving(false);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View style={[styles.header, { backgroundColor: c.card, paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={22} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.text }]}>Set Delivery Location</Text>
        <TouchableOpacity onPress={useCurrentLocation} style={styles.iconBtn}>
          <Feather name="navigation" size={20} color={c.primary} />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        {Platform.OS !== "web" && MapView ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude: initialLat,
              longitude: initialLng,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            onRegionChange={handleRegionChange}
            onRegionChangeComplete={handleRegionChangeComplete}
            showsUserLocation
            showsMyLocationButton={false}
          />
        ) : (
          <View style={[styles.webFallback, { backgroundColor: "#EAF1F8" }]}>
            <Feather name="map" size={48} color={c.primary} />
            <Text style={[styles.webTitle, { color: c.text }]}>Map Picker</Text>
            <Text style={[styles.webDesc, { color: c.textSecondary }]}>
              Open the app on your phone (via Expo Go) to drag the map and pick your exact location.
              For now, your detected GPS coordinates will be used.
            </Text>
          </View>
        )}

        <View style={styles.centerPin} pointerEvents="none">
          <View style={[styles.pinShadow]} />
          <Feather name="map-pin" size={42} color={c.primary} />
        </View>
      </View>

      <View style={[styles.footer, { backgroundColor: c.card, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.addressRow}>
          <Feather name="map-pin" size={18} color={c.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.addressLabel, { color: c.textMuted }]}>Selected Location</Text>
            {resolving ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <ActivityIndicator size="small" color={c.primary} />
                <Text style={[styles.addressText, { color: c.textSecondary }]}>Finding address...</Text>
              </View>
            ) : (
              <Text style={[styles.addressText, { color: c.text }]} numberOfLines={2}>
                {addressLabel}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: c.primary, opacity: saving ? 0.7 : 1 }]}
          onPress={confirm}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="check" size={18} color="#fff" />
              <Text style={styles.confirmText}>Confirm Location</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 5,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  centerPin: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -21,
    marginTop: -42,
    alignItems: "center",
  },
  pinShadow: {
    position: "absolute",
    bottom: -2,
    width: 14,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  webFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  webTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  webDesc: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
    gap: 14,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  addressLabel: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  confirmText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
  },
});
