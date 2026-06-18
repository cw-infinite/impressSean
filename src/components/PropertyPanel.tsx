import {
	BORDER_STYLES,
	btnGhost,
	btnIcon,
	COLORS,
	FONT_FAMILIES,
	FONT_WEIGHTS,
	inputStyle,
	labelStyle,
	tabBtn,
	TYPE_LABEL,
} from "@/utils/constans";
import {
	AlignCenter,
	AlignLeft,
	AlignRight,
	Copy,
	Link2,
	Trash2,
} from "lucide-react";

export function SwatchRow({
	value,
	onChange,
}: {
	value: string;
	onChange: (c: string) => void;
}) {
	return (
		<div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
			{COLORS.map((c) => (
				<div
					key={c}
					onClick={() => onChange(c)}
					style={{
						width: 20,
						height: 20,
						borderRadius: 6,
						background: c,
						cursor: "pointer",
						border: value === c ? "2px solid #111827" : "1px solid #e5e7eb",
					}}
				/>
			))}
		</div>
	);
}

export function SelectedElementPanel({
	el,
	propTab,
	setPropTab,
	connectionsCount,
	onNameChange,
	onContentChange,
	onStyleChange,
	onTypographyChange,
	onDuplicate,
	onDelete,
}: {
	el: CanvasElement;
	propTab: "design" | "typography" | "info";
	setPropTab: (t: "design" | "typography" | "info") => void;
	connectionsCount: number;
	onNameChange: (name: string) => void;
	onContentChange: (patch: Partial<CanvasElement>) => void;
	onStyleChange: (patch: Partial<ElementStyle>) => void;
	onTypographyChange: (patch: Partial<Typography>) => void;
	onDuplicate: () => void;
	onDelete: () => void;
}) {
	return (
		<div>
			<div style={{ marginBottom: 10 }}>
				<label style={labelStyle}>Layer name</label>
				<input
					value={el.name}
					onChange={(e) => onNameChange(e.target.value)}
					style={inputStyle}
				/>
			</div>

			{el.type === "text" ? (
				<div style={{ marginBottom: 10 }}>
					<label style={labelStyle}>Text content</label>
					<input
						value={el.text}
						onChange={(e) =>
							onContentChange({
								text: e.target.value,
							} as Partial<CanvasElement>)
						}
						style={inputStyle}
					/>
				</div>
			) : (
				<div style={{ marginBottom: 10 }}>
					<label style={labelStyle}>Content label</label>
					<input
						value={el.label}
						onChange={(e) =>
							onContentChange({
								label: e.target.value,
							} as Partial<CanvasElement>)
						}
						style={inputStyle}
					/>
				</div>
			)}

			<div
				style={{
					display: "flex",
					gap: 4,
					background: "#f7f7f8",
					borderRadius: 9,
					padding: 3,
					marginBottom: 14,
				}}
			>
				<button
					onClick={() => setPropTab("design")}
					style={tabBtn(propTab === "design")}
				>
					Design
				</button>
				{el.type === "text" && (
					<button
						onClick={() => setPropTab("typography")}
						style={tabBtn(propTab === "typography")}
					>
						Type
					</button>
				)}
				<button
					onClick={() => setPropTab("info")}
					style={tabBtn(propTab === "info")}
				>
					Info
				</button>
			</div>

			{propTab === "design" && (
				<div>
					<div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
						<div>
							<label style={labelStyle}>X</label>
							<input
								type="number"
								value={Math.round(el.x)}
								onChange={(e) =>
									onContentChange({
										x: Number(e.target.value),
									} as Partial<CanvasElement>)
								}
								style={{ ...inputStyle, width: 90 }}
							/>
						</div>
						<div>
							<label style={labelStyle}>Y</label>
							<input
								type="number"
								value={Math.round(el.y)}
								onChange={(e) =>
									onContentChange({
										y: Number(e.target.value),
									} as Partial<CanvasElement>)
								}
								style={{ ...inputStyle, width: 90 }}
							/>
						</div>
					</div>
					<div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
						<div>
							<label style={labelStyle}>Width</label>
							<input
								type="number"
								value={Math.round(el.w)}
								onChange={(e) =>
									onContentChange({
										w: Number(e.target.value),
									} as Partial<CanvasElement>)
								}
								style={{ ...inputStyle, width: 90 }}
							/>
						</div>
						<div>
							<label style={labelStyle}>Height</label>
							<input
								type="number"
								value={Math.round(el.h)}
								onChange={(e) =>
									onContentChange({
										h: Number(e.target.value),
									} as Partial<CanvasElement>)
								}
								style={{ ...inputStyle, width: 90 }}
							/>
						</div>
					</div>

					<div style={{ marginBottom: 10 }}>
						<label style={labelStyle}>Fill color</label>
						<SwatchRow
							value={el.fill}
							onChange={(c) =>
								onContentChange({ fill: c } as Partial<CanvasElement>)
							}
						/>
						<input
							value={el.fill}
							onChange={(e) =>
								onContentChange({
									fill: e.target.value,
								} as Partial<CanvasElement>)
							}
							style={inputStyle}
						/>
					</div>

					<div style={{ marginBottom: 10 }}>
						<label style={labelStyle}>Opacity: {el.style.opacity}%</label>
						<input
							type="range"
							min={0}
							max={100}
							value={el.style.opacity}
							onChange={(e) =>
								onStyleChange({ opacity: Number(e.target.value) })
							}
							style={{ width: "100%" }}
						/>
					</div>

					<div style={{ marginBottom: 10 }}>
						<label style={labelStyle}>Rotation: {el.style.rotation}°</label>
						<input
							type="range"
							min={-180}
							max={180}
							value={el.style.rotation}
							onChange={(e) =>
								onStyleChange({ rotation: Number(e.target.value) })
							}
							style={{ width: "100%" }}
						/>
					</div>

					{el.type === "rect" && (
						<div style={{ marginBottom: 10 }}>
							<label style={labelStyle}>
								Corner radius: {el.style.borderRadius}px
							</label>
							<input
								type="range"
								min={0}
								max={60}
								value={el.style.borderRadius}
								onChange={(e) =>
									onStyleChange({ borderRadius: Number(e.target.value) })
								}
								style={{ width: "100%" }}
							/>
						</div>
					)}

					<div style={{ marginBottom: 10 }}>
						<label style={labelStyle}>Border</label>
						<div style={{ display: "flex", gap: 6 }}>
							<input
								type="number"
								min={0}
								value={el.style.borderWidth}
								onChange={(e) =>
									onStyleChange({ borderWidth: Number(e.target.value) })
								}
								style={{ ...inputStyle, width: 56 }}
								title="Width"
							/>
							<select
								value={el.style.borderStyle}
								onChange={(e) =>
									onStyleChange({ borderStyle: e.target.value as BorderStyleT })
								}
								style={{ ...inputStyle, width: 90 }}
							>
								{BORDER_STYLES.map((s) => (
									<option key={s} value={s}>
										{s}
									</option>
								))}
							</select>
							<input
								type="color"
								value={el.style.borderColor}
								onChange={(e) => onStyleChange({ borderColor: e.target.value })}
								style={{
									width: 36,
									height: 30,
									border: "1px solid #e5e7eb",
									borderRadius: 6,
									padding: 0,
								}}
							/>
						</div>
					</div>

					<div style={{ marginBottom: 10 }}>
						<label
							style={{
								...labelStyle,
								display: "flex",
								alignItems: "center",
								gap: 6,
							}}
						>
							<input
								type="checkbox"
								checked={el.style.shadow}
								onChange={(e) => onStyleChange({ shadow: e.target.checked })}
							/>{" "}
							Drop shadow
						</label>
						{el.style.shadow && (
							<div style={{ display: "flex", gap: 6, marginTop: 6 }}>
								<input
									type="number"
									value={el.style.shadowX}
									onChange={(e) =>
										onStyleChange({ shadowX: Number(e.target.value) })
									}
									title="Offset X"
									style={{ ...inputStyle, width: 50 }}
								/>
								<input
									type="number"
									value={el.style.shadowY}
									onChange={(e) =>
										onStyleChange({ shadowY: Number(e.target.value) })
									}
									title="Offset Y"
									style={{ ...inputStyle, width: 50 }}
								/>
								<input
									type="number"
									min={0}
									value={el.style.shadowBlur}
									onChange={(e) =>
										onStyleChange({ shadowBlur: Number(e.target.value) })
									}
									title="Blur"
									style={{ ...inputStyle, width: 50 }}
								/>
								<input
									type="color"
									value={el.style.shadowColor}
									onChange={(e) =>
										onStyleChange({ shadowColor: e.target.value })
									}
									style={{
										width: 36,
										height: 30,
										border: "1px solid #e5e7eb",
										borderRadius: 6,
										padding: 0,
									}}
								/>
							</div>
						)}
					</div>

					<div style={{ display: "flex", gap: 6, marginTop: 14 }}>
						<button
							onClick={onDuplicate}
							style={{
								...btnGhost,
								flex: 1,
								justifyContent: "center",
								border: "1px solid #e5e7eb",
							}}
						>
							<Copy size={13} /> Duplicate
						</button>
						<button
							onClick={onDelete}
							style={{
								...btnGhost,
								flex: 1,
								justifyContent: "center",
								border: "1px solid #e5e7eb",
								color: "#ef4444",
							}}
						>
							<Trash2 size={13} /> Delete
						</button>
					</div>
				</div>
			)}

			{propTab === "typography" && el.type === "text" && (
				<div>
					<div style={{ marginBottom: 10 }}>
						<label style={labelStyle}>Font family</label>
						<select
							value={el.typography.fontFamily}
							onChange={(e) =>
								onTypographyChange({ fontFamily: e.target.value })
							}
							style={inputStyle}
						>
							{FONT_FAMILIES.map((f) => (
								<option key={f} value={f}>
									{f}
								</option>
							))}
						</select>
					</div>
					<div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
						<div>
							<label style={labelStyle}>Size</label>
							<input
								type="number"
								value={el.typography.fontSize}
								onChange={(e) =>
									onTypographyChange({ fontSize: Number(e.target.value) })
								}
								style={{ ...inputStyle, width: 90 }}
							/>
						</div>
						<div>
							<label style={labelStyle}>Weight</label>
							<select
								value={el.typography.fontWeight}
								onChange={(e) =>
									onTypographyChange({ fontWeight: Number(e.target.value) })
								}
								style={{ ...inputStyle, width: 90 }}
							>
								{FONT_WEIGHTS.map((w) => (
									<option key={w} value={w}>
										{w}
									</option>
								))}
							</select>
						</div>
					</div>
					<div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
						<div>
							<label style={labelStyle}>Line height</label>
							<input
								type="number"
								step={0.1}
								value={el.typography.lineHeight}
								onChange={(e) =>
									onTypographyChange({ lineHeight: Number(e.target.value) })
								}
								style={{ ...inputStyle, width: 90 }}
							/>
						</div>
						<div>
							<label style={labelStyle}>Letter spacing</label>
							<input
								type="number"
								step={0.5}
								value={el.typography.letterSpacing}
								onChange={(e) =>
									onTypographyChange({ letterSpacing: Number(e.target.value) })
								}
								style={{ ...inputStyle, width: 90 }}
							/>
						</div>
					</div>
					<div style={{ marginBottom: 10 }}>
						<label style={labelStyle}>Text align</label>
						<div style={{ display: "flex", gap: 4 }}>
							<button
								onClick={() => onTypographyChange({ textAlign: "left" })}
								style={{
									...btnIcon,
									background:
										el.typography.textAlign === "left" ? "#f3f0ff" : "#fff",
									color:
										el.typography.textAlign === "left" ? "#7C3AED" : "#374151",
								}}
							>
								<AlignLeft size={14} />
							</button>
							<button
								onClick={() => onTypographyChange({ textAlign: "center" })}
								style={{
									...btnIcon,
									background:
										el.typography.textAlign === "center" ? "#f3f0ff" : "#fff",
									color:
										el.typography.textAlign === "center"
											? "#7C3AED"
											: "#374151",
								}}
							>
								<AlignCenter size={14} />
							</button>
							<button
								onClick={() => onTypographyChange({ textAlign: "right" })}
								style={{
									...btnIcon,
									background:
										el.typography.textAlign === "right" ? "#f3f0ff" : "#fff",
									color:
										el.typography.textAlign === "right" ? "#7C3AED" : "#374151",
								}}
							>
								<AlignRight size={14} />
							</button>
						</div>
					</div>
					<div style={{ marginBottom: 10 }}>
						<label style={labelStyle}>Text color</label>
						<SwatchRow
							value={el.fill}
							onChange={(c) =>
								onContentChange({ fill: c } as Partial<CanvasElement>)
							}
						/>
					</div>
				</div>
			)}

			{propTab === "info" && (
				<>
					<div
						style={{
							fontSize: 12,
							color: "#4b5563",
							lineHeight: 1.7,
							marginBottom: 10,
						}}
					>
						<InfoRow label="ID" value={el.id} />
						<InfoRow label="Type" value={TYPE_LABEL[el.type]} />
						<InfoRow
							label="Position"
							value={"${Math.round(el.x)}, ${Math.round(el.y)}"}
						/>
						<InfoRow
							label="Size"
							value={"${Math.round(el.w)} × ${Math.round(el.h)}"}
						/>
						<InfoRow label="Opacity" value={"${el.style.opacity}%"} />
						<InfoRow label="Rotation" value={"${el.style.rotation}°"} />
						<InfoRow label="Connectors" value={String(connectionsCount)} />
						<InfoRow
							label="Created"
							value={new Date(el.createdAt).toLocaleString()}
						/>
						<InfoRow
							label="Updated"
							value={new Date(el.updatedAt).toLocaleString()}
						/>
					</div>
					<Section title="CSS">
						<pre
							style={{
								background: "#f9fafb",
								padding: 8,
								borderRadius: 6,
								fontSize: 10,
								overflow: "auto",
								margin: 0,
								border: "1px solid #f3f4f6",
							}}
						>
							{generateCSS(el)}
						</pre>
					</Section>
				</>
			)}
		</div>
	);
}

export function generateCSS(el: CanvasElement) {
	// const element = el as RectElement;
	const base = `position: absolute;
left: ${el.x}px;
top: ${el.y}px;
width: ${el.w}px;
height: ${el.h}px;
opacity: ${el.opacity};
transform: rotate(${el.rotation}deg);
background: ${el.fill};`;
	if (el.type === "text") {
		const t = el as TextElement;
		return (
			base +
			`
font-family: '${t.fontFamily}', sans-serif;
font-size: ${t.fontSize}px;
font-weight: ${t.fontWeight};
line-height: ${t.lineHeight};
letter-spacing: ${t.letterSpacing}px;
text-align: ${t.textAlign};
color: ${el.fill};`
		);
	}
	const r = el as RectElement;
	return (
		base +
		`
border: ${el.strokeWidth}px solid ${el.stroke};
border-radius: ${r.borderRadius || 0}px;`
	);
}

export function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div
			style={{
				display: "flex",
				justifyContent: "space-between",
				gap: 8,
				padding: "4px 0",
				borderBottom: "1px solid #f3f4f6",
			}}
		>
			<span style={{ color: "#9ca3af" }}>{label}</span>
			<span
				style={{
					textAlign: "right",
					overflow: "hidden",
					textOverflow: "ellipsis",
					maxWidth: 140,
				}}
			>
				{value}
			</span>
		</div>
	);
}

export function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div style={{ marginBottom: 16 }}>
			<div
				style={{
					fontSize: 11,
					fontWeight: 600,
					color: "#374151",
					marginBottom: 8,
					textTransform: "uppercase",
					letterSpacing: 0.5,
				}}
			>
				{title}
			</div>
			{children}
		</div>
	);
}

export function ConnectionPanel({
	connection,
	fromName,
	toName,
	onDelete,
}: {
	connection: Connection;
	fromName: string;
	toName: string;
	onDelete: () => void;
}) {
	return (
		<div>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 6,
					fontSize: 13,
					fontWeight: 500,
					marginBottom: 12,
					color: "#374151",
				}}
			>
				<Link2 size={14} /> Connector
			</div>
			<div style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.7 }}>
				<InfoRow label="From" value={fromName} />
				<InfoRow label="To" value={toName} />
				<InfoRow
					label="Created"
					value={new Date(connection.createdAt).toLocaleString()}
				/>
			</div>
			<button
				onClick={onDelete}
				style={{
					...btnGhost,
					width: "100%",
					justifyContent: "center",
					border: "1px solid #e5e7eb",
					color: "#ef4444",
					marginTop: 14,
				}}
			>
				<Trash2 size={13} /> Remove connector
			</button>
		</div>
	);
}
