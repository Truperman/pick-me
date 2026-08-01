// Small geo helpers used both for the "approximate location" privacy offset
// and for client-side distance display.

/** Roughly jitter a lat/lng by up to `km` kilometers, for privacy-preserving
 * "approximate location" pins. Deterministic-ish is not required for MVP. */
export function jitterCoordinate(lat: number, lng: number, km: number) {
  if (km <= 0) return { lat, lng };
  const earthRadiusKm = 6371;
  const distance = Math.random() * km;
  const bearing = Math.random() * 2 * Math.PI;

  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const angularDistance = distance / earthRadiusKm;

  const newLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
      Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearing)
  );
  const newLngRad =
    lngRad +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRad),
      Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(newLatRad)
    );

  return {
    lat: (newLatRad * 180) / Math.PI,
    lng: (newLngRad * 180) / Math.PI,
  };
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
