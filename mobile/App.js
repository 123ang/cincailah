import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  ActivityIndicator,
  useColorScheme,
  StatusBar,
} from "react-native";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import Constants from "expo-constants";
import * as Sentry from "@sentry/react-native";

import { AuthProvider, useAuth } from "./src/context/AuthContext";

// Auth screens
import LandingScreen from "./src/screens/auth/LandingScreen";
import LoginScreen from "./src/screens/auth/LoginScreen";
import RegisterScreen from "./src/screens/auth/RegisterScreen";
import ForgotPasswordScreen from "./src/screens/auth/ForgotPasswordScreen";

// Main app screens
import OwnScreen from "./src/screens/OwnScreen";
import GroupsScreen from "./src/screens/GroupsScreen";
import DecideScreen from "./src/screens/DecideScreen";
import VoteScreen from "./src/screens/VoteScreen";
import RestaurantsScreen from "./src/screens/RestaurantsScreen";
import AddRestaurantScreen from "./src/screens/AddRestaurantScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import GroupSettingsScreen from "./src/screens/GroupSettingsScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import CreateGroupScreen from "./src/screens/CreateGroupScreen";
import JoinGroupScreen from "./src/screens/JoinGroupScreen";
import ScanQrScreen from "./src/screens/ScanQrScreen";
import FinalDecisionScreen from "./src/screens/FinalDecisionScreen";
import WinnerScreen from "./src/screens/WinnerScreen";

// Keep splash visible until auth is resolved
SplashScreen.preventAutoHideAsync();

const sentryDsn = Constants.expoConfig?.extra?.sentryDsn;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: 0.1,
  });
}

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Configure notification behaviour (show banner + sound even when foregrounded)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Deep-link prefix
const prefix = Linking.createURL("/");

const linking = {
  prefixes: [prefix, "https://cincailah.com", "jiakhami://"],
  config: {
    screens: {
      Auth: {
        screens: {
          Landing: "",
          Login: "login",
          Register: "register",
        },
      },
      Main: {
        screens: {
          Groups: "groups",
          Solo: "solo",
          History: "history",
          Profile: "profile",
        },
      },
      JoinGroup: "join/:code",
      Decide: "group/:groupId",
    },
  },
};

function darkTheme(isDark) {
  return {
    dark: isDark,
    colors: {
      primary: "#DC2626",
      background: isDark ? "#111827" : "#F9FAFB",
      card: isDark ? "#1F2937" : "#ffffff",
      text: isDark ? "#F9FAFB" : "#111827",
      border: isDark ? "#374151" : "#E5E7EB",
      notification: "#DC2626",
    },
  };
}

const SAMBAL = "#DC2626";

function MainTabs() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Solo: "game-controller",
            Groups: "people",
            History: "time",
            Profile: "person",
          };
          return (
            <Ionicons name={icons[route.name] || "ellipse"} size={size} color={color} />
          );
        },
        tabBarActiveTintColor: SAMBAL,
        tabBarInactiveTintColor: isDark ? "#6B7280" : "#9CA3AF",
        tabBarStyle: {
          backgroundColor: isDark ? "#1F2937" : "#ffffff",
          borderTopColor: isDark ? "#374151" : "#F3F4F6",
        },
        headerStyle: { backgroundColor: isDark ? "#1F2937" : "#ffffff" },
        headerTitleStyle: { color: isDark ? "#F9FAFB" : "#111827" },
        headerTintColor: SAMBAL,
        headerTitleAlign: "center",
      })}
    >
      <Tab.Screen name="Solo" component={OwnScreen} options={{ title: "Solo" }} />
      <Tab.Screen name="Groups" component={GroupsScreen} options={{ title: "Groups" }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: "History" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: SAMBAL }}>
      <Stack.Screen name="Landing" component={LandingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Sign In" }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Create Account" }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: "Forgot Password" }} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={SAMBAL} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerTintColor: SAMBAL }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: "New Group" }} />
          <Stack.Screen name="JoinGroup" component={JoinGroupScreen} options={{ title: "Join Group" }} />
          <Stack.Screen name="ScanQr" component={ScanQrScreen} options={{ title: "Scan QR" }} />
          <Stack.Screen name="Decide" component={DecideScreen} options={({ route }) => ({ title: route.params?.groupName ?? "Decide" })} />
          <Stack.Screen name="Vote" component={VoteScreen} options={{ title: "We Fight ⚔️" }} />
          <Stack.Screen name="Restaurants" component={RestaurantsScreen} options={({ route }) => ({ title: route.params?.groupName ?? "Restaurants" })} />
          <Stack.Screen name="AddRestaurant" component={AddRestaurantScreen} options={{ title: "Add Restaurant" }} />
          <Stack.Screen name="GroupHistory" component={HistoryScreen} options={{ title: "Group History" }} />
          <Stack.Screen name="GroupSettings" component={GroupSettingsScreen} options={{ title: "Settings" }} />
          <Stack.Screen name="Winner" component={WinnerScreen} options={{ headerShown: false }} />
          <Stack.Screen name="FinalDecision" component={FinalDecisionScreen} options={{ title: "Winner 🏆" }} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const scheme = useColorScheme();

  // Handle notification taps (deep-link to relevant screen)
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      // Navigation happens via linking config; no extra action needed here
    });
    return () => sub.remove();
  }, []);

  return (
    <AuthProvider>
      <StatusBar
        barStyle={scheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <NavigationContainer theme={darkTheme(scheme === "dark")} linking={linking}>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
