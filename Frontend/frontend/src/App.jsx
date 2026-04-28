import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login      from './pages/login';
import Dashboard  from './pages/dashboard';
import Monitoring from './pages/monitoring';
import Control    from './pages/control';
import Alerts     from './pages/alerts';
import History    from './pages/history';
import Admin      from './pages/admin';
import Logs       from './pages/logs';

import Sidebar from './components/layout/sidebar';
import Header  from './components/layout/header';

import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider  } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';

import bgImg from './assets/farm1.png';

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
      <Sidebar />
      <div 
        style={{ backgroundImage: `url(${bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 p-6 lg:p-8 w-full mx-auto">
          <Routes>
            <Route path="dashboard"  element={<Dashboard />}  />
            <Route path="monitoring" element={<Monitoring />} />
            <Route path="control"    element={<Control />}    />
            <Route path="alerts"     element={<Alerts />}     />
            <Route path="history"    element={<History />}    />
            <Route path="admin"      element={<Admin />}      />
            <Route path="logs"       element={<Logs />}       />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="h-10 w-10 border-[3px] border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/"   element={<Login />}     />
      <Route path="/*"  element={<AppLayout />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}
