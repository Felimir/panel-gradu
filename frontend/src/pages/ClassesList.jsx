import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../services/api';

const ClassesList = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const { data } = await fetchWithAuth('/classes');
      setClasses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <div className="skeleton" style={{ height: '32px', width: '220px', marginBottom: '1.5rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-panel skeleton" style={{ height: '130px' }} />
        ))}
      </div>
    </div>
  );
  if (error) return <div className="status-error">Error: {error}</div>;

  return (
    <div className="glass-panel fade-in-up" style={{ padding: '2rem' }}>
      <h1 className="mb-6">Catálogo de clases</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {classes.map(c => (
          <div key={c.id} className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(59, 130, 246, 0.04)' }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>{c.name}</h3>
            <p className="text-muted mb-4">Turno: {c.shift === 'morning' ? 'Mañana' : 'Tarde'} | Estudiantes: {c.student_count ? Number(c.student_count) : 0}</p>

            <div style={{ fontSize: '0.9rem' }}>
              {c.organizers && c.organizers.length > 0 ? (
                <span>{c.organizers.map(o => o.username).join(', ')}</span>
              ) : (
                <span className="text-muted" style={{ fontStyle: 'italic' }}>No tiene organizadores asignados</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassesList;
