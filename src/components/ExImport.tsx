// ============ EXPORT / IMPORT UTILITIES ============

import { COLORS, normalizeProject, uid } from "@/utils/constans";
import { CANVAS_H, CANVAS_W } from "./Editor";

export function escapeXml(str: string) {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

export function elementToSVG(el: CanvasElement): string {
	const cx = el.x + el.w / 2;
	const cy = el.y + el.h / 2;
	const transform = el.style.rotation
		? `rotate(${el.style.rotation} ${cx} ${cy})`
		: "";
	const opacity = el.style.opacity / 100;
	const strokeAttrs =
		el.style.borderWidth > 0
			? `stroke="${el.style.borderColor}" stroke-width="${el.style.borderWidth}" stroke-dasharray="${
					el.style.borderStyle === "dashed"
						? "8,6"
						: el.style.borderStyle === "dotted"
							? "2,4"
							: "0"
				}"`
			: "";
	const filterAttr = el.style.shadow ? `filter="url(#shadow-${el.id})"` : "";
	const shadowDef = el.style.shadow
		? `<filter id="shadow-${el.id}" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="${el.style.shadowX}" dy="${el.style.shadowY}" stdDeviation="${el.style.shadowBlur / 2}" flood-color="${el.style.shadowColor}" flood-opacity="0.6"/>
      </filter>`
		: "";

	if (el.type === "rect") {
		return `${shadowDef}
    <g transform="${transform}" opacity="${opacity}" ${filterAttr}>
      <rect x="${el.x}" y="${el.y}" width="${el.w}" height="${el.h}" rx="${el.style.borderRadius}" ry="${el.style.borderRadius}" fill="${el.fill}" ${strokeAttrs} />
      <text x="${el.x + 8}" y="${el.y + el.h - 10}" font-size="11" fill="rgba(255,255,255,0.9)" font-family="Inter, sans-serif">${escapeXml(el.label)}</text>
    </g>`;
	}
	if (el.type === "circle") {
		return `${shadowDef}
    <g transform="${transform}" opacity="${opacity}" ${filterAttr}>
      <ellipse cx="${cx}" cy="${cy}" rx="${el.w / 2}" ry="${el.h / 2}" fill="${el.fill}" ${strokeAttrs} />
      <text x="${cx}" y="${cy + 4}" font-size="10" fill="rgba(255,255,255,0.9)" text-anchor="middle" font-family="Inter, sans-serif">${escapeXml(el.label)}</text>
    </g>`;
	}
	const t = el as TextElement;
	const anchor =
		t.typography.textAlign === "center"
			? "middle"
			: t.typography.textAlign === "right"
				? "end"
				: "start";
	const textX =
		t.typography.textAlign === "center"
			? cx
			: t.typography.textAlign === "right"
				? el.x + el.w
				: el.x;
	const textY = el.y + el.h / 2 + t.typography.fontSize * 0.35;
	return `<g transform="${transform}" opacity="${opacity}">
      <text x="${textX}" y="${textY}" font-family="${t.typography.fontFamily}, sans-serif" font-size="${t.typography.fontSize}" font-weight="${t.typography.fontWeight}" letter-spacing="${t.typography.letterSpacing}" text-anchor="${anchor}" fill="${el.fill}">${escapeXml(t.text)}</text>
    </g>`;
}

export function projectToSVGString(project: Project): string {
	const connectorsSVG = project.connections
		.map((c) => {
			const fromEl = project.elements.find((e) => e.id === c.from);
			const toEl = project.elements.find((e) => e.id === c.to);
			if (!fromEl || !toEl) return "";
			const fromCenter = {
				x: fromEl.x + fromEl.w / 2,
				y: fromEl.y + fromEl.h / 2,
			};
			const toCenter = { x: toEl.x + toEl.w / 2, y: toEl.y + toEl.h / 2 };
			const p1 = getEdgePoint(fromEl, toCenter.x, toCenter.y);
			const p2 = getEdgePoint(toEl, fromCenter.x, fromCenter.y);
			return `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="#7C3AED" stroke-width="2" marker-end="url(#arrowhead)" />`;
		})
		.join("\n");

	const elementsSVG = project.elements.map(elementToSVG).join("\n");

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}">
    <defs>
      <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill="#7C3AED" />
      </marker>
    </defs>
    <rect x="0" y="0" width="${CANVAS_W}" height="${CANVAS_H}" fill="#ffffff" />
    ${connectorsSVG}
    ${elementsSVG}
  </svg>`;
}

export async function rasterizeProjectToCanvas(
	project: Project,
	scale = 2,
): Promise<HTMLCanvasElement> {
	const svgString = projectToSVGString(project);
	const svgBlob = new Blob([svgString], {
		type: "image/svg+xml;charset=utf-8",
	});
	const url = URL.createObjectURL(svgBlob);
	try {
		const img = await new Promise<HTMLImageElement>((resolve, reject) => {
			const image = new Image();
			image.onload = () => resolve(image);
			image.onerror = reject;
			image.src = url;
		});
		const canvas = document.createElement("canvas");
		canvas.width = CANVAS_W * scale;
		canvas.height = CANVAS_H * scale;
		const ctx = canvas.getContext("2d")!;
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		return canvas;
	} finally {
		URL.revokeObjectURL(url);
	}
}

export function downloadBlob(blob: Blob, filename: string) {
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = filename;
	link.click();
	URL.revokeObjectURL(link.href);
}

const safeFileName = (name: string) =>
	(name || "project").trim().replace(/[^a-z0-9\-_ ]/gi, "_");

export async function exportProjectAsPNG(project: Project) {
	const canvas = await rasterizeProjectToCanvas(project, 2);
	await new Promise<void>((resolve) => {
		canvas.toBlob((blob) => {
			if (blob) downloadBlob(blob, `${safeFileName(project.name)}.png`);
			resolve();
		}, "image/png");
	});
}

export async function exportProjectAsPDF(project: Project) {
	const canvas = await rasterizeProjectToCanvas(project, 1);
	const dataUrl = canvas.toDataURL("image/png");
	const { jsPDF } = await import("jspdf");
	const pdf = new jsPDF({
		orientation: CANVAS_W >= CANVAS_H ? "landscape" : "portrait",
		unit: "px",
		format: [CANVAS_W, CANVAS_H],
	});
	pdf.addImage(dataUrl, "PNG", 0, 0, CANVAS_W, CANVAS_H);
	pdf.save(`${safeFileName(project.name)}.pdf`);
}

export function exportProjectAsJSON(project: Project) {
	const blob = new Blob([JSON.stringify(project, null, 2)], {
		type: "application/json",
	});
	downloadBlob(blob, `${safeFileName(project.name)}.json`);
}

export function importProjectFromFile(file: File): Promise<Project> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const parsed = JSON.parse(String(reader.result));
				if (
					!parsed ||
					typeof parsed !== "object" ||
					!Array.isArray(parsed.elements)
				) {
					throw new Error("This file does not look like an exported project.");
				}
				const project = normalizeProject({
					...parsed,
					id: uid(), // always a new id, so importing never overwrites an existing project
					createdAt:
						typeof parsed.createdAt === "number"
							? parsed.createdAt
							: Date.now(),
					updatedAt: Date.now(),
					name: parsed.name ? `${parsed.name} (imported)` : "Imported project",
					thumbnailColor:
						parsed.thumbnailColor ||
						COLORS[Math.floor(Math.random() * COLORS.length)],
					connections: parsed.connections || [],
					comments: parsed.comments || [],
					activity: [
						...(parsed.activity || []),
						{
							t: Date.now(),
							type: "created",
							detail: "Imported from JSON file",
						},
					],
				});
				resolve(project);
			} catch (err) {
				reject(err);
			}
		};
		reader.onerror = () => reject(new Error("Could not read file"));
		reader.readAsText(file);
	});
}
