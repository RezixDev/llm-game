// ===== components/GameUI/EmotionControls.tsx =====
import React from "react";

interface EmotionControlsProps {
	isEnabled: boolean;
	isLoading: boolean;
	isActive: boolean;
	hasCamera: boolean;
	hasPermission: boolean | null;
	error: string | null;
	onToggle: () => Promise<void>;
	onClearError: () => void;
	showPreview: boolean;
	onTogglePreview: () => void;
}

export const EmotionControls: React.FC<EmotionControlsProps> = ({
	isEnabled,
	isLoading,
	isActive,
	hasCamera,
	hasPermission,
	error,
	onToggle,
	onClearError,
	showPreview,
	onTogglePreview,
}) => {
	const getButtonStyle = () => {
		const baseStyle = {
			padding: "8px 16px",
			border: "none",
			borderRadius: "4px",
			cursor: "pointer",
			fontWeight: "bold" as const,
			fontSize: "13px",
			display: "flex",
			alignItems: "center",
			gap: "6px",
			transition: "all 0.2s ease",
		};

		if (isLoading) {
			return {
				...baseStyle,
				backgroundColor: "#FFC107",
				color: "black",
				cursor: "not-allowed" as const,
			};
		}

		if (isEnabled && isActive) {
			return {
				...baseStyle,
				backgroundColor: "#4CAF50",
				color: "white",
			};
		}

		if (!hasCamera) {
			return {
				...baseStyle,
				backgroundColor: "#9E9E9E",
				color: "white",
				cursor: "not-allowed" as const,
			};
		}

		return {
			...baseStyle,
			backgroundColor: "#2196F3",
			color: "white",
		};
	};

	const getButtonText = () => {
		if (isLoading) return "⏳ Loading...";
		if (!hasCamera) return "📹 No Camera";
		if (isEnabled && isActive) return "😊 Emotion ON";
		return "😐 Emotion OFF";
	};

	const getStatusIcon = () => {
		if (isLoading) return "⏳";
		if (error) return "❌";
		if (!hasCamera) return "📹";
		if (hasPermission === false) return "🚫";
		if (isEnabled && isActive) return "✅";
		return "⭕";
	};

	const handleToggle = async () => {
		if (isLoading || !hasCamera) return;

		if (error) {
			onClearError();
		}

		await onToggle();
	};

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "8px",
				alignItems: "flex-start",
			}}
		>
			{/* Main toggle button */}
			<button
				onClick={handleToggle}
				disabled={isLoading || !hasCamera}
				style={getButtonStyle()}
				title={
					!hasCamera
						? "Camera not available"
						: hasPermission === false
							? "Camera permission denied"
							: error
								? `Error: ${error}`
								: isEnabled
									? "Disable emotion detection"
									: "Enable emotion detection"
				}
			>
				{getButtonText()}
			</button>

			{/* Camera preview toggle button */}
			{isEnabled && isActive && (
				<button
					onClick={onTogglePreview}
					style={{
						padding: "6px 12px",
						backgroundColor: showPreview ? "#FF9800" : "#607D8B",
						color: "white",
						border: "none",
						borderRadius: "4px",
						cursor: "pointer",
						fontSize: "11px",
						display: "flex",
						alignItems: "center",
						gap: "4px",
					}}
					title={showPreview ? "Hide camera preview" : "Show camera preview"}
				>
					📹 {showPreview ? "Hide Preview" : "Show Preview"}
				</button>
			)}

			{/* Status and error display */}
			{(error || hasPermission === false || !hasCamera) && (
				<div
					style={{
						fontSize: "11px",
						color: "#F44336",
						backgroundColor: "rgba(244, 67, 54, 0.1)",
						padding: "6px 8px",
						borderRadius: "4px",
						border: "1px solid rgba(244, 67, 54, 0.3)",
						maxWidth: "200px",
						display: "flex",
						alignItems: "center",
						gap: "6px",
					}}
				>
					<span>{getStatusIcon()}</span>
					<div>
						{!hasCamera && "No camera detected"}
						{hasPermission === false && "Camera access denied"}
						{error && error}
					</div>
				</div>
			)}

			{/* Help text for first-time users */}
			{!isEnabled && hasCamera && !error && hasPermission !== false && (
				<div
					style={{
						fontSize: "10px",
						color: "#666",
						backgroundColor: "rgba(158, 158, 158, 0.1)",
						padding: "6px 8px",
						borderRadius: "4px",
						border: "1px solid rgba(158, 158, 158, 0.3)",
						maxWidth: "200px",
					}}
				>
					💡 Enable emotion detection for more immersive NPC interactions!
				</div>
			)}

			{/* Active status */}
			{isActive && (
				<div
					style={{
						fontSize: "10px",
						color: "#4CAF50",
						backgroundColor: "rgba(76, 175, 80, 0.1)",
						padding: "6px 8px",
						borderRadius: "4px",
						border: "1px solid rgba(76, 175, 80, 0.3)",
						display: "flex",
						alignItems: "center",
						gap: "6px",
					}}
				>
					<div
						style={{
							width: "6px",
							height: "6px",
							borderRadius: "50%",
							backgroundColor: "#4CAF50",
							animation: "pulse 2s infinite",
						}}
					/>
					NPCs can see your emotions
				</div>
			)}

			{/* CSS for pulse animation */}
			<style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
		</div>
	);
};
