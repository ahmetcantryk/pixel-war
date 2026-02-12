'use client';

import { formatScore } from '@/lib/utils';
import { MatchScore, RematchState } from '@/types/game';

interface GameOverModalProps {
  isOpen: boolean;
  winner: string | null;
  player1Score: number;
  player2Score: number;
  currentPlayerId: string;
  player1Id: string;
  matchScore: MatchScore;
  rematchState: RematchState;
  onRequestRematch: () => void;
  onCancelRematch: () => void;
  onGoHome: () => void;
}

export function GameOverModal({
  isOpen,
  winner,
  player1Score,
  player2Score,
  currentPlayerId,
  player1Id,
  matchScore,
  rematchState,
  onRequestRematch,
  onCancelRematch,
  onGoHome,
}: GameOverModalProps) {
  if (!isOpen) return null;

  const isWinner = winner === currentPlayerId;
  const isDraw = winner === null;
  const isPlayer1 = currentPlayerId === player1Id;
  const yourScore = isPlayer1 ? player1Score : player2Score;
  const opponentScore = isPlayer1 ? player2Score : player1Score;

  // Rövanş durumu
  const yourRematchReady = isPlayer1 ? rematchState.player1Ready : rematchState.player2Ready;
  const opponentRematchReady = isPlayer1 ? rematchState.player2Ready : rematchState.player1Ready;

  // Toplam maç kazanma kontrolü
  const winsNeeded = Math.ceil(matchScore.totalRounds / 2);
  const player1MatchWinner = matchScore.player1Wins >= winsNeeded;
  const player2MatchWinner = matchScore.player2Wins >= winsNeeded;
  const matchEnded = player1MatchWinner || player2MatchWinner;
  const youWonMatch = isPlayer1 ? player1MatchWinner : player2MatchWinner;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
        {/* Sonuç başlığı */}
        <div className="text-center mb-6">
          {isDraw ? (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-4">
              <span className="text-3xl">🤝</span>
            </div>
          ) : isWinner ? (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <span className="text-3xl">🏆</span>
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <span className="text-3xl">😔</span>
            </div>
          )}

          <h2 className={`text-2xl font-bold ${
            isDraw ? 'text-yellow-600' : isWinner ? 'text-green-600' : 'text-red-600'
          }`}>
            {isDraw ? 'BERABERE!' : isWinner ? 'KAZANDIN!' : 'KAYBETTİN!'}
          </h2>
        </div>

        {/* Skor kartları */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className={`flex-1 text-center p-4 rounded-xl ${
            isWinner ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50'
          }`}>
            <p className="text-xs text-gray-500 mb-1">Sen</p>
            <p className={`text-2xl font-bold ${isWinner ? 'text-green-600' : 'text-gray-800'}`}>
              {formatScore(yourScore)}
            </p>
          </div>
          <span className="text-gray-300 text-xl font-light">vs</span>
          <div className={`flex-1 text-center p-4 rounded-xl ${
            !isWinner && !isDraw ? 'bg-red-50 border-2 border-red-200' : 'bg-gray-50'
          }`}>
            <p className="text-xs text-gray-500 mb-1">Rakip</p>
            <p className={`text-2xl font-bold ${!isWinner && !isDraw ? 'text-red-600' : 'text-gray-800'}`}>
              {formatScore(opponentScore)}
            </p>
          </div>
        </div>

        {/* Toplam skor */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-xs text-gray-500 text-center mb-2">
            TOPLAM SKOR ({matchScore.totalRounds} tur)
          </p>
          <div className="flex items-center justify-center gap-4">
            <span className="text-2xl font-bold text-blue-600">{matchScore.player1Wins}</span>
            <span className="text-gray-300">-</span>
            <span className="text-2xl font-bold text-red-600">{matchScore.player2Wins}</span>
          </div>
          <p className="text-xs text-gray-400 text-center mt-1">
            Tur {matchScore.matchNumber} / {matchScore.totalRounds}
          </p>
          {matchEnded && (
            <div className={`mt-3 py-2 px-4 rounded-lg text-center font-bold ${
              youWonMatch ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {youWonMatch ? '🎉 SERİYİ KAZANDIN!' : '😢 SERİYİ KAYBETTİN'}
            </div>
          )}
        </div>

        {/* Rövanş durumu - sadece maç bitmemişse göster */}
        {!matchEnded && (
          <>
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${
                yourRematchReady 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {yourRematchReady ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span>Sen</span>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${
                opponentRematchReady 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {opponentRematchReady ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span>Rakip</span>
              </div>
            </div>

            {/* Durum mesajı */}
            {yourRematchReady && !opponentRematchReady && (
              <p className="text-center text-sm text-gray-500 mb-4">
                Rakibin onayı bekleniyor...
              </p>
            )}
            {!yourRematchReady && opponentRematchReady && (
              <p className="text-center text-sm text-orange-500 font-medium mb-4">
                Rakip sonraki tura hazır!
              </p>
            )}
          </>
        )}

        {/* Butonlar */}
        <div className="space-y-3">
          {!matchEnded && (
            <>
              {!yourRematchReady ? (
                <button
                  onClick={onRequestRematch}
                  className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sonraki Tur
                </button>
              ) : (
                <button
                  onClick={onCancelRematch}
                  className="w-full py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  İptal Et
                </button>
              )}
            </>
          )}
          <button
            onClick={onGoHome}
            className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    </div>
  );
}
