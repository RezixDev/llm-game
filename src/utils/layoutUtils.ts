// ===== utils/layoutUtils.ts =====
import type { NamedPosition, SpawnZone, GameLayout, EntityPlacement } from '@/types/GameTypes';
import { namedPositions, spawnZones } from '@/data/gameLayout';

export class LayoutManager {
  static resolvePosition(
    placement: EntityPlacement, 
    canvasWidth: number = 800, 
    canvasHeight: number = 600
  ): NamedPosition {
    // If specific position is provided
    if (placement.position) {
      if (typeof placement.position === 'string') {
        // Named position
        const named = namedPositions[placement.position];
        if (!named) {
          console.warn(`Named position '${placement.position}' not found, using default`);
          return { x: 100, y: 100 };
        }
        return named;
      } else {
        // Direct coordinates
        return placement.position;
      }
    }

    // If spawn zone is specified
    if (placement.zone) {
      const zone = spawnZones[placement.zone];
      if (!zone) {
        console.warn(`Spawn zone '${placement.zone}' not found, using default`);
        return { x: 100, y: 100 };
      }
      return this.getRandomPositionInZone(zone);
    }

    // Fallback to random position
    return {
      x: Math.random() * (canvasWidth - 50) + 25,
      y: Math.random() * (canvasHeight - 50) + 25
    };
  }

  static getRandomPositionInZone(zone: SpawnZone): NamedPosition {
    const attempts = 10; // Try to avoid named positions
    
    for (let i = 0; i < attempts; i++) {
      const x = Math.random() * (zone.maxX - zone.minX) + zone.minX;
      const y = Math.random() * (zone.maxY - zone.minY) + zone.minY;
      
      // Check if this position conflicts with avoided positions
      const tooClose = zone.avoid.some(avoidName => {
        const avoidPos = namedPositions[avoidName];
        if (!avoidPos) return false;
        const distance = Math.sqrt((x - avoidPos.x) ** 2 + (y - avoidPos.y) ** 2);
        return distance < 60; // Minimum distance
      });
      
      if (!tooClose) {
        return { x, y };
      }
    }
    
    // If we can't find a good spot, just use the zone center
    return {
      x: (zone.minX + zone.maxX) / 2,
      y: (zone.minY + zone.maxY) / 2
    };
  }

  static applyLayout(layout: GameLayout): {
    playerSpawn: NamedPosition;
    npcPositions: Record<string, NamedPosition>;
    enemyPositions: Record<string, NamedPosition>;
    treasurePositions: Record<string, NamedPosition>;
  } {
    const npcPositions: Record<string, NamedPosition> = {};
    const enemyPositions: Record<string, NamedPosition> = {};
    const treasurePositions: Record<string, NamedPosition> = {};

    layout.npcs.forEach(npc => {
      npcPositions[npc.id] = this.resolvePosition(npc);
    });

    layout.enemies.forEach(enemy => {
      enemyPositions[enemy.id] = this.resolvePosition(enemy);
    });

    layout.treasures.forEach(treasure => {
      treasurePositions[treasure.id] = this.resolvePosition(treasure);
    });

    return {
      playerSpawn: layout.playerSpawn,
      npcPositions,
      enemyPositions,
      treasurePositions
    };
  }
}
