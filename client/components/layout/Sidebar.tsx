import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Moon, Sun, LogOut, Search, Bell, User, ChevronDown } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { authAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  CheckSquare,
  Wallet,
  TrendingUp,
  FileText,
  CreditCard,
  PiggyBank,
  Settings,
  BarChart3,
  Shield,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Tasks', path: '/tasks', icon: <CheckSquare size={20} /> },
  { label: 'Expenses', path: '/expenses', icon: <Wallet size={20} /> },
  { label: 'Income', path: '/income', icon: <TrendingUp size={20} /> },
  { label: 'Policies', path: '/policies', icon: <FileText size={20} /> },
  { label: 'Payments', path: '/payments', icon: <CreditCard size={20} /> },
  { label: 'Loans', path: '/loans', icon: <span className="text-lg">🏦</span> },
  { label: 'Goals', path: '/goals', icon: <PiggyBank size={20} /> },
  { label: 'Reports', path: '/reports', icon: <BarChart3 size={20} /> },
  { label: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  { label: 'Admin', path: '/admin', icon: <Shield size={20} /> },
];

export const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    icon: string;
    title: string;
    message: string;
    time?: string;
  }>>([
    {
      icon: '🔔',
      title: 'SIP Reminder',
      message: 'Time to invest in HDFC Top 100 - ₹5,000',
      time: '2 hours ago'
    },
    {
      icon: '💰',
      title: 'Goal Progress',
      message: 'You\'re 75% closer to your Retirement Fund goal!',
      time: '1 day ago'
    },
  ]);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const userData = JSON.parse(localStorage.getItem('user') || '{}');

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('user');
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  return (
    <>
      {/* Top Navbar - Premium Design */}
      <nav className="fixed top-0 left-0 right-0 h-16 glass border-b border-border z-50">
        <div className="h-full px-4 md:px-6 flex items-center justify-between max-w-[1920px] mx-auto">
          {/* Left: Menu & Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden btn-icon"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                <span className="text-white font-bold text-sm">FT</span>
              </div>
              <span className="hidden md:block font-bold text-xl gradient-text">FinTask</span>
            </Link>
          </div>

          {/* Center: Search (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Search anything..."
                className="input pl-11 w-full"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="btn-icon"
              title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Notification Button with Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="btn-icon relative"
                title="Notifications"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full animate-pulse"></span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowNotifications(false)}
                  ></div>
                  <div className="absolute right-0 top-12 w-80 glass-card p-4 z-50 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Notifications</h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => setNotifications([])}
                          className="text-xs text-primary hover:underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-foreground/60">
                        <Bell size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map((notif, index) => (
                          <div 
                            key={index}
                            className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-lg">{notif.icon}</span>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{notif.title}</p>
                                <p className="text-xs text-foreground/60 mt-1">{notif.message}</p>
                                {notif.time && (
                                  <p className="text-xs text-foreground/40 mt-1">{notif.time}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="hidden md:flex items-center gap-2.5 px-3 py-2 hover:bg-accent rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                  {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium">{userData?.name || 'User'}</span>
                <ChevronDown size={16} className="text-muted-foreground" />
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 animate-scale-in overflow-hidden">
                    <div className="p-3 border-b border-border">
                      <p className="text-sm font-semibold">{userData?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{userData?.email || 'user@example.com'}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-lg transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings size={16} />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40 mt-16 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Premium Design */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-card border-r border-border
          transform transition-transform duration-300 z-40 overflow-y-auto
          md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/30'
                  : 'text-foreground/70 hover:bg-accent hover:text-foreground'
              }`}
            >
              <span className={isActive(item.path) ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};
