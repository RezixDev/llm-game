// ===== types/GameTypes.ts =====
export interface Player {
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

export interface NPC {
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

export interface Enemy {
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

export interface Treasure {
	id: string;
	x: number;
	y: number;
	size: number;
	item: string;
	collected: boolean;
}

export interface ItemPrice {
	[key: string]: number;
}
