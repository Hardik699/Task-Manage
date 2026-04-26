import React from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300 gradient-mesh">
      {/* Top Navbar */}
      <Sidebar />

      {/* Main Content Area - Enhanced Responsive */}
      <div className="md:ml-64 pt-16 transition-all duration-300">
        <main className="min-h-[calc(100vh-4rem)] mobile-safe-bottom">
          <div className="container-wide">
            <div className="animate-fade-in">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Navigation for Mobile - Enhanced Touch Optimized */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
};
