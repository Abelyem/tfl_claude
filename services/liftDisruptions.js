const TFL_LIFT_DISRUPTIONS_URL =
  "https://api.tfl.gov.uk/Disruptions/Lifts/v2/";
const TFL_STOPPOINT_SEARCH_URL =
  "https://api.tfl.gov.uk/StopPoint/Search/";

export async function fetchLiftDisruptions() {
  const response = await fetch(TFL_LIFT_DISRUPTIONS_URL);
  if (!response.ok) {
    throw new Error(`TfL API error: ${response.status}`);
  }
  const data = await response.json();
  return {
    disruptions: data,
    fetchedAt: new Date().toISOString(),
  };
}

export async function searchStations(query) {
  if (!query || query.trim().length < 2) return [];
  const url = `${TFL_STOPPOINT_SEARCH_URL}${encodeURIComponent(query)}?modes=tube,overground,dlr,elizabeth-line&tflOperatedNationalRailStationsOnly=false`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  return (data.matches || []).map((m) => ({
    id: m.icsId,
    name: m.name,
    naptanId: m.id,
  }));
}

export function findDisruptionsForStation(disruptions, stationName) {
  const lower = stationName.toLowerCase();
  return disruptions.filter(
    (d) => d.stopPointName?.toLowerCase().includes(lower)
  );
}
