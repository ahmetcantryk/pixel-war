// Grid sabitleri
export const GRID_SIZE = 50; // Arena boyutu (50x50)
export const CELL_SIZE = 14; // Pixel boyutu

// Zamanlama
export const TICK_RATE = 75; // ms
export const GAME_DURATION = 30; // Test için sınırsız
export const RECONNECT_TIMEOUT = 5000; // ms
export const RESPAWN_DURATION = 3; // saniye - yeniden doğma süresi
export const COUNTDOWN_DURATION = 3; // saniye - maç başlangıç geri sayımı

// Başlangıç pozisyonları (50x50 grid için)
export const PLAYER1_START: { x: number; y: number } = { x: 12, y: 25 };
export const PLAYER2_START: { x: number; y: number } = { x: 38, y: 25 };

// Başlangıç yönleri - birbirinden uzaklaşacak şekilde
export const PLAYER1_START_DIRECTION = 'left';
export const PLAYER2_START_DIRECTION = 'right';

// Güvenli alan boyutu (başlangıç alanı)
export const SAFE_ZONE_SIZE = 3;

// Renkler - Beyaz tema
export const COLORS = {
  empty: '#F3F4F6',
  player1Territory: '#3B82F6',
  player2Territory: '#EF4444',
  player1Trail: 'rgba(59, 130, 246, 0.4)',
  player2Trail: 'rgba(239, 68, 68, 0.4)',
  player1: '#1D4ED8',
  player1Head: '#000000', // Siyah baş
  player2: '#B91C1C',
  player2Head: '#000000', // Siyah baş
  gridLine: '#E5E7EB',
  background: '#FFFFFF',
} as const;

// Yön vektörleri
export const DIRECTION_VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
} as const;
