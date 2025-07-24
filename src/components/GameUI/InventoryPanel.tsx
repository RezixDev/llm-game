// ===== components/GameUI/InventoryPanel.tsx =====
import React from "react";
import type { Player } from "@/types/GameTypes";
import { itemPrices } from "@/data/itemPrices";

interface InventoryPanelProps {
	player: Player;
	showInventory: boolean;
}

export const InventoryPanel: React.FC<InventoryPanelProps> = ({
	player,
	showInventory,
}) => {
	if (!showInventory) return null;

	return (
		<div
			style={{
				position: "absolute",
				top: "10px",
				right: "10px",
				background: "rgba(0,0,0,0.8)",
				color: "white",
				padding: "10px",
				borderRadius: "5px",
				minWidth: "200px",
				zIndex: 100,
			}}
		>
			<h4>Inventory (Press I to close)</h4>
			<div style={{ color: "gold", marginBottom: "10px" }}>
				Gold: {player.gold}
			</div>
			{player.inventory.length === 0 ? (
				<p>Empty</p>
			) : (
				<div>
					{player.inventory.map((item, index) => (
						<div key={index} style={{ marginBottom: "5px" }}>
							{item}
							{itemPrices[item] && (
								<span style={{ color: "gold", fontSize: "10px" }}>
									{" "}
									(Worth {itemPrices[item]}g)
								</span>
							)}
						</div>
					))}
					<div
						style={{
							marginTop: "10px",
							fontSize: "12px",
							color: "lightblue",
						}}
					>
						💡 Tell the Merchant "sell [item name]" to trade!
					</div>
				</div>
			)}
		</div>
	);
};
