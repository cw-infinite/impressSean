import { btnActive, btnGhost } from "@/utils/constans";
import { BarChart3, ChevronLeft, LayoutGrid, MousePointer2 } from "lucide-react";

interface TopBarProps {
  view: View;
  setView: (v: View) => void;
  activeProject: Project | null;
  saveStatus: SaveStatus;
  onBack: () => void;
}



export function TopBar({ view, setView, activeProject, saveStatus, onBack }:TopBarProps) {
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
          <span style={{ fontSize: 12, color: '#9ca3af', minWidth: 70, textAlign: 'right' }}>
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved ✓' : ''}
          </span>
        </>
      )}
      {!activeProject && <div style={{ flex: 1 }} />}
    </div>
  );
}