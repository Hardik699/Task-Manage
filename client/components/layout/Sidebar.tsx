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
      {/* Top Navbar - Premium Design - Fully Responsive */}
      <nav className="fixed top-0 left-0 right-0 h-16 glass-premium border-b border-border/30 z-50 transition-all backdrop-blur-2xl">
        <div className="h-full px-4 sm:px-6 flex items-center justify-between container-wide">
          {/* Left: Menu & Logo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden btn-icon hover-scale transition-all"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            
            <Link to="/dashboard" className="flex items-center gap-2 sm:gap-2.5 hover-scale">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover-glow-intense">
                <span className="text-white font-bold text-xs sm:text-sm">FT</span>
              </div>
              <span className="hidden sm:block font-bold text-lg sm:text-xl text-gradient-primary">FinTask</span>
            </Link>
          </div>

          {/* Center: Search (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search anything..."
                className="input pl-11 w-full transition-all focus:shadow-lg focus:shadow-primary/10 hover:border-primary/30 focus:border-primary/50 bg-background/60 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Right: Actions - Enhanced Responsive */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={toggleTheme}
              className="btn-icon hover-scale transition-all"
              title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon size={18} className="sm:w-5 sm:h-5" /> : <Sun size={18} className="sm:w-5 sm:h-5" />}
            </button>

            {/* Enhanced Notification Button with Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="btn-icon relative hover-scale transition-all"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell size={18} className="sm:w-5 sm:h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 bg-destructive rounded-full animate-pulse shadow-lg shadow-destructive/50"></span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" 
                    onClick={() => setShowNotifications(false)}
                  ></div>
                  <div className="mobile-dropdown sm:w-80 glass-premium p-4 z-50 overflow-y-auto scrollbar-modern animate-scale-in border border-border/30">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm sm:text-base text-gradient-primary">Notifications</h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => setNotifications([])}
                          className="text-xs text-primary hover:text-primary/80 transition-colors hover:underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    
                    {notifications.length === 0 ? (
                      <div className="empty-state-mobile py-8">
                        <Bell size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map((notif, index) => (
                          <div 
                            key={index}
                            className="p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-all hover-scale border border-border/20"
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-lg">{notif.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{notif.title}</p>
                                <p className="text-xs text-foreground/60 mt-1 line-clamp-2">{notif.message}</p>
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

            {/* Enhanced User Menu - Desktop Only */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3 py-2 hover:bg-accent/50 rounded-lg transition-all hover-scale"
                aria-label="User menu"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center text-white text-xs sm:text-sm font-semibold shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all">
                  {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-xs sm:text-sm font-medium hidden lg:block">{userData?.name || 'User'}</span>
                <ChevronDown size={14} className="text-muted-foreground hidden lg:block transition-transform" />
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 glass-premium border border-border/30 rounded-xl shadow-3xl z-50 animate-scale-in overflow-hidden">
                    <div className="p-3 border-b border-border/30 bg-gradient-to-r from-primary/5 to-purple-500/5">
                      <p className="text-sm font-semibold truncate">{userData?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{userData?.email || 'user@example.com'}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent/50 rounded-lg transition-all hover-scale"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings size={16} />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive rounded-lg transition-all hover-scale"
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

      {/* Sidebar Overlay - Enhanced */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40 mt-16 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Enhanced Sidebar - Premium Design - Mobile Optimized */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 sm:w-72 glass-premium border-r border-border/30
          transform transition-all duration-300 z-40 overflow-y-auto scrollbar-modern
          md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <nav className="p-3 sm:p-4 space-y-1.5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`group flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-300 text-sm font-medium hover-scale ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-primary to-purple-500 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40'
                  : 'text-foreground/70 hover:bg-accent/50 hover:text-foreground hover:shadow-md'
              }`}
            >
              <span className={`transition-all duration-300 ${isActive(item.path) ? 'text-white scale-110' : 'text-muted-foreground group-hover:text-foreground group-hover:scale-105'}`}>
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
              {isActive(item.path) && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
              )}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};
