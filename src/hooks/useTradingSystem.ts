
// ===== hooks/useTradingSystem.ts =====
import { useCallback } from 'react';
import type { Player } from '@/types/GameTypes';
import { itemPrices } from '@/data/itemPrices';
import { LLMService } from '@/services/llmService';

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
    async (userInput: string, npcName: string, npcType: string = "") => {
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
              setPlayer((prev) => ({
                ...prev,
                inventory: prev.inventory.filter((item) => item !== itemToSell),
                gold: prev.gold + price,
              }));
              setGameMessage(
                `${npcName}: Excellent! I'll buy your ${itemToSell} for ${price} gold!`
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
          npcType
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
