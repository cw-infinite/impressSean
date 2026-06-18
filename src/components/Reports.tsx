import { COLORS } from '@/utils/constans';
import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ReportsProps {
  project: Project;
  allProjects: ProjectMeta[];
}

export function Reports({ project, allProjects }: ReportsProps) {
  const elementsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    project.elements.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  }, [project.elements]);

  const activityByDay = useMemo(() => {
    const days: Record<string, number> = {};
    (project.activity || []).forEach(a => {
      const d = new Date(a.t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days[d] = (days[d] || 0) + 1;
    });
    return Object.entries(days).map(([day, events]) => ({ day, events }));
  }, [project.activity]);

  const activityByType = useMemo(() => {
    const counts: Record<string, number> = {};
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 28 }}>
        <MetricCard label="Elements" value={project.elements.length} />
        <MetricCard label="Connectors" value={project.connections.length} />
        <MetricCard label="Comments" value={project.comments.length} />
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
              <Pie data={activityByType} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={80} label={({ type, count }: any) => `${type} (${count})`}>
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

function MetricCard({ label, value, small }: { label: string; value: string | number; small?: boolean }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px' }}>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: small ? 14 : 22, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, color: '#374151' }}>{title}</div>
      {children}
    </div>
  );
}