'use client';

import { useRef, useEffect } from 'react';
import { GameState, CellState } from '@/types/game';
import { GRID_SIZE, CELL_SIZE, COLORS } from '@/lib/game/constants';

interface GameCanvasProps {
  gameState: GameState | null;
  countdown?: number | null;
}

export function GameCanvas({ gameState, countdown }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const blinkInterval = 150; // ms - yanıp sönme hızı (daha hızlı)

    const render = (currentTime: number) => {
      // Canvas boyutu
      const width = GRID_SIZE * CELL_SIZE;
      const height = GRID_SIZE * CELL_SIZE;

      // Beyaz arka plan
      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, width, height);

      // Grid çizgileri
      ctx.strokeStyle = COLORS.gridLine;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(width, i * CELL_SIZE);
        ctx.stroke();
      }

      if (!gameState) {
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Grid hücrelerini çiz
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          const cellValue = gameState.grid[y]?.[x] ?? CellState.Empty;
          const px = x * CELL_SIZE;
          const py = y * CELL_SIZE;

          // Sadece boş olmayan hücreleri çiz
          if (cellValue !== CellState.Empty) {
            let color: string = COLORS.empty;
            switch (cellValue) {
              case CellState.Player1Territory:
                color = COLORS.player1Territory;
                break;
              case CellState.Player2Territory:
                color = COLORS.player2Territory;
                break;
              case CellState.Player1Trail:
                color = COLORS.player1Trail;
                break;
              case CellState.Player2Trail:
                color = COLORS.player2Trail;
                break;
            }

            ctx.fillStyle = color;
            ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
          }
        }
      }

      // Yanıp sönme durumu hesapla (daha belirgin)
      const blinkPhase = Math.floor(currentTime / blinkInterval) % 2 === 0;

      // Oyuncu 1'i çiz
      if (!gameState.player1.isRespawning || blinkPhase) {
        drawPlayer(
          ctx,
          gameState.player1.position.x,
          gameState.player1.position.y,
          COLORS.player1,
          COLORS.player1Head,
          gameState.player1.isRespawning
        );
      }

      // Oyuncu 2'yi çiz
      if (!gameState.player2.isRespawning || blinkPhase) {
        drawPlayer(
          ctx,
          gameState.player2.position.x,
          gameState.player2.position.y,
          COLORS.player2,
          COLORS.player2Head,
          gameState.player2.isRespawning
        );
      }

      // Respawn indicator (başlangıç pozisyonunu göster)
      if (gameState.player1.isRespawning) {
        drawRespawnIndicator(ctx, gameState.player1.position.x, gameState.player1.position.y, COLORS.player1, currentTime);
      }
      if (gameState.player2.isRespawning) {
        drawRespawnIndicator(ctx, gameState.player2.position.x, gameState.player2.position.y, COLORS.player2, currentTime);
      }

      // Countdown çiz (maç başlangıcı)
      if (countdown !== null && countdown !== undefined && countdown > 0) {
        drawCountdown(ctx, width, height, countdown);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, countdown]);

  function drawPlayer(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    bodyColor: string,
    headColor: string,
    isRespawning: boolean
  ) {
    const px = x * CELL_SIZE;
    const py = y * CELL_SIZE;
    const size = CELL_SIZE;
    const padding = 2;

    ctx.globalAlpha = isRespawning ? 0.6 : 1;

    // Gövde (renkli kare)
    ctx.fillStyle = bodyColor;
    ctx.fillRect(px + padding, py + padding, size - padding * 2, size - padding * 2);

    // Baş (siyah köşe - sağ üst)
    ctx.fillStyle = headColor;
    const headSize = (size - padding * 2) / 3;
    ctx.fillRect(px + size - padding - headSize, py + padding, headSize, headSize);

    ctx.globalAlpha = 1;
  }

  function drawRespawnIndicator(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    currentTime: number
  ) {
    const px = x * CELL_SIZE + CELL_SIZE / 2;
    const py = y * CELL_SIZE + CELL_SIZE / 2;
    const maxRadius = CELL_SIZE * 2;
    const phase = (currentTime % 1000) / 1000;
    const radius = maxRadius * phase;
    const alpha = 1 - phase;

    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha * 0.5;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawCountdown(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    count: number
  ) {
    // Yarı saydam overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);

    // Büyük sayı
    const text = Math.ceil(count).toString();
    ctx.font = 'bold 200px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Gölge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillText(text, width / 2 + 4, height / 2 + 4);

    // Ana metin
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, width / 2, height / 2);

    // "HAZIRLAN" yazısı
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('HAZIRLAN', width / 2, height / 2 + 120);
  }

  const canvasSize = GRID_SIZE * CELL_SIZE;

  return (
    <div className="relative rounded-lg overflow-hidden shadow-2xl border border-gray-200">
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="block"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
