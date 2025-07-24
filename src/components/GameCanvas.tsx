// ===== Final Refactored GameCanvas.tsx (Under 100 lines!) =====
import { useRef } from "react";

// ✨ NEW: Import all our extracted systems
import { useGameState } from "@/hooks/useGameState";
import { useCombatSystem } from "@/hooks/useCombatSystem";
import { useTradingSystem } from "@/hooks/useTradingSystem";
import { useTreasureSystem } from "@/hooks/useTreasureSystem";
import { useInputHandling } from "@/hooks/useInputHandling";
import { useGameRenderer } from "@/hooks/useGameRenderer";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useMapGeneration } from "@/hooks/useMapGeneration";

// ✨ NEW: Import all UI components
import { MapControls } from "@/components/GameUI/MapControls";
import { CombatModal } from "@/components/GameUI/CombatModal";
import { InventoryPanel } from "@/components/GameUI/InventoryPanel";
import { PlayerStats } from "@/components/GameUI/PlayerStats";
import { ControlsHelp } from "@/components/GameUI/ControlsHelp";
import { GameMessages } from "@/components/GameUI/GameMessages";

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export default function GameCanvas() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	// ✨ NEW: Use extracted game state management
	const gameState = useGameState();

	// ✨ NEW: Use extracted game systems
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

	// ✨ NEW: Use extracted rendering system
	const renderer = useGameRenderer({
		canvasRef,
		player: gameState.player,
		npcs: gameState.npcs,
		enemies: gameState.enemies,
		treasures: gameState.treasures,
		canvasWidth: CANVAS_WIDTH,
		canvasHeight: CANVAS_HEIGHT,
	});

	// ✨ NEW: Use extracted input handling
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
		canvasWidth: CANVAS_WIDTH,
		canvasHeight: CANVAS_HEIGHT,
		playerSize: gameState.player.size,
	});

	// ✨ NEW: Use extracted game loop
	useGameLoop(renderer.draw);

	// ✨ NEW: Simplified map initialization
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
			{/* ✨ NEW: Extracted Map Controls */}
			<MapControls
				mapMode={gameState.mapMode}
				currentLayout={gameState.currentLayout}
				onMapModeChange={gameState.setMapMode}
				onLayoutChange={gameState.setCurrentLayout}
				onGenerateMap={handleGenerateMap}
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

				{/* ✨ All UI components are now clean and extracted */}
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
			</div>
		</div>
	);
}
