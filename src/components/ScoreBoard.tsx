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
    <div className="w-full max-w-[600px] flex-shrink-0">
      <div className="flex items-center justify-between bg-white rounded-lg px-4 py-2 shadow-md border border-gray-200">
        {/* Oyuncu 1 */}
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded ${player1Respawning ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: '#3B82F6' }}
          />
          <div className="flex flex-col">
            <span className={`text-xs font-medium ${isPlayer1 ? 'text-blue-600' : 'text-gray-600'}`}>
              {player1Name} {isPlayer1 && '(Sen)'}
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-gray-900">{formatScore(player1Score)}</span>
              {player1Respawning && player1RespawnTimer !== undefined && (
                <span className="text-xs text-orange-500">({Math.ceil(player1RespawnTimer)}s)</span>
              )}
            </div>
          </div>
        </div>

        {/* Süre & Maç Skoru */}
        <div className="flex flex-col items-center">
          {matchScore && matchScore.matchNumber > 0 && (
            <div className="flex items-center gap-1 text-xs mb-0.5">
              <span className="text-gray-400">Tur {matchScore.matchNumber}:</span>
              <span className="text-blue-600 font-bold">{matchScore.player1Wins}</span>
              <span className="text-gray-400">-</span>
              <span className="text-red-600 font-bold">{matchScore.player2Wins}</span>
            </div>
          )}
          <span
            className={`text-2xl font-mono font-bold ${
              isLowTime ? 'text-red-500 animate-pulse' : 'text-gray-900'
            }`}
          >
            {formatTime(remainingTime)}
          </span>
        </div>

        {/* Oyuncu 2 */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className={`text-xs font-medium ${!isPlayer1 && currentPlayerId ? 'text-red-600' : 'text-gray-600'}`}>
              {player2Name} {!isPlayer1 && currentPlayerId && '(Sen)'}
            </span>
            <div className="flex items-center gap-1">
              {player2Respawning && player2RespawnTimer !== undefined && (
                <span className="text-xs text-orange-500">({Math.ceil(player2RespawnTimer)}s)</span>
              )}
              <span className="text-xl font-bold text-gray-900">{formatScore(player2Score)}</span>
            </div>
          </div>
          <div
            className={`w-3 h-3 rounded ${player2Respawning ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: '#EF4444' }}
          />
        </div>
      </div>
    </div>
  );
}
