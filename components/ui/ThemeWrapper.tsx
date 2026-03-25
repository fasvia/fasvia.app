'use client'

import { useEffect, useState } from 'react'

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : null;
}

import PullToRefresh from './PullToRefresh'

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [themeCache, setThemeCache] = useState<{primary: string, accent: string} | null>(null)

  useEffect(() => {
    async function loadTheme() {
      try {
        const response = await fetch('/api/schools/theme')
        if (!response.ok) return // Silent fail
        const data = await response.json()
        if (data.school?.primary_colour && data.school?.secondary_colour) {
          setThemeCache({
            primary: hexToRgb(data.school.primary_colour) || '124 58 237',
            accent: hexToRgb(data.school.secondary_colour) || '168 85 247'
          })
        }
      } catch (e) {
        console.warn("Could not fetch white-label theme")
      }
    }
    loadTheme()
  }, [])

  return (
    <>
      {themeCache && (
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --purple-primary: ${themeCache.primary};
              --purple-accent: ${themeCache.accent};
            }
          `
        }} />
      )}
      <PullToRefresh>
        {children}
      </PullToRefresh>
    </>
  )
}
