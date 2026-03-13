import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddInvoice from './pages/AddInvoice';
import InvoiceList from './pages/InvoiceList';
import AddMember from './pages/AddMember';
import CompanyEmails from './pages/CompanyEmails';

import { ThemeProvider, useTheme } from './context/ThemeContext';
import SessionTimeout from './components/SessionTimeout';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/40 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true' || sessionStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <SessionTimeout />
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/add-invoice" element={<ProtectedRoute><AddInvoice /></ProtectedRoute>} />
          <Route path="/invoices" element={<ProtectedRoute><InvoiceList /></ProtectedRoute>} />
          <Route path="/add-member" element={<ProtectedRoute><AddMember /></ProtectedRoute>} />
          <Route path="/company-emails" element={<ProtectedRoute><CompanyEmails /></ProtectedRoute>} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
