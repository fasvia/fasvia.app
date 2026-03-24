export type SemesterStatus = 'first' | 'second' | 'closed' | 'not_started'

export function getCurrentSemester(session: any): SemesterStatus {
  if (!session || !session.is_active) return 'closed'
  
  const now = new Date()
  const firstStart = new Date(session.first_semester_start)
  
  // Convert end dates to inclusive bounds by adding 23:59:59 time
  const firstEnd = new Date(session.first_semester_end)
  firstEnd.setHours(23, 59, 59, 999)

  const secondStart = new Date(session.second_semester_start)
  const secondEnd = new Date(session.second_semester_end)
  secondEnd.setHours(23, 59, 59, 999)
  
  if (now >= firstStart && now <= firstEnd) return 'first'
  if (now >= secondStart && now <= secondEnd) return 'second'
  if (now < firstStart) return 'not_started'
  
  return 'closed'
}
