import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';

import './LoginPlaceholder.css';

const LoginPlaceholder = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);


  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData(e.target);
      const cedula = formData.get('cedula').trim();
      const password = formData.get('password');

      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, password })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Fallo de autenticación');

      toast.success(`¡Bienvenid@, ${data.user.username}!`);
      localStorage.setItem('jwt', data.token);
      localStorage.setItem('isAuth', 'true');
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel fade-in-up">
        <div className="login-header">
          <div className="icon-wrapper icon-pulse">
            <GraduationCap size={32} color="var(--accent-primary)" strokeWidth={1.75} />
          </div>
          <h1>Panel de gestión</h1>
          <p className="text-muted">Graduación Liceo 63 - 2026</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="login-error">{error}</div>}
          <div className="form-group mb-4">
            <label>Cédula</label>
            <input type="text" name="cedula" className="input-field" placeholder="12345678" required />
          </div>

          <div className="form-group mb-6">
            <label>Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="input-field"
                placeholder="contraseña123"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="button-primary w-full" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPlaceholder;
