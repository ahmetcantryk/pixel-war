'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Room, GameState, Direction, MatchScore } from '@/types/game';
import { GameCanvas } from '@/components/GameCanvas';
import { ScoreBoard } from '@/components/ScoreBoard';
import { GameOverModal } from '@/components/GameOverModal';
import { WaitingRoom } from '@/components/WaitingRoom';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useGameState } from '@/hooks/useGameState';
import { COUNTDOWN_DURATION } from '@/lib/game/constants';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RoomClientProps {
  roomId: string;
  initialRoom: Room;
  currentUserId: string;
}

export function RoomClient({ roomId, initialRoom, currentUserId }: RoomClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [room, setRoom] = useState<Room>(initialRoom);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [channelReady, setChannelReady] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasJoinedRef = useRef(false);
  const gameStartedRef = useRef(false);

  const isOwner = room.owner_id === currentUserId;
  const isGuest = room.guest_id === currentUserId;
  const isHost = isOwner;
  const isPlayerFromRoom = isOwner || isGuest;

  const player1Id = room.owner_id;
  const player2Id = room.guest_id || '';

  // Broadcast fonksiyonu
  const broadcast = useCallback((event: string, payload: unknown) => {
    const channel = channelRef.current;
    if (channel) {
      console.log('[Broadcast]', event, payload);
      channel.send({
        type: 'broadcast',
        event,
        payload,
      });
    }
  }, []);

  // Geri sayım başlat
  const startCountdown = useCallback((onComplete: () => void) => {
    console.log('[Countdown] Starting...');
    setIsCountingDown(true);
    setCountdown(COUNTDOWN_DURATION);

    let remaining = COUNTDOWN_DURATION;
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    countdownIntervalRef.current = setInterval(() => {
      remaining -= 0.1;
      setCountdown(remaining);

      if (remaining <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdown(null);
        setIsCountingDown(false);
        console.log('[Countdown] Complete!');
        onComplete();
      }
    }, 100);
  }, []);

  // Oyun ayarları
  const gameSettings = {
    gameDuration: room.game_duration || 30,
    totalRounds: room.total_rounds || 3,
  };

  // Oyun state hook'u
  const {
    gameState,
    startGame,
    updateDirection,
    syncState,
    handleDisconnect,
    handleRequestRematch,
    handleCancelRematch,
  } = useGameState({
    player1Id,
    player2Id,
    isHost,
    gameSettings,
    onStateChange: useCallback(
      (state: GameState) => {
        if (isHost) {
          broadcast('game_update', state);
        }
      },
      [isHost, broadcast]
    ),
    onGameEnd: useCallback(
      (winner: string | null, p1Score: number, p2Score: number, matchScore: MatchScore) => {
        if (isHost) {
          broadcast('game_end', { winner, player1Score: p1Score, player2Score: p2Score, matchScore });
        }
      },
      [isHost, broadcast]
    ),
    onRematchStart: useCallback(
      (state: GameState) => {
        if (isHost) {
          broadcast('countdown_start', {});
          startCountdown(() => {
            broadcast('rematch_start', state);
          });
        }
      },
      [isHost, broadcast, startCountdown]
    ),
  });

  // isPlayer: room'dan veya gameState'ten kontrol et
  // Guest katıldığında room.guest_id henüz güncel olmayabilir ama gameState'te vardır
  const isPlayerFromGameState = gameState 
    ? (gameState.player1.id === currentUserId || gameState.player2.id === currentUserId)
    : false;
  const isPlayer = isPlayerFromRoom || isPlayerFromGameState;

  // Klavye kontrolü - her zaman aktif, kontroller callback içinde
  const keyboardEnabled = gameState?.status === 'playing' && !isCountingDown;
  
  useKeyboard({
    onDirectionChange: useCallback(
      (direction: Direction) => {
        console.log('[Keyboard] Direction change:', direction, 'gameState status:', gameState?.status, 'isCountingDown:', isCountingDown);
        
        if (!gameState || gameState.status !== 'playing' || isCountingDown) {
          console.log('[Keyboard] Blocked - game not playing or counting down');
          return;
        }

        // Hangi oyuncu olduğumuzu bul
        const isP1 = gameState.player1.id === currentUserId;
        const isP2 = gameState.player2.id === currentUserId;
        
        if (!isP1 && !isP2) {
          console.log('[Keyboard] Blocked - not a player. currentUserId:', currentUserId, 'p1:', gameState.player1.id, 'p2:', gameState.player2.id);
          return;
        }

        const player = isP1 ? gameState.player1 : gameState.player2;
        if (player.isRespawning) {
          console.log('[Keyboard] Blocked - player respawning');
          return;
        }

        console.log('[Keyboard] Sending direction change for player:', currentUserId);
        updateDirection(currentUserId, direction);
        broadcast('player_move', { playerId: currentUserId, direction });
      },
      [currentUserId, gameState, updateDirection, broadcast, isCountingDown]
    ),
    enabled: keyboardEnabled,
  });

  // Realtime channel kurulumu - sadece bir kez
  useEffect(() => {
    console.log('[Channel] Setting up for room:', roomId);
    
    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: { key: currentUserId },
        broadcast: { self: false },
      },
    });

    channel
      .on('broadcast', { event: 'guest_joined' }, ({ payload }) => {
        console.log('[Broadcast] guest_joined received', payload);
        if (gameStartedRef.current) return;
        
        // Host: Guest katıldı, oyunu başlat
        setRoom(prev => ({ ...prev, guest_id: payload.guestId, status: 'playing' }));
        
        // Sadece host oyunu başlatır
        if (isHost) {
          gameStartedRef.current = true;
          console.log('[Host] Starting countdown and game...');
          
          // Önce countdown_start gönder
          channel.send({
            type: 'broadcast',
            event: 'countdown_start',
            payload: {},
          });
          
          // Host kendi countdown'ını başlat
          startCountdown(() => {
            // Guest ID'yi payload'dan al çünkü room state henüz güncellenmemiş olabilir
            const guestId = payload.guestId;
            const initialState = startGame(undefined, guestId);
            if (initialState) {
              console.log('[Host] Game started, broadcasting game_start. Player2:', guestId);
              channel.send({
                type: 'broadcast',
                event: 'game_start',
                payload: initialState,
              });
            }
          });
        }
      })
      .on('broadcast', { event: 'countdown_start' }, () => {
        console.log('[Broadcast] countdown_start received');
        // Guest için countdown başlat
        if (!isHost) {
          startCountdown(() => {
            console.log('[Guest] Countdown complete, waiting for game_start');
          });
        }
      })
      .on('broadcast', { event: 'game_start' }, ({ payload }) => {
        console.log('[Broadcast] game_start received', payload);
        const state = payload as GameState;
        console.log('[Game] Player1:', state.player1.id, 'Player2:', state.player2.id, 'CurrentUser:', currentUserId);
        syncState(state);
        gameStartedRef.current = true;
      })
      .on('broadcast', { event: 'game_update' }, ({ payload }) => {
        if (!isHost) {
          syncState(payload as GameState);
        }
      })
      .on('broadcast', { event: 'game_end' }, ({ payload }) => {
        console.log('[Broadcast] game_end received');
        // Guest veya Host için game end - state'i güncelle
        syncState((prev: GameState | null) => {
          if (!prev) return null;
          return {
            ...prev,
            status: 'finished',
            winner: payload.winner,
            matchScore: payload.matchScore,
            rematch: {
              player1Ready: false,
              player2Ready: false,
              countdown: null,
            },
          };
        });
      })
      .on('broadcast', { event: 'rematch_start' }, ({ payload }) => {
        console.log('[Broadcast] rematch_start received');
        syncState(payload as GameState);
        gameStartedRef.current = true;
      })
      .on('broadcast', { event: 'rematch_request' }, ({ payload }) => {
        console.log('[Broadcast] rematch_request received', payload);
        syncState((prev: GameState | null) => {
          if (!prev || prev.status !== 'finished') return prev;
          const newRematch = { ...prev.rematch };
          if (payload.playerId === player1Id) {
            newRematch.player1Ready = payload.ready;
          } else {
            newRematch.player2Ready = payload.ready;
          }
          return { ...prev, rematch: newRematch };
        });
      })
      .on('broadcast', { event: 'player_move' }, ({ payload }) => {
        if (isHost && payload.playerId !== currentUserId) {
          updateDirection(payload.playerId, payload.direction);
        }
      })
      .on('presence', { event: 'leave' }, () => {
        // Opponent left
        if (gameStartedRef.current) {
          const disconnectedId = player1Id === currentUserId ? player2Id : player1Id;
          if (disconnectedId) {
            handleDisconnect(disconnectedId);
          }
        }
      })
      .subscribe(async (status) => {
        console.log('[Channel] Status:', status);
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
          setChannelReady(true);
          console.log('[Channel] Ready!');
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('[Channel] Cleanup');
      channel.unsubscribe();
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, currentUserId, isHost, supabase]);

  // Odaya katılma işlemi - channel hazır olduktan sonra
  useEffect(() => {
    if (!channelReady) return;
    if (hasJoinedRef.current) return;
    
    // Zaten oyuncu ise katılma işlemi yapma
    if (isPlayerFromRoom) {
      console.log('[Join] Already a player from room, skipping join');
      return;
    }
    
    if (isJoining) return;

    const joinRoom = async () => {
      console.log('[Join] Starting join process... channelReady:', channelReady);
      setIsJoining(true);
      hasJoinedRef.current = true;

      try {
        const { data, error } = await supabase.rpc('join_room', {
          p_room_id: roomId,
          p_user_id: currentUserId,
        });

        if (error) throw error;

        const result = data as { success: boolean; error?: string; role?: string; status?: string };
        console.log('[Join] Result:', result);
        
        if (!result.success) {
          setError(result.error || 'Odaya katılınamadı');
          hasJoinedRef.current = false;
          return;
        }

        // Oda bilgisini güncelle
        const { data: updatedRoom } = await supabase.from('rooms').select('*').eq('id', roomId).single();
        console.log('[Join] Updated room:', updatedRoom);

        if (updatedRoom) {
          setRoom(updatedRoom);
          
          // Host'a katıldığımızı bildir
          if (result.role === 'guest') {
            console.log('[Join] Broadcasting guest_joined to host...');
            const channel = channelRef.current;
            if (channel) {
              // Biraz bekle ki host channel'ı hazır olsun
              setTimeout(() => {
                console.log('[Join] Sending guest_joined now');
                channel.send({
                  type: 'broadcast',
                  event: 'guest_joined',
                  payload: { guestId: currentUserId },
                });
              }, 500);
            } else {
              console.log('[Join] ERROR: Channel not ready!');
            }
          }
        }
      } catch (err) {
        console.error('[Join] Error:', err);
        setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
        hasJoinedRef.current = false;
      } finally {
        setIsJoining(false);
      }
    };

    joinRoom();
  }, [channelReady, roomId, currentUserId, isPlayerFromRoom, isJoining, supabase]);

  // Rövanş isteği handler
  const onRequestRematch = useCallback(() => {
    handleRequestRematch(currentUserId);
    broadcast('rematch_request', { playerId: currentUserId, ready: true });
  }, [currentUserId, handleRequestRematch, broadcast]);

  // Rövanş iptal handler
  const onCancelRematch = useCallback(() => {
    handleCancelRematch(currentUserId);
    broadcast('rematch_request', { playerId: currentUserId, ready: false });
  }, [currentUserId, handleCancelRematch, broadcast]);

  // Hata durumu
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md border">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Hata</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  // Bekleme odası
  if (!gameState && !isCountingDown) {
    return (
      <main className="min-h-screen flex flex-col bg-gray-50">
        <header className="p-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Geri
          </button>
        </header>
        <WaitingRoom 
          roomId={roomId} 
          isOwner={isOwner} 
          gameDuration={gameSettings.gameDuration}
          totalRounds={gameSettings.totalRounds}
        />
      </main>
    );
  }

  // Countdown ekranı (oyun henüz başlamadı ama countdown var)
  if (isCountingDown && !gameState) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <div className="text-center">
          <div className="text-9xl font-bold text-blue-600 mb-4 animate-pulse">
            {countdown !== null ? Math.ceil(countdown) : ''}
          </div>
          <p className="text-2xl text-gray-600">Oyun başlıyor...</p>
        </div>
      </main>
    );
  }

  // Oyun ekranı
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      {gameState && (
        <ScoreBoard
          player1Score={gameState.player1.score}
          player2Score={gameState.player2.score}
          remainingTime={gameState.remainingTime}
          player1Name="Mavi"
          player2Name="Kırmızı"
          currentPlayerId={currentUserId}
          player1Id={player1Id}
          matchScore={gameState.matchScore}
          player1Respawning={gameState.player1.isRespawning}
          player2Respawning={gameState.player2.isRespawning}
          player1RespawnTimer={gameState.player1.respawnTimer}
          player2RespawnTimer={gameState.player2.respawnTimer}
        />
      )}

      <GameCanvas gameState={gameState} countdown={countdown} />

      <div className="mt-4 text-center h-12 flex flex-col justify-center">
        {gameState?.status === 'playing' && !isCountingDown && (
          <p className="text-gray-500 text-sm">WASD veya Ok tuşları ile hareket et</p>
        )}
      </div>

      {gameState && (
        <GameOverModal
          isOpen={gameState.status === 'finished'}
          winner={gameState.winner}
          player1Score={gameState.player1.score}
          player2Score={gameState.player2.score}
          currentPlayerId={currentUserId}
          player1Id={player1Id}
          matchScore={gameState.matchScore}
          rematchState={gameState.rematch}
          onRequestRematch={onRequestRematch}
          onCancelRematch={onCancelRematch}
          onGoHome={() => router.push('/')}
        />
      )}
    </main>
  );
}
