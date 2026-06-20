import {
	btnIcon,
	COLORS,
	DEFAULT_CANVAS_H,
	DEFAULT_CANVAS_W,
	inputStyle,
	labelStyle,
	makeStyle,
	makeTypography,
	MAX_CANVAS_SIZE,
	MIN_CANVAS_SIZE,
	nextName,
	uid,
} from "@/utils/constans";
import {
	CircleIcon,
	Copy,
	Hand,
	Layers,
	Link2,
	MessageCircle,
	MousePointer2,
	Redo2,
	Save,
	SlidersHorizontal,
	Square,
	Type,
	Undo2,
	Unlink,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ElementView } from "./ElementView";
import { CommentPinView, DraftCommentBubble } from "./Comment";
import { ConnectionPanel, SelectedElementPanel } from "./PropertyPanel";

const TOOLS: { id: Tool; icon: any; label: string; shortcut: string }[] = [
	{ id: "select", icon: MousePointer2, label: "Move", shortcut: "V" },
	{ id: "hand", icon: Hand, label: "Hand tool", shortcut: "H" },
	{ id: "comment", icon: MessageCircle, label: "Comment", shortcut: "C" },
];

const SHAPE_TOOLS: { id: Tool; icon: any; label: string; shortcut: string }[] =
	[
		{ id: "rect", icon: Square, label: "Rectangle", shortcut: "R" },
		{ id: "circle", icon: CircleIcon, label: "Ellipse", shortcut: "O" },
		{ id: "text", icon: Type, label: "Text", shortcut: "T" },
		{ id: "connect", icon: Link2, label: "Connector", shortcut: "L" },
	];

export const MAX_HISTORY = 50;

interface HistoryState {
	past: Project[];
	future: Project[];
}

interface EditorProps {
	project: Project;
	setProject: React.Dispatch<React.SetStateAction<Project | null>>;
	onSave: (p: Project) => void;
	saveStatus: SaveStatus;
}

export function Editor({
	project,
	setProject,
	onSave,
	saveStatus,
}: EditorProps) {
	const [tool, setTool] = useState<Tool>("select");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [selectedConnectionId, setSelectedConnectionId] = useState<
		string | null
	>(null);
	const [dragState, setDragState] = useState<{
		id: string;
		startX: number;
		startY: number;
		origX: number;
		origY: number;
	} | null>(null);
	const [resizeState, setResizeState] = useState<{
		id: string;
		startX: number;
		startY: number;
		origW: number;
		origH: number;
	} | null>(null);
	const [connectFrom, setConnectFrom] = useState<string | null>(null);
	const [draftComment, setDraftComment] = useState<{
		id: string;
		x: number;
		y: number;
		text: string;
	} | null>(null);
	const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
	const [zoom, setZoom] = useState(1);
	const [propTab, setPropTab] = useState<"design" | "typography" | "info">(
		"design",
	);
	const [history, setHistory] = useState<HistoryState>({
		past: [],
		future: [],
	});

	const canvasRef = useRef<HTMLDivElement>(null);
	const viewportRef = useRef<HTMLDivElement>(null);
	const [nameEdit, setNameEdit] = useState(project.name);
	const dirtyRef = useRef(false);
	const preInteractionRef = useRef<Project | null>(null);
	const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const canvasWidth = project.canvasWidth || DEFAULT_CANVAS_W;
	const canvasHeight = project.canvasHeight || DEFAULT_CANVAS_H;

	useEffect(() => {
		setNameEdit(project.name);
	}, [project.id]);

	// Autosave shortly after any change, so data always persists even without clicking Save
	useEffect(() => {
		if (!dirtyRef.current) return;
		if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
		autosaveTimer.current = setTimeout(() => {
			onSave(project);
			dirtyRef.current = false;
		}, 1200);
		return () => {
			if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
		};
	}, [project, onSave]);

	const logActivity = useCallback(
		(proj: Project, type: Activity["type"], detail: string): Project => ({
			...proj,
			activity: [
				...(proj.activity || []),
				{ t: Date.now(), type, detail },
			].slice(-100),
		}),
		[],
	);

	// Live updates (e.g. during drag) skip history so we don't flood undo with micro-steps
	const applyLive = useCallback(
		(mutator: (p: Project) => Project) => {
			setProject((prev) => (prev ? mutator(prev) : prev));
			dirtyRef.current = true;
		},
		[setProject],
	);

	const beginInteraction = useCallback(() => {
		preInteractionRef.current = JSON.parse(JSON.stringify(project));
	}, [project]);

	const endInteraction = useCallback(() => {
		if (preInteractionRef.current) {
			const snap = preInteractionRef.current;
			setHistory((h) => ({
				past: [...h.past, snap].slice(-MAX_HISTORY),
				future: [],
			}));
			preInteractionRef.current = null;
		}
	}, []);

	// Committed updates: snapshot before + after, pushed onto undo stack
	const commit = useCallback(
		(
			mutator: (p: Project) => Project,
			activityType?: Activity["type"],
			detail?: string,
		) => {
			setProject((prev) => {
				if (!prev) return prev;
				const snap = JSON.parse(JSON.stringify(prev));
				setHistory((h) => ({
					past: [...h.past, snap].slice(-MAX_HISTORY),
					future: [],
				}));
				let next = mutator(prev);
				if (activityType) next = logActivity(next, activityType, detail || "");
				return next;
			});
			dirtyRef.current = true;
		},
		[setProject, logActivity],
	);

	const undo = useCallback(() => {
		setHistory((h) => {
			if (h.past.length === 0) return h;
			const prevSnap = h.past[h.past.length - 1];
			setProject((curr) => {
				if (curr) {
					// push current onto future before reverting
					setHistory2Future(curr);
				}
				return prevSnap;
			});
			return { past: h.past.slice(0, -1), future: h.future };
		});
		function setHistory2Future(curr: Project) {
			setHistory((h2) => ({
				past: h2.past,
				future: [curr, ...h2.future].slice(0, MAX_HISTORY),
			}));
		}
		dirtyRef.current = true;
	}, [setProject]);

	const redo = useCallback(() => {
		setHistory((h) => {
			if (h.future.length === 0) return h;
			const nextSnap = h.future[0];
			setProject((curr) => {
				if (curr) {
					setHistory2Past(curr);
				}
				return nextSnap;
			});
			return { past: h.past, future: h.future.slice(1) };
		});
		function setHistory2Past(curr: Project) {
			setHistory((h2) => ({
				past: [...h2.past, curr].slice(-MAX_HISTORY),
				future: h2.future,
			}));
		}
		dirtyRef.current = true;
	}, [setProject]);

	const addElement = useCallback(
		(type: ElementType, x: number, y: number) => {
			commit(
				(p) => {
					const base = {
						id: uid(),
						type,
						name: nextName(p.elements, type),
						x,
						y,
						w: type === "text" ? 140 : 120,
						h: type === "text" ? 28 : 90,
						fill:
							type === "text"
								? "#111827"
								: COLORS[Math.floor(Math.random() * COLORS.length)],
						style: makeStyle({ borderRadius: type === "circle" ? 9999 : 8 }),
						createdAt: Date.now(),
						updatedAt: Date.now(),
					} as any;
					if (type === "text") {
						base.text = "Text label";
						base.typography = makeTypography();
					}
					if (type === "rect") base.label = "Frame";
					if (type === "circle") base.label = "Shape";
					setSelectedId(base.id);
					setSelectedConnectionId(null);
					setPropTab("design");
					return { ...p, elements: [...p.elements, base] };
				},
				"add",
				"Added ${TYPE_LABEL[type]} layer",
			);
		},
		[commit],
	);

	const duplicateSelected = useCallback(() => {
		if (!selectedId) return;
		commit(
			(p) => {
				const src = p.elements.find((e) => e.id === selectedId);
				if (!src) return p;
				const copy = {
					...src,
					id: uid(),
					name: src.name + " copy",
					x: src.x + 24,
					y: src.y + 24,
					createdAt: Date.now(),
					updatedAt: Date.now(),
				};
				setSelectedId(copy.id);
				return { ...p, elements: [...p.elements, copy] };
			},
			"duplicate",
			"Duplicated layer",
		);
	}, [commit, selectedId]);

	const deleteSelected = useCallback(() => {
		if (selectedId) {
			commit(
				(p) => ({
					...p,
					elements: p.elements.filter((e) => e.id !== selectedId),
					connections: p.connections.filter(
						(c) => c.from !== selectedId && c.to !== selectedId,
					),
				}),
				"delete",
				"Deleted layer",
			);
			setSelectedId(null);
		} else if (selectedConnectionId) {
			commit(
				(p) => ({
					...p,
					connections: p.connections.filter(
						(c) => c.id !== selectedConnectionId,
					),
				}),
				"disconnect",
				"Removed connector",
			);
			setSelectedConnectionId(null);
		}
	}, [commit, selectedId, selectedConnectionId]);

	const addConnection = useCallback(
		(fromId: string, toId: string) => {
			if (fromId === toId) return;
			commit(
				(p) => {
					const exists = p.connections.some(
						(c) =>
							(c.from === fromId && c.to === toId) ||
							(c.from === toId && c.to === fromId),
					);
					if (exists) return p;
					return {
						...p,
						connections: [
							...p.connections,
							{ id: uid(), from: fromId, to: toId, createdAt: Date.now() },
						],
					};
				},
				"connect",
				"Connected two layers",
			);
		},
		[commit],
	);

	const removeConnection = useCallback(
		(connId: string) => {
			commit(
				(p) => ({
					...p,
					connections: p.connections.filter((c) => c.id !== connId),
				}),
				"disconnect",
				"Removed connector",
			);
			setSelectedConnectionId(null);
		},
		[commit],
	);

	const updateCanvasSize = useCallback(
		(patch: Partial<Pick<Project, "canvasWidth" | "canvasHeight">>) => {
			commit(
				(p) => ({
					...p,
					canvasWidth:
						patch.canvasWidth !== undefined
							? Math.min(
									MAX_CANVAS_SIZE,
									Math.max(MIN_CANVAS_SIZE, patch.canvasWidth),
								)
							: p.canvasWidth,
					canvasHeight:
						patch.canvasHeight !== undefined
							? Math.min(
									MAX_CANVAS_SIZE,
									Math.max(MIN_CANVAS_SIZE, patch.canvasHeight),
								)
							: p.canvasHeight,
				}),
				"updated",
				"Resized canvas",
			);
		},
		[commit],
	);

	const commitComment = useCallback(
		(id: string, x: number, y: number, text: string) => {
			if (!text.trim()) return;
			commit(
				(p) => ({
					...p,
					comments: [
						...p.comments,
						{ id, x, y, text: text.trim(), createdAt: Date.now() },
					],
				}),
				"comment",
				"Added comment",
			);
		},
		[commit],
	);

	const updateComment = useCallback(
		(id: string, text: string) => {
			if (!text.trim()) {
				commit(
					(p) => ({ ...p, comments: p.comments.filter((c) => c.id !== id) }),
					"comment_delete",
					"Removed comment",
				);
				return;
			}
			commit(
				(p) => ({
					...p,
					comments: p.comments.map((c) =>
						c.id === id ? { ...c, text: text.trim() } : c,
					),
				}),
				"comment",
				"Edited comment",
			);
		},
		[commit],
	);

	const deleteComment = useCallback(
		(id: string) => {
			commit(
				(p) => ({ ...p, comments: p.comments.filter((c) => c.id !== id) }),
				"comment_delete",
				"Removed comment",
			);
			setActiveCommentId(null);
		},
		[commit],
	);

	const getCanvasPoint = useCallback(
		(e: React.MouseEvent) => {
			const rect = canvasRef.current!.getBoundingClientRect();
			return {
				x: (e.clientX - rect.left) / zoom,
				y: (e.clientY - rect.top) / zoom,
			};
		},
		[zoom],
	);

	const handleCanvasClick = (e: React.MouseEvent) => {
		if (tool === "hand") return;
		const { x, y } = getCanvasPoint(e);
		if (tool === "comment") {
			setDraftComment({
				id: uid(),
				x: Math.max(0, x),
				y: Math.max(0, y),
				text: "",
			});
			return;
		}
		if (tool === "rect" || tool === "circle" || tool === "text") {
			addElement(tool, Math.max(0, x - 60), Math.max(0, y - 45));
			setTool("select");
			return;
		}
		if (tool === "connect") {
			setConnectFrom(null);
			return;
		}
		setSelectedId(null);
		setSelectedConnectionId(null);
	};

	const handleElementMouseDown = (el: CanvasElement, e: React.MouseEvent) => {
		e.stopPropagation();
		if (tool === "connect") {
			if (!connectFrom) setConnectFrom(el.id);
			else if (connectFrom !== el.id) {
				addConnection(connectFrom, el.id);
				setConnectFrom(null);
			} else setConnectFrom(null);
			return;
		}
		if (tool === "comment" || tool === "hand") return;
		setSelectedId(el.id);
		setSelectedConnectionId(null);
		setPropTab("design");
		beginInteraction();
		setDragState({
			id: el.id,
			startX: e.clientX,
			startY: e.clientY,
			origX: el.x,
			origY: el.y,
		});
	};

	const startResize = (el: CanvasElement, e: React.MouseEvent) => {
		e.stopPropagation();
		beginInteraction();
		setResizeState({
			id: el.id,
			startX: e.clientX,
			startY: e.clientY,
			origW: el.w,
			origH: el.h,
		});
	};

	useEffect(() => {
		if (!dragState) return;
		const onMove = (e: MouseEvent) => {
			const dx = (e.clientX - dragState.startX) / zoom;
			const dy = (e.clientY - dragState.startY) / zoom;
			applyLive((p) => ({
				...p,
				elements: p.elements.map((el) =>
					el.id === dragState.id
						? {
								...el,
								x: Math.max(0, dragState.origX + dx),
								y: Math.max(0, dragState.origY + dy),
								updatedAt: Date.now(),
							}
						: el,
				),
			}));
		};
		const onUp = () => {
			endInteraction();
			setDragState(null);
		};
		window.addEventListener("mousemove", onMove);
		window.addEventListener("mouseup", onUp);
		return () => {
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
		};
	}, [dragState, zoom, applyLive, endInteraction]);

	useEffect(() => {
		if (!resizeState) return;
		const onMove = (e: MouseEvent) => {
			const dx = (e.clientX - resizeState.startX) / zoom;
			const dy = (e.clientY - resizeState.startY) / zoom;
			applyLive((p) => ({
				...p,
				elements: p.elements.map((el) =>
					el.id === resizeState.id
						? {
								...el,
								w: Math.max(24, resizeState.origW + dx),
								h: Math.max(24, resizeState.origH + dy),
								updatedAt: Date.now(),
							}
						: el,
				),
			}));
		};
		const onUp = () => {
			endInteraction();
			setResizeState(null);
		};
		window.addEventListener("mousemove", onMove);
		window.addEventListener("mouseup", onUp);
		return () => {
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
		};
	}, [resizeState, zoom, applyLive, endInteraction]);

	const handViewportMouseDown = (e: React.MouseEvent) => {
		if (tool !== "hand") return;
		e.preventDefault();
		const el = viewportRef.current!;
		const startX = e.clientX,
			startY = e.clientY;
		const startScrollLeft = el.scrollLeft,
			startScrollTop = el.scrollTop;
		const onMove = (ev: MouseEvent) => {
			el.scrollLeft = startScrollLeft - (ev.clientX - startX);
			el.scrollTop = startScrollTop - (ev.clientY - startY);
		};
		const onUp = () => {
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
		};
		window.addEventListener("mousemove", onMove);
		window.addEventListener("mouseup", onUp);
	};

	const selectedEl = project.elements.find((e) => e.id === selectedId) || null;
	const selectedConnection =
		project.connections.find((c) => c.id === selectedConnectionId) || null;

	const updateSelected = (patch: Partial<CanvasElement>) => {
		applyLive((p) => ({
			...p,
			elements: p.elements.map((e) =>
				e.id === selectedId
					? ({ ...e, ...patch, updatedAt: Date.now() } as CanvasElement)
					: e,
			),
		}));
	};

	const updateSelectedStyle = (patch: Partial<ElementStyle>) => {
		applyLive((p) => ({
			...p,
			elements: p.elements.map((e) =>
				e.id === selectedId
					? { ...e, style: { ...e.style, ...patch }, updatedAt: Date.now() }
					: e,
			),
		}));
	};

	const updateSelectedTypography = (patch: Partial<Typography>) => {
		applyLive((p) => ({
			...p,
			elements: p.elements.map((e) =>
				e.id === selectedId && e.type === "text"
					? {
							...e,
							typography: { ...e.typography, ...patch },
							updatedAt: Date.now(),
						}
					: e,
			),
		}));
	};

	const handleSave = () => {
		const toSave =
			nameEdit !== project.name ? { ...project, name: nameEdit } : project;
		onSave(toSave);
		dirtyRef.current = false;
	};

	// Keyboard shortcuts
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement;
			const typing =
				target.tagName === "INPUT" || target.tagName === "TEXTAREA";
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
				e.preventDefault();
				if (e.shiftKey) redo();
				else undo();
				return;
			}
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
				e.preventDefault();
				redo();
				return;
			}
			if (typing) return;
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
				e.preventDefault();
				duplicateSelected();
				return;
			}
			if (e.key === "Delete" || e.key === "Backspace") {
				e.preventDefault();
				deleteSelected();
				return;
			}
			if (e.key === "Escape") {
				setConnectFrom(null);
				setDraftComment(null);
				setSelectedId(null);
				setSelectedConnectionId(null);
				setActiveCommentId(null);
				return;
			}
			switch (e.key.toLowerCase()) {
				case "v":
					setTool("select");
					break;
				case "h":
					setTool("hand");
					break;
				case "c":
					setTool("comment");
					break;
				case "r":
					setTool("rect");
					break;
				case "o":
					setTool("circle");
					break;
				case "t":
					setTool("text");
					break;
				case "l":
					setTool("connect");
					break;
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [undo, redo, duplicateSelected, deleteSelected]);

	const elementsById = useMemo(() => {
		const map: Record<string, CanvasElement> = {};
		project.elements.forEach((e) => {
			map[e.id] = e;
		});
		return map;
	}, [project.elements]);

	const cursorForTool =
		tool === "hand" ? "grab" : tool === "select" ? "default" : "crosshair";

	return (
		<div style={{ display: "flex", height: "calc(100vh - 56px)" }}>
			{/* Canvas area */}
			<div
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					minWidth: 0,
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 10,
						padding: "10px 16px",
						background: "#fff",
						borderBottom: "1px solid #e5e7eb",
					}}
				>
					<input
						value={nameEdit}
						onChange={(e) => setNameEdit(e.target.value)}
						style={{
							border: "1px solid #e5e7eb",
							borderRadius: 8,
							padding: "6px 10px",
							fontSize: 13,
							width: 220,
						}}
					/>
					<button
						onClick={handleSave}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							background: "#7C3AED",
							color: "#fff",
							border: "none",
							padding: "7px 14px",
							borderRadius: 8,
							fontSize: 13,
							cursor: "pointer",
						}}
					>
						<Save size={14} /> Save
					</button>
					<button
						title="Undo (Ctrl+Z)"
						onClick={undo}
						disabled={history.past.length === 0}
						style={{
							...btnIcon,
							opacity: history.past.length === 0 ? 0.4 : 1,
							cursor: history.past.length === 0 ? "not-allowed" : "pointer",
						}}
					>
						<Undo2 size={15} />
					</button>
					<button
						title="Redo (Ctrl+Shift+Z)"
						onClick={redo}
						disabled={history.future.length === 0}
						style={{
							...btnIcon,
							opacity: history.future.length === 0 ? 0.4 : 1,
							cursor: history.future.length === 0 ? "not-allowed" : "pointer",
						}}
					>
						<Redo2 size={15} />
					</button>
					<button
						title="Duplicate (Ctrl+D)"
						onClick={duplicateSelected}
						disabled={!selectedId}
						style={{
							...btnIcon,
							opacity: !selectedId ? 0.4 : 1,
							cursor: !selectedId ? "not-allowed" : "pointer",
						}}
					>
						<Copy size={15} />
					</button>
					<div style={{ flex: 1 }} />
					<span style={{ fontSize: 12, color: "#9ca3af" }}>
						{project.elements.length} layers · {project.connections.length}{" "}
						connectors · {project.comments.length} comments
					</span>
					<span
						style={{
							fontSize: 12,
							color: saveStatus === "saving" ? "#9ca3af" : "#22c55e",
							minWidth: 64,
							textAlign: "right",
						}}
					>
						{saveStatus === "saving"
							? "Saving…"
							: saveStatus === "saved"
								? "Saved ✓"
								: ""}
					</span>
				</div>

				<div style={{ flex: 1, position: "relative", minHeight: 0 }}>
					<div
						ref={viewportRef}
						onMouseDown={handViewportMouseDown}
						style={{
							position: "absolute",
							inset: 0,
							overflow: "auto",
							background: "#eceef1",
							cursor: tool === "hand" ? "grab" : "default",
						}}
					>
						<div
							style={{
								width: canvasWidth * zoom + 80,
								height: canvasHeight * zoom + 80,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
						>
							<div
								ref={canvasRef}
								onClick={handleCanvasClick}
								style={{
									position: "relative",
									width: canvasWidth,
									height: canvasHeight,
									transform: `scale(${zoom})`,
									background: "#fff",
									borderRadius: 8,
									boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
									cursor: cursorForTool,
									backgroundImage:
										"radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
									backgroundSize: "20px 20px",
								}}
							>
								<svg
									width={canvasWidth}
									height={canvasHeight}
									style={{
										position: "absolute",
										top: 0,
										left: 0,
										pointerEvents: "none",
									}}
								>
									<defs>
										<marker
											id="arrowhead"
											markerWidth="8"
											markerHeight="8"
											refX="6"
											refY="4"
											orient="auto"
										>
											<path d="M0,0 L8,4 L0,8 Z" fill="#7c7c7c" />
										</marker>
										<marker
											id="arrowhead-selected"
											markerWidth="8"
											markerHeight="8"
											refX="6"
											refY="4"
											orient="auto"
										>
											<path d="M0,0 L8,4 L0,8 Z" fill="#7C3AED" />
										</marker>
									</defs>
									{project.connections.map((c) => {
										const fromEl = elementsById[c.from];
										const toEl = elementsById[c.to];
										if (!fromEl || !toEl) return null;
										const fromCenter = {
											x: fromEl.x + fromEl.w / 2,
											y: fromEl.y + fromEl.h / 2,
										};
										const toCenter = {
											x: toEl.x + toEl.w / 2,
											y: toEl.y + toEl.h / 2,
										};
										const p1 = getEdgePoint(fromEl, toCenter.x, toCenter.y);
										const p2 = getEdgePoint(toEl, fromCenter.x, fromCenter.y);
										const isSelected = c.id === selectedConnectionId;
										return (
											<line
												key={c.id}
												x1={p1.x}
												y1={p1.y}
												x2={p2.x}
												y2={p2.y}
												stroke={isSelected ? "#7C3AED" : "#7c7c7c"}
												strokeWidth={isSelected ? 3 : 2}
												markerEnd={
													isSelected
														? "url(#arrowhead-selected)"
														: "url(#arrowhead)"
												}
												style={{ pointerEvents: "auto", cursor: "pointer" }}
												onClick={(e) => {
													e.stopPropagation();
													setSelectedConnectionId(c.id);
													setSelectedId(null);
												}}
											/>
										);
									})}
									{connectFrom && elementsById[connectFrom] && (
										<circle
											cx={
												elementsById[connectFrom].x +
												elementsById[connectFrom].w / 2
											}
											cy={
												elementsById[connectFrom].y +
												elementsById[connectFrom].h / 2
											}
											r={6}
											fill="#F97316"
										/>
									)}
								</svg>

								{project.elements.map((el) => (
									<ElementView
										key={el.id}
										el={el}
										selected={el.id === selectedId}
										connecting={tool === "connect"}
										connectArmed={connectFrom === el.id}
										onMouseDown={(e) => handleElementMouseDown(el, e)}
										onResizeMouseDown={(e) => startResize(el, e)}
									/>
								))}

								{project.comments.map((c, idx) => (
									<CommentPinView
										key={c.id}
										index={idx + 1}
										comment={c}
										open={activeCommentId === c.id}
										onToggle={() =>
											setActiveCommentId(activeCommentId === c.id ? null : c.id)
										}
										onSave={(text) => updateComment(c.id, text)}
										onDelete={() => deleteComment(c.id)}
									/>
								))}

								{draftComment && (
									<DraftCommentBubble
										draft={draftComment}
										onCommit={(text) => {
											commitComment(
												draftComment.id,
												draftComment.x,
												draftComment.y,
												text,
											);
											setDraftComment(null);
										}}
										onCancel={() => setDraftComment(null)}
									/>
								)}

								{project.elements.length === 0 && !draftComment && (
									<div
										style={{
											position: "absolute",
											inset: 0,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											color: "#9ca3af",
											fontSize: 14,
											pointerEvents: "none",
										}}
									>
										Pick a tool and click the canvas to add a shape
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Fixed overlay layer — sits on top of the scrollable viewport, never scrolls or shifts with pan/zoom */}
					<div
						style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
					>
						{/* Zoom controls */}
						<div
							style={{
								position: "absolute",
								bottom: 16,
								right: 16,
								display: "flex",
								alignItems: "center",
								gap: 4,
								background: "#fff",
								borderRadius: 10,
								boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
								padding: 4,
								pointerEvents: "auto",
							}}
						>
							<button
								onClick={() =>
									setZoom((z) => Math.max(0.25, +(z - 0.1).toFixed(2)))
								}
								style={{ ...btnIcon, border: "none" }}
							>
								<ZoomOut size={15} />
							</button>
							<span
								style={{
									fontSize: 12,
									color: "#374151",
									minWidth: 42,
									textAlign: "center",
								}}
							>
								{Math.round(zoom * 100)}%
							</span>
							<button
								onClick={() =>
									setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))
								}
								style={{ ...btnIcon, border: "none" }}
							>
								<ZoomIn size={15} />
							</button>
						</div>

						{/* Bottom-center floating toolbar (Figma-style) */}
						<div
							style={{
								position: "absolute",
								bottom: 16,
								left: "50%",
								transform: "translateX(-50%)",
								display: "flex",
								alignItems: "center",
								gap: 2,
								background: "#1f2430",
								borderRadius: 14,
								boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
								padding: 6,
								pointerEvents: "auto",
							}}
						>
							{TOOLS.map((t) => (
								<ToolbarButton
									key={t.id}
									active={tool === t.id}
									title={`${t.label} (${t.shortcut})`}
									onClick={() => setTool(t.id)}
								>
									<t.icon size={17} />
								</ToolbarButton>
							))}
							<div
								style={{
									width: 1,
									height: 22,
									background: "rgba(255,255,255,0.15)",
									margin: "0 4px",
								}}
							/>
							{SHAPE_TOOLS.map((t) => (
								<ToolbarButton
									key={t.id}
									active={tool === t.id}
									title={`${t.label} (${t.shortcut})`}
									onClick={() => setTool(t.id)}
								>
									<t.icon size={17} />
								</ToolbarButton>
							))}
						</div>

						{tool === "connect" && (
							<div
								style={{
									position: "absolute",
									top: 12,
									left: "50%",
									transform: "translateX(-50%)",
									background: "#1f2430",
									color: "#fff",
									fontSize: 12,
									padding: "6px 12px",
									borderRadius: 8,
									pointerEvents: "auto",
								}}
							>
								{connectFrom
									? "Click another layer to connect it"
									: "Click a layer to start a connector"}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Right inspector */}
			<div
				style={{
					width: 268,
					background: "#fff",
					borderLeft: "1px solid #e5e7eb",
					padding: 16,
					overflowY: "auto",
				}}
			>
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
					<Layers size={14} /> Layers
				</div>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: 4,
						marginBottom: 20,
						maxHeight: 160,
						overflow: "auto",
					}}
				>
					{project.elements
						.slice()
						.reverse()
						.map((el) => (
							<div
								key={el.id}
								onClick={() => {
									setSelectedId(el.id);
									setSelectedConnectionId(null);
									setPropTab("design");
								}}
								style={{
									padding: "6px 8px",
									borderRadius: 6,
									fontSize: 12,
									cursor: "pointer",
									background: el.id === selectedId ? "#f3f0ff" : "transparent",
									color: el.id === selectedId ? "#7C3AED" : "#4b5563",
									display: "flex",
									alignItems: "center",
									gap: 6,
								}}
							>
								{el.type === "rect" && <Square size={12} />}
								{el.type === "circle" && <CircleIcon size={12} />}
								{el.type === "text" && <Type size={12} />}
								<span
									style={{
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{el.name}
								</span>
							</div>
						))}
					{project.elements.length === 0 && (
						<div style={{ fontSize: 12, color: "#9ca3af" }}>No layers yet</div>
					)}
				</div>

				{project.connections.length > 0 && (
					<>
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
							<Link2 size={14} /> Connectors
						</div>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: 4,
								marginBottom: 20,
								maxHeight: 120,
								overflow: "auto",
							}}
						>
							{project.connections.map((c) => {
								const fromEl = elementsById[c.from];
								const toEl = elementsById[c.to];
								return (
									<div
										key={c.id}
										onClick={() => {
											setSelectedConnectionId(c.id);
											setSelectedId(null);
										}}
										style={{
											padding: "6px 8px",
											borderRadius: 6,
											fontSize: 12,
											cursor: "pointer",
											background:
												c.id === selectedConnectionId
													? "#fef2f2"
													: "transparent",
											color:
												c.id === selectedConnectionId ? "#EF4444" : "#4b5563",
											display: "flex",
											alignItems: "center",
											justifyContent: "space-between",
											gap: 6,
										}}
									>
										<span
											style={{
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}
										>
											{fromEl?.name || "?"} → {toEl?.name || "?"}
										</span>
										<Unlink
											size={12}
											onClick={(e) => {
												e.stopPropagation();
												removeConnection(c.id);
											}}
										/>
									</div>
								);
							})}
						</div>
					</>
				)}

				{selectedEl && (
					<SelectedElementPanel
						el={selectedEl}
						propTab={propTab}
						setPropTab={setPropTab}
						connectionsCount={
							project.connections.filter(
								(c) => c.from === selectedEl.id || c.to === selectedEl.id,
							).length
						}
						onNameChange={(name) => updateSelected({ name })}
						onContentChange={(patch) => updateSelected(patch)}
						onStyleChange={updateSelectedStyle}
						onTypographyChange={updateSelectedTypography}
						onDuplicate={duplicateSelected}
						onDelete={deleteSelected}
					/>
				)}

				{!selectedEl && selectedConnection && (
					<ConnectionPanel
						connection={selectedConnection}
						fromName={elementsById[selectedConnection.from]?.name || "Unknown"}
						toName={elementsById[selectedConnection.to]?.name || "Unknown"}
						onDelete={() => removeConnection(selectedConnection.id)}
					/>
				)}

				{!selectedEl && !selectedConnection && (
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
							<SlidersHorizontal size={14} /> Canvas
						</div>
						<div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
							<div>
								<label style={labelStyle}>Width</label>
								<input
									type="number"
									min={MIN_CANVAS_SIZE}
									max={MAX_CANVAS_SIZE}
									value={canvasWidth}
									onChange={(e) =>
										updateCanvasSize({ canvasWidth: Number(e.target.value) })
									}
									style={{ ...inputStyle, width: 110 }}
								/>
							</div>
							<div>
								<label style={labelStyle}>Height</label>
								<input
									type="number"
									min={MIN_CANVAS_SIZE}
									max={MAX_CANVAS_SIZE}
									value={canvasHeight}
									onChange={(e) =>
										updateCanvasSize({ canvasHeight: Number(e.target.value) })
									}
									style={{ ...inputStyle, width: 110 }}
								/>
							</div>
						</div>
						<div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6 }}>
							Select a layer or connector to see and edit its properties here.
							Use the toolbar below the canvas to add shapes, draw connectors,
							leave comments, or pan with the hand tool.
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function ToolbarButton({
	active,
	title,
	onClick,
	children,
}: {
	active: boolean;
	title: string;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			title={title}
			onClick={onClick}
			style={{
				width: 36,
				height: 36,
				borderRadius: 9,
				border: "none",
				cursor: "pointer",
				background: active ? "#7C3AED" : "transparent",
				color: active ? "#fff" : "#d1d5db",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			{children}
		</button>
	);
}

// Returns a point on an element's bounding box, on the side facing (towardX, towardY)
export function getEdgePoint(
	el: CanvasElement,
	towardX: number,
	towardY: number,
) {
	const cx = el.x + el.w / 2;
	const cy = el.y + el.h / 2;
	const dx = towardX - cx;
	const dy = towardY - cy;
	if (dx === 0 && dy === 0) return { x: cx, y: cy };
	const hw = el.w / 2;
	const hh = el.h / 2;
	const scale = 1 / Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh, 0.0001);
	return { x: cx + dx * scale, y: cy + dy * scale };
}
