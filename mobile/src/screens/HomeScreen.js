import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";

export default function HomeScreen({ navigation }) {
  const [joinCode, setJoinCode] = useState("");

  const handleJoinRoom = () => {
    const trimmed = joinCode.trim().toUpperCase();

    if (!trimmed) {
      Alert.alert("Missing code", "Please enter a room code.");
      return;
    }

    navigation.navigate("Group", { joinCode: trimmed });
    setJoinCode("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Jiak Hami?</Text>
      <Text style={styles.subtitle}>Choose how you want to decide today 🍽️</Text>

      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate("Own")}
      >
        <Text style={styles.cardTitle}>Create for Own</Text>
        <Text style={styles.cardText}>
          Decide food for yourself with random spin, favorites, or categories.
        </Text>
      </Pressable>

      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate("Group")}
      >
        <Text style={styles.cardTitle}>Create for Group</Text>
        <Text style={styles.cardText}>
          Create a voting room and let your group decide together.
        </Text>
      </Pressable>

      <View style={styles.joinBox}>
        <Text style={styles.joinTitle}>Join Room</Text>
        <View style={styles.joinRow}>
          <TextInput
            value={joinCode}
            onChangeText={setJoinCode}
            placeholder="Enter room code"
            autoCapitalize="characters"
            style={styles.input}
          />
          <Pressable style={styles.joinButton} onPress={handleJoinRoom}>
            <Text style={styles.joinButtonText}>Join</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: "#666",
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#f8f8f8",
    padding: 20,
    borderRadius: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  joinBox: {
    marginTop: 8,
    backgroundColor: "#fff7ef",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#ffd9b3",
  },
  joinTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  joinRow: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  joinButton: {
    backgroundColor: "#ff6600",
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  joinButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});