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
	const [debugInfo, setDebugInfo] = useState<string>("");

	// Draw video and face detection overlay
	useEffect(() => {
		if (!isActive || !videoElement || !canvasRef.current) {
			setDebugInfo("Not active, no video element, or no canvas");
			return;
		}

		const canvas = canvasRef.current;
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			setDebugInfo("No canvas context");
			return;
		}

		let frameCount = 0;
		let isDrawing = true;

		const draw = async () => {
			if (!isDrawing) return;

			frameCount++;

			// Wait for video to be fully loaded and playing
			if (
				!videoElement ||
				videoElement.videoWidth === 0 ||
				videoElement.videoHeight === 0 ||
				videoElement.readyState < 2
			) {
				setDebugInfo(
					`Video not ready: readyState=${videoElement?.readyState}, dimensions=${videoElement?.videoWidth}x${videoElement?.videoHeight} (frame ${frameCount})`
				);
				animationRef.current = requestAnimationFrame(draw);
				return;
			}

			// Set canvas size to match video (but limit size for performance)
			const maxWidth = 200;
			const maxHeight = 150;
			const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;

			let canvasWidth = maxWidth;
			let canvasHeight = maxWidth / aspectRatio;

			if (canvasHeight > maxHeight) {
				canvasHeight = maxHeight;
				canvasWidth = maxHeight * aspectRatio;
			}

			canvas.width = canvasWidth;
			canvas.height = canvasHeight;

			try {
				// Clear canvas first
				ctx.clearRect(0, 0, canvasWidth, canvasHeight);

				// Draw the video frame
				ctx.drawImage(videoElement, 0, 0, canvasWidth, canvasHeight);
				setDebugInfo(
					`✓ Drawing video: ${canvasWidth}x${canvasHeight} (frame ${frameCount})`
				);

				// Draw face detection overlay if enabled
				if (showOverlay) {
					try {
						// Use the video element directly for detection (same as debug test)
						const detections = await faceapi
							.detectAllFaces(
								videoElement,
								new faceapi.TinyFaceDetectorOptions({
									inputSize: 224,
									scoreThreshold: 0.3,
								})
							)
							.withFaceExpressions();

						setDebugInfo(
							`✓ Detection: ${detections.length} faces found (frame ${frameCount})`
						);

						if (detections.length > 0) {
							const detection = detections[0];

							// Scale the detection box to match canvas size
							const scaleX = canvasWidth / videoElement.videoWidth;
							const scaleY = canvasHeight / videoElement.videoHeight;

							const box = {
								x: detection.detection.box.x * scaleX,
								y: detection.detection.box.y * scaleY,
								width: detection.detection.box.width * scaleX,
								height: detection.detection.box.height * scaleY,
							};

							// Draw face bounding box
							ctx.strokeStyle = "#00FF00";
							ctx.lineWidth = 2;
							ctx.strokeRect(box.x, box.y, box.width, box.height);

							// Draw emotion label
							if (currentEmotion) {
								const labelWidth = 150;
								const labelHeight = 20;

								ctx.fillStyle = "rgba(0, 255, 0, 0.8)";
								ctx.fillRect(
									box.x,
									Math.max(0, box.y - 25),
									labelWidth,
									labelHeight
								);
								ctx.fillStyle = "#000000";
								ctx.font = "12px Arial";
								ctx.fillText(
									`${currentEmotion.primary} (${Math.round(currentEmotion.confidence * 100)}%)`,
									box.x + 5,
									Math.max(15, box.y - 10)
								);
							}

							// Draw face center point
							const centerX = box.x + box.width / 2;
							const centerY = box.y + box.height / 2;
							ctx.fillStyle = "#FF0000";
							ctx.beginPath();
							ctx.arc(centerX, centerY, 3, 0, 2 * Math.PI);
							ctx.fill();
						} else {
							// No face detected - show warning
							ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
							ctx.fillRect(0, 0, canvasWidth, canvasHeight);

							ctx.fillStyle = "#FFFFFF";
							ctx.strokeStyle = "#000000";
							ctx.lineWidth = 1;
							ctx.font = "14px Arial";
							ctx.textAlign = "center";

							const text = "No Face Detected";
							ctx.strokeText(text, canvasWidth / 2, canvasHeight / 2);
							ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);
							ctx.textAlign = "left";
						}
					} catch (detectionError) {
						setDebugInfo(`❌ Detection error: ${detectionError}`);
						console.error("Face detection error:", detectionError);

						// Draw error overlay
						ctx.fillStyle = "rgba(255, 165, 0, 0.3)";
						ctx.fillRect(0, 0, canvasWidth, canvasHeight);
						ctx.fillStyle = "#FFFFFF";
						ctx.strokeStyle = "#000000";
						ctx.lineWidth = 1;
						ctx.font = "12px Arial";
						ctx.textAlign = "center";
						ctx.strokeText(
							"Detection Error",
							canvasWidth / 2,
							canvasHeight / 2
						);
						ctx.fillText("Detection Error", canvasWidth / 2, canvasHeight / 2);
						ctx.textAlign = "left";
					}
				}
			} catch (drawError) {
				setDebugInfo(`❌ Draw error: ${drawError}`);
				console.error("Canvas draw error:", drawError);
			}

			if (isDrawing) {
				animationRef.current = requestAnimationFrame(draw);
			}
		};

		// Start drawing with a small delay to ensure video is ready
		setTimeout(() => {
			if (isDrawing) {
				draw();
			}
		}, 100);

		return () => {
			isDrawing = false;
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
				height: "200px", // Made taller to accommodate debug info
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
					background: "rgba(0,0,0,0.9)",
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
				<span>📹 Camera Debug</span>
				<div style={{ display: "flex", gap: "4px" }}>
					<button
						onClick={() => setShowOverlay(!showOverlay)}
						style={{
							background: showOverlay ? "#4CAF50" : "none",
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
				<div
					style={{
						marginTop: "25px",
						height: "150px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<canvas
						ref={canvasRef}
						style={{
							maxWidth: "100%",
							maxHeight: "100%",
							objectFit: "contain",
							transform: "scaleX(-1)", // Mirror the video like a selfie
							border: "1px solid #333",
						}}
					/>
				</div>
			) : (
				<div
					style={{
						width: "100%",
						height: "150px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						color: "#666",
						fontSize: "12px",
						textAlign: "center",
						padding: "20px",
						marginTop: "25px",
					}}
				>
					{!isActive ? "Camera Inactive" : "Loading Camera..."}
				</div>
			)}

			{/* Debug info */}
			<div
				style={{
					position: "absolute",
					bottom: "0",
					left: "0",
					right: "0",
					background: "rgba(0,0,0,0.9)",
					color: "#00FF00",
					padding: "4px",
					fontSize: "9px",
					fontFamily: "monospace",
					maxHeight: "40px",
					overflow: "hidden",
				}}
			>
				{debugInfo}
			</div>

			{/* Status indicators */}
			<div
				style={{
					position: "absolute",
					bottom: "42px",
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
						bottom: "42px",
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
