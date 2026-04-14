import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { paymentAPI } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { TrendingUp, Calendar, Percent, DollarSign, X, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoanPayment {
  _id: string;
  title: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  isLoan?: boolean;
  totalLoanAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
  emiPayments?: Array<{
    date: string;
    amount: number;
  }>;
  loanDetails?: {
    bankName: string;
    loanType: string;
    principalAmount: number;
    interestRate: number;
    tenure: number;
    tenureUnit: 'months' | 'years';
    emiAmount: number;
    startDate: string;
    endDate: string;
    totalInterest: number;
    totalAmount: number;
  };
}

export default function Loans() {
  const [loans, setLoans] = useState<LoanPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [emiModal, setEmiModal] = useState<{ isOpen: boolean; loanId: string; loanTitle: string; emiIndex?: number }>({
    isOpen: false,
    loanId: '',
    loanTitle: '',
    emiIndex: undefined,
  });
  const [emiAmount, setEmiAmount] = useState('');
  const [emiDate, setEmiDate] = useState(new Date().toISOString().split('T')[0]);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    dueDate: '',
    notes: '',
    loanDetails: {
      bankName: '',
      loanType: '',
      principalAmount: '',
      interestRate: '',
      tenure: '',
      tenureUnit: 'months' as 'months' | 'years',
      startDate: '',
    },
  });

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getAll({});
      const allPayments = response.data?.payments || [];
      const loanPayments = allPayments.filter((p: LoanPayment) => p.isLoan);
      setLoans(loanPayments);
    } catch (error: any) {
      if (error?.response?.status === 503) {
        console.warn('Database not connected.');
      } else {
        console.error('Error fetching loans:', error);
      }
      setLoans([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { bankName, loanType, principalAmount, interestRate, tenure, startDate } = formData.loanDetails;
    if (!formData.title || !principalAmount || !interestRate || !tenure || !startDate || !bankName || !loanType) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await paymentAPI.create({
        title: formData.title,
        amount: parseFloat(principalAmount),
        category: formData.category || 'Loan',
        dueDate: startDate,
        notes: formData.notes,
        isLoan: true,
        totalLoanAmount: parseFloat(principalAmount),
        loanDetails: {
          bankName,
          loanType,
          principalAmount: parseFloat(principalAmount),
          interestRate: parseFloat(interestRate),
          tenure: parseFloat(tenure),
          tenureUnit: formData.loanDetails.tenureUnit,
          startDate,
        },
      });

      toast({
        title: 'Success',
        description: 'Loan created successfully',
      });

      setFormData({
        title: '',
        amount: '',
        category: '',
        dueDate: '',
        notes: '',
        loanDetails: {
          bankName: '',
          loanType: '',
          principalAmount: '',
          interestRate: '',
          tenure: '',
          tenureUnit: 'months',
          startDate: '',
        },
      });
      setShowForm(false);
      fetchLoans();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to create loan';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Error creating loan:', error);
    }
  };

  const handleAddEmiPayment = async () => {
    if (!emiAmount || parseFloat(emiAmount) <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (emiModal.emiIndex !== undefined) {
        // Update existing EMI
        await paymentAPI.updateEmiPayment(emiModal.loanId, emiModal.emiIndex, {
          amount: parseFloat(emiAmount),
          date: emiDate,
        });
        toast({
          title: 'Success',
          description: 'EMI payment updated successfully',
        });
      } else {
        // Add new EMI
        await paymentAPI.addEmiPayment(emiModal.loanId, {
          amount: parseFloat(emiAmount),
          date: emiDate,
        });
        toast({
          title: 'Success',
          description: 'EMI payment added successfully',
        });
      }

      setEmiModal({ isOpen: false, loanId: '', loanTitle: '', emiIndex: undefined });
      setEmiAmount('');
      setEmiDate(new Date().toISOString().split('T')[0]);
      fetchLoans();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to process EMI payment';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Error processing EMI payment:', error);
    }
  };

  const totalLoanAmount = loans.reduce((sum, loan) => sum + (loan.loanDetails?.principalAmount || 0), 0);
  const totalPaidAmount = loans.reduce((sum, loan) => sum + (loan.paidAmount || 0), 0);
  const totalRemainingAmount = loans.reduce((sum, loan) => sum + (loan.remainingAmount || 0), 0);
  const totalInterest = loans.reduce((sum, loan) => sum + (loan.loanDetails?.totalInterest || 0), 0);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Loans</h1>
            <p className="text-foreground/60">Track and manage all your loans</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            Add Loan
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-foreground/60 text-sm font-medium">Total Loan Amount</p>
              <DollarSign className="text-primary" size={20} />
            </div>
            <p className="text-3xl font-bold">₹{(totalLoanAmount || 0).toLocaleString('en-IN')}</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-foreground/60 text-sm font-medium">Total Paid</p>
              <TrendingUp className="text-success" size={20} />
            </div>
            <p className="text-3xl font-bold text-success">₹{(totalPaidAmount || 0).toLocaleString('en-IN')}</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-foreground/60 text-sm font-medium">Remaining</p>
              <Calendar className="text-warning" size={20} />
            </div>
            <p className="text-3xl font-bold text-warning">₹{(totalRemainingAmount || 0).toLocaleString('en-IN')}</p>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-foreground/60 text-sm font-medium">Total Interest</p>
              <Percent className="text-info" size={20} />
            </div>
            <p className="text-3xl font-bold text-info">₹{(totalInterest || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Create Loan Form */}
        {showForm && (
          <div className="glass-card">
            <h2 className="text-xl font-bold mb-4">Add New Loan</h2>
            <form onSubmit={handleCreateLoan} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Loan Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Home Loan, Car Loan"
                    className="input-glass w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bank Name</label>
                  <input
                    type="text"
                    value={formData.loanDetails.bankName}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      loanDetails: { ...formData.loanDetails, bankName: e.target.value }
                    })}
                    placeholder="e.g., HDFC Bank"
                    className="input-glass w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Loan Type</label>
                  <input
                    type="text"
                    value={formData.loanDetails.loanType}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      loanDetails: { ...formData.loanDetails, loanType: e.target.value }
                    })}
                    placeholder="e.g., Home Loan, Personal Loan"
                    className="input-glass w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Principal Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.loanDetails.principalAmount}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      loanDetails: { ...formData.loanDetails, principalAmount: e.target.value }
                    })}
                    placeholder="e.g., 500000"
                    step="0.01"
                    min="0"
                    className="input-glass w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Interest Rate (% per annum)</label>
                  <input
                    type="number"
                    value={formData.loanDetails.interestRate}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      loanDetails: { ...formData.loanDetails, interestRate: e.target.value }
                    })}
                    placeholder="e.g., 7.5"
                    step="0.01"
                    min="0"
                    className="input-glass w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tenure</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.loanDetails.tenure}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        loanDetails: { ...formData.loanDetails, tenure: e.target.value }
                      })}
                      placeholder="e.g., 20"
                      step="1"
                      min="1"
                      className="input-glass w-full"
                      required
                    />
                    <select
                      value={formData.loanDetails.tenureUnit}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        loanDetails: { ...formData.loanDetails, tenureUnit: e.target.value as 'months' | 'years' }
                      })}
                      className="input-glass px-3"
                    >
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Loan Start Date</label>
                  <input
                    type="date"
                    value={formData.loanDetails.startDate}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      loanDetails: { ...formData.loanDetails, startDate: e.target.value }
                    })}
                    className="input-glass w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category (Optional)</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Housing, Vehicle"
                    className="input-glass w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about the loan"
                  className="input-glass w-full h-20 resize-none"
                />
              </div>

              <p className="text-xs text-foreground/60">💡 EMI will be calculated automatically based on the details provided</p>

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
                  Add Loan
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loans List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-foreground/60">Loading loans...</p>
              </div>
            </div>
          ) : loans.length === 0 ? (
            <div className="glass-card text-center py-12">
              <div className="text-4xl mb-4">🏦</div>
              <p className="text-foreground/60 mb-4">No loans found. Add your first loan using the button above!</p>
            </div>
          ) : (
            loans.map((loan) => (
              <div
                key={loan._id}
                onClick={() => setSelectedLoanId(loan._id)}
                className="glass-card p-6 cursor-pointer hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold">{loan.title}</h3>
                    <p className="text-foreground/60 text-sm mt-1">
                      {loan.loanDetails?.bankName} • {loan.loanDetails?.loanType}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    loan.status === 'paid' 
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                      : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {loan.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-foreground/60 text-sm mb-1">Principal</p>
                    <p className="text-xl font-bold">₹{loan.loanDetails?.principalAmount.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60 text-sm mb-1">Monthly EMI</p>
                    <p className="text-xl font-bold">₹{loan.loanDetails?.emiAmount.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60 text-sm mb-1">Interest Rate</p>
                    <p className="text-xl font-bold">{loan.loanDetails?.interestRate}% p.a.</p>
                  </div>
                  <div>
                    <p className="text-foreground/60 text-sm mb-1">Tenure</p>
                    <p className="text-xl font-bold">{loan.loanDetails?.tenure} {loan.loanDetails?.tenureUnit}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-foreground/60">Progress</p>
                    <p className="text-sm font-semibold">
                      {loan.totalLoanAmount ? Math.round((loan.paidAmount || 0) / loan.totalLoanAmount * 100) : 0}%
                    </p>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-primary-600 to-violet-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${loan.totalLoanAmount ? Math.round((loan.paidAmount || 0) / loan.totalLoanAmount * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-foreground/60 text-sm mb-1">Paid Amount</p>
                    <p className="text-lg font-bold text-success">₹{(loan.paidAmount || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60 text-sm mb-1">Remaining</p>
                    <p className="text-lg font-bold text-warning">₹{(loan.remainingAmount || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-foreground/60 text-sm mb-1">Total Interest</p>
                    <p className="text-lg font-bold text-info">₹{(loan.loanDetails?.totalInterest || 0).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Loan Detail Modal */}
        {selectedLoanId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="glass-card max-w-2xl w-full p-8 my-8">
              {(() => {
                const loan = loans.find(l => l._id === selectedLoanId);
                if (!loan) return null;

                return (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div>
                        <h1 className="text-3xl font-bold">{loan.title}</h1>
                        <p className="text-foreground/60 mt-1">
                          {loan.loanDetails?.bankName} • {loan.loanDetails?.loanType}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedLoanId(null)}
                        className="p-2 hover:bg-white/10 rounded-lg"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    {/* Loan Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-foreground/60 text-sm mb-1">💰 Principal</p>
                        <p className="text-2xl font-bold">₹{loan.loanDetails?.principalAmount.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-foreground/60 text-sm mb-1">📊 Interest Rate</p>
                        <p className="text-2xl font-bold">{loan.loanDetails?.interestRate}% p.a.</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-foreground/60 text-sm mb-1">⏱️ Tenure</p>
                        <p className="text-2xl font-bold">{loan.loanDetails?.tenure} {loan.loanDetails?.tenureUnit}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-foreground/60 text-sm mb-1">📅 Monthly EMI</p>
                        <p className="text-2xl font-bold">₹{loan.loanDetails?.emiAmount.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-foreground/60 text-sm mb-1">📈 Total Interest</p>
                        <p className="text-2xl font-bold">₹{loan.loanDetails?.totalInterest.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-foreground/60 text-sm mb-1">💵 Total Amount</p>
                        <p className="text-2xl font-bold">₹{loan.loanDetails?.totalAmount.toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-foreground/60 text-sm mb-2">📍 Loan Duration</p>
                      <p className="font-semibold">
                        {new Date(loan.loanDetails?.startDate || '').toLocaleDateString('en-IN')} to {new Date(loan.loanDetails?.endDate || '').toLocaleDateString('en-IN')}
                      </p>
                    </div>

                    {/* Payment Progress */}
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold">Payment Progress</h2>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-success/20 rounded-lg border border-success/50">
                          <p className="text-foreground/60 text-sm mb-1">Paid Amount</p>
                          <p className="text-2xl font-bold text-success">₹{(loan.paidAmount || 0).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="p-4 bg-warning/20 rounded-lg border border-warning/50">
                          <p className="text-foreground/60 text-sm mb-1">Remaining</p>
                          <p className="text-2xl font-bold text-warning">₹{(loan.remainingAmount || 0).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="p-4 bg-info/20 rounded-lg border border-info/50">
                          <p className="text-foreground/60 text-sm mb-1">Status</p>
                          <p className="text-2xl font-bold text-info capitalize">{loan.status}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-foreground/60">Overall Progress</p>
                          <p className="text-sm font-semibold">
                            {loan.totalLoanAmount ? Math.round((loan.paidAmount || 0) / loan.totalLoanAmount * 100) : 0}%
                          </p>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-success to-primary h-3 rounded-full transition-all"
                            style={{
                              width: `${loan.totalLoanAmount ? Math.round((loan.paidAmount || 0) / loan.totalLoanAmount * 100) : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* EMI History */}
                    {loan.emiPayments && loan.emiPayments.length > 0 && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-bold">EMI Payment History</h2>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {loan.emiPayments.map((emi, idx) => (
                            <div key={idx} className="p-3 bg-white/5 rounded border border-white/10 flex items-center justify-between">
                              <div>
                                <p className="font-semibold">EMI #{idx + 1}</p>
                                <p className="text-sm text-foreground/60">
                                  📅 {new Date(emi.date).toLocaleDateString('en-IN')} {new Date(emi.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <p className="text-lg font-bold">₹{emi.amount.toLocaleString('en-IN')}</p>
                                <button
                                  onClick={() => {
                                    setEmiModal({ isOpen: true, loanId: loan._id, loanTitle: loan.title, emiIndex: idx });
                                    setEmiAmount(emi.amount.toString());
                                    setEmiDate(new Date(emi.date).toISOString().split('T')[0]);
                                  }}
                                  className="p-1 hover:bg-white/10 rounded text-info"
                                  title="Edit EMI"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm('Are you sure you want to delete this EMI payment?')) {
                                      try {
                                        await paymentAPI.deleteEmiPayment(loan._id, idx);
                                        toast({
                                          title: 'Success',
                                          description: 'EMI payment deleted successfully',
                                        });
                                        fetchLoans();
                                      } catch (error: any) {
                                        toast({
                                          title: 'Error',
                                          description: error?.response?.data?.error || 'Failed to delete EMI payment',
                                          variant: 'destructive',
                                        });
                                      }
                                    }
                                  }}
                                  className="p-1 hover:bg-white/10 rounded text-destructive"
                                  title="Delete EMI"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Close Button */}
                    <div className="flex gap-2 justify-end border-t border-white/10 pt-4">
                      {loan.status !== 'paid' && (
                        <button
                          onClick={() => {
                            setSelectedLoanId(null);
                            setEmiModal({ isOpen: true, loanId: loan._id, loanTitle: loan.title });
                          }}
                          className="px-4 py-2 bg-info text-white rounded-lg font-medium hover:bg-info/80"
                        >
                          💰 Add EMI Payment
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedLoanId(null)}
                        className="px-4 py-2 glass rounded-lg font-medium"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* EMI Payment Modal */}
        {emiModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-card max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {emiModal.emiIndex !== undefined ? 'Edit EMI Payment' : 'Add EMI Payment'}
                </h2>
                <button
                  onClick={() => {
                    setEmiModal({ isOpen: false, loanId: '', loanTitle: '', emiIndex: undefined });
                    setEmiAmount('');
                    setEmiDate(new Date().toISOString().split('T')[0]);
                  }}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-foreground/70 mb-4">Loan: <span className="font-semibold">{emiModal.loanTitle}</span></p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Amount (₹)</label>
                  <input
                    type="number"
                    value={emiAmount}
                    onChange={(e) => setEmiAmount(e.target.value)}
                    placeholder="Enter amount"
                    step="0.01"
                    min="0"
                    className="input-glass w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Payment Date</label>
                  <input
                    type="date"
                    value={emiDate}
                    onChange={(e) => setEmiDate(e.target.value)}
                    className="input-glass w-full"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setEmiModal({ isOpen: false, loanId: '', loanTitle: '', emiIndex: undefined });
                      setEmiAmount('');
                      setEmiDate(new Date().toISOString().split('T')[0]);
                    }}
                    className="px-4 py-2 glass rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddEmiPayment}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-700"
                  >
                    {emiModal.emiIndex !== undefined ? 'Update Payment' : 'Add Payment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
