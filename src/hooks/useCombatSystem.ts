// ===== hooks/useCombatSystem.ts =====
import { useState, useCallback } from 'react';
import type { Player, Enemy } from '@/types/GameTypes';
import { LLMService } from '@/services/llmService';

export interface CombatState {
  inCombat: Enemy | null;
  enemyTalking: boolean;
}

export interface CombatActions {
  startCombat: (enemy: Enemy) => Promise<void>;
  attack: () => Promise<void>;
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

  const startCombat = useCallback(async (enemy: Enemy) => {
    setInCombat(enemy);
    setEnemyTalking(true);

    try {
      const battleCry = await LLMService.sendEnemyToLLM(enemy, "attack");
      setGameMessage(`${enemy.name}: ${battleCry}`);
    } catch (error) {
      setGameMessage(`${enemy.name}: ${enemy.battleCries[0]}`);
    }

    setTimeout(() => {
      setEnemyTalking(false);
    }, 3000);
  }, [setGameMessage]);

  const attack = useCallback(async () => {
    if (!inCombat || enemyTalking) return;

    const damage = 20 + player.level * 5;
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
        const deathCry = await LLMService.sendEnemyToLLM(updatedEnemy, "death");

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
          `${inCombat.name}: ${deathCry}\n\n${inCombat.name} defeated! Gained ${expGained} XP and ${goldGained} gold!`
        );
        setInCombat(null);
        setEnemyTalking(false);
      } catch (error) {
        setGameMessage(`${inCombat.name} defeated!`);
        setInCombat(null);
        setEnemyTalking(false);
      }
    } else if (updatedEnemy) {
      // Enemy takes damage and responds
      setEnemyTalking(true);

      try {
        const hurtResponse = await LLMService.sendEnemyToLLM(
          updatedEnemy,
          "defend"
        );

        setTimeout(async () => {
          // Enemy attacks back
          const enemyDamage = updatedEnemy.damage;
          setPlayer((prev) => ({
            ...prev,
            health: Math.max(0, prev.health - enemyDamage),
          }));

          try {
            const attackResponse = await LLMService.sendEnemyToLLM(
              updatedEnemy,
              "attack"
            );
            setGameMessage(
              `You hit for ${damage} damage!\n${updatedEnemy.name}: ${hurtResponse}\n\n${updatedEnemy.name}: ${attackResponse}\n${updatedEnemy.name} hits you for ${enemyDamage}!`
            );
          } catch (error) {
            setGameMessage(
              `You hit for ${damage} damage!\n${updatedEnemy.name}: ${hurtResponse}\n${updatedEnemy.name} hits you for ${enemyDamage}!`
            );
          }
          setEnemyTalking(false);
        }, 2000);
      } catch (error) {
        setGameMessage(`You hit for ${damage} damage!`);
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

