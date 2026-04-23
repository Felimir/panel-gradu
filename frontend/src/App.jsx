import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { fetchWithAuth } from './services/api';
import AdminLayout from './layouts/AdminLayout';
import LoginPlaceholder from './pages/LoginPlaceholder';
import UsersList from './pages/UsersList';
import ClassesList from './pages/ClassesList';
import StudentsList from './pages/StudentsList';
import FeesSection from './pages/FeesSection';
import RafflesSection from './pages/RafflesSection';
import FinancesSection from './pages/FinancesSection';
import DashboardSection from './pages/DashboardSection';
import CalendarSection from './pages/CalendarSection';
import AuditLogsSection from './pages/AuditLogsSection';
import HoodiesSection from './pages/HoodiesSection';

const ProtectedRoute = ({ children }) => {
  const isAuth = localStorage.getItem('isAuth') === 'true';
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  const [apiStatus, setApiStatus] = useState({ status: 'LOADING', db: 'Unknown' });

  useEffect(() => {
    const checkApi = async () => {
      try {
        const data = await fetchWithAuth('/health');
        setApiStatus(data);
      } catch (err) {
        setApiStatus({ status: 'ERROR', db: 'Disconnected' });
      }
    };
    checkApi();
  }, []);

  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0D1426',
            color: '#F8FAFF',
            border: '1px solid rgba(59,130,246,0.22)',
            borderRadius: '10px',
            fontSize: '0.9rem',
            fontFamily: "'Figtree', sans-serif",
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          },
          success: { iconTheme: { primary: '#22C55E', secondary: '#0D1426' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#0D1426' } },
        }}
      />
      <Routes>
      <Route path="/login" element={<LoginPlaceholder />} />
      <Route path="/" element={<ProtectedRoute><AdminLayout apiStatus={apiStatus} /></ProtectedRoute>}>
        <Route index element={<DashboardSection />} />
        <Route path="users" element={<UsersList />} />
        <Route path="classes" element={<ClassesList />} />
        <Route path="students" element={<StudentsList />} />
        <Route path="fees" element={<FeesSection />} />
        <Route path="hoodies" element={<HoodiesSection />} />
        
        {/* Module 4 - Raffles */}
        <Route path="raffles" element={<RafflesSection />} />

        {/* Module 5 - Finances */}
        <Route path="finances" element={<FinancesSection />} />

        {/* Module 7 - Calendar */}
        <Route path="calendar" element={<CalendarSection />} />

        {/* Module 8 - Audit */}
        <Route path="audit" element={<AuditLogsSection />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
