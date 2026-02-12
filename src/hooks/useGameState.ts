'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Direction, GameState, MatchScore } from '@/types/game';
import {
  createInitialGameState,
  createRematchState,
  changeDirection,
  processTick,
  handlePlayerDisconnect,
  requestRematch,
  cancelRematch,
  areBothPlayersReadyForRematch,
  GameSettings,
} from '@/lib/game/engine';
import { TICK_RATE } from '@/lib/game/constants';

interface UseGameStateProps {
  player1Id: string;
  player2Id: string;
  isHost: boolean;
  gameSettings: GameSettings;
  onStateChange?: (state: GameState) => void;
  onGameEnd?: (winner: string | null, p1Score: number, p2Score: number, matchScore: MatchScore) => void;
  onRematchStart?: (state: GameState) => void;
}

export function useGameState({
  player1Id,
  player2Id,
  isHost,
  gameSettings,
  onStateChange,
  onGameEnd,
  onRematchStart,
}: UseGameStateProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStateRef = useRef<GameState | null>(null);

  // Oyunu başlat
  const startGame = useCallback((existingMatchScore?: MatchScore, overridePlayer2Id?: string) => {
    const p2Id = overridePlayer2Id || player2Id;
    console.log('[useGameState] startGame called. player1Id:', player1Id, 'player2Id:', p2Id);
    const initialState = createInitialGameState(player1Id, p2Id, gameSettings, existingMatchScore);
    setGameState(initialState);
    lastStateRef.current = initialState;
    onStateChange?.(initialState);
    return initialState;
  }, [player1Id, player2Id, gameSettings, onStateChange]);

  // Rövanş başlat
  const startRematch = useCallback(() => {
    if (!gameState) return null;

    const rematchState = createRematchState(gameState, gameSettings.gameDuration);
    setGameState(rematchState);
    lastStateRef.current = rematchState;
    onRematchStart?.(rematchState);
    onStateChange?.(rematchState);
    return rematchState;
  }, [gameState, gameSettings.gameDuration, onStateChange, onRematchStart]);

  // Yön değiştir
  const updateDirection = useCallback((playerId: string, direction: Direction) => {
    setGameState((prev) => {
      if (!prev || prev.status !== 'playing') return prev;
      const newState = changeDirection(prev, playerId, direction);
      lastStateRef.current = newState;
      return newState;
    });
  }, []);

  // Rövanş iste
  const handleRequestRematch = useCallback((playerId: string) => {
    setGameState((prev) => {
      if (!prev || prev.status !== 'finished') return prev;
      const newState = requestRematch(prev, playerId);
      lastStateRef.current = newState;
      onStateChange?.(newState);
      return newState;
    });
  }, [onStateChange]);

  // Rövanş iptal
  const handleCancelRematch = useCallback((playerId: string) => {
    setGameState((prev) => {
      if (!prev || prev.status !== 'finished') return prev;
      const newState = cancelRematch(prev, playerId);
      lastStateRef.current = newState;
      onStateChange?.(newState);
      return newState;
    });
  }, [onStateChange]);

  // State'i dışarıdan güncelle (realtime için)
  const syncState = useCallback((stateOrUpdater: GameState | ((prev: GameState | null) => GameState | null)) => {
    if (typeof stateOrUpdater === 'function') {
      setGameState((prev) => {
        const newState = stateOrUpdater(prev);
        if (newState) {
          lastStateRef.current = newState;
        }
        return newState;
      });
    } else {
      setGameState(stateOrUpdater);
      lastStateRef.current = stateOrUpdater;
    }
  }, []);

  // Oyuncu bağlantısı koptu
  const handleDisconnect = useCallback((playerId: string) => {
    setGameState((prev) => {
      if (!prev || prev.status === 'finished') return prev;
      const newState = handlePlayerDisconnect(prev, playerId);
      onGameEnd?.(newState.winner, newState.player1.score, newState.player2.score, newState.matchScore);
      return newState;
    });
  }, [onGameEnd]);

  // Rövanş kontrolü
  useEffect(() => {
    if (!gameState || gameState.status !== 'finished' || !isHost) return;

    if (areBothPlayersReadyForRematch(gameState)) {
      // Her iki oyuncu da hazır - rövanşı başlat
      const rematchState = startRematch();
      if (rematchState) {
        onRematchStart?.(rematchState);
      }
    }
  }, [gameState?.rematch, isHost, startRematch, onRematchStart]);

  // Tick döngüsü (sadece host çalıştırır)
  useEffect(() => {
    if (!isHost || !gameState || gameState.status !== 'playing') {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      return;
    }

    tickIntervalRef.current = setInterval(() => {
      setGameState((prev) => {
        if (!prev || prev.status !== 'playing') {
          if (tickIntervalRef.current) {
            clearInterval(tickIntervalRef.current);
            tickIntervalRef.current = null;
          }
          return prev;
        }

        const newState = processTick(prev);
        lastStateRef.current = newState;
        onStateChange?.(newState);

        // Oyun bitti mi?
        if (newState.status === 'finished') {
          onGameEnd?.(newState.winner, newState.player1.score, newState.player2.score, newState.matchScore);
          if (tickIntervalRef.current) {
            clearInterval(tickIntervalRef.current);
            tickIntervalRef.current = null;
          }
        }

        return newState;
      });
    }, TICK_RATE);

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    };
  }, [isHost, gameState?.status, onStateChange, onGameEnd]);

  return {
    gameState,
    startGame,
    startRematch,
    updateDirection,
    syncState,
    handleDisconnect,
    handleRequestRematch,
    handleCancelRematch,
  };
}
