/**
 * Winner reveal screen — logo roulette result flow.
 * The answer stays inside the spin screen instead of appearing as a separate card.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Animated,
  Alert,
  ScrollView,
  Easing,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useAudioPlayer } from "expo-audio";
import { apiFetch } from "../lib/api";

const LOGO = require("../../assets/brand/cincailah-logo.jpeg");

const BRAND = {
  orange: "#FF5A00",
  orangeDark: "#E64000",
  orangeSoft: "#FFE1CC",
  cream: "#FFF4DF",
  creamDeep: "#FFE2BC",
  ink: "#251308",
  muted: "#835F4B",
  green: "#45B619",
  blue: "#078BCE",
  purple: "#6D2CB7",
  red: "#E9321B",
  yellow: "#FFC233",
  white: "#FFFFFF",
};

export default function WinnerScreen({ route, navigation }) {
  const {
    winner: initialWinner,
    groupId,
    maxReroll = 3,
    excludeIds: initialExcludeIds = [],
    filters = {},
  } = route.params || {};

  const [winner, setWinner] = useState(initialWinner);
  const [excludeIds, setExcludeIds] = useState(initialExcludeIds);
  const [rerollsUsed, setRerollsUsed] = useState(0);
  const [loading, setLoading] = useState(false);

  const wheelSpin = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;
  const tick = useRef(new Animated.Value(0)).current;
  const player = useAudioPlayer(require("../../assets/sounds/winner.mp3"));

  useEffect(() => {
    wheelSpin.setValue(0);
    reveal.setValue(0);
    tick.setValue(0);

    Animated.parallel([
      Animated.timing(wheelSpin, {
        toValue: 1,
        duration: 2300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.loop(
          Animated.sequence([
            Animated.timing(tick, {
              toValue: 1,
              duration: 90,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(tick, {
              toValue: 0,
              duration: 90,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 12 }
        ),
        Animated.timing(reveal, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    try {
      player.play();
    } catch (error) {
      console.debug("Winner sound playback unavailable", error);
    }
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.debug("Winner haptics unavailable", error);
    }
  }, [player, reveal, tick, wheelSpin, winner]);

  const handleReroll = async () => {
    if (rerollsUsed >= maxReroll || loading || !winner) return;
    setLoading(true);
    try {
      const allowRepeat = Boolean(filters?.allowRepeatPicks);
      const nextExclude = allowRepeat ? excludeIds : [...excludeIds, winner.id];
      const { data, ok } = await apiFetch("/api/decide", {
        method: "POST",
        body: { groupId, filters, excludeIds: nextExclude },
      });
      if (!ok) {
        Alert.alert("Aiyah...", data?.error || "No more restaurants.");
        return;
      }
      setWinner(data.winner);
      if (!allowRepeat) {
        setExcludeIds(nextExclude);
      }
      setRerollsUsed((n) => n + 1);
    } finally {
      setLoading(false);
    }
  };

  const rerollsLeft = Math.max(0, maxReroll - rerollsUsed);
  const cuisineTags = Array.isArray(winner?.cuisineTags) ? winner.cuisineTags : [];
  const vibeTags = Array.isArray(winner?.vibeTags) ? winner.vibeTags : [];

  const wheelRotate = wheelSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "1780deg"],
  });
  const needleRotate = tick.interpolate({
    inputRange: [0, 1],
    outputRange: ["-5deg", "5deg"],
  });
  const revealTranslate = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 0],
  });

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.hero}>
        <View style={styles.whiteArc} />
        <View style={styles.softOrb} />

        <View style={styles.topRow}>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>You Pick</Text>
          </View>
          {rerollsUsed > 0 && (
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>Reroll {rerollsUsed}/{maxReroll}</Text>
            </View>
          )}
        </View>

        <Text style={styles.kicker}>FAST FOOD ROULETTE</Text>
        <Text style={styles.title}>Spin once. Go makan.</Text>
        <Text style={styles.subtitle}>The needle lands and the answer stays on the wheel screen.</Text>

        <View style={styles.wheelStage}>
          <Animated.View style={[styles.needle, { transform: [{ rotate: needleRotate }] }]}>
            <View style={styles.needleShape} />
            <View style={styles.needleDot} />
          </Animated.View>

          <Animated.View style={[styles.logoWheel, { transform: [{ rotate: wheelRotate }] }]}>
            <Animated.Image source={LOGO} style={styles.logoImage} resizeMode="cover" />
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.answerDock,
            {
              opacity: reveal,
              transform: [{ translateY: revealTranslate }],
            },
          ]}
        >
          <Text style={styles.answerKicker}>The needle says</Text>
          <Text style={styles.name} selectable>{winner?.name ?? "Unknown"}</Text>
          {cuisineTags.length > 0 && (
            <Text style={styles.cuisine}>{cuisineTags.join(" · ")}</Text>
          )}

          <View style={styles.tagRow}>
            {winner?.halal && <Chip label="Halal" color="#D1FAE5" textColor="#065F46" />}
            {winner?.vegOptions && <Chip label="Veg options" color="#D1FAE5" textColor="#065F46" />}
            {vibeTags.slice(0, 3).map((t) => (
              <Chip key={t} label={t} color="#DBEAFE" textColor="#1E40AF" />
            ))}
          </View>

          <View style={styles.metaRow}>
            <MetaBox label="Budget" value={`RM${winner?.priceMin ?? 0}-${winner?.priceMax ?? 0}`} />
            <MetaBox label="Walk" value={`${winner?.walkMinutes ?? "?"} min`} />
          </View>

          <View style={styles.actionRow}>
            {winner?.mapsUrl ? (
              <Pressable style={styles.goBtn} onPress={() => Linking.openURL(winner.mapsUrl)}>
                <Text style={styles.goBtnText}>Let us go</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.goBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.goBtnText}>Confirmed</Text>
              </Pressable>
            )}

            <Pressable
              style={[styles.rerollBtn, (rerollsLeft <= 0 || loading) && styles.rerollBtnDisabled]}
              onPress={handleReroll}
              disabled={rerollsLeft <= 0 || loading}
            >
              {loading ? (
                <ActivityIndicator color={BRAND.ink} size="small" />
              ) : (
                <>
                  <Text style={styles.rerollBtnText}>Spin again</Text>
                  <Text style={styles.rerollSub}>
                    {rerollsLeft > 0 ? `${rerollsLeft} left` : "No more"}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>

      <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backBtnText}>Back to filters</Text>
      </Pressable>
    </ScrollView>
  );
}

function Chip({ label, color, textColor }) {
  return (
    <View style={[styles.chip, { backgroundColor: color }]}>
      <Text style={[styles.chipText, { color: textColor }]}>{label}</Text>
    </View>
  );
}

function MetaBox({ label, value }) {
  return (
    <View style={styles.metaBox}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: BRAND.cream },
  container: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
    justifyContent: "center",
    gap: 16,
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: BRAND.orange,
    borderRadius: 32,
    padding: 20,
    minHeight: 690,
  },
  whiteArc: {
    position: "absolute",
    width: 310,
    height: 310,
    borderRadius: 155,
    borderWidth: 32,
    borderColor: "rgba(255,255,255,0.72)",
    borderLeftColor: "transparent",
    right: -156,
    top: 116,
    transform: [{ rotate: "-26deg" }],
  },
  softOrb: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.1)",
    left: -55,
    bottom: 150,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  statusPill: {
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusText: {
    color: BRAND.white,
    fontSize: 11,
    fontWeight: "900",
  },
  kicker: {
    alignSelf: "flex-start",
    marginTop: 26,
    color: BRAND.white,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  title: {
    maxWidth: 260,
    marginTop: 14,
    color: BRAND.white,
    fontSize: 43,
    lineHeight: 42,
    fontWeight: "900",
    letterSpacing: -1.3,
  },
  subtitle: {
    maxWidth: 265,
    marginTop: 10,
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "800",
  },
  wheelStage: {
    alignSelf: "center",
    width: 282,
    height: 282,
    marginTop: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  logoWheel: {
    width: 258,
    height: 258,
    borderRadius: 129,
    borderWidth: 9,
    borderColor: BRAND.white,
    overflow: "hidden",
    backgroundColor: BRAND.orange,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  needle: {
    position: "absolute",
    top: -4,
    zIndex: 5,
    width: 42,
    height: 76,
    alignItems: "center",
  },
  needleShape: {
    width: 42,
    height: 76,
    backgroundColor: BRAND.white,
    borderRadius: 18,
    transform: [{ scaleX: 0.72 }],
  },
  needleDot: {
    position: "absolute",
    top: 20,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: BRAND.orange,
  },
  answerDock: {
    marginTop: -38,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.96)",
    padding: 16,
  },
  answerKicker: {
    color: BRAND.orangeDark,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  name: {
    color: BRAND.ink,
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -0.9,
    marginTop: 3,
  },
  cuisine: {
    fontSize: 14,
    color: BRAND.muted,
    marginTop: 5,
    fontWeight: "800",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "800",
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 15,
  },
  metaBox: {
    flex: 1,
    backgroundColor: "#FFF7EB",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 11,
    color: BRAND.muted,
    marginBottom: 2,
    fontWeight: "800",
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "900",
    color: BRAND.ink,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  goBtn: {
    flex: 1,
    backgroundColor: BRAND.green,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  goBtnText: {
    color: BRAND.white,
    fontWeight: "900",
    fontSize: 14,
  },
  rerollBtn: {
    flex: 1,
    backgroundColor: "#F4EADC",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  rerollBtnDisabled: {
    opacity: 0.5,
  },
  rerollBtnText: {
    fontWeight: "900",
    color: BRAND.ink,
    fontSize: 14,
  },
  rerollSub: {
    fontSize: 11,
    color: BRAND.muted,
    marginTop: 2,
    fontWeight: "800",
  },
  backBtn: {
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtnText: {
    color: BRAND.muted,
    fontSize: 14,
    fontWeight: "800",
  },
});
