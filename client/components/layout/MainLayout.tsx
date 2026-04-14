import React from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top Navbar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="md:ml-64 pt-16">
        <main className="min-h-[calc(100vh-4rem)] pb-20 md:pb-8">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
};
