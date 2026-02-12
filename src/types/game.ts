// Hücre durumları
export enum CellState {
  Empty = 0,
  Player1Territory = 1,
  Player2Territory = 2,
  Player1Trail = 3,
  Player2Trail = 4,
}

// Yön enumları
export enum Direction {
  Up = 'up',
  Down = 'down',
  Left = 'left',
  Right = 'right',
}

// Pozisyon tipi
export interface Position {
  x: number;
  y: number;
}

// Oyuncu durumu
export interface PlayerState {
  id: string;
  position: Position;
  direction: Direction;
  trail: Position[];
  score: number;
  isAlive: boolean;
  isRespawning: boolean; // Yeniden doğuyor mu?
  respawnTimer: number; // Kalan respawn süresi (saniye)
}

// Maç skoru
export interface MatchScore {
  player1Wins: number;
  player2Wins: number;
  matchNumber: number;
  totalRounds: number; // Toplam tur sayısı
}

// Rövanş durumu
export interface RematchState {
  player1Ready: boolean;
  player2Ready: boolean;
  countdown: number | null; // Geri sayım başladıysa
}

// Oyun durumu
export interface GameState {
  grid: number[][];
  player1: PlayerState;
  player2: PlayerState;
  remainingTime: number;
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
  winner: string | null;
  matchScore: MatchScore;
  rematch: RematchState;
}

// Oda ayarları
export interface RoomSettings {
  gameDuration: number; // saniye
  totalRounds: number; // toplam tur sayısı
}

// Oda durumu
export interface Room {
  id: string;
  owner_id: string;
  guest_id: string | null;
  status: 'waiting' | 'playing' | 'finished';
  invite_token: string | null;
  winner_id: string | null;
  game_duration: number; // saniye
  total_rounds: number; // toplam tur sayısı
  created_at: string;
}

// Hareket intent
export interface MoveIntent {
  playerId: string;
  direction: Direction;
  timestamp: number;
}

// Grid güncelleme
export interface GridUpdate {
  changes: {
    x: number;
    y: number;
    value: CellState;
  }[];
  player1Score: number;
  player2Score: number;
  player1Position: Position;
  player2Position: Position;
}

// Realtime event tipleri
export type RealtimeEvent =
  | { type: 'game_start'; payload: GameState }
  | { type: 'player_move'; payload: MoveIntent }
  | { type: 'grid_update'; payload: GridUpdate }
  | { type: 'game_end'; payload: { winner: string | null; player1Score: number; player2Score: number } }
  | { type: 'player_disconnected'; payload: { playerId: string } };
