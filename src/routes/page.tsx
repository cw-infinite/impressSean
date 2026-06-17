import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Square, Circle as CircleIcon, Type, Trash2, Save, BarChart3, LayoutGrid, ChevronLeft, MousePointer2, Layers, Clock, Palette } from 'lucide-react';

export const Route = createFileRoute('/page')({
  component: RouteComponent,
})

// ============ TYPES ============

type ElementType = 'rect' | 'circle' | 'text';

interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
}

interface RectElement extends BaseElement {
  type: 'rect';
  label: string;
}

interface CircleElement extends BaseElement {
  type: 'circle';
  label: string;
}

interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
}

type CanvasElement = RectElement | CircleElement | TextElement;

interface Activity {
  t: number;
  type: 'created' | 'add' | 'delete' | 'updated';
  detail: string;
}

interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  thumbnailColor: string;
  elements: CanvasElement[];
  activity: Activity[];
}

type ProjectMeta = Pick<Project, 'id' | 'name' | 'createdAt' | 'updatedAt' | 'thumbnailColor'>;

type View = 'dashboard' | 'editor' | 'reports';
type SaveStatus = 'idle' | 'saving' | 'saved';
type Tool = 'select' | 'rect' | 'circle' | 'text';

// ============ CONSTANTS ============

const COLORS = ['#7C3AED', '#0EA5A4', '#F97316', '#EC4899', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444'];

const uid = () => Math.random().toString(36).slice(2, 10);

const STORAGE_KEYS = {
  projects: 'figmock:projects',
  project: (id: string) => `figmock:project:${id}`,
} as const;

const DEFAULT_PROJECT = (name?: string): Project => ({
  id: uid(),
  name: name || 'Untitled project',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  thumbnailColor: COLORS[Math.floor(Math.random() * COLORS.length)],
  elements: [],
  activity: [{ t: Date.now(), type: 'created', detail: 'Project created' }],
});

// ============ STORAGE HOOK ============
// Safe wrapper around localStorage that won't crash during SSR
function useStorage() {
  const get = useCallback(async (key: string) => {
    try {
      if (typeof window === 'undefined') return null;
      const r = window.localStorage.getItem(key);
      return r ? JSON.parse(r) : null;
    } catch (e) {
      console.error('storage get failed', e);
      return null;
    }
  }, []);

  const set = useCallback(async (key: string, value: unknown) => {
    try {
      if (typeof window === 'undefined') return false;
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('storage set failed', e);
      return false;
    }
  }, []);

  const del = useCallback(async (key: string) => {
    try {
      if (typeof window === 'undefined') return false;
      window.localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('storage delete failed', e);
      return false;
    }
  }, []);

  return { get, set, del };
}

// ============ MAIN COMPONENT ============

function RouteComponent() {
  const { get, set, del } = useStorage();
  const [loaded, setLoaded] = useState(false);
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Load on mount
  useEffect(() => {
    (async () => {
      const list = await get(STORAGE_KEYS.projects) as ProjectMeta[] | null;
      if (list && Array.isArray(list)) {
        setProjects(list);
      } else {
        const seeded = [DEFAULT_PROJECT('Marketing site redesign'), DEFAULT_PROJECT('Mobile app onboarding')];
        seeded[0].elements = [
          { id: uid(), type: 'rect', x: 60, y: 60, w: 220, h: 120, fill: '#7C3AED', label: 'Hero panel' },
          { id: uid(), type: 'text', x: 80, y: 90, w: 180, h: 30, text: 'Welcome', fontSize: 20, fill: '#1f2937' },
          { id: uid(), type: 'circle', x: 320, y: 60, w: 80, h: 80, fill: '#0EA5A4', label: 'Avatar' },
        ];
        const metas: ProjectMeta[] = seeded.map(p => ({ 
          id: p.id, 
          name: p.name, 
          createdAt: p.createdAt, 
          updatedAt: p.updatedAt, 
          thumbnailColor: p.thumbnailColor 
        }));
        await set(STORAGE_KEYS.projects, metas);
        for (const p of seeded) await set(STORAGE_KEYS.project(p.id), p);
        setProjects(metas);
      }
      setLoaded(true);
    })();
  }, [get, set]);

  const loadProject = useCallback(async (id: string) => {
    const p = await get(STORAGE_KEYS.project(id)) as Project | null;
    setActiveProject(p);
    setActiveProjectId(id);
  }, [get]);

  const persistProjectMeta = useCallback(async (updatedList: ProjectMeta[]) => {
    setProjects(updatedList);
    await set(STORAGE_KEYS.projects, updatedList);
  }, [set]);

  const saveActiveProject = useCallback(async (proj: Project) => {
    if (!proj) return;
    setSaveStatus('saving');
    const toSave = { ...proj, updatedAt: Date.now() };
    await set(STORAGE_KEYS.project(toSave.id), toSave);
    setActiveProject(toSave);
    
    setProjects(prev => {
      const next = prev.map(p => p.id === toSave.id 
        ? { ...p, name: toSave.name, updatedAt: toSave.updatedAt } 
        : p
      );
      set(STORAGE_KEYS.projects, next); // fire and forget
      return next;
    });
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 1200);
  }, [set]);

  const createProject = useCallback(async (name: string) => {
    const p = DEFAULT_PROJECT(name);
    const meta: ProjectMeta = { 
      id: p.id, 
      name: p.name, 
      createdAt: p.createdAt, 
      updatedAt: p.updatedAt, 
      thumbnailColor: p.thumbnailColor 
    };
    const newList = [...projects, meta];
    await persistProjectMeta(newList);
    await set(STORAGE_KEYS.project(p.id), p);
    return p.id;
  }, [projects, persistProjectMeta, set]);

  const deleteProject = useCallback(async (id: string) => {
    const newList = projects.filter(p => p.id !== id);
    await persistProjectMeta(newList);
    await del(STORAGE_KEYS.project(id));
    if (activeProjectId === id) { 
      setActiveProjectId(null); 
      setActiveProject(null); 
      setView('dashboard'); 
    }
  }, [projects, persistProjectMeta, activeProjectId, del]);

  if (!loaded) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', fontFamily: 'ui-sans-serif' }}>Loading workspace…</div>;
  }

  return (
    <div style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif', background: '#f7f7f8', minHeight: '100vh', color: '#111827' }}>
      <TopBar
        view={view}
        setView={setView}
        activeProject={activeProject}
        saveStatus={saveStatus}
        onBack={() => { setView('dashboard'); }}
      />
      {view === 'dashboard' && (
        <Dashboard
          projects={projects}
          onOpen={async (id) => { await loadProject(id); setView('editor'); }}
          onCreate={async () => {
            const name = `Untitled ${projects.length + 1}`;
            const id = await createProject(name);
            await loadProject(id);
            setView('editor');
          }}
          onDelete={deleteProject}
          onReports={async (id) => { await loadProject(id); setView('reports'); }}
        />
      )}
      {view === 'editor' && activeProject && (
        <Editor
          project={activeProject}
          setProject={setActiveProject}
          onSave={saveActiveProject}
        />
      )}
      {view === 'reports' && activeProject && (
        <Reports project={activeProject} allProjects={projects} />
      )}
    </div>
  );
}

// I'll keep the rest of your components the same, just add types to props

interface TopBarProps {
  view: View;
  setView: (v: View) => void;
  activeProject: Project | null;
  saveStatus: SaveStatus;
  onBack: () => void;
}

function TopBar({ view, setView, activeProject, saveStatus, onBack }) {
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

const btnGhost = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8,
  border: '1px solid transparent', background: 'transparent', fontSize: 13, color: '#374151', cursor: 'pointer',
};
const btnActive = { ...btnGhost, background: '#f3f0ff', color: '#7C3AED', border: '1px solid #ddd6fe' };

// ============ DASHBOARD ============

function Dashboard({ projects, onOpen, onCreate, onDelete, onReports }) {
  const totalElements = (p) => 0;
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
            <div style={{ height: 110, background: `linear-gradient(135deg, ${p.thumbnailColor}22, ${p.thumbnailColor}55)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                <button onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${p.name}"?`)) onDelete(p.id); }} style={{ ...btnGhost, border: '1px solid #e5e7eb', color: '#ef4444' }}>
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

// ============ EDITOR ============

const TOOLS = [
  { id: 'select', icon: MousePointer2, label: 'Select' },
  { id: 'rect', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: CircleIcon, label: 'Ellipse' },
  { id: 'text', icon: Type, label: 'Text' },
];

function Editor({ project, setProject, onSave }) {
  const [tool, setTool] = useState('select');
  const [selectedId, setSelectedId] = useState(null);
  const [dragState, setDragState] = useState(null);
  const canvasRef = useRef(null);
  const [nameEdit, setNameEdit] = useState(project.name);
  const dirtyRef = useRef(false);

  useEffect(() => { setNameEdit(project.name); }, [project.id]);

  const logActivity = useCallback((proj, type, detail) => ({
    ...proj,
    activity: [...(proj.activity || []), { t: Date.now(), type, detail }].slice(-100),
  }), []);

  const updateProject = (mutator, activityType, activityDetail) => {
    setProject(prev => {
      let next = mutator(prev);
      if (activityType) next = logActivity(next, activityType, activityDetail);
      dirtyRef.current = true;
      return next;
    });
  };

  const addElement = (type, x, y) => {
    const base = {
      id: uid(), type, x, y,
      w: type === 'text' ? 140 : 120,
      h: type === 'text' ? 28 : 90,
      fill: COLORS[Math.floor(Math.random() * COLORS.length)],
    };
    if (type === 'text') { base.text = 'Text label'; base.fontSize = 16; base.fill = '#111827'; }
    if (type === 'rect') base.label = 'Frame';
    if (type === 'circle') base.label = 'Shape';
    updateProject(p => ({ ...p, elements: [...p.elements, base] }), 'add', `Added ${type} element`);
    setSelectedId(base.id);
  };

  const handleCanvasClick = (e) => {
    if (tool === 'select') { setSelectedId(null); return; }
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 60;
    const y = e.clientY - rect.top - 45;
    addElement(tool, Math.max(0, x), Math.max(0, y));
    setTool('select');
  };

  const startDrag = (el, e) => {
    e.stopPropagation();
    setSelectedId(el.id);
    setDragState({ id: el.id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y });
  };

  useEffect(() => {
    if (!dragState) return;
    const onMove = (e) => {
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      updateProject(p => ({
        ...p,
        elements: p.elements.map(el => el.id === dragState.id ? { ...el, x: Math.max(0, dragState.origX + dx), y: Math.max(0, dragState.origY + dy) } : el),
      }));
    };
    const onUp = () => setDragState(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragState]);

  const deleteSelected = () => {
    if (!selectedId) return;
    updateProject(p => ({ ...p, elements: p.elements.filter(e => e.id !== selectedId) }), 'delete', 'Deleted element');
    setSelectedId(null);
  };

  const selectedEl = project.elements.find(e => e.id === selectedId);

  const updateSelected = (patch) => {
    updateProject(p => ({ ...p, elements: p.elements.map(e => e.id === selectedId ? { ...e, ...patch } : e) }));
  };

  const handleSave = () => {
    const toSave = nameEdit !== project.name ? { ...project, name: nameEdit } : project;
    onSave(toSave);
    dirtyRef.current = false;
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
      {/* Left toolbar */}
      <div style={{ width: 64, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: 8 }}>
        {TOOLS.map(t => (
          <button key={t.id} title={t.label} onClick={() => setTool(t.id)}
            style={{
              width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
              background: tool === t.id ? '#f3f0ff' : 'transparent', color: tool === t.id ? '#7C3AED' : '#6b7280',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <t.icon size={18} />
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button title="Delete selected" onClick={deleteSelected} disabled={!selectedId}
          style={{ width: 40, height: 40, borderRadius: 10, border: 'none', cursor: selectedId ? 'pointer' : 'not-allowed', background: 'transparent', color: selectedId ? '#ef4444' : '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Trash2 size={18} />
        </button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, overflow: 'auto', background: '#eceef1', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
          <input value={nameEdit} onChange={e => setNameEdit(e.target.value)} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 10px', fontSize: 13, width: 220 }} />
          <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#7C3AED', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
            <Save size={14} /> Save
          </button>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>{project.elements.length} elements</span>
        </div>
        <div
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{ position: 'relative', width: 900, height: 600, margin: '32px auto', background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: tool !== 'select' ? 'crosshair' : 'default', backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        >
          {project.elements.map(el => (
            <CanvasElement key={el.id} el={el} selected={el.id === selectedId} onMouseDown={(e) => startDrag(el, e)} />
          ))}
          {project.elements.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
              Pick a tool and click the canvas to add a shape
            </div>
          )}
        </div>
      </div>

      {/* Right inspector */}
      <div style={{ width: 240, background: '#fff', borderLeft: '1px solid #e5e7eb', padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, marginBottom: 12, color: '#374151' }}>
          <Layers size={14} /> Layers
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20, maxHeight: 200, overflow: 'auto' }}>
          {project.elements.slice().reverse().map(el => (
            <div key={el.id} onClick={() => setSelectedId(el.id)}
              style={{ padding: '6px 8px', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: el.id === selectedId ? '#f3f0ff' : 'transparent', color: el.id === selectedId ? '#7C3AED' : '#4b5563', display: 'flex', alignItems: 'center', gap: 6 }}>
              {el.type === 'rect' && <Square size={12} />}
              {el.type === 'circle' && <CircleIcon size={12} />}
              {el.type === 'text' && <Type size={12} />}
              {el.label || el.text || el.type}
            </div>
          ))}
          {project.elements.length === 0 && <div style={{ fontSize: 12, color: '#9ca3af' }}>No layers yet</div>}
        </div>

        {selectedEl && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, marginBottom: 12, color: '#374151' }}>
              <Palette size={14} /> Properties
            </div>
            {selectedEl.type === 'text' ? (
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Text</label>
                <input value={selectedEl.text} onChange={e => updateSelected({ text: e.target.value })} style={inputStyle} />
              </div>
            ) : (
              <div style={{ marginBottom: 10 }}>
                <label style={labelStyle}>Label</label>
                <input value={selectedEl.label || ''} onChange={e => updateSelected({ label: e.target.value })} style={inputStyle} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div>
                <label style={labelStyle}>Width</label>
                <input type="number" value={Math.round(selectedEl.w)} onChange={e => updateSelected({ w: Number(e.target.value) })} style={{ ...inputStyle, width: 90 }} />
              </div>
              <div>
                <label style={labelStyle}>Height</label>
                <input type="number" value={Math.round(selectedEl.h)} onChange={e => updateSelected({ h: Number(e.target.value) })} style={{ ...inputStyle, width: 90 }} />
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Fill color</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => updateSelected({ fill: c })}
                    style={{ width: 22, height: 22, borderRadius: 6, background: c, cursor: 'pointer', border: selectedEl.fill === c ? '2px solid #111827' : '1px solid #e5e7eb' }} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const labelStyle = { fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 };
const inputStyle = { border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 8px', fontSize: 12, width: '100%', boxSizing: 'border-box' };

function CanvasElement({ el, selected, onMouseDown }) {
  const style = {
    position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h,
    cursor: 'move', userSelect: 'none',
    outline: selected ? '2px solid #7C3AED' : 'none', outlineOffset: 2,
  };
  if (el.type === 'rect') {
    return (
      <div style={{ ...style, background: el.fill, borderRadius: 8, display: 'flex', alignItems: 'flex-end', padding: 6 }} onMouseDown={onMouseDown}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)' }}>{el.label}</span>
      </div>
    );
  }
  if (el.type === 'circle') {
    return (
      <div style={{ ...style, background: el.fill, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseDown={onMouseDown}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.9)' }}>{el.label}</span>
      </div>
    );
  }
  return (
    <div style={{ ...style, fontSize: el.fontSize, color: el.fill, fontWeight: 500, display: 'flex', alignItems: 'center' }} onMouseDown={onMouseDown}>
      {el.text}
    </div>
  );
}

// ============ REPORTS ============

function Reports({ project, allProjects }) {
  const elementsByType = useMemo(() => {
    const counts = {};
    project.elements.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  }, [project.elements]);

  const activityByDay = useMemo(() => {
    const days = {};
    (project.activity || []).forEach(a => {
      const d = new Date(a.t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days[d] = (days[d] || 0) + 1;
    });
    return Object.entries(days).map(([day, events]) => ({ day, events }));
  }, [project.activity]);

  const activityByType = useMemo(() => {
    const counts = {};
    (project.activity || []).forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  }, [project.activity]);

  const projectComparison = useMemo(() => {
    return allProjects.map(p => ({
      name: p.name.length > 14 ? p.name.slice(0, 14) + '…' : p.name,
      age: Math.max(1, Math.round((Date.now() - p.createdAt) / 86400000)),
    }));
  }, [allProjects]);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Reports — {project.name}</h1>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>Live analytics generated from this project's canvas and activity log.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        <MetricCard label="Elements" value={project.elements.length} />
        <MetricCard label="Activity events" value={(project.activity || []).length} />
        <MetricCard label="Created" value={new Date(project.createdAt).toLocaleDateString()} small />
        <MetricCard label="Last updated" value={new Date(project.updatedAt).toLocaleDateString()} small />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <ChartCard title="Elements by type">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={elementsByType}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="type" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {elementsByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Activity event types">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={activityByType} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} label={({ type, count }) => `${type} (${count})`}>
                {activityByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <ChartCard title="Activity over time">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={activityByDay}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="events" stroke="#7C3AED" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Project age across workspace (days)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={projectComparison} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
              <Tooltip />
              <Bar dataKey="age" radius={[0, 6, 6, 0]} fill="#0EA5A4" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Recent activity log">
        <div style={{ maxHeight: 220, overflow: 'auto' }}>
          {(project.activity || []).slice().reverse().slice(0, 30).map((a, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 12 }}>
              <span style={{ color: '#374151' }}>{a.detail}</span>
              <span style={{ color: '#9ca3af' }}>{new Date(a.t).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

function MetricCard({ label, value, small }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: small ? 14 : 22, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#374151' }}>{title}</div>
      {children}
    </div>
  );
}

