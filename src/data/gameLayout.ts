// ===== data/gameLayout.ts =====
import type { GameLayout, SpawnZone, NamedPosition } from '@/types/GameTypes';

// Define named positions for key locations
export const namedPositions: Record<string, NamedPosition> = {
  merchantCorner: { x: 200, y: 100 },
  wizardTower: { x: 600, y: 300 },
  centerCourt: { x: 400, y: 300 },
  northGate: { x: 400, y: 50 },
  southGate: { x: 400, y: 550 },
  eastWall: { x: 750, y: 300 },
  westWall: { x: 50, y: 300 },
};

// Define spawn zones for random placement
export const spawnZones: Record<string, SpawnZone> = {
  enemyPatrol: {
    minX: 350, maxX: 650,
    minY: 150, maxY: 450,
    avoid: ['merchantCorner', 'wizardTower'] // Don't spawn near friendly NPCs
  },
  treasureScatter: {
    minX: 50, maxX: 750,
    minY: 50, maxY: 550,
    avoid: ['merchantCorner', 'wizardTower']
  },
  safeZone: {
    minX: 50, maxX: 350,
    minY: 50, maxY: 200,
    avoid: []
  }
};

// Layout configurations for different scenarios
export const gameLayouts: Record<string, GameLayout> = {
  default: {
    name: "Village Outskirts",
    playerSpawn: { x: 50, y: 50 },
    npcs: [
      { id: "merchant", position: "merchantCorner" },
      { id: "wizard", position: "wizardTower" }
    ],
    enemies: [
      { id: "goblin1", zone: "enemyPatrol" },
      { id: "orc1", zone: "enemyPatrol" },
      { id: "skeleton1", position: { x: 150, y: 450 } }, // Specific guard position
      { id: "troll1", zone: "enemyPatrol" }
    ],
    treasures: [
      { id: "chest1", zone: "treasureScatter" },
      { id: "chest2", zone: "treasureScatter" },
      { id: "chest3", position: "westWall" },
      { id: "chest4", zone: "safeZone" }
    ]
  },
  dungeon: {
    name: "Dark Dungeon",
    playerSpawn: { x: 100, y: 500 },
    npcs: [
      { id: "merchant", position: { x: 100, y: 450 } } // Merchant at dungeon entrance
    ],
    enemies: [
      { id: "goblin1", position: { x: 200, y: 300 } },
      { id: "skeleton1", position: { x: 400, y: 200 } },
      { id: "orc1", position: { x: 600, y: 400 } },
      { id: "troll1", position: { x: 700, y: 100 } } // Boss at the end
    ],
    treasures: [
      { id: "chest1", position: { x: 300, y: 150 } },
      { id: "chest2", position: { x: 750, y: 50 } }, // Treasure behind boss
      { id: "chest3", position: { x: 500, y: 300 } },
      { id: "chest4", position: { x: 150, y: 200 } }
    ]
  }
};



