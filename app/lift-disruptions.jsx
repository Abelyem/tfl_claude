import { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  fetchLiftDisruptions,
  searchDisruptions,
} from "../services/liftDisruptions";

export default function LiftDisruptionsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [allDisruptions, setAllDisruptions] = useState([]);
  const [results, setResults] = useState([]);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { disruptions, fetchedAt: ts } = await fetchLiftDisruptions();
      setAllDisruptions(disruptions);
      setFetchedAt(ts);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (query.trim()) {
      setResults(searchDisruptions(allDisruptions, query));
    } else {
      setResults([]);
    }
  }, [query, allDisruptions]);

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString();
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.stationName}>{item.stopPointName}</Text>
      <Text style={styles.route}>
        {item.outageStartArea} → {item.outageEndArea}
      </Text>
      <Text style={styles.message}>{item.message}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Lift Disruptions</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search by station name..."
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {fetchedAt && (
        <Text style={styles.timestamp}>
          Last updated: {formatDate(fetchedAt)}
        </Text>
      )}

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#003688" />
          <Text style={styles.loadingText}>Loading disruptions...</Text>
        </View>
      )}

      {error && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={load} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && query.trim() !== "" && results.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.noResults}>
            No lift disruptions found for "{query}".
          </Text>
        </View>
      )}

      {!loading && !error && !query.trim() && (
        <View style={styles.centered}>
          <Text style={styles.noResults}>
            Enter a station name above to check lift status.
          </Text>
          <Text style={styles.totalCount}>
            {allDisruptions.length} disruption
            {allDisruptions.length !== 1 ? "s" : ""} currently reported.
          </Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item, index) =>
          `${item.naptanCode}-${item.outageStartArea}-${index}`
        }
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: "#003688",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#003688",
  },
  searchInput: {
    marginHorizontal: 16,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  timestamp: {
    marginHorizontal: 16,
    marginTop: 8,
    fontSize: 12,
    color: "#666",
  },
  centered: {
    alignItems: "center",
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  errorText: {
    fontSize: 14,
    color: "#d32f2f",
    textAlign: "center",
    marginHorizontal: 16,
  },
  retryButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#003688",
    borderRadius: 6,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  noResults: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  totalCount: {
    marginTop: 8,
    fontSize: 13,
    color: "#999",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#d32f2f",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  stationName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#003688",
    marginBottom: 4,
  },
  route: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
});
