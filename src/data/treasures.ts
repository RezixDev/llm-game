// ===== data/treasures.ts =====
import type { Treasure } from '@/types/GameTypes';

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

// Treasures without hardcoded positions
export const treasureTemplates: Omit<Treasure, 'x' | 'y'>[] = [
	{
		id: "chest1",
		size: TREASURE_SIZE,
		item: "Health Potion",
		collected: false,
	},
	{
		id: "chest2",
		size: TREASURE_SIZE,
		item: "Magic Sword",
		collected: false,
	},
	{
		id: "chest3",
		size: TREASURE_SIZE,
		item: "Ancient Rune",
		collected: false,
	},
	{
		id: "chest4",
		size: TREASURE_SIZE,
		item: "Silver Ring",
		collected: false,
	},
];

// Factory function to create positioned treasures
export const createTreasuresFromLayout = (positions: Record<string, { x: number; y: number }>): Treasure[] => {
  return treasureTemplates.map(template => ({
    ...template,
    x: positions[template.id]?.x || 0,
    y: positions[template.id]?.y || 0,
  }));
};
