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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bank_accounts: {
        Row: {
          account_number: string | null
          bank_id: string | null
          company_id: string
          created_at: string
          id: string
          label: string
          ledger_category_id: string | null
        }
        Insert: {
          account_number?: string | null
          bank_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          label: string
          ledger_category_id?: string | null
        }
        Update: {
          account_number?: string | null
          bank_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          label?: string
          ledger_category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_ledger_category_id_fkey"
            columns: ["ledger_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          code: string | null
          company_id: string
          created_at: string
          id: string
          is_synthetic: boolean
          kind: string
          level: number | null
          name: string
          reduced_code: string | null
        }
        Insert: {
          code?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_synthetic?: boolean
          kind?: string
          level?: number | null
          name: string
          reduced_code?: string | null
        }
        Update: {
          code?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_synthetic?: boolean
          kind?: string
          level?: number | null
          name?: string
          reduced_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cnpj: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
        }
        Relationships: []
      }
      imports: {
        Row: {
          account_id: string | null
          company_id: string
          created_at: string
          duplicate_count: number
          file_name: string
          id: string
          imported_by: string | null
          inserted_count: number
          period_end: string | null
          period_start: string | null
          total_count: number
        }
        Insert: {
          account_id?: string | null
          company_id: string
          created_at?: string
          duplicate_count?: number
          file_name: string
          id?: string
          imported_by?: string | null
          inserted_count?: number
          period_end?: string | null
          period_start?: string | null
          total_count?: number
        }
        Update: {
          account_id?: string | null
          company_id?: string
          created_at?: string
          duplicate_count?: number
          file_name?: string
          id?: string
          imported_by?: string | null
          inserted_count?: number
          period_end?: string | null
          period_start?: string | null
          total_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "imports_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      rules: {
        Row: {
          active: boolean
          amount_sign: string
          category_id: string
          company_id: string
          created_at: string
          id: string
          match_type: string
          max_amount: number | null
          min_amount: number | null
          pattern: string
          priority: number
        }
        Insert: {
          active?: boolean
          amount_sign?: string
          category_id: string
          company_id: string
          created_at?: string
          id?: string
          match_type?: string
          max_amount?: number | null
          min_amount?: number | null
          pattern?: string
          priority?: number
        }
        Update: {
          active?: boolean
          amount_sign?: string
          category_id?: string
          company_id?: string
          created_at?: string
          id?: string
          match_type?: string
          max_amount?: number | null
          min_amount?: number | null
          pattern?: string
          priority?: number
        }
        Relationships: [
          {
            foreignKeyName: "rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category_id: string | null
          check_number: string | null
          classified_by: string | null
          company_id: string
          created_at: string
          description: string
          fitid: string
          id: string
          import_id: string | null
          memo: string | null
          posted_at: string
          rule_id: string | null
          trn_type: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          amount: number
          category_id?: string | null
          check_number?: string | null
          classified_by?: string | null
          company_id: string
          created_at?: string
          description?: string
          fitid: string
          id?: string
          import_id?: string | null
          memo?: string | null
          posted_at: string
          rule_id?: string | null
          trn_type?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount?: number
          category_id?: string | null
          check_number?: string | null
          classified_by?: string | null
          company_id?: string
          created_at?: string
          description?: string
          fitid?: string
          id?: string
          import_id?: string | null
          memo?: string | null
          posted_at?: string
          rule_id?: string | null
          trn_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "rules"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_company_setup: {
        Args: {
          p_bank_accounts: Json
          p_categories: Json
          p_cnpj: string | null
          p_name: string
          p_notes: string | null
        }
        Returns: string
      }
      import_statement: {
        Args: {
          p_account_label: string
          p_account_number: string | null
          p_bank_id: string | null
          p_company_id: string
          p_file_name: string
          p_period_end: string | null
          p_period_start: string | null
          p_transactions: Json
        }
        Returns: Json
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
