import { CellState, Position } from '@/types/game';
import { GRID_SIZE, SAFE_ZONE_SIZE, PLAYER1_START, PLAYER2_START } from './constants';

// Boş grid oluştur
export function createEmptyGrid(): number[][] {
  return Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(CellState.Empty));
}

// Başlangıç grid'i oluştur (güvenli alanlar dahil)
export function createInitialGrid(): number[][] {
  const grid = createEmptyGrid();

  // Oyuncu 1 güvenli alanı
  fillSafeZone(grid, PLAYER1_START, CellState.Player1Territory);

  // Oyuncu 2 güvenli alanı
  fillSafeZone(grid, PLAYER2_START, CellState.Player2Territory);

  return grid;
}

// Güvenli alan doldur
function fillSafeZone(grid: number[][], center: Position, state: CellState): void {
  const halfSize = Math.floor(SAFE_ZONE_SIZE / 2);
  for (let dy = -halfSize; dy <= halfSize; dy++) {
    for (let dx = -halfSize; dx <= halfSize; dx++) {
      const x = center.x + dx;
      const y = center.y + dy;
      if (isValidPosition(x, y)) {
        grid[y][x] = state;
      }
    }
  }
}

// Pozisyon geçerli mi?
export function isValidPosition(x: number, y: number): boolean {
  return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
}

// Hücre belirli bir oyuncunun alanı mı?
export function isPlayerTerritory(grid: number[][], pos: Position, playerId: 1 | 2): boolean {
  if (!isValidPosition(pos.x, pos.y)) return false;
  const territoryState = playerId === 1 ? CellState.Player1Territory : CellState.Player2Territory;
  return grid[pos.y][pos.x] === territoryState;
}

// Hücre herhangi bir trail mi?
export function isTrail(grid: number[][], pos: Position): boolean {
  if (!isValidPosition(pos.x, pos.y)) return false;
  const cell = grid[pos.y][pos.x];
  return cell === CellState.Player1Trail || cell === CellState.Player2Trail;
}

// Rakibin trail'i mi?
export function isEnemyTrail(grid: number[][], pos: Position, playerId: 1 | 2): boolean {
  if (!isValidPosition(pos.x, pos.y)) return false;
  const enemyTrailState = playerId === 1 ? CellState.Player2Trail : CellState.Player1Trail;
  return grid[pos.y][pos.x] === enemyTrailState;
}

// Skoru hesapla
export function calculateScore(grid: number[][], playerId: 1 | 2): number {
  const territoryState = playerId === 1 ? CellState.Player1Territory : CellState.Player2Territory;
  let count = 0;
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x] === territoryState) {
        count++;
      }
    }
  }
  return count;
}

// Grid klonla
export function cloneGrid(grid: number[][]): number[][] {
  return grid.map(row => [...row]);
}

// Trail'i kalıcı alana dönüştür
export function convertTrailToTerritory(grid: number[][], playerId: 1 | 2): void {
  const trailState = playerId === 1 ? CellState.Player1Trail : CellState.Player2Trail;
  const territoryState = playerId === 1 ? CellState.Player1Territory : CellState.Player2Territory;

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x] === trailState) {
        grid[y][x] = territoryState;
      }
    }
  }
}

// Oyuncunun trail'ini temizle
export function clearPlayerTrail(grid: number[][], playerId: 1 | 2): void {
  const trailState = playerId === 1 ? CellState.Player1Trail : CellState.Player2Trail;

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x] === trailState) {
        grid[y][x] = CellState.Empty;
      }
    }
  }
}
