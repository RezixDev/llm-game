// ===== data/treasures.ts =====
import type { Treasure } from '../types/GameTypes';

export const TREASURE_SIZE = 12;

export const treasuresData: Treasure[] = [
	{
		id: "chest1",
		x: 300,
		y: 350,
		size: TREASURE_SIZE,
		item: "Health Potion",
		collected: false,
	},
	{
		id: "chest2",
		x: 700,
		y: 150,
		size: TREASURE_SIZE,
		item: "Magic Sword",
		collected: false,
	},
	{
		id: "chest3",
		x: 100,
		y: 300,
		size: TREASURE_SIZE,
		item: "Ancient Rune",
		collected: false,
	},
	{
		id: "chest4",
		x: 550,
		y: 100,
		size: TREASURE_SIZE,
		item: "Silver Ring",
		collected: false,
	},
];
