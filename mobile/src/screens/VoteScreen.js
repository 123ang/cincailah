/**
 * "We Fight" voting screen — mirrors web VotePageClient.
 * Starts a vote session, polls results every 3s, and uses the server winner.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { apiFetch } from "../lib/api";

const SAMBAL = "#FF5A00";

export default function VoteScreen({ route, navigation }) {
  const { groupId, groupName, filters = {}, decisionId: initialDecisionId = null } = route.params || {};

  const [phase, setPhase] = useState("starting"); // starting | voting | results
  const [decisionId, setDecisionId] = useState(null);
  const [options, setOptions] = useState([]);
  const [myVoteOptionId, setMyVoteOptionId] = useState(null);
  const [results, setResults] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(900);
  const [error, setError] = useState(null);

  const pollRef = useRef(null);
  const countdownRef = useRef(null);

  const normalizeOptions = useCallback((payload) => {
    const rawOptions = Array.isArray(payload?.options)
      ? payload.options
      : Array.isArray(payload?.decision?.decisionOptions)
        ? payload.decision.decisionOptions
        : [];

    return rawOptions.map((opt) => {
      const votes = Array.isArray(opt?.votes) ? opt.votes : [];
      const yesCount =
        typeof opt?.yesCount === "number"
          ? opt.yesCount
          : votes.filter((v) => v?.vote === "yes").length;
      const noCount =
        typeof opt?.noCount === "number"
          ? opt.noCount
          : votes.filter((v) => v?.vote === "no").length;
      return { ...opt, yesCount, noCount };
    });
  }, []);

  const isVoteClosed = useCallback((payload) => {
    if (typeof payload?.closed === "boolean") return payload.closed;
    if (typeof payload?.isExpired === "boolean") return payload.isExpired;
    return false;
  }, []);

  const fetchResults = useCallback(async (id, final = false) => {
    try {
      const { data, ok } = await apiFetch(`/api/vote/${id}`);
      if (!ok) return null;
      let payload = data;
      if (isVoteClosed(data) && !data?.winner) {
        const resolved = await apiFetch(`/api/vote/${id}/resolve`, {
          method: "POST",
        });
        if (resolved.ok) {
          payload = { ...data, winner: resolved.data?.winner ?? null };
        }
      }
      if (payload?.expiresAt) {
        const left = Math.max(0, Math.round((new Date(payload.expiresAt).getTime() - Date.now()) / 1000));
        setSecondsLeft(left);
      }
      const nextOptions = normalizeOptions(payload);
      setOptions(nextOptions);
      if (payload?.winner) {
        clearInterval(pollRef.current);
        clearInterval(countdownRef.current);
        navigation.replace("FinalDecision", {
          winnerName: payload.winner?.name,
          winnerVotes: nextOptions.find((o) => o.restaurantId === payload.winner?.id)?.yesCount ?? 0,
        });
        return payload;
      }
      if (final || isVoteClosed(payload)) {
        clearInterval(pollRef.current);
        setResults(nextOptions);
        setPhase("results");
      }
      return payload;
    } catch (error) {
      console.debug('Failed to fetch vote results', error);
      return null;
    }
  }, [isVoteClosed, navigation, normalizeOptions]);

  const startTimers = useCallback((id, expiresAtValue) => {
    clearInterval(pollRef.current);
    clearInterval(countdownRef.current);

    pollRef.current = setInterval(() => fetchResults(id), 3000);

    const expiresAt = expiresAtValue ? new Date(expiresAtValue).getTime() : Date.now() + 900_000;
    const tick = () => {
      const left = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        clearInterval(countdownRef.current);
        clearInterval(pollRef.current);
        fetchResults(id, true);
      }
    };

    tick();
    countdownRef.current = setInterval(tick, 1000);
  }, [fetchResults]);

  const startVote = useCallback(async () => {
    try {
      if (initialDecisionId) {
        setDecisionId(initialDecisionId);
        setPhase("voting");
        const payload = await fetchResults(initialDecisionId);
        startTimers(initialDecisionId, payload?.expiresAt);
        return;
      }

      const { data, ok } = await apiFetch("/api/vote/start", {
        method: "POST",
        body: { groupId, filters },
      });
      if (!ok) {
        setError(data?.error || "Failed to start vote.");
        return;
      }
      setDecisionId(data.decisionId);
      setPhase("voting");
      fetchResults(data.decisionId);
      startTimers(data.decisionId, data.expiresAt);
    } catch {
      setError("Network error. Check your connection.");
    }
  }, [fetchResults, filters, groupId, initialDecisionId, startTimers]);

  // Start vote on mount
  useEffect(() => {
    startVote();
    return () => {
      clearInterval(pollRef.current);
      clearInterval(countdownRef.current);
    };
  }, [startVote]);

  const castVote = async (optionId) => {
    setMyVoteOptionId(optionId);
    await apiFetch(`/api/vote/${decisionId}`, {
      method: "POST",
      body: { optionId, vote: "yes" },
    });
    fetchResults(decisionId);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (phase === "starting") {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={SAMBAL} />
        <Text style={styles.loadingText}>Starting vote for {groupName}…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorEmoji}>😔</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === "results") {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Results 📊</Text>
        <Text style={styles.sub}>Waiting for the server to finalize the winner.</Text>
        <FlatList
          data={results}
          keyExtractor={(o) => o.id}
          renderItem={({ item }) => (
            <View style={styles.resultItem}>
              <Text style={styles.resultName}>{item.restaurant?.name}</Text>
              <Text style={styles.resultVotes}>👍 {item.yesCount ?? 0}</Text>
            </View>
          )}
          style={{ marginVertical: 16 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.heading}>⚔️ We Fight</Text>
        <View style={styles.timer}>
          <Text style={styles.timerText}>{formatTime(secondsLeft)}</Text>
        </View>
      </View>
      <Text style={styles.sub}>Pick one spot only. You can change your vote before time ends.</Text>

      <FlatList
        data={options}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => {
          const voted = myVoteOptionId === item.id;
          return (
            <View style={styles.optionCard}>
              <Text style={styles.optionName}>{item.restaurant?.name}</Text>
              <Text style={styles.optionMeta}>
                {(item.restaurant?.cuisineTags ?? []).join(", ")} ·{" "}
                RM{item.restaurant?.priceMin}–{item.restaurant?.priceMax}
              </Text>
              <View style={styles.voteRow}>
                <Pressable
                  style={[styles.voteBtn, voted && styles.voteBtnYes]}
                  onPress={() => castVote(item.id)}
                >
                  <Text style={styles.voteBtnText}>{voted ? "✓ Picked" : "Pick"} ({item.yesCount ?? 0})</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No vote options yet. Pull to retry in a moment.</Text>
          </View>
        }
      />

    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 16 },
  loadingText: { fontSize: 15, color: "#6B7280", marginTop: 8 },
  errorEmoji: { fontSize: 48 },
  errorText: { fontSize: 15, color: "#374151", textAlign: "center" },
  container: { flex: 1, backgroundColor: "#F9FAFB", paddingHorizontal: 20, paddingTop: 20 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  heading: { fontSize: 22, fontWeight: "800", color: "#111827" },
  timer: { backgroundColor: SAMBAL, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6 },
  timerText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  sub: { fontSize: 13, color: "#6B7280", marginBottom: 16 },
  optionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  optionName: { fontSize: 17, fontWeight: "700", color: "#111827" },
  optionMeta: { fontSize: 12, color: "#9CA3AF", marginTop: 2, marginBottom: 12 },
  voteRow: { flexDirection: "row", gap: 10 },
  voteBtn: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  voteBtnYes: { backgroundColor: "#D1FAE5" },
  voteBtnNo: { backgroundColor: "#FEE2E2" },
  voteBtnText: { fontWeight: "700", fontSize: 13, color: "#374151" },
  emptyWrap: { paddingVertical: 28, alignItems: "center" },
  emptyText: { fontSize: 13, color: "#6B7280", textAlign: "center" },
  finishBtn: {
    position: "absolute",
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: "#111827",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  finishBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  resultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  resultName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  resultVotes: { fontSize: 16, fontWeight: "700", color: "#45B619" },
  tieBox: {
    backgroundColor: "#FEF3C7",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  tieTxt: { fontSize: 20, fontWeight: "800", color: "#92400E" },
  tieSub: { fontSize: 14, color: "#78350F", marginTop: 4, textAlign: "center" },
  btn: {
    backgroundColor: SAMBAL,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
