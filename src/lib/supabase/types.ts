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
      rooms: {
        Row: {
          id: string;
          owner_id: string;
          guest_id: string | null;
          status: 'waiting' | 'playing' | 'finished';
          invite_token: string | null;
          winner_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          guest_id?: string | null;
          status?: 'waiting' | 'playing' | 'finished';
          invite_token?: string | null;
          winner_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          guest_id?: string | null;
          status?: 'waiting' | 'playing' | 'finished';
          invite_token?: string | null;
          winner_id?: string | null;
          created_at?: string;
        };
      };
      game_states: {
        Row: {
          room_id: string;
          grid: Json;
          player1_pos: Json;
          player2_pos: Json;
          player1_score: number;
          player2_score: number;
          player1_trail: Json;
          player2_trail: Json;
          player1_direction: string;
          player2_direction: string;
          remaining_time: number;
          updated_at: string;
        };
        Insert: {
          room_id: string;
          grid?: Json;
          player1_pos?: Json;
          player2_pos?: Json;
          player1_score?: number;
          player2_score?: number;
          player1_trail?: Json;
          player2_trail?: Json;
          player1_direction?: string;
          player2_direction?: string;
          remaining_time?: number;
          updated_at?: string;
        };
        Update: {
          room_id?: string;
          grid?: Json;
          player1_pos?: Json;
          player2_pos?: Json;
          player1_score?: number;
          player2_score?: number;
          player1_trail?: Json;
          player2_trail?: Json;
          player1_direction?: string;
          player2_direction?: string;
          remaining_time?: number;
          updated_at?: string;
        };
      };
    };
  };
}
