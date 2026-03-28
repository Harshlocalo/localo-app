import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

export default function IndexScreen() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (isLoggedIn) {
    return <Redirect href="/(main)/home" />;
  }

  return <Redirect href="/(auth)/login" />;
}
