// ===== hooks/useGameRenderer.ts =====
import { useCallback } from 'react';
import type { Player, NPC, Enemy, Treasure } from '@/types/GameTypes';
import { isNearEntity } from '@/utils/gameUtils';

interface GameRenderingProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  player: Player;
  npcs: NPC[];
  enemies: Enemy[];
  treasures: Treasure[];
  canvasWidth?: number;
  canvasHeight?: number;
}

export const useGameRenderer = ({
  canvasRef,
  player,
  npcs,
  enemies,
  treasures,
  canvasWidth = 800,
  canvasHeight = 600,
}: GameRenderingProps) => {
  
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    // Clear canvas with background color
    ctx.fillStyle = "#2d5016";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw grid pattern for ground
    ctx.strokeStyle = "#3d6026";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvasWidth; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }
    for (let y = 0; y < canvasHeight; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }
  }, [canvasWidth, canvasHeight]);

  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D) => {
    // Draw player
    ctx.fillStyle = player.health <= 25 ? "orange" : "blue";
    ctx.fillRect(player.x, player.y, player.size, player.size);

    // Player name
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(`Player (Lv.${player.level})`, player.x, player.y - 5);
  }, [player]);

  const drawNPCs = useCallback((ctx: CanvasRenderingContext2D) => {
    npcs.forEach((npc) => {
      ctx.fillStyle = npc.color;
      ctx.fillRect(npc.x, npc.y, npc.size, npc.size);

      ctx.fillStyle = "white";
      ctx.fillText(npc.name, npc.x, npc.y - 5);

      if (isNearEntity(player.x, player.y, npc.x, npc.y)) {
        ctx.fillStyle = "yellow";
        ctx.fillText("Press SPACE to talk", npc.x, npc.y + npc.size + 15);
      }
    });
  }, [npcs, player.x, player.y]);

  const drawEnemies = useCallback((ctx: CanvasRenderingContext2D) => {
    enemies.forEach((enemy) => {
      if (!enemy.defeated) {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);

        ctx.fillStyle = "white";
        ctx.fillText(`${enemy.name} (${enemy.health}HP)`, enemy.x, enemy.y - 5);

        if (isNearEntity(player.x, player.y, enemy.x, enemy.y, 40)) {
          ctx.fillStyle = "red";
          ctx.fillText("Press F to fight", enemy.x, enemy.y + enemy.size + 15);
        }
      }
    });
  }, [enemies, player.x, player.y]);

  const drawTreasures = useCallback((ctx: CanvasRenderingContext2D) => {
    treasures.forEach((treasure) => {
      if (!treasure.collected) {
        ctx.fillStyle = "gold";
        ctx.fillRect(treasure.x, treasure.y, treasure.size, treasure.size);

        if (isNearEntity(player.x, player.y, treasure.x, treasure.y)) {
          ctx.fillStyle = "yellow";
          ctx.fillText(
            "Press E to collect",
            treasure.x,
            treasure.y + treasure.size + 15
          );
        }
      }
    });
  }, [treasures, player.x, player.y]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw all game elements in order (background to foreground)
    drawBackground(ctx);
    drawPlayer(ctx);
    drawNPCs(ctx);
    drawEnemies(ctx);
    drawTreasures(ctx);
  }, [drawBackground, drawPlayer, drawNPCs, drawEnemies, drawTreasures]);

  return { draw };
};
