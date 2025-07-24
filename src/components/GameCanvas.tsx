// ===== Updated GameCanvas.tsx (Input Handling & UI Extracted) =====
import { useEffect, useRef, useState, useCallback } from "react";
import type { Player, NPC, Enemy, Treasure, MapMode } from "@/types/GameTypes";
import { npcsData, createNPCsFromLayout, npcTemplates } from "@/data/npcs";
import {
	enemiesData,
	createEnemiesFromLayout,
	enemyTemplates,
} from "@/data/enemies";
import {
	treasuresData,
	createTreasuresFromLayout,
	treasureTemplates,
} from "@/data/treasures";
import { gameLayouts } from "@/data/gameLayout";
import { LayoutManager } from "@/utils/layoutUtils";
import { ProceduralPlacer } from "@/utils/proceduralPlacement";

// ✨ NEW: Import our extracted systems
import { useCombatSystem } from "@/hooks/useCombatSystem";
import { useTradingSystem } from "@/hooks/useTradingSystem";
import { useTreasureSystem } from "@/hooks/useTreasureSystem";
import { useInputHandling } from "@/hooks/useInputHandling";

// ✨ NEW: Import UI components
import { CombatModal } from "@/components/GameUI/CombatModal";
import { InventoryPanel } from "@/components/GameUI/InventoryPanel";
import { PlayerStats } from "@/components/GameUI/PlayerStats";
import { ControlsHelp } from "@/components/GameUI/ControlsHelp";
import { GameMessages } from "@/components/GameUI/GameMessages";

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 20;

type PlacementRule = {
	entityType: "npc" | "enemy" | "treasure";
	minDistance?: number;
	maxDistance?: number;
	avoidTypes?: string[];
	preferredZones?: string[];
	density?: number;
};

export default function GameCanvas() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();

	// Map mode state
	const [mapMode, setMapMode] = useState<MapMode>("configuration");
	const [currentLayout, setCurrentLayout] = useState("default");

	// Game state
	const [player, setPlayer] = useState<Player>({
		x: 50,
		y: 50,
		size: PLAYER_SIZE,
		health: 100,
		maxHealth: 100,
		experience: 0,
		level: 1,
		inventory: [],
		gold: 50,
	});

	const [npcs, setNpcs] = useState<NPC[]>(npcsData);
	const [enemies, setEnemies] = useState<Enemy[]>(enemiesData);
	const [treasures, setTreasures] = useState<Treasure[]>(treasuresData);
	const [gameMessage, setGameMessage] = useState<string>("");
	const [showInventory, setShowInventory] = useState<boolean>(false);

	// ✨ NEW: Use extracted game systems
	const combat = useCombatSystem({
		player,
		enemies,
		setPlayer,
		setEnemies,
		setGameMessage,
	});

	const trading = useTradingSystem({
		player,
		setPlayer,
		setGameMessage,
	});

	const treasure = useTreasureSystem({
		setPlayer,
		setTreasures,
		setGameMessage,
	});

	// ✨ NEW: Use extracted input handling
	useInputHandling({
		player,
		npcs,
		enemies,
		treasures,
		showInventory,
		setPlayer,
		setShowInventory,
		combat,
		sendToLLM: trading.sendToLLM,
		collectTreasure: treasure.collectTreasure,
		canvasWidth: CANVAS_WIDTH,
		canvasHeight: CANVAS_HEIGHT,
		playerSize: PLAYER_SIZE,
	});

	// Initialize game with selected map mode
	const initializeGame = useCallback(() => {
		if (mapMode === "procedural") {
			const placer = new ProceduralPlacer(CANVAS_WIDTH, CANVAS_HEIGHT, {
				minDistanceFromPlayer: 80,
				minDistanceBetweenEntities: 40,
				safeZones: [
					{ x: 200, y: 100, radius: 60 },
					{ x: 50, y: 50, radius: 80 },
				],
				dangerZones: [{ x: 400, y: 300, radius: 100 }],
			});

			const rules: PlacementRule[] = [
				{
					entityType: "npc",
					minDistance: 150,
					avoidTypes: ["enemy"],
					density: 0.3,
				},
				{
					entityType: "enemy",
					minDistance: 60,
					avoidTypes: ["npc"],
					preferredZones: ["dangerZone"],
					density: 0.8,
				},
				{
					entityType: "treasure",
					minDistance: 80,
					density: 0.6,
				},
			];

			const positions = placer.placeEntities(rules);

			const positionedNPCs = npcTemplates
				.slice(0, positions.npcs.length)
				.map((template, index) => ({
					...template,
					x: positions.npcs[index].x,
					y: positions.npcs[index].y,
				}));

			const positionedEnemies = enemyTemplates
				.slice(0, positions.enemies.length)
				.map((template, index) => ({
					...template,
					x: positions.enemies[index].x,
					y: positions.enemies[index].y,
				}));

			const positionedTreasures = treasureTemplates
				.slice(0, positions.treasures.length)
				.map((template, index) => ({
					...template,
					x: positions.treasures[index].x,
					y: positions.treasures[index].y,
				}));

			setNpcs(positionedNPCs);
			setEnemies(positionedEnemies);
			setTreasures(positionedTreasures);
			setPlayer((prev) => ({ ...prev, x: 50, y: 50 }));
		} else {
			const layout = gameLayouts[currentLayout];
			if (!layout) {
				console.error(`Layout '${currentLayout}' not found`);
				return;
			}

			const layoutResult = LayoutManager.applyLayout(layout);

			const positionedNPCs = createNPCsFromLayout(layoutResult.npcPositions);
			const positionedEnemies = createEnemiesFromLayout(
				layoutResult.enemyPositions
			);
			const positionedTreasures = createTreasuresFromLayout(
				layoutResult.treasurePositions
			);

			setNpcs(positionedNPCs);
			setEnemies(positionedEnemies);
			setTreasures(positionedTreasures);
			setPlayer((prev) => ({
				...prev,
				x: layoutResult.playerSpawn.x,
				y: layoutResult.playerSpawn.y,
			}));
		}
	}, [mapMode, currentLayout]);

	useEffect(() => {
		initializeGame();
	}, [initializeGame]);

	// Drawing function (still in main component for now)
	const draw = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Clear canvas
		ctx.fillStyle = "#2d5016";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// Draw grid pattern for ground
		ctx.strokeStyle = "#3d6026";
		ctx.lineWidth = 1;
		for (let x = 0; x < canvas.width; x += 40) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, canvas.height);
			ctx.stroke();
		}
		for (let y = 0; y < canvas.height; y += 40) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(canvas.width, y);
			ctx.stroke();
		}

		// Draw player
		ctx.fillStyle = player.health <= 25 ? "orange" : "blue";
		ctx.fillRect(player.x, player.y, player.size, player.size);

		// Player name
		ctx.fillStyle = "white";
		ctx.font = "12px Arial";
		ctx.fillText(`Player (Lv.${player.level})`, player.x, player.y - 5);

		// Draw NPCs
		npcs.forEach((npc) => {
			ctx.fillStyle = npc.color;
			ctx.fillRect(npc.x, npc.y, npc.size, npc.size);

			ctx.fillStyle = "white";
			ctx.fillText(npc.name, npc.x, npc.y - 5);

			if (Math.sqrt((player.x - npc.x) ** 2 + (player.y - npc.y) ** 2) < 35) {
				ctx.fillStyle = "yellow";
				ctx.fillText("Press SPACE to talk", npc.x, npc.y + npc.size + 15);
			}
		});

		// Draw enemies (only if not defeated)
		enemies.forEach((enemy) => {
			if (!enemy.defeated) {
				ctx.fillStyle = enemy.color;
				ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);

				ctx.fillStyle = "white";
				ctx.fillText(`${enemy.name} (${enemy.health}HP)`, enemy.x, enemy.y - 5);

				if (
					Math.sqrt((player.x - enemy.x) ** 2 + (player.y - enemy.y) ** 2) < 40
				) {
					ctx.fillStyle = "red";
					ctx.fillText("Press F to fight", enemy.x, enemy.y + enemy.size + 15);
				}
			}
		});

		// Draw treasures
		treasures.forEach((treasure) => {
			if (!treasure.collected) {
				ctx.fillStyle = "gold";
				ctx.fillRect(treasure.x, treasure.y, treasure.size, treasure.size);

				if (
					Math.sqrt(
						(player.x - treasure.x) ** 2 + (player.y - treasure.y) ** 2
					) < 35
				) {
					ctx.fillStyle = "yellow";
					ctx.fillText(
						"Press E to collect",
						treasure.x,
						treasure.y + treasure.size + 15
					);
				}
			}
		});
	}, [player, npcs, enemies, treasures]);

	// Game loop
	useEffect(() => {
		const gameLoop = () => {
			draw();
			animationRef.current = requestAnimationFrame(gameLoop);
		};

		gameLoop();

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [draw]);

	return (
		<div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
			{/* Map Mode Controls */}
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
						onChange={(e) => setMapMode(e.target.value as MapMode)}
					/>
					Configuration-Based
				</label>
				<label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
					<input
						type="radio"
						value="procedural"
						checked={mapMode === "procedural"}
						onChange={(e) => setMapMode(e.target.value as MapMode)}
					/>
					Procedural Generation
				</label>
				{mapMode === "configuration" && (
					<select
						value={currentLayout}
						onChange={(e) => setCurrentLayout(e.target.value)}
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
					onClick={initializeGame}
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

				{/* ✨ NEW: Use extracted UI components */}
				<PlayerStats
					player={player}
					mapMode={mapMode}
					currentLayout={currentLayout}
				/>

				<CombatModal
					inCombat={combat.inCombat}
					enemyTalking={combat.enemyTalking}
					onAttack={combat.attack}
					onFlee={combat.flee}
				/>

				<InventoryPanel player={player} showInventory={showInventory} />

				<GameMessages gameMessage={gameMessage} />

				<ControlsHelp />
			</div>
		</div>
	);
}
