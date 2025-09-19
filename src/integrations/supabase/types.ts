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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agent_config_access_log: {
        Row: {
          access_type: string
          accessed_by: string
          created_at: string
          id: string
          organization_id: string
          user_id: string | null
        }
        Insert: {
          access_type: string
          accessed_by: string
          created_at?: string
          id?: string
          organization_id: string
          user_id?: string | null
        }
        Update: {
          access_type?: string
          accessed_by?: string
          created_at?: string
          id?: string
          organization_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      appointment_access_log: {
        Row: {
          access_type: string
          accessed_by: string
          appointment_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          access_type: string
          accessed_by: string
          appointment_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string
          accessed_by?: string
          appointment_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_access_log_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          date: string
          duration: number | null
          email: string
          google_event_id: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string | null
          phone: string | null
          status: string | null
          time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          duration?: number | null
          email: string
          google_event_id?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          status?: string | null
          time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          duration?: number | null
          email?: string
          google_event_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          status?: string | null
          time?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_history: {
        Row: {
          amount: number
          cost: number | null
          created_at: string
          currency: string | null
          description: string | null
          id: string
          metadata: Json | null
          organization_id: string
          payment_method: string | null
          payment_reference: string | null
          status: string
          type: string
        }
        Insert: {
          amount: number
          cost?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          type: string
        }
        Update: {
          amount?: number
          cost?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          payment_method?: string | null
          payment_reference?: string | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      billing_settings: {
        Row: {
          auto_top_up_amount: number | null
          auto_top_up_enabled: boolean | null
          auto_top_up_threshold: number | null
          created_at: string
          enable_low_credit_notifications: boolean | null
          id: string
          low_credit_warning_threshold: number | null
          notification_webhook_url: string | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          auto_top_up_amount?: number | null
          auto_top_up_enabled?: boolean | null
          auto_top_up_threshold?: number | null
          created_at?: string
          enable_low_credit_notifications?: boolean | null
          id?: string
          low_credit_warning_threshold?: number | null
          notification_webhook_url?: string | null
          organization_id: string
          updated_at?: string
        }
        Update: {
          auto_top_up_amount?: number | null
          auto_top_up_enabled?: boolean | null
          auto_top_up_threshold?: number | null
          created_at?: string
          enable_low_credit_notifications?: boolean | null
          id?: string
          low_credit_warning_threshold?: number | null
          notification_webhook_url?: string | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      call_staging: {
        Row: {
          agent: string | null
          audio_storage_path: string | null
          conversation_id: string
          customer: string | null
          duration: number | null
          evaluation_result: string | null
          id: string
          messages: Json | null
          organization_id: string | null
          received_audio: boolean
          received_metadata: boolean
          summary: string | null
        }
        Insert: {
          agent?: string | null
          audio_storage_path?: string | null
          conversation_id: string
          customer?: string | null
          duration?: number | null
          evaluation_result?: string | null
          id?: string
          messages?: Json | null
          organization_id?: string | null
          received_audio?: boolean
          received_metadata?: boolean
          summary?: string | null
        }
        Update: {
          agent?: string | null
          audio_storage_path?: string | null
          conversation_id?: string
          customer?: string | null
          duration?: number | null
          evaluation_result?: string | null
          id?: string
          messages?: Json | null
          organization_id?: string | null
          received_audio?: boolean
          received_metadata?: boolean
          summary?: string | null
        }
        Relationships: []
      }
      call_transcriptions: {
        Row: {
          agent: string
          audio_storage_path: string | null
          created_at: string
          customer: string
          date: string
          duration: number
          evaluation_result: string
          id: string
          messages: Json | null
          organization_id: string | null
          summary: string | null
          time: string
          updated_at: string
        }
        Insert: {
          agent: string
          audio_storage_path?: string | null
          created_at?: string
          customer: string
          date: string
          duration?: number
          evaluation_result: string
          id?: string
          messages?: Json | null
          organization_id?: string | null
          summary?: string | null
          time: string
          updated_at?: string
        }
        Update: {
          agent?: string
          audio_storage_path?: string | null
          created_at?: string
          customer?: string
          date?: string
          duration?: number
          evaluation_result?: string
          id?: string
          messages?: Json | null
          organization_id?: string | null
          summary?: string | null
          time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_transcriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_notification_state: {
        Row: {
          created_at: string
          current_threshold: number
          first_warning_sent: boolean
          first_warning_sent_at: string | null
          id: string
          last_credit_balance: number
          organization_id: string
          updated_at: string
          zero_credits_warning_sent: boolean
          zero_credits_warning_sent_at: string | null
        }
        Insert: {
          created_at?: string
          current_threshold: number
          first_warning_sent?: boolean
          first_warning_sent_at?: string | null
          id?: string
          last_credit_balance?: number
          organization_id: string
          updated_at?: string
          zero_credits_warning_sent?: boolean
          zero_credits_warning_sent_at?: string | null
        }
        Update: {
          created_at?: string
          current_threshold?: number
          first_warning_sent?: boolean
          first_warning_sent_at?: string | null
          id?: string
          last_credit_balance?: number
          organization_id?: string
          updated_at?: string
          zero_credits_warning_sent?: boolean
          zero_credits_warning_sent_at?: string | null
        }
        Relationships: []
      }
      credit_usage: {
        Row: {
          call_duration_minutes: number | null
          call_transcription_id: string | null
          cost_per_minute: number | null
          created_at: string
          credits_consumed: number
          id: string
          organization_id: string
        }
        Insert: {
          call_duration_minutes?: number | null
          call_transcription_id?: string | null
          cost_per_minute?: number | null
          created_at?: string
          credits_consumed: number
          id?: string
          organization_id: string
        }
        Update: {
          call_duration_minutes?: number | null
          call_transcription_id?: string | null
          cost_per_minute?: number | null
          created_at?: string
          credits_consumed?: number
          id?: string
          organization_id?: string
        }
        Relationships: []
      }
      financial_data_access_log: {
        Row: {
          access_type: string
          accessed_by: string
          created_at: string
          data_accessed: Json | null
          id: string
          organization_id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          access_type: string
          accessed_by: string
          created_at?: string
          data_accessed?: Json | null
          id?: string
          organization_id: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          access_type?: string
          accessed_by?: string
          created_at?: string
          data_accessed?: Json | null
          id?: string
          organization_id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      low_credit_alert_queue: {
        Row: {
          alert_type: string | null
          created_at: string
          current_credits: number
          id: string
          organization_id: string
          processed_at: string | null
          status: string
          threshold: number
        }
        Insert: {
          alert_type?: string | null
          created_at?: string
          current_credits: number
          id?: string
          organization_id: string
          processed_at?: string | null
          status?: string
          threshold: number
        }
        Update: {
          alert_type?: string | null
          created_at?: string
          current_credits?: number
          id?: string
          organization_id?: string
          processed_at?: string | null
          status?: string
          threshold?: number
        }
        Relationships: []
      }
      onboarding: {
        Row: {
          completed_at: string | null
          created_at: string
          current_challenges: string | null
          current_tools: string[] | null
          how_found_platform: string | null
          id: string
          industry_sector: string
          integration_channels: string[] | null
          main_objective: string
          monthly_call_volume: string
          organization_website: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_challenges?: string | null
          current_tools?: string[] | null
          how_found_platform?: string | null
          id?: string
          industry_sector: string
          integration_channels?: string[] | null
          main_objective: string
          monthly_call_volume: string
          organization_website?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_challenges?: string | null
          current_tools?: string[] | null
          how_found_platform?: string | null
          id?: string
          industry_sector?: string
          integration_channels?: string[] | null
          main_objective?: string
          monthly_call_volume?: string
          organization_website?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_agent_config: {
        Row: {
          api_key_secret_name: string
          created_at: string
          id: string
          organization_id: string
          primary_agent_id: string
          status: string
          updated_at: string
        }
        Insert: {
          api_key_secret_name: string
          created_at?: string
          id?: string
          organization_id: string
          primary_agent_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          api_key_secret_name?: string
          created_at?: string
          id?: string
          organization_id?: string
          primary_agent_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_agent_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_by: string
          organization_id: string
          organization_name: string | null
          role: Database["public"]["Enums"]["organization_role"]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by: string
          organization_id: string
          organization_name?: string | null
          role?: Database["public"]["Enums"]["organization_role"]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by?: string
          organization_id?: string
          organization_name?: string | null
          role?: Database["public"]["Enums"]["organization_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          email: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"]
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_menu_settings: {
        Row: {
          created_at: string
          id: string
          menu_settings: Json
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          menu_settings?: Json
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          menu_settings?: Json
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_menu_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          agent_id: string[] | null
          created_at: string
          description: string | null
          domain: string | null
          id: string
          members_count: number
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string[] | null
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          members_count?: number
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string[] | null
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          members_count?: number
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          current_credits: number
          id: string
          last_top_up_at: string | null
          organization_id: string
          total_credits_purchased: number
          total_credits_used: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_credits?: number
          id?: string
          last_top_up_at?: string | null
          organization_id: string
          total_credits_purchased?: number
          total_credits_used?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_credits?: number
          id?: string
          last_top_up_at?: string | null
          organization_id?: string
          total_credits_purchased?: number
          total_credits_used?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          created_at: string
          id: string
          is_online: boolean
          last_seen_at: string
          organization_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_online?: boolean
          last_seen_at?: string
          organization_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_online?: boolean
          last_seen_at?: string
          organization_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits: {
        Args: {
          cost_amount?: number
          credits_to_add: number
          org_id: string
          payment_method?: string
          payment_ref?: string
        }
        Returns: boolean
      }
      consume_credits: {
        Args: {
          call_id?: string
          credits_to_consume: number
          duration_minutes?: number
          org_id: string
        }
        Returns: boolean
      }
      get_user_organization_ids: {
        Args: { user_id: string }
        Returns: string[]
      }
      is_valid_invitation_token: {
        Args: { token_value: string }
        Returns: boolean
      }
      organization_has_valid_invitations: {
        Args: { org_id: string }
        Returns: boolean
      }
      user_can_access_organization: {
        Args: { org_id: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      organization_role: "owner" | "admin" | "manager" | "employee"
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
    Enums: {
      organization_role: ["owner", "admin", "manager", "employee"],
    },
  },
} as const
