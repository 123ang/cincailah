import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { useAudioPlayer } from "expo-audio";

export default function FinalDecisionScreen({ route, navigation }) {
  const { winnerName = "No Winner", winnerVotes = 0 } = route.params || {};

  const scale = useSharedValue(0.8);

  const player = useAudioPlayer(require("../../assets/sounds/winner.mp3"));

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.12),
      withSpring(1)
    );

    try {
      player.play();
    } catch (e) {
      console.log("Sound play error:", e);
    }
  }, [player, scale]);

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <View style={styles.container}>
      <Text style={styles.topText}>Final Decision 🎉</Text>

      <Animated.View style={[styles.card, animatedCardStyle]}>
        <Text style={styles.emoji}>🏆</Text>
        <Text style={styles.winnerName}>{winnerName}</Text>
        <Text style={styles.voteText}>{winnerVotes} votes</Text>
      </Animated.View>

      <Pressable
        style={styles.button}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.buttonText}>Back to Group</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff7ef",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  topText: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 28,
    textAlign: "center",
  },
  card: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffd2a8",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  emoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  winnerName: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  voteText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  button: {
    marginTop: 28,
    backgroundColor: "#111",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});