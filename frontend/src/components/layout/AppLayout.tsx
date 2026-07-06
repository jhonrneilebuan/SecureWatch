import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Activity, Bell, Bug, FileBarChart, FileText, Globe, LayoutDashboard, LogOut, Mail, Menu, Settings, ShieldAlert, Upload, Users, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { api } from '../../api/client';
import { Notification } from '../../types';

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

const headerIconButtonClass = 'h-12 w-12 rounded-lg border border-slate-600 bg-slate-900/95 p-2 !text-white shadow-md shadow-slate-950/40 hover:border-primary hover:bg-primary/15 hover:!text-primary focus-visible:ring-primary/60';

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const visibleItems = navItems.filter((item) => !item.admin || user?.role === 'Admin');
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  useEffect(() => {
    let active = true;
    const loadNotifications = () => {
      api.get<Notification[]>('/notifications')
        .then(({ data }) => {
          if (active) setNotifications(data);
        })
        .catch(() => {
          if (active) setNotifications([]);
        });
    };

    loadNotifications();
    const timer = window.setInterval(loadNotifications, 10000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  async function markRead(id: string) {
    await api.put(`/notifications/${id}/read`);
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, isRead: true } : item));
  }

  return (
    <div className="min-h-screen bg-[#061018] text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-slate-800 bg-slate-950/95 p-5 lg:block">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-emerald-500 text-slate-950 shadow-md shadow-primary/10">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-lg font-bold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">SecureWatch</p>
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
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 border-l-2 ${
                    isActive ? 'border-primary bg-primary/10 text-primary shadow-sm shadow-primary/5 pl-4' : 'border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-slate-100 hover:pl-4'
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Drawer Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-950/65 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-over Drawer Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-800/80 bg-slate-950/95 p-5 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-emerald-500 text-slate-950 shadow-md">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-md font-bold bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">SecureWatch</p>
              <p className="text-[10px] text-slate-500">SOC Drawer</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-100"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 border-l-2 ${
                    isActive ? 'border-primary bg-primary/10 text-primary pl-4' : 'border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-slate-100 hover:pl-4'
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Panel Area */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-800/80 bg-[#061018]/90 px-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-100 lg:hidden focus:outline-none active:scale-95"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <p className="text-xs text-slate-500 hidden sm:block">AI-Powered Security Monitoring Dashboard</p>
              <h1 className="text-sm sm:text-lg font-bold">SOC Command Center</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setNotificationsOpen((open) => !open)}
                aria-label="Notifications"
                title="Live Alerts"
                className={`relative ${headerIconButtonClass}`}
              >
                <Bell size={24} strokeWidth={2.8} className="text-current" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-black text-white">
                    {unreadCount}
                  </span>
                )}
              </Button>
              {notificationsOpen && (
                <div className="absolute right-0 top-11 z-30 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-slate-800 bg-slate-950 shadow-2xl shadow-slate-950/60">
                  <div className="border-b border-slate-800 px-4 py-3">
                    <p className="text-sm font-bold text-slate-100">Live Alerts</p>
                    <p className="text-xs text-slate-500">Latest in-app security notifications</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-xs text-slate-500">No live alerts yet.</p>
                    ) : notifications.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => markRead(item.id)}
                        className={`block w-full border-b border-slate-900 px-4 py-3 text-left transition hover:bg-slate-900/70 ${item.isRead ? 'opacity-65' : 'bg-primary/5'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-bold text-slate-100">{item.title}</p>
                          <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase ${
                            item.severity === 'Critical'
                              ? 'border-red-900/60 bg-red-950/50 text-red-300'
                              : 'border-yellow-900/60 bg-yellow-950/50 text-yellow-300'
                          }`}>
                            {item.severity}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.message}</p>
                        <p className="mt-2 text-[10px] font-semibold text-slate-600">{new Date(item.createdAt).toLocaleString()}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
              title="Logout"
              className={headerIconButtonClass}
            >
              <LogOut size={24} strokeWidth={2.8} className="text-current" />
            </Button>
          </div>
        </header>
        <main className="p-4 sm:p-6 transition-all">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
