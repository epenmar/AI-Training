/**
 * Supabase database types for ASU AI Skills Training Dashboard.
 * Matches schema in supabase/migrations/001_create_schema.sql
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
      bloom_phases: {
        Row: {
          id: number;
          name: string;
          bloom_levels: string;
          description: string | null;
          sort_order: number;
        };
        Insert: {
          id: number;
          name: string;
          bloom_levels: string;
          description?: string | null;
          sort_order?: number;
        };
        Update: {
          id?: number;
          name?: string;
          bloom_levels?: string;
          description?: string | null;
          sort_order?: number;
        };
      };
      skills: {
        Row: {
          id: number;
          statement: string;
          short_name: string;
          bloom_phase_id: number;
          is_gap: boolean;
        };
        Insert: {
          id: number;
          statement: string;
          short_name: string;
          bloom_phase_id: number;
          is_gap?: boolean;
        };
        Update: {
          id?: number;
          statement?: string;
          short_name?: string;
          bloom_phase_id?: number;
          is_gap?: boolean;
        };
      };
      assessment_questions: {
        Row: {
          id: number;
          skill_id: number;
          scenario: string;
        };
        Insert: {
          id: number;
          skill_id: number;
          scenario: string;
        };
        Update: {
          id?: number;
          skill_id?: number;
          scenario?: string;
        };
      };
      assessment_options: {
        Row: {
          id: number;
          question_id: number;
          option_key: string;
          option_text: string;
          level_label: string;
          score: number;
        };
        Insert: {
          question_id: number;
          option_key: string;
          option_text: string;
          level_label: string;
          score: number;
        };
        Update: {
          question_id?: number;
          option_key?: string;
          option_text?: string;
          level_label?: string;
          score?: number;
        };
      };
      learning_items: {
        Row: {
          id: number;
          source: string;
          topic: string | null;
          summary: string | null;
          learning_level: string;
          direct_link: string | null;
          leveling_rationale: string | null;
        };
        Insert: {
          id?: number;
          source: string;
          topic?: string | null;
          summary?: string | null;
          learning_level: string;
          direct_link?: string | null;
          leveling_rationale?: string | null;
        };
        Update: {
          source?: string;
          topic?: string | null;
          summary?: string | null;
          learning_level?: string;
          direct_link?: string | null;
          leveling_rationale?: string | null;
        };
      };
      lesson_flow: {
        Row: {
          id: number;
          bloom_phase_id: number;
          original_phase: string | null;
          seq: number;
          topic: string | null;
          learning_level: string | null;
          modality: string | null;
          source: string | null;
          item_title: string;
          link: string | null;
          purpose: string | null;
          id_guidance: string | null;
          skill_ids: number[];
          specific_location: string | null;
        };
        Insert: {
          bloom_phase_id: number;
          original_phase?: string | null;
          seq: number;
          topic?: string | null;
          learning_level?: string | null;
          modality?: string | null;
          source?: string | null;
          item_title: string;
          link?: string | null;
          purpose?: string | null;
          id_guidance?: string | null;
          skill_ids?: number[];
          specific_location?: string | null;
        };
        Update: {
          bloom_phase_id?: number;
          original_phase?: string | null;
          seq?: number;
          topic?: string | null;
          learning_level?: string | null;
          modality?: string | null;
          source?: string | null;
          item_title?: string;
          link?: string | null;
          purpose?: string | null;
          id_guidance?: string | null;
          skill_ids?: number[];
          specific_location?: string | null;
        };
      };
      level_up_activities: {
        Row: {
          id: number;
          skill_id: number;
          band: string;
          title: string;
          description: string | null;
          time_estimate: string | null;
          deliverable: string | null;
          linked_phase_ids: number[];
        };
        Insert: {
          skill_id: number;
          band: string;
          title: string;
          description?: string | null;
          time_estimate?: string | null;
          deliverable?: string | null;
          linked_phase_ids?: number[];
        };
        Update: {
          skill_id?: number;
          band?: string;
          title?: string;
          description?: string | null;
          time_estimate?: string | null;
          deliverable?: string | null;
          linked_phase_ids?: number[];
        };
      };
      activity_guide_steps: {
        Row: {
          id: number;
          activity_id: number;
          step_number: number;
          instruction: string;
        };
        Insert: {
          activity_id: number;
          step_number: number;
          instruction: string;
        };
        Update: {
          activity_id?: number;
          step_number?: number;
          instruction?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
        };
      };
      assessment_attempts: {
        Row: {
          id: string;
          user_id: string;
          total_score: number;
          overall_band: string;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_score: number;
          overall_band: string;
          completed_at?: string;
        };
        Update: {
          total_score?: number;
          overall_band?: string;
        };
      };
      assessment_responses: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: number;
          selected_option_key: string;
          score: number;
          level_label: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_id: number;
          selected_option_key: string;
          score: number;
          level_label: string;
        };
        Update: {
          selected_option_key?: string;
          score?: number;
          level_label?: string;
        };
      };
      user_activity_completions: {
        Row: {
          id: string;
          user_id: string;
          activity_id: number;
          completed_at: string;
          deliverable_notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_id: number;
          completed_at?: string;
          deliverable_notes?: string | null;
        };
        Update: {
          completed_at?: string;
          deliverable_notes?: string | null;
        };
      };
      community_posts: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          media_url: string;
          media_type: string;
          skill_id: number | null;
          activity_id: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          media_url: string;
          media_type?: string;
          skill_id?: number | null;
          activity_id?: number | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          media_url?: string;
          media_type?: string;
          skill_id?: number | null;
          activity_id?: number | null;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// ─── Convenience aliases ───────────────────────────────────

export type BloomPhase = Database["public"]["Tables"]["bloom_phases"]["Row"];
export type Skill = Database["public"]["Tables"]["skills"]["Row"];
export type AssessmentQuestion = Database["public"]["Tables"]["assessment_questions"]["Row"];
export type AssessmentOption = Database["public"]["Tables"]["assessment_options"]["Row"];
export type LearningItem = Database["public"]["Tables"]["learning_items"]["Row"];
export type LessonFlowItem = Database["public"]["Tables"]["lesson_flow"]["Row"];
export type LevelUpActivity = Database["public"]["Tables"]["level_up_activities"]["Row"];
export type ActivityGuideStep = Database["public"]["Tables"]["activity_guide_steps"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type AssessmentAttempt = Database["public"]["Tables"]["assessment_attempts"]["Row"];
export type AssessmentResponse = Database["public"]["Tables"]["assessment_responses"]["Row"];
export type UserActivityCompletion = Database["public"]["Tables"]["user_activity_completions"]["Row"];
export type CommunityPost = Database["public"]["Tables"]["community_posts"]["Row"];
