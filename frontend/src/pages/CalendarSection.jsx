import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../services/api';
import { Calendar, CalendarDays, ChevronLeft, ChevronRight, List, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { es } from 'date-fns/locale/es';

registerLocale('es', es);

const TYPE_CONFIG = {
  canteen: { label: 'Cantina', color: '#F59E0B', bg: 'rgba(245,158,11,0.13)' },
  payment_deadline: { label: 'Venc. cuota', color: '#EF4444', bg: 'rgba(239,68,68,0.13)' },
  internal_event: { label: 'Evento interno', color: '#3B82F6', bg: 'rgba(59,130,246,0.13)' },
  milestone: { label: 'Hito', color: '#8B5CF6', bg: 'rgba(139,92,246,0.13)' },
};

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const EMPTY_FORM = { title: '', event_type: 'canteen', event_date: '', class_id: '', assigned_student_id: '', notes: '' };

const CalendarSection = () => {
  const today = new Date();

  // Asegurar que el estado inicial esté dentro del rango Marzo-Diciembre 2026
  let initialMonth = today.getMonth() + 1;
  let initialYear = today.getFullYear();

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [viewMode, setViewMode] = useState('month');
  const [events, setEvents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const rawUser = localStorage.getItem('user');
  const user = rawUser ? JSON.parse(rawUser) : null;
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadClasses();
    loadStudents();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [currentMonth, currentYear]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/calendar?month=${currentMonth}&year=${currentYear}`);
      setEvents(res.data || []);
    } catch {
      toast.error('Error cargando eventos del calendario');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await fetchWithAuth('/classes');
      setClasses(res.data || []);
    } catch { }
  };

  const loadStudents = async () => {
    try {
      const res = await fetchWithAuth('/students?status=active');
      setStudents(res.data || []);
    } catch { }
  };

  const MIN_MONTH = 3; const MIN_YEAR = 2026;
  const MAX_MONTH = 12; const MAX_YEAR = 2026;
  const canGoPrev = !(currentMonth === MIN_MONTH && currentYear === MIN_YEAR);
  const canGoNext = !(currentMonth === MAX_MONTH && currentYear === MAX_YEAR);

  const navigateMonth = (dir) => {
    let m = currentMonth + dir;
    let y = currentYear;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    if (y < MIN_YEAR || (y === MIN_YEAR && m < MIN_MONTH)) return;
    if (y > MAX_YEAR || (y === MAX_YEAR && m > MAX_MONTH)) return;
    setCurrentMonth(m);
    setCurrentYear(y);
  };

  const filteredEvents = events.filter(e => {
    if (filterType && e.event_type !== filterType) return false;
    if (filterClass && String(e.class_id) !== filterClass) return false;
    return true;
  });

  const getEventsForDay = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter(e => (e.event_date || '').split('T')[0] === dateStr);
  };

  const buildGrid = () => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };

  const isToday = (day) =>
    today.getDate() === day &&
    today.getMonth() + 1 === currentMonth &&
    today.getFullYear() === currentYear;

  const openNew = (day = null) => {
    const dateStr = day
      ? `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      : '';
    setEditEvent(null);
    setFormData({ ...EMPTY_FORM, event_date: dateStr });
    setModalOpen(true);
  };

  const openEdit = (ev) => {
    setEditEvent(ev);
    setFormData({
      title: ev.title,
      event_type: ev.event_type,
      event_date: (ev.event_date || '').split('T')[0],
      class_id: ev.class_id ? String(ev.class_id) : '',
      assigned_student_id: ev.assigned_student_id ? String(ev.assigned_student_id) : '',
      notes: ev.notes || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditEvent(null);
    setFormData(EMPTY_FORM);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.event_date) return;
    setSaving(true);
    try {
      const payload = {
        ...formData,
        class_id: formData.class_id || null,
        assigned_student_id: formData.assigned_student_id || null,
      };
      if (editEvent) {
        await fetchWithAuth(`/calendar/${editEvent.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast.success('Evento actualizado');
      } else {
        await fetchWithAuth('/calendar', { method: 'POST', body: JSON.stringify(payload) });
        toast.success('Evento creado');
      }
      closeModal();
      loadEvents();
    } catch (err) {
      toast.error(err.message || 'Error guardando evento');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fetchWithAuth(`/calendar/${confirmDelete}`, { method: 'DELETE' });
      toast.success('Evento eliminado');
      setConfirmDelete(null);
      closeModal();
      loadEvents();
    } catch (err) {
      toast.error(err.message || 'Error eliminando evento');
    }
  };

  const formatDate = (raw) => {
    if (!raw) return '—';
    const [y, m, d] = (raw.split('T')[0]).split('-');
    return `${d}/${m}/${y}`;
  };

  const shiftLabel = (s) => (s === 'morning' ? 'Mañana' : 'Tarde');

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="glass-panel fade-in-up" style={{ padding: '2rem' }}>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>Calendario operativo</h1>
            <p className="text-muted">Cantina, vencimientos, hitos y eventos internos</p>
          </div>
          <button onClick={() => openNew()} className="button-primary">+ Nuevo evento</button>
        </div>

        {/* Controls bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem' }}>

          {/* Month navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => navigateMonth(-1)}
              disabled={!canGoPrev}
              style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.35rem 0.55rem', cursor: canGoPrev ? 'pointer' : 'default', color: 'var(--text-main)', display: 'flex', alignItems: 'center', opacity: canGoPrev ? 1 : 0.25, transition: 'opacity 0.2s' }}
            >
              <ChevronLeft size={17} />
            </button>
            <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.05rem', minWidth: '190px', textAlign: 'center', letterSpacing: '-0.01em' }}>
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              disabled={!canGoNext}
              style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.35rem 0.55rem', cursor: canGoNext ? 'pointer' : 'default', color: 'var(--text-main)', display: 'flex', alignItems: 'center', opacity: canGoNext ? 1 : 0.25, transition: 'opacity 0.2s' }}
            >
              <ChevronRight size={17} />
            </button>
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', gap: '0', background: 'var(--bg-raised)', borderRadius: '8px', padding: '3px' }}>
            {[
              { key: 'month', icon: <CalendarDays size={14} />, label: 'Mes' },
              { key: 'list', icon: <List size={14} />, label: 'Lista' },
            ].map(v => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key)}
                style={{
                  padding: '0.35rem 0.85rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  background: viewMode === v.key ? 'var(--accent-primary)' : 'transparent',
                  color: viewMode === v.key ? 'white' : 'var(--text-muted)',
                  fontWeight: 600, fontSize: '0.82rem',
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  transition: 'all 0.2s',
                }}
              >{v.icon} {v.label}</button>
            ))}
          </div>

          {/* Filters */}
          <select className="input-field" style={{ width: 'auto', minWidth: '160px' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Todos los tipos</option>
            {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>

          <select className="input-field" style={{ width: 'auto', minWidth: '180px' }} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
            <option value="">Todas las clases</option>
            {classes.map(c => (
              <option key={c.id} value={String(c.id)}>{c.name} ({shiftLabel(c.shift)})</option>
            ))}
          </select>
        </div>

        {/* ── MONTH VIEW ─────────────────────────────────────────────────────── */}
        {viewMode === 'month' && (
          <div>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
              {DAY_NAMES.map(d => (
                <div key={d} style={{ textAlign: 'center', padding: '0.4rem 0', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{d}</div>
              ))}
            </div>

            {/* Grid cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {loading ? (
                Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} style={{ minHeight: '88px', background: 'var(--bg-raised)', borderRadius: '8px', padding: '0.5rem' }}>
                    <div className="skeleton" style={{ width: '24px', height: '18px', borderRadius: '4px', marginBottom: '6px' }} />
                    <div className="skeleton" style={{ width: '85%', height: '12px', borderRadius: '3px' }} />
                  </div>
                ))
              ) : (
                buildGrid().map((day, idx) => {
                  if (!day) return <div key={`e-${idx}`} style={{ minHeight: '88px' }} />;
                  const dayEvents = getEventsForDay(day);
                  const today_ = isToday(day);
                  return (
                    <div
                      key={day}
                      onClick={() => openNew(day)}
                      style={{
                        minHeight: '88px',
                        background: today_ ? 'rgba(59,130,246,0.07)' : 'var(--bg-raised)',
                        borderRadius: '8px',
                        padding: '0.45rem',
                        cursor: 'pointer',
                        border: today_ ? '1px solid rgba(59,130,246,0.38)' : '1px solid transparent',
                        transition: 'border-color 0.15s',
                        overflow: 'hidden',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = today_ ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.18)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = today_ ? 'rgba(59,130,246,0.38)' : 'transparent'; }}
                    >
                      <div style={{
                        fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px',
                        width: '22px', height: '22px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '50%',
                        color: today_ ? 'var(--accent-primary)' : 'var(--text-main)',
                        background: today_ ? 'rgba(59,130,246,0.18)' : 'transparent',
                      }}>{day}</div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {dayEvents.slice(0, 3).map(ev => {
                          const tc = TYPE_CONFIG[ev.event_type] || TYPE_CONFIG.internal_event;
                          return (
                            <div
                              key={ev.id}
                              onClick={e => { e.stopPropagation(); openEdit(ev); }}
                              title={ev.title}
                              style={{
                                fontSize: '0.7rem', fontWeight: 600, borderRadius: '3px',
                                padding: '1px 5px',
                                background: tc.bg, color: tc.color,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                cursor: 'pointer',
                              }}
                            >{ev.title}</div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', paddingLeft: '5px' }}>
                            +{dayEvents.length - 3} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── LIST VIEW ──────────────────────────────────────────────────────── */}
        {viewMode === 'list' && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Fecha</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Tipo</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Evento</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Clase</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Asignado</th>
                  <th style={{ padding: '0.75rem 1rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} style={{ padding: '1rem' }}>
                          <div className="skeleton" style={{ height: '14px', width: '80%', borderRadius: '4px' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-muted" style={{ padding: '3rem', textAlign: 'center' }}>
                      No hay eventos para este mes.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map(ev => {
                    const tc = TYPE_CONFIG[ev.event_type] || TYPE_CONFIG.internal_event;
                    return (
                      <tr key={ev.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{formatDate(ev.event_date)}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', background: tc.bg, color: tc.color, fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {tc.label}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 600 }}>{ev.title}</div>
                          {ev.notes && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{ev.notes}</div>}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                          {ev.class_name ? `${ev.class_name} (${shiftLabel(ev.class_shift)})` : '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                          {ev.student_name || '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <button
                            onClick={() => openEdit(ev)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', display: 'flex', alignItems: 'center' }}
                          >
                            <Pencil size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: v.color, flexShrink: 0 }} />
              {v.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── EVENT MODAL ───────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem', overflowY: 'auto' }}>
          <div className="glass-panel modal-panel" style={{ width: '100%', maxWidth: '460px', padding: '2rem', maxHeight: 'calc(100dvh - 2rem)', overflowY: 'auto', margin: 'auto' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>{editEvent ? 'Editar evento' : 'Nuevo evento'}</h2>

            <form onSubmit={handleSave}>
              {/* Type selector */}
              <div className="mb-4">
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Tipo de evento</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {Object.entries(TYPE_CONFIG).map(([k, v]) => {
                    const active = formData.event_type === k;
                    return (
                      <button
                        key={k} type="button"
                        onClick={() => setFormData(f => ({ ...f, event_type: k, assigned_student_id: '' }))}
                        style={{
                          padding: '0.55rem', borderRadius: '6px', cursor: 'pointer',
                          border: `1px solid ${active ? v.color : 'var(--border-color)'}`,
                          background: active ? v.bg : 'transparent',
                          color: active ? v.color : 'var(--text-muted)',
                          fontWeight: 600, fontSize: '0.82rem',
                          transition: 'all 0.2s',
                        }}
                      >{v.label}</button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Título <span style={{ color: '#EF4444' }}>*</span></label>
                <input
                  required type="text" className="input-field"
                  placeholder={formData.event_type === 'canteen' ? 'Ej: Cantina turno mañana' : 'Nombre del evento'}
                  value={formData.title}
                  onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                />
              </div>

              {/* Date */}
              <div className="mb-4">
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Fecha <span style={{ color: '#EF4444' }}>*</span></label>
                <div className="input-group-with-icon">
                  <Calendar size={18} className="input-icon" />
                  <DatePicker
                    selected={formData.event_date ? new Date(formData.event_date + 'T12:00:00') : null}
                    onChange={(date) => setFormData(f => ({ ...f, event_date: date ? date.toISOString().split('T')[0] : '' }))}
                    dateFormat="dd / MM / yyyy"
                    locale="es"
                    className="input-field"
                    minDate={new Date('2026-03-01T12:00:00')}
                    maxDate={new Date('2026-12-31T23:59:59')}
                    required
                  />
                </div>
              </div>

              {/* Class */}
              <div className="mb-4">
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Clase (opcional)</label>
                <select
                  className="input-field"
                  value={formData.class_id}
                  onChange={e => setFormData(f => ({ ...f, class_id: e.target.value, assigned_student_id: '' }))}
                >
                  <option value="">Sin clase asignada</option>
                  {classes.map(c => (
                    <option key={c.id} value={String(c.id)}>{c.name} ({shiftLabel(c.shift)})</option>
                  ))}
                </select>
              </div>

              {/* Assigned student — only for canteen */}
              {formData.event_type === 'canteen' && (
                <div className="mb-4">
                  <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Estudiante asignado (cantina)</label>
                  <select
                    className="input-field"
                    value={formData.assigned_student_id}
                    onChange={e => setFormData(f => ({ ...f, assigned_student_id: e.target.value }))}
                  >
                    <option value="">Sin estudiante asignado</option>
                    {students
                      .filter(s => !formData.class_id || String(s.class_id) === formData.class_id)
                      .map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)
                    }
                  </select>
                </div>
              )}

              {/* Notes */}
              <div className="mb-6">
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Notas</label>
                <textarea
                  className="input-field" rows={2}
                  placeholder="Observaciones adicionales..."
                  value={formData.notes}
                  onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  <button type="button" onClick={closeModal} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', padding: '0.5rem 0.75rem' }}>
                    Cancelar
                  </button>
                  {isAdmin && editEvent && (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(editEvent.id)}
                      style={{ background: 'transparent', color: 'var(--color-error)', border: 'none', cursor: 'pointer', padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                  )}
                </div>
                <button type="submit" className="button-primary" disabled={saving}>
                  {saving ? 'Guardando...' : editEvent ? 'Guardar cambios' : 'Crear evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CONFIRM DELETE MODAL ──────────────────────────────────────────────── */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '1rem' }}>
          <div className="glass-panel modal-panel" style={{ width: '100%', maxWidth: '360px', padding: '2rem', textAlign: 'center' }}>
            <Trash2 size={30} style={{ color: 'var(--color-error)', marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>¿Eliminar evento?</h3>
            <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{ padding: '0.6rem 1.4rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer' }}
              >Cancelar</button>
              <button
                onClick={handleDelete}
                style={{ padding: '0.6rem 1.4rem', background: 'var(--color-error)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, cursor: 'pointer' }}
              >Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CalendarSection;
