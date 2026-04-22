import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../services/api';
import { Calendar } from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { es } from 'date-fns/locale/es';

registerLocale('es', es);

const FinancesSection = () => {
  const [summary, setSummary] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense',
    category: '',
    amount: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0]
  });

  const categories = {
    fees: { name: 'Cuotas', icon: '💰' },
    raffles: { name: 'Rifas', icon: '🎟️' },
    common_fund: { name: 'Fondo común', icon: '🏦' },
    canteen: { name: 'Cantina', icon: '🍔' },
    events: { name: 'Eventos/Fiestas', icon: '🎉' },
    deposits: { name: 'Depósitos', icon: '🏦' },
    guarantees: { name: 'Garantías', icon: '🔒' },
    transport: { name: 'Transporte', icon: '🚌' },
    other: { name: 'Otros', icon: '📌' }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, ledRes] = await Promise.all([
        fetchWithAuth('/finances/summary'),
        fetchWithAuth('/finances/ledger')
      ]);
      setSummary(sumRes);
      setLedger(ledRes.data);
    } catch (err) {
      console.error(err);
      alert('Error cargando libro contable');
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || isNaN(formData.amount)) return alert('Monto inválido');

    try {
      await fetchWithAuth('/finances/transaction', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setModalOpen(false);
      loadData(); // Refrescar KPI y Ledger
    } catch (error) {
      alert(error.message);
    }
  };

  const formatMoney = (val) => `$${Number(val).toLocaleString('es-UY')}`;

  return (
    <>
      <div className="glass-panel fade-in-up" style={{ padding: '2rem' }}>
        <div className="page-header">
          <div>
            <h1 style={{ marginBottom: '0.5rem' }}>Libro financiero</h1>
            <p className="text-muted">Cálculo de balance maestro y asiento contable</p>
          </div>
          <button onClick={() => {
            setFormData({ ...formData, transaction_date: new Date().toISOString().split('T')[0] });
            setModalOpen(true);
          }} className="button-primary">+ Nuevo movimiento</button>
        </div>

        {/* Dashboard KPIs */}
        {!loading && summary && (
          <div className="grid-finance-kpis">

            <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '3px solid var(--color-info)' }}>
              <p className="text-muted" style={{ margin: '0 0 0.5rem 0', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Saldo en caja</p>
              <h2 style={{ margin: 0, fontSize: '2rem', fontFamily: 'Figtree, sans-serif', fontWeight: 700, color: summary.currentBalance < 0 ? 'var(--color-error)' : 'var(--text-main)' }}>{formatMoney(summary.currentBalance)}</h2>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '3px solid var(--color-success)' }}>
              <p className="text-muted" style={{ margin: '0 0 0.5rem 0', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Recaudado: Cuotas</p>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'Figtree, sans-serif', fontWeight: 700 }}>{formatMoney(summary.totalFees)}</h2>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '3px solid var(--accent-primary)' }}>
              <p className="text-muted" style={{ margin: '0 0 0.5rem 0', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Fondo común (Rifas)</p>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'Figtree, sans-serif', fontWeight: 700 }}>{formatMoney(summary.commonFundRaffles)}</h2>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '3px solid var(--color-warning)' }}>
              <p className="text-muted" style={{ margin: '0 0 0.5rem 0', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Ingresos extra</p>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'Figtree, sans-serif', fontWeight: 700 }}>{formatMoney(summary.manualIncome)}</h2>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '3px solid var(--color-error)' }}>
              <p className="text-muted" style={{ margin: '0 0 0.5rem 0', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Egresos (Gastos)</p>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'Figtree, sans-serif', fontWeight: 700 }}>{formatMoney(summary.manualExpense)}</h2>
            </div>

          </div>
        )}

        {/* Ledger Table */}
        <h3 className="mb-4">Libro diario (Transacciones manuales)</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="responsive-table">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <th style={{ padding: '1rem' }}>Fecha</th>
                <th style={{ padding: '1rem' }}>Categoría</th>
                <th style={{ padding: '1rem' }}>Descripción (concepto)</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Ingresos (+)</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Egresos (-)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '14px', width: '80px' }} /></td>
                    <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '14px', width: '90px' }} /></td>
                    <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '14px', width: '55%' }} /></td>
                    <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '14px', width: '50px' }} /></td>
                    <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '14px', width: '50px' }} /></td>
                  </tr>
                ))
              ) : ledger.length === 0 ? (
                <tr><td colSpan="5" className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>El libro diario manual está vacío.</td></tr>
              ) : (
                ledger.map(tx => {
                  const isIncome = tx.type === 'income';
                  const cat = categories[tx.category] || { name: tx.category, icon: '📌' };
                  return (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td data-label="Fecha" style={{ padding: '1rem', fontWeight: '500' }}>{new Date(tx.transaction_date).toLocaleDateString()}</td>
                      <td data-label="Categoría" style={{ padding: '1rem' }}>{cat.icon} {cat.name}</td>
                      <td data-label="Descripción" style={{ padding: '1rem', color: 'var(--text-muted)' }}>{tx.description}</td>
                      <td data-label="Ingresos" style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: isIncome ? 'var(--color-success)' : 'inherit' }}>
                        {isIncome ? `+${formatMoney(tx.amount)}` : '-'}
                      </td>
                      <td data-label="Egresos" style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: !isIncome ? 'var(--color-error)' : 'inherit' }}>
                        {!isIncome ? `-${formatMoney(tx.amount)}` : '-'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel modal-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
            <h2 className="mb-4" style={{ marginTop: 0 }}>Nuevo asiento contable</h2>

            <form onSubmit={handleTransactionSubmit}>
              <div className="mb-4">
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Naturaleza de operación</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button type="button" onClick={() => setFormData({ ...formData, type: 'income' })} style={{ padding: '0.8rem', background: formData.type === 'income' ? 'var(--color-success)' : 'transparent', color: formData.type === 'income' ? 'white' : 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s' }}>Ingreso</button>
                  <button type="button" onClick={() => setFormData({ ...formData, type: 'expense' })} style={{ padding: '0.8rem', background: formData.type === 'expense' ? 'var(--color-error)' : 'transparent', color: formData.type === 'expense' ? 'white' : 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.2s' }}>Egreso / Gasto</button>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Categoría</label>
                <select required className="input-field" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  <option value="" disabled>Seleccionar categoría</option>
                  {Object.entries(categories).map(([k, v]) => (
                    <option key={k} value={k}>{v.icon} {v.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Monto</label>
                <input required type="number" min="1" step="1" className="input-field" placeholder="Ej: 5000" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
              </div>

              <div className="mb-4">
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Fecha</label>
                <div className="input-group-with-icon">
                  <Calendar size={18} className="input-icon" />
                  <DatePicker
                    selected={formData.transaction_date ? new Date(formData.transaction_date + 'T12:00:00') : null}
                    onChange={(date) => setFormData({ ...formData, transaction_date: date ? date.toISOString().split('T')[0] : '' })}
                    dateFormat="dd / MM / yyyy"
                    locale="es"
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Descripción o concepto</label>
                <input required type="text" className="input-field" placeholder="Ej: Seña de local" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>

              <div className="flex justify-between mt-6">
                <button type="button" onClick={() => setModalOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>Atrás</button>
                <button type="submit" className="button-primary">Registrar transacción</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FinancesSection;
