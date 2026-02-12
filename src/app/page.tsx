'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Animasyonlu pixel grid bileşeni
function AnimatedPixelGrid() {
  const [pixels, setPixels] = useState<number[][]>([]);
  const gridSize = 16;

  useEffect(() => {
    // Başlangıç grid'i oluştur
    const initialGrid = Array(gridSize).fill(null).map(() => 
      Array(gridSize).fill(0)
    );
    
    // Başlangıç alanları
    for (let y = 4; y < 8; y++) {
      for (let x = 2; x < 6; x++) {
        initialGrid[y][x] = 1; // Mavi
      }
    }
    for (let y = 8; y < 12; y++) {
      for (let x = 10; x < 14; x++) {
        initialGrid[y][x] = 2; // Kırmızı
      }
    }
    
    setPixels(initialGrid);

    // Animasyon döngüsü
    const interval = setInterval(() => {
      setPixels(prev => {
        const newGrid = prev.map(row => [...row]);
        
        // Rastgele genişleme
        const expansions = [
          { color: 1, chance: 0.15 }, // Mavi
          { color: 2, chance: 0.15 }, // Kırmızı
        ];

        for (const { color, chance } of expansions) {
          for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
              if (newGrid[y][x] === color) {
                // Komşulara yayıl
                const neighbors = [
                  [y - 1, x], [y + 1, x], [y, x - 1], [y, x + 1]
                ];
                for (const [ny, nx] of neighbors) {
                  if (
                    ny >= 0 && ny < gridSize && 
                    nx >= 0 && nx < gridSize && 
                    newGrid[ny][nx] === 0 &&
                    Math.random() < chance
                  ) {
                    newGrid[ny][nx] = color;
                  }
                }
              }
            }
          }
        }

        // Çok dolarsa sıfırla
        const totalFilled = newGrid.flat().filter(c => c > 0).length;
        if (totalFilled > gridSize * gridSize * 0.7) {
          const resetGrid = Array(gridSize).fill(null).map(() => 
            Array(gridSize).fill(0)
          );
          for (let y = 4; y < 8; y++) {
            for (let x = 2; x < 6; x++) {
              resetGrid[y][x] = 1;
            }
          }
          for (let y = 8; y < 12; y++) {
            for (let x = 10; x < 14; x++) {
              resetGrid[y][x] = 2;
            }
          }
          return resetGrid;
        }

        return newGrid;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden opacity-30">
      <div 
        className="grid gap-0.5"
        style={{ 
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          width: '100%',
          height: '100%',
        }}
      >
        {pixels.flat().map((cell, i) => (
          <div
            key={i}
            className={`rounded-sm transition-all duration-300 ${
              cell === 1 
                ? 'bg-blue-500 shadow-lg shadow-blue-500/50' 
                : cell === 2 
                  ? 'bg-red-500 shadow-lg shadow-red-500/50' 
                  : 'bg-white/5'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Floating pixel parçacıkları
function FloatingPixels() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Mavi parçacıklar */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`blue-${i}`}
          className="absolute w-3 h-3 bg-blue-500 rounded-sm opacity-60 animate-float"
          style={{
            left: `${10 + i * 10}%`,
            top: `${20 + (i % 3) * 20}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${3 + i * 0.5}s`,
          }}
        />
      ))}
      {/* Kırmızı parçacıklar */}
      {[...Array(8)].map((_, i) => (
        <div
          key={`red-${i}`}
          className="absolute w-3 h-3 bg-red-500 rounded-sm opacity-60 animate-float-reverse"
          style={{
            right: `${10 + i * 10}%`,
            bottom: `${20 + (i % 3) * 20}%`,
            animationDelay: `${i * 0.3}s`,
            animationDuration: `${4 + i * 0.3}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [gameDuration, setGameDuration] = useState(30);
  const [totalRounds, setTotalRounds] = useState(3);

  const durationOptions = [15, 30, 45, 60, 90, 120];
  const roundOptions = [1, 3, 5, 7];

  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameDuration, totalRounds }),
      });
      
      const data = await response.json();
      
      if (data.roomId) {
        router.push(`/room/${data.roomId}`);
      } else {
        alert(data.error || 'Oda oluşturulamadı');
        setIsCreating(false);
      }
    } catch {
      alert('Bir hata oluştu');
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Hero Banner */}
      <div className="relative w-full py-16 md:py-24">
        {/* Animated background grid */}
        <AnimatedPixelGrid />
        
        {/* Floating pixels */}
        <FloatingPixels />
        
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-red-600/10" />
        
        {/* Glow effects */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full blur-[128px] opacity-30 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-red-500 rounded-full blur-[128px] opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-4">
          {/* Logo */}
          <div className="mb-6 relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-red-600 rounded-2xl blur-xl opacity-50 animate-pulse" />
            <div className="relative flex items-center gap-3 bg-black/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/10">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded-sm" />
              </div>
              <span className="text-2xl font-bold text-white tracking-wider">VS</span>
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <div className="w-5 h-5 bg-white rounded-sm" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent drop-shadow-2xl">
              PIXEL WAR
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-300 max-w-lg mb-8">
            <span className="text-blue-400 font-semibold">Alan kapla</span>,{' '}
            <span className="text-purple-400 font-semibold">rakibini yen</span>,{' '}
            <span className="text-red-400 font-semibold">zafer senin!</span>
          </p>

          {/* Live game preview */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-red-600 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
            <div className="relative w-64 h-64 md:w-80 md:h-80 bg-slate-800/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20">
              <div className="grid grid-cols-10 grid-rows-10 h-full gap-px p-2">
                {Array.from({ length: 100 }).map((_, i) => {
                  const row = Math.floor(i / 10);
                  const col = i % 10;
                  let colorClass = 'bg-slate-700/50';
                  
                  // Mavi bölge (sol üst)
                  if (col < 4 && row < 4) {
                    colorClass = 'bg-blue-500 shadow-sm shadow-blue-500/50';
                  }
                  // Kırmızı bölge (sağ alt)
                  if (col > 5 && row > 5) {
                    colorClass = 'bg-red-500 shadow-sm shadow-red-500/50';
                  }
                  // Mavi trail
                  if ((col === 4 && row < 5) || (row === 4 && col < 5)) {
                    colorClass = 'bg-blue-400/60 animate-pulse';
                  }
                  // Kırmızı trail
                  if ((col === 5 && row > 4) || (row === 5 && col > 4)) {
                    colorClass = 'bg-red-400/60 animate-pulse';
                  }
                  // Oyuncular
                  if (col === 4 && row === 4) {
                    colorClass = 'bg-blue-300 ring-2 ring-blue-400 animate-bounce';
                  }
                  if (col === 5 && row === 5) {
                    colorClass = 'bg-red-300 ring-2 ring-red-400 animate-bounce';
                  }
                  
                  return (
                    <div
                      key={i}
                      className={`rounded-sm transition-all duration-300 ${colorClass}`}
                      style={{ animationDelay: `${i * 10}ms` }}
                    />
                  );
                })}
              </div>
              
              {/* Score overlay */}
              <div className="absolute top-2 left-2 right-2 flex justify-between text-xs font-bold">
                <span className="bg-blue-500/80 text-white px-2 py-1 rounded">16 px</span>
                <span className="bg-red-500/80 text-white px-2 py-1 rounded">16 px</span>
              </div>
              
              {/* Timer overlay */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                <span className="bg-black/60 text-white px-3 py-1 rounded-full text-sm font-mono">
                  00:30
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-4 py-8 bg-gray-50 rounded-t-[2rem] -mt-8 relative z-20">
        {/* Oyun Ayarları */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xl mb-8 w-full max-w-md -mt-16">
          <h2 className="text-lg font-bold text-gray-800 mb-4 text-center flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Oyun Ayarları
          </h2>
          
          {/* Süre Seçimi */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tur Süresi
            </label>
            <div className="grid grid-cols-3 gap-2">
              {durationOptions.map((duration) => (
                <button
                  key={duration}
                  type="button"
                  onClick={() => setGameDuration(duration)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    gameDuration === duration
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
                  }`}
                >
                  {duration} sn
                </button>
              ))}
            </div>
          </div>

          {/* Tur Sayısı Seçimi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Toplam Tur
            </label>
            <div className="grid grid-cols-4 gap-2">
              {roundOptions.map((rounds) => (
                <button
                  key={rounds}
                  type="button"
                  onClick={() => setTotalRounds(rounds)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    totalRounds === rounds
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {rounds} tur
                </button>
              ))}
            </div>
          </div>

          {/* Özet */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-red-50 rounded-xl text-center border border-gray-100">
            <p className="text-sm text-gray-600">
              <span className="font-bold text-blue-600">{gameDuration}s</span>
              <span className="mx-2 text-gray-400">x</span>
              <span className="font-bold text-red-600">{totalRounds} tur</span>
              <span className="mx-2 text-gray-400">=</span>
              <span className="font-bold text-purple-600">
                {Math.floor((gameDuration * totalRounds) / 60) > 0 && `${Math.floor((gameDuration * totalRounds) / 60)}dk `}
                {(gameDuration * totalRounds) % 60}sn
              </span>
            </p>
          </div>
        </div>

        {/* Oyun oluştur butonu */}
        <button
          type="button"
          onClick={handleCreateRoom}
          disabled={isCreating}
          className="group relative px-12 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 rounded-2xl text-xl font-bold text-white transition-all duration-300 shadow-2xl hover:shadow-purple-500/30 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mb-12"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity" />
          <span className="relative flex items-center gap-3">
            {isCreating ? (
              <>
                <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Oluşturuluyor...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Oyuna Başla
              </>
            )}
          </span>
        </button>

        {/* Oyun kuralları */}
        <div className="max-w-3xl w-full">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">Nasıl Oynanır?</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-shadow group">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">1. Arkadaşını Davet Et</h3>
              <p className="text-sm text-gray-500">
                Oda oluştur ve paylaşılan linki arkadaşına gönder.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-shadow group">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-green-500/20">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">2. Alan Kapla</h3>
              <p className="text-sm text-gray-500">
                Hareket et, iz bırak ve kendi alanına dönerek bölgeleri fethet.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-shadow group">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/20">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">3. Kazanan Ol</h3>
              <p className="text-sm text-gray-500">
                Süre bittiğinde en çok alana sahip olan kazanır!
              </p>
            </div>
          </div>
        </div>

        {/* Kontroller */}
        <div className="mt-12 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm max-w-md w-full">
          <h3 className="text-sm font-bold text-gray-700 mb-4 text-center uppercase tracking-wide">Kontroller</h3>
          <div className="flex justify-center gap-8">
            <div className="flex flex-col items-center gap-1">
              <kbd className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-bold border-2 border-gray-200 shadow-sm">W</kbd>
              <div className="flex gap-1">
                <kbd className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-bold border-2 border-gray-200 shadow-sm">A</kbd>
                <kbd className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-bold border-2 border-gray-200 shadow-sm">S</kbd>
                <kbd className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-bold border-2 border-gray-200 shadow-sm">D</kbd>
              </div>
            </div>
            <div className="text-gray-300 flex items-center text-2xl">veya</div>
            <div className="flex flex-col items-center gap-1">
              <kbd className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg border-2 border-gray-200 shadow-sm">↑</kbd>
              <div className="flex gap-1">
                <kbd className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg border-2 border-gray-200 shadow-sm">←</kbd>
                <kbd className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg border-2 border-gray-200 shadow-sm">↓</kbd>
                <kbd className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg border-2 border-gray-200 shadow-sm">→</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-400 text-sm pb-8">
          <p>Pixel War - Gerçek Zamanlı 1v1 Alan Boyama Oyunu</p>
        </footer>
      </div>
    </main>
  );
}
