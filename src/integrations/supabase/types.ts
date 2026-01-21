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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      adjuster_ratings: {
        Row: {
          adjuster: string
          created_at: string
          id: string
          notes: string | null
          rating: number
          sales_commission_id: string
          salesperson_id: string
          updated_at: string
        }
        Insert: {
          adjuster: string
          created_at?: string
          id?: string
          notes?: string | null
          rating: number
          sales_commission_id: string
          salesperson_id: string
          updated_at?: string
        }
        Update: {
          adjuster?: string
          created_at?: string
          id?: string
          notes?: string | null
          rating?: number
          sales_commission_id?: string
          salesperson_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "adjuster_ratings_sales_commission_id_fkey"
            columns: ["sales_commission_id"]
            isOneToOne: false
            referencedRelation: "sales_commissions"
            referencedColumns: ["id"]
          },
        ]
      }
      adjusters: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          name: string
          office: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          name: string
          office: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          name?: string
          office?: string
          updated_at?: string
        }
        Relationships: []
      }
      claims_2025: {
        Row: {
          adjuster: string
          change_indicator: string | null
          created_at: string
          date_signed: string | null
          dollar_difference: number | null
          estimate_of_loss: number | null
          id: string
          name: string
          office: string | null
          percent_change: number | null
          revised_estimate_of_loss: number | null
          updated_at: string
        }
        Insert: {
          adjuster: string
          change_indicator?: string | null
          created_at?: string
          date_signed?: string | null
          dollar_difference?: number | null
          estimate_of_loss?: number | null
          id?: string
          name: string
          office?: string | null
          percent_change?: number | null
          revised_estimate_of_loss?: number | null
          updated_at?: string
        }
        Update: {
          adjuster?: string
          change_indicator?: string | null
          created_at?: string
          date_signed?: string | null
          dollar_difference?: number | null
          estimate_of_loss?: number | null
          id?: string
          name?: string
          office?: string | null
          percent_change?: number | null
          revised_estimate_of_loss?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      commission_checks: {
        Row: {
          check_amount: number
          check_number: string | null
          commission_earned: number
          created_at: string
          deposited_date: string
          id: string
          notes: string | null
          received_date: string
          sales_commission_id: string
          updated_at: string
        }
        Insert: {
          check_amount: number
          check_number?: string | null
          commission_earned?: number
          created_at?: string
          deposited_date: string
          id?: string
          notes?: string | null
          received_date: string
          sales_commission_id: string
          updated_at?: string
        }
        Update: {
          check_amount?: number
          check_number?: string | null
          commission_earned?: number
          created_at?: string
          deposited_date?: string
          id?: string
          notes?: string | null
          received_date?: string
          sales_commission_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commission_checks_sales_commission_id_fkey"
            columns: ["sales_commission_id"]
            isOneToOne: false
            referencedRelation: "sales_commissions"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_pipeline: {
        Row: {
          client_name: string
          created_at: string | null
          expected_close_date: string
          expected_value: number | null
          id: string
          notes: string | null
          probability: number | null
          salesperson_id: string
          stage: string | null
          updated_at: string | null
        }
        Insert: {
          client_name: string
          created_at?: string | null
          expected_close_date: string
          expected_value?: number | null
          id?: string
          notes?: string | null
          probability?: number | null
          salesperson_id: string
          stage?: string | null
          updated_at?: string | null
        }
        Update: {
          client_name?: string
          created_at?: string | null
          expected_close_date?: string
          expected_value?: number | null
          id?: string
          notes?: string | null
          probability?: number | null
          salesperson_id?: string
          stage?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      goal_scenarios: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          quarters: Json
          salesperson_id: string
          scenario_name: string
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          quarters: Json
          salesperson_id: string
          scenario_name: string
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          quarters?: Json
          salesperson_id?: string
          scenario_name?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "goal_scenarios_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          recipient_id: string
          related_entity: string | null
          related_id: string | null
          sender_id: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          recipient_id: string
          related_entity?: string | null
          related_id?: string | null
          sender_id: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          recipient_id?: string
          related_entity?: string | null
          related_id?: string | null
          sender_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_commissions: {
        Row: {
          adjuster: string | null
          client_name: string
          commission_percentage: number | null
          commissions_paid: number | null
          created_at: string
          date_signed: string | null
          fee_percentage: number | null
          id: string
          initial_estimate: number | null
          insurance_checks_ytd: number | null
          new_remainder: number | null
          office: string | null
          old_remainder: number | null
          percent_change: number | null
          revised_estimate: number | null
          salesperson_id: string | null
          split_percentage: number | null
          status: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          adjuster?: string | null
          client_name: string
          commission_percentage?: number | null
          commissions_paid?: number | null
          created_at?: string
          date_signed?: string | null
          fee_percentage?: number | null
          id?: string
          initial_estimate?: number | null
          insurance_checks_ytd?: number | null
          new_remainder?: number | null
          office?: string | null
          old_remainder?: number | null
          percent_change?: number | null
          revised_estimate?: number | null
          salesperson_id?: string | null
          split_percentage?: number | null
          status?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          adjuster?: string | null
          client_name?: string
          commission_percentage?: number | null
          commissions_paid?: number | null
          created_at?: string
          date_signed?: string | null
          fee_percentage?: number | null
          id?: string
          initial_estimate?: number | null
          insurance_checks_ytd?: number | null
          new_remainder?: number | null
          office?: string | null
          old_remainder?: number | null
          percent_change?: number | null
          revised_estimate?: number | null
          salesperson_id?: string | null
          split_percentage?: number | null
          status?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_commissions_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_goals: {
        Row: {
          created_at: string | null
          goal_type: string
          id: string
          notes: string | null
          salesperson_id: string
          target_deals: number | null
          target_revenue: number | null
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          goal_type?: string
          id?: string
          notes?: string | null
          salesperson_id: string
          target_deals?: number | null
          target_revenue?: number | null
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          goal_type?: string
          id?: string
          notes?: string | null
          salesperson_id?: string
          target_deals?: number | null
          target_revenue?: number | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_goals_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_plans: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          avg_fee_percent: number
          commission_percent: number
          created_at: string
          id: string
          is_active: boolean
          reviewer_notes: string | null
          salesperson_id: string
          selected_scenario: string
          submitted_at: string | null
          target_commission: number
          target_deals: number
          target_revenue: number
          updated_at: string
          year: number
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          avg_fee_percent?: number
          commission_percent?: number
          created_at?: string
          id?: string
          is_active?: boolean
          reviewer_notes?: string | null
          salesperson_id: string
          selected_scenario?: string
          submitted_at?: string | null
          target_commission?: number
          target_deals?: number
          target_revenue?: number
          updated_at?: string
          year: number
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          avg_fee_percent?: number
          commission_percent?: number
          created_at?: string
          id?: string
          is_active?: boolean
          reviewer_notes?: string | null
          salesperson_id?: string
          selected_scenario?: string
          submitted_at?: string | null
          target_commission?: number
          target_deals?: number
          target_revenue?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_plans_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
            referencedColumns: ["id"]
          },
        ]
      }
      salespeople: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          manager_id: string | null
          name: string
          role: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salespeople_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "salespeople"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "sales_director" | "sales_rep"
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
      app_role: ["sales_director", "sales_rep"],
    },
  },
} as const
