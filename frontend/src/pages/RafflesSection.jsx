import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../services/api';
import toast from 'react-hot-toast';

const RafflesSection = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [filterOrientation, setFilterOrientation] = useState('');
  const [filterMonth, setFilterMonth] = useState(4); // April default

  // Modals
  const [transactionModal, setTransactionModal] = useState({ isOpen: false, student: null });
  const [transactionForm, setTransactionForm] = useState({
    action_type: 'delivered_to_student',
    quantity: '',
    deposit_status: 'pending' // only used if returned_sold
  });

  const [historyModal, setHistoryModal] = useState({ isOpen: false, student: null, data: [] });
  const [historyLoading, setHistoryLoading] = useState(false);

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
  }, [search, filterClass, filterShift, filterOrientation, filterMonth]);

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

      const res = await fetchWithAuth(`/raffles/summary?${query.toString()}`);
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (student) => {
    setHistoryModal({ isOpen: true, student, data: [] });
    setHistoryLoading(true);
    try {
      const res = await fetchWithAuth(`/raffles/history/${student.student_id}?year=2026`);
      setHistoryModal({ isOpen: true, student, data: res.data });
    } catch (err) {
      toast.error(err.message || 'Error al cargar el historial.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const executeTransaction = async (e) => {
    e.preventDefault();
    if (!transactionForm.quantity || isNaN(transactionForm.quantity)) {
      toast.error('La cantidad debe ser un número válido.');
      return;
    }

    try {
      const res = await fetchWithAuth('/raffles/transaction', {
        method: 'POST',
        body: JSON.stringify({
          student_id: transactionModal.student.student_id,
          period_month: filterMonth,
          period_year: 2026,
          action_type: transactionForm.action_type,
          quantity: Number(transactionForm.quantity),
          deposit_status: transactionForm.action_type === 'returned_sold' ? transactionForm.deposit_status : undefined
        })
      });

      setTransactionModal({ isOpen: false, student: null });
      loadMatrix();

      if (transactionForm.action_type === 'returned_sold') {
        toast.success(
          `${transactionForm.quantity} rifas procesadas ($${transactionForm.quantity * 100}).\nCuota: $${res.applied_to_fee} · Fondo común: $${res.surplus_fund}`,
          { duration: 6000 }
        );
      } else {
        toast.success('Operación registrada correctamente.');
      }
    } catch (err) {
      toast.error(err.message || 'Error al procesar el movimiento.');
    }
  };

  const orientations = [...new Set(classes.map(c => c.name.replace(/[0-9]+$/g, '').trim()))];

  const getActionLabel = (type) => {
    if (type === 'delivered_to_student') return 'Retiró nuevas';
    if (type === 'returned_sold') return 'Rindió vendidas';
    if (type === 'returned_unsold') return 'Devolvió no vendidas';
    return type;
  };

  return (
    <>
      <div className="glass-panel fade-in-up" style={{ padding: '2rem' }}>
        <div className="page-header">
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>Gestión de rifas</h1>
            <p className="text-muted">Asignación, rendición de rifas y aportes automáticos a cuotas.</p>
          </div>
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
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="responsive-table">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem' }}>Estudiante</th>
                <th style={{ padding: '1rem' }}>Clase / Turno</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Entregadas</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Vendidas</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Devueltas</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Fondo rendido</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Operaciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '16px', width: '70%' }} /></td>
                    <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '16px', width: '60%' }} /></td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}><div className="skeleton" style={{ height: '16px', width: '30px', margin: '0 auto' }} /></td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}><div className="skeleton" style={{ height: '16px', width: '30px', margin: '0 auto' }} /></td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}><div className="skeleton" style={{ height: '16px', width: '30px', margin: '0 auto' }} /></td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}><div className="skeleton" style={{ height: '16px', width: '60px', margin: '0 auto' }} /></td>
                    <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '28px', width: '90px' }} /></td>
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr><td colSpan="7" className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>No hay estudiantes para estos filtros.</td></tr>
              ) : (
                students.map(st => {
                  const possession = st.total_delivered - (st.total_sold + st.total_unsold);

                  return (
                    <tr key={st.student_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td data-label="Estudiante" style={{ padding: '1rem', fontWeight: '500' }}>{st.student_name}</td>
                      <td data-label="Clase / Turno" style={{ padding: '1rem' }}>{st.class_name} <span className="text-muted" style={{ fontSize: '0.85rem' }}>({st.class_shift === 'morning' ? 'Mañana' : 'Tarde'})</span></td>
                      <td data-label="Entregadas" style={{ padding: '1rem', textAlign: 'center', color: possession > 0 ? 'var(--color-warning)' : 'inherit' }}>
                        {st.total_delivered} {possession > 0 && <span style={{ fontSize: '0.75rem' }}>({possession} sin rendir)</span>}
                      </td>
                      <td data-label="Vendidas" style={{ padding: '1rem', textAlign: 'center' }}>{st.total_sold > 0 ? <strong style={{ color: 'var(--color-success)' }}>{st.total_sold}</strong> : 0}</td>
                      <td data-label="Devueltas" style={{ padding: '1rem', textAlign: 'center' }}>{st.total_unsold}</td>
                      <td data-label="Fondo" style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: st.total_collected > 0 ? 'var(--accent-primary)' : 'inherit' }}>
                        ${st.total_collected}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => loadHistory(st)} className="btn-action" style={{ background: 'var(--color-info)', color: 'white' }}>Auditar</button>
                          <button onClick={() => {
                            setTransactionForm({ action_type: 'delivered_to_student', quantity: '', deposit_status: 'pending' });
                            setTransactionModal({ isOpen: true, student: st });
                          }} className="btn-action" style={{ background: 'var(--accent-primary)', color: 'white' }}>Operar</button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {transactionModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel modal-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
            <h2 className="mb-4" style={{ marginTop: 0 }}>Registrar Movimiento</h2>
            <p className="text-muted mb-4">Estudiante: {transactionModal.student.student_name} | {months.find(m => m.id === filterMonth)?.name}</p>

            <form onSubmit={executeTransaction}>
              <div className="mb-4">
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Tipo de transacción</label>
                <select className="input-field" value={transactionForm.action_type} onChange={e => setTransactionForm({ ...transactionForm, action_type: e.target.value })}>
                  <option value="delivered_to_student">Le entregué rifas nuevas</option>
                  <option value="returned_sold">Me entregó dinero de rifas vendidas</option>
                  <option value="returned_unsold">Me devolvió rifas no vendidas</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Cantidad de rifas (unidades)</label>
                <input required type="number" min="1" step="1" className="input-field" placeholder="Ej: 50" value={transactionForm.quantity} onChange={e => setTransactionForm({ ...transactionForm, quantity: e.target.value })} />
                {transactionForm.action_type === 'returned_sold' && transactionForm.quantity > 0 && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-success)', background: 'rgba(74, 222, 128, 0.08)', padding: '0.5rem', borderRadius: '4px' }}>
                    Se procesará un cobro de efectivo por <strong>${Number(transactionForm.quantity) * 100}</strong>. Este monto cubrirá automáticamente su cuota de {months.find(m => m.id === filterMonth)?.name}. Si sobra, pasará al Fondo Común.
                  </div>
                )}
              </div>

              {transactionForm.action_type === 'returned_sold' && (
                <div className="mb-6">
                  <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Destino del efectivo</label>
                  <select className="input-field" value={transactionForm.deposit_status} onChange={e => setTransactionForm({ ...transactionForm, deposit_status: e.target.value })}>
                    <option value="pending">Lo tengo en mi poder temporalmente</option>
                    <option value="deposited">Ya fue depositado en la cuenta central</option>
                  </select>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button type="button" onClick={() => setTransactionModal({ isOpen: false, student: null })} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>Atrás</button>
                <button type="submit" className="button-primary">Procesar movimiento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historyModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel modal-panel" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div className="flex justify-between items-center mb-4 border-b" style={{ borderColor: 'var(--border-color)', paddingBottom: '1rem' }}>
              <h2 style={{ marginTop: 0, marginBottom: 0 }}>Cronología de rifas</h2>
              <button onClick={() => setHistoryModal({ isOpen: false, student: null, data: [] })} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>
            <p className="text-muted mb-4">Estudiante: {historyModal.student.student_name}</p>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.5rem' }}>Fecha operación</th>
                  <th style={{ padding: '0.5rem' }}>Mes destino</th>
                  <th style={{ padding: '0.5rem' }}>Operación</th>
                  <th style={{ padding: '0.5rem' }}>Unidades</th>
                  <th style={{ padding: '0.5rem' }}>Subtotal final</th>
                  <th style={{ padding: '0.5rem' }}>Inyectado en cuota</th>
                  <th style={{ padding: '0.5rem' }}>Fondo común (excedente)</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} style={{ padding: '0.5rem' }}><div className="skeleton" style={{ height: '14px', width: '80%' }} /></td>
                      ))}
                    </tr>
                  ))
                ) : historyModal.data.length === 0 ? (
                  <tr><td colSpan="7" className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>No hay movimientos</td></tr>
                ) : (
                  historyModal.data.map(rec => {
                    const mInfo = months.find(x => x.id === rec.period_month);
                    const isPos = rec.action_type === 'delivered_to_student';
                    return (
                      <tr key={rec.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                        <td style={{ padding: '0.8rem' }}>{new Date(rec.created_at).toLocaleString()}</td>
                        <td style={{ padding: '0.8rem', fontWeight: '500' }}>{mInfo?.name || rec.period_month}</td>
                        <td style={{ padding: '0.8rem' }}>
                          <span className={`status-badge ${isPos ? 'status-warning' : (rec.action_type === 'returned_sold' ? 'status-ok' : 'status-error')}`} style={{ padding: '0.2rem 0.5rem' }}>
                            {getActionLabel(rec.action_type)}
                          </span>
                        </td>
                        <td style={{ padding: '0.8rem', textAlign: 'center', fontWeight: '600' }}>
                          {isPos ? `+${rec.quantity}` : `-${rec.quantity}`}
                        </td>
                        <td style={{ padding: '0.8rem', color: rec.money_collected > 0 ? 'var(--accent-primary)' : 'inherit' }}>
                          {rec.money_collected > 0 ? `$${rec.money_collected}` : '-'}
                        </td>
                        <td style={{ padding: '0.8rem', color: rec.applied_to_fee > 0 ? 'var(--color-success)' : 'inherit' }}>
                          {rec.applied_to_fee > 0 ? `$${rec.applied_to_fee}` : '-'}
                        </td>
                        <td style={{ padding: '0.8rem', color: rec.surplus_fund > 0 ? 'var(--color-purple)' : 'inherit' }}>
                          {rec.surplus_fund > 0 ? `$${rec.surplus_fund}` : '-'}
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

export default RafflesSection;
