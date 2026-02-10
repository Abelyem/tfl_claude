const TFL_LIFT_DISRUPTIONS_URL =
  "https://api.tfl.gov.uk/Disruptions/Lifts/v2/";

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

export function searchDisruptions(disruptions, query) {
  if (!query.trim()) return [];
  const lower = query.toLowerCase();
  return disruptions.filter(
    (d) =>
      d.stopPointName?.toLowerCase().includes(lower) ||
      d.naptanCode?.toLowerCase().includes(lower)
  );
}
