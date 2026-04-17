/**
 * Skeleton loader — animated grey shimmer.
 * Usage: <Skeleton width={200} height={20} borderRadius={8} />
 */
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style }) {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "#E5E7EB",
          opacity: anim,
        },
        style,
      ]}
    />
  );
}

/** Pre-built skeleton row for a restaurant / group card */
export function CardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width={56} height={56} borderRadius={28} />
      <View style={styles.lines}>
        <Skeleton width="60%" height={14} borderRadius={7} />
        <Skeleton width="40%" height={11} borderRadius={6} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 5 }) {
  return (
    <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  lines: { flex: 1, gap: 0 },
});
