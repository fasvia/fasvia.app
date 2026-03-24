/**
 * Fasvia Smart GPS & Geofencing System
 * Evaluates distances using the Haversine formula and checks Ellipse Boundaries.
 */

export const PRESETS = {
  Small: 30,
  Medium: 60,
  Large: 100,
  Theatre: 150
}

const TOLERANCE_METERS = 20

/**
 * Returns distance in meters between two coordinates.
 */
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth radius in meters
  const p1 = lat1 * Math.PI / 180
  const p2 = lat2 * Math.PI / 180
  const dp = (lat2 - lat1) * Math.PI / 180
  const dl = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Verifies if a student is within the classroom ellipse.
 * Focus 1: point A (Front of hall / Lecturer start)
 * Focus 2: point B (Back of hall / Lecturer end)
 * Distance constraint: Dist(P, A) + Dist(P, B) <= Dist(A, B) + PresetSize
 */
export function verifyGeofence(
  studentLat: number, studentLon: number, 
  f1Lat: number, f1Lon: number, 
  f2Lat: number, f2Lon: number, 
  presetSize: number
): 'inside' | 'boundary' | 'outside' {
  
  const distF1 = getDistance(studentLat, studentLon, f1Lat, f1Lon)
  const distF2 = getDistance(studentLat, studentLon, f2Lat, f2Lon)
  const coreDistance = getDistance(f1Lat, f1Lon, f2Lat, f2Lon)
  
  const studentTotal = distF1 + distF2
  const allowedTotal = coreDistance + presetSize
  
  if (studentTotal <= allowedTotal) {
    return 'inside'
  }
  
  if (studentTotal <= allowedTotal + TOLERANCE_METERS) {
    return 'boundary'
  }
  
  return 'outside'
}

/**
 * For circular classrooms where point A and B are identical (e.g. automatically recovered fingerprint).
 */
export function verifyCircularGeofence(
  studentLat: number, studentLon: number,
  centerLat: number, centerLon: number,
  radius: number
): 'inside' | 'boundary' | 'outside' {
  const dist = getDistance(studentLat, studentLon, centerLat, centerLon)
  
  if (dist <= radius) return 'inside'
  if (dist <= radius + TOLERANCE_METERS) return 'boundary'
  
  return 'outside'
}
