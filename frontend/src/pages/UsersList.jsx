import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../services/api';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, action: null });
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ cedula: '', username: '', password: '', role: 'organizer', class_ids: [] });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, classesRes] = await Promise.all([
        fetchWithAuth('/users'),
        fetchWithAuth('/classes')
      ]);
      setUsers(usersRes.data);
      setClasses(classesRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClassToggle = (classId) => {
    setFormData(prev => {
      const class_ids = prev.class_ids.includes(classId)
        ? prev.class_ids.filter(id => id !== classId)
        : [...prev.class_ids, classId];
      return { ...prev, class_ids };
    });
  };

  const openEditModal = (u) => {
    setFormData({
      cedula: u.cedula,
      username: u.username,
      password: '',
      role: u.role,
      class_ids: u.classes?.map(c => c.id) || []
    });
    setEditingId(u.id);
    setIsModalOpen(true);
  };

  const openNewModal = () => {
    setFormData({ cedula: '', username: '', password: '', role: 'organizer', class_ids: [] });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await fetchWithAuth(`/users/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await fetchWithAuth('/users', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleUserStatus = (id, currentStatus) => {
    setConfirmModal({ isOpen: true, id, action: currentStatus === 'active' ? 'inactive' : 'active' });
  };

  const proceedToggleStatus = async () => {
    try {
      await fetchWithAuth(`/users/${confirmModal.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: confirmModal.action })
      });
      setConfirmModal({ isOpen: false, id: null, action: null });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return (
    <div className="glass-panel" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div className="skeleton" style={{ height: '32px', width: '200px' }} />
        <div className="skeleton" style={{ height: '38px', width: '150px', borderRadius: '8px' }} />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '15px', width: '100px' }} /></td>
                <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '15px', width: '120px' }} /></td>
                <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '22px', width: '70px', borderRadius: '10px' }} /></td>
                <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '22px', width: '55px', borderRadius: '10px' }} /></td>
                <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '15px', width: '80%' }} /></td>
                <td style={{ padding: '1rem' }}><div className="skeleton" style={{ height: '28px', width: '90px' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  if (error) return <div className="status-error">Error: {error}</div>;

  return (
    <>
      <div className="glass-panel fade-in-up" style={{ padding: '2rem' }}>
        <div className="flex justify-between items-center mb-6">
          <h1>Gestión de usuarios internos</h1>
          <button className="button-primary" onClick={openNewModal}>+ Nuevo usuario</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem' }}>Cédula</th>
                <th style={{ padding: '1rem' }}>Usuario (Display Name)</th>
                <th style={{ padding: '1rem' }}>Rol</th>
                <th style={{ padding: '1rem' }}>Estado</th>
                <th style={{ padding: '1rem' }}>Clases (Si es Organizador)</th>
                <th style={{ padding: '1rem' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', color: 'var(--accent-primary)' }}>{u.cedula}</td>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{u.username}</td>
                  <td style={{ padding: '1rem' }}>{u.role === 'admin' ? 'Administrador' : 'Organizador'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`status-badge ${u.status === 'active' ? 'status-ok' : 'status-error'}`}>
                      {u.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>
                    {u.classes?.map(c => c.name).join(', ') || '-'}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => openEditModal(u)} style={{ padding: '0.3rem 0.6rem', background: 'var(--color-info)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Editar</button>
                      {u.status === 'active' ? (
                        <button onClick={() => toggleUserStatus(u.id, u.status)} style={{ padding: '0.3rem 0.6rem', background: 'var(--color-error)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Desactivar</button>
                      ) : (
                        <button onClick={() => toggleUserStatus(u.id, u.status)} style={{ padding: '0.3rem 0.6rem', background: 'var(--color-success)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reactivar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel modal-panel" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <h2 className="mb-4" style={{ marginTop: 0 }}>{editingId ? 'Editar Usuario' : 'Crear Usuario'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Cédula de identidad (Sin puntos ni guiones)</label>
                <input required type="text" maxLength={8} pattern="\d{7,8}" title="Debe contener 7 u 8 números" className="input-field" value={formData.cedula} onChange={e => setFormData({ ...formData, cedula: e.target.value })} />
              </div>
              <div className="mb-4">
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Nombre a mostrar</label>
                <input required type="text" className="input-field" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} />
              </div>
              <div className="mb-4">
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Contraseña {editingId && <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>(dejar en blanco para mantener actual)</span>}
                </label>
                <input required={!editingId} type="password" className="input-field" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
              </div>
              <div className="mb-4">
                <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Rol</label>
                <select className="input-field" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value, class_ids: [] })}>
                  <option value="organizer">Organizador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {formData.role === 'organizer' && (
                <div className="mb-6">
                  <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Asignar clases</label>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem' }}>
                    {classes.map(c => (
                      <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={formData.class_ids.includes(c.id)} onChange={() => handleClassToggle(c.id)} />
                        {c.name} ({c.shift === 'morning' ? 'Mañana' : 'Tarde'})
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" className="button-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }}>
          <div className="glass-panel modal-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
            <h2 className="mb-4" style={{ marginTop: 0 }}>¿Estás seguro?</h2>
            <p className="text-muted mb-6">¿Quieres {confirmModal.action === 'active' ? 'reactivar' : 'desactivar'} este usuario?</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button type="button" onClick={() => setConfirmModal({ isOpen: false, id: null, action: null })} style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
              <button type="button" onClick={proceedToggleStatus} style={{ padding: '0.5rem 1rem', background: confirmModal.action === 'active' ? 'var(--color-success)' : 'var(--color-error)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UsersList;
