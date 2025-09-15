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
      canvas_ideas: {
        Row: {
          canvas_id: string | null
          created_at: string
          id: string
          idea_id: string | null
          x: number | null
          y: number | null
        }
        Insert: {
          canvas_id?: string | null
          created_at?: string
          id?: string
          idea_id?: string | null
          x?: number | null
          y?: number | null
        }
        Update: {
          canvas_id?: string | null
          created_at?: string
          id?: string
          idea_id?: string | null
          x?: number | null
          y?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "canvas_ideas_canvas_id_fkey"
            columns: ["canvas_id"]
            isOneToOne: false
            referencedRelation: "canvases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canvas_ideas_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      canvases: {
        Row: {
          created_at: string
          id: string
          is_shared: boolean | null
          name: string
          owner_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_shared?: boolean | null
          name: string
          owner_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_shared?: boolean | null
          name?: string
          owner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canvases_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_requests: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          message: string | null
          owner_id: string
          requested_role: string | null
          requester_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          message?: string | null
          owner_id: string
          requested_role?: string | null
          requester_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          message?: string | null
          owner_id?: string
          requested_role?: string | null
          requester_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_requests_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collaboration_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      embeds: {
        Row: {
          content: string
          created_at: string
          id: string
          is_public: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id: string
          is_public?: boolean
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_public?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ideas: {
        Row: {
          collaboration_description: string | null
          collaboration_roles: string[] | null
          collaboration_status: string | null
          color_signature: string | null
          content: string
          created_at: string
          id: string
          idea_type: string | null
          keywords: string[] | null
          location: string | null
          mood: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
          visibility: string | null
        }
        Insert: {
          collaboration_description?: string | null
          collaboration_roles?: string[] | null
          collaboration_status?: string | null
          color_signature?: string | null
          content: string
          created_at?: string
          id?: string
          idea_type?: string | null
          keywords?: string[] | null
          location?: string | null
          mood?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          visibility?: string | null
        }
        Update: {
          collaboration_description?: string | null
          collaboration_roles?: string[] | null
          collaboration_status?: string | null
          color_signature?: string | null
          content?: string
          created_at?: string
          id?: string
          idea_type?: string | null
          keywords?: string[] | null
          location?: string | null
          mood?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ideas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          source_id: string | null
          strength: number | null
          target_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          source_id?: string | null
          strength?: number | null
          target_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          source_id?: string | null
          strength?: number | null
          target_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          achievement_date: string | null
          color: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          project_id: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          achievement_date?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          project_id: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          achievement_date?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          project_id?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      muse_sessions: {
        Row: {
          created_at: string
          id: string
          input_prompt: string
          muse_response: string | null
          recommended_collaborators: string[] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          input_prompt: string
          muse_response?: string | null
          recommended_collaborators?: string[] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          input_prompt?: string
          muse_response?: string | null
          recommended_collaborators?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "muse_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_ideas: {
        Row: {
          added_by: string | null
          created_at: string
          id: string
          idea_id: string
          notes: string | null
          project_id: string
          relationship_type: string | null
          stage_id: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          id?: string
          idea_id: string
          notes?: string | null
          project_id: string
          relationship_type?: string | null
          stage_id?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string
          id?: string
          idea_id?: string
          notes?: string | null
          project_id?: string
          relationship_type?: string | null
          stage_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_ideas_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_ideas_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_ideas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_ideas_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          permissions: string[] | null
          project_id: string
          role: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          permissions?: string[] | null
          project_id: string
          role?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          permissions?: string[] | null
          project_id?: string
          role?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stages: {
        Row: {
          color: string | null
          completion_percentage: number | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          project_id: string
          stage_order: number
          start_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          completion_percentage?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          project_id: string
          stage_order: number
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          completion_percentage?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          project_id?: string
          stage_order?: number
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          completion_percentage: number | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          owner_id: string
          priority: string | null
          start_date: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          visibility: string | null
        }
        Insert: {
          completion_percentage?: number | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          owner_id: string
          priority?: string | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          visibility?: string | null
        }
        Update: {
          completion_percentage?: number | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          owner_id?: string
          priority?: string | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          failed_at: string | null
          failure_reason: string | null
          id: string
          metadata: Json | null
          paid_at: string | null
          status: string
          stripe_invoice_id: string
          stripe_subscription_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          status: string
          stripe_invoice_id: string
          stripe_subscription_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          status?: string
          stripe_invoice_id?: string
          stripe_subscription_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assignee_id: string | null
          created_at: string
          creator_id: string
          dependencies: string[] | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          labels: string[] | null
          priority: string | null
          project_id: string
          stage_id: string | null
          status: string | null
          task_order: number | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assignee_id?: string | null
          created_at?: string
          creator_id: string
          dependencies?: string[] | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          labels?: string[] | null
          priority?: string | null
          project_id: string
          stage_id?: string | null
          status?: string | null
          task_order?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assignee_id?: string | null
          created_at?: string
          creator_id?: string
          dependencies?: string[] | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          labels?: string[] | null
          priority?: string | null
          project_id?: string
          stage_id?: string | null
          status?: string | null
          task_order?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "project_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_limits: {
        Row: {
          ai_enhanced_requests: number | null
          collaborations_initiated: number | null
          created_at: string
          id: string
          ideas_created: number | null
          month_year: string
          muse_sessions_used: number | null
          projects_created: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_enhanced_requests?: number | null
          collaborations_initiated?: number | null
          created_at?: string
          id?: string
          ideas_created?: number | null
          month_year: string
          muse_sessions_used?: number | null
          projects_created?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_enhanced_requests?: number | null
          collaborations_initiated?: number | null
          created_at?: string
          id?: string
          ideas_created?: number | null
          month_year?: string
          muse_sessions_used?: number | null
          projects_created?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscription_tier: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscription_tier?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscription_tier?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
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
