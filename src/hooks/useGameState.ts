// ===== hooks/useGameState.ts =====
import { useState } from 'react';
import type { Player, NPC, Enemy, Treasure, MapMode } from '@/types/GameTypes';
import { npcsData } from '@/data/npcs';
import { enemiesData } from '@/data/enemies';
import { treasuresData } from '@/data/treasures';

const PLAYER_SIZE = 20;

export const useGameState = () => {
  // Map mode state
  const [mapMode, setMapMode] = useState<MapMode>("configuration");
  const [currentLayout, setCurrentLayout] = useState("default");

  // Game entities
  const [player, setPlayer] = useState<Player>({
    x: 50,
    y: 250,
    size: PLAYER_SIZE,
    health: 100,
    maxHealth: 100,
    experience: 0,
    level: 1,
    inventory: [],
    gold: 50,
  });

  const [npcs, setNpcs] = useState<NPC[]>(npcsData);
  const [enemies, setEnemies] = useState<Enemy[]>(enemiesData);
  const [treasures, setTreasures] = useState<Treasure[]>(treasuresData);

  // UI state
  const [gameMessage, setGameMessage] = useState<string>("");
  const [showInventory, setShowInventory] = useState<boolean>(false);

  return {
    // Map state
    mapMode,
    setMapMode,
    currentLayout,
    setCurrentLayout,
    
    // Game entities
    player,
    setPlayer,
    npcs,
    setNpcs,
    enemies,
    setEnemies,
    treasures,
    setTreasures,
    
    // UI state
    gameMessage,
    setGameMessage,
    showInventory,
    setShowInventory,
  };
};
