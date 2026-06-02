/**
 * Supabase Database Types
 *
 * Manually defined during development. Replace with generated types
 * via `supabase gen types typescript` once the project is live.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          avatar_url: string | null;
          disclaimer_accepted_at: string | null;
          disclaimer_version: string;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string;
          avatar_url?: string | null;
          disclaimer_accepted_at?: string | null;
          disclaimer_version?: string;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          avatar_url?: string | null;
          disclaimer_accepted_at?: string | null;
          disclaimer_version?: string;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      legal_requests: {
        Row: {
          id: string;
          user_id: string;
          question: string;
          title: string;
          brief: string;
          insight: string | null;
          explanation: string;
          category: string;
          urgency: "low" | "medium" | "high";
          language: "he" | "ar" | "en";
          source: "ai" | "demo";
          action_plan: Json;
          evidence_checklist: Json;
          common_mistakes: Json;
          lawyer_questions: Json;
          glossary: Json;
          legal_aid: Json;
          deadline_hint: Json | null;
          disclaimer: string;
          lawyer_reason: string | null;
          local_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question: string;
          title: string;
          brief: string;
          insight?: string | null;
          explanation: string;
          category?: string;
          urgency?: "low" | "medium" | "high";
          language?: "he" | "ar" | "en";
          source?: "ai" | "demo";
          action_plan?: Json;
          evidence_checklist?: Json;
          common_mistakes?: Json;
          lawyer_questions?: Json;
          glossary?: Json;
          legal_aid?: Json;
          deadline_hint?: Json | null;
          disclaimer: string;
          lawyer_reason?: string | null;
          local_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question?: string;
          title?: string;
          brief?: string;
          insight?: string | null;
          explanation?: string;
          category?: string;
          urgency?: "low" | "medium" | "high";
          language?: "he" | "ar" | "en";
          source?: "ai" | "demo";
          action_plan?: Json;
          evidence_checklist?: Json;
          common_mistakes?: Json;
          lawyer_questions?: Json;
          glossary?: Json;
          legal_aid?: Json;
          deadline_hint?: Json | null;
          disclaimer?: string;
          lawyer_reason?: string | null;
          local_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      request_events: {
        Row: {
          id: string;
          user_id: string | null;
          event_type: string;
          metadata: Json;
          client_timestamp: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_type: string;
          metadata?: Json;
          client_timestamp?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          event_type?: string;
          metadata?: Json;
          client_timestamp?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      analytics_daily: {
        Row: {
          date: string;
          total_users: number;
          active_users: number;
          total_requests: number;
          total_demo_requests: number;
          avg_response_time_ms: number | null;
          success_rate: number | null;
          top_category: string | null;
          category_breakdown: Json;
          avg_checklist_completion: number | null;
          avg_actions_per_user: number | null;
          created_at: string;
          updated_at: string;
        };
        Relationships: [];
      };
      ai_interactions: {
        Row: {
          id: string;
          request_id: string | null;
          user_id: string | null;
          provider: string;
          model: string;
          latency_ms: number;
          prompt_tokens: number | null;
          completion_tokens: number | null;
          total_tokens: number | null;
          error_code: string | null;
          error_message: string | null;
          raw_response_size_bytes: number | null;
          created_at: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: never;
        Returns: boolean;
      };
      admin_stats: {
        Args: never;
        Returns: {
          total_users: number;
          total_requests: number;
          requests_today: number;
          active_users_today: number;
        }[];
      };
      admin_recent_requests: {
        Args: { limit_count?: number }
        Returns: {
          id: string;
          user_id: string;
          question: string;
          title: string;
          category: string;
          urgency: string;
          source: string;
          created_at: string;
          user_name: string;
        }[];
      };
      admin_users_list: {
        Args: { limit_count?: number }
        Returns: {
          id: string;
          name: string;
          email: string;
          created_at: string;
          request_count: number;
        }[];
      };
    };
    Enums: {
      legal_urgency: "low" | "medium" | "high";
      legal_source: "ai" | "demo";
      legal_language: "he" | "ar" | "en";
    };
  };
}
