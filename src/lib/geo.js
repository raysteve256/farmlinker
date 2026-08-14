// Haversine distance in km between two lat/lng points.
export function distanceKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some(v => v === null || v === undefined)) return null
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function fmtDistance(km) {
  if (km === null || km === undefined) return null
  if (km < 1) return Math.round(km * 1000) + ' m away'
  return km.toFixed(1) + ' km away'
}

// Wraps the browser Geolocation API in a promise. Requires HTTPS (or
// localhost) and user permission — Netlify serves over HTTPS so this
// works in production.
export function requestBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Location is not supported on this device/browser')); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(new Error(err.message || 'Could not get your location')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  })
}
