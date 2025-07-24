// ===== hooks/useSaveSystem.ts =====
import { useCallback } from 'react';
import type { Player, NPC, Enemy, Treasure, MapMode } from '@/types/GameTypes';

export interface GameSaveData {
  version: string;
  timestamp: number;
  saveName: string;
  player: Player;
  npcs: NPC[];
  enemies: Enemy[];
  treasures: Treasure[];
  mapMode: MapMode;
  currentLayout: string;
  gameMessage: string;
}

export interface SaveSlot {
  id: string;
  name: string;
  timestamp: number;
  level: number;
  gold: number;
  mapMode: MapMode;
  currentLayout: string;
}

interface UseSaveSystemProps {
  // Current game state
  player: Player;
  npcs: NPC[];
  enemies: Enemy[];
  treasures: Treasure[];
  mapMode: MapMode;
  currentLayout: string;
  gameMessage: string;
  
  // State setters
  setPlayer: React.Dispatch<React.SetStateAction<Player>>;
  setNpcs: React.Dispatch<React.SetStateAction<NPC[]>>;
  setEnemies: React.Dispatch<React.SetStateAction<Enemy[]>>;
  setTreasures: React.Dispatch<React.SetStateAction<Treasure[]>>;
  setMapMode: React.Dispatch<React.SetStateAction<MapMode>>;
  setCurrentLayout: React.Dispatch<React.SetStateAction<string>>;
  setGameMessage: (message: string) => void;
}

export const useSaveSystem = ({
  player,
  npcs,
  enemies,
  treasures,
  mapMode,
  currentLayout,
  gameMessage,
  setPlayer,
  setNpcs,
  setEnemies,
  setTreasures,
  setMapMode,
  setCurrentLayout,
  setGameMessage,
}: UseSaveSystemProps) => {

  const SAVE_VERSION = "1.0.0";
  const MAX_SAVE_SLOTS = 6;

  // Get all save slots
  const getSaveSlots = useCallback((): SaveSlot[] => {
    const slots: SaveSlot[] = [];
    
    for (let i = 1; i <= MAX_SAVE_SLOTS; i++) {
      const saveData = localStorage.getItem(`game_save_slot_${i}`);
      if (saveData) {
        try {
          const parsed: GameSaveData = JSON.parse(saveData);
          slots.push({
            id: `slot_${i}`,
            name: parsed.saveName,
            timestamp: parsed.timestamp,
            level: parsed.player.level,
            gold: parsed.player.gold,
            mapMode: parsed.mapMode,
            currentLayout: parsed.currentLayout,
          });
        } catch (error) {
          console.error(`Error parsing save slot ${i}:`, error);
        }
      } else {
        slots.push({
          id: `slot_${i}`,
          name: `Empty Slot ${i}`,
          timestamp: 0,
          level: 0,
          gold: 0,
          mapMode: 'configuration',
          currentLayout: 'default',
        });
      }
    }
    
    return slots;
  }, []);

  // Save game to a specific slot
  const saveGame = useCallback((slotId: string, saveName?: string) => {
    const slotNumber = slotId.replace('slot_', '');
    const defaultName = `Save ${slotNumber} - Lv.${player.level}`;
    
    const saveData: GameSaveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      saveName: saveName || defaultName,
      player: { ...player },
      npcs: npcs.map(npc => ({ ...npc })),
      enemies: enemies.map(enemy => ({ ...enemy })),
      treasures: treasures.map(treasure => ({ ...treasure })),
      mapMode,
      currentLayout,
      gameMessage,
    };

    try {
      localStorage.setItem(`game_save_${slotId}`, JSON.stringify(saveData));
      setGameMessage(`Game saved to ${saveData.saveName}!`);
      setTimeout(() => setGameMessage(""), 3000);
      return true;
    } catch (error) {
      console.error('Save failed:', error);
      setGameMessage("Save failed! Storage might be full.");
      setTimeout(() => setGameMessage(""), 3000);
      return false;
    }
  }, [player, npcs, enemies, treasures, mapMode, currentLayout, gameMessage, setGameMessage]);

  // Load game from a specific slot
  const loadGame = useCallback((slotId: string) => {
    const saveData = localStorage.getItem(`game_save_${slotId}`);
    
    if (!saveData) {
      setGameMessage("No save data found in this slot!");
      setTimeout(() => setGameMessage(""), 3000);
      return false;
    }

    try {
      const parsed: GameSaveData = JSON.parse(saveData);
      
      // Version check (for future compatibility)
      if (parsed.version !== SAVE_VERSION) {
        console.warn(`Save version mismatch: ${parsed.version} vs ${SAVE_VERSION}`);
      }

      // Restore all game state
      setPlayer(parsed.player);
      setNpcs(parsed.npcs);
      setEnemies(parsed.enemies);
      setTreasures(parsed.treasures);
      setMapMode(parsed.mapMode);
      setCurrentLayout(parsed.currentLayout);
      
      setGameMessage(`Game loaded from ${parsed.saveName}!`);
      setTimeout(() => setGameMessage(""), 3000);
      
      return true;
    } catch (error) {
      console.error('Load failed:', error);
      setGameMessage("Load failed! Save file might be corrupted.");
      setTimeout(() => setGameMessage(""), 3000);
      return false;
    }
  }, [setPlayer, setNpcs, setEnemies, setTreasures, setMapMode, setCurrentLayout, setGameMessage]);

  // Delete a save slot
  const deleteSave = useCallback((slotId: string) => {
    try {
      localStorage.removeItem(`game_save_${slotId}`);
      setGameMessage("Save deleted!");
      setTimeout(() => setGameMessage(""), 2000);
      return true;
    } catch (error) {
      console.error('Delete failed:', error);
      setGameMessage("Delete failed!");
      setTimeout(() => setGameMessage(""), 2000);
      return false;
    }
  }, [setGameMessage]);

  // Quick save to slot 1
  const quickSave = useCallback(() => {
    return saveGame('slot_1', `Quick Save - Lv.${player.level}`);
  }, [saveGame, player.level]);

  // Quick load from slot 1
  const quickLoad = useCallback(() => {
    return loadGame('slot_1');
  }, [loadGame]);

  // Auto-save functionality (call this periodically or on important events)
  const autoSave = useCallback(() => {
    const autoSaveData: GameSaveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      saveName: `Auto Save - Lv.${player.level}`,
      player: { ...player },
      npcs: npcs.map(npc => ({ ...npc })),
      enemies: enemies.map(enemy => ({ ...enemy })),
      treasures: treasures.map(treasure => ({ ...treasure })),
      mapMode,
      currentLayout,
      gameMessage,
    };

    try {
      localStorage.setItem('game_autosave', JSON.stringify(autoSaveData));
      return true;
    } catch (error) {
      console.error('Auto-save failed:', error);
      return false;
    }
  }, [player, npcs, enemies, treasures, mapMode, currentLayout, gameMessage]);

  // Load auto-save
  const loadAutoSave = useCallback(() => {
    const autoSaveData = localStorage.getItem('game_autosave');
    
    if (!autoSaveData) {
      setGameMessage("No auto-save found!");
      setTimeout(() => setGameMessage(""), 3000);
      return false;
    }

    try {
      const parsed: GameSaveData = JSON.parse(autoSaveData);
      
      setPlayer(parsed.player);
      setNpcs(parsed.npcs);
      setEnemies(parsed.enemies);
      setTreasures(parsed.treasures);
      setMapMode(parsed.mapMode);
      setCurrentLayout(parsed.currentLayout);
      
      setGameMessage("Auto-save loaded!");
      setTimeout(() => setGameMessage(""), 3000);
      
      return true;
    } catch (error) {
      console.error('Auto-save load failed:', error);
      setGameMessage("Auto-save load failed!");
      setTimeout(() => setGameMessage(""), 3000);
      return false;
    }
  }, [setPlayer, setNpcs, setEnemies, setTreasures, setMapMode, setCurrentLayout, setGameMessage]);

  // Export save data as JSON string (for sharing or backup)
  const exportSave = useCallback((slotId: string) => {
    const saveData = localStorage.getItem(`game_save_${slotId}`);
    return saveData || null;
  }, []);

  // Import save data from JSON string
  const importSave = useCallback((slotId: string, saveDataString: string) => {
    try {
      const parsed: GameSaveData = JSON.parse(saveDataString);
      localStorage.setItem(`game_save_${slotId}`, saveDataString);
      setGameMessage("Save imported successfully!");
      setTimeout(() => setGameMessage(""), 3000);
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      setGameMessage("Import failed! Invalid save data.");
      setTimeout(() => setGameMessage(""), 3000);
      return false;
    }
  }, [setGameMessage]);

  return {
    // Basic save/load operations
    saveGame,
    loadGame,
    deleteSave,
    
    // Quick save/load
    quickSave,
    quickLoad,
    
    // Auto-save
    autoSave,
    loadAutoSave,
    
    // Utility functions
    getSaveSlots,
    exportSave,
    importSave,
    
    // Constants
    MAX_SAVE_SLOTS,
  };
};