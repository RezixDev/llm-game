// ===== components/GameUI/EmotionCameraPreview.tsx =====
import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

interface EmotionCameraPreviewProps {
	videoElement: HTMLVideoElement | null;
	isActive: boolean;
	isEnabled: boolean;
	currentEmotion: any;
	onClose: () => void;
}

export const EmotionCameraPreview: React.FC<EmotionCameraPreviewProps> = ({
	videoElement,
	isActive,
	isEnabled,
	currentEmotion,
	onClose,
}) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();
	const [showOverlay, setShowOverlay] = useState(true);

	// Draw video and face detection overlay
	useEffect(() => {
		if (!isActive || !videoElement || !canvasRef.current) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const draw = async () => {
			if (!videoElement || videoElement.videoWidth === 0) {
				animationRef.current = requestAnimationFrame(draw);
				return;
			}

			// Set canvas size to match video
			canvas.width = videoElement.videoWidth;
			canvas.height = videoElement.videoHeight;

			// Draw the video frame
			ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

			// Draw face detection overlay if enabled
			if (showOverlay) {
				try {
					const detections = await faceapi
						.detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
						.withFaceExpressions();

					if (detections.length > 0) {
						const detection = detections[0];

						// Draw face bounding box
						const box = detection.detection.box;
						ctx.strokeStyle = "#00FF00";
						ctx.lineWidth = 2;
						ctx.strokeRect(box.x, box.y, box.width, box.height);

						// Draw emotion label
						if (currentEmotion) {
							ctx.fillStyle = "#00FF00";
							ctx.font = "16px Arial";
							ctx.fillRect(box.x, box.y - 25, 200, 20);
							ctx.fillStyle = "#000000";
							ctx.fillText(
								`${currentEmotion.primary} (${Math.round(currentEmotion.confidence * 100)}%)`,
								box.x + 5,
								box.y - 10
							);
						}

						// Draw facial landmarks (optional - can be removed for performance)
						if (process.env.NODE_ENV === "development") {
							// Simple face center point
							const centerX = box.x + box.width / 2;
							const centerY = box.y + box.height / 2;
							ctx.fillStyle = "#FF0000";
							ctx.beginPath();
							ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
							ctx.fill();
						}
					} else {
						// No face detected - show warning
						ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
						ctx.fillRect(0, 0, canvas.width, canvas.height);

						ctx.fillStyle = "#FFFFFF";
						ctx.font = "20px Arial";
						ctx.textAlign = "center";
						ctx.fillText(
							"No Face Detected",
							canvas.width / 2,
							canvas.height / 2
						);
						ctx.textAlign = "left";
					}
				} catch (error) {
					// Silent error handling for detection overlay
				}
			}

			animationRef.current = requestAnimationFrame(draw);
		};

		draw();

		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [isActive, videoElement, showOverlay, currentEmotion]);

	if (!isEnabled) return null;

	return (
		<div
			style={{
				position: "absolute",
				top: "10px",
				right: "10px",
				width: "200px",
				height: "150px",
				backgroundColor: "#000",
				border: "2px solid #333",
				borderRadius: "8px",
				overflow: "hidden",
				zIndex: 200,
				boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
			}}
		>
			{/* Header */}
			<div
				style={{
					background: "rgba(0,0,0,0.8)",
					color: "white",
					padding: "4px 8px",
					fontSize: "11px",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					zIndex: 201,
				}}
			>
				<span>📹 Camera Preview</span>
				<div style={{ display: "flex", gap: "4px" }}>
					<button
						onClick={() => setShowOverlay(!showOverlay)}
						style={{
							background: "none",
							border: "1px solid #666",
							color: "white",
							padding: "2px 6px",
							fontSize: "10px",
							borderRadius: "3px",
							cursor: "pointer",
						}}
						title="Toggle face detection overlay"
					>
						{showOverlay ? "👁️" : "👁️‍🗨️"}
					</button>
					<button
						onClick={onClose}
						style={{
							background: "none",
							border: "1px solid #666",
							color: "white",
							padding: "2px 6px",
							fontSize: "10px",
							borderRadius: "3px",
							cursor: "pointer",
						}}
					>
						✕
					</button>
				</div>
			</div>

			{/* Video Canvas */}
			{isActive && videoElement ? (
				<canvas
					ref={canvasRef}
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						transform: "scaleX(-1)", // Mirror the video like a selfie
					}}
				/>
			) : (
				<div
					style={{
						width: "100%",
						height: "100%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						color: "#666",
						fontSize: "12px",
						textAlign: "center",
						padding: "20px",
					}}
				>
					{!isActive ? "Camera Inactive" : "Loading Camera..."}
				</div>
			)}

			{/* Status indicator */}
			<div
				style={{
					position: "absolute",
					bottom: "4px",
					left: "4px",
					background: "rgba(0,0,0,0.7)",
					color: "white",
					padding: "2px 6px",
					fontSize: "10px",
					borderRadius: "3px",
				}}
			>
				{isActive ? "🟢 Live" : "🔴 Off"}
			</div>

			{/* Current emotion display */}
			{currentEmotion && isActive && (
				<div
					style={{
						position: "absolute",
						bottom: "4px",
						right: "4px",
						background: "rgba(0,0,0,0.7)",
						color: "white",
						padding: "2px 6px",
						fontSize: "10px",
						borderRadius: "3px",
					}}
				>
					{currentEmotion.primary} {Math.round(currentEmotion.confidence * 100)}
					%
				</div>
			)}
		</div>
	);
};
