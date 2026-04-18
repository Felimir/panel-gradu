import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../services/api';

const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [filterOrientation, setFilterOrientation] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, type: null }); // type: 'drop' or 'delete'
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', class_id: '', wants_hoodie: false, status: 'active' });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadClasses();
    const u = localStorage.getItem('user');
    if (u) setCurrentUser(JSON.parse(u));
  }, []);

  useEffect(() => {
    loadStudents();
  }, [search, filterClass, filterShift, filterOrientation, filterStatus]);

  const loadClasses = async () => {
    try {
      const cls = await fetchWithAuth('/classes');
      setClasses(cls.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (filterClass) query.append('class_id', filterClass);
      if (filterShift) query.append('shift', filterShift);
      if (filterOrientation) query.append('orientation', filterOrientation);
      if (filterStatus) query.append('status', filterStatus);

      const res = await fetchWithAuth(`/students?${query.toString()}`);
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setFormData({ name: '', class_id: '', wants_hoodie: false, status: 'active' });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (st) => {
    setFormData({
      name: st.name,
      class_id: st.class_id,
      wants_hoodie: st.wants_hoodie,
      status: st.status
    });
    setEditingId(st.id);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await fetchWithAuth(`/students/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await fetchWithAuth('/students', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setIsModalOpen(false);
      loadStudents();
    } catch (err) {
      alert(err.message);
    }
  };

  const executeConfirmAction = async () => {
    try {
      if (confirmModal.type === 'delete') {
        await fetchWithAuth(`/students/${confirmModal.id}`, { method: 'DELETE' });
      } else if (confirmModal.type === 'drop') {
        await fetchWithAuth(`/students/${confirmModal.id}`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'dropped' })
        });
      }
      setConfirmModal({ isOpen: false, id: null, type: null });
      loadStudents();
    } catch (err) {
      alert(err.message);
    }
  };

  const orientations = [...new Set(classes.map(c => c.name.replace(/[0-9]+$/g, '').trim()))];

  return (
    <>
      <div className="glass-panel fade-in-up" style={{ padding: '2rem' }}>
        <div className="flex justify-between items-center mb-6">
          <h1>Padrón de estudiantes</h1>
          <button className="button-primary" onClick={openNewModal}>+ Registrar estudiante</button>
        </div>

        {/* Filters Top Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Buscar por nombre</label>
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
            <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Filtrar por Clase</label>
            <select className="input-field" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
              <option value="">Todas las clases</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.shift === 'morning' ? 'Mañana' : 'Tarde'})</option>)}
            </select>
          </div>
          <div>
            <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Estado Operativo</label>
            <select className="input-field" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="dropped">Desertores</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem' }}>Nombre</th>
                <th style={{ padding: '1rem' }}>Clase / Turno</th>
                <th style={{ padding: '1rem' }}>Buzo</th>
                <th style={{ padding: '1rem' }}>Estado</th>
                <th style={{ padding: '1rem' }}>Operaciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '16px', width: '65%' }} /></td>
                    <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '16px', width: '75%' }} /></td>
                    <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '16px', width: '35%' }} /></td>
                    <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '22px', width: '70px', borderRadius: '10px' }} /></td>
                    <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '28px', width: '110px' }} /></td>
                  </tr>
                ))
              ) : students.length === 0 ? (
                <tr><td colSpan="5" className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>No se encontraron estudiantes.</td></tr>
              ) : (
                students.map(st => (
                  <tr key={st.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: st.status === 'dropped' ? 0.6 : 1 }}>
                    <td style={{ padding: '1rem', fontWeight: '500' }}>{st.name}</td>
                    <td style={{ padding: '1rem' }}>{st.class_name} <span className="text-muted" style={{ fontSize: '0.85rem' }}>({st.shift === 'morning' ? 'Mañana' : 'Tarde'})</span></td>
                    <td style={{ padding: '1rem' }}>{st.wants_hoodie ? '✅ Sí' : '❌ No'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`status-badge ${st.status === 'active' ? 'status-ok' : 'status-error'}`}>
                        {st.status === 'active' ? 'Activo' : 'Desertor'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => openEditModal(st)} style={{ padding: '0.3rem 0.6rem', background: 'var(--color-info)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Editar</button>
                        {st.status === 'active' && (
                          <button onClick={() => setConfirmModal({ isOpen: true, id: st.id, type: 'drop' })} style={{ padding: '0.3rem 0.6rem', background: 'var(--color-warning)', color: '#0e0c09', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Desertar</button>
                        )}
                        {currentUser?.role === 'admin' && (
                          <button onClick={() => setConfirmModal({ isOpen: true, id: st.id, type: 'delete' })} style={{ padding: '0.3rem 0.6rem', background: 'var(--color-error)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel modal-panel" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <h2 className="mb-4" style={{ marginTop: 0 }}>{editingId ? 'Editar Estudiante' : 'Registrar Estudiante'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre completo</label>
                <input required type="text" className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="mb-4">
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Clase del estudiante</label>
                <select required className="input-field" value={formData.class_id} onChange={e => setFormData({ ...formData, class_id: e.target.value })}>
                  <option value="" disabled>Selecciona una clase</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.shift === 'morning' ? 'Mañana' : 'Tarde'})</option>)}
                </select>
              </div>
              <div className="mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input type="checkbox" id="wants_hoodie" style={{ width: '18px', height: '18px', cursor: 'pointer' }} checked={formData.wants_hoodie} onChange={e => setFormData({ ...formData, wants_hoodie: e.target.checked })} />
                <label htmlFor="wants_hoodie" style={{ cursor: 'pointer', margin: 0 }}>¿Adquiere Buzo de Graduación?</label>
              </div>

              {editingId && (
                <div className="mb-6">
                  <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Estado Operativo</label>
                  <select className="input-field" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    <option value="active">Activo</option>
                    <option value="dropped">Desertor (Se bajó de la graduación)</option>
                  </select>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" className="button-primary">{editingId ? 'Guardar Cambios' : 'Registrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div className="glass-panel modal-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
            <h2 className="mb-4" style={{ marginTop: 0 }}>¿Estás seguro?</h2>

            {confirmModal.type === 'drop' ? (
              <p className="text-muted mb-6">
                El estudiante pasará al estado "Desertor". El historial contable seguirá visible, pero no se registrarán nuevas cuotas.
              </p>
            ) : (
              <p className="text-muted mb-6" style={{ color: 'var(--color-error)' }}>
                Se realizará un ELIMINADO PROFUNDO. Esta acción es solo para errores tipográficos o registros inválidos. Desaparecerá de todas las tablas inmediatamente.
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button type="button" onClick={() => setConfirmModal({ isOpen: false, id: null, type: null })} style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}>Cancelar Operación</button>
              <button type="button" onClick={executeConfirmAction} style={{ padding: '0.5rem 1rem', background: confirmModal.type === 'drop' ? 'var(--color-warning)' : 'var(--color-error)', color: confirmModal.type === 'drop' ? '#0e0c09' : 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Sí, confirmar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentsList;
