import {
	btnGhost,
	DEFAULT_CANVAS_H,
	DEFAULT_CANVAS_W,
	inputStyle,
	labelStyle,
	MAX_CANVAS_SIZE,
	MIN_CANVAS_SIZE,
	TemplateId,
	TEMPLATES,
} from "@/utils/constans";
import {
	BarChart3,
	ChevronLeft,
	Clock,
	LayoutGrid,
	Plus,
	Trash2,
} from "lucide-react";
import { useState } from "react";

interface DashboardProps {
	projects: ProjectMeta[];
	onOpen: (id: string) => void;
	onNewProject: () => void;
	onDelete: (id: string) => void;
	onReports: (id: string) => void;
}

export function Dashboard({
	projects,
	onOpen,
	onNewProject,
	onDelete,
	onReports,
}: DashboardProps) {
	return (
		<div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 24,
				}}
			>
				<div>
					<h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
						Your projects
					</h1>
					<p style={{ color: "#6b7280", fontSize: 14, margin: "4px 0 0" }}>
						{projects.length} project{projects.length !== 1 ? "s" : ""}
					</p>
				</div>
				<button
					onClick={onNewProject}
					style={{
						display: "flex",
						alignItems: "center",
						gap: 6,
						background: "#7C3AED",
						color: "#fff",
						border: "none",
						padding: "10px 16px",
						borderRadius: 10,
						fontSize: 14,
						fontWeight: 500,
						cursor: "pointer",
					}}
				>
					<Plus size={16} /> New project
				</button>
			</div>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
					gap: 16,
				}}
			>
				{projects.map((p) => (
					<div
						key={p.id}
						style={{
							background: "#fff",
							borderRadius: 12,
							border: "1px solid #e5e7eb",
							overflow: "hidden",
							cursor: "pointer",
							transition: "box-shadow .15s",
						}}
						onClick={() => onOpen(p.id)}
					>
						<div
							style={{
								height: 110,
								background: `linear-gradient(135deg, ${p.thumbnailColor}22, ${p.thumbnailColor}55)`,
								display: `flex`,
								alignItems: `center`,
								justifyContent: `center`,
							}}
						>
							<LayoutGrid size={28} color={p.thumbnailColor} />
						</div>
						<div style={{ padding: "12px 14px" }}>
							<div
								style={{
									fontWeight: 500,
									fontSize: 14,
									marginBottom: 4,
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
								}}
							>
								{p.name}
							</div>
							<div
								style={{
									fontSize: 12,
									color: "#9ca3af",
									display: "flex",
									alignItems: "center",
									gap: 4,
								}}
							>
								<Clock size={11} /> {new Date(p.updatedAt).toLocaleDateString()}
							</div>
							<div style={{ display: "flex", gap: 6, marginTop: 10 }}>
								<button
									onClick={(e) => {
										e.stopPropagation();
										onReports(p.id);
									}}
									style={{
										...btnGhost,
										flex: 1,
										justifyContent: "center",
										border: "1px solid #e5e7eb",
										fontSize: 12,
									}}
								>
									<BarChart3 size={12} /> Reports
								</button>
								<button
									onClick={(e) => {
										e.stopPropagation();
										if (confirm(`Delete ${p.name}?`)) onDelete(p.id);
									}}
									style={{
										...btnGhost,
										border: `1px solid #e5e7eb`,
										color: `#ef4444`,
									}}
								>
									<Trash2 size={12} />
								</button>
							</div>
						</div>
					</div>
				))}
				<div
					onClick={onNewProject}
					style={{
						border: "2px dashed #d1d5db",
						borderRadius: 12,
						minHeight: 178,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						color: "#9ca3af",
						cursor: "pointer",
						gap: 6,
					}}
				>
					<Plus size={22} />
					<span style={{ fontSize: 13 }}>New project</span>
				</div>
			</div>
		</div>
	);
}

const CANVAS_PRESETS: { label: string; w: number; h: number }[] = [
	{ label: "Desktop (1500×900)", w: 1500, h: 900 },
	{ label: "Mobile (375×812)", w: 375, h: 812 },
	{ label: "Square (1080×1080)", w: 1080, h: 1080 },
	{ label: "Widescreen (1920×1080)", w: 1920, h: 1080 },
];

interface CreateProjectProps {
	onCancel: () => void;
	onSubmit: (
		name: string,
		template: TemplateId,
		canvasWidth: number,
		canvasHeight: number,
	) => Promise<void>;
}

export function CreateProject({ onCancel, onSubmit }: CreateProjectProps) {
	const [name, setName] = useState("");
	const [template, setTemplate] = useState<TemplateId>("blank");
	const [width, setWidth] = useState(DEFAULT_CANVAS_W);
	const [height, setHeight] = useState(DEFAULT_CANVAS_H);
	const [submitting, setSubmitting] = useState(false);

	const clamp = (n: number) =>
		Math.min(
			MAX_CANVAS_SIZE,
			Math.max(MIN_CANVAS_SIZE, Math.round(n) || DEFAULT_CANVAS_W),
		);

	const handleSubmit = async () => {
		if (submitting) return;
		setSubmitting(true);
		try {
			await onSubmit(name.trim(), template, clamp(width), clamp(height));
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
			<button onClick={onCancel} style={{ ...btnGhost, marginBottom: 16 }}>
				<ChevronLeft size={16} /> Back to projects
			</button>
			<h1 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 4px" }}>
				Create a new project
			</h1>
			<p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 28px" }}>
				Pick a name, a starting template, and a canvas size.
			</p>

			<div style={{ marginBottom: 24 }}>
				<label style={{ ...labelStyle, fontSize: 13, marginBottom: 6 }}>
					Project name
				</label>
				<input
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Untitled project"
					style={{ ...inputStyle, fontSize: 14, padding: "10px 12px" }}
					autoFocus
				/>
			</div>

			<div style={{ marginBottom: 24 }}>
				<label style={{ ...labelStyle, fontSize: 13, marginBottom: 8 }}>
					Template
				</label>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(2, 1fr)",
						gap: 10,
					}}
				>
					{TEMPLATES.map((t) => (
						<div
							key={t.id}
							onClick={() => setTemplate(t.id)}
							style={{
								border:
									template === t.id ? "2px solid #7C3AED" : "1px solid #e5e7eb",
								background: template === t.id ? "#f3f0ff" : "#fff",
								borderRadius: 10,
								padding: 14,
								cursor: "pointer",
							}}
						>
							<div
								style={{
									fontWeight: 600,
									fontSize: 13,
									marginBottom: 4,
									color: template === t.id ? "#7C3AED" : "#111827",
								}}
							>
								{t.label}
							</div>
							<div style={{ fontSize: 12, color: "#6b7280" }}>
								{t.description}
							</div>
						</div>
					))}
				</div>
			</div>

			<div style={{ marginBottom: 28 }}>
				<label style={{ ...labelStyle, fontSize: 13, marginBottom: 8 }}>
					Canvas size
				</label>
				<div
					style={{
						display: "flex",
						gap: 8,
						flexWrap: "wrap",
						marginBottom: 10,
					}}
				>
					{CANVAS_PRESETS.map((preset) => (
						<button
							key={preset.label}
							onClick={() => {
								setWidth(preset.w);
								setHeight(preset.h);
							}}
							style={{
								...btnGhost,
								border:
									width === preset.w && height === preset.h
										? "1px solid #7C3AED"
										: "1px solid #e5e7eb",
								color:
									width === preset.w && height === preset.h
										? "#7C3AED"
										: "#374151",
								fontSize: 12,
							}}
						>
							{preset.label}
						</button>
					))}
				</div>
				<div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
					<div>
						<label style={labelStyle}>Width (px)</label>
						<input
							type="number"
							min={MIN_CANVAS_SIZE}
							max={MAX_CANVAS_SIZE}
							value={width}
							onChange={(e) => setWidth(Number(e.target.value))}
							style={{ ...inputStyle, width: 110 }}
						/>
					</div>
					<span style={{ color: "#9ca3af", marginBottom: 8 }}>×</span>
					<div>
						<label style={labelStyle}>Height (px)</label>
						<input
							type="number"
							min={MIN_CANVAS_SIZE}
							max={MAX_CANVAS_SIZE}
							value={height}
							onChange={(e) => setHeight(Number(e.target.value))}
							style={{ ...inputStyle, width: 110 }}
						/>
					</div>
				</div>
			</div>

			<div style={{ display: "flex", gap: 10 }}>
				<button
					onClick={onCancel}
					style={{
						...btnGhost,
						border: "1px solid #e5e7eb",
						padding: "10px 16px",
					}}
				>
					Cancel
				</button>
				<button
					onClick={handleSubmit}
					disabled={submitting}
					style={{
						display: "flex",
						alignItems: "center",
						gap: 6,
						background: "#7C3AED",
						color: "#fff",
						border: "none",
						padding: "10px 18px",
						borderRadius: 10,
						fontSize: 14,
						fontWeight: 500,
						cursor: submitting ? "not-allowed" : "pointer",
						opacity: submitting ? 0.7 : 1,
					}}
				>
					<Plus size={16} /> {submitting ? "Creating…" : "Create project"}
				</button>
			</div>
		</div>
	);
}
