// ===== hooks/useInputHandling.ts (Enhanced with Emotion Context) =====
import { useEffect } from 'react';
import type { Player, NPC, Enemy, Treasure } from '@/types/GameTypes';
import type { EmotionContext } from '@/services/llmService';
import { isNearEntity } from '@/utils/gameUtils';

interface InputHandlingProps {
  // Game state
  player: Player;
  npcs: NPC[];
  enemies: Enemy[];
  treasures: Treasure[];
  showInventory: boolean;
  
  // State setters
  setPlayer: React.Dispatch<React.SetStateAction<Player>>;
  setShowInventory: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Game actions (enhanced with emotion context)
  combat: {
    inCombat: Enemy | null;
    enemyTalking: boolean;
    attack: (emotionContext?: EmotionContext) => void;
    flee: () => void;
    startCombat: (enemy: Enemy, emotionContext?: EmotionContext) => Promise<void>;
  };
  
  // Other actions (enhanced with emotion context)
  sendToLLM: (userInput: string, npcName: string, npcType?: string, emotionContext?: EmotionContext) => Promise<void>;
  collectTreasure: (treasure: Treasure) => void;
  
  // Emotion context provider
  getEmotionContext: () => EmotionContext;
  
  // Save system actions
  saveActions: {
    quickSave: () => boolean;
    quickLoad: () => boolean;
    openSaveLoad: () => void;
  };
  
  // Constants
  canvasWidth?: number;
  canvasHeight?: number;
  playerSize?: number;
}

export const useInputHandling = ({
  player,
  npcs,
  enemies,
  treasures,
  showInventory,
  setPlayer,
  setShowInventory,
  combat,
  sendToLLM,
  collectTreasure,
  getEmotionContext,
  saveActions,
  canvasWidth = 800,
  canvasHeight = 600,
  playerSize = 20,
}: InputHandlingProps) => {
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Get current emotion context for all interactions
      const emotionContext = getEmotionContext();

      // Save/Load hotkeys (F5 = Quick Save, F9 = Quick Load, ESC = Save Menu)
      if (e.key === "F5") {
        e.preventDefault();
        saveActions.quickSave();
        return;
      }
      
      if (e.key === "F9") {
        e.preventDefault();
        saveActions.quickLoad();
        return;
      }
      
      if (e.key === "Escape") {
        e.preventDefault();
        saveActions.openSaveLoad();
        return;
      }

      // Combat input handling (with emotion context)
      if (combat.inCombat && (e.key === "1" || e.key === "2")) {
        if (e.key === "1" && !combat.enemyTalking) {
          combat.attack(emotionContext);
        }
        if (e.key === "2") {
          combat.flee();
        }
        return;
      }

      // Player movement
      const speed = 5;
      let newX = player.x;
      let newY = player.y;

      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        newY -= speed;
      }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        newY += speed;
      }
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        newX -= speed;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        newX += speed;
      }

      // Boundary checking
      newX = Math.max(0, Math.min(canvasWidth - playerSize, newX));
      newY = Math.max(0, Math.min(canvasHeight - playerSize, newY));

      // Update player position if movement occurred
      if (newX !== player.x || newY !== player.y) {
        setPlayer((prev) => ({ ...prev, x: newX, y: newY }));
      }

      // NPC interaction (Space) - with emotion context
      if (e.key === " ") {
        const nearbyNPC = npcs.find((npc) =>
          isNearEntity(player.x, player.y, npc.x, npc.y)
        );
        if (nearbyNPC) {
          const userInput = prompt(`Talk to ${nearbyNPC.name}:`);
          if (userInput) {
            sendToLLM(userInput, nearbyNPC.name, nearbyNPC.type, emotionContext);
          }
        }
      }

      // Combat initiation (F) - with emotion context
      if (e.key === "f" || e.key === "F") {
        const nearbyEnemy = enemies.find(
          (enemy) =>
            !enemy.defeated &&
            isNearEntity(player.x, player.y, enemy.x, enemy.y, 40)
        );
        if (nearbyEnemy && !combat.inCombat) {
          combat.startCombat(nearbyEnemy, emotionContext);
        }
      }

      // Treasure collection (E)
      if (e.key === "e" || e.key === "E") {
        const nearbyTreasure = treasures.find(
          (treasure) =>
            !treasure.collected &&
            isNearEntity(player.x, player.y, treasure.x, treasure.y)
        );
        if (nearbyTreasure) {
          collectTreasure(nearbyTreasure);
        }
      }

      // Inventory toggle (I)
      if (e.key === "i" || e.key === "I") {
        setShowInventory(!showInventory);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    player,
    npcs,
    enemies,
    treasures,
    combat,
    showInventory,
    setPlayer,
    setShowInventory,
    sendToLLM,
    collectTreasure,
    getEmotionContext,
    saveActions,
    canvasWidth,
    canvasHeight,
    playerSize,
  ]);
};