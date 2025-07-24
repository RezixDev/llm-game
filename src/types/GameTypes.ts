
// ===== types/GameTypes.ts =====
export type Player = {
	x: number;
	y: number;
	size: number;
	health: number;
	maxHealth: number;
	experience: number;
	level: number;
	inventory: string[];
	gold: number;
}

export type NPC = {
	id: string;
	x: number;
	y: number;
	size: number;
	color: string;
	name: string;
	dialogue: string[];
	currentDialogue: number;
	type: string;
}

export type Enemy = {
	id: string;
	x: number;
	y: number;
	size: number;
	health: number;
	maxHealth: number;
	damage: number;
	color: string;
	name: string;
	personality: string;
	battleCries: string[];
	defeated: boolean;
}

export type Treasure = {
	id: string;
	x: number;
	y: number;
	size: number;
	item: string;
	collected: boolean;
}

export type ItemPrice = {
	[key: string]: number;
}

// ===== LAYOUT TYPES =====
export type NamedPosition = {
	x: number;
	y: number;
}

export type SpawnZone = {
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
	avoid: string[]; // Named positions to avoid
}

export type EntityPlacement = {
	id: string;
	position?: string | NamedPosition; // Named position or coordinates
	zone?: string; // Spawn zone for random placement
}

export type GameLayout = {
	name: string;
	playerSpawn: NamedPosition;
	npcs: EntityPlacement[];
	enemies: EntityPlacement[];
	treasures: EntityPlacement[];
}

export type MapMode = 'procedural' | 'configuration';
