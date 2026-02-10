import { useEffect, useState, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import {
  fetchLiftDisruptions,
  searchStations,
  findDisruptionsForStation,
} from "../services/liftDisruptions";

export default function LiftDisruptionsScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [stationDisruptions, setStationDisruptions] = useState([]);
  const [allDisruptions, setAllDisruptions] = useState([]);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchingStations, setSearchingStations] = useState(false);
  const [error, setError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceRef = useRef(null);

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

  const handleQueryChange = (text) => {
    setQuery(text);
    setSelectedStation(null);
    setStationDisruptions([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length < 2) {
      setSuggestions([]);
      setDropdownOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearchingStations(true);
      const results = await searchStations(text);
      setSuggestions(results);
      setDropdownOpen(results.length > 0);
      setSearchingStations(false);
    }, 300);
  };

  const handleSelectStation = (station) => {
    setQuery(station.name);
    setSelectedStation(station);
    setSuggestions([]);
    setDropdownOpen(false);

    const disruptions = findDisruptionsForStation(
      allDisruptions,
      station.name
    );
    setStationDisruptions(disruptions);
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString();
  };

  const hasDisruptions = stationDisruptions.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Lift Disruptions</Text>
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#003688" />
          <Text style={styles.loadingText}>Loading disruption data...</Text>
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

      {!loading && !error && (
        <>
          <View style={styles.searchWrapper}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a station..."
              value={query}
              onChangeText={handleQueryChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchingStations && (
              <ActivityIndicator
                size="small"
                color="#003688"
                style={styles.searchSpinner}
              />
            )}

            {dropdownOpen && (
              <View style={styles.dropdown}>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  nestedScrollEnabled
                  style={styles.dropdownScroll}
                >
                  {suggestions.map((station, index) => (
                    <Pressable
                      key={`${station.naptanId}-${index}`}
                      style={({ pressed }) => [
                        styles.dropdownItem,
                        pressed && styles.dropdownItemPressed,
                      ]}
                      onPress={() => handleSelectStation(station)}
                    >
                      <Text style={styles.dropdownText}>{station.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {!selectedStation && (
            <View style={styles.centered}>
              <Text style={styles.hint}>
                Enter a station name above to check lift status.
              </Text>
              <Text style={styles.totalCount}>
                {allDisruptions.length} disruption
                {allDisruptions.length !== 1 ? "s" : ""} currently reported
                across the network.
              </Text>
            </View>
          )}

          {selectedStation && (
            <ScrollView
              style={styles.resultsScroll}
              contentContainerStyle={styles.resultsContent}
            >
              <View
                style={[
                  styles.statusCard,
                  hasDisruptions
                    ? styles.statusCardDisrupted
                    : styles.statusCardOk,
                ]}
              >
                <Text style={styles.cardStationName}>
                  {selectedStation.name}
                </Text>

                <View
                  style={[
                    styles.statusBadge,
                    hasDisruptions
                      ? styles.badgeDisrupted
                      : styles.badgeOk,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      hasDisruptions
                        ? styles.badgeTextDisrupted
                        : styles.badgeTextOk,
                    ]}
                  >
                    {hasDisruptions
                      ? `${stationDisruptions.length} lift disruption${stationDisruptions.length !== 1 ? "s" : ""}`
                      : "No lift disruptions"}
                  </Text>
                </View>

                {fetchedAt && (
                  <Text style={styles.cardTimestamp}>
                    Status checked: {formatDate(fetchedAt)}
                  </Text>
                )}
              </View>

              {stationDisruptions.map((d, i) => (
                <View key={`disruption-${i}`} style={styles.disruptionCard}>
                  <View style={styles.disruptionHeader}>
                    <Text style={styles.disruptionRoute}>
                      {d.outageStartArea} → {d.outageEndArea}
                    </Text>
                  </View>
                  <Text style={styles.disruptionMessage}>{d.message}</Text>
                </View>
              ))}

              {!hasDisruptions && (
                <View style={styles.allClearCard}>
                  <Text style={styles.allClearText}>
                    All lifts at {selectedStation.name} are currently
                    operational. Step-free access should be available.
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </>
      )}
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
  searchWrapper: {
    marginHorizontal: 16,
    zIndex: 10,
  },
  searchInput: {
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  searchSpinner: {
    position: "absolute",
    right: 12,
    top: 14,
  },
  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 4,
    maxHeight: 220,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  dropdownScroll: {
    maxHeight: 220,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemPressed: {
    backgroundColor: "#e8eef7",
  },
  dropdownText: {
    fontSize: 15,
    color: "#333",
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
  hint: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  totalCount: {
    marginTop: 8,
    fontSize: 13,
    color: "#999",
  },
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusCard: {
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 5,
  },
  statusCardDisrupted: {
    backgroundColor: "#fff5f5",
    borderLeftColor: "#d32f2f",
  },
  statusCardOk: {
    backgroundColor: "#f0faf0",
    borderLeftColor: "#2e7d32",
  },
  cardStationName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003688",
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeDisrupted: {
    backgroundColor: "#d32f2f",
  },
  badgeOk: {
    backgroundColor: "#2e7d32",
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  badgeTextDisrupted: {
    color: "#fff",
  },
  badgeTextOk: {
    color: "#fff",
  },
  cardTimestamp: {
    fontSize: 12,
    color: "#888",
  },
  disruptionCard: {
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
  disruptionHeader: {
    marginBottom: 8,
  },
  disruptionRoute: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
  },
  disruptionMessage: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  allClearCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#2e7d32",
  },
  allClearText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
});
