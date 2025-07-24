// ===== data/npcs.ts =====
import type { NPC } from '@/types/GameTypes';

export const NPC_SIZE = 20;

export const npcsData: NPC[] = [
	{
		id: "merchant",
		x: 200,
		y: 100,
		size: NPC_SIZE,
		color: "green",
		name: "Merchant",
		type: "trader",
		dialogue: [
			"Welcome, traveler! I buy and sell various items.",
			"I have wares if you have coin, or I can buy your treasures!",
			"Just tell me what you want to sell and I'll make an offer!",
		],
		currentDialogue: 0,
	},
	{
		id: "wizard",
		x: 600,
		y: 300,
		size: NPC_SIZE,
		color: "purple",
		name: "Wizard",
		type: "sage",
		dialogue: [
			"Ah, a young adventurer! The mystical energies are strong today.",
			"Magic flows through these lands like rivers of starlight.",
			"Beware the creatures ahead - they speak in riddles and rage.",
		],
		currentDialogue: 0,
	},
];

// NPCs without hardcoded positions
export const npcTemplates: Omit<NPC, 'x' | 'y'>[] = [
	{
		id: "merchant",
		size: NPC_SIZE,
		color: "green",
		name: "Merchant",
		type: "trader",
		dialogue: [
			"Welcome, traveler! I buy and sell various items.",
			"I have wares if you have coin, or I can buy your treasures!",
			"Just tell me what you want to sell and I'll make an offer!",
		],
		currentDialogue: 0,
	},
	{
		id: "wizard",
		size: NPC_SIZE,
		color: "purple",
		name: "Wizard",
		type: "sage",
		dialogue: [
			"Ah, a young adventurer! The mystical energies are strong today.",
			"Magic flows through these lands like rivers of starlight.",
			"Beware the creatures ahead - they speak in riddles and rage.",
		],
		currentDialogue: 0,
	},
];

// Factory function to create positioned NPCs
export const createNPCsFromLayout = (positions: Record<string, { x: number; y: number }>): NPC[] => {
  return npcTemplates.map(template => ({
    ...template,
    x: positions[template.id]?.x || 0,
    y: positions[template.id]?.y || 0,
  }));
};
