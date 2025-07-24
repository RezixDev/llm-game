// ===== hooks/useGameLoop.ts =====
import { useEffect, useRef } from 'react';

export const useGameLoop = (drawFunction: () => void) => {
  const animationRef = useRef<number>();

  useEffect(() => {
    const gameLoop = () => {
      drawFunction();
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawFunction]);

  return animationRef;
};