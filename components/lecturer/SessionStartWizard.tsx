'use client'

import { useState, useEffect } from 'react'
import { MapPin, Navigation, Clock, CheckCircle } from 'lucide-react'
import BrandLoader from '@/components/ui/BrandLoader'

const PRESETS = [
  { label: 'Small Classroom (30m)', value: 30 },
  { label: 'Medium Hall (60m)', value: 60 },
  { label: 'Large Hall (100m)', value: 100 },
  { label: 'Theatre (150m)', value: 150 },
]

export default function SessionStartWizard({ courses, lecturerId, activeAcademicSessionId, onSuccess }: any) {
  const [step, setStep] = useState(1) // 1: Select course & size, 2: GPS Check, 3: Walk back (if new), 4: Active
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [courseId, setCourseId] = useState(courses[0]?.id || '')
  const [presetSize, setPresetSize] = useState(PRESETS[0].value)
  const [duration, setDuration] = useState(60)

  const [startPoint, setStartPoint] = useState<{lat: number, lng: number} | null>(null)
  const [fingerprint, setFingerprint] = useState<any>(null)

  // Step 1 -> 2: Acquire initial GPS and check db
  const handleInitialGPS = () => {
    setLoading(true)
    setErrorMsg('')
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation not supported.')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setStartPoint(coords)
        
        try {
          const res = await fetch('/api/classrooms/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(coords)
          })
          const data = await res.json()
          
          if (data.found) {
            setFingerprint(data.fingerprint)
            // Skip walk step, go direct to confirm
            setStep(4)
          } else {
            // New location
            setStep(3)
          }
        } catch (e) {
          setErrorMsg('Failed to check classroom database.')
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        setErrorMsg('Please allow location access to start attendance.')
        setLoading(false)
      },
      { enableHighAccuracy: true }
    )
  }

  // Step 3 -> 4: Walk to back and record end point
  const handleEndPointAndStart = () => {
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const endCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        
        const geofencePoints = {
          f1: startPoint,
          f2: endCoords
        }

        await startSession(geofencePoints, null)
      },
      () => {
        setErrorMsg('Failed to fetch end location.')
        setLoading(false)
      },
      { enableHighAccuracy: true }
    )
  }

  const startSession = async (geofencePoints: any, fingerprintId: string | null = null) => {
    setLoading(true)
    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lecturer_id: lecturerId,
          course_id: courseId,
          academic_session_id: activeAcademicSessionId,
          start_lat: startPoint!.lat,
          start_lng: startPoint!.lng,
          preset_size: presetSize,
          duration_minutes: duration,
          geofence_points: geofencePoints,
          fingerprint_id: fingerprintId
        })
      })

      if (!res.ok) throw new Error((await res.json()).error)
      onSuccess?.()
    } catch (err: any) {
      setErrorMsg(err.message)
      setStep(1)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface p-8 rounded-2xl border border-purple-primary/30 shadow-2xl relative overflow-hidden">
      {/* Step Indicators */}
      <div className="flex gap-2 mb-8 justify-center">
        {[1,2,3].map(i => (
          <div key={i} className={`h-1 w-16 rounded-full ${step >= i ? 'bg-purple-accent' : 'bg-border-subtle'}`} />
        ))}
      </div>

      {errorMsg && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-3 rounded-lg border border-red-500/30">{errorMsg}</p>}

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <h2 className="text-2xl text-white font-bold text-center mb-8">Start Attendance</h2>
          
          <div>
            <label className="block text-xs uppercase tracking-widest text-text-muted font-bold mb-2">Select Course</label>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full bg-bg-primary border border-border-subtle rounded-xl px-4 py-4 text-white font-medium focus:border-purple-accent outline-none">
              {courses.map((c: any) => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-text-muted font-bold mb-2">Class Size</label>
              <select value={presetSize} onChange={(e) => setPresetSize(Number(e.target.value))} className="w-full bg-bg-primary border border-border-subtle rounded-xl px-4 py-4 text-white focus:border-purple-accent outline-none">
                {PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-text-muted font-bold mb-2">Duration (Mins)</label>
              <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full bg-bg-primary border border-border-subtle rounded-xl px-4 py-4 text-white focus:border-purple-accent outline-none" />
            </div>
          </div>

          <button onClick={handleInitialGPS} disabled={loading || !courseId} className="w-full mt-6 bg-purple-primary hover:bg-purple-accent disabled:opacity-50 text-white font-bold py-5 rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.3)] flex justify-center items-center gap-2 transition-all text-lg">
            {loading ? <BrandLoader size={20} /> : <><MapPin /> Acquire GPS & Verify</>}
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="text-center animate-in slide-in-from-right duration-500 py-6">
          <div className="w-20 h-20 bg-purple-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 text-purple-accent">
            <Navigation size={40} />
          </div>
          <h2 className="text-2xl text-white font-bold mb-3">New Classroom Detected</h2>
          <p className="text-text-muted mb-8 leading-relaxed max-w-sm mx-auto">
            We haven't recorded this hall before. Please walk to the exact back of the hall and tap confirm to establish the secure ellipse boundary.
          </p>

          <button onClick={handleEndPointAndStart} disabled={loading} className="w-full bg-purple-primary hover:bg-purple-accent disabled:opacity-50 text-white font-bold py-5 rounded-xl flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.3)]">
            {loading ? <BrandLoader size={20} /> : 'Confirm Back Boundary & Start'}
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="text-center animate-in slide-in-from-right duration-500 py-6">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-400">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl text-white font-bold mb-3">Classroom Verified</h2>
          <p className="text-text-muted mb-8 text-sm">Valid fingerprint found (Score: {fingerprint?.confidence_score}%). Boundaries automatically loaded.</p>
          <button onClick={() => startSession(fingerprint.geofence_points, fingerprint.id)} disabled={loading} className="w-full bg-purple-primary hover:bg-purple-accent disabled:opacity-50 text-white font-bold py-5 rounded-xl flex justify-center items-center gap-2">
            {loading ? <BrandLoader size={20} /> : 'Start Attendance Now'}
          </button>
        </div>
      )}
    </div>
  )
}
