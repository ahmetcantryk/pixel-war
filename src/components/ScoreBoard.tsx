'use client';

import { formatTime, formatScore } from '@/lib/utils';
import { MatchScore } from '@/types/game';

interface ScoreBoardProps {
  player1Score: number;
  player2Score: number;
  remainingTime: number;
  player1Name?: string;
  player2Name?: string;
  currentPlayerId?: string;
  player1Id?: string;
  matchScore?: MatchScore;
  player1Respawning?: boolean;
  player2Respawning?: boolean;
  player1RespawnTimer?: number;
  player2RespawnTimer?: number;
}

export function ScoreBoard({
  player1Score,
  player2Score,
  remainingTime,
  player1Name = 'Oyuncu 1',
  player2Name = 'Oyuncu 2',
  currentPlayerId,
  player1Id,
  matchScore,
  player1Respawning,
  player2Respawning,
  player1RespawnTimer,
  player2RespawnTimer,
}: ScoreBoardProps) {
  const isPlayer1 = currentPlayerId === player1Id;
  const isLowTime = remainingTime <= 10;

  return (
    <div className="w-full max-w-[800px] mb-4">
      {/* Maç skoru */}
      {matchScore && matchScore.matchNumber > 0 && (
        <div className="flex items-center justify-center gap-4 mb-2 text-sm">
          <span className="text-gray-500">Maç {matchScore.matchNumber}</span>
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-bold text-lg">{matchScore.player1Wins}</span>
            <span className="text-gray-400">-</span>
            <span className="text-red-600 font-bold text-lg">{matchScore.player2Wins}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-lg border border-gray-200">
        {/* Oyuncu 1 */}
        <div className="flex flex-col items-center min-w-[120px]">
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-4 h-4 rounded ${player1Respawning ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: '#3B82F6' }}
            />
            <span className={`text-sm font-medium ${isPlayer1 ? 'text-blue-600' : 'text-gray-700'}`}>
              {player1Name} {isPlayer1 && '(Sen)'}
            </span>
          </div>
          <span className="text-3xl font-bold text-gray-900">
            {formatScore(player1Score)}
          </span>
          {/* Sabit yükseklik alanı - kayma önleme */}
          <div className="h-5 flex items-center">
            {player1Respawning && player1RespawnTimer !== undefined ? (
              <span className="text-xs text-orange-500 font-medium">
                Canlanıyor ({Math.ceil(player1RespawnTimer)}s)
              </span>
            ) : (
              <span className="text-xs text-gray-400">piksel</span>
            )}
          </div>
        </div>

        {/* Süre */}
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Süre</span>
          <span
            className={`text-4xl font-mono font-bold ${
              isLowTime ? 'text-red-500 animate-pulse' : 'text-gray-900'
            }`}
          >
            {formatTime(remainingTime)}
          </span>
        </div>

        {/* Oyuncu 2 */}
        <div className="flex flex-col items-center min-w-[120px]">
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-4 h-4 rounded ${player2Respawning ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: '#EF4444' }}
            />
            <span className={`text-sm font-medium ${!isPlayer1 && currentPlayerId ? 'text-red-600' : 'text-gray-700'}`}>
              {player2Name} {!isPlayer1 && currentPlayerId && '(Sen)'}
            </span>
          </div>
          <span className="text-3xl font-bold text-gray-900">
            {formatScore(player2Score)}
          </span>
          {/* Sabit yükseklik alanı - kayma önleme */}
          <div className="h-5 flex items-center">
            {player2Respawning && player2RespawnTimer !== undefined ? (
              <span className="text-xs text-orange-500 font-medium">
                Canlanıyor ({Math.ceil(player2RespawnTimer)}s)
              </span>
            ) : (
              <span className="text-xs text-gray-400">piksel</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
