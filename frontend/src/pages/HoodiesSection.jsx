import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../services/api';

const HoodiesSection = () => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const feeAmount = 750; // Hardcoded fixed fee for hoodies

  // Filters
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [filterOrientation, setFilterOrientation] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('initial'); // 'initial' or 'final'

  // Modals
  const [quickPayModal, setQuickPayModal] = useState({ isOpen: false, student: null });
  const [historyModal, setHistoryModal] = useState({ isOpen: false, student: null, data: [] });
  const [historyLoading, setHistoryLoading] = useState(false);

  // Forms
  const [payFormData, setPayFormData] = useState({ payment_method: 'cash', amount_paid: '', deposit_date: '', observations: '' });

  const periods = [
    { id: 'initial', name: 'Cuota inicial (abril)' },
    { id: 'final', name: 'Cuota final (mayo/junio)' }
  ];

  useEffect(() => {
    fetchWithAuth('/classes').then(res => {
      setClasses(res.data);
    });
  }, []);

  useEffect(() => {
    loadMatrix();
  }, [search, filterClass, filterShift, filterOrientation, filterStatus, filterPeriod]);

  const loadMatrix = async () => {
    setLoading(true);
    setStudents([]);
    try {
      const query = new URLSearchParams();
      query.append('period', filterPeriod);
      if (search) query.append('search', search);
      if (filterClass) query.append('class_id', filterClass);
      if (filterShift) query.append('shift', filterShift);
      if (filterOrientation) query.append('orientation', filterOrientation);
      if (filterStatus) query.append('status', filterStatus);

      const res = await fetchWithAuth(`/hoodies/payments?${query.toString()}`);
      setStudents(res.data);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (student) => {
    setHistoryModal({ isOpen: true, student, data: [] });
    setHistoryLoading(true);
    try {
      const res = await fetchWithAuth(`/hoodies/history/${student.student_id}`);
      setHistoryModal({ isOpen: true, student, data: res.data });
    } catch (err) {
      alert(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleQuickPay = async (e) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/hoodies/payments', {
        method: 'POST',
        body: JSON.stringify({
          student_id: quickPayModal.student.student_id,
          period: filterPeriod,
          status: 'paid',
          payment_method: payFormData.payment_method,
          amount_paid: Number(payFormData.amount_paid) || 0,
          deposit_date: payFormData.deposit_date || null,
          observations: payFormData.observations || null
        })
      });
      setQuickPayModal({ isOpen: false, student: null });
      loadMatrix();
    } catch (err) {
      alert(err.message);
    }
  };

  const renderStatusBadge = (st) => {
    if (st.status === 'paid') return <span className="status-badge status-ok">Pagado ({st.payment_method === 'cash' ? 'Efectivo' : 'Transf.'})</span>;
    return <span className="status-badge status-error">Pendiente</span>;
  };

  const orientations = [...new Set(classes.map(c => c.name.replace(/[0-9]+$/g, '').trim()))];

  return (
    <>
      <div className="glass-panel fade-in-up" style={{ padding: '2rem' }}>
        <div className="page-header">
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>Buzos de egresados</h1>
            <p className="text-muted">Gestión de las cuotas para los buzos (independiente de la graduación).</p>
          </div>
        </div>

        {/* Filters Top Bar */}
        <div className="filter-bar">
          <div>
            <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Período</label>
            <select className="input-field" value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}>
              {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Buscar estudiante</label>
            <input type="text" className="input-field" placeholder="Ej: Perez..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Orientación</label>
            <select className="input-field" value={filterOrientation} onChange={(e) => setFilterOrientation(e.target.value)}>
              <option value="">Todas</option>
              {orientations.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Turno</label>
            <select className="input-field" value={filterShift} onChange={(e) => setFilterShift(e.target.value)}>
              <option value="">Ambos</option>
              <option value="morning">Mañana</option>
              <option value="afternoon">Tarde</option>
            </select>
          </div>
          <div>
            <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Filtrar por clase</label>
            <select className="input-field" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
              <option value="">Todas las clases</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.shift === 'morning' ? 'Mañana' : 'Tarde'})</option>)}
            </select>
          </div>
          <div>
            <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Estado del pago</label>
            <select className="input-field" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">Todos</option>
              <option value="paid">Pagado</option>
              <option value="debtor">Pendiente</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="responsive-table">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem' }}>Estudiante</th>
                <th style={{ padding: '1rem' }}>Clase / Turno</th>
                <th style={{ padding: '1rem' }}>Monto a cobrar</th>
                <th style={{ padding: '1rem' }}>Estado del pago</th>
                <th style={{ padding: '1rem' }}>Operaciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '16px', width: '70%' }} /></td>
                    <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '16px', width: '60%' }} /></td>
                    <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '16px', width: '50%' }} /></td>
                    <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '22px', width: '80px', borderRadius: '10px' }} /></td>
                    <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '28px', width: '80px' }} /></td>
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr><td colSpan="5" className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>No hay estudiantes que hayan solicitado buzo en estos filtros.</td></tr>
              ) : (
                students.map(st => (
                  <tr key={st.student_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td data-label="Estudiante" style={{ padding: '1rem', fontWeight: '500' }}>{st.student_name}</td>
                    <td data-label="Clase / Turno" style={{ padding: '1rem' }}>{st.class_name} <span className="text-muted" style={{ fontSize: '0.85rem' }}>({st.class_shift === 'morning' ? 'Mañana' : 'Tarde'})</span></td>
                    <td data-label="Monto" style={{ padding: '1rem', color: 'var(--accent-primary)' }}>
                      ${feeAmount}
                      {st.status === 'paid' && st.amount_paid > 0 && st.amount_paid !== feeAmount && <span style={{ fontSize: '0.85rem', marginLeft: '0.5rem', color: 'var(--color-warning)' }}>(Abonó: ${st.amount_paid})</span>}
                      {st.status === 'paid' && st.amount_paid === 0 && <span style={{ fontSize: '0.85rem', marginLeft: '0.5rem', color: 'var(--text-muted)' }}>(Pendiente de ingresar valor exacto)</span>}
                    </td>
                    <td data-label="Estado" style={{ padding: '1rem' }}>{renderStatusBadge(st)}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => loadHistory(st)} className="btn-action" style={{ background: 'var(--color-info)', color: 'white' }}>Historial</button>

                        <button onClick={() => {
                          setPayFormData({
                            payment_method: st.payment_method === 'none' ? 'cash' : st.payment_method,
                            amount_paid: st.amount_paid > 0 ? st.amount_paid : feeAmount,
                            deposit_date: st.deposit_date || '',
                            observations: st.observations || ''
                          });
                          setQuickPayModal({ isOpen: true, student: st });
                        }} className="btn-action" style={{ background: st.status === 'pending' ? 'var(--color-success)' : 'var(--color-warning)', color: st.status === 'pending' ? 'white' : '#0e0c09' }}>
                          {st.status === 'pending' ? 'Cobrar' : 'Editar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {quickPayModal.isOpen && quickPayModal.student && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel modal-panel" style={{ width: '100%', maxWidth: '450px', padding: '2rem' }}>
            <h2 className="mb-2" style={{ marginTop: 0 }}>Registrar cobro de buzo</h2>
            <p className="text-muted mb-4">Estudiante: {quickPayModal.student.student_name}</p>

            <form onSubmit={handleQuickPay}>
              <div className="mb-4">
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Método de cobro</label>
                <select required className="input-field" value={payFormData.payment_method} onChange={e => setPayFormData({ ...payFormData, payment_method: e.target.value })}>
                  <option value="cash">Efectivo (Entregado a organizador)</option>
                  <option value="transfer">Transferencia</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Monto recibido</label>
                <input required type="number" min={0} className="input-field" value={payFormData.amount_paid} onChange={e => setPayFormData({ ...payFormData, amount_paid: e.target.value })} />
              </div>
              {payFormData.payment_method === 'transfer' && (
                <div className="mb-4">
                  <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Fecha en que realizó la transferencia</label>
                  <input type="date" className="input-field" value={payFormData.deposit_date} onChange={e => setPayFormData({ ...payFormData, deposit_date: e.target.value })} />
                </div>
              )}
              <div className="mb-6">
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Apuntes / Observaciones</label>
                <input type="text" className="input-field" placeholder="Ej. Monto incompleto, paga próxima semana" value={payFormData.observations} onChange={e => setPayFormData({ ...payFormData, observations: e.target.value })} />
              </div>
              <div className="flex justify-between">
                <button type="button" onClick={() => setQuickPayModal({ isOpen: false, student: null })} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>Cancelar operación</button>
                <button type="submit" className="button-primary" style={{ background: 'var(--color-success)', color: 'white' }}>Ejecutar cobro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historyModal.isOpen && historyModal.student && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel modal-panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div className="flex justify-between items-center mb-4 border-b" style={{ borderColor: 'var(--border-color)', paddingBottom: '1rem' }}>
              <h2 style={{ marginTop: 0, marginBottom: 0 }}>Historial de buzo</h2>
              <button onClick={() => setHistoryModal({ isOpen: false, student: null, data: [] })} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>
            <p className="text-muted mb-4">Estudiante: {historyModal.student.student_name}</p>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.8rem' }}>Período</th>
                  <th style={{ padding: '0.8rem' }}>Cuota</th>
                  <th style={{ padding: '0.8rem' }}>Deuda / Pago</th>
                  <th style={{ padding: '0.8rem' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr><td colSpan="4" className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>Cargando historial...</td></tr>
                ) : historyModal.data.length === 0 ? (
                  <tr><td colSpan="4" className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>No hay historial registrado.</td></tr>
                ) : (
                  historyModal.data.map(rec => {
                    return (
                      <tr key={rec.period} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.8rem', fontWeight: '500' }}>{rec.period_name}</td>
                        <td style={{ padding: '0.8rem', color: 'var(--accent-primary)' }}>${rec.amount}</td>
                        <td style={{ padding: '0.8rem' }}>
                          {rec.status === 'pending' ? <span style={{ color: 'var(--color-error)' }}>$0</span> : <span style={{ color: 'var(--color-success)' }}>+${rec.amount_paid}</span>}
                        </td>
                        <td style={{ padding: '0.8rem' }}>
                          {rec.status === 'pending' && <span className="status-badge status-error">Pendiente</span>}
                          {rec.status === 'paid' && <span className="status-badge status-ok">Pagado</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default HoodiesSection;
