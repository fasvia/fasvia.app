export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      academic_sessions: {
        Row: {
          created_at: string | null
          first_semester_end: string | null
          first_semester_start: string | null
          id: string
          is_active: boolean | null
          name: string | null
          school_id: string | null
          second_semester_end: string | null
          second_semester_start: string | null
        }
        Insert: {
          created_at?: string | null
          first_semester_end?: string | null
          first_semester_start?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          school_id?: string | null
          second_semester_end?: string | null
          second_semester_start?: string | null
        }
        Update: {
          created_at?: string | null
          first_semester_end?: string | null
          first_semester_start?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          school_id?: string | null
          second_semester_end?: string | null
          second_semester_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_sessions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          device_fingerprint: string | null
          face_verified: boolean | null
          id: string
          is_boundary_case: boolean | null
          is_manual: boolean | null
          latitude: number | null
          longitude: number | null
          marked_at: string | null
          marked_offline: boolean | null
          school_id: string | null
          session_id: string | null
          status: string | null
          student_id: string | null
          synced_at: string | null
          verification_method: string | null
        }
        Insert: {
          device_fingerprint?: string | null
          face_verified?: boolean | null
          id?: string
          is_boundary_case?: boolean | null
          is_manual?: boolean | null
          latitude?: number | null
          longitude?: number | null
          marked_at?: string | null
          marked_offline?: boolean | null
          school_id?: string | null
          session_id?: string | null
          status?: string | null
          student_id?: string | null
          synced_at?: string | null
          verification_method?: string | null
        }
        Update: {
          device_fingerprint?: string | null
          face_verified?: boolean | null
          id?: string
          is_boundary_case?: boolean | null
          is_manual?: boolean | null
          latitude?: number | null
          longitude?: number | null
          marked_at?: string | null
          marked_offline?: boolean | null
          school_id?: string | null
          session_id?: string | null
          status?: string | null
          student_id?: string | null
          synced_at?: string | null
          verification_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_fingerprints: {
        Row: {
          building_name: string | null
          centre_lat: number | null
          centre_lng: number | null
          confidence_score: number | null
          created_at: string | null
          geofence_points: Json | null
          id: string
          learned_radius: number | null
          school_id: string | null
          session_count: number | null
          updated_at: string | null
        }
        Insert: {
          building_name?: string | null
          centre_lat?: number | null
          centre_lng?: number | null
          confidence_score?: number | null
          created_at?: string | null
          geofence_points?: Json | null
          id?: string
          learned_radius?: number | null
          school_id?: string | null
          session_count?: number | null
          updated_at?: string | null
        }
        Update: {
          building_name?: string | null
          centre_lat?: number | null
          centre_lng?: number | null
          confidence_score?: number | null
          created_at?: string | null
          geofence_points?: Json | null
          id?: string
          learned_radius?: number | null
          school_id?: string | null
          session_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classroom_fingerprints_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string | null
          created_at: string | null
          department_id: string | null
          id: string
          is_open: boolean | null
          lecturer_id: string | null
          school_id: string | null
          semester: string | null
          target_level: string | null
          title: string | null
          units: number | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          department_id?: string | null
          id?: string
          is_open?: boolean | null
          lecturer_id?: string | null
          school_id?: string | null
          semester?: string | null
          target_level?: string | null
          title?: string | null
          units?: number | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          department_id?: string | null
          id?: string
          is_open?: boolean | null
          lecturer_id?: string | null
          school_id?: string | null
          semester?: string | null
          target_level?: string | null
          title?: string | null
          units?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string | null
          created_at: string | null
          faculty_id: string | null
          id: string
          name: string | null
          school_id: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          faculty_id?: string | null
          id?: string
          name?: string | null
          school_id?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          faculty_id?: string | null
          id?: string
          name?: string | null
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          created_at: string | null
          device_fingerprint: string | null
          id: string
          is_active: boolean | null
          school_id: string | null
          student_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_fingerprint?: string | null
          id?: string
          is_active?: boolean | null
          school_id?: string | null
          student_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string | null
          id?: string
          is_active?: boolean | null
          school_id?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          evidence_url: string | null
          id: string
          raised_at: string | null
          reason: string | null
          resolved_at: string | null
          resolved_by: string | null
          school_id: string | null
          session_id: string | null
          status: string | null
          student_id: string | null
        }
        Insert: {
          evidence_url?: string | null
          id?: string
          raised_at?: string | null
          reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          school_id?: string | null
          session_id?: string | null
          status?: string | null
          student_id?: string | null
        }
        Update: {
          evidence_url?: string | null
          id?: string
          raised_at?: string | null
          reason?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          school_id?: string | null
          session_id?: string | null
          status?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      faculties: {
        Row: {
          code: string | null
          created_at: string | null
          id: string
          name: string | null
          school_id: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          school_id?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faculties_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      lecturer_courses: {
        Row: {
          course_id: string | null
          created_at: string | null
          id: string
          lecturer_id: string | null
          school_id: string | null
          session_id: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          lecturer_id?: string | null
          school_id?: string | null
          session_id?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          id?: string
          lecturer_id?: string | null
          school_id?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lecturer_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lecturer_courses_lecturer_id_fkey"
            columns: ["lecturer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lecturer_courses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lecturer_courses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          code: string | null
          created_at: string | null
          domain: string | null
          id: string
          logo_url: string | null
          name: string | null
          primary_colour: string | null
          secondary_colour: string | null
          subscription_status: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string | null
          primary_colour?: string | null
          secondary_colour?: string | null
          subscription_status?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string | null
          primary_colour?: string | null
          secondary_colour?: string | null
          subscription_status?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          academic_session_id: string | null
          course_id: string | null
          created_at: string | null
          duration_minutes: number | null
          end_time: string | null
          geofence_points: Json | null
          geofence_radius: number | null
          id: string
          is_active: boolean | null
          latitude: number | null
          lecturer_id: string | null
          longitude: number | null
          school_id: string | null
          semester: string | null
          start_time: string | null
        }
        Insert: {
          academic_session_id?: string | null
          course_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          geofence_points?: Json | null
          geofence_radius?: number | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          lecturer_id?: string | null
          longitude?: number | null
          school_id?: string | null
          semester?: string | null
          start_time?: string | null
        }
        Update: {
          academic_session_id?: string | null
          course_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          geofence_points?: Json | null
          geofence_radius?: number | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          lecturer_id?: string | null
          longitude?: number | null
          school_id?: string | null
          semester?: string | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_academic_session_id_fkey"
            columns: ["academic_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_lecturer_id_fkey"
            columns: ["lecturer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      student_courses: {
        Row: {
          academic_session_id: string | null
          course_id: string | null
          created_at: string | null
          id: string
          is_borrowed: boolean | null
          is_carryover: boolean | null
          school_id: string | null
          semester: string | null
          student_id: string | null
        }
        Insert: {
          academic_session_id?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          is_borrowed?: boolean | null
          is_carryover?: boolean | null
          school_id?: string | null
          semester?: string | null
          student_id?: string | null
        }
        Update: {
          academic_session_id?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          is_borrowed?: boolean | null
          is_carryover?: boolean | null
          school_id?: string | null
          semester?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_courses_academic_session_id_fkey"
            columns: ["academic_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_courses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_courses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          department_id: string | null
          device_fingerprint: string | null
          email: string | null
          faculty_id: string | null
          id: string
          is_verified: boolean | null
          level: string | null
          matric_number: string | null
          name: string | null
          password: string | null
          profile_photo_url: string | null
          role: string | null
          school_id: string | null
          staff_id: string | null
        }
        Insert: {
          created_at?: string | null
          department_id?: string | null
          device_fingerprint?: string | null
          email?: string | null
          faculty_id?: string | null
          id?: string
          is_verified?: boolean | null
          level?: string | null
          matric_number?: string | null
          name?: string | null
          password?: string | null
          profile_photo_url?: string | null
          role?: string | null
          school_id?: string | null
          staff_id?: string | null
        }
        Update: {
          created_at?: string | null
          department_id?: string | null
          device_fingerprint?: string | null
          email?: string | null
          faculty_id?: string | null
          id?: string
          is_verified?: boolean | null
          level?: string | null
          matric_number?: string | null
          name?: string | null
          password?: string | null
          profile_photo_url?: string | null
          role?: string | null
          school_id?: string | null
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
