// ===== components/GameUI/EmotionIndicator.tsx =====
import React from "react";
import type { EmotionData } from "@/services/emotionDetectionService";

interface EmotionIndicatorProps {
	emotion: EmotionData | null;
	isActive: boolean;
	isEnabled: boolean;
	error: string | null;
}

const emotionEmojis: Record<string, string> = {
	happy: "😊",
	sad: "😢",
	angry: "😠",
	fearful: "😨",
	disgusted: "🤢",
	surprised: "😲",
	neutral: "😐",
};

const emotionColors: Record<string, string> = {
	happy: "#4CAF50", // Green
	sad: "#2196F3", // Blue
	angry: "#F44336", // Red
	fearful: "#FF9800", // Orange
	disgusted: "#9C27B0", // Purple
	surprised: "#FFEB3B", // Yellow
	neutral: "#9E9E9E", // Gray
};

export const EmotionIndicator: React.FC<EmotionIndicatorProps> = ({
	emotion,
	isActive,
	isEnabled,
	error,
}) => {
	// Don't render if not enabled
	if (!isEnabled) return null;

	const getStatusColor = (): string => {
		if (error) return "#F44336"; // Red for error
		if (!isActive) return "#9E9E9E"; // Gray for inactive
		if (!emotion) return "#FF9800"; // Orange for no detection
		return emotionColors[emotion.primary] || "#9E9E9E";
	};

	const getStatusText = (): string => {
		if (error) return "Error";
		if (!isActive) return "Inactive";
		if (!emotion) return "No Face";
		return emotion.primary.charAt(0).toUpperCase() + emotion.primary.slice(1);
	};

	const getEmoji = (): string => {
		if (error || !isActive || !emotion) return "❓";
		return emotionEmojis[emotion.primary] || "❓";
	};

	const getConfidenceBar = (): JSX.Element => {
		if (!emotion || !isActive) return <></>;

		const confidence = Math.round(emotion.confidence * 100);
		const barColor =
			emotion.confidence > 0.7
				? "#4CAF50"
				: emotion.confidence > 0.4
					? "#FF9800"
					: "#F44336";

		return (
			<div style={{ marginTop: "4px", fontSize: "10px" }}>
				<div
					style={{
						width: "60px",
						height: "3px",
						backgroundColor: "#333",
						borderRadius: "2px",
						overflow: "hidden",
					}}
				>
					<div
						style={{
							width: `${confidence}%`,
							height: "100%",
							backgroundColor: barColor,
							transition: "width 0.3s ease",
						}}
					/>
				</div>
				<div
					style={{
						color: "#ccc",
						fontSize: "9px",
						marginTop: "1px",
						textAlign: "center",
					}}
				>
					{confidence}%
				</div>
			</div>
		);
	};

	return (
		<div
			style={{
				position: "absolute",
				top: "120px",
				left: "10px",
				background: "rgba(0,0,0,0.85)",
				color: "white",
				padding: "8px",
				borderRadius: "8px",
				fontSize: "12px",
				fontFamily: "monospace",
				zIndex: 150,
				border: `2px solid ${getStatusColor()}`,
				minWidth: "80px",
				textAlign: "center",
				boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
			}}
			title={error || `Emotion Detection: ${getStatusText()}`}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					gap: "6px",
				}}
			>
				<span style={{ fontSize: "16px" }}>{getEmoji()}</span>
				<div>
					<div
						style={{
							color: getStatusColor(),
							fontWeight: "bold",
							fontSize: "11px",
						}}
					>
						{getStatusText()}
					</div>
					{getConfidenceBar()}
				</div>
			</div>

			{/* Camera status indicator */}
			<div
				style={{
					position: "absolute",
					top: "-4px",
					right: "-4px",
					width: "8px",
					height: "8px",
					borderRadius: "50%",
					backgroundColor: isActive ? "#4CAF50" : "#F44336",
					border: "1px solid white",
					boxShadow: "0 0 4px rgba(0,0,0,0.5)",
				}}
			/>

			{/* Debug info (only in development) */}
			{process.env.NODE_ENV === "development" && emotion && (
				<div
					style={{
						marginTop: "4px",
						fontSize: "9px",
						color: "#888",
						borderTop: "1px solid #444",
						paddingTop: "4px",
					}}
				>
					<div>All emotions:</div>
					{Object.entries(emotion.allEmotions).map(([name, score]) => (
						<div
							key={name}
							style={{
								display: "flex",
								justifyContent: "space-between",
								fontSize: "8px",
							}}
						>
							<span>{name}:</span>
							<span>{Math.round(score * 100)}%</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
};
