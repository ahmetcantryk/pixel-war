import { CellState, Direction, GameState, Position, PlayerState, MatchScore, RematchState } from '@/types/game';
import {
  GRID_SIZE,
  GAME_DURATION,
  DIRECTION_VECTORS,
  PLAYER1_START,
  PLAYER2_START,
  RESPAWN_DURATION,
} from './constants';
import {
  createInitialGrid,
  isValidPosition,
  isPlayerTerritory,
  isEnemyTrail,
  calculateScore,
  cloneGrid,
  clearPlayerTrail,
} from './grid';
import { fillEnclosedArea } from './flood-fill';

// Başlangıç oyuncu durumu oluştur
function createInitialPlayerState(id: string, playerId: 1 | 2): PlayerState {
  const startPos = playerId === 1 ? PLAYER1_START : PLAYER2_START;
  // Birbirinden uzaklaşacak yönler
  const startDir = playerId === 1 ? Direction.Left : Direction.Right;

  return {
    id,
    position: { ...startPos },
    direction: startDir,
    trail: [],
    score: 0,
    isAlive: true,
    isRespawning: false,
    respawnTimer: 0,
  };
}

// Oyun ayarları
export interface GameSettings {
  gameDuration: number;
  totalRounds: number;
}

// Başlangıç oyun durumu oluştur
export function createInitialGameState(
  player1Id: string,
  player2Id: string,
  settings?: GameSettings,
  existingMatchScore?: MatchScore
): GameState {
  const grid = createInitialGrid();
  const gameDuration = settings?.gameDuration || GAME_DURATION;
  const totalRounds = settings?.totalRounds || 3;

  const matchScore: MatchScore = existingMatchScore || {
    player1Wins: 0,
    player2Wins: 0,
    matchNumber: 1,
    totalRounds,
  };

  const player1 = createInitialPlayerState(player1Id, 1);
  const player2 = createInitialPlayerState(player2Id, 2);

  // Başlangıç skorlarını hesapla
  player1.score = calculateScore(grid, 1);
  player2.score = calculateScore(grid, 2);

  return {
    grid,
    player1,
    player2,
    remainingTime: gameDuration,
    status: 'playing',
    winner: null,
    matchScore,
    rematch: {
      player1Ready: false,
      player2Ready: false,
      countdown: null,
    },
  };
}

// Yeni maç için state oluştur (rövanş)
export function createRematchState(previousState: GameState, gameDuration: number): GameState {
  const newMatchScore: MatchScore = {
    ...previousState.matchScore,
    matchNumber: previousState.matchScore.matchNumber + 1,
  };

  return createInitialGameState(
    previousState.player1.id,
    previousState.player2.id,
    { gameDuration, totalRounds: previousState.matchScore.totalRounds },
    newMatchScore
  );
}

// Oyuncunun yönünü değiştir
export function changeDirection(
  state: GameState,
  playerId: string,
  newDirection: Direction
): GameState {
  const newState = { ...state };

  if (state.player1.id === playerId && !state.player1.isRespawning) {
    // Ters yöne gidemez
    if (!isOppositeDirection(state.player1.direction, newDirection)) {
      newState.player1 = { ...state.player1, direction: newDirection };
    }
  } else if (state.player2.id === playerId && !state.player2.isRespawning) {
    if (!isOppositeDirection(state.player2.direction, newDirection)) {
      newState.player2 = { ...state.player2, direction: newDirection };
    }
  }

  return newState;
}

// Ters yön kontrolü
function isOppositeDirection(current: Direction, next: Direction): boolean {
  return (
    (current === Direction.Up && next === Direction.Down) ||
    (current === Direction.Down && next === Direction.Up) ||
    (current === Direction.Left && next === Direction.Right) ||
    (current === Direction.Right && next === Direction.Left)
  );
}

// Oyuncuyu respawn et (başlangıç noktasına gönder)
function respawnPlayer(grid: number[][], player: PlayerState, playerId: 1 | 2): { grid: number[][], player: PlayerState } {
  const newGrid = cloneGrid(grid);
  
  // Oyuncunun trail'ini temizle
  clearPlayerTrail(newGrid, playerId);

  const startPos = playerId === 1 ? PLAYER1_START : PLAYER2_START;
  // Birbirinden uzaklaşacak yönler
  const startDir = playerId === 1 ? Direction.Left : Direction.Right;

  const newPlayer: PlayerState = {
    ...player,
    position: { ...startPos },
    direction: startDir,
    trail: [],
    isRespawning: true,
    respawnTimer: RESPAWN_DURATION,
  };

  return { grid: newGrid, player: newPlayer };
}

// Bir tick işle
export function processTick(state: GameState): GameState {
  if (state.status !== 'playing') return state;

  let newState = { ...state };
  let newGrid = cloneGrid(state.grid);

  // Respawn timer'ları güncelle
  let player1 = { ...state.player1 };
  let player2 = { ...state.player2 };

  if (player1.isRespawning) {
    player1.respawnTimer = Math.max(0, player1.respawnTimer - 0.1);
    if (player1.respawnTimer <= 0) {
      player1.isRespawning = false;
      player1.respawnTimer = 0;
    }
  }

  if (player2.isRespawning) {
    player2.respawnTimer = Math.max(0, player2.respawnTimer - 0.1);
    if (player2.respawnTimer <= 0) {
      player2.isRespawning = false;
      player2.respawnTimer = 0;
    }
  }

  // Respawn'da olmayan oyuncuları hareket ettir
  if (!player1.isRespawning) {
    const result1 = movePlayer(newGrid, player1, 1);
    newGrid = result1.grid;
    player1 = result1.player;
  }

  if (!player2.isRespawning) {
    const result2 = movePlayer(newGrid, player2, 2);
    newGrid = result2.grid;
    player2 = result2.player;
  }

  // Çarpışma kontrolü (sadece respawn'da olmayanlar için)
  const collision = checkCollision(player1, player2, newGrid);

  if (collision.player1Hit && !player1.isRespawning) {
    const respawn1 = respawnPlayer(newGrid, player1, 1);
    newGrid = respawn1.grid;
    player1 = respawn1.player;
  }

  if (collision.player2Hit && !player2.isRespawning) {
    const respawn2 = respawnPlayer(newGrid, player2, 2);
    newGrid = respawn2.grid;
    player2 = respawn2.player;
  }

  // Skorları güncelle
  player1.score = calculateScore(newGrid, 1);
  player2.score = calculateScore(newGrid, 2);

  newState.player1 = player1;
  newState.player2 = player2;
  newState.grid = newGrid;

  // Süreyi azalt
  newState.remainingTime = Math.max(0, state.remainingTime - 0.1);

  // Süre bitti mi?
  if (newState.remainingTime <= 0) {
    newState.status = 'finished';
    
    // Kazananı belirle
    if (player1.score > player2.score) {
      newState.winner = player1.id;
      newState.matchScore = {
        ...newState.matchScore,
        player1Wins: newState.matchScore.player1Wins + 1,
      };
    } else if (player2.score > player1.score) {
      newState.winner = player2.id;
      newState.matchScore = {
        ...newState.matchScore,
        player2Wins: newState.matchScore.player2Wins + 1,
      };
    } else {
      newState.winner = null; // Berabere
    }

    // Rövanş state'ini sıfırla
    newState.rematch = {
      player1Ready: false,
      player2Ready: false,
      countdown: null,
    };
  }

  return newState;
}

// Oyuncuyu hareket ettir
function movePlayer(
  grid: number[][],
  player: PlayerState,
  playerId: 1 | 2
): { grid: number[][]; player: PlayerState } {
  if (!player.isAlive || player.isRespawning) {
    return { grid, player };
  }

  const direction = DIRECTION_VECTORS[player.direction];
  const newPos: Position = {
    x: player.position.x + direction.x,
    y: player.position.y + direction.y,
  };

  // Sınır kontrolü
  if (!isValidPosition(newPos.x, newPos.y)) {
    return { grid, player };
  }

  const newGrid = cloneGrid(grid);
  let newPlayer = { ...player, position: newPos };
  const trailState = playerId === 1 ? CellState.Player1Trail : CellState.Player2Trail;

  // Kendi alanında mı?
  const inOwnTerritory = isPlayerTerritory(grid, newPos, playerId);

  if (inOwnTerritory) {
    // Eğer trail varsa, kapalı alan hesapla
    if (player.trail.length > 0) {
      // Son pozisyonu da trail'e ekle (eve dönmeden önceki pixel)
      if (!isPlayerTerritory(grid, player.position, playerId)) {
        newGrid[player.position.y][player.position.x] = trailState;
      }
      const fillResult = fillEnclosedArea(newGrid, playerId);
      newPlayer.trail = [];
      return { grid: fillResult.grid, player: newPlayer };
    }
  } else {
    // Kendi alanı dışında - trail bırak
    // Önceki pozisyonu trail'e ekle
    if (!player.trail.some(t => t.x === player.position.x && t.y === player.position.y)) {
      newPlayer.trail = [...player.trail, player.position];
    }
    // Önceki pozisyonu trail olarak işaretle (eğer kendi alanı değilse)
    if (!isPlayerTerritory(grid, player.position, playerId)) {
      newGrid[player.position.y][player.position.x] = trailState;
    }
  }

  return { grid: newGrid, player: newPlayer };
}

// Çarpışma kontrolü - oyun bitmez, respawn olur
// Sadece kafa kafaya çarpışma kontrol edilir
// Rakip trail'e çarpma yok - üstünden geçilebilir
function checkCollision(
  player1: PlayerState,
  player2: PlayerState,
  grid: number[][]
): { player1Hit: boolean; player2Hit: boolean } {
  let player1Hit = false;
  let player2Hit = false;

  const p1Pos = player1.position;
  const p2Pos = player2.position;

  // Kafa kafaya çarpışma - ikisi de respawn olur
  if (p1Pos.x === p2Pos.x && p1Pos.y === p2Pos.y) {
    // İkisi de respawn'da değilse ikisi de vurulur
    if (!player1.isRespawning && !player2.isRespawning) {
      player1Hit = true;
      player2Hit = true;
    }
  }

  // Rakip trail'e çarpma yok - üstünden geçilebilir
  // Sadece kendi trail'e çarparsa sorun olur ama o da engelli

  return { player1Hit, player2Hit };
}

// Rövanş isteği
export function requestRematch(state: GameState, playerId: string): GameState {
  if (state.status !== 'finished') return state;

  const newState = { ...state };
  const newRematch = { ...state.rematch };

  if (playerId === state.player1.id) {
    newRematch.player1Ready = true;
  } else if (playerId === state.player2.id) {
    newRematch.player2Ready = true;
  }

  newState.rematch = newRematch;

  return newState;
}

// Rövanş iptal
export function cancelRematch(state: GameState, playerId: string): GameState {
  if (state.status !== 'finished') return state;

  const newState = { ...state };
  const newRematch = { ...state.rematch };

  if (playerId === state.player1.id) {
    newRematch.player1Ready = false;
  } else if (playerId === state.player2.id) {
    newRematch.player2Ready = false;
  }

  newState.rematch = newRematch;

  return newState;
}

// Her iki oyuncu da hazır mı?
export function areBothPlayersReadyForRematch(state: GameState): boolean {
  return state.rematch.player1Ready && state.rematch.player2Ready;
}

// Oyuncu bağlantısı koptuğunda
export function handlePlayerDisconnect(state: GameState, playerId: string): GameState {
  const newState = { ...state };
  newState.status = 'finished';

  if (state.player1.id === playerId) {
    newState.winner = state.player2.id;
    newState.player1 = { ...state.player1, isAlive: false };
    newState.matchScore = {
      ...newState.matchScore,
      player2Wins: newState.matchScore.player2Wins + 1,
    };
  } else {
    newState.winner = state.player1.id;
    newState.player2 = { ...state.player2, isAlive: false };
    newState.matchScore = {
      ...newState.matchScore,
      player1Wins: newState.matchScore.player1Wins + 1,
    };
  }

  return newState;
}
