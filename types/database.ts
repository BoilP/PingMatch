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
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          age: number | null;
          city: string;
          bio: string | null;
          skill_level: string;
          rank_points: number;
          wins: number;
          losses: number;
          media_urls: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          age?: number | null;
          city?: string;
          bio?: string | null;
          skill_level?: string;
          rank_points?: number;
          wins?: number;
          losses?: number;
          media_urls?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          age?: number | null;
          city?: string;
          bio?: string | null;
          skill_level?: string;
          rank_points?: number;
          wins?: number;
          losses?: number;
          media_urls?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          user1_action: string | null;
          user2_action: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user1_id: string;
          user2_id: string;
          user1_action?: string | null;
          user2_action?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user1_id?: string;
          user2_id?: string;
          user1_action?: string | null;
          user2_action?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          match_id: string;
          sender_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      table_locations: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          lat: number;
          lng: number;
          tables_count: number;
          is_available: boolean;
          opening_hours: string | null;
          price_per_hour: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          lat: number;
          lng: number;
          tables_count?: number;
          is_available?: boolean;
          opening_hours?: string | null;
          price_per_hour?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          lat?: number;
          lng?: number;
          tables_count?: number;
          is_available?: boolean;
          opening_hours?: string | null;
          price_per_hour?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      game_results: {
        Row: {
          id: string;
          match_id: string;
          winner_id: string;
          loser_id: string;
          winner_score: number | null;
          loser_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          winner_id: string;
          loser_id: string;
          winner_score?: number | null;
          loser_score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          winner_id?: string;
          loser_id?: string;
          winner_score?: number | null;
          loser_score?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      handle_swipe: {
        Args: { p_user_id: string; p_target_id: string; p_action: string };
        Returns: Json;
      };
      record_game_result: {
        Args: {
          p_match_id: string;
          p_winner_id: string;
          p_loser_id: string;
          p_winner_score?: number | null;
          p_loser_score?: number | null;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
