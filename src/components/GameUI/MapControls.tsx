// ===== components/GameUI/MapControls.tsx (Updated) =====
import React from "react";
import type { MapMode } from "@/types/GameTypes";
import { NewGameButton } from "./NewGameButton";

interface MapControlsProps {
	mapMode: MapMode;
	currentLayout: string;
	onMapModeChange: (mode: MapMode) => void;
	onLayoutChange: (layout: string) => void;
	onGenerateMap: () => void;
	onOpenSaveLoad: () => void;
	onNewGame: () => void; // NEW
}

export const MapControls: React.FC<MapControlsProps> = ({
	mapMode,
	currentLayout,
	onMapModeChange,
	onLayoutChange,
	onGenerateMap,
	onOpenSaveLoad,
	onNewGame,
}) => {
	return (
		<div
			style={{
				background: "#f0f0f0",
				border: "2px solid #333",
				borderRadius: "8px",
				padding: "15px",
				marginBottom: "20px",
				display: "flex",
				gap: "15px",
				alignItems: "center",
				flexWrap: "wrap",
			}}
		>
			<strong>Map Generation Mode:</strong>
			<label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
				<input
					type="radio"
					value="configuration"
					checked={mapMode === "configuration"}
					onChange={(e) => onMapModeChange(e.target.value as MapMode)}
				/>
				Configuration-Based
			</label>
			<label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
				<input
					type="radio"
					value="procedural"
					checked={mapMode === "procedural"}
					onChange={(e) => onMapModeChange(e.target.value as MapMode)}
				/>
				Procedural Generation
			</label>
			{mapMode === "configuration" && (
				<select
					value={currentLayout}
					onChange={(e) => onLayoutChange(e.target.value)}
					style={{
						padding: "8px 12px",
						borderRadius: "4px",
						border: "1px solid #ccc",
					}}
				>
					<option value="default">Village Outskirts</option>
					<option value="dungeon">Dark Dungeon</option>
				</select>
			)}
			<button
				onClick={onGenerateMap}
				style={{
					padding: "8px 16px",
					backgroundColor: "#4CAF50",
					color: "white",
					border: "none",
					borderRadius: "4px",
					cursor: "pointer",
					fontWeight: "bold",
				}}
			>
				🔄 Generate New Map
			</button>
			{/* Save/Load Button */}
			<button
				onClick={onOpenSaveLoad}
				style={{
					padding: "8px 16px",
					backgroundColor: "#2196F3",
					color: "white",
					border: "none",
					borderRadius: "4px",
					cursor: "pointer",
					fontWeight: "bold",
					marginLeft: "10px",
				}}
			>
				💾 Save/Load Game
			</button>
			{/* NEW: New Game Button */}
			<NewGameButton onNewGame={onNewGame} />
		</div>
	);
};
