'use client';

import { useState } from 'react';
import { copyToClipboard, createInviteLink } from '@/lib/utils';

interface WaitingRoomProps {
  roomId: string;
  isOwner: boolean;
  gameDuration?: number;
  totalRounds?: number;
}

export function WaitingRoom({ roomId, isOwner, gameDuration = 30, totalRounds = 3 }: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);
  const inviteLink = createInviteLink(roomId);

  const handleCopy = async () => {
    const success = await copyToClipboard(inviteLink);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-8">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-lg border border-gray-200">
        {/* Animasyonlu bekleme ikonu */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-blue-100 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-t-blue-500 border-r-blue-500 border-b-transparent border-l-transparent animate-spin" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          {isOwner ? 'Rakip Bekleniyor...' : 'Odaya Katılınıyor...'}
        </h2>

        <p className="text-gray-500 text-center mb-4">
          {isOwner
            ? 'Arkadaşınla paylaşmak için aşağıdaki linki kullan'
            : 'Bağlantı kuruluyor, lütfen bekleyin...'}
        </p>

        {/* Oyun ayarları */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <p className="text-xs text-blue-500 text-center">Süre</p>
            <p className="text-lg font-bold text-blue-600 text-center">{gameDuration} sn</p>
          </div>
          <div className="bg-red-50 px-4 py-2 rounded-lg">
            <p className="text-xs text-red-500 text-center">Tur</p>
            <p className="text-lg font-bold text-red-600 text-center">{totalRounds}</p>
          </div>
        </div>

        {isOwner && (
          <>
            {/* Link alanı */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Davet Linki</p>
              <p className="text-blue-600 break-all text-sm font-mono">{inviteLink}</p>
            </div>

            {/* Kopyala butonu */}
            <button
              onClick={handleCopy}
              className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {copied ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Kopyalandı!
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                  </svg>
                  Linki Kopyala
                </span>
              )}
            </button>
          </>
        )}

        {/* İpuçları */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">OYUN KONTROLLERİ</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-gray-500">
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs border">W</kbd>
              <span>veya</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs border">↑</kbd>
              <span>Yukarı</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs border">S</kbd>
              <span>veya</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs border">↓</kbd>
              <span>Aşağı</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs border">A</kbd>
              <span>veya</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs border">←</kbd>
              <span>Sol</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs border">D</kbd>
              <span>veya</span>
              <kbd className="px-2 py-1 bg-gray-100 rounded text-xs border">→</kbd>
              <span>Sağ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
