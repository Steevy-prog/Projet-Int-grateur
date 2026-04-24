import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { 
  LayoutDashboard, 
  Activity, 
  Settings2, 
  Bell, 
  Users, 
  Terminal, 
  LogOut, 
  Droplets, 
  Thermometer, 
  CloudSun, 
  Power,
  ChevronRight,
  AlertTriangle,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Monitoring from './pages/monitoring';
import Control from './pages/control';
// import Activity from './pages/activity';
import Admin from './pages/admin';
// import History from './pages/history';

import Sidebar from './components/layout/sidebar';
import Header from './components/layout/header';

import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
// --- MAIN APP ---

export default function App() {
  return (
    <Router>
      <AuthProvider>  
        <AppProvider>
          <Routes>
            <Route index element={<Login />} />
          </Routes>
          <div className="flex min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0">
              <Header />
              <div className="p-8 max-w-7xl w-full mx-auto">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/monitoring" element={<Monitoring />} />
                  <Route path="/control" element={<Control />} />
                  {/* <Route path="/activity" element={<Activity />} /> */}
                  {/* <Route path="/history" element={<History/>} /> */}
                  <Route path="/admin" element={<Admin />} />
                </Routes>
              </div>  
            </main>
          </div>
        </AppProvider>  
      </AuthProvider>
    </Router>
  );
}
