import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './components/Login.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import MemberDashboard from './components/MemberDashboard.jsx';
import { ThemeProvider } from './ThemeContext.jsx';

export default function App() {
  // We no longer store the raw JWT — the browser manages it as an HttpOnly cookie.
  // We only store role & memberId in localStorage so React knows which dashboard to render.
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('role'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [memberId, setMemberId] = useState(localStorage.getItem('memberId'));

  const handleLogin = ({ role, memberId }) => {
    localStorage.setItem('role', role);
    if (memberId) localStorage.setItem('memberId', memberId.toString());
    setRole(role);
    setMemberId(memberId?.toString() ?? null);
    setLoggedIn(true);
  };

  const handleLogout = async () => {
    // Ask server to clear the HttpOnly cookie
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    localStorage.removeItem('role');
    localStorage.removeItem('memberId');
    setLoggedIn(false);
    setRole(null);
    setMemberId(null);
  };

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/login" element={
            !loggedIn ? <Login onLogin={handleLogin} /> :
            <Navigate to={role === 'Admin' ? '/admin' : '/member'} />
          } />
          <Route path="/admin" element={
            loggedIn && role === 'Admin' ? <AdminDashboard onLogout={handleLogout} /> : <Navigate to="/login" />
          } />
          <Route path="/member" element={
            loggedIn && role === 'Regular' ? <MemberDashboard memberId={memberId} onLogout={handleLogout} /> : <Navigate to="/login" />
          } />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
