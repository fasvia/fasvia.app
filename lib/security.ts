/**
 * Fasvia Anti-Fraud Security Module
 */

export async function generateDeviceFingerprint(): Promise<string> {
  const ua = navigator.userAgent
  const screenRes = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const lang = navigator.language
  const cores = navigator.hardwareConcurrency || 'unknown'
  const mem = (navigator as any).deviceMemory || 'unknown'

  let batteryHealth = 'unknown'
  try {
    const navAny = navigator as any
    if (navAny.getBattery) {
      const battery = await navAny.getBattery()
      batteryHealth = `${battery.level}-${battery.charging}`
    }
  } catch (e) {}

  // Basic base64 hash of combined signals creates a deterministic fingerprint for the device
  const rawString = `${ua}|${screenRes}|${tz}|${lang}|${cores}|${mem}|${batteryHealth}`
  return typeof btoa !== 'undefined' ? btoa(rawString) : rawString
}

export function detectEmulatorAndMocking(coords?: GeolocationCoordinates): string[] {
  const flags: string[] = []
  
  // 1. Emulator Signatures
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('sdk_gphone') || ua.includes('vbox86p') || ua.includes('emulator') || ua.includes('genymotion')) {
    flags.push('emulator_signature_detected')
  }

  // 2. Hardware inconsistencies (often emulators have 0 or very strange constraints)
  if (navigator.hardwareConcurrency === 1 && (navigator as any).deviceMemory === 1) {
    flags.push('suspicious_hardware_profile')
  }

  // 3. Mock Location heuristics
  if (coords) {
    // If accuracy is perfectly 0 or altitude is exactly 0.0 with high precision continuously, it's often a mock app.
    // iOS/Android true GPS usually fluctuates slightly.
    if (coords.accuracy === 0) {
      flags.push('mock_location_zero_accuracy')
    }
    // High-speed jumps (checked server-side ideally, but can be flagged)
  }

  // 4. Root detection (Web cannot natively detect OS root, but can check for missing standard web APIs that custom ROMs strip)
  
  return flags
}
