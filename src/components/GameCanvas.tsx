// ===== components/GameCanvas.tsx (Enhanced with Full Emotion Detection) =====
import { useRef, useState, useEffect } from "react";

// ✨ Import all our systems (including emotion detection)
import { useGameState } from "@/hooks/useGameState";
import { useCombatSystem } from "@/hooks/useCombatSystem";
import { useTradingSystem } from "@/hooks/useTradingSystem";
import { useTreasureSystem } from "@/hooks/useTreasureSystem";
import { useInputHandling } from "@/hooks/useInputHandling";
import { useGameRenderer } from "@/hooks/useGameRenderer";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useMapGeneration } from "@/hooks/useMapGeneration";
import { useSaveSystem } from "@/hooks/useSaveSystem";
import { useEmotionDetection } from "@/hooks/useEmotionDetection"; // NEW

// ✨ Import all UI components (including emotion components)
import { MapControls } from "@/components/GameUI/MapControls";
import { CombatModal } from "@/components/GameUI/CombatModal";
import { InventoryPanel } from "@/components/GameUI/InventoryPanel";
import { PlayerStats } from "@/components/GameUI/PlayerStats";
import { ControlsHelp } from "@/components/GameUI/ControlsHelp";
import { GameMessages } from "@/components/GameUI/GameMessages";
import { SaveLoadModal } from "@/components/GameUI/SaveLoadModal";
import { EmotionIndicator } from "@/components/GameUI/EmotionIndicator"; // NEW
import { EmotionControls } from "@/components/GameUI/EmotionControls"; // NEW
import { EmotionCameraPreview } from "@/components/GameUI/EmotionCameraPreview"; // NEW
import { EmotionDebugTest } from "@/components/GameUI/EmotionDebugTest"; // TEMP DEBUG

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

export default function GameCanvas() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [showSaveLoadModal, setShowSaveLoadModal] = useState(false);
	const [gameInitialized, setGameInitialized] = useState(false);
	const [showCameraPreview, setShowCameraPreview] = useState(false);
	const [showDebugTest, setShowDebugTest] = useState(false); // TEMP DEBUG

	// ✨ Use extracted game state management
	const gameState = useGameState();

	// ✨ NEW: Initialize emotion detection system
	const emotion = useEmotionDetection();

	// ✨ Initialize save system
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

	// ✨ Use extracted game systems (enhanced with emotion context)
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

	// ✨ NEW: Create emotion context provider
	const getEmotionContext = () => ({
		emotionDescription: emotion.getEmotionDescription(),
		emotionContext: emotion.getEmotionContext(),
		isEmotionActive: emotion.isEnabled && emotion.isActive,
	});

	// ✨ Use extracted input handling (with emotion context)
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
		getEmotionContext, // NEW
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
		if (gameInitialized) {
			saveSystem.autoSave();
		}
	}, [
		gameState.player.level,
		gameState.player.gold,
		gameInitialized,
		saveSystem.autoSave,
	]);

	// ✨ Auto-load last save state on component mount (page refresh)
	useEffect(() => {
		const initializeGame = async () => {
			// Small delay to ensure all systems are ready
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Try to load the most recent save state
			const loaded = saveSystem.loadLastSaveState(true); // silent = true for initial load

			if (loaded) {
				console.log("Game state restored from previous session");
			} else {
				console.log("Starting new game - no previous save found");
				// Generate initial map if no save was loaded
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
			}

			setGameInitialized(true);
		};

		initializeGame();
	}, []); // Only run once on mount

	// ✨ Auto-save before page unload (when user closes tab/refreshes)
	useEffect(() => {
		const handleBeforeUnload = () => {
			if (gameInitialized) {
				saveSystem.autoSave();
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [gameInitialized, saveSystem.autoSave]);

	// ✨ Simplified map initialization (now only used for manual generation)
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

		// Auto-save after generating new map
		setTimeout(() => {
			if (gameInitialized) {
				saveSystem.autoSave();
			}
		}, 500);
	};

	// ✨ Start completely fresh game
	const handleNewGame = () => {
		// Reset to initial game state
		gameState.setPlayer({
			x: 50,
			y: 250,
			size: 20,
			health: 100,
			maxHealth: 100,
			experience: 0,
			level: 1,
			inventory: [],
			gold: 50,
		});

		// Generate fresh map
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

		gameState.setGameMessage("New game started!");
		setTimeout(() => gameState.setGameMessage(""), 3000);

		// Auto-save the new game state
		setTimeout(() => {
			if (gameInitialized) {
				saveSystem.autoSave();
			}
		}, 500);
	};

	return (
		<div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
			{/* ✨ Enhanced Map Controls with Emotion Controls */}
			<div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
				<div style={{ flex: 1 }}>
					<MapControls
						mapMode={gameState.mapMode}
						currentLayout={gameState.currentLayout}
						onMapModeChange={gameState.setMapMode}
						onLayoutChange={gameState.setCurrentLayout}
						onGenerateMap={handleGenerateMap}
						onOpenSaveLoad={() => setShowSaveLoadModal(true)}
						onNewGame={handleNewGame}
					/>
				</div>

				{/* ✨ NEW: Emotion Detection Controls */}
				<div
					style={{
						background: "#f0f0f0",
						border: "2px solid #333",
						borderRadius: "8px",
						padding: "15px",
					}}
				>
					<strong style={{ marginBottom: "10px", display: "block" }}>
						🎭 Emotion Detection
					</strong>
					<EmotionControls
						isEnabled={emotion.isEnabled}
						isLoading={emotion.isLoading}
						isActive={emotion.isActive}
						hasCamera={emotion.hasCamera}
						hasPermission={emotion.hasPermission}
						error={emotion.error}
						onToggle={emotion.toggleDetection}
						onClearError={emotion.clearError}
						showPreview={showCameraPreview}
						onTogglePreview={() => setShowCameraPreview(!showCameraPreview)}
					/>

					{/* TEMP: Debug Test Button */}
					<button
						onClick={() => setShowDebugTest(true)}
						style={{
							marginTop: "10px",
							padding: "6px 12px",
							backgroundColor: "#FF5722",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer",
							fontSize: "11px",
						}}
					>
						🔬 Debug Test
					</button>
				</div>
			</div>

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

				{/* ✨ NEW: Emotion Indicator (always rendered if enabled) */}
				<EmotionIndicator
					emotion={emotion.currentEmotion}
					isActive={emotion.isActive}
					isEnabled={emotion.isEnabled}
					error={emotion.error}
				/>

				{/* ✨ NEW: Camera Preview (debug feature) */}
				{showCameraPreview && (
					<EmotionCameraPreview
						videoElement={emotion.getVideoElement()}
						isActive={emotion.isActive}
						isEnabled={emotion.isEnabled}
						currentEmotion={emotion.currentEmotion}
						onClose={() => setShowCameraPreview(false)}
					/>
				)}

				<CombatModal
					inCombat={combat.inCombat}
					enemyTalking={combat.enemyTalking}
					onAttack={() => combat.attack(getEmotionContext())}
					onFlee={combat.flee}
				/>

				<InventoryPanel
					player={gameState.player}
					showInventory={gameState.showInventory}
				/>

				<GameMessages gameMessage={gameState.gameMessage} />

				<ControlsHelp />

				{/* ✨ Save/Load Modal */}
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

				{/* ✨ NEW: Error notification for emotion detection */}
				{emotion.error && (
					<div
						style={{
							position: "absolute",
							top: "10px",
							right: "10px",
							background: "rgba(244, 67, 54, 0.9)",
							color: "white",
							padding: "10px",
							borderRadius: "5px",
							fontSize: "12px",
							zIndex: 200,
							maxWidth: "200px",
						}}
					>
						<strong>Emotion Detection Error:</strong>
						<br />
						{emotion.error}
						<button
							onClick={emotion.clearError}
							style={{
								marginTop: "5px",
								padding: "2px 6px",
								background: "white",
								color: "#F44336",
								border: "none",
								borderRadius: "3px",
								fontSize: "10px",
								cursor: "pointer",
							}}
						>
							Dismiss
						</button>
					</div>
				)}
			</div>

			{/* ✨ NEW: Development Info (only in dev mode) */}
			{process.env.NODE_ENV === "development" && emotion.currentEmotion && (
				<div
					style={{
						marginTop: "20px",
						padding: "15px",
						background: "#f5f5f5",
						borderRadius: "8px",
						border: "2px solid #333",
						fontSize: "12px",
						fontFamily: "monospace",
					}}
				>
					<strong>🔬 Emotion Debug Info:</strong>
					<br />
					<strong>Primary:</strong> {emotion.currentEmotion.primary} (
					{Math.round(emotion.currentEmotion.confidence * 100)}%)
					<br />
					<strong>Context:</strong> "{emotion.getEmotionContext()}"
					<br />
					<strong>Description:</strong> "{emotion.getEmotionDescription()}"
					<br />
					<strong>All Emotions:</strong>
					<div
						style={{
							marginTop: "5px",
							display: "grid",
							gridTemplateColumns: "1fr 1fr 1fr",
							gap: "10px",
						}}
					>
						{Object.entries(emotion.currentEmotion.allEmotions).map(
							([name, score]) => (
								<div key={name}>
									{name}: {Math.round(score * 100)}%
								</div>
							)
						)}
					</div>
				</div>
			)}

			{/* TEMP: Debug Test Modal */}
			{showDebugTest && (
				<div>
					<EmotionDebugTest />
					<button
						onClick={() => setShowDebugTest(false)}
						style={{
							position: "fixed",
							top: "10px",
							right: "10px",
							zIndex: 10000,
							padding: "10px",
							backgroundColor: "#f44336",
							color: "white",
							border: "none",
							borderRadius: "5px",
							cursor: "pointer",
						}}
					>
						Close Debug
					</button>
				</div>
			)}
		</div>
	);
}
