import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { policyAPI } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import PasswordConfirmModal from '@/components/PasswordConfirmModal';
import { Plus, Trash2, Clock, AlertCircle } from 'lucide-react';

interface Policy {
  _id: string;
  name: string;
  type: string;
  premium: number;
  renewalDate: string;
  notes: string;
  reminderDays: number[];
  status: 'active' | 'expired' | 'upcoming';
}

export default function Policies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; policyId: string; policyName: string }>({
    isOpen: false,
    policyId: '',
    policyName: '',
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'car_insurance',
    premium: '',
    renewalDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await policyAPI.getAll();
      setPolicies(response.data?.policies || []);
    } catch (error: any) {
      if (error?.response?.status === 503) {
        console.warn('Database not connected. Set MONGODB_URI environment variable to enable database features.');
      } else {
        console.error('Error fetching policies:', error);
      }
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await policyAPI.create({
        ...formData,
        premium: parseFloat(formData.premium),
      });
      setFormData({ name: '', type: 'car_insurance', premium: '', renewalDate: '', notes: '' });
      setShowForm(false);
      fetchPolicies();
    } catch (error) {
      console.error('Error creating policy:', error);
    }
  };

  const openDeleteConfirm = (policyId: string, policyName: string) => {
    setDeleteConfirm({ isOpen: true, policyId, policyName });
  };

  const handleDeletePolicy = async (password: string) => {
    if (!deleteConfirm.policyId) return;

    try {
      setDeletingId(deleteConfirm.policyId);
      await policyAPI.delete(deleteConfirm.policyId, { password });

      toast({
        title: 'Success',
        description: 'Policy deleted successfully',
      });
      setDeleteConfirm({ isOpen: false, policyId: '', policyName: '' });
      setDeletingId(null);
      fetchPolicies();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to delete policy';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Error deleting policy:', error);
      setDeletingId(null);
    }
  };

  const getDaysUntilRenewal = (renewalDate: string) => {
    const renewal = new Date(renewalDate);
    const now = new Date();
    const diff = renewal.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300';
      case 'expired':
        return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300';
      default:
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Policies & Renewals</h1>
            <p className="text-foreground/60">Manage insurance and subscription renewals</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            Add Policy
          </button>
        </div>

        {/* Create Policy Form */}
        {showForm && (
          <div className="glass-card">
            <h2 className="text-xl font-bold mb-4">Add New Policy</h2>
            <form onSubmit={handleCreatePolicy} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Policy Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Car Insurance"
                    className="input-glass w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Policy Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input-glass w-full"
                  >
                    <option value="car_insurance">Car Insurance</option>
                    <option value="health_insurance">Health Insurance</option>
                    <option value="vehicle_registration">Vehicle Registration</option>
                    <option value="subscription">Subscription</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Premium Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.premium}
                    onChange={(e) => setFormData({ ...formData, premium: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="input-glass w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Renewal Date</label>
                  <input
                    type="date"
                    value={formData.renewalDate}
                    onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
                    className="input-glass w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Policy details and notes (optional)"
                  className="input-glass w-full h-20 resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 glass rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-700"
                >
                  Add Policy
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Policies Grid */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-foreground/60">Loading policies...</p>
              </div>
            </div>
          ) : policies.length === 0 ? (
            <div className="glass-card text-center py-12">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-foreground/60 mb-4">No policies found. Add your first policy to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {policies.map((policy) => {
                const daysUntil = getDaysUntilRenewal(policy.renewalDate);
                const renewalPercentage = Math.min(100, Math.max(0, (daysUntil / 365) * 100));

                return (
                  <div key={policy._id} className="glass-card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">{policy.name}</h3>
                        <p className="text-sm text-foreground/60 mb-3">{policy.type.replace(/_/g, ' ')}</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(policy.status)}`}>
                          {policy.status}
                        </span>
                      </div>
                      <button
                        onClick={() => openDeleteConfirm(policy._id, policy.name)}
                        className="p-2 glass rounded-lg hover:bg-white/20 dark:hover:bg-white/10 text-destructive"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Premium: ₹{policy.premium.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <Clock size={16} />
                            Renewal in {daysUntil} days
                          </span>
                          {daysUntil < 30 && (
                            <span className="flex items-center gap-1 text-xs text-warning">
                              <AlertCircle size={14} /> Approaching
                            </span>
                          )}
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-600 to-violet-600"
                            style={{ width: `${renewalPercentage}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-foreground/60 mt-2">
                          {new Date(policy.renewalDate).toLocaleDateString('en-IN')}
                        </p>
                      </div>

                      {policy.notes && (
                        <div className="pt-4 border-t border-white/10">
                          <p className="text-sm text-foreground/70">{policy.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Password Confirmation Modal */}
        <PasswordConfirmModal
          isOpen={deleteConfirm.isOpen}
          onConfirm={handleDeletePolicy}
          onCancel={() => setDeleteConfirm({ isOpen: false, policyId: '', policyName: '' })}
          isLoading={deletingId === deleteConfirm.policyId}
          itemName={`policy "${deleteConfirm.policyName}"`}
        />
      </div>
    </MainLayout>
  );
}
