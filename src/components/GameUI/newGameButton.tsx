// ===== components/GameUI/NewGameButton.tsx =====
import React from "react";

interface NewGameButtonProps {
	onNewGame: () => void;
}

export const NewGameButton: React.FC<NewGameButtonProps> = ({ onNewGame }) => {
	const handleNewGame = () => {
		const confirmed = window.confirm(
			"Are you sure you want to start a new game? This will reset your progress. Your saves will remain intact."
		);

		if (confirmed) {
			onNewGame();
		}
	};

	return (
		<button
			onClick={handleNewGame}
			style={{
				padding: "8px 16px",
				backgroundColor: "#f44336",
				color: "white",
				border: "none",
				borderRadius: "4px",
				cursor: "pointer",
				fontWeight: "bold",
				marginLeft: "10px",
			}}
			title="Start a completely new game (resets progress)"
		>
			🆕 New Game
		</button>
	);
};
