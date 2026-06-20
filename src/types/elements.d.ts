type ElementType = "rect" | "circle" | "text";
type BorderStyleT = "solid" | "dashed" | "dotted";
type TextAlignT = "left" | "center" | "right";

interface ElementStyle {
	opacity: number;
	rotation: number;
	borderWidth: number;
	borderColor: string;
	borderStyle: BorderStyleT;
	borderRadius: number;
	shadow: boolean;
	shadowColor: string;
	shadowBlur: number;
	shadowX: number;
	shadowY: number;
}

interface Typography {
	fontFamily: string;
	fontWeight: number;
	fontSize: number;
	lineHeight: number;
	letterSpacing: number;
	textAlign: TextAlignT;
}

interface BaseElement {
	id: string;
	type: ElementType;
	name: string;
	x: number;
	y: number;
	w: number;
	h: number;
	fill: string;
	style: ElementStyle;
	createdAt: number;
	updatedAt: number;
}

interface RectElement extends BaseElement {
	type: "rect";
	label: string;
}

interface CircleElement extends BaseElement {
	type: "circle";
	label: string;
}

interface TextElement extends BaseElement {
	type: "text";
	text: string;
	typography: Typography;
}

type CanvasElement = RectElement | CircleElement | TextElement;

interface Connection {
	id: string;
	from: string;
	to: string;
	createdAt: number;
}

interface CommentPin {
	id: string;
	x: number;
	y: number;
	text: string;
	createdAt: number;
}

interface Activity {
	t: number;
	type:
		| "created"
		| "add"
		| "delete"
		| "updated"
		| "connect"
		| "disconnect"
		| "comment"
		| "comment_delete"
		| "duplicate"
		| "move"
		| "resize";
	detail: string;
}

interface Project {
	id: string;
	name: string;
	createdAt: number;
	updatedAt: number;
	thumbnailColor: string;
	canvasWidth: number;
	canvasHeight: number;
	elements: CanvasElement[];
	connections: Connection[];
	comments: CommentPin[];
	activity: Activity[];
}

type ProjectMeta = Pick<
	Project,
	"id" | "name" | "createdAt" | "updatedAt" | "thumbnailColor"
>;

type View = "dashboard" | "create" | "editor" | "reports";
type SaveStatus = "idle" | "saving" | "saved";
type Tool =
	| "select"
	| "hand"
	| "comment"
	| "connect"
	| "rect"
	| "circle"
	| "text";
