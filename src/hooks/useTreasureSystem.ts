// ===== hooks/useTreasureSystem.ts =====
import { useCallback } from 'react';
import type { Player, Treasure } from '@/types/GameTypes';

interface TreasureSystemProps {
  setPlayer: React.Dispatch<React.SetStateAction<Player>>;
  setTreasures: React.Dispatch<React.SetStateAction<Treasure[]>>;
  setGameMessage: (message: string) => void;
}

export const useTreasureSystem = ({
  setPlayer,
  setTreasures,
  setGameMessage,
}: TreasureSystemProps) => {
  
  const collectTreasure = useCallback((treasure: Treasure) => {
    setTreasures((prev) =>
      prev.map((t) => (t.id === treasure.id ? { ...t, collected: true } : t))
    );

    setPlayer((prev) => ({
      ...prev,
      inventory: [...prev.inventory, treasure.item],
    }));

    if (treasure.item === "Health Potion") {
      setPlayer((prev) => ({
        ...prev,
        health: Math.min(prev.maxHealth, prev.health + 50),
      }));
      setGameMessage("Found Health Potion! Health restored!");
    } else {
      setGameMessage(
        `Found ${treasure.item}! It might be valuable to a merchant.`
      );
    }
  }, [setPlayer, setTreasures, setGameMessage]);

  return { collectTreasure };
};
