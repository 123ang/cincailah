import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

export default function FavoritesScreen() {
  const [spotName, setSpotName] = useState("");
  const [favorites, setFavorites] = useState([]);

  const loadFavorites = async () => {
    try {
      const data = await AsyncStorage.getItem("favorite_spots");
      if (data) {
        setFavorites(JSON.parse(data));
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.log("Error loading favorites:", error);
    }
  };

  const saveFavorites = async (newFavorites) => {
    try {
      await AsyncStorage.setItem("favorite_spots", JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.log("Error saving favorites:", error);
    }
  };

  const addFavorite = async () => {
    const trimmedName = spotName.trim();

    if (!trimmedName) return;

    const newSpot = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
      name: trimmedName,
    };

    const updatedFavorites = [newSpot, ...favorites];
    await saveFavorites(updatedFavorites);
    setSpotName("");
  };

  const deleteFavorite = async (id) => {
    const updatedFavorites = favorites.filter((item) => item.id !== id);
    await saveFavorites(updatedFavorites);
  };

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Favorite Spots</Text>

      <View style={styles.inputRow}>
        <TextInput
          value={spotName}
          onChangeText={setSpotName}
          placeholder="Enter a favorite spot"
          style={styles.input}
        />
        <Pressable style={styles.addButton} onPress={addFavorite}>
          <Text style={styles.addButtonText}>Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text>No favorite spots yet</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.name}>{item.name}</Text>
            <Pressable
              style={styles.deleteButton}
              onPress={() => deleteFavorite(item.id)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: "row",
    marginBottom: 20,
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
  addButton: {
    backgroundColor: "#111",
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  item: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: "#ffdddd",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  deleteButtonText: {
    color: "#c62828",
    fontWeight: "600",
  },
});