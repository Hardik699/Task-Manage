import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';

interface PlaceholderPageProps {
  title: string;
  description: string;
  emoji: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description, emoji }) => {
  return (
    <MainLayout>
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-7xl mb-6">{emoji}</div>
          <h1 className="text-4xl font-bold mb-4">{title}</h1>
          <p className="text-foreground/60 text-lg mb-8">{description}</p>
          <div className="glass-card p-6 text-left">
            <p className="text-sm text-foreground/60 mb-2">Coming soon! Continue prompting to build this page:</p>
            <code className="text-xs text-primary bg-black/20 dark:bg-white/5 p-3 rounded block break-words">
              "Build the {title.toLowerCase()} page with full functionality"
            </code>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
