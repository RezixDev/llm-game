// ===== components/GameUI/ControlsHelp.tsx (Updated) =====
import React from "react";

export const ControlsHelp: React.FC = () => {
	return (
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
				zIndex: 100,
			}}
		>
			<div>WASD/Arrows: Move</div>
			<div>Space: Talk to NPC</div>
			<div>F: Fight enemy</div>
			<div>E: Collect treasure</div>
			<div>I: Toggle inventory</div>
			<div
				style={{
					borderTop: "1px solid #666",
					marginTop: "8px",
					paddingTop: "8px",
				}}
			>
				<div style={{ color: "#4CAF50" }}>F5: Quick Save</div>
				<div style={{ color: "#2196F3" }}>F9: Quick Load</div>
				<div style={{ color: "#FF9800" }}>ESC: Save Menu</div>
			</div>
		</div>
	);
};
