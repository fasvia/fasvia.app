'use client'

import { useState, useEffect } from 'react'
import Tesseract from 'tesseract.js'
import { useRouter } from 'next/navigation'
import { UploadCloud, CheckCircle, AlertCircle, FileText, Table } from 'lucide-react'
import BrandLoader from '@/components/ui/BrandLoader'

// Helper for digital PDF extraction via CDN-loaded PDF.js
const extractTextFromPDF = async (file: File, onProgress?: (p: number) => void): Promise<string> => {
  const fileArrayBuffer = await file.arrayBuffer();
  
  // Load pdf.js dynamically from CDN if not already loaded
  if (!(window as any).pdfjsLib) {
    await new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }

  const pdfjsLib = (window as any).pdfjsLib;
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const pdf = await pdfjsLib.getDocument({ data: fileArrayBuffer }).promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // Group items by their vertical position (Y coordinate) to keep rows distinct
    const items = textContent.items as any[];
    const rows: { [key: number]: string[] } = {};
    
    items.forEach((item) => {
      const y = Math.round(item.transform[5]); // Y-coordinate is at index 5
      if (!rows[y]) rows[y] = [];
      rows[y].push(item.str);
    });

    // Sort rows by Y coordinate (descending for top-to-bottom)
    const sortedY = Object.keys(rows).map(Number).sort((a, b) => b - a);
    const pageText = sortedY.map(y => rows[y].join(' ')).join('\n');
    fullText += pageText + '\n';
    
    // Update progress: current page / total pages * 100
    onProgress?.(Math.round((i / pdf.numPages) * 100));
  }
  
  return fullText;
};

interface ExtractedCourse {
  code: string
  title: string
  units: number
  target_level: string
  semester: string
}

interface CourseOCRUploadProps {
  departmentId: string
  onSuccess?: () => void
}

export default function CourseOCRUpload({ departmentId, onSuccess }: CourseOCRUploadProps) {
  const router = useRouter()
  const [extracted, setExtracted] = useState<ExtractedCourse[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [syncing, setSyncing] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setErrorMsg('')
    setProgress(0)
    
    try {
      let text = ''
      const fileType = file.type

      if (fileType === 'text/csv' || file.name.endsWith('.csv')) {
        // Handle CSV
        setProgress(50)
        text = await file.text()
        setProgress(100)
      } else if (fileType === 'application/pdf') {
        // Handle PDF
        text = await extractTextFromPDF(file, (p) => setProgress(p))
      } else if (fileType.startsWith('image/')) {
        // Handle Image via Tesseract
        const result = await Tesseract.recognize(file, 'eng', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100))
            }
          }
        })
        text = result.data.text
      } else {
        throw new Error('Unsupported file type. Please upload an image, PDF, or CSV.')
      }
      
      // Extract course codes and titles 
      // Improved Pattern: Non-greedy capture of title with lookahead for next course code or line break
      const coursePattern = /([A-Z0-9-]{2,10})\s?(\d{3})[\t ]+(.+?)(?=[A-Z0-9-]{2,10}\s?\d{3}|[\n\r]|$)/g
      const matches = Array.from(text.matchAll(coursePattern))
      
      if (matches.length === 0) {
        throw new Error('No valid course codes and titles found. Please ensure the document is clear.')
      }

      const courses: ExtractedCourse[] = matches.map(m => {
        const prefix = m[1].toUpperCase()
        const num = m[2]
        const rawTitle = m[3].trim()
        
        const cleanCode = `${prefix} ${num}`
        const lastDigit = parseInt(num.slice(-1), 10)
        const semester = (lastDigit % 2 !== 0) ? 'first' : 'second'

        // Aggressively clean title from the right side
        // Removes trailing units (1-3), status codes (C, E, R, Required, etc.)
        let cleanTitle = rawTitle.trim();
        let previousTitle = "";
        
        // Loop to strip multiple trailing tokens (e.g., "2 C Approved" -> "General Biochemistry I")
        while (cleanTitle !== previousTitle) {
          previousTitle = cleanTitle;
          cleanTitle = cleanTitle
            .replace(/\s+\b(Required|Approved|Elective|C|R|E|S|P|A|B)\b\s*$/gi, '')
            .replace(/\s+\d{1,2}\s*$/, '') // Remove credit units
            .trim();
        }

        return {
          code: cleanCode,
          title: cleanTitle || 'Auto-Extracted Module',
          units: 3, // Default, though we could try to extract this too
          target_level: `${num.charAt(0)}00L`,
          semester: semester
        }
      })

      // Remove duplicates by code
      const uniqueCourses = courses.filter((c, index, self) =>
        index === self.findIndex((t) => t.code === c.code)
      )

      setExtracted(uniqueCourses)
    } catch (err: any) {
      console.error('Extraction Error:', err)
      setErrorMsg(err.message || 'Failed to process file. Please ensure it is a clear document.')
    } finally {
      setLoading(false)
    }
  }

  const removeCourse = (idx: number) => {
    setExtracted(prev => prev.filter((_, i) => i !== idx))
  }

  const confirmUpload = async () => {
    setSyncing(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/deptadmin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extracted.map(c => ({
          ...c,
          department_id: departmentId,
          is_open: false
        })))
      })

      if (!res.ok) throw new Error((await res.json()).error)
      
      setExtracted([])
      onSuccess?.()
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setSyncing(false)
    }
  }

  if (extracted.length > 0) {
    return (
      <div className="bg-surface p-6 rounded-xl border border-purple-primary/30 shadow-2xl">
         <h3 className="text-xl text-white font-medium mb-4 flex items-center gap-2"><CheckCircle className="text-green-400" size={20}/> Extracted {extracted.length} Courses</h3>
         <p className="text-text-muted text-sm mb-6">Review the extracted courses below. Remove any incorrect entries before saving.</p>
         
         <div className="max-h-64 overflow-y-auto mb-6 pr-2 space-y-3">
           {extracted.map((c, idx) => (
             <div key={idx} className="flex items-center justify-between p-3 bg-bg-primary rounded-lg border border-border-subtle">
               <div>
                  <div className="flex items-center gap-3">
                    <span className="text-purple-accent font-bold tracking-wider">{c.code}</span>
                     <span className="text-xs px-2 py-0.5 bg-surface rounded-full text-text-muted border border-border-subtle">{c.target_level}</span>
                     <span className={`text-[10px] px-2 py-0.5 rounded-full border ${c.semester === 'first' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-green-500/10 text-green-400 border-green-500/30'} font-bold uppercase`}>
                        {c.semester === 'first' ? 'First' : 'Second'} Semester
                     </span>
                  </div>
                  <p className="text-xs text-text-muted mt-1">{c.title}</p>
               </div>
               <button onClick={() => removeCourse(idx)} disabled={syncing} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                  Remove
               </button>
             </div>
           ))}
         </div>

         {errorMsg && <p className="text-red-400 text-sm mb-4">{errorMsg}</p>}

         <div className="flex gap-4">
          <button onClick={() => setExtracted([])} disabled={syncing} className="w-1/3 bg-bg-primary text-text-muted hover:text-white py-3 border border-border-subtle rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={confirmUpload} disabled={syncing} className="w-2/3 flex justify-center items-center gap-2 bg-purple-primary hover:bg-purple-accent text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)]">
            {syncing ? <BrandLoader size={18} /> : 'Save All Courses to Database'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface p-6 rounded-xl border border-border-subtle border-dashed relative">
      <input 
        type="file" 
        accept="image/*,application/pdf,.csv"
        onChange={handleFileUpload}
        disabled={loading}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" 
      />
      
      <div className="text-center py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4 w-full px-8 opacity-100">
            <BrandLoader size={36} className="mb-2" />
            <div className="w-full bg-bg-primary h-2 rounded-full overflow-hidden border border-border-subtle">
              <div 
                className="bg-purple-primary h-full transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-purple-accent text-sm uppercase tracking-widest font-bold">Scanning Document... {progress}%</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center gap-6 text-purple-primary/40 mb-4">
              <UploadCloud size={32} />
              <FileText size={32} />
              <Table size={32} />
            </div>
            <h3 className="text-white text-lg font-medium mb-1">Upload Course List</h3>
            <p className="text-text-muted text-sm max-w-sm mx-auto">Upload an image, PDF, or CSV file. We'll automatically identify all departmental courses.</p>
            {errorMsg && <p className="text-red-400 text-sm mt-4 p-2 bg-red-400/10 rounded-lg inline-flex items-center gap-2"><AlertCircle size={14}/> {errorMsg}</p>}
          </>
        )}
      </div>
    </div>
  )
}
