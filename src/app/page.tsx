'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Tam ekran oyun simülasyonu arka planı
function GameBackground() {
  const [grid, setGrid] = useState<number[][]>([]);
  const [players, setPlayers] = useState({
    p1: { x: 8, y: 12, dir: 'right', trail: [] as {x: number, y: number}[] },
    p2: { x: 24, y: 12, dir: 'left', trail: [] as {x: number, y: number}[] },
  });
  
  const gridCols = 32;
  const gridRows = 24;
  
  useEffect(() => {
    // Başlangıç grid'i
    const initialGrid: number[][] = Array(gridRows).fill(null).map(() => Array(gridCols).fill(0));
    
    // Başlangıç alanları
    for (let y = 10; y < 15; y++) {
      for (let x = 5; x < 12; x++) initialGrid[y][x] = 1;
      for (let x = 20; x < 27; x++) initialGrid[y][x] = 2;
    }
    
    setGrid(initialGrid);
  }, []);
  
  useEffect(() => {
    if (grid.length === 0) return;
    
    const directions: Record<string, {dx: number, dy: number}> = {
      up: { dx: 0, dy: -1 },
      down: { dx: 0, dy: 1 },
      left: { dx: -1, dy: 0 },
      right: { dx: 1, dy: 0 },
    };
    
    const opposites: Record<string, string> = { up: 'down', down: 'up', left: 'right', right: 'left' };
    
    const interval = setInterval(() => {
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => [...row]);
        
        setPlayers(prev => {
          const newPlayers = { ...prev };
          
          // Her oyuncu için hareket
          (['p1', 'p2'] as const).forEach((pKey) => {
            const p = { ...newPlayers[pKey] };
            const color = pKey === 'p1' ? 1 : 2;
            const { dx, dy } = directions[p.dir];
            const nx = p.x + dx;
            const ny = p.y + dy;
            
            // Sınır kontrolü
            if (nx < 0 || nx >= gridCols || ny < 0 || ny >= gridRows) {
              const dirs = ['up', 'down', 'left', 'right'].filter(d => d !== opposites[p.dir]);
              p.dir = dirs[Math.floor(Math.random() * dirs.length)];
              newPlayers[pKey] = p;
              return;
            }
            
            const inTerritory = newGrid[p.y]?.[p.x] === color;
            const willBeInTerritory = newGrid[ny]?.[nx] === color;
            
            if (!inTerritory && newGrid[p.y]?.[p.x] !== undefined) {
              p.trail = [...p.trail, { x: p.x, y: p.y }];
            }
            
            p.x = nx;
            p.y = ny;
            
            // Alana döndüyse trail'i kapat
            if (willBeInTerritory && p.trail.length > 0) {
              for (const t of p.trail) {
                if (newGrid[t.y]?.[t.x] !== undefined) {
                  newGrid[t.y][t.x] = color;
                }
              }
              p.trail = [];
            }
            
            // Rastgele yön değişikliği
            if (Math.random() < 0.08) {
              const dirs = ['up', 'down', 'left', 'right'].filter(d => d !== opposites[p.dir]);
              p.dir = dirs[Math.floor(Math.random() * dirs.length)];
            }
            
            newPlayers[pKey] = p;
          });
          
          return newPlayers;
        });
        
        // Grid çok dolarsa sıfırla
        const filled = newGrid.flat().filter(c => c > 0).length;
        if (filled > gridCols * gridRows * 0.6) {
          const resetGrid: number[][] = Array(gridRows).fill(null).map(() => Array(gridCols).fill(0));
          for (let y = 10; y < 15; y++) {
            for (let x = 5; x < 12; x++) resetGrid[y][x] = 1;
            for (let x = 20; x < 27; x++) resetGrid[y][x] = 2;
          }
          setPlayers({
            p1: { x: 8, y: 12, dir: 'right', trail: [] },
            p2: { x: 24, y: 12, dir: 'left', trail: [] },
          });
          return resetGrid;
        }
        
        return newGrid;
      });
    }, 150);
    
    return () => clearInterval(interval);
  }, [grid.length]);
  
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Grid */}
      <div 
        className="absolute inset-0 grid gap-[1px] opacity-60"
        style={{ 
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${gridRows}, 1fr)`,
        }}
      >
        {grid.flat().map((cell, i) => {
          const x = i % gridCols;
          const y = Math.floor(i / gridCols);
          const isP1Trail = players.p1.trail.some(t => t.x === x && t.y === y);
          const isP2Trail = players.p2.trail.some(t => t.x === x && t.y === y);
          const isP1 = players.p1.x === x && players.p1.y === y;
          const isP2 = players.p2.x === x && players.p2.y === y;
          
          let colorClass = 'bg-slate-800/30';
          
          if (cell === 1) colorClass = 'bg-blue-500/70 shadow-lg shadow-blue-500/30';
          else if (cell === 2) colorClass = 'bg-red-500/70 shadow-lg shadow-red-500/30';
          else if (isP1Trail) colorClass = 'bg-blue-400/40';
          else if (isP2Trail) colorClass = 'bg-red-400/40';
          
          if (isP1) colorClass = 'bg-blue-300 shadow-lg shadow-blue-400/50 z-10';
          if (isP2) colorClass = 'bg-red-300 shadow-lg shadow-red-400/50 z-10';
          
          return (
            <div
              key={i}
              className={`transition-all duration-150 rounded-sm ${colorClass}`}
            />
          );
        })}
      </div>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-900/60" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-transparent to-red-900/20" />
      
      {/* Glow effects */}
      <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-20 animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-red-500 rounded-full blur-[100px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [gameDuration, setGameDuration] = useState(30);
  const [totalRounds, setTotalRounds] = useState(3);

  const durationOptions = [30, 45, 60, 90, 120];
  const roundOptions = [3, 5, 7];

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
    <main className="h-screen w-screen overflow-hidden bg-slate-900 relative">
      {/* Tam ekran oyun arka planı */}
      <GameBackground />
      
      {/* İçerik */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        {/* Logo ve başlık */}
        <div className="text-center mb-8">
          {/* VS Logo */}
          <div className="inline-flex items-center gap-3 mb-4 bg-black/30 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/10">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
              <div className="w-5 h-5 bg-white rounded-sm" />
            </div>
            <span className="text-2xl font-black text-white tracking-wider">VS</span>
            <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/30">
              <div className="w-5 h-5 bg-white rounded-sm" />
            </div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-3">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent drop-shadow-2xl">
              PIXEL WAR
            </span>
          </h1>
          
          <p className="text-gray-300 text-lg">
            <span className="text-blue-400">Alan kapla</span> · <span className="text-purple-400">Rakibi yen</span> · <span className="text-red-400">Zafer senin!</span>
          </p>
        </div>
        
        {/* Ayarlar kartı */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 w-full max-w-md mb-6">
          {/* Süre */}
          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-2 block font-medium">Tur Süresi</label>
            <div className="flex gap-2">
              {durationOptions.map((d) => (
                <button
                  key={d}
                  onClick={() => setGameDuration(d)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    gameDuration === d
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>
          
          {/* Tur sayısı */}
          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-2 block font-medium">Toplam Tur</label>
            <div className="flex gap-2">
              {roundOptions.map((r) => (
                <button
                  key={r}
                  onClick={() => setTotalRounds(r)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    totalRounds === r
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {r} tur
                </button>
              ))}
            </div>
          </div>
          
          {/* Özet */}
          <div className="text-center py-2 border-t border-white/10">
            <span className="text-gray-400 text-sm">
              Toplam süre: <span className="text-white font-bold">{Math.floor((gameDuration * totalRounds) / 60)}dk {(gameDuration * totalRounds) % 60}s</span>
            </span>
          </div>
        </div>
        
        {/* Oyun başlat butonu */}
        <button
          onClick={handleCreateRoom}
          disabled={isCreating}
          className="group relative px-12 py-5 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 rounded-2xl text-xl font-bold text-white transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 disabled:opacity-50 disabled:hover:scale-100 mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
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
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Oda Oluştur
              </>
            )}
          </span>
        </button>
        
        {/* Kontroller ve kurallar */}
        <div className="flex items-center gap-8 text-gray-400 text-sm">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20 text-white">WASD</kbd>
            <span>veya</span>
            <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20 text-white">↑↓←→</kbd>
          </div>
          <span className="hidden md:inline">·</span>
          <span className="hidden md:inline">İz bırak, alanı kapat, kazan!</span>
        </div>
      </div>
    </main>
  );
}
