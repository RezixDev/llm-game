// ===== components/GameUI/PerformanceMonitor.tsx =====
import React, { useState, useEffect } from "react";

interface PerformanceMonitorProps {
	emotionStats?: any;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
	emotionStats,
}) => {
	const [renderCount, setRenderCount] = useState(0);
	const [fps, setFps] = useState(0);
	const [lastFrameTime, setLastFrameTime] = useState(performance.now());
	const [show, setShow] = useState(false);

	// Count renders
	useEffect(() => {
		setRenderCount((prev) => prev + 1);
	});

	// FPS monitoring
	useEffect(() => {
		let frameId: number;

		const measureFps = () => {
			const now = performance.now();
			const delta = now - lastFrameTime;
			setFps(Math.round(1000 / delta));
			setLastFrameTime(now);
			frameId = requestAnimationFrame(measureFps);
		};

		frameId = requestAnimationFrame(measureFps);

		return () => cancelAnimationFrame(frameId);
	}, [lastFrameTime]);

	if (!show) {
		return (
			<button
				onClick={() => setShow(true)}
				style={{
					position: "fixed",
					bottom: "10px",
					left: "10px",
					padding: "5px 10px",
					backgroundColor: "#333",
					color: "white",
					border: "none",
					borderRadius: "3px",
					fontSize: "10px",
					cursor: "pointer",
					zIndex: 9999,
				}}
			>
				📊 Show Perf
			</button>
		);
	}

	return (
		<div
			style={{
				position: "fixed",
				bottom: "10px",
				left: "10px",
				padding: "10px",
				backgroundColor: "rgba(0,0,0,0.9)",
				color: "#00FF00",
				fontFamily: "monospace",
				fontSize: "11px",
				borderRadius: "5px",
				zIndex: 9999,
				maxWidth: "300px",
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					marginBottom: "5px",
				}}
			>
				<strong>Performance Monitor</strong>
				<button
					onClick={() => setShow(false)}
					style={{
						background: "none",
						border: "1px solid #666",
						color: "white",
						padding: "0 5px",
						fontSize: "10px",
						cursor: "pointer",
					}}
				>
					✕
				</button>
			</div>

			<div>FPS: {fps}</div>
			<div>Renders: {renderCount}</div>
			<div>
				Memory:{" "}
				{(performance as any).memory
					? `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB`
					: "N/A"}
			</div>

			{emotionStats && (
				<>
					<div
						style={{
							borderTop: "1px solid #666",
							marginTop: "5px",
							paddingTop: "5px",
						}}
					>
						<strong>Emotion Detection:</strong>
					</div>
					<div>Active: {emotionStats.isDetecting ? "YES" : "NO"}</div>
					<div>Video Ready: {emotionStats.videoReady ? "YES" : "NO"}</div>
					<div>Rate: {emotionStats.detectionRate}ms</div>
					<div>
						Last Detection:{" "}
						{emotionStats.lastDetectionTime
							? `${Date.now() - emotionStats.lastDetectionTime}ms ago`
							: "Never"}
					</div>
				</>
			)}
		</div>
	);
};
