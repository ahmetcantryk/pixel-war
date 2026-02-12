'use client';

import { useEffect, useCallback } from 'react';
import { Direction } from '@/types/game';

interface UseKeyboardProps {
  onDirectionChange: (direction: Direction) => void;
  enabled: boolean;
}

export function useKeyboard({ onDirectionChange, enabled }: UseKeyboardProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      let direction: Direction | null = null;

      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          direction = Direction.Up;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          direction = Direction.Down;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          direction = Direction.Left;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          direction = Direction.Right;
          break;
      }

      if (direction) {
        event.preventDefault();
        onDirectionChange(direction);
      }
    },
    [onDirectionChange, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
