import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddInvoice from './pages/AddInvoice';
import InvoiceList from './pages/InvoiceList';
import AddMember from './pages/AddMember';

import { ThemeProvider, useTheme } from './context/ThemeContext';

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-auto bg-gray-50/50 dark:bg-slate-900/50">
          {children}
        </main>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/" />;
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/add-invoice" element={<ProtectedRoute><AddInvoice /></ProtectedRoute>} />
          <Route path="/invoices" element={<ProtectedRoute><InvoiceList /></ProtectedRoute>} />
          <Route path="/add-member" element={<ProtectedRoute><AddMember /></ProtectedRoute>} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
