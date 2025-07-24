// ===== hooks/useMapGeneration.ts =====
import { useCallback } from 'react';
import type { NPC, Enemy, Treasure, MapMode } from '@/types/GameTypes';
import { createNPCsFromLayout, npcTemplates } from '@/data/npcs';
import { createEnemiesFromLayout, enemyTemplates } from '@/data/enemies';
import { createTreasuresFromLayout, treasureTemplates } from '@/data/treasures';
import { gameLayouts } from '@/data/gameLayout';
import { LayoutManager } from '@/utils/layoutUtils';
import { ProceduralPlacer } from '@/utils/proceduralPlacement';

type PlacementRule = {
  entityType: "npc" | "enemy" | "treasure";
  minDistance?: number;
  maxDistance?: number;
  avoidTypes?: string[];
  preferredZones?: string[];
  density?: number;
};

interface MapGenerationResult {
  npcs: NPC[];
  enemies: Enemy[];
  treasures: Treasure[];
  playerSpawn: { x: number; y: number };
}

interface UseMapGenerationProps {
  canvasWidth?: number;
  canvasHeight?: number;
}

export const useMapGeneration = ({
  canvasWidth = 800,
  canvasHeight = 600,
}: UseMapGenerationProps = {}) => {
  
  const generateProceduralMap = useCallback((): MapGenerationResult => {
    const placer = new ProceduralPlacer(canvasWidth, canvasHeight, {
      minDistanceFromPlayer: 80,
      minDistanceBetweenEntities: 40,
      safeZones: [
        { x: 200, y: 100, radius: 60 }, // Around merchant area
        { x: 50, y: 50, radius: 80 }, // Player spawn area
      ],
      dangerZones: [
        { x: 400, y: 300, radius: 100 }, // Central battle area
      ],
    });

    const rules: PlacementRule[] = [
      {
        entityType: "npc",
        minDistance: 150,
        avoidTypes: ["enemy"],
        density: 0.3,
      },
      {
        entityType: "enemy",
        minDistance: 60,
        avoidTypes: ["npc"],
        preferredZones: ["dangerZone"],
        density: 0.8,
      },
      {
        entityType: "treasure",
        minDistance: 80,
        density: 0.6,
      },
    ];

    const positions = placer.placeEntities(rules);

    // Create positioned entities
    const npcs = npcTemplates
      .slice(0, positions.npcs.length)
      .map((template, index) => ({
        ...template,
        x: positions.npcs[index].x,
        y: positions.npcs[index].y,
      }));

    const enemies = enemyTemplates
      .slice(0, positions.enemies.length)
      .map((template, index) => ({
        ...template,
        x: positions.enemies[index].x,
        y: positions.enemies[index].y,
      }));

    const treasures = treasureTemplates
      .slice(0, positions.treasures.length)
      .map((template, index) => ({
        ...template,
        x: positions.treasures[index].x,
        y: positions.treasures[index].y,
      }));

    return {
      npcs,
      enemies,
      treasures,
      playerSpawn: { x: 50, y: 50 },
    };
  }, [canvasWidth, canvasHeight]);

  const generateConfigurationMap = useCallback((layoutName: string): MapGenerationResult => {
    const layout = gameLayouts[layoutName];
    if (!layout) {
      console.error(`Layout '${layoutName}' not found`);
      // Return default fallback
      return {
        npcs: [],
        enemies: [],
        treasures: [],
        playerSpawn: { x: 50, y: 50 },
      };
    }

    const layoutResult = LayoutManager.applyLayout(layout);

    // Create positioned entities from layout
    const npcs = createNPCsFromLayout(layoutResult.npcPositions);
    const enemies = createEnemiesFromLayout(layoutResult.enemyPositions);
    const treasures = createTreasuresFromLayout(layoutResult.treasurePositions);

    return {
      npcs,
      enemies,
      treasures,
      playerSpawn: layoutResult.playerSpawn,
    };
  }, []);

  const generateMap = useCallback((mapMode: MapMode, layoutName?: string): MapGenerationResult => {
    if (mapMode === "procedural") {
      return generateProceduralMap();
    } else {
      return generateConfigurationMap(layoutName || "default");
    }
  }, [generateProceduralMap, generateConfigurationMap]);

  return {
    generateMap,
    generateProceduralMap,
    generateConfigurationMap,
  };
};