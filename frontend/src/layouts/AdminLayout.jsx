import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Receipt, CreditCard, LogOut, Activity, Wallet, GraduationCap, BookOpen, CalendarDays, UserCog, ShieldCheck, Menu, X, Shirt } from 'lucide-react';
import './AdminLayout.css';

const AdminLayout = ({ apiStatus }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const rawUser = localStorage.getItem('user');
  const user = rawUser ? JSON.parse(rawUser) : null;
  const usernameStr = user?.username || 'Invitado';

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const closeSidebar = () => setIsSidebarOpen(false);

  const baseNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Estudiantes', path: '/students', icon: Users },
    { name: 'Cuotas', path: '/fees', icon: CreditCard },
    { name: 'Buzos', path: '/hoodies', icon: Shirt },
    { name: 'Rifas', path: '/raffles', icon: Receipt },
    { name: 'Finanzas', path: '/finances', icon: Wallet },
    { name: 'Calendario', path: '/calendar', icon: CalendarDays },
    { name: 'Clases', path: '/classes', icon: BookOpen },
  ];

  if (user?.role === 'admin') {
    baseNavItems.push({ name: 'Organizadores', path: '/users', icon: UserCog });
    baseNavItems.push({ name: 'Auditoría', path: '/audit', icon: ShieldCheck });
  }

  return (
    <div className="admin-container">
      <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={closeSidebar} />

      <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-close-btn">
          <button onClick={closeSidebar} aria-label="Cerrar menú">
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-header">
          <div className="logo-wrapper">
            <GraduationCap size={22} className="logo-icon" strokeWidth={1.75} />
            <span className="logo-text">GRADU 63</span>
          </div>
        </div>

        <div className="nav-section-label">Menú</div>
        <nav className="sidebar-nav">
          {baseNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.name} to={item.path} onClick={closeSidebar} className={`nav-link ${isActive ? 'active' : ''}`}>
                <Icon size={18} strokeWidth={isActive ? 2 : 1.75} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <Link to="/login" onClick={() => { localStorage.removeItem('isAuth'); closeSidebar(); }} className="nav-link logout">
            <LogOut size={18} strokeWidth={1.75} />
            <span>Cerrar sesión</span>
          </Link>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Abrir menú">
            <Menu size={20} />
          </button>
          <h2 className="page-title">Sistema de gestión</h2>
          <div className="header-actions">
            <div className={`status-badge ${apiStatus.status === 'OK' ? 'status-ok' : 'status-error'}`}>
              <Activity size={14} />
              <span>API: {apiStatus.status} | DB: {apiStatus.db}</span>
            </div>
            <div className="user-profile">
              <div className="avatar">{usernameStr.charAt(0).toUpperCase()}</div>
              <span>{usernameStr}</span>
            </div>
          </div>
        </header>

        <div className="content-wrapper" key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
