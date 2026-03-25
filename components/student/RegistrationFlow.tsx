'use client'

import { useState, useRef, useEffect } from 'react'
import Tesseract from 'tesseract.js'
import { UploadCloud, Camera, CheckCircle, ArrowRight, ShieldCheck, Mail, Lock, Fingerprint, Smartphone, AlertCircle } from 'lucide-react'
import BrandLoader from '@/components/ui/BrandLoader'
import { generateDeviceFingerprint } from '@/lib/security'
import { NativeBiometric } from 'capacitor-native-biometric'
import { Capacitor } from '@capacitor/core'
import Image from 'next/image'
import Link from 'next/link'

// Helper for digital PDF extraction via CDN-loaded PDF.js
const extractTextFromPDF = async (file: File, onProgress?: (p: number) => void, onImageExtracted?: (dataUrl: string) => void): Promise<string> => {
  const fileArrayBuffer = await file.arrayBuffer();
  
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
    
    // Extract image from page 1 top-right quadrant
    if (i === 1 && onImageExtracted) {
      try {
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          const cropW = canvas.width * 0.3;
          const cropH = canvas.height * 0.3;
          const cropCanvas = document.createElement('canvas');
          cropCanvas.width = cropW;
          cropCanvas.height = cropH;
          const cropCtx = cropCanvas.getContext('2d');
          if (cropCtx) {
            cropCtx.drawImage(canvas, canvas.width * 0.65, canvas.height * 0.05, cropW, cropH, 0, 0, cropW, cropH);
            onImageExtracted(cropCanvas.toDataURL('image/jpeg'));
          }
        }
      } catch (e) { console.error("PDF image extraction failed", e); }
    }

    const textContent = await page.getTextContent();
    const items = textContent.items as any[];
    const rows: { [key: number]: string[] } = {};
    
    items.forEach((item) => {
      const y = Math.round(item.transform[5]);
      if (!rows[y]) rows[y] = [];
      rows[y].push(item.str);
    });

    const sortedY = Object.keys(rows).map(Number).sort((a, b) => b - a);
    const pageText = sortedY.map(y => rows[y].join(' ')).join('\n');
    fullText += pageText + '\n';
    
    onProgress?.(Math.round((i / pdf.numPages) * 100));
  }
  
  return fullText;
};

export default function RegistrationFlow() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const [formData, setFormData] = useState({
    name: '',
    matric_number: '',
    department: '',
    level: '',
    email: '',
    password: '',
    courses: [] as string[]
  })
  
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [documentPhotoUrl, setDocumentPhotoUrl] = useState<string | null>(null)
  
  const matchRegex = (text: string, patterns: RegExp[]) => {
    for (const p of patterns) {
      const match = text.match(p);
      if (match && match[1]) return match[1].trim();
    }
    return '';
  }

  const extractDataFromText = (text: string) => {
    let name = matchRegex(text, [
      /Full[-_]?Name[\s|:]*([A-Za-z\s]+)(?:\n|Faculty|Department|Programme|Current)/i,
      /Name[\s|:]*([A-Za-z\s]+)(?:\n|Matric|Reg|Faculty)/i,
      /Student Name[\s|:]*([A-Za-z\s]+)(?:\n|ID)/i
    ]) || 'Unknown Student';
    
    // Aggressive Name Cleanup: Stop at faculty noise words, or lowercase 'of'
    name = name.split(/\s+(?:of\b|Faculty\b|Dept|Department|Programme|Science|Levels?)\b/i)[0];
    
    // Prefer ALL CAPS if available (Nigerian forms usually uppercase names)
    const capsMatch = name.match(/([A-Z\s]{5,})/);
    if (capsMatch && capsMatch[1].trim().split(' ').length >= 2) {
      name = capsMatch[1];
    }
    name = name.replace(/[^A-Za-z\s]/g, '').trim();

    let matric = matchRegex(text, [
      /Matriculation No[\s|:]*([A-Z0-9\/]+)/i,
      /Matric(?: No| Number)?[\s|:]*([A-Z0-9\/]+)/i,
      /Reg(?:\.|istration)? No[\s|:]*([A-Z0-9\/]+)/i,
      /Student(?: ID| No)[\s|:]*([A-Z0-9\/]+)/i,
      /(\d{2}\/\d{2}[A-Z]{2}\d{3})/i 
    ]) || '';
    matric = matric.replace(/[^A-Za-z0-9\/]/g, '').trim();

    let dept = matchRegex(text, [
      /Department(?: of)?[\s|:]*([A-Za-z\s]+)(?:\n|Programme|Faculty|Current)/i,
      /Dept[\s|:]*([A-Za-z\s]+)/i
    ]) || 'General';
    dept = dept.split(/\s+(?:Programme|Faculty|Current|Level)\b/i)[0];
    dept = dept.replace(/[^A-Za-z\s]/g, '').trim();

    const levelRegexStr = matchRegex(text, [
      /Current Level[\s|:]*(\d{3})\s*(?:Level|L)?/i,
      /Level[\s|:]*(\d{3})/i,
      /Year[\s|:]*(\d)/i 
    ]);
    const level = levelRegexStr ? (levelRegexStr.replace(/[^0-9]/g, '').length === 1 ? `${levelRegexStr.replace(/[^0-9]/g, '')}00L` : `${levelRegexStr.replace(/[^0-9]/g, '')}L`) : '100L';

    const coursesRegex = /\b([A-Z]{3,4}(?:-[A-Z]{3,4})?)\s*(\d{3})\b/gi;
    const courses = [];
    let match;
    while ((match = coursesRegex.exec(text)) !== null) {
      courses.push(`${match[1].toUpperCase().replace('-','')} ${match[2]}`);
    }
    const uniqueCourses = Array.from(new Set(courses));

    setFormData(prev => ({ ...prev, name, matric_number: matric, department: dept, level, courses: uniqueCourses }));
  }

  // Stable sync check — no useState/useEffect needed, Capacitor.isNativePlatform() is synchronous
  const isNative = Capacitor.isNativePlatform()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setProgress(0)

    try {
      let text = '';
      
      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(
           file, 
           (p) => setProgress(Math.min(99, p)),
           (imgUrl) => setDocumentPhotoUrl(imgUrl)
        );
        setProgress(100);
      } else if (file.type.startsWith('image/')) {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const cropW = img.width * 0.3;
          const cropH = img.height * 0.3;
          canvas.width = cropW;
          canvas.height = cropH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, img.width * 0.65, img.height * 0.05, cropW, cropH, 0, 0, cropW, cropH);
            setDocumentPhotoUrl(canvas.toDataURL('image/jpeg'));
          }
        };
        img.src = URL.createObjectURL(file);

        const result = await Tesseract.recognize(file, 'eng', {
          logger: m => {
            if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100))
          }
        });
        text = result.data.text;
      } else {
        throw new Error('Unsupported file type. Please upload an image or PDF.');
      }
      
      extractDataFromText(text);
      setStep(2);
    } catch (err: any) {
      alert('Failed to process document: ' + err.message)
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [livenessState, setLivenessState] = useState<'waiting' | 'blink' | 'captured'>('waiting')

  useEffect(() => {
    if (step === 3) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) videoRef.current.srcObject = stream
          setLivenessState('waiting')
          
          // Switch to blink prompt after exactly 2 seconds
          setTimeout(() => setLivenessState('blink'), 2000)
          
          let prevData: Uint8ClampedArray | null = null;
          let isCaptured = false;
          
          const interval = setInterval(() => {
            if (!videoRef.current || !canvasRef.current || isCaptured) return;
            const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;
            
            ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            
            // Focus on center/upper area for eyes (assuming user centers face)
            const w = canvasRef.current.width * 0.5;
            const h = canvasRef.current.height * 0.3;
            const x = canvasRef.current.width * 0.25;
            const y = canvasRef.current.height * 0.25;
            
            const frame = ctx.getImageData(x, y, w, h);
            
            if (prevData) {
              let diffTotal = 0;
              for (let i = 0; i < frame.data.length; i += 4) {
                diffTotal += Math.abs(frame.data[i] - prevData[i]) + 
                             Math.abs(frame.data[i+1] - prevData[i+1]) + 
                             Math.abs(frame.data[i+2] - prevData[i+2]);
              }
              const avgDiff = diffTotal / (w * h * 3);
              
              // A real blink or substantial nod spikes the pixel delta. 
              // We only accept real movement (>12 threshold) as hardware liveness.
              if (avgDiff > 12) {
                isCaptured = true;
                setLivenessState('captured');
                clearInterval(interval);
                captureFace(stream);
              }
            }
            prevData = frame.data;
          }, 150);
          
          return () => {
             clearInterval(interval);
             stream.getTracks().forEach(t => t.stop());
          }
        })
        .catch(err => alert("Camera access required to verify identity: " + err))
    }
  }, [step])

  const captureFace = (stream: MediaStream) => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      canvasRef.current.width = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
      context?.drawImage(videoRef.current, 0, 0)
      
      const dataUrl = canvasRef.current.toDataURL('image/jpeg')
      setPhotoUrl(dataUrl)
      
      setTimeout(() => setStep(4), 500) 
    }
  }

  const [scanPos, setScanPos] = useState(0)
  const [matchState, setMatchState] = useState<'scanning' | 'matched' | 'failed'>('scanning')
  const [matchConfidence, setMatchConfidence] = useState<number | null>(null)
  
  useEffect(() => {
    if (step === 4) {
      setMatchState('scanning')
      setMatchConfidence(null)
      const interval = setInterval(() => setScanPos(p => (p + 3) % 100), 30)
      let processTimeout: NodeJS.Timeout;
      
      const processFaceMatching = async () => {
        if (!documentPhotoUrl || !photoUrl) {
            setMatchState('failed')
            clearInterval(interval)
            return;
        }

        try {
            const res = await fetch('/api/auth/face-compare', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ selfieBase64: photoUrl, formPhotoBase64: documentPhotoUrl })
            });
            
            const data = await res.json();
            clearInterval(interval);
            
            if (!res.ok) throw new Error(data.error);
            
            // Path corrected: data.result.confidence
            const confidence = data.result?.confidence;
            if (typeof confidence === 'number') {
                setMatchConfidence(confidence)
                if (confidence >= 80) {
                   setMatchState('matched')
                } else {
                   setMatchState('failed')
                }
            } else {
                setMatchState('failed')
            }
        } catch (err: any) {
            console.error(err);
            setMatchState('failed')
            clearInterval(interval);
        }
      }

      // Add a slight delay just so the laser scan UI shows for a bit
      processTimeout = setTimeout(processFaceMatching, 2000);
      
      return () => {
        clearInterval(interval);
        clearTimeout(processTimeout);
      }
    }
  }, [step, documentPhotoUrl, photoUrl])

  const submitRegistration = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, profile_photo_url: photoUrl, role: 'student' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      setStep(6)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  // UI Guard removed for Demo version — students can now register on web

  return (
    <div className="bg-surface rounded-3xl border border-border-subtle shadow-2xl p-8 max-w-3xl mx-auto overflow-hidden relative min-h-[500px] flex flex-col justify-center">
      <div className="absolute top-6 left-0 right-0 flex gap-2 justify-center z-10">
        {[1,2,3,4,5].map(i => (
          <div key={i} className={`h-1.5 w-16 rounded-full transition-all duration-500 ${step >= i ? 'bg-purple-accent shadow-[0_0_10px_#A855F7]' : 'bg-bg-primary border border-border-subtle'}`} />
        ))}
      </div>

      <div className="mt-8">
        {step === 1 && (
          <div className="text-center animate-in fade-in zoom-in duration-500">
            <h2 className="text-3xl text-white font-bold mb-4">Smart Enrollment</h2>
            <p className="text-text-muted mb-10 text-lg">Snap your course registration form (any university format). Our AI will instantly extract your details and secure your setup.</p>
            
            <div className="relative border-2 border-dashed border-purple-primary/50 rounded-2xl p-16 hover:border-purple-accent transition-colors bg-purple-primary/5 group cursor-pointer w-full max-w-xl mx-auto">
              <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} disabled={loading} className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" />
              {loading ? (
                <div className="flex flex-col items-center w-full">
                  <BrandLoader size={64} className="mb-4" />
                  <p className="text-purple-accent font-bold uppercase tracking-widest text-sm mb-2">Extracting Core Academic Profile...</p>
                  
                  <div className="w-full bg-bg-primary h-2 rounded-full overflow-hidden border border-border-subtle mt-4 max-w-xs mx-auto">
                    <div 
                      className="bg-purple-primary h-full transition-all duration-300 ease-out" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-white text-xs opacity-70 mt-3">Machine Vision Processing: {progress}%</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <UploadCloud className="text-purple-primary group-hover:scale-110 transition-transform mb-6" size={64} />
                  <p className="text-white font-semibold mb-2 text-xl">Upload or Snap Signed Form</p>
                  <p className="text-text-muted text-sm">Valid PDF, JPG, or PNG files</p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in slide-in-from-right duration-500 max-w-2xl mx-auto">
            <h2 className="text-2xl text-white font-bold mb-6 flex items-center gap-3"><CheckCircle className="text-green-400"/> AI Extraction Review</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs text-text-muted uppercase tracking-widest font-bold flex justify-between">Full Name <Lock size={12}/></label>
                <input type="text" value={formData.name} readOnly className="w-full bg-surface/50 border border-border-subtle rounded-xl p-3 text-text-muted cursor-not-allowed font-semibold mt-2 outline-none select-none" />
              </div>
              <div>
                <label className="text-xs text-text-muted uppercase tracking-widest font-bold flex justify-between">Matric Number <Lock size={12}/></label>
                <input type="text" value={formData.matric_number} readOnly className="w-full bg-surface/50 border border-border-subtle rounded-xl p-3 text-text-muted cursor-not-allowed font-semibold mt-2 outline-none select-none" />
              </div>
              <div>
                <label className="text-xs text-text-muted uppercase tracking-widest font-bold flex justify-between">Department <Lock size={12}/></label>
                <input type="text" value={formData.department} readOnly className="w-full bg-surface/50 border border-border-subtle rounded-xl p-3 text-text-muted cursor-not-allowed font-semibold mt-2 outline-none select-none" />
              </div>
              <div>
                <label className="text-xs text-text-muted uppercase tracking-widest font-bold flex justify-between">Level <Lock size={12}/></label>
                <input type="text" value={formData.level} readOnly className="w-full bg-surface/50 border border-border-subtle rounded-xl p-3 text-text-muted cursor-not-allowed font-semibold mt-2 outline-none select-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
               <div>
                  <label className="text-xs text-text-muted uppercase tracking-widest font-bold block mb-2">Login Email</label>
                  <div className="flex bg-bg-primary border border-border-subtle focus-within:border-purple-accent rounded-xl px-3 py-3 overflow-hidden transition-colors">
                     <Mail className="text-text-muted mr-3" size={20} />
                     <input type="email" placeholder="Create your account email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-transparent text-white w-full outline-none" />
                  </div>
               </div>
               <div>
                  <label className="text-xs text-text-muted uppercase tracking-widest font-bold block mb-2">Secure Password</label>
                  <div className="flex bg-bg-primary border border-border-subtle focus-within:border-purple-accent rounded-xl px-3 py-3 overflow-hidden transition-colors">
                     <Lock className="text-text-muted mr-3" size={20} />
                     <input type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="bg-transparent text-white w-full outline-none" />
                  </div>
               </div>
            </div>

            <div className="p-5 bg-purple-primary/5 border border-purple-primary/20 rounded-xl mb-8">
              <label className="text-[10px] text-purple-accent uppercase tracking-widest font-bold mb-3 block">Courses Detected & Extracted ({formData.courses.length})</label>
              <div className="flex flex-wrap gap-2">
                {formData.courses.length > 0 ? formData.courses.map((c, i) => <span key={i} className="px-3 py-1 bg-surface border border-border-subtle rounded-lg text-white font-bold text-sm shadow-sm">{c}</span>) : <span className="text-text-muted text-sm italic">No valid course codes found. You can add them later in settings.</span>}
              </div>
            </div>

            <button onClick={() => setStep(3)} disabled={!formData.email || !formData.password || !formData.matric_number} className="w-full bg-purple-primary hover:bg-purple-accent disabled:opacity-50 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-all">Secure Face Activation <ArrowRight size={20}/></button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center animate-in slide-in-from-right duration-500">
            <h2 className="text-2xl text-white font-bold mb-2">Live Verification</h2>
            <p className="text-text-muted mb-8 max-w-sm mx-auto">Please look straight at the camera to setup your secure attendance footprint. This ensures nobody else can mark you present.</p>

            <div className="relative w-72 h-72 mx-auto rounded-full overflow-hidden border-4 border-purple-primary mb-8 shadow-[0_0_30px_rgba(124,58,237,0.4)]">
              {!photoUrl && <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />}
              {photoUrl && <img src={photoUrl} className="w-full h-full object-cover transform scale-x-[-1]" />}
              <canvas ref={canvasRef} className="hidden" />
              
              {!photoUrl && (
                <div className="absolute inset-x-0 bottom-6 text-center z-10 w-full px-4">
                  <span className={`inline-block w-full px-5 py-3 rounded-full text-xs font-bold shadow-2xl transition-all ${livenessState === 'waiting' ? 'bg-black/70 backdrop-blur-sm text-white' : 'bg-green-500 text-white animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.8)]'}`}>
                    {livenessState === 'waiting' ? 'Align face in circle...' : livenessState === 'blink' ? 'Please blink once to verify you are present' : 'Blink detected! Capturing...'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center animate-in fade-in slide-in-from-bottom-8 duration-500">
            <h2 className="text-3xl text-white font-bold mb-2">Identity Matrix</h2>
            <p className="text-text-muted mb-8 italic">Comparing live biometric signature with official document metadata...</p>
            
            <div className="relative w-72 h-72 mx-auto mb-10 group">
              {/* Outer Glow Rings */}
              <div className="absolute -inset-4 bg-purple-accent/20 rounded-full blur-2xl animate-pulse" />
              <div className="absolute -inset-2 border-2 border-purple-accent/30 rounded-full animate-[spin_10s_linear_infinite]" />
              
              <div className="relative w-full h-full rounded-full border-4 border-purple-primary overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.4)]">
                <img src={photoUrl || ''} alt="Selfie" className="w-full h-full object-cover grayscale brightness-110" />
                
                {matchState === 'scanning' && (
                  <div 
                    className="absolute left-0 right-0 h-1 bg-purple-accent shadow-[0_0_15px_#A855F7] z-10"
                    style={{ top: `${scanPos}%` }}
                  />
                )}
                
                {matchState === 'matched' && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center animate-in zoom-in duration-300">
                    <CheckCircle size={100} className="text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.8)]" />
                  </div>
                )}

                {matchState === 'failed' && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center animate-in zoom-in duration-300">
                    <AlertCircle size={100} className="text-red-400 drop-shadow-[0_0_20px_rgba(248,113,113,0.8)]" />
                  </div>
                )}
              </div>

              {/* Decorative Tech Corners */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-purple-accent rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-purple-accent rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-purple-accent rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-purple-accent rounded-br-lg" />
            </div>

            {matchState === 'scanning' && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-2 h-2 bg-purple-accent rounded-full animate-ping" />
                  <p className="text-purple-accent font-bold tracking-widest uppercase text-sm">Cross-referencing facial nodes...</p>
                </div>
                <div className="w-48 h-1 bg-bg-primary rounded-full mx-auto overflow-hidden">
                   <div className="h-full bg-purple-accent animate-[shimmer_2s_infinite] w-full" />
                </div>
              </div>
            )}

            {matchState === 'matched' && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-6 inline-block">
                  <p className="text-green-400 font-bold flex items-center gap-2">
                    <ShieldCheck size={18} />
                    BIOMETRIC MATCH CONFIRMED ({typeof matchConfidence === 'number' ? matchConfidence.toFixed(1) : '85.0'}%)
                  </p>
                </div>
                <button 
                  onClick={submitRegistration}
                  className="w-full max-w-sm mx-auto flex items-center justify-center gap-4 bg-purple-accent text-white p-6 rounded-2xl font-bold text-xl hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(168,85,247,0.4)]"
                >
                  {loading ? <BrandLoader size={24} /> : <>Complete Registration <ArrowRight /></>}
                </button>
              </div>
            )}

            {matchState === 'failed' && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-6">
                  <p className="text-red-400 font-bold mb-2">VERIFICATION FAILED {typeof matchConfidence === 'number' && `(${matchConfidence.toFixed(1)}%)`}</p>
                  <p className="text-text-muted text-sm px-4">
                    {typeof matchConfidence === 'number' 
                      ? "Face does not match the registration form. Please ensure you are using your own form." 
                      : "Could not detect a clear face. Please look directly at the camera in good lighting."}
                  </p>
                </div>
                
                <div className="flex flex-col gap-4 max-w-sm mx-auto p-4">
                    <button 
                      onClick={() => {
                        setStep(3);
                        setPhotoUrl(null);
                        setMatchState('scanning');
                      }}
                      className="w-full flex items-center justify-center gap-3 bg-white text-black p-5 rounded-2xl font-bold hover:bg-gray-200 transition-all shadow-lg"
                    >
                      <Camera size={20} />
                      Recapture Face
                    </button>
                    
                    <button 
                      onClick={() => setStep(1)}
                      className="text-text-muted hover:text-white transition-colors"
                    >
                      Re-upload Document
                    </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 6 && (
          <div className="text-center py-10 animate-in zoom-in duration-500 scale-100">
            <div className="w-28 h-28 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
              <CheckCircle size={64} />
            </div>
            <h2 className="text-3xl text-white font-bold mb-2">Welcome to the Future</h2>
            <p className="text-text-muted mb-8 text-lg">Your biometric identity and academic profile have been fully established. You are now protected by Fasvia.</p>
            <button onClick={() => window.location.href='/student'} className="bg-purple-primary hover:bg-purple-accent text-white px-10 py-4 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(124,58,237,0.4)]">Access Student Dashboard</button>
          </div>
        )}
      </div>
    </div>
  )
}
