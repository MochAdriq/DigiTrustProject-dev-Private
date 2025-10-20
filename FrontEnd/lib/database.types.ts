export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string
          email: string
          password: string
          type: "private" | "sharing"
          profiles: Profile[]
          created_at: string
          expires_at: string
          reported: boolean | null
          report_reason: string | null
        }
        Insert: {
          id: string
          email: string
          password: string
          type: "private" | "sharing"
          profiles: Profile[]
          created_at?: string
          expires_at: string
          reported?: boolean | null
          report_reason?: string | null
        }
        Update: {
          id?: string
          email?: string
          password?: string
          type?: "private" | "sharing"
          profiles?: Profile[]
          created_at?: string
          expires_at?: string
          reported?: boolean | null
          report_reason?: string | null
        }
      }
      reported_accounts: {
        Row: {
          id: string
          account_id: string
          email: string
          report_reason: string
          reported_at: string
          resolved: boolean | null
        }
        Insert: {
          id: string
          account_id: string
          email: string
          report_reason: string
          reported_at?: string
          resolved?: boolean | null
        }
        Update: {
          id?: string
          account_id?: string
          email?: string
          report_reason?: string
          reported_at?: string
          resolved?: boolean | null
        }
      }
      customer_assignments: {
        Row: {
          id: string
          customer_identifier: string
          account_id: string
          account_email: string
          account_type: string
          profile_name: string
          operator_name: string | null // Added operator_name field
          assigned_at: string
        }
        Insert: {
          id: string
          customer_identifier: string
          account_id: string
          account_email: string
          account_type: string
          profile_name: string
          operator_name?: string | null // Added operator_name field
          assigned_at?: string
        }
        Update: {
          id?: string
          customer_identifier?: string
          account_id?: string
          account_email?: string
          account_type?: string
          profile_name?: string
          operator_name?: string | null // Added operator_name field
          assigned_at?: string
        }
      }
    }
  }
}

export interface Profile {
  profile: string
  pin: string
  used: boolean
}
