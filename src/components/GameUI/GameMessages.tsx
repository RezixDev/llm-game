// ===== components/GameUI/GameMessages.tsx =====
import React from "react";

interface GameMessagesProps {
	gameMessage: string;
}

export const GameMessages: React.FC<GameMessagesProps> = ({ gameMessage }) => {
	if (!gameMessage) return null;

	return (
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
				zIndex: 100,
			}}
		>
			{gameMessage}
		</div>
	);
};
