import React, { useState } from 'react';
import { X, Lock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordConfirmModalProps {
  isOpen: boolean;
  onConfirm: (password: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  itemName?: string;
}

export default function PasswordConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  isLoading = false,
  itemName = 'this item',
}: PasswordConfirmModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Password is required');
      return;
    }

    try {
      await onConfirm(password);
      setPassword('');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid password');
    }
  };

  const handleCancel = () => {
    setPassword('');
    setError('');
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4 border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-destructive/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-destructive" size={20} />
            </div>
            <h2 className="text-lg font-bold">Confirm Delete</h2>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-foreground/70">
            Are you sure you want to delete {itemName}? This action cannot be undone.
          </p>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Enter password to confirm deletion</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter password"
                className={cn(
                  'w-full pl-10 pr-4 py-2 bg-white/5 border rounded-lg',
                  'text-foreground placeholder-foreground/40',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-white/10',
                  'transition-all',
                  error && 'border-destructive focus:ring-destructive/50'
                )}
                disabled={isLoading}
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-destructive hover:bg-destructive-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
