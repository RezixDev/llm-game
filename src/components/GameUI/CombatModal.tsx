// ===== components/GameUI/CombatModal.tsx =====
import React from "react";
import type { Enemy } from "@/types/GameTypes";

interface CombatModalProps {
	inCombat: Enemy | null;
	enemyTalking: boolean;
	onAttack: () => void;
	onFlee: () => void;
}

export const CombatModal: React.FC<CombatModalProps> = ({
	inCombat,
	enemyTalking,
	onAttack,
	onFlee,
}) => {
	if (!inCombat) return null;

	return (
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
				zIndex: 1000,
			}}
		>
			<h3>Combat: {inCombat.name}</h3>
			<p>
				Enemy Health: {inCombat.health}/{inCombat.maxHealth}
			</p>
			<div>
				<button
					onClick={onAttack}
					disabled={enemyTalking}
					style={{
						margin: "5px",
						padding: "10px",
						opacity: enemyTalking ? 0.5 : 1,
						backgroundColor: enemyTalking ? "#666" : "#ff4444",
						color: "white",
						border: "none",
						borderRadius: "4px",
						cursor: enemyTalking ? "not-allowed" : "pointer",
					}}
				>
					1 - Attack {enemyTalking ? "(Wait...)" : ""}
				</button>
				<button
					onClick={onFlee}
					style={{
						margin: "5px",
						padding: "10px",
						backgroundColor: "#666",
						color: "white",
						border: "none",
						borderRadius: "4px",
						cursor: "pointer",
					}}
				>
					2 - Flee
				</button>
			</div>
			{enemyTalking && (
				<p style={{ color: "yellow", fontStyle: "italic", marginTop: "10px" }}>
					{inCombat.name} is speaking...
				</p>
			)}
		</div>
	);
};
