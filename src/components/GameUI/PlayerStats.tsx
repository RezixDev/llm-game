// ===== components/GameUI/PlayerStats.tsx =====
import React from "react";
import type { Player, MapMode } from "@/types/GameTypes";

interface PlayerStatsProps {
	player: Player;
	mapMode: MapMode;
	currentLayout: string;
}

export const PlayerStats: React.FC<PlayerStatsProps> = ({
	player,
	mapMode,
	currentLayout,
}) => {
	return (
		<div
			style={{
				position: "absolute",
				top: "10px",
				left: "10px",
				background: "rgba(0,0,0,0.8)",
				color: "white",
				padding: "10px",
				borderRadius: "5px",
				fontFamily: "monospace",
				zIndex: 100,
			}}
		>
			<div>
				Mode:{" "}
				{mapMode === "procedural" ? "Procedural" : `Config (${currentLayout})`}
			</div>
			<div>Level: {player.level}</div>
			<div>
				Health: {player.health}/{player.maxHealth}
			</div>
			<div>XP: {player.experience}</div>
			<div>Next Level: {player.level * 100}</div>
			<div style={{ color: "gold" }}>Gold: {player.gold}</div>
		</div>
	);
};
