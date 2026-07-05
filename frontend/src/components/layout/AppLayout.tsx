import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Activity, Bell, Bug, FileBarChart, FileText, Globe, LayoutDashboard, LogOut, Mail, Settings, ShieldAlert, Upload, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/upload', label: 'Upload Logs', icon: Upload },
  { to: '/threats', label: 'Threat Analysis', icon: ShieldAlert },
  { to: '/incidents', label: 'Incident Management', icon: Bell },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
  { to: '/ip-reputation', label: 'IP Reputation', icon: Globe },
  { to: '/cve-lookup', label: 'CVE Lookup', icon: Bug },
  { to: '/audit-logs', label: 'Audit Logs', icon: FileText, admin: true },
  { to: '/email-alerts', label: 'Email Alerts', icon: Mail },
  { to: '/users', label: 'User Management', icon: Users, admin: true },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const visibleItems = navItems.filter((item) => !item.admin || user?.role === 'Admin');

  return (
    <div className="min-h-screen bg-[#061018] text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-slate-800 bg-slate-950/95 p-5 lg:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-slate-950">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-lg font-semibold">SecureWatch</p>
            <p className="text-xs text-slate-500">Security Operations</p>
          </div>
        </div>
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${isActive ? 'bg-primary/15 text-primary' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'}`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-800 bg-[#061018]/95 px-5 backdrop-blur">
          <div>
            <p className="text-sm text-slate-500">AI-Powered Security Monitoring Dashboard</p>
            <h1 className="text-lg font-semibold">SOC Command Center</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user?.fullName}</p>
              <p className="text-xs text-slate-500">{user?.role}</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              aria-label="Logout"
            >
              <LogOut size={16} />
            </Button>
          </div>
        </header>
        <main className="p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
