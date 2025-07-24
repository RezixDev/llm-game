// ===== components/GameCanvas.tsx =====
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
import { itemPrices } from "@/data/itemPrices";
import { gameLayouts } from "@/data/gameLayout";
import { LLMService } from "@/services/llmService";
import { isNearEntity } from "@/utils/gameUtils";
import { LayoutManager } from "@/utils/layoutUtils";
import { ProceduralPlacer } from "@/utils/proceduralPlacement";

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
	const [inCombat, setInCombat] = useState<Enemy | null>(null);
	const [enemyTalking, setEnemyTalking] = useState<boolean>(false);

	// Initialize game with selected map mode
	const initializeGame = useCallback(() => {
		if (mapMode === "procedural") {
			const placer = new ProceduralPlacer(CANVAS_WIDTH, CANVAS_HEIGHT, {
				minDistanceFromPlayer: 80,
				minDistanceBetweenEntities: 40,
				safeZones: [
					{ x: 200, y: 100, radius: 60 }, // Around merchant area
					{ x: 50, y: 50, radius: 80 }, // Player spawn area
				],
				dangerZones: [
					{ x: 400, y: 300, radius: 100 }, // Central battle area
				],
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

			// Create positioned entities
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
			// Configuration-based positioning
			const layout = gameLayouts[currentLayout];
			if (!layout) {
				console.error(`Layout '${currentLayout}' not found`);
				return;
			}

			const layoutResult = LayoutManager.applyLayout(layout);

			// Create positioned entities from layout
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

	// Initialize game when map mode or layout changes
	useEffect(() => {
		initializeGame();
	}, [initializeGame]);

	// Enhanced LLM call function with merchant trading logic
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
		[player]
	);

	// Enhanced combat system with enemy dialogue
	const startCombat = useCallback(async (enemy: Enemy) => {
		setInCombat(enemy);
		setEnemyTalking(true);

		try {
			const battleCry = await LLMService.sendEnemyToLLM(enemy, "attack");
			setGameMessage(`${enemy.name}: ${battleCry}`);
		} catch (error) {
			setGameMessage(`${enemy.name}: ${enemy.battleCries[0]}`);
		}

		setTimeout(() => {
			setEnemyTalking(false);
		}, 3000);
	}, []);

	const attack = useCallback(async () => {
		if (!inCombat || enemyTalking) return;

		const damage = 20 + player.level * 5;
		const newEnemies = enemies.map((enemy) =>
			enemy.id === inCombat.id
				? { ...enemy, health: enemy.health - damage }
				: enemy
		);

		setEnemies(newEnemies);

		const updatedEnemy = newEnemies.find((e) => e.id === inCombat.id);
		if (updatedEnemy && updatedEnemy.health <= 0) {
			// Enemy defeated - final words
			setEnemyTalking(true);

			try {
				const deathCry = await LLMService.sendEnemyToLLM(updatedEnemy, "death");

				const expGained = 15 + updatedEnemy.damage;
				const goldGained = Math.floor(Math.random() * 20) + 10;

				setPlayer((prev) => ({
					...prev,
					experience: prev.experience + expGained,
					level:
						prev.experience + expGained >= prev.level * 100
							? prev.level + 1
							: prev.level,
					gold: prev.gold + goldGained,
				}));

				setEnemies((prev) =>
					prev.map((e) => (e.id === inCombat.id ? { ...e, defeated: true } : e))
				);

				setGameMessage(
					`${inCombat.name}: ${deathCry}\n\n${inCombat.name} defeated! Gained ${expGained} XP and ${goldGained} gold!`
				);
				setInCombat(null);
				setEnemyTalking(false);
			} catch (error) {
				setGameMessage(`${inCombat.name} defeated!`);
				setInCombat(null);
				setEnemyTalking(false);
			}
		} else if (updatedEnemy) {
			// Enemy takes damage and responds
			setEnemyTalking(true);

			try {
				const hurtResponse = await LLMService.sendEnemyToLLM(
					updatedEnemy,
					"defend"
				);

				setTimeout(async () => {
					// Enemy attacks back
					const enemyDamage = updatedEnemy.damage;
					setPlayer((prev) => ({
						...prev,
						health: Math.max(0, prev.health - enemyDamage),
					}));

					try {
						const attackResponse = await LLMService.sendEnemyToLLM(
							updatedEnemy,
							"attack"
						);
						setGameMessage(
							`You hit for ${damage} damage!\n${updatedEnemy.name}: ${hurtResponse}\n\n${updatedEnemy.name}: ${attackResponse}\n${updatedEnemy.name} hits you for ${enemyDamage}!`
						);
					} catch (error) {
						setGameMessage(
							`You hit for ${damage} damage!\n${updatedEnemy.name}: ${hurtResponse}\n${updatedEnemy.name} hits you for ${enemyDamage}!`
						);
					}
					setEnemyTalking(false);
				}, 2000);
			} catch (error) {
				setGameMessage(`You hit for ${damage} damage!`);
				setEnemyTalking(false);
			}
		}
	}, [inCombat, enemyTalking, enemies, player.level]);

	const flee = useCallback(() => {
		setInCombat(null);
		setEnemyTalking(false);
		setGameMessage("You fled from combat!");
		// Move player away
		setPlayer((prev) => ({
			...prev,
			x: Math.max(0, prev.x - 50),
			y: Math.max(0, prev.y - 50),
		}));
	}, []);

	// Treasure collection
	const collectTreasure = useCallback((treasure: Treasure) => {
		setTreasures((prev) =>
			prev.map((t) => (t.id === treasure.id ? { ...t, collected: true } : t))
		);

		setPlayer((prev) => ({
			...prev,
			inventory: [...prev.inventory, treasure.item],
		}));

		if (treasure.item === "Health Potion") {
			setPlayer((prev) => ({
				...prev,
				health: Math.min(prev.maxHealth, prev.health + 50),
			}));
			setGameMessage("Found Health Potion! Health restored!");
		} else {
			setGameMessage(
				`Found ${treasure.item}! It might be valuable to a merchant.`
			);
		}
	}, []);

	// Drawing functions
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

			if (isNearEntity(player.x, player.y, npc.x, npc.y)) {
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

				if (isNearEntity(player.x, player.y, enemy.x, enemy.y, 40)) {
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

				if (isNearEntity(player.x, player.y, treasure.x, treasure.y)) {
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

	// Input handling
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (inCombat && (e.key === "1" || e.key === "2")) {
				if (e.key === "1" && !enemyTalking) attack();
				if (e.key === "2") flee();
				return;
			}

			const speed = 5;
			let newX = player.x;
			let newY = player.y;

			if (e.key === "ArrowUp" || e.key === "w") newY -= speed;
			if (e.key === "ArrowDown" || e.key === "s") newY += speed;
			if (e.key === "ArrowLeft" || e.key === "a") newX -= speed;
			if (e.key === "ArrowRight" || e.key === "d") newX += speed;

			// Boundary checking
			newX = Math.max(0, Math.min(CANVAS_WIDTH - player.size, newX));
			newY = Math.max(0, Math.min(CANVAS_HEIGHT - player.size, newY));

			setPlayer((prev) => ({ ...prev, x: newX, y: newY }));

			// Interactions
			if (e.key === " ") {
				const nearbyNPC = npcs.find((npc) =>
					isNearEntity(player.x, player.y, npc.x, npc.y)
				);
				if (nearbyNPC) {
					const userInput = prompt(`Talk to ${nearbyNPC.name}:`);
					if (userInput) sendToLLM(userInput, nearbyNPC.name, nearbyNPC.type);
				}
			}

			if (e.key === "f" || e.key === "F") {
				const nearbyEnemy = enemies.find(
					(enemy) =>
						!enemy.defeated &&
						isNearEntity(player.x, player.y, enemy.x, enemy.y, 40)
				);
				if (nearbyEnemy && !inCombat) {
					startCombat(nearbyEnemy);
				}
			}

			if (e.key === "e" || e.key === "E") {
				const nearbyTreasure = treasures.find(
					(treasure) =>
						!treasure.collected &&
						isNearEntity(player.x, player.y, treasure.x, treasure.y)
				);
				if (nearbyTreasure) {
					collectTreasure(nearbyTreasure);
				}
			}

			if (e.key === "i" || e.key === "I") {
				setShowInventory(!showInventory);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [
		player,
		npcs,
		enemies,
		treasures,
		inCombat,
		showInventory,
		enemyTalking,
		sendToLLM,
		startCombat,
		attack,
		flee,
		collectTreasure,
	]);

	return (
		<div
			style={{
				padding: "20px",
				fontFamily: "Arial, sans-serif",
			}}
		>
			{/* Map Mode Controls - Now positioned above the game container */}
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

				{/* UI Overlay */}
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
					}}
				>
					<div>
						Mode:{" "}
						{mapMode === "procedural"
							? "Procedural"
							: `Config (${currentLayout})`}
					</div>
					<div>Level: {player.level}</div>
					<div>
						Health: {player.health}/{player.maxHealth}
					</div>
					<div>XP: {player.experience}</div>
					<div>Next Level: {player.level * 100}</div>
					<div style={{ color: "gold" }}>Gold: {player.gold}</div>
				</div>

				{/* Combat UI */}
				{inCombat && (
					<div
						style={{
							position: "absolute",
							top: "50%",
							left: "50%",
							transform: "translate(-50%, -50%)",
							background: "rgba(0,0,0,0.9)",
							color: "white",
							padding: "20px",
							borderRadius: "10px",
							textAlign: "center",
						}}
					>
						<h3>Combat: {inCombat.name}</h3>
						<p>
							Enemy Health: {inCombat.health}/{inCombat.maxHealth}
						</p>
						<div>
							<button
								onClick={attack}
								disabled={enemyTalking}
								style={{
									margin: "5px",
									padding: "10px",
									opacity: enemyTalking ? 0.5 : 1,
								}}
							>
								1 - Attack {enemyTalking ? "(Wait...)" : ""}
							</button>
							<button onClick={flee} style={{ margin: "5px", padding: "10px" }}>
								2 - Flee
							</button>
						</div>
						{enemyTalking && (
							<p style={{ color: "yellow", fontStyle: "italic" }}>
								{inCombat.name} is speaking...
							</p>
						)}
					</div>
				)}

				{/* Inventory */}
				{showInventory && (
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
				)}

				{/* Game Messages */}
				{gameMessage && (
					<div
						style={{
							position: "absolute",
							bottom: "60px",
							left: "50%",
							transform: "translateX(-50%)",
							background: "rgba(0,0,0,0.9)",
							color: "white",
							padding: "15px",
							borderRadius: "10px",
							maxWidth: "500px",
							textAlign: "center",
							whiteSpace: "pre-line",
							border: "2px solid #444",
						}}
					>
						{gameMessage}
					</div>
				)}

				{/* Controls */}
				<div
					style={{
						position: "absolute",
						bottom: "10px",
						right: "10px",
						background: "rgba(0,0,0,0.8)",
						color: "white",
						padding: "10px",
						borderRadius: "5px",
						fontSize: "12px",
					}}
				>
					<div>WASD/Arrows: Move</div>
					<div>Space: Talk to NPC</div>
					<div>F: Fight enemy</div>
					<div>E: Collect treasure</div>
					<div>I: Toggle inventory</div>
				</div>
			</div>
		</div>
	);
}
