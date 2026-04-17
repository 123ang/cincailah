import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Alert,
  Share,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const GROUP_STORAGE_KEY = "group_vote_data";

const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default function GroupScreen({ navigation, route }) {
  const [roomName, setRoomName] = useState("Lunch Vote");
  const [spotName, setSpotName] = useState("");
  const [spots, setSpots] = useState([]);
  const [roomCode, setRoomCode] = useState(generateRoomCode());

  useEffect(() => {
    if (route?.params?.joinCode) {
      const incomingCode = route.params.joinCode;

      if (incomingCode === roomCode) {
        Alert.alert("Room found", `Joined room: ${roomName}`);
      } else {
        Alert.alert("Room not found", "This is only local UI for now.");
      }
    }
  }, [route?.params?.joinCode, roomCode, roomName]);

  const saveGroupData = async (newRoomName, newSpots, newRoomCode) => {
    try {
      const payload = {
        roomName: newRoomName,
        spots: newSpots,
        roomCode: newRoomCode,
      };
      await AsyncStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.log("Error saving group data:", error);
    }
  };

  const loadGroupData = async () => {
    try {
      const data = await AsyncStorage.getItem(GROUP_STORAGE_KEY);

      if (data) {
        const parsed = JSON.parse(data);
        setRoomName(parsed.roomName || "Lunch Vote");
        setSpots(parsed.spots || []);
        setRoomCode(parsed.roomCode || generateRoomCode());
      } else {
        const newCode = generateRoomCode();
        setRoomName("Lunch Vote");
        setSpots([]);
        setRoomCode(newCode);
      }
    } catch (error) {
      console.log("Error loading group data:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadGroupData();
    }, [])
  );

  const updateRoomName = async (text) => {
    setRoomName(text);
    await saveGroupData(text, spots, roomCode);
  };

  const addSpot = async () => {
    const trimmedName = spotName.trim();
    if (!trimmedName) return;

    const newSpot = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
      name: trimmedName,
      votes: 0,
    };

    const updatedSpots = [newSpot, ...spots];
    setSpots(updatedSpots);
    setSpotName("");
    await saveGroupData(roomName, updatedSpots, roomCode);
  };

  const voteSpot = async (id) => {
    const updatedSpots = spots.map((spot) =>
      spot.id === id ? { ...spot, votes: spot.votes + 1 } : spot
    );
    setSpots(updatedSpots);
    await saveGroupData(roomName, updatedSpots, roomCode);
  };

  const deleteSpot = async (id) => {
    const updatedSpots = spots.filter((spot) => spot.id !== id);
    setSpots(updatedSpots);
    await saveGroupData(roomName, updatedSpots, roomCode);
  };

  const resetVotes = async () => {
    const updatedSpots = spots.map((spot) => ({ ...spot, votes: 0 }));
    setSpots(updatedSpots);
    await saveGroupData(roomName, updatedSpots, roomCode);
  };

  const clearAll = () => {
    Alert.alert(
      "Clear group data",
      "Are you sure you want to clear all spots and votes?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            const newCode = generateRoomCode();
            setRoomName("Lunch Vote");
            setSpots([]);
            setRoomCode(newCode);
            await saveGroupData("Lunch Vote", [], newCode);
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    const message = `🍽️ Join my Jiak Hami voting room!

Room: ${roomName}
Code: ${roomCode}

Open the app and enter this code to vote!`;

    try {
      await Share.share({ message });
    } catch (error) {
      console.log("Share error:", error);
    }
  };

  const getWinner = () => {
    if (spots.length === 0) return null;

    const maxVotes = Math.max(...spots.map((spot) => spot.votes));
    if (maxVotes === 0) return null;

    return spots.filter((spot) => spot.votes === maxVotes);
  };

  const winners = getWinner();

  const breakTieAndShowWinner = () => {
    if (!winners || winners.length <= 1) return;

    const randomWinner =
      winners[Math.floor(Math.random() * winners.length)];

    navigation.navigate("FinalDecision", {
      winnerName: randomWinner.name,
      winnerVotes: randomWinner.votes,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Group Vote</Text>
      <Text style={styles.subtitle}>Create a local lunch voting room 🍽️</Text>

      <Text style={styles.label}>Room Name</Text>
      <TextInput
        value={roomName}
        onChangeText={updateRoomName}
        placeholder="Enter room name"
        style={styles.roomInput}
      />

      <View style={styles.roomBox}>
        <View>
          <Text style={styles.roomCodeLabel}>Room Code</Text>
          <Text style={styles.roomCode}>{roomCode}</Text>
        </View>

        <Pressable style={styles.shareButton} onPress={handleShare}>
          <Text style={styles.shareButtonText}>Share Invite</Text>
        </Pressable>
      </View>

      <View style={styles.addSpotBox}>
        <Text style={styles.sectionTitle}>Add Spot</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={spotName}
            onChangeText={setSpotName}
            placeholder="Enter a food spot"
            style={styles.input}
          />
          <Pressable style={styles.addButton} onPress={addSpot}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={spots}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text>No spots added yet</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemLeft}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.votes}>Votes: {item.votes}</Text>
            </View>

            <View style={styles.itemRight}>
              <Pressable
                style={styles.voteButton}
                onPress={() => voteSpot(item.id)}
              >
                <Text style={styles.voteButtonText}>Vote</Text>
              </Pressable>

              <Pressable
                style={styles.deleteButton}
                onPress={() => deleteSpot(item.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <View style={styles.bottomArea}>
        <View style={styles.actionRow}>
          <Pressable style={styles.resetButton} onPress={resetVotes}>
            <Text style={styles.resetButtonText}>Reset Votes</Text>
          </Pressable>

          <Pressable style={styles.clearButton} onPress={clearAll}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </Pressable>
        </View>

        <View style={styles.winnerCard}>
          <Text style={styles.winnerTitle}>Current Winner</Text>

          {!winners ? (
            <Text style={styles.winnerText}>No winner yet</Text>
          ) : winners.length === 1 ? (
            <Text style={styles.winnerText}>
              🏆 {winners[0].name} ({winners[0].votes} votes)
            </Text>
          ) : (
            <>
              <Text style={styles.winnerText}>
                🤝 Tie: {winners.map((w) => w.name).join(", ")}
              </Text>

              <Pressable
                style={styles.tieButton}
                onPress={breakTieAndShowWinner}
              >
                <Text style={styles.tieButtonText}>Let Fate Decide 🎲</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  roomInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  roomBox: {
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roomCodeLabel: {
    fontSize: 13,
    color: "#666",
  },
  roomCode: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },
  shareButton: {
    backgroundColor: "#ff6600",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  shareButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  addSpotBox: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  addButton: {
    backgroundColor: "#111",
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  list: {
    flex: 1,
    marginTop: 6,
    marginBottom: 10,
  },
  listContent: {
    paddingBottom: 8,
  },
  item: {
    backgroundColor: "#f5f5f5",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemLeft: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
  },
  votes: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  itemRight: {
    gap: 8,
  },
  voteButton: {
    backgroundColor: "#ff6600",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  voteButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  deleteButton: {
    backgroundColor: "#ffe3e3",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#c62828",
    fontWeight: "700",
  },
  bottomArea: {
    gap: 10,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#e5e5e5",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  resetButtonText: {
    fontWeight: "700",
    color: "#333",
  },
  clearButton: {
    flex: 1,
    backgroundColor: "#ffe3e3",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  clearButtonText: {
    fontWeight: "700",
    color: "#c62828",
  },
  winnerCard: {
    backgroundColor: "#fff4e8",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ffd2a8",
  },
  winnerTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  winnerText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },
  tieButton: {
    marginTop: 10,
    backgroundColor: "#ff6600",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tieButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});