import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../services/api';

const FeesSection = () => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFee, setGlobalFee] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [filterOrientation, setFilterOrientation] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth, setFilterMonth] = useState(4); // April default

  // Modals
  const [configModal, setConfigModal] = useState({ isOpen: false });
  const [quickPayModal, setQuickPayModal] = useState({ isOpen: false, student: null });
  const [historyModal, setHistoryModal] = useState({ isOpen: false, student: null, data: [] });
  const [historyLoading, setHistoryLoading] = useState(false);

  // Forms
  const [feeAmount, setFeeAmount] = useState('');
  const [payFormData, setPayFormData] = useState({ payment_method: 'cash', amount_paid: '', deposit_date: '', observations: '' });

  const months = [
    { id: 4, name: 'Abril' }, { id: 5, name: 'Mayo' }, { id: 6, name: 'Junio' },
    { id: 7, name: 'Julio' }, { id: 8, name: 'Agosto' }, { id: 9, name: 'Septiembre' },
    { id: 10, name: 'Octubre' }, { id: 11, name: 'Noviembre' }, { id: 12, name: 'Diciembre' }
  ];

  useEffect(() => {
    fetchWithAuth('/classes').then(res => {
      setClasses(res.data);
    });
  }, []);

  useEffect(() => {
    loadMatrix();
  }, [search, filterClass, filterShift, filterOrientation, filterStatus, filterMonth]);

  const loadMatrix = async () => {
    setLoading(true);
    setStudents([]);
    try {
      const query = new URLSearchParams();
      query.append('month', filterMonth);
      query.append('year', 2026);
      if (search) query.append('search', search);
      if (filterClass) query.append('class_id', filterClass);
      if (filterShift) query.append('shift', filterShift);
      if (filterOrientation) query.append('orientation', filterOrientation);
      if (filterStatus) query.append('status', filterStatus);

      const res = await fetchWithAuth(`/fees/payments?${query.toString()}`);
      setStudents(res.data);
      setGlobalFee(res.fee_amount || 0);
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
      const res = await fetchWithAuth(`/fees/history/${student.student_id}?year=2026`);
      setHistoryModal({ isOpen: true, student, data: res.data });
    } catch (err) {
      alert(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/fees/config', {
        method: 'POST',
        body: JSON.stringify({ period_month: filterMonth, period_year: 2026, amount: Number(feeAmount) })
      });
      setConfigModal({ isOpen: false });
      loadMatrix();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleQuickPay = async (e) => {
    e.preventDefault();
    try {
      await fetchWithAuth('/fees/payments', {
        method: 'POST',
        body: JSON.stringify({
          student_id: quickPayModal.student.student_id,
          period_month: filterMonth,
          period_year: 2026,
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
    if (st.status === 'covered_by_raffles') return <span className="status-badge" style={{ background: 'var(--color-purple)', color: 'white' }}>Cubierto c/Rifas</span>;
    return <span className="status-badge status-error">Pendiente</span>;
  };

  const orientations = [...new Set(classes.map(c => c.name.replace(/[0-9]+$/g, '').trim()))];

  return (
    <>
      <div className="glass-panel fade-in-up" style={{ padding: '2rem' }}>
        <div className="page-header">
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>Control de cuotas</h1>
            <p className="text-muted">Abonos, seguimientos y liquidaciones mensuales. Usar esta sección solo para estudiantes que durante este mes <br />no hayan solicitado ni pagado su cuota con rifas (para eso usar la sección Rifas).</p>
          </div>
          <button
            className="button-primary"
            style={{ background: 'var(--text-muted)' }}
            onClick={() => { setFeeAmount(globalFee || 1500); setConfigModal({ isOpen: true }); }}
          >
            Configurar cuota mensual
          </button>
        </div>

        {/* Filters Top Bar */}
        <div className="filter-bar">
          <div>
            <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Mes</label>
            <select className="input-field" value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))}>
              {months.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
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
            <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Estado del mes</label>
            <select className="input-field" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">Todos</option>
              <option value="paid">Al día</option>
              <option value="debtor">Deudor / Pendiente</option>
            </select>
          </div>
        </div>

        {globalFee === null && !loading ? (
          <div className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>
            Este mes aún no tiene un precio base configurado. Utiliza el botón "Configurar cuota mensual" para establecerlo y destrabar la planilla.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="responsive-table">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem' }}>Estudiante</th>
                  <th style={{ padding: '1rem' }}>Clase / Turno</th>
                  <th style={{ padding: '1rem' }}>Monto a cobrar</th>
                  <th style={{ padding: '1rem' }}>Estado del mes</th>
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
                  <tr><td colSpan="5" className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>No hay estudiantes para estos filtros.</td></tr>
                ) : (
                  students.map(st => (
                    <tr key={st.student_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td data-label="Estudiante" style={{ padding: '1rem', fontWeight: '500' }}>{st.student_name}</td>
                      <td data-label="Clase / Turno" style={{ padding: '1rem' }}>{st.class_name} <span className="text-muted" style={{ fontSize: '0.85rem' }}>({st.class_shift === 'morning' ? 'Mañana' : 'Tarde'})</span></td>
                      <td data-label="Monto" style={{ padding: '1rem', color: 'var(--accent-primary)' }}>
                        ${globalFee}
                        {st.status === 'paid' && st.amount_paid > 0 && st.amount_paid !== globalFee && <span style={{ fontSize: '0.85rem', marginLeft: '0.5rem', color: 'var(--color-warning)' }}>(Abonó: ${st.amount_paid})</span>}
                        {st.status === 'paid' && st.amount_paid === 0 && <span style={{ fontSize: '0.85rem', marginLeft: '0.5rem', color: 'var(--text-muted)' }}>(Pendiente de ingresar valor exacto)</span>}
                      </td>
                      <td data-label="Estado" style={{ padding: '1rem' }}>{renderStatusBadge(st)}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => loadHistory(st)} className="btn-action" style={{ background: 'var(--color-info)', color: 'white' }}>Historial</button>

                          <button onClick={() => {
                            setPayFormData({
                              payment_method: st.payment_method === 'none' ? 'cash' : st.payment_method,
                              amount_paid: st.amount_paid > 0 ? st.amount_paid : globalFee || '',
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
        )}
      </div>

      {configModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel modal-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
            <h2 className="mb-4" style={{ marginTop: 0 }}>Fijar cuota ({months.find(m => m.id === filterMonth)?.name})</h2>
            <form onSubmit={handleSaveConfig}>
              <div className="mb-6">
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Importe exacto</label>
                <input required type="number" min={0} className="input-field" value={feeAmount} onChange={e => setFeeAmount(e.target.value)} />
              </div>
              <div className="flex justify-between">
                <button type="button" onClick={() => setConfigModal({ isOpen: false })} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" className="button-primary">Guardar cuota</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {quickPayModal.isOpen && quickPayModal.student && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel modal-panel" style={{ width: '100%', maxWidth: '450px', padding: '2rem' }}>
            <h2 className="mb-2" style={{ marginTop: 0 }}>Registrar cobro</h2>
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
              <h2 style={{ marginTop: 0, marginBottom: 0 }}>Historial financiero</h2>
              <button onClick={() => setHistoryModal({ isOpen: false, student: null, data: [] })} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>
            <p className="text-muted mb-4">Estudiante: {historyModal.student.student_name}</p>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.8rem' }}>Mes</th>
                  <th style={{ padding: '0.8rem' }}>Cuota</th>
                  <th style={{ padding: '0.8rem' }}>Deuda / Pago</th>
                  <th style={{ padding: '0.8rem' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr><td colSpan="4" className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>Tirando de la calculadora...</td></tr>
                ) : historyModal.data.length === 0 ? (
                  <tr><td colSpan="4" className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>No hay historial registrado.</td></tr>
                ) : (
                  months.map(m => {
                    const rec = historyModal.data.find(d => d.period_month === m.id);
                    if (!rec) return (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.8rem' }}>{m.name}</td>
                        <td colSpan="3" style={{ padding: '0.8rem' }} className="text-muted">Aún sin tarifar</td>
                      </tr>
                    );
                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.8rem', fontWeight: '500' }}>{m.name}</td>
                        <td style={{ padding: '0.8rem', color: 'var(--accent-primary)' }}>${rec.amount}</td>
                        <td style={{ padding: '0.8rem' }}>
                          {rec.status === 'pending' ? <span style={{ color: 'var(--color-error)' }}>$0</span> : <span style={{ color: 'var(--color-success)' }}>+${rec.amount_paid}</span>}
                        </td>
                        <td style={{ padding: '0.8rem' }}>
                          {rec.status === 'pending' && <span className="status-badge status-error">Pendiente</span>}
                          {rec.status === 'paid' && <span className="status-badge status-ok">Pagado</span>}
                          {rec.status === 'covered_by_raffles' && <span className="status-badge" style={{ background: 'var(--color-purple)', color: 'white' }}>Por rifas</span>}
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

export default FeesSection;
