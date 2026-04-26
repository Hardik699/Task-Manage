import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Wallet,
  FileText,
  CreditCard,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={24} /> },
  { label: 'Tasks', path: '/tasks', icon: <CheckSquare size={24} /> },
  { label: 'Expenses', path: '/expenses', icon: <Wallet size={24} /> },
  { label: 'Policies', path: '/policies', icon: <FileText size={24} /> },
  { label: 'Payments', path: '/payments', icon: <CreditCard size={24} /> },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden glass-premium border-t border-border/30 z-40 safe-area-inset-bottom backdrop-blur-2xl">
      <div className="flex justify-around h-16 sm:h-18">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center flex-1 transition-all duration-300 hover-scale relative ${
              isActive(item.path)
                ? 'text-primary'
                : 'text-foreground/50 hover:text-foreground active:text-foreground/70'
            }`}
          >
            <div className={`transition-all duration-300 ${isActive(item.path) ? 'scale-110 animate-bounce-subtle' : ''}`}>
              {item.icon}
            </div>
            <span className={`text-[10px] sm:text-xs mt-1 font-medium transition-all duration-300 ${
              isActive(item.path) ? 'font-semibold text-primary' : ''
            }`}>
              {item.label}
            </span>
            {isActive(item.path) && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-primary to-purple-500 rounded-t-full shadow-lg shadow-primary/50" />
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
};
