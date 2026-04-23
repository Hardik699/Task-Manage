import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { expenseAPI } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import PasswordConfirmModal from '@/components/PasswordConfirmModal';
import { Plus, Trash2, TrendingUp, Download, Edit2, X, Upload, FileText, Image as ImageIcon } from 'lucide-react';

interface Expense {
  _id: string;
  amount: number;
  category: string;
  note: string;
  date: string;
  paymentMethod: string;
  source: 'website' | 'telegram';
  isRecurring?: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurringInterval?: number;
  nextDate?: string;
  reminderDays?: number;
  attachments?: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    fileData: string;
    uploadedAt: string;
  }>;
}

interface CategoryStats {
  _id: string;
  total: number;
  count: number;
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<CategoryStats[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; expenseId: string; expenseName: string }>({
    isOpen: false,
    expenseId: '',
    expenseName: '',
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grouped' | 'individual'>('grouped');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    note: '',
    paymentMethod: '',
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    recurringInterval: 1,
    reminderDays: 3,
  });

  // Load categories and payment methods from localStorage
  useEffect(() => {
    const savedCategories = localStorage.getItem('expense-categories');
    const savedPaymentMethods = localStorage.getItem('expense-payment-methods');
    
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories));
    }
    if (savedPaymentMethods) {
      setPaymentMethods(JSON.parse(savedPaymentMethods));
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [selectedCategory, startDate, endDate]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params: any = { 
        limit: 1000,
        _t: Date.now() // Cache busting parameter
      };
      if (selectedCategory) params.category = selectedCategory;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [expenseRes, statsRes] = await Promise.all([
        expenseAPI.getAll(params),
        expenseAPI.getStats(params),
      ]);

      const expenses = expenseRes.data?.expenses || [];
      setExpenses(expenses);
      
      const stats = Array.isArray(statsRes.data?.stats) ? statsRes.data.stats : [];
      setStats(stats);
      
      // Calculate total from expenses list
      const total = expenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0);
      setTotalExpenses(total);

      // Extract unique categories from API
      const uniqueCategories = Array.from(
        new Set([...categories, ...expenses.map((e: Expense) => e.category)])
      ) as string[];
      setCategories(uniqueCategories);
      localStorage.setItem('expense-categories', JSON.stringify(uniqueCategories));

      // Extract unique payment methods from API
      const uniquePaymentMethods = Array.from(
        new Set([...paymentMethods, ...expenses.map((e: Expense) => e.paymentMethod).filter(Boolean)])
      ) as string[];
      setPaymentMethods(uniquePaymentMethods);
      localStorage.setItem('expense-payment-methods', JSON.stringify(uniquePaymentMethods));
    } catch (error: any) {
      if (error?.response?.status === 503) {
        console.warn('Database not connected. Set MONGODB_URI environment variable to enable database features.');
      } else {
        console.error('Error fetching expenses:', error);
      }
      setExpenses([]);
      setStats([]);
      setTotalExpenses(0);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (amount and category)',
        variant: 'destructive',
      });
      return;
    }
    try {
      if (editingId) {
        await expenseAPI.update(editingId, {
          ...formData,
          amount: parseFloat(formData.amount),
        });
        toast({
          title: 'Success',
          description: 'Expense updated successfully',
        });
      } else {
        await expenseAPI.create({
          ...formData,
          amount: parseFloat(formData.amount),
        });
        toast({
          title: 'Success',
          description: 'Expense added successfully',
        });
      }

      // Save category to localStorage
      if (formData.category && !categories.includes(formData.category)) {
        const updatedCategories = [...categories, formData.category];
        setCategories(updatedCategories);
        localStorage.setItem('expense-categories', JSON.stringify(updatedCategories));
      }

      // Save payment method to localStorage
      if (formData.paymentMethod && !paymentMethods.includes(formData.paymentMethod)) {
        const updatedPaymentMethods = [...paymentMethods, formData.paymentMethod];
        setPaymentMethods(updatedPaymentMethods);
        localStorage.setItem('expense-payment-methods', JSON.stringify(updatedPaymentMethods));
      }

      // Reset form and close modal
      setFormData({ 
        amount: '', 
        category: '', 
        note: '', 
        paymentMethod: '', 
        date: new Date().toISOString().split('T')[0],
        isRecurring: false,
        frequency: 'monthly',
        recurringInterval: 1,
        reminderDays: 3,
      });
      setEditingId(null);
      setShowForm(false);
      
      // Force refresh expenses data
      await fetchExpenses();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || `Failed to ${editingId ? 'update' : 'create'} expense`;
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Error saving expense:', error);
    }
  };

  const openDeleteConfirm = (expenseId: string, expenseName: string) => {
    setDeleteConfirm({ isOpen: true, expenseId, expenseName });
  };

  const handleDeleteExpense = async (password: string) => {
    if (!deleteConfirm.expenseId) return;

    try {
      setDeletingId(deleteConfirm.expenseId);
      await expenseAPI.delete(deleteConfirm.expenseId, { password });

      toast({
        title: 'Success',
        description: 'Expense deleted successfully',
      });
      setDeleteConfirm({ isOpen: false, expenseId: '', expenseName: '' });
      setDeletingId(null);
      fetchExpenses();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to delete expense';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Error deleting expense:', error);
      setDeletingId(null);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingId(expense._id);
    setFormData({
      amount: expense.amount.toString(),
      category: expense.category,
      note: expense.note,
      paymentMethod: expense.paymentMethod,
      date: new Date(expense.date).toISOString().split('T')[0],
      isRecurring: expense.isRecurring || false,
      frequency: expense.frequency || 'monthly',
      recurringInterval: expense.recurringInterval || 1,
      reminderDays: expense.reminderDays !== undefined ? expense.reminderDays : 3,
    });
    setShowForm(true);
    // Scroll to top to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ 
      amount: '', 
      category: '', 
      note: '', 
      paymentMethod: '', 
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      frequency: 'monthly',
      recurringInterval: 1,
      reminderDays: 3,
    });
    setShowForm(false);
  };

  const handleFileUpload = async (expenseId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Error',
        description: 'Only images (JPEG, PNG, GIF) and PDF files are allowed',
        variant: 'destructive',
      });
      return;
    }

    setUploadingFile(true);

    // Convert file to base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string;

        await expenseAPI.uploadAttachment(expenseId, {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileData: base64String,
        });

        toast({
          title: 'Success',
          description: 'File uploaded successfully',
        });

        // Refresh expenses to show the new attachment
        console.log('Fetching expenses after upload...');
        await fetchExpenses();
        console.log('Expenses fetched successfully');
      } catch (error: any) {
        const errorMessage = error?.response?.data?.error || 'Failed to upload file';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        console.error('Error uploading file:', error);
      } finally {
        setUploadingFile(false);
        // Clear the input so same file can be uploaded again
        event.target.value = '';
      }
    };

    reader.onerror = () => {
      toast({
        title: 'Error',
        description: 'Failed to read file',
        variant: 'destructive',
      });
      setUploadingFile(false);
      event.target.value = '';
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteAttachment = async (expenseId: string, attachmentIndex: number) => {
    try {
      await expenseAPI.deleteAttachment(expenseId, attachmentIndex);

      toast({
        title: 'Success',
        description: 'Attachment deleted successfully',
      });

      // Refresh expenses to update the list
      await fetchExpenses();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to delete attachment';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Error deleting attachment:', error);
    }
  };

  const downloadAttachment = (attachment: any) => {
    const link = document.createElement('a');
    link.href = attachment.fileData;
    link.download = attachment.fileName;
    link.click();
  };

  const handleExportCSV = () => {
    const headers = 'Date,Category,Amount,Note,Payment Method,Source\n';
    const rows = expenses.map((e) => 
      `${new Date(e.date).toLocaleDateString('en-IN')},${e.category},${e.amount},"${(e.note || '').replace(/"/g, '""')}",${e.paymentMethod || ''},${e.source}`
    ).join('\n');
    
    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Success',
      description: 'Expenses exported to CSV',
    });
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const groupedExpenses = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = [];
    }
    acc[expense.category].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Expenses</h1>
            <p className="text-foreground/60">Track and analyze your spending</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 glass rounded-lg font-medium hover:bg-white/20 dark:hover:bg-white/10 transition-all"
            >
              <Download size={20} />
              Export CSV
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              <Plus size={20} />
              Add Expense
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground/60 text-sm font-medium mb-1">Total Expenses</p>
              <p className="text-4xl font-bold">₹{totalExpenses.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-primary" size={32} />
            </div>
          </div>
        </div>

        {/* Create/Edit Expense Form - Full Page Style */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="glass-card max-w-3xl w-full my-8 animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{editingId ? '✏️ Edit Expense' : '➕ Add New Expense'}</h2>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                  type="button"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleCreateExpense} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Amount (₹) *</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="input-glass w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Category *</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Food, Transport"
                      list="categories"
                      className="input-glass w-full"
                      required
                    />
                    <datalist id="categories">
                      {categories.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Payment Method</label>
                    <input
                      type="text"
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      placeholder="e.g., Card, Cash, UPI"
                      list="payment-methods"
                      className="input-glass w-full"
                    />
                    <datalist id="payment-methods">
                      {paymentMethods.map((method) => (
                        <option key={method} value={method} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="input-glass w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Note</label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Additional notes (optional)"
                    className="input-glass w-full h-24 resize-none"
                  />
                </div>

                {/* Recurring Expense Options */}
                <div className="space-y-4 p-4 rounded-lg bg-gradient-to-r from-primary/5 to-violet/5 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      checked={formData.isRecurring}
                      onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                      className="w-5 h-5 rounded border-2 border-primary/50 bg-transparent checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary/50 cursor-pointer"
                    />
                    <label htmlFor="isRecurring" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                      <span className="text-lg">🔄</span>
                      This is a recurring expense
                    </label>
                  </div>

                  {formData.isRecurring && (
                    <div className="space-y-4 animate-in slide-in-from-top duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Frequency</label>
                          <select
                            value={formData.frequency}
                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly' })}
                            className="input-glass w-full"
                          >
                            <option value="daily">📅 Daily</option>
                            <option value="weekly">📆 Weekly</option>
                            <option value="monthly">🗓️ Monthly</option>
                            <option value="yearly">📊 Yearly</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Repeat Every
                          </label>
                          <select
                            value={formData.recurringInterval}
                            onChange={(e) => setFormData({ ...formData, recurringInterval: parseInt(e.target.value) })}
                            className="input-glass w-full"
                          >
                            {formData.frequency === 'daily' && (
                              <>
                                <option value="1">1 Day</option>
                                <option value="2">2 Days</option>
                                <option value="3">3 Days</option>
                                <option value="7">7 Days</option>
                                <option value="15">15 Days</option>
                              </>
                            )}
                            {formData.frequency === 'weekly' && (
                              <>
                                <option value="1">1 Week</option>
                                <option value="2">2 Weeks</option>
                                <option value="3">3 Weeks</option>
                                <option value="4">4 Weeks</option>
                              </>
                            )}
                            {formData.frequency === 'monthly' && (
                              <>
                                <option value="1">1 Month</option>
                                <option value="2">2 Months</option>
                                <option value="3">3 Months</option>
                                <option value="6">6 Months</option>
                                <option value="12">12 Months</option>
                              </>
                            )}
                            {formData.frequency === 'yearly' && (
                              <>
                                <option value="1">1 Year</option>
                                <option value="2">2 Years</option>
                                <option value="3">3 Years</option>
                                <option value="5">5 Years</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          🔔 Reminder (Days Before Payment)
                        </label>
                        <select
                          value={formData.reminderDays}
                          onChange={(e) => setFormData({ ...formData, reminderDays: parseInt(e.target.value) })}
                          className="input-glass w-full"
                        >
                          <option value="0">On Payment Day</option>
                          <option value="1">1 Day Before</option>
                          <option value="3">3 Days Before</option>
                          <option value="7">1 Week Before</option>
                          <option value="14">2 Weeks Before</option>
                          <option value="30">1 Month Before</option>
                        </select>
                      </div>

                      <div className="p-3 rounded-lg bg-info/10 border border-info/30">
                        <p className="text-xs text-foreground/80 flex items-start gap-2">
                          <span className="text-base">💡</span>
                          <span>
                            Next payment will be calculated automatically. You'll receive a reminder{' '}
                            {formData.reminderDays === 0 ? 'on the payment day' : `${formData.reminderDays} day${formData.reminderDays > 1 ? 's' : ''} before`}.
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-6 py-2.5 glass rounded-lg font-medium hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                  >
                    {editingId ? 'Update Expense' : 'Add Expense'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-glass px-4 py-2 text-sm"
            placeholder="Start date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input-glass px-4 py-2 text-sm"
            placeholder="End date"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-glass px-4 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Category Breakdown */}
        {stats.length > 0 && (
          <div className="glass-card">
            <h2 className="text-xl font-bold mb-6">Category Breakdown</h2>
            <div className="space-y-4">
              {stats.map((stat) => {
                const percentage = (stat.total / totalExpenses) * 100;
                return (
                  <div key={stat._id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{stat._id}</span>
                      <span className="text-sm text-foreground/60">₹{stat.total.toLocaleString('en-IN')} ({stat.count} items)</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-600 to-violet-600"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex gap-2 items-center justify-between flex-wrap">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grouped')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                viewMode === 'grouped'
                  ? 'bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 text-white shadow-lg'
                  : 'glass hover:bg-white/10'
              }`}
            >
              <span className="text-lg">📊</span>
              Grouped by Category
            </button>
            <button
              onClick={() => setViewMode('individual')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                viewMode === 'individual'
                  ? 'bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 text-white shadow-lg'
                  : 'glass hover:bg-white/10'
              }`}
            >
              <span className="text-lg">📝</span>
              All Transactions
            </button>
          </div>

          {viewMode === 'grouped' && Object.keys(groupedExpenses).length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => setExpandedCategories(new Set(Object.keys(groupedExpenses)))}
                className="flex items-center gap-2 px-4 py-2 glass rounded-lg text-sm font-medium hover:bg-white/10 transition-all"
              >
                <span>📂</span>
                Expand All
              </button>
              <button
                onClick={() => setExpandedCategories(new Set())}
                className="flex items-center gap-2 px-4 py-2 glass rounded-lg text-sm font-medium hover:bg-white/10 transition-all"
              >
                <span>📁</span>
                Collapse All
              </button>
            </div>
          )}
        </div>

        {/* Expenses List */}
        <div className="space-y-4">
          {loading ? (
            // Skeleton Loaders
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="glass-card">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="skeleton-text w-1/4"></div>
                      <div className="skeleton-text w-1/2"></div>
                      <div className="skeleton-text w-1/3"></div>
                    </div>
                    <div className="skeleton w-24 h-8"></div>
                  </div>
                </div>
              ))}
            </>
          ) : expenses.length === 0 ? (
            <div className="glass-card text-center py-12">
              <div className="text-4xl mb-4">💳</div>
              <p className="text-foreground/60 mb-4">No expenses found. Add your first expense to get started!</p>
            </div>
          ) : viewMode === 'grouped' ? (
            // Grouped View
            Object.entries(groupedExpenses).map(([category, categoryExpenses]) => {
              const categoryTotal = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
              const isExpanded = expandedCategories.has(category);

              return (
                <div key={category} className="glass-card overflow-hidden">
                  {/* Category Header */}
                  <div
                    onClick={() => toggleCategory(category)}
                    className="flex items-center justify-between cursor-pointer hover:bg-gradient-to-r hover:from-primary/10 hover:to-violet/10 p-6 transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-violet/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <span className="text-2xl">{isExpanded ? '📂' : '📁'}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1">{category}</h3>
                        <p className="text-sm text-foreground/60">
                          📋 {categoryExpenses.length} transaction{categoryExpenses.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-3xl font-bold bg-gradient-to-r from-primary to-violet bg-clip-text text-transparent">
                          ₹{categoryTotal.toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-foreground/60 uppercase tracking-wide">Total</p>
                      </div>
                      <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <svg className="w-6 h-6 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Transactions */}
                  {isExpanded && (
                    <div className="space-y-3 border-t border-white/10 p-4 bg-gradient-to-b from-white/5 to-transparent animate-in slide-in-from-top duration-300">
                      {categoryExpenses.map((expense, index) => (
                        <div
                          key={expense._id}
                          className="flex items-center justify-between p-5 bg-gradient-to-r from-white/5 to-transparent hover:from-white/10 hover:to-white/5 rounded-lg transition-all duration-300 group/expense"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/20 text-primary shadow-sm">
                                {expense.source === 'telegram' ? '🤖 Telegram' : '🌐 Website'}
                              </span>
                              {expense.isRecurring && (
                                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-violet/20 text-violet-600 dark:text-violet-400 shadow-sm flex items-center gap-1.5">
                                  <span>🔄</span>
                                  Every {expense.recurringInterval || 1} {expense.frequency?.charAt(0).toUpperCase() + expense.frequency?.slice(1)}
                                  {(expense.recurringInterval || 1) > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-foreground/70 mb-2">{expense.note || 'No notes'}</p>
                            <div className="flex gap-4 text-xs text-foreground/60">
                              <span className="flex items-center gap-1.5">
                                <span className="text-base">📅</span>
                                {new Date(expense.date).toLocaleDateString('en-IN')}
                              </span>
                              {expense.paymentMethod && (
                                <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-info/20 text-info font-medium">
                                  💳 {expense.paymentMethod}
                                </span>
                              )}
                              {expense.isRecurring && expense.nextDate && (
                                <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-violet/20 text-violet-600 dark:text-violet-400 font-medium">
                                  ⏭️ Next: {new Date(expense.nextDate).toLocaleDateString('en-IN')}
                                </span>
                              )}
                              {expense.attachments && expense.attachments.length > 0 && (
                                <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/20 text-success font-medium">
                                  📎 {expense.attachments.length} file{expense.attachments.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>

                            {/* Show Attachments if any */}
                            {expense.attachments && expense.attachments.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-white/10">
                                <p className="text-xs font-semibold text-foreground/60 mb-2">📎 Attachments:</p>
                                <div className="flex flex-wrap gap-2">
                                  {expense.attachments.map((attachment, attIndex) => (
                                    <button
                                      key={attIndex}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        downloadAttachment(attachment);
                                      }}
                                      className="flex items-center gap-2 px-3 py-1.5 bg-success/10 hover:bg-success/20 rounded-lg text-xs font-medium text-success transition-all group/att"
                                      title={`Download ${attachment.fileName}`}
                                    >
                                      {attachment.fileType.startsWith('image/') ? (
                                        <ImageIcon size={14} />
                                      ) : (
                                        <FileText size={14} />
                                      )}
                                      <span className="max-w-[150px] truncate">{attachment.fileName}</span>
                                      <Download size={12} className="opacity-0 group-hover/att:opacity-100 transition-opacity" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-xl font-bold">₹{expense.amount.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="flex gap-2 transition-opacity duration-200">
                              {/* Upload/Change File Button */}
                              <label className="p-2.5 glass rounded-lg hover:bg-success/20 hover:text-success transition-all duration-200 hover:scale-110 cursor-pointer" title={expense.attachments && expense.attachments.length > 0 ? "Add more files" : "Upload file"}>
                                <Upload size={18} />
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleFileUpload(expense._id, e);
                                  }}
                                  className="hidden"
                                  disabled={uploadingFile}
                                />
                              </label>
                              
                              {/* Download All Button - Show always for debugging */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (expense.attachments && expense.attachments.length > 0) {
                                    expense.attachments.forEach(att => downloadAttachment(att));
                                  } else {
                                    toast({
                                      title: 'No attachments',
                                      description: 'This expense has no attachments yet',
                                      variant: 'destructive',
                                    });
                                  }
                                }}
                                className="p-2.5 glass rounded-lg hover:bg-primary/20 hover:text-primary transition-all duration-200 hover:scale-110"
                                title={expense.attachments && expense.attachments.length > 0 ? `Download ${expense.attachments.length} file(s)` : "No attachments"}
                              >
                                <Download size={18} />
                                {expense.attachments && expense.attachments.length > 0 && (
                                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-success text-white text-xs rounded-full flex items-center justify-center">
                                    {expense.attachments.length}
                                  </span>
                                )}
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditExpense(expense);
                                }}
                                className="p-2.5 glass rounded-lg hover:bg-info/20 hover:text-info transition-all duration-200 hover:scale-110"
                                title="Edit expense"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteConfirm(expense._id, expense.category);
                                }}
                                className="p-2.5 glass rounded-lg hover:bg-destructive/20 hover:text-destructive transition-all duration-200 hover:scale-110"
                                title="Delete expense"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            // Individual View
            expenses.map((expense) => (
              <div key={expense._id} className="glass-card">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">{expense.category}</h3>
                      <span className="text-xs font-medium px-2 py-1 rounded bg-primary/20 text-primary">
                        {expense.source === 'telegram' ? '🤖 Telegram' : '🌐 Website'}
                      </span>
                      {expense.isRecurring && (
                        <span className="text-xs font-medium px-2 py-1 rounded bg-violet/20 text-violet-600 dark:text-violet-400 flex items-center gap-1">
                          <span>🔄</span>
                          Every {expense.recurringInterval || 1} {expense.frequency?.charAt(0).toUpperCase() + expense.frequency?.slice(1)}
                          {(expense.recurringInterval || 1) > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground/70 mb-2">{expense.note || 'No notes'}</p>
                    <div className="flex gap-4 text-xs text-foreground/60 mb-2">
                      <span>{new Date(expense.date).toLocaleDateString('en-IN')}</span>
                      {expense.paymentMethod && <span>💳 {expense.paymentMethod}</span>}
                      {expense.isRecurring && expense.nextDate && (
                        <span className="px-2 py-1 rounded bg-violet/20 text-violet-600 dark:text-violet-400 font-medium">
                          ⏭️ Next: {new Date(expense.nextDate).toLocaleDateString('en-IN')}
                        </span>
                      )}
                      {expense.attachments && expense.attachments.length > 0 && (
                        <span className="px-2 py-1 rounded bg-success/20 text-success font-medium">
                          📎 {expense.attachments.length} file{expense.attachments.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Show Attachments if any */}
                    {expense.attachments && expense.attachments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-xs font-semibold text-foreground/60 mb-2">📎 Attachments:</p>
                        <div className="flex flex-wrap gap-2">
                          {expense.attachments.map((attachment, attIndex) => (
                            <button
                              key={attIndex}
                              onClick={() => downloadAttachment(attachment)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-success/10 hover:bg-success/20 rounded-lg text-xs font-medium text-success transition-all group/att"
                              title={`Download ${attachment.fileName}`}
                            >
                              {attachment.fileType.startsWith('image/') ? (
                                <ImageIcon size={14} />
                              ) : (
                                <FileText size={14} />
                              )}
                              <span className="max-w-[200px] truncate">{attachment.fileName}</span>
                              <Download size={12} className="opacity-0 group-hover/att:opacity-100 transition-opacity" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold">₹{expense.amount.toLocaleString('en-IN')}</p>
                    </div>
                    
                    {/* Upload/Add More Button */}
                    <label className="p-2 glass rounded-lg hover:bg-success/20 hover:text-success transition-all cursor-pointer" title={expense.attachments && expense.attachments.length > 0 ? "Add more files" : "Upload file"}>
                      <Upload size={20} />
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(expense._id, e)}
                        className="hidden"
                        disabled={uploadingFile}
                      />
                    </label>
                    
                    {/* Download All Button - Always visible for debugging */}
                    <button
                      onClick={() => {
                        if (expense.attachments && expense.attachments.length > 0) {
                          expense.attachments.forEach(att => downloadAttachment(att));
                        } else {
                          toast({
                            title: 'No attachments',
                            description: 'This expense has no attachments yet',
                            variant: 'destructive',
                          });
                        }
                      }}
                      className="p-2 glass rounded-lg hover:bg-primary/20 hover:text-primary transition-all relative"
                      title={expense.attachments && expense.attachments.length > 0 ? `Download ${expense.attachments.length} file(s)` : "No attachments"}
                    >
                      <Download size={20} />
                      {expense.attachments && expense.attachments.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-success text-white text-xs rounded-full flex items-center justify-center">
                          {expense.attachments.length}
                        </span>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleEditExpense(expense)}
                      className="p-2 glass rounded-lg hover:bg-white/20 dark:hover:bg-white/10 text-info"
                      title="Edit expense"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(expense._id, expense.category)}
                      className="p-2 glass rounded-lg hover:bg-white/20 dark:hover:bg-white/10 text-destructive"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Password Confirmation Modal */}
        <PasswordConfirmModal
          isOpen={deleteConfirm.isOpen}
          onConfirm={handleDeleteExpense}
          onCancel={() => setDeleteConfirm({ isOpen: false, expenseId: '', expenseName: '' })}
          isLoading={deletingId === deleteConfirm.expenseId}
          itemName={`expense "${deleteConfirm.expenseName}"`}
        />
      </div>
    </MainLayout>
  );
}
