// ===== Updated GameCanvas.tsx with Save System =====
import { useRef, useState, useEffect } from "react";

// ✨ Import all our extracted systems (including new save system)
import { useGameState } from "@/hooks/useGameState";
import { useCombatSystem } from "@/hooks/useCombatSystem";
import { useTradingSystem } from "@/hooks/useTradingSystem";
import { useTreasureSystem } from "@/hooks/useTreasureSystem";
import { useInputHandling } from "@/hooks/useInputHandling";
import { useGameRenderer } from "@/hooks/useGameRenderer";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useMapGeneration } from "@/hooks/useMapGeneration";
import { useSaveSystem } from "@/hooks/useSaveSystem"; // NEW

// ✨ Import all UI components (including new save modal)
import { MapControls } from "@/components/GameUI/MapControls";
import { CombatModal } from "@/components/GameUI/CombatModal";
import { InventoryPanel } from "@/components/GameUI/InventoryPanel";
import { PlayerStats } from "@/components/GameUI/PlayerStats";
import { ControlsHelp } from "@/components/GameUI/ControlsHelp";
import { GameMessages } from "@/components/GameUI/GameMessages";
import { SaveLoadModal } from "@/components/GameUI/SaveLoadModal"; // NEW

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export default function GameCanvas() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [showSaveLoadModal, setShowSaveLoadModal] = useState(false); // NEW

	// ✨ Use extracted game state management
	const gameState = useGameState();

	// ✨ NEW: Initialize save system
	const saveSystem = useSaveSystem({
		// Current game state
		player: gameState.player,
		npcs: gameState.npcs,
		enemies: gameState.enemies,
		treasures: gameState.treasures,
		mapMode: gameState.mapMode,
		currentLayout: gameState.currentLayout,
		gameMessage: gameState.gameMessage,

		// State setters
		setPlayer: gameState.setPlayer,
		setNpcs: gameState.setNpcs,
		setEnemies: gameState.setEnemies,
		setTreasures: gameState.setTreasures,
		setMapMode: gameState.setMapMode,
		setCurrentLayout: gameState.setCurrentLayout,
		setGameMessage: gameState.setGameMessage,
	});

	// ✨ Use extracted game systems
	const combat = useCombatSystem({
		player: gameState.player,
		enemies: gameState.enemies,
		setPlayer: gameState.setPlayer,
		setEnemies: gameState.setEnemies,
		setGameMessage: gameState.setGameMessage,
	});

	const trading = useTradingSystem({
		player: gameState.player,
		setPlayer: gameState.setPlayer,
		setGameMessage: gameState.setGameMessage,
	});

	const treasure = useTreasureSystem({
		setPlayer: gameState.setPlayer,
		setTreasures: gameState.setTreasures,
		setGameMessage: gameState.setGameMessage,
	});

	const mapGeneration = useMapGeneration({
		canvasWidth: CANVAS_WIDTH,
		canvasHeight: CANVAS_HEIGHT,
	});

	// ✨ Use extracted rendering system
	const renderer = useGameRenderer({
		canvasRef,
		player: gameState.player,
		npcs: gameState.npcs,
		enemies: gameState.enemies,
		treasures: gameState.treasures,
		canvasWidth: CANVAS_WIDTH,
		canvasHeight: CANVAS_HEIGHT,
	});

	// ✨ Use extracted input handling (updated with save actions)
	useInputHandling({
		player: gameState.player,
		npcs: gameState.npcs,
		enemies: gameState.enemies,
		treasures: gameState.treasures,
		showInventory: gameState.showInventory,
		setPlayer: gameState.setPlayer,
		setShowInventory: gameState.setShowInventory,
		combat,
		sendToLLM: trading.sendToLLM,
		collectTreasure: treasure.collectTreasure,
		saveActions: {
			quickSave: saveSystem.quickSave,
			quickLoad: saveSystem.quickLoad,
			openSaveLoad: () => setShowSaveLoadModal(true),
		},
		canvasWidth: CANVAS_WIDTH,
		canvasHeight: CANVAS_HEIGHT,
		playerSize: gameState.player.size,
	});

	// ✨ Use extracted game loop
	useGameLoop(renderer.draw);

	// ✨ Auto-save every 2 minutes
	useEffect(() => {
		const autoSaveInterval = setInterval(() => {
			saveSystem.autoSave();
		}, 120000); // 2 minutes

		return () => clearInterval(autoSaveInterval);
	}, [saveSystem.autoSave]);

	// ✨ Auto-save on important events (level up, enemy defeat, treasure collection)
	useEffect(() => {
		saveSystem.autoSave();
	}, [gameState.player.level, gameState.player.gold]);

	// ✨ Simplified map initialization
	const handleGenerateMap = () => {
		const result = mapGeneration.generateMap(
			gameState.mapMode,
			gameState.currentLayout
		);

		gameState.setNpcs(result.npcs);
		gameState.setEnemies(result.enemies);
		gameState.setTreasures(result.treasures);
		gameState.setPlayer((prev) => ({
			...prev,
			x: result.playerSpawn.x,
			y: result.playerSpawn.y,
		}));
	};

	return (
		<div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
			{/* ✨ Updated Map Controls with Save Button */}
			<MapControls
				mapMode={gameState.mapMode}
				currentLayout={gameState.currentLayout}
				onMapModeChange={gameState.setMapMode}
				onLayoutChange={gameState.setCurrentLayout}
				onGenerateMap={handleGenerateMap}
				onOpenSaveLoad={() => setShowSaveLoadModal(true)}
			/>

			{/* Game Container */}
			<div
				className="game-container"
				style={{ position: "relative", display: "inline-block" }}
			>
				<canvas
					ref={canvasRef}
					width={CANVAS_WIDTH}
					height={CANVAS_HEIGHT}
					style={{ border: "2px solid #333", backgroundColor: "#2d5016" }}
				/>

				{/* ✨ All UI components */}
				<PlayerStats
					player={gameState.player}
					mapMode={gameState.mapMode}
					currentLayout={gameState.currentLayout}
				/>

				<CombatModal
					inCombat={combat.inCombat}
					enemyTalking={combat.enemyTalking}
					onAttack={combat.attack}
					onFlee={combat.flee}
				/>

				<InventoryPanel
					player={gameState.player}
					showInventory={gameState.showInventory}
				/>

				<GameMessages gameMessage={gameState.gameMessage} />

				<ControlsHelp />

				{/* ✨ NEW: Save/Load Modal */}
				<SaveLoadModal
					isOpen={showSaveLoadModal}
					onClose={() => setShowSaveLoadModal(false)}
					onSave={saveSystem.saveGame}
					onLoad={saveSystem.loadGame}
					onDelete={saveSystem.deleteSave}
					getSaveSlots={saveSystem.getSaveSlots}
					onQuickSave={saveSystem.quickSave}
					onQuickLoad={saveSystem.quickLoad}
					onAutoSave={saveSystem.autoSave}
					onLoadAutoSave={saveSystem.loadAutoSave}
					onExport={saveSystem.exportSave}
					onImport={saveSystem.importSave}
				/>
			</div>
		</div>
	);
}
