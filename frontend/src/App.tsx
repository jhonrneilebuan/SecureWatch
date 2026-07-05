import { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { useAuth } from './context/AuthContext';
import { Dashboard } from './pages/Dashboard';
import { AuditLogs } from './pages/AuditLogs';
import { CveLookup } from './pages/CveLookup';
import { EmailAlerts } from './pages/EmailAlerts';
import { IncidentDetails } from './pages/IncidentDetails';
import { Incidents } from './pages/Incidents';
import { IpReputation } from './pages/IpReputation';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { ThreatDetails } from './pages/ThreatDetails';
import { ThreatAnalysis } from './pages/ThreatAnalysis';
import { UploadLogs } from './pages/UploadLogs';
import { UserManagement } from './pages/UserManagement';

function Protected({ children }: { children: ReactElement }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Protected><AppLayout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="upload" element={<UploadLogs />} />
        <Route path="threats" element={<ThreatAnalysis />} />
        <Route path="threats/:id" element={<ThreatDetails />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="incidents/:id" element={<IncidentDetails />} />
        <Route path="reports" element={<Reports />} />
        <Route path="ip-reputation" element={<IpReputation />} />
        <Route path="cve-lookup" element={<CveLookup />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="email-alerts" element={<EmailAlerts />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
