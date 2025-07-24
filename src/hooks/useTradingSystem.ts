// ===== hooks/useTradingSystem.ts (Enhanced with Emotion Context) =====
import { useCallback } from 'react';
import type { Player } from '@/types/GameTypes';
import { itemPrices } from '@/data/itemPrices';
import { LLMService, type EmotionContext } from '@/services/llmService';

interface TradingSystemProps {
  player: Player;
  setPlayer: React.Dispatch<React.SetStateAction<Player>>;
  setGameMessage: (message: string) => void;
}

export const useTradingSystem = ({
  player,
  setPlayer,
  setGameMessage,
}: TradingSystemProps) => {
  
  const sendToLLM = useCallback(
    async (
      userInput: string, 
      npcName: string, 
      npcType: string = "",
      emotionContext?: EmotionContext
    ) => {
      try {
        if (npcType === "trader") {
          // Check if player is trying to sell something
          const sellMatch = userInput
            .toLowerCase()
            .match(
              /sell|trade|buy.*?(magic sword|ancient rune|silver ring|health potion)/i
            );
          if (sellMatch) {
            const itemToSell = player.inventory.find((item) =>
              item.toLowerCase().includes(sellMatch[1]?.toLowerCase() || "")
            );

            if (itemToSell && itemPrices[itemToSell]) {
              const price = itemPrices[itemToSell];
              
              // Apply emotion-based price adjustments
              let finalPrice = price;
              let priceMessage = "";
              
              if (emotionContext?.isEmotionActive && emotionContext.emotionDescription) {
                const emotion = emotionContext.emotionDescription.toLowerCase();
                
                if (emotion.includes('sad') || emotion.includes('melancholy')) {
                  finalPrice = Math.round(price * 1.1); // 10% bonus for sympathy
                  priceMessage = " I can see you're going through a tough time, so I'll give you a little extra.";
                } else if (emotion.includes('frustrated') || emotion.includes('angry')) {
                  finalPrice = Math.round(price * 1.15); // 15% bonus to calm them down
                  priceMessage = " You seem upset, friend. Let me offer you a fair deal to brighten your day.";
                } else if (emotion.includes('happy') || emotion.includes('cheerful')) {
                  finalPrice = price; // Normal price, but friendly message
                  priceMessage = " I love dealing with happy customers!";
                } else if (emotion.includes('fearful') || emotion.includes('anxious')) {
                  finalPrice = Math.round(price * 1.05); // Small bonus for reassurance
                  priceMessage = " Don't worry, you're safe here. I'll take good care of you.";
                }
              }
              
              setPlayer((prev) => ({
                ...prev,
                inventory: prev.inventory.filter((item) => item !== itemToSell),
                gold: prev.gold + finalPrice,
              }));
              
              setGameMessage(
                `${npcName}: Excellent! I'll buy your ${itemToSell} for ${finalPrice} gold!${priceMessage}`
              );
              setTimeout(() => setGameMessage(""), 15000);
              return;
            } else if (sellMatch[1]) {
              setGameMessage(
                `${npcName}: Sorry, I don't see that item in your inventory, or I don't buy that kind of item.`
              );
              setTimeout(() => setGameMessage(""), 15000);
              return;
            }
          }
        }

        const response = await LLMService.sendToLLM(
          userInput,
          npcName,
          player,
          npcType,
          emotionContext
        );
        setGameMessage(`${npcName}: ${response}`);
        setTimeout(() => setGameMessage(""), 15000);
      } catch (error) {
        setGameMessage("The NPC seems distracted...");
        setTimeout(() => setGameMessage(""), 3000);
      }
    },
    [player, setPlayer, setGameMessage]
  );

  return { sendToLLM };
};