import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ExportOptions {
  type: 'session' | 'course' | 'student';
  schoolName: string;
  courseCode: string;
  courseTitle: string;
  dateRange?: string;
  lecturerName: string;
  hodName: string;
  deptName: string;
  totalRegistered?: number;
  totalPresent?: number;
  attendanceRate?: string;
  sessionsAttended?: number;
  totalSessions?: number;
  sessionId?: string;
  studentName?: string;
}

export const generateAttendancePDF = async (data: any[], options: ExportOptions) => {
  const doc = new jsPDF()
  
  // Helper to get image as base64
  const getBase64Image = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
    } catch (e) { return null }
  }

  const logoBase64 = await getBase64Image('/fasvia-logo.png')
  const purple = [124, 58, 237]
  const lightGrey = [249, 250, 251]
  const grey = [107, 114, 128]

  // --- HEADER SECTION ---
  // School Logo Placeholder
  doc.setDrawColor(209, 213, 219)
  doc.setFillColor(243, 244, 246)
  doc.rect(14, 15, 45, 20, 'F')
  doc.setFontSize(10)
  doc.setTextColor(156, 163, 175)
  doc.text(options.schoolName.toUpperCase(), 16, 27, { maxWidth: 41 })

  // Fasvia Logo / Branding
  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 145, 12, 12, 12)
    doc.setFontSize(14)
    doc.setTextColor(124, 58, 237)
    doc.setFont('helvetica', 'bold')
    doc.text('FASVIA', 159, 21)
  } else {
    doc.setFontSize(18)
    doc.setTextColor(124, 58, 237)
    doc.setFont('helvetica', 'bold')
    doc.text('FASVIA', 145, 22)
  }
  
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(107, 114, 128)
  doc.text('Smart Attendance System', logoBase64 ? 159 : 145, logoBase64 ? 25 : 27)

  // Separator
  doc.setDrawColor(options.type === 'session' ? 124 : 107, options.type === 'session' ? 58 : 114, options.type === 'session' ? 237 : 128)
  doc.setLineWidth(0.5)
  doc.line(14, 40, 196, 40)

  // Title
  doc.setFontSize(16)
  doc.setTextColor(31, 41, 55)
  doc.setFont('helvetica', 'bold')
  doc.text('OFFICIAL ATTENDANCE RECORD', 105, 52, { align: 'center' })

  // Metadata
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(55, 65, 81)
  const metaY = 62
  const metaText = `${options.courseCode} | ${options.courseTitle} | ${options.dateRange || new Date().toLocaleDateString()}`
  doc.text(metaText, 105, metaY, { align: 'center' })
  
  if (options.type === 'session') {
    doc.text(`Total Present: ${options.totalPresent} / ${options.totalRegistered} | Rate: ${options.attendanceRate}`, 105, metaY + 6, { align: 'center' })
  }

  // --- TABLE SECTION ---
  let tableColumn: string[] = []
  let tableRows: any[][] = []

  if (options.type === 'session') {
    tableColumn = ["No.", "Student Name", "Matric Number", "Time Marked", "Method", "Status"]
    tableRows = data.map((log, index) => [
      index + 1,
      log.users?.name,
      log.users?.matric_number,
      new Date(log.marked_at).toLocaleTimeString(),
      log.verification_method,
      log.status === 'verified' ? 'Verified' : 'Flagged'
    ])
  } else if (options.type === 'course') {
    tableColumn = ["No.", "Student Name", "Matric Number", "Attended", "Total", "Percentage", "Status"]
    tableRows = data.map((st, index) => [
      index + 1,
      st.name,
      st.matric,
      st.attended,
      st.total,
      `${st.percentage}%`,
      st.percentage >= 75 ? 'Good' : 'At Risk'
    ])
  } else if (options.type === 'student') {
    tableColumn = ["No.", "Course Code", "Course Title", "Attended", "Total", "Percentage", "Status"]
    tableRows = data.map((c, index) => [
      index + 1,
      c.code,
      c.title,
      c.attended,
      c.total,
      `${c.percentage}%`,
      c.percentage >= 75 ? 'Verified' : 'Low'
    ])
  }

  autoTable(doc, {
    startY: options.type === 'session' ? 75 : 70,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    didParseCell: (data) => {
      if (data.section === 'body') {
        // Color status column
        const statusIdx = tableColumn.indexOf('Status')
        if (data.column.index === statusIdx) {
          const val = data.cell.raw as string
          if (val === 'Verified' || val === 'Good') data.cell.styles.textColor = [34, 197, 94] // green
          if (val === 'Flagged' || val === 'At Risk' || val === 'Low') data.cell.styles.textColor = [245, 158, 11] // amber
          if (val === 'Absent') data.cell.styles.textColor = [239, 68, 68] // red
        }
        
        // Full Course highlight red for low percentage
        if (options.type === 'course' && data.column.index === tableColumn.indexOf('Percentage')) {
          const perc = parseFloat((data.cell.raw as string).replace('%',''))
          if (perc < 75) data.cell.styles.textColor = [239, 68, 68]
        }
      }
    }
  })

  // --- SUMMARY SECTION ---
  const finalY = (doc as any).lastAutoTable.finalY + 15
  if (options.type === 'session' && options.attendanceRate && parseFloat(options.attendanceRate) < 75) {
     doc.setTextColor(239, 68, 68) // red
     doc.setFontSize(9)
     doc.setFont('helvetica', 'bold')
     doc.text(`NOTE: Attendance rate for this session is below the 75% threshold (${options.attendanceRate})`, 14, finalY)
  }
  
  if (options.type === 'course') {
     const atRiskCount = data.filter(s => s.percentage < 75).length
     if (atRiskCount > 0) {
        doc.setTextColor(239, 68, 68)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text(`NOTE: ${atRiskCount} students are below the 75% attendance threshold`, 14, finalY)
     }
  }

  // --- SIGNATURE SECTION ---
  const sigY = 240
  const boxWidth = 55
  const boxMargin = 10

  // Box 1: Lecturer
  doc.setDrawColor(209, 213, 219)
  doc.line(14, sigY, 14 + boxWidth, sigY)
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text('Signature & Date', 14, sigY + 5)
  doc.setTextColor(31, 41, 55)
  doc.setFont('helvetica', 'bold')
  doc.text(options.lecturerName, 14, sigY + 15)
  doc.setFont('helvetica', 'normal')
  doc.text('Course Lecturer', 14, sigY + 19)
  doc.text(options.courseCode, 14, sigY + 23)

  // Box 2: HOD
  const hodX = 14 + boxWidth + boxMargin
  doc.line(hodX, sigY, hodX + boxWidth, sigY)
  doc.setTextColor(107, 114, 128)
  doc.text('Signature & Date', hodX, sigY + 5)
  doc.setTextColor(31, 41, 55)
  doc.setFont('helvetica', 'bold')
  doc.text(options.hodName, hodX, sigY + 15)
  doc.setFont('helvetica', 'normal')
  doc.text('Head of Department', hodX, sigY + 19)
  doc.text(options.deptName, hodX, sigY + 23)

  // Box 3: Fasvia Stamp
  const stampX = hodX + boxWidth + boxMargin
  doc.setLineWidth(0.2)
  doc.rect(stampX, sigY - 5, boxWidth + 5, 35)
  doc.setTextColor(124, 58, 237)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('[FASVIA DIGITAL STAMP]', stampX + 5, sigY + 2)
  doc.setFontSize(7)
  doc.text('Certified Attendance Record', stampX + 5, sigY + 7)
  doc.setFont('helvetica', 'normal')
  doc.text('Powered by Fasvia', stampX + 5, sigY + 11)
  doc.text('Nelbion Group', stampX + 5, sigY + 15)
  doc.text(`ID: ${options.sessionId || 'FULL_REPT'}`, stampX + 5, sigY + 19, { maxWidth: boxWidth - 5 })
  doc.text(`Generated: ${new Date().toLocaleString()}`, stampX + 5, sigY + 23)

  // --- FOOTER SECTION ---
  const footY = 285
  doc.setDrawColor(124, 58, 237)
  doc.setLineWidth(1)
  doc.line(14, footY + 4, 196, footY + 4)
  
  doc.setFontSize(7)
  doc.setTextColor(107, 114, 128)
  doc.text('This document was generated by Fasvia Smart Attendance System', 14, footY)
  doc.text('Nelbion Group | fasvia.app | hello@fasvia.app', 14, footY + 3)
  
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.text(`Page ${i} of ${pageCount}`, 180, footY)
  }

  const filename = options.type === 'session' 
    ? `Attendance_${options.courseCode}_${options.dateRange?.replace(/\//g, '-')}_Session.pdf`
    : options.type === 'course'
      ? `${options.courseCode}_Full_Semester_Report.pdf`
      : `${options.studentName?.replace(/ /g, '_')}_Attendance_Report.pdf`

  doc.save(filename)
}
