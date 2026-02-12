import { CellState, Position } from '@/types/game';
import { GRID_SIZE } from './constants';
import { isValidPosition, cloneGrid, convertTrailToTerritory } from './grid';

interface FillResult {
  grid: number[][];
  filledCount: number;
  capturedFromEnemy: number;
}

// BFS ile dış alanı bul ve kapalı alanları doldur
export function fillEnclosedArea(
  originalGrid: number[][],
  playerId: 1 | 2
): FillResult {
  const grid = cloneGrid(originalGrid);
  const territoryState = playerId === 1 ? CellState.Player1Territory : CellState.Player2Territory;
  const enemyTerritoryState = playerId === 1 ? CellState.Player2Territory : CellState.Player1Territory;

  // Önce trail'i territory'ye dönüştür
  convertTrailToTerritory(grid, playerId);

  // Dışarıdan erişilebilir alanları bulmak için flood fill
  // Kenarlardan başlayarak, kendi territory'sine çarpmadan ulaşılabilen her yeri işaretle
  const reachableFromOutside: boolean[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(false));

  const queue: Position[] = [];
  const directions = [
    { x: 0, y: -1 },  // yukarı
    { x: 0, y: 1 },   // aşağı
    { x: -1, y: 0 },  // sol
    { x: 1, y: 0 },   // sağ
  ];

  // Tüm kenar hücrelerini kuyruğa ekle (kendi territory'si olmayanlar)
  for (let i = 0; i < GRID_SIZE; i++) {
    // Üst kenar
    if (grid[0][i] !== territoryState && !reachableFromOutside[0][i]) {
      queue.push({ x: i, y: 0 });
      reachableFromOutside[0][i] = true;
    }
    // Alt kenar
    if (grid[GRID_SIZE - 1][i] !== territoryState && !reachableFromOutside[GRID_SIZE - 1][i]) {
      queue.push({ x: i, y: GRID_SIZE - 1 });
      reachableFromOutside[GRID_SIZE - 1][i] = true;
    }
    // Sol kenar
    if (grid[i][0] !== territoryState && !reachableFromOutside[i][0]) {
      queue.push({ x: 0, y: i });
      reachableFromOutside[i][0] = true;
    }
    // Sağ kenar
    if (grid[i][GRID_SIZE - 1] !== territoryState && !reachableFromOutside[i][GRID_SIZE - 1]) {
      queue.push({ x: GRID_SIZE - 1, y: i });
      reachableFromOutside[i][GRID_SIZE - 1] = true;
    }
  }

  // BFS - dışarıdan erişilebilir tüm hücreleri bul
  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const dir of directions) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;

      // Geçerli pozisyon mu?
      if (!isValidPosition(nx, ny)) continue;
      
      // Zaten ziyaret edilmiş mi?
      if (reachableFromOutside[ny][nx]) continue;
      
      // Kendi territory'si ise engel - buradan geçemez
      if (grid[ny][nx] === territoryState) continue;

      // Bu hücre dışarıdan erişilebilir
      reachableFromOutside[ny][nx] = true;
      queue.push({ x: nx, y: ny });
    }
  }

  // Dışarıdan erişilemeyen (kapalı) alanları doldur
  let filledCount = 0;
  let capturedFromEnemy = 0;

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      // Dışarıdan erişilemez VE kendi territory'si değil = kapalı alan
      if (!reachableFromOutside[y][x] && grid[y][x] !== territoryState) {
        // Düşman territory'si mi?
        if (grid[y][x] === enemyTerritoryState) {
          capturedFromEnemy++;
        }
        // Doldur
        grid[y][x] = territoryState;
        filledCount++;
      }
    }
  }

  return {
    grid,
    filledCount,
    capturedFromEnemy,
  };
}

// Oyuncunun kendi alanına dönüp dönmediğini kontrol et
export function checkReturnToTerritory(
  grid: number[][],
  pos: Position,
  playerId: 1 | 2,
  hasTrail: boolean
): boolean {
  if (!hasTrail) return false;

  const territoryState = playerId === 1 ? CellState.Player1Territory : CellState.Player2Territory;
  return isValidPosition(pos.x, pos.y) && grid[pos.y][pos.x] === territoryState;
}
