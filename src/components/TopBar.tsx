import { btnActive, btnGhost } from "@/utils/constans";
import {
	BarChart3,
	ChevronLeft,
	Download,
	FileJson,
	FileText,
	Github,
	ImageIcon,
	LayoutGrid,
	MousePointer2,
	Upload,
	LogOut
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	exportProjectAsJSON,
	exportProjectAsPDF,
	exportProjectAsPNG,
} from "./ExImport";

interface TopBarProps {
	view: View;
	setView: (v: View) => void;
	activeProject: Project | null;
	saveStatus: SaveStatus;
	onBack: () => void;
	onImportProject: (file: File) => Promise<void>;
	onLogout: () => void;
}

export function TopBar({ view, setView, activeProject, saveStatus, onBack, onImportProject, onLogout }: TopBarProps) {
	const [exportOpen, setExportOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const exportMenuRef = useRef<HTMLDivElement>(null);
	const importInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!exportOpen) return;
		const onClickOutside = (e: MouseEvent) => {
			if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
				setExportOpen(false);
			}
		};
		window.addEventListener('mousedown', onClickOutside);
		return () => window.removeEventListener('mousedown', onClickOutside);
	}, [exportOpen]);

	const handleExport = async (format: 'png' | 'pdf' | 'json') => {
		if (!activeProject || busy) return;
		setExportOpen(false);
		setBusy(true);
		try {
			if (format === 'png') await exportProjectAsPNG(activeProject);
			else if (format === 'pdf') await exportProjectAsPDF(activeProject);
			else exportProjectAsJSON(activeProject);
		} catch (err) {
			console.error(err);
			alert('Export failed. Check the console for details.');
		} finally {
			setBusy(false);
		}
	};

	const handleImportChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = '';
		if (!file) return;
		setBusy(true);
		try {
			await onImportProject(file);
		} catch (err) {
			console.error(err);
			alert('Could not import this file — make sure it is a project JSON exported from here.');
		} finally {
			setBusy(false);
		}
	};

	return (
		<div style={{ height: 56, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 16px', background: '#fff', position: 'sticky', top: 0, zIndex: 20, gap: 12 }}>
			{view !== 'dashboard' ? (
				<button onClick={onBack} style={btnGhost}>
					<ChevronLeft size={16} /> Projects
				</button>
			) : (
				<div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 15 }}>
					<LayoutGrid size={18} color="#7C3AED" /> Figmock
				</div>
			)}

			{activeProject && view !== 'dashboard' && (
				<>
					<div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
					<div style={{ fontWeight: 500, fontSize: 14 }}>{activeProject.name}</div>
					<div style={{ flex: 1 }} />
					<button onClick={() => setView('editor')} style={view === 'editor' ? btnActive : btnGhost}>
						<MousePointer2 size={14} /> Editor
					</button>
					<button onClick={() => setView('reports')} style={view === 'reports' ? btnActive : btnGhost}>
						<BarChart3 size={14} /> Reports
					</button>
					<div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
					<div ref={exportMenuRef} style={{ position: 'relative' }}>
						<button
							onClick={() => setExportOpen(o => !o)}
							disabled={busy}
							style={{ ...btnGhost, border: '1px solid #e5e7eb', opacity: busy ? 0.5 : 1, cursor: busy ? 'not-allowed' : 'pointer' }}
						>
							<Download size={14} /> Export
						</button>
						{exportOpen && (
							<div style={{
								position: 'absolute', top: '110%', right: 0, background: '#fff', border: '1px solid #e5e7eb',
								borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 170, zIndex: 30, overflow: 'hidden',
							}}>
								<ExportMenuItem icon={<ImageIcon size={14} />} label="Export as PNG" onClick={() => handleExport('png')} />
								<ExportMenuItem icon={<FileText size={14} />} label="Export as PDF" onClick={() => handleExport('pdf')} />
								<ExportMenuItem icon={<FileJson size={14} />} label="Export as JSON" onClick={() => handleExport('json')} />
							</div>
						)}
					</div>
					{/* <div style={{ width: 1, height: 20, background: '#e5e7eb' }} /> */}
					{/* <span style={{ fontSize: 12, color: '#9ca3af', minWidth: 70, textAlign: 'right' }}>
						{saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved ✓' : ''}
					</span> */}
				</>
			)}

			{/* Spacer when no project is active (dashboard view) */}
			{view === 'dashboard' && <div style={{ flex: 1 }} />}

			{/* Import — hidden on the dashboard */}
			{view !== 'dashboard' && (
				<>
					<div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
					<button
						onClick={() => importInputRef.current?.click()}
						disabled={busy}
						style={{ ...btnGhost, border: '1px solid #e5e7eb', opacity: busy ? 0.5 : 1, cursor: busy ? 'not-allowed' : 'pointer' }}
					>
						<Upload size={14} /> Import
					</button>
					<input ref={importInputRef} type="file" accept="application/json,.json" onChange={handleImportChange} style={{ display: 'none' }} />
				</>
			)}

			<div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
			<a
				href="https://github.com/cw-infinite/impressSean"
				target="_blank"
				rel="noopener noreferrer"
				title="View source on GitHub"
				style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, color: '#374151', textDecoration: 'none' }}
				onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
				onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
			>
				<Github size={18} />
			</a>

			{/* Logout — always visible, far right */}
			<div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
			<button
				onClick={onLogout}
				title="Sign out"
				style={{ ...btnGhost, color: '#6b7280' }}
				onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
				onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
			>
				<LogOut size={15} /> Sign out
			</button>
		</div>
	);
}

function ExportMenuItem({
	icon,
	label,
	onClick,
}: {
	icon: React.ReactNode;
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			onClick={onClick}
			style={{
				display: "flex",
				alignItems: "center",
				gap: 8,
				width: "100%",
				padding: "8px 12px",
				border: "none",
				background: "transparent",
				fontSize: 13,
				color: "#374151",
				cursor: "pointer",
				textAlign: "left",
			}}
			onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f7f8")}
			onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
		>
			{icon} {label}
		</button>
	);
}
