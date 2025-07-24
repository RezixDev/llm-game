// ===== hooks/useCombatSystem.ts (Enhanced with Emotion Context) =====
import { useState, useCallback } from 'react';
import type { Player, Enemy } from '@/types/GameTypes';
import { LLMService, type EmotionContext } from '@/services/llmService';

export interface CombatState {
  inCombat: Enemy | null;
  enemyTalking: boolean;
}

export interface CombatActions {
  startCombat: (enemy: Enemy, emotionContext?: EmotionContext) => Promise<void>;
  attack: (emotionContext?: EmotionContext) => Promise<void>;
  flee: () => void;
  endCombat: () => void;
}

interface UseCombatSystemProps {
  player: Player;
  enemies: Enemy[];
  setPlayer: React.Dispatch<React.SetStateAction<Player>>;
  setEnemies: React.Dispatch<React.SetStateAction<Enemy[]>>;
  setGameMessage: (message: string) => void;
}

export const useCombatSystem = ({
  player,
  enemies,
  setPlayer,
  setEnemies,
  setGameMessage,
}: UseCombatSystemProps): CombatState & CombatActions => {
  const [inCombat, setInCombat] = useState<Enemy | null>(null);
  const [enemyTalking, setEnemyTalking] = useState<boolean>(false);

  const startCombat = useCallback(async (enemy: Enemy, emotionContext?: EmotionContext) => {
    setInCombat(enemy);
    setEnemyTalking(true);

    try {
      const battleCry = await LLMService.sendEnemyToLLM(enemy, "attack", emotionContext);
      setGameMessage(`${enemy.name}: ${battleCry}`);
    } catch (error) {
      setGameMessage(`${enemy.name}: ${enemy.battleCries[0]}`);
    }

    setTimeout(() => {
      setEnemyTalking(false);
    }, 3000);
  }, [setGameMessage]);

  const attack = useCallback(async (emotionContext?: EmotionContext) => {
    if (!inCombat || enemyTalking) return;

    // Emotion-based damage modifications
    const baseDamage = 20 + player.level * 5;
    let damageMultiplier = 1.0;
    let emotionMessage = "";

    if (emotionContext?.isEmotionActive && emotionContext.emotionDescription) {
      const emotion = emotionContext.emotionDescription.toLowerCase();
      
      if (emotion.includes('angry') || emotion.includes('frustrated')) {
        damageMultiplier = 1.2; // +20% damage when angry
        emotionMessage = " (Fueled by rage!)";
      } else if (emotion.includes('fearful') || emotion.includes('anxious')) {
        damageMultiplier = 0.8; // -20% damage when scared
        emotionMessage = " (Trembling with fear...)";
      } else if (emotion.includes('happy') || emotion.includes('cheerful')) {
        damageMultiplier = 1.1; // +10% damage when confident
        emotionMessage = " (Striking with confidence!)";
      } else if (emotion.includes('sad') || emotion.includes('melancholy')) {
        damageMultiplier = 0.9; // -10% damage when sad
        emotionMessage = " (Half-hearted attack...)";
      }
    }

    const damage = Math.round(baseDamage * damageMultiplier);
    
    const newEnemies = enemies.map((enemy) =>
      enemy.id === inCombat.id
        ? { ...enemy, health: enemy.health - damage }
        : enemy
    );

    setEnemies(newEnemies);

    const updatedEnemy = newEnemies.find((e) => e.id === inCombat.id);
    if (updatedEnemy && updatedEnemy.health <= 0) {
      // Enemy defeated - final words
      setEnemyTalking(true);

      try {
        const deathCry = await LLMService.sendEnemyToLLM(updatedEnemy, "death", emotionContext);

        const expGained = 15 + updatedEnemy.damage;
        const goldGained = Math.floor(Math.random() * 20) + 10;

        setPlayer((prev) => ({
          ...prev,
          experience: prev.experience + expGained,
          level:
            prev.experience + expGained >= prev.level * 100
              ? prev.level + 1
              : prev.level,
          gold: prev.gold + goldGained,
        }));

        setEnemies((prev) =>
          prev.map((e) => (e.id === inCombat.id ? { ...e, defeated: true } : e))
        );

        setGameMessage(
          `${inCombat.name}: ${deathCry}\n\n${inCombat.name} defeated! Gained ${expGained} XP and ${goldGained} gold!${emotionMessage}`
        );
        setInCombat(null);
        setEnemyTalking(false);
      } catch (error) {
        setGameMessage(`${inCombat.name} defeated!${emotionMessage}`);
        setInCombat(null);
        setEnemyTalking(false);
      }
    } else if (updatedEnemy) {
      // Enemy takes damage and responds
      setEnemyTalking(true);

      try {
        const hurtResponse = await LLMService.sendEnemyToLLM(
          updatedEnemy,
          "defend",
          emotionContext
        );

        setTimeout(async () => {
          // Enemy attacks back - also emotion-aware
          let enemyDamage = updatedEnemy.damage;
          let enemyEmotionMessage = "";

          // Enemies react to player's emotional state in their attacks
          if (emotionContext?.isEmotionActive && emotionContext.emotionDescription) {
            const emotion = emotionContext.emotionDescription.toLowerCase();
            
            if (emotion.includes('fearful') || emotion.includes('anxious')) {
              enemyDamage = Math.round(enemyDamage * 1.15); // Enemies hit harder when player is scared
              enemyEmotionMessage = " (Sensing your fear!)";
            } else if (emotion.includes('angry') || emotion.includes('frustrated')) {
              enemyDamage = Math.round(enemyDamage * 0.95); // Slightly less damage, enemy is cautious
              enemyEmotionMessage = " (Wary of your rage!)";
            }
          }

          setPlayer((prev) => ({
            ...prev,
            health: Math.max(0, prev.health - enemyDamage),
          }));

          try {
            const attackResponse = await LLMService.sendEnemyToLLM(
              updatedEnemy,
              "attack",
              emotionContext
            );
            setGameMessage(
              `You hit for ${damage} damage!${emotionMessage}\n${updatedEnemy.name}: ${hurtResponse}\n\n${updatedEnemy.name}: ${attackResponse}\n${updatedEnemy.name} hits you for ${enemyDamage}!${enemyEmotionMessage}`
            );
          } catch (error) {
            setGameMessage(
              `You hit for ${damage} damage!${emotionMessage}\n${updatedEnemy.name}: ${hurtResponse}\n${updatedEnemy.name} hits you for ${enemyDamage}!${enemyEmotionMessage}`
            );
          }
          setEnemyTalking(false);
        }, 2000);
      } catch (error) {
        setGameMessage(`You hit for ${damage} damage!${emotionMessage}`);
        setEnemyTalking(false);
      }
    }
  }, [inCombat, enemyTalking, enemies, player.level, setPlayer, setEnemies, setGameMessage]);

  const flee = useCallback(() => {
    setInCombat(null);
    setEnemyTalking(false);
    setGameMessage("You fled from combat!");
    // Move player away
    setPlayer((prev) => ({
      ...prev,
      x: Math.max(0, prev.x - 50),
      y: Math.max(0, prev.y - 50),
    }));
  }, [setPlayer, setGameMessage]);

  const endCombat = useCallback(() => {
    setInCombat(null);
    setEnemyTalking(false);
  }, []);

  return {
    // State
    inCombat,
    enemyTalking,
    // Actions
    startCombat,
    attack,
    flee,
    endCombat,
  };
};