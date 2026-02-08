type Coord = { lat?: any; lng?: any; latitude?: any; longitude?: any; type?: string; coordinates?: [any, any] } | [any, any];

export function normalizeCoord(input: Coord) {
  let lat: number | undefined, lng: number | undefined;

  if (Array.isArray(input)) {
    // Assume [lng, lat] array
    lng = parseFloat(String(input[0]));
    lat = parseFloat(String(input[1]));
  } else if (input && typeof input === 'object') {
    if (input.type === 'Point' && Array.isArray(input.coordinates)) {
      // GeoJSON
      lng = parseFloat(String(input.coordinates[0]));
      lat = parseFloat(String(input.coordinates[1]));
    } else {
      lat = input.lat ?? input.latitude;
      lng = input.lng ?? input.longitude;
      lat = lat !== undefined ? parseFloat(String(lat)) : undefined;
      lng = lng !== undefined ? parseFloat(String(lng)) : undefined;
    }
  }

  // Auto-swap if obviously reversed (common when lat looks like -122 and lng like 37)
  if (lat !== undefined && lng !== undefined) {
    const looksSwapped = (Math.abs(lat) > 90 && Math.abs(lng) <= 90) || (Math.abs(lat) <= 90 && Math.abs(lng) > 180);
    if (looksSwapped) [lat, lng] = [lng!, lat!];
  }

  if (lat === undefined || lng === undefined) return null;
  if (lat < -90 || lat > 90) return null;
  // Wrap longitude to [-180, 180]
  lng = ((((lng + 180) % 360) + 360) % 360) - 180;

  return { lat, lng };
}

export function logResultCoords(results: any[]) {
  results.forEach(r => {
    const p = normalizeCoord(r);
    console.debug('Result', r.id, p?.lat?.toFixed(6), p?.lng?.toFixed(6), r);
  });
}
