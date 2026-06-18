import { btnGhost } from "@/utils/constans";
import { BarChart3, Clock, LayoutGrid, Plus, Trash2 } from "lucide-react";

interface DashboardProps {
  projects: ProjectMeta[];
  onOpen: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onReports: (id: string) => void;
}

export function Dashboard({ projects, onOpen, onCreate, onDelete, onReports }: DashboardProps) {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Your projects</h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '4px 0 0' }}>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={onCreate} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#7C3AED', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
          <Plus size={16} /> New project
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {projects.map(p => (
          <div key={p.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow .15s' }}
               onClick={() => onOpen(p.id)}>
            <div style={{ height: 110, background: `linear-gradient(135deg, ${p.thumbnailColor}22, ${p.thumbnailColor}55)`, display: `flex`, alignItems: `center`, justifyContent: `center` }}>
              <LayoutGrid size={28} color={p.thumbnailColor} />
            </div>
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={11} /> {new Date(p.updatedAt).toLocaleDateString()}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                <button onClick={(e) => { e.stopPropagation(); onReports(p.id); }} style={{ ...btnGhost, flex: 1, justifyContent: 'center', border: '1px solid #e5e7eb', fontSize: 12 }}>
                  <BarChart3 size={12} /> Reports
                </button>
                <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete ${p.name}?`)) onDelete(p.id); }} style={{ ...btnGhost, border: `1px solid #e5e7eb`, color: `#ef4444` }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
        <div onClick={onCreate} style={{ border: '2px dashed #d1d5db', borderRadius: 12, minHeight: 178, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', cursor: 'pointer', gap: 6 }}>
          <Plus size={22} />
          <span style={{ fontSize: 13 }}>New project</span>
        </div>
      </div>
    </div>
  );
}
