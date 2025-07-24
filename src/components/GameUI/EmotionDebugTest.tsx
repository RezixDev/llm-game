// ===== components/GameUI/EmotionDebugTest.tsx =====
// Temporary debug component to test emotion detection step by step
import React, { useState, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";

export const EmotionDebugTest: React.FC = () => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [step, setStep] = useState(0);
	const [log, setLog] = useState<string[]>([]);
	const [stream, setStream] = useState<MediaStream | null>(null);

	const addLog = (message: string) => {
		console.log(message);
		setLog((prev) => [
			...prev.slice(-10),
			`${new Date().toLocaleTimeString()}: ${message}`,
		]);
	};

	// Step 1: Load Models
	const loadModels = async () => {
		try {
			addLog("🔄 Starting model loading...");

			// Test if models exist
			const response = await fetch(
				"/models/tiny_face_detector_model-weights_manifest.json"
			);
			if (!response.ok) {
				throw new Error(`Model manifest not found: ${response.status}`);
			}
			addLog("✓ Model manifest accessible");

			await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
			addLog("✓ TinyFaceDetector loaded");

			await faceapi.nets.faceExpressionNet.loadFromUri("/models");
			addLog("✓ FaceExpressionNet loaded");

			setStep(1);
			addLog("🎉 All models loaded successfully!");
		} catch (error) {
			addLog(`❌ Model loading failed: ${error}`);
		}
	};

	// Step 2: Start Camera
	const startCamera = async () => {
		try {
			addLog("🔄 Requesting camera access...");

			const mediaStream = await navigator.mediaDevices.getUserMedia({
				video: {
					width: { ideal: 640 },
					height: { ideal: 480 },
					facingMode: "user",
				},
			});

			setStream(mediaStream);

			if (videoRef.current) {
				videoRef.current.srcObject = mediaStream;
				videoRef.current.onloadedmetadata = () => {
					addLog(
						`✓ Video ready: ${videoRef.current!.videoWidth}x${videoRef.current!.videoHeight}`
					);
					setStep(2);
				};
			}

			addLog("✓ Camera stream obtained");
		} catch (error) {
			addLog(`❌ Camera access failed: ${error}`);
		}
	};

	// Step 3: Test Detection
	const testDetection = async () => {
		if (!videoRef.current) {
			addLog("❌ No video element");
			return;
		}

		try {
			addLog("🔄 Running face detection test...");

			const detections = await faceapi
				.detectAllFaces(
					videoRef.current,
					new faceapi.TinyFaceDetectorOptions({
						inputSize: 224,
						scoreThreshold: 0.3, // Even more sensitive
					})
				)
				.withFaceExpressions();

			addLog(`📊 Detection result: ${detections.length} faces found`);

			if (detections.length > 0) {
				const detection = detections[0];
				const box = detection.detection.box;
				addLog(
					`📍 Face box: ${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.width)}x${Math.round(box.height)}`
				);

				const expressions = detection.expressions;
				const primaryEmotion = Object.entries(expressions).reduce(
					(max, [emotion, score]) =>
						score > max.score ? { emotion, score } : max,
					{ emotion: "neutral", score: 0 }
				);

				addLog(
					`😊 Primary emotion: ${primaryEmotion.emotion} (${Math.round(primaryEmotion.score * 100)}%)`
				);

				// Draw on canvas
				if (canvasRef.current) {
					const canvas = canvasRef.current;
					const ctx = canvas.getContext("2d");
					if (ctx && videoRef.current) {
						canvas.width = videoRef.current.videoWidth;
						canvas.height = videoRef.current.videoHeight;

						ctx.drawImage(videoRef.current, 0, 0);

						// Draw bounding box
						ctx.strokeStyle = "#00FF00";
						ctx.lineWidth = 3;
						ctx.strokeRect(box.x, box.y, box.width, box.height);

						// Draw emotion label
						ctx.fillStyle = "#00FF00";
						ctx.fillRect(box.x, box.y - 30, 250, 25);
						ctx.fillStyle = "#000000";
						ctx.font = "16px Arial";
						ctx.fillText(
							`${primaryEmotion.emotion} (${Math.round(primaryEmotion.score * 100)}%)`,
							box.x + 5,
							box.y - 10
						);
					}
				}

				setStep(3);
			} else {
				addLog(
					"👤 No face detected - try better lighting or get closer to camera"
				);
			}
		} catch (error) {
			addLog(`❌ Detection failed: ${error}`);
		}
	};

	// Cleanup
	useEffect(() => {
		return () => {
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
			}
		};
	}, [stream]);

	return (
		<div
			style={{
				position: "fixed",
				top: "50%",
				left: "50%",
				transform: "translate(-50%, -50%)",
				background: "white",
				border: "2px solid #333",
				borderRadius: "10px",
				padding: "20px",
				zIndex: 9999,
				maxWidth: "800px",
				maxHeight: "90vh",
				overflow: "auto",
			}}
		>
			<h2>🔬 Emotion Detection Debug Test</h2>

			{/* Step buttons */}
			<div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
				<button
					onClick={loadModels}
					disabled={step >= 1}
					style={{
						padding: "10px",
						backgroundColor: step >= 1 ? "#4CAF50" : "#2196F3",
						color: "white",
						border: "none",
						borderRadius: "5px",
						cursor: step >= 1 ? "default" : "pointer",
					}}
				>
					{step >= 1 ? "✓" : "1"} Load Models
				</button>

				<button
					onClick={startCamera}
					disabled={step < 1 || step >= 2}
					style={{
						padding: "10px",
						backgroundColor:
							step >= 2 ? "#4CAF50" : step >= 1 ? "#2196F3" : "#ccc",
						color: "white",
						border: "none",
						borderRadius: "5px",
						cursor: step >= 1 && step < 2 ? "pointer" : "default",
					}}
				>
					{step >= 2 ? "✓" : "2"} Start Camera
				</button>

				<button
					onClick={testDetection}
					disabled={step < 2}
					style={{
						padding: "10px",
						backgroundColor:
							step >= 3 ? "#4CAF50" : step >= 2 ? "#2196F3" : "#ccc",
						color: "white",
						border: "none",
						borderRadius: "5px",
						cursor: step >= 2 ? "pointer" : "default",
					}}
				>
					{step >= 3 ? "✓" : "3"} Test Detection
				</button>
			</div>

			{/* Video and Canvas */}
			<div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
				<div>
					<h4>📹 Live Video</h4>
					<video
						ref={videoRef}
						autoPlay
						muted
						playsInline
						style={{
							width: "320px",
							height: "240px",
							border: "1px solid #333",
							transform: "scaleX(-1)",
						}}
					/>
				</div>

				<div>
					<h4>🎯 Detection Result</h4>
					<canvas
						ref={canvasRef}
						style={{
							width: "320px",
							height: "240px",
							border: "1px solid #333",
							transform: "scaleX(-1)",
						}}
					/>
				</div>
			</div>

			{/* Log */}
			<div>
				<h4>📝 Debug Log</h4>
				<div
					style={{
						background: "#000",
						color: "#00FF00",
						padding: "10px",
						borderRadius: "5px",
						fontFamily: "monospace",
						fontSize: "12px",
						height: "200px",
						overflow: "auto",
					}}
				>
					{log.map((entry, index) => (
						<div key={index}>{entry}</div>
					))}
				</div>
			</div>

			{/* Instructions */}
			<div style={{ marginTop: "20px", fontSize: "14px", color: "#666" }}>
				<strong>Instructions:</strong>
				<ol>
					<li>Click "Load Models" - should see checkmarks for model loading</li>
					<li>Click "Start Camera" - grant permission when prompted</li>
					<li>
						Click "Test Detection" - make sure your face is visible and well-lit
					</li>
				</ol>
				<p>
					<strong>For best results:</strong> Good lighting, face the camera
					directly, be within 2-3 feet of camera
				</p>
			</div>
		</div>
	);
};
