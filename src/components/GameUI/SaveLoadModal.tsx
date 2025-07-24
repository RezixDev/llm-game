// ===== components/GameUI/SaveLoadModal.tsx =====
import React, { useState, useEffect } from "react";
import type { SaveSlot } from "@/hooks/useSaveSystem";

interface SaveLoadModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (slotId: string, saveName?: string) => boolean;
	onLoad: (slotId: string) => boolean;
	onDelete: (slotId: string) => boolean;
	getSaveSlots: () => SaveSlot[];
	onQuickSave: () => boolean;
	onQuickLoad: () => boolean;
	onAutoSave: () => boolean;
	onLoadAutoSave: () => boolean;
	onExport: (slotId: string) => string | null;
	onImport: (slotId: string, data: string) => boolean;
}

export const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
	isOpen,
	onClose,
	onSave,
	onLoad,
	onDelete,
	getSaveSlots,
	onQuickSave,
	onQuickLoad,
	onAutoSave,
	onLoadAutoSave,
	onExport,
	onImport,
}) => {
	const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);
	const [selectedSlot, setSelectedSlot] = useState<string>("");
	const [saveName, setSaveName] = useState<string>("");
	const [mode, setMode] = useState<"save" | "load">("save");
	const [showImportExport, setShowImportExport] = useState<boolean>(false);
	const [importData, setImportData] = useState<string>("");

	useEffect(() => {
		if (isOpen) {
			setSaveSlots(getSaveSlots());
		}
	}, [isOpen, getSaveSlots]);

	const handleSave = () => {
		if (!selectedSlot) return;

		const success = onSave(selectedSlot, saveName || undefined);
		if (success) {
			setSaveSlots(getSaveSlots());
			setSaveName("");
		}
	};

	const handleLoad = () => {
		if (!selectedSlot) return;

		const success = onLoad(selectedSlot);
		if (success) {
			onClose();
		}
	};

	const handleDelete = () => {
		if (!selectedSlot) return;

		const confirmDelete = window.confirm(
			"Are you sure you want to delete this save?"
		);
		if (confirmDelete) {
			const success = onDelete(selectedSlot);
			if (success) {
				setSaveSlots(getSaveSlots());
				setSelectedSlot("");
			}
		}
	};

	const handleExport = () => {
		if (!selectedSlot) return;

		const saveData = onExport(selectedSlot);
		if (saveData) {
			// Create downloadable file
			const blob = new Blob([saveData], { type: "application/json" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `llm-game-save-${selectedSlot}.json`;
			a.click();
			URL.revokeObjectURL(url);
		}
	};

	const handleImport = () => {
		if (!selectedSlot || !importData.trim()) return;

		const success = onImport(selectedSlot, importData.trim());
		if (success) {
			setSaveSlots(getSaveSlots());
			setImportData("");
			setShowImportExport(false);
		}
	};

	const formatTimestamp = (timestamp: number) => {
		if (timestamp === 0) return "Empty";
		return new Date(timestamp).toLocaleString();
	};

	if (!isOpen) return null;

	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: "rgba(0,0,0,0.8)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 2000,
			}}
			onClick={(e) => e.target === e.currentTarget && onClose()}
		>
			<div
				style={{
					backgroundColor: "white",
					borderRadius: "12px",
					padding: "20px",
					minWidth: "600px",
					maxWidth: "90vw",
					maxHeight: "90vh",
					overflow: "auto",
					boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
				}}
			>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "20px",
					}}
				>
					<h2 style={{ margin: 0, color: "#333" }}>Save & Load Game</h2>
					<button
						onClick={onClose}
						style={{
							background: "none",
							border: "none",
							fontSize: "24px",
							cursor: "pointer",
							color: "#666",
						}}
					>
						×
					</button>
				</div>

				{/* Quick Actions */}
				<div
					style={{
						marginBottom: "20px",
						padding: "15px",
						backgroundColor: "#f5f5f5",
						borderRadius: "8px",
					}}
				>
					<h3 style={{ margin: "0 0 10px 0", color: "#333" }}>Quick Actions</h3>
					<div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
						<button
							onClick={onQuickSave}
							style={{
								padding: "8px 16px",
								backgroundColor: "#4CAF50",
								color: "white",
								border: "none",
								borderRadius: "4px",
								cursor: "pointer",
							}}
						>
							💾 Quick Save (F5)
						</button>
						<button
							onClick={onQuickLoad}
							style={{
								padding: "8px 16px",
								backgroundColor: "#2196F3",
								color: "white",
								border: "none",
								borderRadius: "4px",
								cursor: "pointer",
							}}
						>
							📂 Quick Load (F9)
						</button>
						<button
							onClick={onAutoSave}
							style={{
								padding: "8px 16px",
								backgroundColor: "#FF9800",
								color: "white",
								border: "none",
								borderRadius: "4px",
								cursor: "pointer",
							}}
						>
							🔄 Auto Save
						</button>
						<button
							onClick={onLoadAutoSave}
							style={{
								padding: "8px 16px",
								backgroundColor: "#9C27B0",
								color: "white",
								border: "none",
								borderRadius: "4px",
								cursor: "pointer",
							}}
						>
							⚡ Load Auto Save
						</button>
					</div>
				</div>

				{/* Mode Selector */}
				<div style={{ marginBottom: "20px" }}>
					<div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
						<button
							onClick={() => setMode("save")}
							style={{
								padding: "10px 20px",
								backgroundColor: mode === "save" ? "#4CAF50" : "#ddd",
								color: mode === "save" ? "white" : "#333",
								border: "none",
								borderRadius: "4px",
								cursor: "pointer",
							}}
						>
							💾 Save Game
						</button>
						<button
							onClick={() => setMode("load")}
							style={{
								padding: "10px 20px",
								backgroundColor: mode === "load" ? "#2196F3" : "#ddd",
								color: mode === "load" ? "white" : "#333",
								border: "none",
								borderRadius: "4px",
								cursor: "pointer",
							}}
						>
							📂 Load Game
						</button>
						<button
							onClick={() => setShowImportExport(!showImportExport)}
							style={{
								padding: "10px 20px",
								backgroundColor: showImportExport ? "#FF5722" : "#ddd",
								color: showImportExport ? "white" : "#333",
								border: "none",
								borderRadius: "4px",
								cursor: "pointer",
							}}
						>
							🔄 Import/Export
						</button>
					</div>
				</div>

				{/* Save Name Input (only for save mode) */}
				{mode === "save" && (
					<div style={{ marginBottom: "20px" }}>
						<label
							style={{
								display: "block",
								marginBottom: "5px",
								fontWeight: "bold",
							}}
						>
							Save Name (optional):
						</label>
						<input
							type="text"
							value={saveName}
							onChange={(e) => setSaveName(e.target.value)}
							placeholder="Enter a name for this save..."
							style={{
								width: "100%",
								padding: "8px",
								border: "1px solid #ddd",
								borderRadius: "4px",
								fontSize: "14px",
							}}
						/>
					</div>
				)}

				{/* Save Slots */}
				<div style={{ marginBottom: "20px" }}>
					<h3 style={{ marginBottom: "10px", color: "#333" }}>Save Slots</h3>
					<div style={{ display: "grid", gap: "10px" }}>
						{saveSlots.map((slot) => (
							<div
								key={slot.id}
								onClick={() => setSelectedSlot(slot.id)}
								style={{
									border: `2px solid ${selectedSlot === slot.id ? "#4CAF50" : "#ddd"}`,
									borderRadius: "8px",
									padding: "12px",
									cursor: "pointer",
									backgroundColor:
										selectedSlot === slot.id ? "#f0f8f0" : "white",
									transition: "all 0.2s",
								}}
							>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
									}}
								>
									<div>
										<strong style={{ color: "#333" }}>{slot.name}</strong>
										{slot.timestamp > 0 && (
											<div
												style={{
													fontSize: "12px",
													color: "#666",
													marginTop: "4px",
												}}
											>
												Level {slot.level} • {slot.gold} gold •{" "}
												{formatTimestamp(slot.timestamp)}
											</div>
										)}
										{slot.timestamp > 0 && (
											<div
												style={{
													fontSize: "11px",
													color: "#888",
													marginTop: "2px",
												}}
											>
												{slot.mapMode === "procedural"
													? "Procedural Map"
													: `${slot.currentLayout} Layout`}
											</div>
										)}
									</div>
									{slot.timestamp > 0 && (
										<button
											onClick={(e) => {
												e.stopPropagation();
												setSelectedSlot(slot.id);
												handleDelete();
											}}
											style={{
												padding: "4px 8px",
												backgroundColor: "#f44336",
												color: "white",
												border: "none",
												borderRadius: "4px",
												cursor: "pointer",
												fontSize: "12px",
											}}
										>
											Delete
										</button>
									)}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Import/Export Section */}
				{showImportExport && (
					<div
						style={{
							marginBottom: "20px",
							padding: "15px",
							backgroundColor: "#f5f5f5",
							borderRadius: "8px",
						}}
					>
						<h3 style={{ margin: "0 0 10px 0", color: "#333" }}>
							Import/Export Save Data
						</h3>
						<div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
							<button
								onClick={handleExport}
								disabled={
									!selectedSlot ||
									saveSlots.find((s) => s.id === selectedSlot)?.timestamp === 0
								}
								style={{
									padding: "8px 16px",
									backgroundColor: selectedSlot ? "#4CAF50" : "#ccc",
									color: "white",
									border: "none",
									borderRadius: "4px",
									cursor: selectedSlot ? "pointer" : "not-allowed",
								}}
							>
								📤 Export Selected Slot
							</button>
						</div>
						<textarea
							value={importData}
							onChange={(e) => setImportData(e.target.value)}
							placeholder="Paste save data here to import..."
							style={{
								width: "100%",
								height: "100px",
								padding: "8px",
								border: "1px solid #ddd",
								borderRadius: "4px",
								fontSize: "12px",
								fontFamily: "monospace",
								resize: "vertical",
							}}
						/>
						<button
							onClick={handleImport}
							disabled={!selectedSlot || !importData.trim()}
							style={{
								marginTop: "10px",
								padding: "8px 16px",
								backgroundColor:
									selectedSlot && importData.trim() ? "#2196F3" : "#ccc",
								color: "white",
								border: "none",
								borderRadius: "4px",
								cursor:
									selectedSlot && importData.trim() ? "pointer" : "not-allowed",
							}}
						>
							📥 Import to Selected Slot
						</button>
					</div>
				)}

				{/* Action Buttons */}
				<div
					style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}
				>
					<button
						onClick={onClose}
						style={{
							padding: "10px 20px",
							backgroundColor: "#666",
							color: "white",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer",
						}}
					>
						Cancel
					</button>
					{mode === "save" && (
						<button
							onClick={handleSave}
							disabled={!selectedSlot}
							style={{
								padding: "10px 20px",
								backgroundColor: selectedSlot ? "#4CAF50" : "#ccc",
								color: "white",
								border: "none",
								borderRadius: "4px",
								cursor: selectedSlot ? "pointer" : "not-allowed",
							}}
						>
							💾 Save Game
						</button>
					)}
					{mode === "load" && (
						<button
							onClick={handleLoad}
							disabled={
								!selectedSlot ||
								saveSlots.find((s) => s.id === selectedSlot)?.timestamp === 0
							}
							style={{
								padding: "10px 20px",
								backgroundColor:
									selectedSlot &&
									saveSlots.find((s) => s.id === selectedSlot)?.timestamp !== 0
										? "#2196F3"
										: "#ccc",
								color: "white",
								border: "none",
								borderRadius: "4px",
								cursor:
									selectedSlot &&
									saveSlots.find((s) => s.id === selectedSlot)?.timestamp !== 0
										? "pointer"
										: "not-allowed",
							}}
						>
							📂 Load Game
						</button>
					)}
				</div>
			</div>
		</div>
	);
};
