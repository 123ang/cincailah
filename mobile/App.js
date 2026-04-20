import React, { useEffect } from "react";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  ActivityIndicator,
  useColorScheme,
  StatusBar,
  Platform,
} from "react-native";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import Constants from "expo-constants";
import * as Sentry from "@sentry/react-native";

import { AuthProvider, useAuth } from "./src/context/AuthContext";

import LandingScreen from "./src/screens/auth/LandingScreen";
import LoginScreen from "./src/screens/auth/LoginScreen";
import RegisterScreen from "./src/screens/auth/RegisterScreen";
import ForgotPasswordScreen from "./src/screens/auth/ForgotPasswordScreen";
import ResetPasswordScreen from "./src/screens/auth/ResetPasswordScreen";
import VerifyEmailScreen from "./src/screens/auth/VerifyEmailScreen";

import OwnScreen from "./src/screens/OwnScreen";
import GroupsScreen from "./src/screens/GroupsScreen";
import DecideScreen from "./src/screens/DecideScreen";
import VoteScreen from "./src/screens/VoteScreen";
import RestaurantsScreen from "./src/screens/RestaurantsScreen";
import AddRestaurantScreen from "./src/screens/AddRestaurantScreen";
import EditRestaurantScreen from "./src/screens/EditRestaurantScreen";
import HistoryScreen from "./src/screens/HistoryScreen";
import GroupSettingsScreen from "./src/screens/GroupSettingsScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import EditProfileScreen from "./src/screens/EditProfileScreen";
import CreateGroupScreen from "./src/screens/CreateGroupScreen";
import JoinGroupScreen from "./src/screens/JoinGroupScreen";
import ScanQrScreen from "./src/screens/ScanQrScreen";
import FinalDecisionScreen from "./src/screens/FinalDecisionScreen";
import WinnerScreen from "./src/screens/WinnerScreen";
import FavoritesScreen from "./src/screens/FavoritesScreen";
import RemindersScreen from "./src/screens/RemindersScreen";
import AuthRequiredScreen from "./src/screens/AuthRequiredScreen";

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

try {
  if (!(Constants.appOwnership === "expo" && Platform.OS === "android")) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
} catch {
  // no-op
}

const prefix = Linking.createURL("/");

const linking = {
  prefixes: [
    prefix,
    "https://cincailah.suntzutechnologies.com",
    "https://cincailah.com",
    "jiakhami://",
  ],
  config: {
    screens: {
      Auth: {
        screens: {
          Landing: "",
          Login: "login",
          Register: "register",
          ForgotPassword: "forgot-password",
          ResetPassword: "reset-password",
          VerifyEmail: "verify/:token",
        },
      },
      Main: {
        screens: {
          Groups: "groups",
          Solo: "solo",
          Favorites: "favorites",
          History: "history",
          Profile: "profile",
          Reminders: "reminders",
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
      ...DefaultTheme.colors,
      primary: "#DC2626",
      background: isDark ? "#111827" : "#F9FAFB",
      card: isDark ? "#1F2937" : "#ffffff",
      text: isDark ? "#F9FAFB" : "#111827",
      border: isDark ? "#374151" : "#E5E7EB",
      notification: "#DC2626",
    },
    fonts: DefaultTheme.fonts,
  };
}

const SAMBAL = "#DC2626";

function AuthedTabs() {
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
          return <Ionicons name={icons[route.name] || "ellipse"} size={size} color={color} />;
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

function GuestTabs() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Solo: "game-controller",
            Favorites: "heart",
            History: "time",
            Reminders: "notifications",
            Profile: "person",
          };
          return <Ionicons name={icons[route.name] || "ellipse"} size={size} color={color} />;
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
      <Tab.Screen name="Favorites" component={FavoritesScreen} options={{ title: "Favorites" }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: "History" }} />
      <Tab.Screen name="Reminders" component={RemindersScreen} options={{ title: "Reminders" }} />
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
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: "Reset Password" }} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ title: "Verify Email" }} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { user, mode, loading } = useAuth();

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
      {mode === 'authed' && user ? (
        <>
          <Stack.Screen name="Main" component={AuthedTabs} options={{ headerShown: false }} />
          <Stack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: "New Group" }} />
          <Stack.Screen name="JoinGroup" component={JoinGroupScreen} options={{ title: "Join Group" }} />
          <Stack.Screen name="ScanQr" component={ScanQrScreen} options={{ title: "Scan QR" }} />
          <Stack.Screen name="Decide" component={DecideScreen} options={({ route }) => ({ title: route.params?.groupName ?? "Decide" })} />
          <Stack.Screen name="Vote" component={VoteScreen} options={{ title: "We Fight ⚔️" }} />
          <Stack.Screen name="Restaurants" component={RestaurantsScreen} options={({ route }) => ({ title: route.params?.groupName ?? "Restaurants" })} />
          <Stack.Screen name="AddRestaurant" component={AddRestaurantScreen} options={{ title: "Add Restaurant" }} />
          <Stack.Screen name="EditRestaurant" component={EditRestaurantScreen} options={{ title: "Edit Restaurant" }} />
          <Stack.Screen name="GroupHistory" component={HistoryScreen} options={{ title: "Group History" }} />
          <Stack.Screen name="GroupSettings" component={GroupSettingsScreen} options={{ title: "Settings" }} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: "Edit Profile" }} />
          <Stack.Screen name="Winner" component={WinnerScreen} options={{ headerShown: false }} />
          <Stack.Screen name="FinalDecision" component={FinalDecisionScreen} options={{ title: "Winner 🏆" }} />
        </>
      ) : mode === 'guest' ? (
        <>
          <Stack.Screen name="Main" component={GuestTabs} options={{ headerShown: false }} />
          <Stack.Screen name="AuthRequired" component={AuthRequiredScreen} options={{ title: "Sign In Required" }} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const scheme = useColorScheme();

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {});
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
