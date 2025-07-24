// ===== components/GameCanvas.tsx (Optimized Version) =====
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import React from "react";

// Import all your existing hooks and components...
import { useGameState } from "@/hooks/useGameState";
import { useCombatSystem } from "@/hooks/useCombatSystem";
import { useTradingSystem } from "@/hooks/useTradingSystem";
import { useTreasureSystem } from "@/hooks/useTreasureSystem";
import { useInputHandling } from "@/hooks/useInputHandling";
import { useGameRenderer } from "@/hooks/useGameRenderer";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useMapGeneration } from "@/hooks/useMapGeneration";
import { useSaveSystem } from "@/hooks/useSaveSystem";
import { useEmotionDetection } from "@/hooks/useEmotionDetection";

// Import UI components
import { MapControls } from "@/components/GameUI/MapControls";
import { CombatModal } from "@/components/GameUI/CombatModal";
import { InventoryPanel } from "@/components/GameUI/InventoryPanel";
import { PlayerStats } from "@/components/GameUI/PlayerStats";
import { ControlsHelp } from "@/components/GameUI/ControlsHelp";
import { GameMessages } from "@/components/GameUI/GameMessages";
import { SaveLoadModal } from "@/components/GameUI/SaveLoadModal";
import { EmotionIndicator } from "@/components/GameUI/EmotionIndicator";
import { EmotionControls } from "@/components/GameUI/EmotionControls";
import { EmotionCameraPreview } from "@/components/GameUI/EmotionCameraPreview";
import { EmotionDebugTest } from "@/components/GameUI/EmotionDebugTest";

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// Memoized UI Components to prevent unnecessary re-renders
const MemoizedPlayerStats = React.memo(({ player, mapMode, currentLayout }) => (
	<PlayerStats
		player={player}
		mapMode={mapMode}
		currentLayout={currentLayout}
	/>
));

const MemoizedEmotionIndicator = React.memo(
	({ emotion, isActive, isEnabled, error }) => (
		<EmotionIndicator
			emotion={emotion}
			isActive={isActive}
			isEnabled={isEnabled}
			error={error}
		/>
	)
);

const MemoizedControlsHelp = React.memo(() => <ControlsHelp />);

const MemoizedInventoryPanel = React.memo(({ player, showInventory }) => (
	<InventoryPanel player={player} showInventory={showInventory} />
));

export default function GameCanvas() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [showSaveLoadModal, setShowSaveLoadModal] = useState(false);
	const [gameInitialized, setGameInitialized] = useState(false);
	const [showCameraPreview, setShowCameraPreview] = useState(false);
	const [showDebugTest, setShowDebugTest] = useState(false);

	// Game state management
	const gameState = useGameState();

	// Emotion detection with stable reference
	const emotion = useEmotionDetection();

	// Save system with memoized props
	const saveSystemProps = useMemo(
		() => ({
			player: gameState.player,
			npcs: gameState.npcs,
			enemies: gameState.enemies,
			treasures: gameState.treasures,
			mapMode: gameState.mapMode,
			currentLayout: gameState.currentLayout,
			gameMessage: gameState.gameMessage,
			setPlayer: gameState.setPlayer,
			setNpcs: gameState.setNpcs,
			setEnemies: gameState.setEnemies,
			setTreasures: gameState.setTreasures,
			setMapMode: gameState.setMapMode,
			setCurrentLayout: gameState.setCurrentLayout,
			setGameMessage: gameState.setGameMessage,
		}),
		[gameState]
	);

	const saveSystem = useSaveSystem(saveSystemProps);

	// Combat system with memoized props
	const combatProps = useMemo(
		() => ({
			player: gameState.player,
			enemies: gameState.enemies,
			setPlayer: gameState.setPlayer,
			setEnemies: gameState.setEnemies,
			setGameMessage: gameState.setGameMessage,
		}),
		[
			gameState.player,
			gameState.enemies,
			gameState.setPlayer,
			gameState.setEnemies,
			gameState.setGameMessage,
		]
	);

	const combat = useCombatSystem(combatProps);

	// Trading system with memoized props
	const tradingProps = useMemo(
		() => ({
			player: gameState.player,
			setPlayer: gameState.setPlayer,
			setGameMessage: gameState.setGameMessage,
		}),
		[gameState.player, gameState.setPlayer, gameState.setGameMessage]
	);

	const trading = useTradingSystem(tradingProps);

	// Treasure system with memoized props
	const treasureProps = useMemo(
		() => ({
			setPlayer: gameState.setPlayer,
			setTreasures: gameState.setTreasures,
			setGameMessage: gameState.setGameMessage,
		}),
		[gameState.setPlayer, gameState.setTreasures, gameState.setGameMessage]
	);

	const treasure = useTreasureSystem(treasureProps);

	// Map generation (stable)
	const mapGeneration = useMapGeneration({
		canvasWidth: CANVAS_WIDTH,
		canvasHeight: CANVAS_HEIGHT,
	});

	// Renderer with memoized props
	const rendererProps = useMemo(
		() => ({
			canvasRef,
			player: gameState.player,
			npcs: gameState.npcs,
			enemies: gameState.enemies,
			treasures: gameState.treasures,
			canvasWidth: CANVAS_WIDTH,
			canvasHeight: CANVAS_HEIGHT,
		}),
		[gameState.player, gameState.npcs, gameState.enemies, gameState.treasures]
	);

	const renderer = useGameRenderer(rendererProps);

	// Stable emotion context provider
	const getEmotionContext = useCallback(
		() => ({
			emotionDescription: emotion.getEmotionDescription(),
			emotionContext: emotion.getEmotionContext(),
			isEmotionActive: emotion.isEnabled && emotion.isActive,
		}),
		[
			emotion.getEmotionDescription,
			emotion.getEmotionContext,
			emotion.isEnabled,
			emotion.isActive,
		]
	);

	// Input handling with memoized props
	const inputProps = useMemo(
		() => ({
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
			getEmotionContext,
			saveActions: {
				quickSave: saveSystem.quickSave,
				quickLoad: saveSystem.quickLoad,
				openSaveLoad: () => setShowSaveLoadModal(true),
			},
			canvasWidth: CANVAS_WIDTH,
			canvasHeight: CANVAS_HEIGHT,
			playerSize: gameState.player.size,
		}),
		[
			gameState.player,
			gameState.npcs,
			gameState.enemies,
			gameState.treasures,
			gameState.showInventory,
			gameState.setPlayer,
			gameState.setShowInventory,
			combat,
			trading.sendToLLM,
			treasure.collectTreasure,
			getEmotionContext,
			saveSystem.quickSave,
			saveSystem.quickLoad,
		]
	);

	useInputHandling(inputProps);

	// Game loop with stable draw function
	const stableDraw = useCallback(() => {
		renderer.draw();
	}, [renderer.draw]);

	useGameLoop(stableDraw);

	// Auto-save effects (memoized dependencies)
	useEffect(() => {
		const autoSaveInterval = setInterval(() => {
			saveSystem.autoSave();
		}, 120000);

		return () => clearInterval(autoSaveInterval);
	}, [saveSystem.autoSave]);

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

	// Stable event handlers
	const handleGenerateMap = useCallback(() => {
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

		setTimeout(() => {
			if (gameInitialized) {
				saveSystem.autoSave();
			}
		}, 500);
	}, [mapGeneration, gameState, gameInitialized, saveSystem.autoSave]);

	const handleNewGame = useCallback(() => {
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

		setTimeout(() => {
			if (gameInitialized) {
				saveSystem.autoSave();
			}
		}, 500);
	}, [gameState, mapGeneration, gameInitialized, saveSystem.autoSave]);

	// Initialization effect (only runs once)
	useEffect(() => {
		const initializeGame = async () => {
			await new Promise((resolve) => setTimeout(resolve, 100));

			const loaded = saveSystem.loadLastSaveState(true);

			if (!loaded) {
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
	}, []); // Empty dependency array - only run once

	// Before unload effect
	useEffect(() => {
		const handleBeforeUnload = () => {
			if (gameInitialized) {
				saveSystem.autoSave();
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [gameInitialized, saveSystem.autoSave]);

	// Memoized combat attack handler
	const handleCombatAttack = useCallback(() => {
		combat.attack(getEmotionContext());
	}, [combat.attack, getEmotionContext]);

	return (
		<div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
			{/* Map Controls */}
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

				{/* Emotion Detection Controls */}
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

				{/* Memoized UI Components */}
				<MemoizedPlayerStats
					player={gameState.player}
					mapMode={gameState.mapMode}
					currentLayout={gameState.currentLayout}
				/>

				<MemoizedEmotionIndicator
					emotion={emotion.currentEmotion}
					isActive={emotion.isActive}
					isEnabled={emotion.isEnabled}
					error={emotion.error}
				/>

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
					onAttack={handleCombatAttack}
					onFlee={combat.flee}
				/>

				<MemoizedInventoryPanel
					player={gameState.player}
					showInventory={gameState.showInventory}
				/>

				<GameMessages gameMessage={gameState.gameMessage} />

				<MemoizedControlsHelp />

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

				{/* Error notification */}
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

			{/* Debug Test Modal */}
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
