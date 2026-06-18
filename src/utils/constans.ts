
export const COLORS = ['#7C3AED', '#0EA5A4', '#F97316', '#EC4899', '#3B82F6', '#22C55E', '#F59E0B', '#EF4444'];
export const FONT_FAMILIES = ['Inter', 'Arial', 'Helvetica', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana'];
export const FONT_WEIGHTS = [300, 400, 500, 600, 700, 800];
export const BORDER_STYLES: BorderStyleT[] = ['solid', 'dashed', 'dotted'];
export const TYPE_LABEL: Record<ElementType, string> = { rect: 'Rectangle', circle: 'Ellipse', text: 'Text' };

export const uid = () => Math.random().toString(36).slice(2, 10);

export const btnGhost = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8,
  border: '1px solid transparent', background: 'transparent', fontSize: 13, color: '#374151', cursor: 'pointer',
};
export const btnActive = { ...btnGhost, background: '#f3f0ff', color: '#7C3AED', border: '1px solid #ddd6fe' };

export const btnIcon: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8,
  border: '1px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer',
};

export const makeStyle = (overrides?: Partial<ElementStyle>): ElementStyle => ({
  opacity: 100,
  rotation: 0,
  borderWidth: 0,
  borderColor: '#111827',
  borderStyle: 'solid',
  borderRadius: 8,
  shadow: false,
  shadowColor: '#000000',
  shadowBlur: 12,
  shadowX: 0,
  shadowY: 4,
  ...overrides,
});

export const makeTypography = (overrides?: Partial<Typography>): Typography => ({
  fontFamily: 'Inter',
  fontWeight: 500,
  fontSize: 16,
  lineHeight: 1.4,
  letterSpacing: 0,
  textAlign: 'left',
  ...overrides,
});

export const nextName = (elements: CanvasElement[], type: ElementType) => {
  const n = elements.filter(e => e.type === type).length + 1;
  return `${TYPE_LABEL[type]} ${n}`;
};

export const DEFAULT_PROJECT = (name?: string): Project => ({
  id: uid(),
  name: name || 'Untitled project',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  thumbnailColor: COLORS[Math.floor(Math.random() * COLORS.length)],
  elements: [],
  connections: [],
  comments: [],
  activity: [{ t: Date.now(), type: 'created', detail: 'Project created' }],
});

// Defensive migration so older saved projects always render correctly
export function normalizeElement(e: any): CanvasElement {
  const style = { ...makeStyle(), ...(e.style || {}) };
  if (e.type === 'text') {
    return {
      ...e,
      style,
      typography: { ...makeTypography(), ...(e.typography || {}) },
      name: e.name || 'Text',
    };
  }
  return { ...e, style, name: e.name || (e.type === 'rect' ? 'Rectangle' : 'Ellipse') };
}

export function normalizeProject(p: Project): Project {
  return {
    ...p,
    connections: p.connections || [],
    comments: p.comments || [],
    elements: (p.elements || []).map(normalizeElement),
  };
}

export const labelStyle: React.CSSProperties = { fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 };
export const inputStyle: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 6, padding: '6px 8px', fontSize: 12, width: '100%', boxSizing: 'border-box' };
export const tabBtn = (active: boolean): React.CSSProperties => ({
  flex: 1, fontSize: 12, padding: '7px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
  background: active ? '#f3f0ff' : 'transparent', color: active ? '#7C3AED' : '#6b7280', fontWeight: active ? 600 : 400,
});