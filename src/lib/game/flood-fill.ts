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
  const enemyTrailState = playerId === 1 ? CellState.Player2Trail : CellState.Player1Trail;

  // Önce trail'i territory'ye dönüştür
  convertTrailToTerritory(grid, playerId);

  // Dış alanları işaretlemek için visited array
  const visited: boolean[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(false));

  // Sınır hücrelerinden BFS başlat (dışarıdan erişilebilir alanları bul)
  const queue: Position[] = [];

  // Tüm kenar hücrelerini kuyruğa ekle (sadece oyuncunun territory'si olmayanlar)
  for (let i = 0; i < GRID_SIZE; i++) {
    // Üst kenar
    if (grid[0][i] !== territoryState) {
      queue.push({ x: i, y: 0 });
      visited[0][i] = true;
    }
    // Alt kenar
    if (grid[GRID_SIZE - 1][i] !== territoryState) {
      queue.push({ x: i, y: GRID_SIZE - 1 });
      visited[GRID_SIZE - 1][i] = true;
    }
    // Sol kenar
    if (grid[i][0] !== territoryState) {
      queue.push({ x: 0, y: i });
      visited[i][0] = true;
    }
    // Sağ kenar
    if (grid[i][GRID_SIZE - 1] !== territoryState) {
      queue.push({ x: GRID_SIZE - 1, y: i });
      visited[i][GRID_SIZE - 1] = true;
    }
  }

  // BFS ile dış alanları işaretle
  const directions = [
    { x: 0, y: -1 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;

    for (const dir of directions) {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;

      if (
        isValidPosition(nx, ny) &&
        !visited[ny][nx] &&
        grid[ny][nx] !== territoryState // Sadece kendi territory'si engel
      ) {
        visited[ny][nx] = true;
        queue.push({ x: nx, y: ny });
      }
    }
  }

  // Ziyaret edilmemiş hücreleri doldur (kapalı alan)
  let filledCount = 0;
  let capturedFromEnemy = 0;

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      // Ziyaret edilmemiş ve kendi territory'si olmayan her şeyi doldur
      if (!visited[y][x] && grid[y][x] !== territoryState) {
        if (grid[y][x] === enemyTerritoryState) {
          capturedFromEnemy++;
        }
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
