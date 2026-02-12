'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Direction, GameState } from '@/types/game';

interface UseRealtimeProps {
  roomId: string;
  playerId: string;
  onGameStart: (state: GameState) => void;
  onGameUpdate: (state: GameState) => void;
  onGameEnd: (winner: string | null, p1Score: number, p2Score: number) => void;
  onPlayerDisconnect: (playerId: string) => void;
}

export function useRealtime({
  roomId,
  playerId,
  onGameStart,
  onGameUpdate,
  onGameEnd,
  onPlayerDisconnect,
}: UseRealtimeProps) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: {
          key: playerId,
        },
      },
    });

    channel
      .on('broadcast', { event: 'game_start' }, ({ payload }) => {
        onGameStart(payload as GameState);
      })
      .on('broadcast', { event: 'game_update' }, ({ payload }) => {
        onGameUpdate(payload as GameState);
      })
      .on('broadcast', { event: 'game_end' }, ({ payload }) => {
        onGameEnd(payload.winner, payload.player1Score, payload.player2Score);
      })
      .on('broadcast', { event: 'player_disconnect' }, ({ payload }) => {
        onPlayerDisconnect(payload.playerId);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        if (leftPresences.length > 0) {
          // Birisi ayrıldı - bu durumda rakip ayrılmış demektir
          onPlayerDisconnect('opponent');
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, playerId, onGameStart, onGameUpdate, onGameEnd, onPlayerDisconnect, supabase]);

  const sendDirection = useCallback((direction: Direction) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'player_move',
        payload: { playerId, direction, timestamp: Date.now() },
      });
    }
  }, [playerId]);

  const broadcastGameState = useCallback((state: GameState) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'game_update',
        payload: state,
      });
    }
  }, []);

  const broadcastGameStart = useCallback((state: GameState) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'game_start',
        payload: state,
      });
    }
  }, []);

  const broadcastGameEnd = useCallback((winner: string | null, p1Score: number, p2Score: number) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'game_end',
        payload: { winner, player1Score: p1Score, player2Score: p2Score },
      });
    }
  }, []);

  return {
    sendDirection,
    broadcastGameState,
    broadcastGameStart,
    broadcastGameEnd,
    channel: channelRef.current,
  };
}
