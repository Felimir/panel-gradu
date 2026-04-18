import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Eye, X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { fetchWithAuth } from '../services/api';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { es } from 'date-fns/locale/es';

registerLocale('es', es);

const ENTITY_LABELS = {
  session: 'Sesión',
  user: 'Usuario',
  student: 'Estudiante',
  payment: 'Pago',
  raffle_log: 'Rifa',
  transaction: 'Transacción',
  fee_config: 'Config. cuota',
  event: 'Evento',
};

const ACTION_LABELS = {
  login: 'Login',
  create: 'Crear',
  update: 'Actualizar',
  delete: 'Eliminar',
  deactivate: 'Desactivar',
  activate: 'Activar',
  payment_recorded: 'Pago registrado',
  fee_covered_by_raffles: 'Cubierto por rifas',
};

const ENTITY_COLORS = {
  session: '#8B5CF6',
  user: '#3B82F6',
  student: '#22C55E',
  payment: '#F59E0B',
  raffle_log: '#F97316',
  transaction: '#14B8A6',
  fee_config: '#06B6D4',
  event: '#6366F1',
};

const ACTION_COLORS = {
  login: '#8B5CF6',
  create: '#22C55E',
  update: '#3B82F6',
  delete: '#EF4444',
  deactivate: '#EF4444',
  activate: '#22C55E',
  payment_recorded: '#F59E0B',
  fee_covered_by_raffles: '#F59E0B',
};

const badgeStyle = (color) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 10px',
  borderRadius: '999px',
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.02em',
  background: color + '22',
  color: color,
  border: `1px solid ${color}44`,
});

const formatDate = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('es-UY', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const EMPTY_FILTERS = { entity: '', action: '', user_id: '', date_from: '', date_to: '' };

export default function AuditLogsSection() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  const rawUser = localStorage.getItem('user');
  const currentUser = rawUser ? JSON.parse(rawUser) : null;

  useEffect(() => {
    fetchWithAuth('/users').then((res) => setUsers(res.data || [])).catch(() => {});
  }, []);

  const fetchLogs = useCallback(async (activeFilters, page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page });
      if (activeFilters.entity) params.set('entity', activeFilters.entity);
      if (activeFilters.action) params.set('action', activeFilters.action);
      if (activeFilters.user_id) params.set('user_id', activeFilters.user_id);
      if (activeFilters.date_from) params.set('date_from', activeFilters.date_from);
      if (activeFilters.date_to) params.set('date_to', activeFilters.date_to);

      const res = await fetchWithAuth(`/audit?${params.toString()}`);
      setLogs(res.data || []);
      setPagination({ total: res.total, page: res.page, pages: res.pages });
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(appliedFilters, pagination.page);
  }, [appliedFilters, pagination.page, fetchLogs]);

  const handleApplyFilters = () => {
    setPagination((p) => ({ ...p, page: 1 }));
    setAppliedFilters({ ...filters });
  };

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination((p) => ({ ...p, page: newPage }));
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="glass-panel fade-in-up" style={{ textAlign: 'center', padding: '3rem' }}>
        <ShieldCheck size={40} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
        <p className="text-muted">Solo los administradores pueden acceder a la auditoría.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel fade-in-up" style={{ padding: '1.75rem 2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <ShieldCheck size={22} style={{ color: 'var(--accent-primary)' }} strokeWidth={1.75} />
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Auditoría del sistema</h2>
        <span className="text-muted" style={{ marginLeft: 'auto', fontSize: '0.85rem' }}>
          {pagination.total} registro{pagination.total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filtros */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1.25rem',
      }}>
        <select
          className="input-field"
          value={filters.entity}
          onChange={(e) => setFilters((f) => ({ ...f, entity: e.target.value }))}
        >
          <option value="">Todos los módulos</option>
          {Object.entries(ENTITY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          className="input-field"
          value={filters.action}
          onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
        >
          <option value="">Todas las acciones</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          className="input-field"
          value={filters.user_id}
          onChange={(e) => setFilters((f) => ({ ...f, user_id: e.target.value }))}
        >
          <option value="">Todos los usuarios</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.username}</option>
          ))}
        </select>

        <div className="input-group-with-icon">
          <Calendar size={18} className="input-icon" />
          <DatePicker
            selected={filters.date_from ? new Date(filters.date_from + 'T12:00:00') : null}
            onChange={(date) => setFilters((f) => ({ ...f, date_from: date ? date.toISOString().split('T')[0] : '' }))}
            dateFormat="dd / MM / yyyy"
            locale="es"
            placeholderText="Desde"
            className="input-field"
          />
        </div>
 
        <div className="input-group-with-icon">
          <Calendar size={18} className="input-icon" />
          <DatePicker
            selected={filters.date_to ? new Date(filters.date_to + 'T12:00:00') : null}
            onChange={(date) => setFilters((f) => ({ ...f, date_to: date ? date.toISOString().split('T')[0] : '' }))}
            dateFormat="dd / MM / yyyy"
            locale="es"
            placeholderText="Hasta"
            className="input-field"
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="button-primary" style={{ flex: 1 }} onClick={handleApplyFilters}>
            Filtrar
          </button>
          <button
            onClick={handleClearFilters}
            style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Fecha/hora', 'Actor', 'Módulo', 'Acción', 'ID registro', 'Detalle'].map((h) => (
                <th key={h} style={{
                  padding: '0.75rem 0.75rem',
                  textAlign: 'left',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} style={{ padding: '0.75rem' }}>
                      <div className="skeleton" style={{ height: '16px', borderRadius: '4px', width: j === 0 ? '140px' : j === 4 ? '40px' : '80px' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No hay registros con los filtros aplicados.
                </td>
              </tr>
            ) : (
              logs.map((log, i) => (
                <tr
                  key={log.id}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    animationDelay: `${i * 0.02}s`,
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '0.75rem', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatDate(log.created_at)}
                  </td>
                  <td style={{ padding: '0.75rem', fontWeight: 500 }}>
                    {log.actor_name || <span className="text-muted">Sistema</span>}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={badgeStyle(ENTITY_COLORS[log.entity] || '#64748B')}>
                      {ENTITY_LABELS[log.entity] || log.entity}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={badgeStyle(ACTION_COLORS[log.action] || '#64748B')}>
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    {log.entity_id ?? '—'}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <button
                      onClick={() => setSelectedLog(log)}
                      style={{
                        background: 'none',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.8rem',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                        e.currentTarget.style.color = 'var(--accent-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.color = 'var(--text-muted)';
                      }}
                    >
                      <Eye size={13} /> Ver
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {pagination.pages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '6px 14px', borderRadius: '8px', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
              border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
              color: pagination.page <= 1 ? 'var(--text-subtle)' : 'var(--text-muted)',
              fontSize: '0.875rem', transition: 'all 0.15s ease',
            }}
          >
            <ChevronLeft size={15} /> Anterior
          </button>
          <span className="text-muted" style={{ fontSize: '0.875rem' }}>
            Página <strong style={{ color: 'var(--text-main)' }}>{pagination.page}</strong> de {pagination.pages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '6px 14px', borderRadius: '8px', cursor: pagination.page >= pagination.pages ? 'not-allowed' : 'pointer',
              border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
              color: pagination.page >= pagination.pages ? 'var(--text-subtle)' : 'var(--text-muted)',
              fontSize: '0.875rem', transition: 'all 0.15s ease',
            }}
          >
            Siguiente <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* Modal de detalle */}
      {selectedLog && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
          onClick={(e) => e.target === e.currentTarget && setSelectedLog(null)}
        >
          <div className="glass-panel modal-panel" style={{ maxWidth: '600px', width: '100%', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Detalle del registro</h3>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <div className="text-muted" style={{ marginBottom: '4px', fontSize: '0.75rem' }}>Fecha/hora</div>
                  <div style={{ fontVariantNumeric: 'tabular-nums' }}>{formatDate(selectedLog.created_at)}</div>
                </div>
                <div>
                  <div className="text-muted" style={{ marginBottom: '4px', fontSize: '0.75rem' }}>Actor</div>
                  <div>{selectedLog.actor_name || 'Sistema'}</div>
                </div>
                <div>
                  <div className="text-muted" style={{ marginBottom: '4px', fontSize: '0.75rem' }}>Módulo</div>
                  <span style={badgeStyle(ENTITY_COLORS[selectedLog.entity] || '#64748B')}>
                    {ENTITY_LABELS[selectedLog.entity] || selectedLog.entity}
                  </span>
                </div>
                <div>
                  <div className="text-muted" style={{ marginBottom: '4px', fontSize: '0.75rem' }}>Acción</div>
                  <span style={badgeStyle(ACTION_COLORS[selectedLog.action] || '#64748B')}>
                    {ACTION_LABELS[selectedLog.action] || selectedLog.action}
                  </span>
                </div>
                {selectedLog.entity_id != null && (
                  <div>
                    <div className="text-muted" style={{ marginBottom: '4px', fontSize: '0.75rem' }}>ID registro</div>
                    <div style={{ fontVariantNumeric: 'tabular-nums' }}>{selectedLog.entity_id}</div>
                  </div>
                )}
              </div>

              {selectedLog.metadata && (
                <div>
                  <div className="text-muted" style={{ marginBottom: '6px', fontSize: '0.75rem' }}>Metadatos</div>
                  <pre style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    margin: 0,
                    fontSize: '0.8rem',
                    color: 'var(--text-main)',
                    overflowX: 'auto',
                    fontFamily: 'monospace',
                    lineHeight: 1.6,
                  }}>
                    {JSON.stringify(
                      typeof selectedLog.metadata === 'string'
                        ? JSON.parse(selectedLog.metadata)
                        : selectedLog.metadata,
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
