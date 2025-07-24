// ===== services/llmService.ts (Enhanced with Emotion Context) =====
import type { Player, Enemy } from '@/types/GameTypes';

// Use import.meta.env for Vite or fallback to default values
const API_URL = import.meta.env.VITE_LLM_API_URL;
const MODEL_NAME = import.meta.env.VITE_LLM_MODEL;

export interface EmotionContext {
  emotionDescription?: string;
  emotionContext?: string;
  isEmotionActive?: boolean;
}

export class LLMService {
	static async sendToLLM(
		userInput: string, 
		npcName: string, 
		player: Player,
		npcType: string = "",
		emotionContext?: EmotionContext
	): Promise<string> {
		try {
			let systemPrompt = "";

			if (npcType === "trader") {
				systemPrompt = `You are ${npcName}, a friendly merchant in a fantasy RPG world. You buy and sell items. The player has ${
					player.gold
				} gold and these items: ${player.inventory.join(", ") || "nothing"}. 
				Items you buy: Magic Sword (100g), Ancient Rune (75g), Silver Ring (50g), Health Potion (25g). 
				If they want to sell, tell them to say "sell [item name]" clearly. Keep responses 1-2 sentences and merchant-like. 
				You're talking to a level ${player.level} adventurer.`;
			} else {
				systemPrompt = `You are ${npcName}, a ${
					npcType || "friendly"
				} NPC in a fantasy RPG world. Keep responses short (1-2 sentences) and in character. 
				You're talking to a level ${player.level} adventurer with ${player.gold} gold.`;
			}

			// Add emotion context if available
			if (emotionContext?.isEmotionActive && emotionContext.emotionContext) {
				systemPrompt += `\n\nIMPORTANT: ${emotionContext.emotionContext}. The player appears ${emotionContext.emotionDescription}. Adjust your tone, word choice, and response accordingly to match their emotional state. Be empathetic and responsive to their feelings.`;
			}

			const res = await fetch(API_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					model: MODEL_NAME,
					messages: [
						{
							role: "system",
							content: systemPrompt,
						},
						{ role: "user", content: userInput },
					],
					temperature: 0.8,
					max_tokens: 80,
					stream: false,
				}),
			});

			const data = await res.json();
			return data.choices[0].message.content;
		} catch (error) {
			throw new Error("The NPC seems distracted...");
		}
	}

	static async sendEnemyToLLM(
		enemy: Enemy, 
		situation: "attack" | "defend" | "death",
		emotionContext?: EmotionContext
	): Promise<string> {
		try {
			let situationPrompt = "";
			switch (situation) {
				case "attack":
					situationPrompt = "You are attacking the player. Be menacing but stay in character.";
					break;
				case "defend":
					situationPrompt = "You just took damage from the player. React to being hurt.";
					break;
				case "death":
					situationPrompt = "You are about to be defeated. Give a final dramatic statement.";
					break;
			}

			let systemPrompt = `You are ${enemy.name}, a ${enemy.personality} enemy in an RPG battle. ${situationPrompt} Keep it to 1 short sentence, stay in character. Your health is ${enemy.health}/${enemy.maxHealth}.`;

			// Add emotion context for enemies too
			if (emotionContext?.isEmotionActive && emotionContext.emotionContext) {
				systemPrompt += `\n\nThe player appears ${emotionContext.emotionDescription}. React to their emotional state - mock their fear, be confused by their happiness, get more aggressive if they seem confident, etc.`;
			}

			const res = await fetch(API_URL, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					model: MODEL_NAME,
					messages: [
						{
							role: "system",
							content: systemPrompt,
						},
						{
							role: "user",
							content:
								situation === "attack"
									? "You attack!"
									: situation === "defend"
									? "You take damage!"
									: "You are defeated!",
						},
					],
					temperature: 0.9,
					max_tokens: 30,
					stream: false,
				}),
			});

			const data = await res.json();
			return data.choices[0].message.content;
		} catch (error) {
			// Fallback to predefined battle cries
			return enemy.battleCries[Math.floor(Math.random() * enemy.battleCries.length)];
		}
	}
}