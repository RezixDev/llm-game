

// ===== utils/proceduralPlacement.ts =====
type PlacementRule = {
  entityType: 'npc' | 'enemy' | 'treasure';
  minDistance?: number;
  maxDistance?: number;
  avoidTypes?: string[];
  preferredZones?: string[];
  density?: number; // entities per 100x100 area
}

type PlacementConstraint = {
  minDistanceFromPlayer: number;
  minDistanceBetweenEntities: number;
  safeZones: { x: number, y: number, radius: number }[];
  dangerZones: { x: number, y: number, radius: number }[];
}

export class ProceduralPlacer {
  private placedPositions: Array<{ x: number, y: number, type: string, id: string }> = [];
  
  constructor(
    private canvasWidth: number,
    private canvasHeight: number,
    private constraints: PlacementConstraint
  ) {}

  placeEntities(rules: PlacementRule[]): Record<string, { x: number, y: number }[]> {
    const result: Record<string, { x: number, y: number }[]> = {
      npcs: [],
      enemies: [],
      treasures: []
    };

    // Place NPCs first (they get priority for good spots)
    rules.filter(r => r.entityType === 'npc').forEach(rule => {
      const positions = this.generatePositions(rule);
      result.npcs.push(...positions);
    });

    // Then enemies
    rules.filter(r => r.entityType === 'enemy').forEach(rule => {
      const positions = this.generatePositions(rule);
      result.enemies.push(...positions);
    });

    // Finally treasures
    rules.filter(r => r.entityType === 'treasure').forEach(rule => {
      const positions = this.generatePositions(rule);
      result.treasures.push(...positions);
    });

    return result;
  }

  private generatePositions(rule: PlacementRule): { x: number, y: number }[] {
    const positions: { x: number, y: number }[] = [];
    const targetCount = this.calculateTargetCount(rule);
    
    let attempts = 0;
    const maxAttempts = targetCount * 10;

    while (positions.length < targetCount && attempts < maxAttempts) {
      const candidate = this.generateCandidate(rule);
      
      if (this.isValidPosition(candidate, rule)) {
        positions.push(candidate);
        this.placedPositions.push({
          ...candidate,
          type: rule.entityType,
          id: `${rule.entityType}_${positions.length}`
        });
      }
      
      attempts++;
    }

    return positions;
  }

  private calculateTargetCount(rule: PlacementRule): number {
    if (rule.density) {
      const area = this.canvasWidth * this.canvasHeight;
      return Math.floor((area / 10000) * rule.density);
    }
    
    // Default counts based on entity type
    switch (rule.entityType) {
      case 'npc': return 2;
      case 'enemy': return 4;
      case 'treasure': return 4;
      default: return 1;
    }
  }

  private generateCandidate(rule: PlacementRule): { x: number, y: number } {
    // If preferred zones are specified, bias towards them
    if (rule.preferredZones && rule.preferredZones.length > 0) {
      // For now, just use random placement
      // In a full implementation, you'd define zone boundaries
    }

    return {
      x: Math.random() * (this.canvasWidth - 100) + 50,
      y: Math.random() * (this.canvasHeight - 100) + 50
    };
  }

  private isValidPosition(pos: { x: number, y: number }, rule: PlacementRule): boolean {
    // Check minimum distance from player spawn
    const playerSpawn = { x: 50, y: 50 }; // Should be configurable
    const distanceFromPlayer = this.distance(pos, playerSpawn);
    if (distanceFromPlayer < this.constraints.minDistanceFromPlayer) {
      return false;
    }

    // Check safe zones (NPCs should be in safe zones, enemies should avoid them)
    const inSafeZone = this.constraints.safeZones.some(zone => 
      this.distance(pos, zone) < zone.radius
    );

    if (rule.entityType === 'npc' && !inSafeZone) {
      return false; // NPCs must be in safe zones
    }

    if (rule.entityType === 'enemy' && inSafeZone) {
      return false; // Enemies should avoid safe zones
    }

    // Check minimum distance from other entities
    const tooClose = this.placedPositions.some(placed => {
      const distance = this.distance(pos, placed);
      
      if (rule.avoidTypes && rule.avoidTypes.includes(placed.type)) {
        return distance < (rule.minDistance || 100);
      }
      
      return distance < this.constraints.minDistanceBetweenEntities;
    });

    return !tooClose;
  }

  private distance(a: { x: number, y: number }, b: { x: number, y: number }): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }
}
