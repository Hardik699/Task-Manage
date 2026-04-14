import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { goalAPI } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import PasswordConfirmModal from '@/components/PasswordConfirmModal';
import { Plus, Trash2, TrendingUp, Target, X } from 'lucide-react';

interface Goal {
  _id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  category: 'business' | 'education' | 'travel' | 'home' | 'vehicle' | 'other';
  deadline?: string;
  status: 'active' | 'completed' | 'abandoned';
  investmentType?: 'sip' | 'fd' | 'rd' | 'ppf' | 'nps' | 'stocks' | 'mutual_fund' | 'savings' | 'other';
  monthlyContribution?: number;
  interestRate?: number;
  maturityDate?: string;
  reminderDay?: number;
  fundName?: string;
  savings: Array<{
    date: string;
    amount: number;
    type: 'sip' | 'fd' | 'rd' | 'ppf' | 'nps' | 'stocks' | 'mutual_fund' | 'savings' | 'other';
    fundName?: string;
    note?: string;
  }>;
}

const categoryEmojis: Record<string, string> = {
  business: '💼',
  education: '🎓',
  travel: '✈️',
  home: '🏠',
  vehicle: '🚗',
  other: '🎯',
};

const savingTypeColors: Record<string, string> = {
  sip: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  fd: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  rd: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
  ppf: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  nps: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
  stocks: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  mutual_fund: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
  savings: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  other: 'bg-gray-100 dark:bg-gray-900/40 text-gray-700 dark:text-gray-300',
};

const savingTypeLabels: Record<string, string> = {
  sip: '📈 SIP',
  fd: '🏦 Fixed Deposit',
  rd: '💰 Recurring Deposit',
  ppf: '🛡️ PPF',
  nps: '🎯 NPS',
  stocks: '📊 Stocks',
  mutual_fund: '📉 Mutual Fund',
  savings: '💵 Savings',
  other: '🔹 Other',
};

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showSIPForm, setShowSIPForm] = useState(false);
  const [showSavingModal, setShowSavingModal] = useState<{ isOpen: boolean; goalId: string; goalTitle: string }>({
    isOpen: false,
    goalId: '',
    goalTitle: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; goalId: string; goalName: string }>({
    isOpen: false,
    goalId: '',
    goalName: '',
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingAmount, setSavingAmount] = useState('');
  const [savingType, setSavingType] = useState<'sip' | 'fd' | 'rd' | 'ppf' | 'nps' | 'stocks' | 'mutual_fund' | 'savings' | 'other'>('savings');
  const [savingFundName, setSavingFundName] = useState('');
  const [savingNote, setSavingNote] = useState('');
  const [existingFunds, setExistingFunds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    category: 'other' as const,
    deadline: '',
    investmentType: 'savings' as 'sip' | 'fd' | 'rd' | 'ppf' | 'nps' | 'stocks' | 'mutual_fund' | 'savings' | 'other',
    monthlyContribution: '',
    interestRate: '',
    maturityDate: '',
    reminderDay: '',
    fundName: '',
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await goalAPI.getAll();
      setGoals(response.data?.goals || []);
    } catch (error: any) {
      if (error?.response?.status === 503) {
        console.warn('Database not connected.');
      } else {
        console.error('Error fetching goals:', error);
      }
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For SIP/investments, target amount is optional if monthly contribution is provided
    const isSIPInvestment = ['sip', 'fd', 'rd', 'ppf', 'nps', 'mutual_fund'].includes(formData.investmentType);
    const hasMonthlyContribution = formData.monthlyContribution && parseFloat(formData.monthlyContribution) > 0;
    
    if (!formData.title) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a goal title',
        variant: 'destructive',
      });
      return;
    }
    
    if (!formData.targetAmount && !(isSIPInvestment && hasMonthlyContribution)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter target amount or monthly contribution for investment',
        variant: 'destructive',
      });
      return;
    }

    try {
      const goalData: any = {
        ...formData,
        targetAmount: formData.targetAmount ? parseFloat(formData.targetAmount) : 0,
      };
      
      await goalAPI.create(goalData);

      toast({
        title: 'Success',
        description: 'Goal created successfully',
      });

      setFormData({ 
        title: '', 
        description: '', 
        targetAmount: '', 
        category: 'other', 
        deadline: '',
        investmentType: 'savings',
        monthlyContribution: '',
        interestRate: '',
        maturityDate: '',
        reminderDay: '',
        fundName: '',
      });
      setShowForm(false);
      fetchGoals();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to create goal';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleAddSaving = async () => {
    if (!savingAmount || parseFloat(savingAmount) <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      await goalAPI.addSaving(showSavingModal.goalId, {
        amount: parseFloat(savingAmount),
        type: savingType,
        fundName: savingFundName,
        note: savingNote,
        date: new Date().toISOString(),
      });

      toast({
        title: 'Success',
        description: 'Saving added successfully',
      });

      setSavingAmount('');
      setSavingType('savings');
      setSavingFundName('');
      setSavingNote('');
      setShowSavingModal({ isOpen: false, goalId: '', goalTitle: '' });
      fetchGoals();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to add saving';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const openDeleteConfirm = (goalId: string, goalName: string) => {
    setDeleteConfirm({ isOpen: true, goalId, goalName });
  };

  const handleDeleteGoal = async (password: string) => {
    if (!deleteConfirm.goalId) return;

    try {
      setDeletingId(deleteConfirm.goalId);
      await goalAPI.delete(deleteConfirm.goalId, { password });

      toast({
        title: 'Success',
        description: 'Goal deleted successfully',
      });

      setDeleteConfirm({ isOpen: false, goalId: '', goalName: '' });
      setDeletingId(null);
      fetchGoals();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to delete goal';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setDeletingId(null);
    }
  };

  const totalSavings = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Savings Goals</h1>
            <p className="text-foreground/60">Track your dreams and savings</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSIPForm(!showSIPForm)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              <Plus size={20} />
              📈 New SIP
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              <Plus size={20} />
              New Goal
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-foreground/60 text-sm font-medium mb-1">Total Saved</p>
                <p className="text-3xl font-bold">₹{totalSavings.toLocaleString('en-IN')}</p>
              </div>
              <div className="w-12 h-12 bg-success/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-success" size={24} />
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-foreground/60 text-sm font-medium mb-1">Total Target</p>
                <p className="text-3xl font-bold">₹{totalTarget.toLocaleString('en-IN')}</p>
              </div>
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                <Target className="text-primary" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Create SIP Form - Simplified */}
        {showSIPForm && (
          <div className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="text-2xl">📈</span>
                Create New SIP
              </h2>
              <button
                onClick={() => setShowSIPForm(false)}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              // Use the same handler but with SIP defaults
              const sipData = {
                ...formData,
                investmentType: 'sip' as const,
                category: 'other' as const,
              };
              setFormData(sipData);
              handleCreateGoal(e);
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">SIP Name *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., HDFC Top 100 SIP"
                    className="input-glass w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Fund Name *</label>
                  <input
                    type="text"
                    value={formData.fundName}
                    onChange={(e) => setFormData({ ...formData, fundName: e.target.value })}
                    placeholder="e.g., HDFC Top 100"
                    className="input-glass w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Monthly Investment (₹) *</label>
                  <input
                    type="number"
                    value={formData.monthlyContribution}
                    onChange={(e) => setFormData({ ...formData, monthlyContribution: e.target.value })}
                    placeholder="e.g., 5000"
                    step="0.01"
                    min="0"
                    className="input-glass w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Reminder Day (1-31) *</label>
                  <input
                    type="number"
                    value={formData.reminderDay}
                    onChange={(e) => setFormData({ ...formData, reminderDay: e.target.value })}
                    placeholder="e.g., 5"
                    min="1"
                    max="31"
                    className="input-glass w-full"
                    required
                  />
                  <p className="text-xs text-foreground/60 mt-1">
                    🔔 Day of month for investment reminder
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Expected Return (% p.a.)</label>
                  <input
                    type="number"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                    placeholder="e.g., 12"
                    step="0.01"
                    min="0"
                    max="100"
                    className="input-glass w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Target Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    placeholder="Optional"
                    step="0.01"
                    min="0"
                    className="input-glass w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Any additional notes about this SIP..."
                  className="input-glass w-full h-20 resize-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-info/10 border border-info/30">
                <p className="text-xs text-foreground/80 flex items-start gap-2">
                  <span className="text-base">💡</span>
                  <span>
                    SIP (Systematic Investment Plan) helps you invest regularly. You'll get a reminder on the {formData.reminderDay || 'selected'} day of every month.
                  </span>
                </p>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowSIPForm(false)}
                  className="px-4 py-2 glass rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Create SIP
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Create Goal Form */}
        {showForm && (
          <div className="glass-card">
            <h2 className="text-xl font-bold mb-4">Create New Goal</h2>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Goal Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Coffee Shop"
                    className="input-glass w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Target Amount (₹)
                    {['sip', 'fd', 'rd', 'ppf', 'nps', 'mutual_fund'].includes(formData.investmentType) && (
                      <span className="text-xs text-foreground/60 ml-2">(Optional for investments)</span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    placeholder={['sip', 'fd', 'rd', 'ppf', 'nps', 'mutual_fund'].includes(formData.investmentType) 
                      ? "Optional - leave blank for ongoing investment" 
                      : "0.00"}
                    step="0.01"
                    min="0"
                    className="input-glass w-full"
                  />
                  {['sip', 'fd', 'rd', 'ppf', 'nps', 'mutual_fund'].includes(formData.investmentType) && !formData.targetAmount && (
                    <p className="text-xs text-foreground/60 mt-1">
                      💡 For ongoing investments, you can skip target amount and just track contributions
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="input-glass w-full"
                  >
                    <option value="business">💼 Business</option>
                    <option value="education">🎓 Education</option>
                    <option value="travel">✈️ Travel</option>
                    <option value="home">🏠 Home</option>
                    <option value="vehicle">🚗 Vehicle</option>
                    <option value="other">🎯 Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Deadline
                    {['sip', 'fd', 'rd', 'ppf', 'nps', 'mutual_fund'].includes(formData.investmentType) && (
                      <span className="text-xs text-foreground/60 ml-2">(Optional)</span>
                    )}
                  </label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="input-glass w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Why do you want to achieve this goal?"
                  className="input-glass w-full h-20 resize-none"
                />
              </div>

              {/* Investment/Savings Options */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-violet/5 border border-primary/20 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <span className="text-lg">💰</span>
                  Investment/Savings Plan (Optional)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Investment Type</label>
                    <select
                      value={formData.investmentType}
                      onChange={(e) => setFormData({ ...formData, investmentType: e.target.value as any })}
                      className="input-glass w-full"
                    >
                      <option value="savings">💵 Savings Account</option>
                      <option value="sip">📈 SIP (Systematic Investment Plan)</option>
                      <option value="fd">🏦 Fixed Deposit (FD)</option>
                      <option value="rd">💰 Recurring Deposit (RD)</option>
                      <option value="ppf">🛡️ Public Provident Fund (PPF)</option>
                      <option value="nps">🎯 National Pension System (NPS)</option>
                      <option value="stocks">📊 Stocks</option>
                      <option value="mutual_fund">📉 Mutual Funds</option>
                      <option value="other">🔹 Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Monthly Contribution (₹)</label>
                    <input
                      type="number"
                      value={formData.monthlyContribution}
                      onChange={(e) => setFormData({ ...formData, monthlyContribution: e.target.value })}
                      placeholder="e.g., 5000"
                      step="0.01"
                      min="0"
                      className="input-glass w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Interest Rate (% per annum)</label>
                    <input
                      type="number"
                      value={formData.interestRate}
                      onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                      placeholder="e.g., 7.5"
                      step="0.01"
                      min="0"
                      max="100"
                      className="input-glass w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Maturity Date</label>
                    <input
                      type="date"
                      value={formData.maturityDate}
                      onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
                      className="input-glass w-full"
                    />
                  </div>
                </div>

                {/* SIP/Mutual Fund specific fields */}
                {(formData.investmentType === 'sip' || formData.investmentType === 'mutual_fund') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Fund Name</label>
                      <input
                        type="text"
                        value={formData.fundName}
                        onChange={(e) => setFormData({ ...formData, fundName: e.target.value })}
                        placeholder="e.g., HDFC Top 100, ICICI Bluechip"
                        className="input-glass w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Reminder Day (1-31)</label>
                      <input
                        type="number"
                        value={formData.reminderDay}
                        onChange={(e) => setFormData({ ...formData, reminderDay: e.target.value })}
                        placeholder="e.g., 5 (for 5th of every month)"
                        min="1"
                        max="31"
                        className="input-glass w-full"
                      />
                      <p className="text-xs text-foreground/60 mt-1">
                        💡 You'll get a reminder on this day each month
                      </p>
                    </div>
                  </div>
                )}

                {formData.monthlyContribution && formData.deadline && (
                  <div className="p-3 rounded-lg bg-info/10 border border-info/30">
                    <p className="text-xs text-foreground/80 flex items-start gap-2">
                      <span className="text-base">💡</span>
                      <span>
                        With ₹{parseFloat(formData.monthlyContribution).toLocaleString('en-IN')}/month, 
                        you'll save approximately ₹{(parseFloat(formData.monthlyContribution) * 
                        Math.ceil((new Date(formData.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30))).toLocaleString('en-IN')} 
                        by your deadline.
                      </span>
                    </p>
                  </div>
                )}
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
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Goals List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-foreground/60">Loading goals...</p>
              </div>
            </div>
          ) : goals.length === 0 ? (
            <div className="glass-card text-center py-12">
              <div className="text-4xl mb-4">🎯</div>
              <p className="text-foreground/60 mb-4">No goals yet. Create your first goal to get started!</p>
            </div>
          ) : (
            goals.map((goal) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              const remaining = goal.targetAmount - goal.currentAmount;

              return (
                <div key={goal._id} className="glass-card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{categoryEmojis[goal.category]}</span>
                        <h3 className="text-xl font-bold">{goal.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          goal.status === 'completed' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' :
                          goal.status === 'abandoned' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' :
                          'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                        }`}>
                          {goal.status}
                        </span>
                      </div>

                      {goal.description && (
                        <p className="text-sm text-foreground/70 mb-2">{goal.description}</p>
                      )}

                      {/* Investment Info */}
                      {goal.investmentType && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${savingTypeColors[goal.investmentType]}`}>
                            {savingTypeLabels[goal.investmentType]}
                          </span>
                          {goal.fundName && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-violet/20 text-violet-600 dark:text-violet-400">
                              🏦 {goal.fundName}
                            </span>
                          )}
                          {goal.monthlyContribution && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-primary/20 text-primary">
                              💰 ₹{goal.monthlyContribution.toLocaleString('en-IN')}/month
                            </span>
                          )}
                          {goal.reminderDay && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-warning/20 text-warning">
                              🔔 Reminder: {goal.reminderDay}th of month
                            </span>
                          )}
                          {goal.interestRate && (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-success/20 text-success">
                              📊 {goal.interestRate}% p.a.
                            </span>
                          )}
                        </div>
                      )}

                      {goal.deadline && (
                        <p className="text-xs text-foreground/60">📅 Deadline: {new Date(goal.deadline).toLocaleDateString('en-IN')}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold">₹{goal.currentAmount.toLocaleString('en-IN')}</p>
                      <p className="text-sm text-foreground/60">of ₹{goal.targetAmount.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Remaining: ₹{remaining.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{Math.round(progress)}% Complete</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-600 to-violet-600 transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Savings History */}
                  {goal.savings.length > 0 && (
                    <div className="mb-4 p-3 bg-white/5 rounded-lg">
                      <p className="text-sm font-medium mb-2">Recent Savings:</p>
                      <div className="space-y-1">
                        {goal.savings.slice(-3).reverse().map((saving, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${savingTypeColors[saving.type]}`}>
                                {savingTypeLabels[saving.type]}
                              </span>
                              {saving.fundName && (
                                <span className="text-violet-600 dark:text-violet-400 font-medium">
                                  🏦 {saving.fundName}
                                </span>
                              )}
                              {saving.note && <span className="text-foreground/60">{saving.note}</span>}
                            </div>
                            <span className="font-semibold">+₹{saving.amount.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {goal.status === 'active' && (
                      <button
                        onClick={() => {
                          // Extract existing fund names from this goal's savings
                          const funds = goal.savings
                            .filter(s => s.fundName)
                            .map(s => s.fundName!)
                            .filter((v, i, a) => a.indexOf(v) === i); // unique
                          
                          // Add goal's fund name if it exists
                          if (goal.fundName && !funds.includes(goal.fundName)) {
                            funds.unshift(goal.fundName); // Add at beginning
                          }
                          
                          setExistingFunds(funds);
                          
                          // Auto-set fund name if goal has one
                          if (goal.fundName) {
                            setSavingFundName(goal.fundName);
                          }
                          
                          // Auto-set type if goal has investment type
                          if (goal.investmentType) {
                            setSavingType(goal.investmentType);
                          }
                          
                          setShowSavingModal({ isOpen: true, goalId: goal._id, goalTitle: goal.title });
                        }}
                        className="flex-1 px-4 py-2 glass rounded-lg font-medium hover:bg-white/20 dark:hover:bg-white/10 transition-all"
                      >
                        💰 Add Saving
                      </button>
                    )}
                    <button
                      onClick={() => openDeleteConfirm(goal._id, goal.title)}
                      className="px-4 py-2 glass rounded-lg hover:bg-white/20 dark:hover:bg-white/10 text-destructive transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Saving Modal */}
        {showSavingModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-card max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Add Saving</h2>
                <button
                  onClick={() => setShowSavingModal({ isOpen: false, goalId: '', goalTitle: '' })}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-foreground/70 mb-4">Goal: <span className="font-semibold">{showSavingModal.goalTitle}</span></p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Amount (₹)</label>
                  <input
                    type="number"
                    value={savingAmount}
                    onChange={(e) => setSavingAmount(e.target.value)}
                    placeholder="Enter amount"
                    step="0.01"
                    min="0"
                    className="input-glass w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={savingType}
                    onChange={(e) => setSavingType(e.target.value as any)}
                    className="input-glass w-full"
                  >
                    <option value="savings">💵 Savings Account</option>
                    <option value="sip">📈 SIP</option>
                    <option value="fd">🏦 Fixed Deposit (FD)</option>
                    <option value="rd">💰 Recurring Deposit (RD)</option>
                    <option value="ppf">🛡️ PPF</option>
                    <option value="nps">🎯 NPS</option>
                    <option value="stocks">📊 Stocks</option>
                    <option value="mutual_fund">📉 Mutual Funds</option>
                    <option value="other">🔹 Other</option>
                  </select>
                </div>

                {/* Fund Name for SIP/Mutual Funds */}
                {(savingType === 'sip' || savingType === 'mutual_fund') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Fund Name</label>
                    {existingFunds.length > 0 ? (
                      <>
                        <select
                          value={savingFundName}
                          onChange={(e) => setSavingFundName(e.target.value)}
                          className="input-glass w-full"
                        >
                          <option value="">Select existing fund or type new</option>
                          {existingFunds.map((fund) => (
                            <option key={fund} value={fund}>
                              {fund}
                            </option>
                          ))}
                          <option value="__new__">➕ Add New Fund</option>
                        </select>
                        {savingFundName === '__new__' && (
                          <input
                            type="text"
                            value=""
                            onChange={(e) => setSavingFundName(e.target.value)}
                            placeholder="Enter new fund name"
                            className="input-glass w-full mt-2"
                            autoFocus
                          />
                        )}
                      </>
                    ) : (
                      <input
                        type="text"
                        value={savingFundName}
                        onChange={(e) => setSavingFundName(e.target.value)}
                        placeholder="e.g., HDFC Top 100"
                        className="input-glass w-full"
                      />
                    )}
                    <p className="text-xs text-foreground/60 mt-1">
                      💡 {existingFunds.length > 0 
                        ? `${existingFunds.length} existing fund${existingFunds.length > 1 ? 's' : ''} found` 
                        : 'Enter fund name (e.g., HDFC Top 100, ICICI Bluechip)'}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Note (Optional)</label>
                  <input
                    type="text"
                    value={savingNote}
                    onChange={(e) => setSavingNote(e.target.value)}
                    placeholder="e.g., Monthly savings"
                    className="input-glass w-full"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowSavingModal({ isOpen: false, goalId: '', goalTitle: '' })}
                    className="px-4 py-2 glass rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSaving}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-700"
                  >
                    Add Saving
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Password Confirmation Modal */}
        <PasswordConfirmModal
          isOpen={deleteConfirm.isOpen}
          onConfirm={handleDeleteGoal}
          onCancel={() => setDeleteConfirm({ isOpen: false, goalId: '', goalName: '' })}
          isLoading={deletingId === deleteConfirm.goalId}
          itemName={`goal "${deleteConfirm.goalName}"`}
        />
      </div>
    </MainLayout>
  );
}
