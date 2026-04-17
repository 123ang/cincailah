/**
 * Lightweight in-app toast component + hook.
 * Usage:
 *   const { showToast, ToastHost } = useToast();
 *   showToast("Saved!", "success");   // or "error" | "info"
 *   return <View>...<ToastHost /></View>
 */
import React, { useState, useRef, useCallback } from "react";
import { Text, Animated, StyleSheet } from "react-native";

export function useToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info"); // success | error | info
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const showToast = useCallback((msg, kind = "info") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(msg);
    setType(kind);
    setVisible(true);
    fadeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  }, [fadeAnim]);

  const ToastHost = useCallback(() => {
    if (!visible) return null;
    const bg =
      type === "success" ? "#10B981" : type === "error" ? "#DC2626" : "#374151";
    return (
      <Animated.View style={[styles.toast, { backgroundColor: bg, opacity: fadeAnim }]}>
        <Text style={styles.toastText}>{message}</Text>
      </Animated.View>
    );
  }, [visible, message, type, fadeAnim]);

  return { showToast, ToastHost };
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    bottom: 90,
    left: 20,
    right: 20,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: { color: "#fff", fontWeight: "700", fontSize: 14, textAlign: "center" },
});
