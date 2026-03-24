'use client'

import { useState, useEffect } from 'react'
import { Palette, Save } from 'lucide-react'
import BrandLoader from '@/components/ui/BrandLoader'

// Helper to convert hex to rgb string for Tailwind variables
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : null;
}

export default function ThemeSettings() {
  const [primary, setPrimary] = useState('#7C3AED')
  const [accent, setAccent] = useState('#A855F7')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch('/api/schools/theme').then(r => r.json()).then(data => {
      if (data.school) {
        if (data.school.primary_color) setPrimary(data.school.primary_color)
        if (data.school.accent_color) setAccent(data.school.accent_color)
      }
      setFetching(false)
    })
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      await fetch('/api/schools/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primary_color: primary, accent_color: accent })
      })
      alert('Theme updated successfully! Refresh to apply globally.')
    } catch {
      alert('Failed to update theme')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="p-8 text-center text-text-muted"><BrandLoader size={48} className="mx-auto" /></div>

  return (
    <div className="bg-surface p-6 rounded-2xl border border-border-subtle shadow-xl">
      <h3 className="text-xl text-white font-bold mb-2 flex items-center gap-2"><Palette className="text-purple-accent"/> White-Label Branding</h3>
      <p className="text-text-muted text-sm mb-6">Customize the app colors to match your university's brand guidelines.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
           <label className="text-xs text-text-muted uppercase tracking-widest font-bold mb-2 block">Primary Color</label>
           <div className="flex gap-4 items-center">
             <input type="color" value={primary} onChange={e => setPrimary(e.target.value)} className="w-14 h-14 rounded-lg cursor-pointer bg-bg-primary border-0" />
             <input type="text" value={primary} onChange={e => setPrimary(e.target.value)} className="flex-1 bg-bg-primary border border-border-subtle rounded-xl px-4 py-3 text-white uppercase font-bold" />
           </div>
        </div>
        <div>
           <label className="text-xs text-text-muted uppercase tracking-widest font-bold mb-2 block">Secondary / Accent Color</label>
           <div className="flex gap-4 items-center">
             <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="w-14 h-14 rounded-lg cursor-pointer bg-bg-primary border-0" />
             <input type="text" value={accent} onChange={e => setAccent(e.target.value)} className="flex-1 bg-bg-primary border border-border-subtle rounded-xl px-4 py-3 text-white uppercase font-bold" />
           </div>
        </div>
      </div>

      <div className="p-4 bg-bg-primary border border-border-subtle rounded-xl mb-6">
        <p className="text-xs text-text-muted uppercase tracking-widest font-bold mb-4">Live Preview</p>
        <div className="flex gap-4">
          <button style={{ backgroundColor: primary }} className="px-6 py-2 rounded-lg text-white font-bold opacity-90 hover:opacity-100">Primary Button</button>
          <button style={{ backgroundColor: accent }} className="px-6 py-2 rounded-lg text-white font-bold opacity-90 hover:opacity-100">Accent Button</button>
        </div>
      </div>

      <button onClick={handleSave} disabled={loading} className="w-full bg-purple-primary hover:bg-purple-accent text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
        {loading ? <BrandLoader size={18} /> : <><Save size={18}/> Publish Brand Colors</>}
      </button>
    </div>
  )
}
