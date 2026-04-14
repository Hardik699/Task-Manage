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
    <nav className="fixed bottom-0 left-0 right-0 md:hidden glass border-t border-white/10 z-40">
      <div className="flex justify-around h-20">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center flex-1 transition-colors duration-200 ${
              isActive(item.path)
                ? 'text-primary dark:text-primary'
                : 'text-foreground/50 hover:text-foreground'
            }`}
          >
            {item.icon}
            <span className="text-xs mt-1 font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};
