export const COLORS = [
	"#7C3AED",
	"#0EA5A4",
	"#F97316",
	"#EC4899",
	"#3B82F6",
	"#22C55E",
	"#F59E0B",
];
export const DEFAULT_CANVAS_W = 1500;
export const DEFAULT_CANVAS_H = 900;
export const MIN_CANVAS_SIZE = 200;
export const MAX_CANVAS_SIZE = 4000;
export const FONT_FAMILIES = [
	"Inter",
	"Arial",
	"Helvetica",
	"Georgia",
	"Times New Roman",
	"Courier New",
	"Verdana",
];
export const FONT_WEIGHTS = [300, 400, 500, 600, 700, 800];
export const BORDER_STYLES: BorderStyleT[] = ["solid", "dashed", "dotted"];
export const TYPE_LABEL: Record<ElementType, string> = {
	rect: "Rectangle",
	circle: "Ellipse",
	text: "Text",
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export const btnGhost = {
	display: "flex",
	alignItems: "center",
	gap: 6,
	padding: "6px 10px",
	borderRadius: 8,
	border: "1px solid transparent",
	background: "transparent",
	fontSize: 13,
	color: "#374151",
	cursor: "pointer",
};
export const btnActive = {
	...btnGhost,
	background: "#f3f0ff",
	color: "#7C3AED",
	border: "1px solid #ddd6fe",
};

export const btnIcon: React.CSSProperties = {
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	width: 32,
	height: 32,
	borderRadius: 8,
	border: "1px solid #e5e7eb",
	background: "#fff",
	color: "#374151",
	cursor: "pointer",
};

export const makeStyle = (overrides?: Partial<ElementStyle>): ElementStyle => ({
	opacity: 100,
	rotation: 0,
	borderWidth: 0,
	borderColor: "#111827",
	borderStyle: "solid",
	borderRadius: 8,
	shadow: false,
	shadowColor: "#000000",
	shadowBlur: 12,
	shadowX: 0,
	shadowY: 4,
	...overrides,
});

export const makeTypography = (
	overrides?: Partial<Typography>,
): Typography => ({
	fontFamily: "Inter",
	fontWeight: 500,
	fontSize: 16,
	lineHeight: 1.4,
	letterSpacing: 0,
	textAlign: "left",
	...overrides,
});

export const nextName = (elements: CanvasElement[], type: ElementType) => {
	const n = elements.filter((e) => e.type === type).length + 1;
	return `${TYPE_LABEL[type]} ${n}`;
};

export const DEFAULT_PROJECT = (
	name?: string,
	canvasWidth?: number,
	canvasHeight?: number,
): Project => ({
	id: uid(),
	name: name || "Untitled project",
	createdAt: Date.now(),
	updatedAt: Date.now(),
	thumbnailColor: COLORS[Math.floor(Math.random() * COLORS.length)],
	canvasWidth: canvasWidth || DEFAULT_CANVAS_W,
	canvasHeight: canvasHeight || DEFAULT_CANVAS_H,
	elements: [],
	connections: [],
	comments: [],
	activity: [{ t: Date.now(), type: "created", detail: "Project created" }],
});

// Defensive migration so older saved projects always render correctly
export function normalizeElement(e: any): CanvasElement {
	const style = { ...makeStyle(), ...(e.style || {}) };
	if (e.type === "text") {
		return {
			...e,
			style,
			typography: { ...makeTypography(), ...(e.typography || {}) },
			name: e.name || "Text",
		};
	}
	return {
		...e,
		style,
		name: e.name || (e.type === "rect" ? "Rectangle" : "Ellipse"),
	};
}

export type TemplateId = "blank" | "marketing" | "onboarding" | "dashboard";

export const TEMPLATES: {
	id: TemplateId;
	label: string;
	description: string;
}[] = [
	{ id: "blank", label: "Blank", description: "Start from an empty canvas" },
	{
		id: "marketing",
		label: "Marketing landing page",
		description: "Hero panel, heading, and avatar",
	},
	{
		id: "onboarding",
		label: "Mobile app onboarding",
		description: "Phone frame with step content",
	},
	{
		id: "dashboard",
		label: "Analytics dashboard",
		description: "Metric cards and a chart placeholder",
	},
];

export function buildTemplateSeed(template: TemplateId): {
	elements: CanvasElement[];
	connections: Connection[];
	comments: CommentPin[];
} {
	const now = Date.now();

	if (template === "marketing") {
		const heroId = uid();
		const avatarId = uid();
		const textId = uid();
		return {
			elements: [
				{
					id: heroId,
					type: "rect",
					name: "Hero panel",
					label: "Hero panel",
					x: 60,
					y: 60,
					w: 320,
					h: 160,
					fill: "#7C3AED",
					style: makeStyle({ borderRadius: 14 }),
					createdAt: now,
					updatedAt: now,
				},
				{
					id: textId,
					type: "text",
					name: "Welcome heading",
					text: "Welcome to your product",
					x: 80,
					y: 100,
					w: 260,
					h: 60,
					fill: "#ffffff",
					typography: makeTypography({ fontSize: 22, fontWeight: 700 }),
					style: makeStyle(),
					createdAt: now,
					updatedAt: now,
				},
				{
					id: avatarId,
					type: "circle",
					name: "Avatar",
					label: "Avatar",
					x: 420,
					y: 260,
					w: 80,
					h: 80,
					fill: "#0EA5A4",
					style: makeStyle(),
					createdAt: now,
					updatedAt: now,
				},
			],
			connections: [{ id: uid(), from: heroId, to: avatarId, createdAt: now }],
			comments: [],
		};
	}

	if (template === "onboarding") {
		const frameId = uid();
		const titleId = uid();
		const dotId = uid();
		return {
			elements: [
				{
					id: frameId,
					type: "rect",
					name: "Phone frame",
					label: "Screen",
					x: 80,
					y: 60,
					w: 240,
					h: 460,
					fill: "#111827",
					style: makeStyle({ borderRadius: 28 }),
					createdAt: now,
					updatedAt: now,
				},
				{
					id: titleId,
					type: "text",
					name: "Step heading",
					text: "Step 1 of 3\nLet's get you set up",
					x: 110,
					y: 110,
					w: 180,
					h: 60,
					fill: "#ffffff",
					typography: makeTypography({ fontSize: 16, fontWeight: 600 }),
					style: makeStyle(),
					createdAt: now,
					updatedAt: now,
				},
				{
					id: dotId,
					type: "circle",
					name: "Progress dot",
					label: "",
					x: 190,
					y: 460,
					w: 20,
					h: 20,
					fill: "#7C3AED",
					style: makeStyle(),
					createdAt: now,
					updatedAt: now,
				},
			],
			connections: [],
			comments: [],
		};
	}

	if (template === "dashboard") {
		const cardA = uid();
		const cardB = uid();
		const chart = uid();
		const title = uid();
		return {
			elements: [
				{
					id: title,
					type: "text",
					name: "Dashboard title",
					text: "Q3 overview",
					x: 60,
					y: 24,
					w: 220,
					h: 28,
					fill: "#111827",
					typography: makeTypography({ fontSize: 18, fontWeight: 700 }),
					style: makeStyle(),
					createdAt: now,
					updatedAt: now,
				},
				{
					id: cardA,
					type: "rect",
					name: "Metric card",
					label: "Revenue",
					x: 60,
					y: 60,
					w: 200,
					h: 120,
					fill: "#3B82F6",
					style: makeStyle({ borderRadius: 12 }),
					createdAt: now,
					updatedAt: now,
				},
				{
					id: cardB,
					type: "rect",
					name: "Metric card",
					label: "Users",
					x: 280,
					y: 60,
					w: 200,
					h: 120,
					fill: "#22C55E",
					style: makeStyle({ borderRadius: 12 }),
					createdAt: now,
					updatedAt: now,
				},
				{
					id: chart,
					type: "rect",
					name: "Chart placeholder",
					label: "Trend",
					x: 60,
					y: 200,
					w: 420,
					h: 220,
					fill: "#F97316",
					style: makeStyle({ borderRadius: 12 }),
					createdAt: now,
					updatedAt: now,
				},
			],
			connections: [],
			comments: [],
		};
	}

	return { elements: [], connections: [], comments: [] }; // blank
}

export function normalizeProject(p: Project): Project {
	return {
		...p,
		// Backfills canvas size for projects saved before this feature existed
		canvasWidth:
			p.canvasWidth && p.canvasWidth > 0 ? p.canvasWidth : DEFAULT_CANVAS_W,
		canvasHeight:
			p.canvasHeight && p.canvasHeight > 0 ? p.canvasHeight : DEFAULT_CANVAS_H,
		connections: p.connections || [],
		comments: p.comments || [],
		elements: (p.elements || []).map(normalizeElement),
	};
}

export const labelStyle: React.CSSProperties = {
	fontSize: 11,
	color: "#9ca3af",
	display: "block",
	marginBottom: 4,
};
export const inputStyle: React.CSSProperties = {
	border: "1px solid #e5e7eb",
	borderRadius: 6,
	padding: "6px 8px",
	fontSize: 12,
	width: "100%",
	boxSizing: "border-box",
};
export const tabBtn = (active: boolean): React.CSSProperties => ({
	flex: 1,
	fontSize: 12,
	padding: "7px 0",
	borderRadius: 7,
	border: "none",
	cursor: "pointer",
	background: active ? "#f3f0ff" : "transparent",
	color: active ? "#7C3AED" : "#6b7280",
	fontWeight: active ? 600 : 400,
});
