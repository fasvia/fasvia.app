import { NextResponse } from 'next/server'
import { getTenantDb } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { supabase, schoolId } = getTenantDb()
    const body = await request.json()

    // 1. Hash the proxy password (or generated pin if not provided)
    const password = body.password || 'default123'
    const hashedPassword = await bcrypt.hash(password, 10)

    // Resolve department_id from string if provided
    let finalDepartmentId = body.department_id || null;
    if (!finalDepartmentId && body.department) {
      // Clean string "Department of Zoology" -> "Zoology"
      const cleanDept = body.department.replace(/Department(?: of)?\s*/i, '').trim()
      const { data: dept } = await supabase
        .from('departments')
        .select('id')
        .eq('school_id', schoolId)
        .ilike('name', `%${cleanDept}%`)
        .limit(1)
        .single()
      
      if (dept) finalDepartmentId = dept.id
    }

    // 2. Insert User (Student or Lecturer)
    const role = body.role || 'student'
    const status = role === 'lecturer' ? 'pending' : 'approved'

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        school_id: schoolId,
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: role,
        matric_number: body.matric_number,
        staff_id: body.staff_id,
        department_id: finalDepartmentId,
        level: body.level,
        profile_photo_url: body.profile_photo_url,
        device_fingerprint: body.device_fingerprint,
        status: status,
        is_verified: true,
      })
      .select()
      .single()

    if (userError) throw userError

    // 3. Insert Student Courses
    if (body.courses && body.courses.length > 0) {
      // Fetch current active academic session
      const { data: session } = await supabase
        .from('academic_sessions')
        .select('id')
        .eq('school_id', schoolId)
        .eq('is_active', true)
        .single()

      if (session && body.courses && body.courses.length > 0) {
        // body.courses array contains string codes e.g. ["CHM 107", "BCH 201"]
        const { data: coursesData } = await supabase
           .from('courses')
           .select('id, code')
           .eq('school_id', schoolId)
           .in('code', body.courses)

        if (coursesData && coursesData.length > 0) {
          const studentCourses = coursesData.map(course => ({
            school_id: schoolId,
            student_id: user.id,
            course_id: course.id,
            academic_session_id: session.id,
            semester: 'first',
            is_carryover: false 
          }))

          if (studentCourses.length > 0) {
            const { error: insertError } = await supabase.from('student_courses').insert(studentCourses)
            if (insertError) console.error("Course linking error:", insertError)
          }
        }
      }
    }

    return NextResponse.json({ user, message: 'Registration successful' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
