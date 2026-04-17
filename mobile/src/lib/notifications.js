/**
 * Expo push notifications helper.
 * - requestPermissions() — asks for permission, registers device, sends token to server.
 * - scheduleLunchReminder() — creates a daily local notification at the given time.
 * - cancelLunchReminder() — removes the scheduled reminder.
 */
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { apiFetch } from "./api";

export async function requestPushPermissions() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return { granted: false, reason: "denied" };
  }

  // Android needs a notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Cincailah",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#DC2626",
    });
  }

  // Get the Expo push token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    // Register with server
    await apiFetch("/api/push/subscribe-expo", {
      method: "POST",
      body: { token: tokenData.data },
    });
    return { granted: true, token: tokenData.data };
  } catch (_err) {
    return { granted: true, token: null };
  }
}

const REMINDER_ID = "cincailah_lunch_reminder";

/**
 * Schedule a daily lunch reminder.
 * @param {number} hour   - 0-23
 * @param {number} minute - 0-59
 */
export async function scheduleLunchReminder(hour = 11, minute = 45) {
  // Cancel any existing reminder first
  await cancelLunchReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: {
      title: "🍛 Lunch time soon!",
      body: "What are you eating today? Let Cincailah decide!",
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return true;
}

export async function cancelLunchReminder() {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID);
}

export async function getReminderStatus() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.find((n) => n.identifier === REMINDER_ID) ?? null;
}
