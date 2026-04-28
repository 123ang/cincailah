/**
 * "We Fight" voting screen — mirrors web VotePageClient.
 * Starts a vote session, polls results every 3s, handles tie-break.
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

const SAMBAL = "#DC2626";

export default function VoteScreen({ route, navigation }) {
  const { groupId, groupName, filters = {} } = route.params || {};

  const [phase, setPhase] = useState("starting"); // starting | voting | results
  const [decisionId, setDecisionId] = useState(null);
  const [options, setOptions] = useState([]);
  const [myVotes, setMyVotes] = useState({});
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
      if (!ok) return;
      const nextOptions = normalizeOptions(data);
      setOptions(nextOptions);
      if (final || isVoteClosed(data)) {
        clearInterval(pollRef.current);
        setResults(nextOptions);
        setPhase("results");
      }
    } catch (error) {
      console.debug('Failed to fetch vote results', error);
    }
  }, [isVoteClosed, normalizeOptions]);

  const startVote = useCallback(async () => {
    try {
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
      // Fetch initial options
      fetchResults(data.decisionId);
      // Poll every 3s
      pollRef.current = setInterval(() => fetchResults(data.decisionId), 3000);
      // Countdown
      const expiresAt = data.expiresAt ? new Date(data.expiresAt).getTime() : Date.now() + 900_000;
      countdownRef.current = setInterval(() => {
        const left = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
        setSecondsLeft(left);
        if (left <= 0) {
          clearInterval(countdownRef.current);
          clearInterval(pollRef.current);
          fetchResults(data.decisionId, true);
        }
      }, 1000);
    } catch {
      setError("Network error. Check your connection.");
    }
  }, [fetchResults, filters, groupId]);

  // Start vote on mount
  useEffect(() => {
    startVote();
    return () => {
      clearInterval(pollRef.current);
      clearInterval(countdownRef.current);
    };
  }, [startVote]);

  const castVote = async (optionId, vote) => {
    if (myVotes[optionId]) return; // already voted
    setMyVotes((prev) => ({ ...prev, [optionId]: vote }));
    await apiFetch(`/api/vote/${decisionId}`, {
      method: "POST",
      body: { optionId, vote },
    });
  };

  const finishEarly = () => {
    clearInterval(countdownRef.current);
    clearInterval(pollRef.current);
    fetchResults(decisionId, true);
  };

  const breakTie = (tied) => {
    const winner = tied[Math.floor(Math.random() * tied.length)];
    navigation.replace("FinalDecision", {
      winnerName: winner.restaurant?.name,
      winnerVotes: winner.yesCount,
    });
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
    const maxYes = Math.max(...results.map((o) => o.yesCount ?? 0), 1);
    const tied = results.filter((o) => (o.yesCount ?? 0) === maxYes && maxYes > 0);

    if (tied.length === 1) {
      navigation.replace("FinalDecision", {
        winnerName: tied[0].restaurant?.name,
        winnerVotes: tied[0].yesCount,
      });
      return null;
    }

    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Results 📊</Text>
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
        {tied.length > 1 && (
          <View style={styles.tieBox}>
            <Text style={styles.tieTxt}>🤝 It is a tie!</Text>
            <Text style={styles.tieSub}>{tied.map((t) => t.restaurant?.name).join(" vs ")}</Text>
            <Pressable style={[styles.btn, { marginTop: 14 }]} onPress={() => breakTie(tied)}>
              <Text style={styles.btnText}>Let Fate Decide 🎲</Text>
            </Pressable>
          </View>
        )}
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
      <Text style={styles.sub}>Thumb up to vote, thumb down to pass</Text>

      <FlatList
        data={options}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => {
          const voted = myVotes[item.id];
          return (
            <View style={styles.optionCard}>
              <Text style={styles.optionName}>{item.restaurant?.name}</Text>
              <Text style={styles.optionMeta}>
                {(item.restaurant?.cuisineTags ?? []).join(", ")} ·{" "}
                RM{item.restaurant?.priceMin}–{item.restaurant?.priceMax}
              </Text>
              <View style={styles.voteRow}>
                <Pressable
                  style={[styles.voteBtn, voted === "yes" && styles.voteBtnYes]}
                  onPress={() => castVote(item.id, "yes")}
                >
                  <Text style={styles.voteBtnText}>👍 Yes ({item.yesCount ?? 0})</Text>
                </Pressable>
                <Pressable
                  style={[styles.voteBtn, voted === "no" && styles.voteBtnNo]}
                  onPress={() => castVote(item.id, "no")}
                >
                  <Text style={styles.voteBtnText}>👎 No ({item.noCount ?? 0})</Text>
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

      <Pressable style={styles.finishBtn} onPress={finishEarly}>
        <Text style={styles.finishBtnText}>See Results Now</Text>
      </Pressable>
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
  resultVotes: { fontSize: 16, fontWeight: "700", color: "#10B981" },
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
