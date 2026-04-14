import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { incomeAPI } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import PasswordConfirmModal from '@/components/PasswordConfirmModal';
import { Plus, Trash2, Edit2, Upload, Download, X, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Income {
  _id: string;
  title: string;
  amount: number;
  category: string;
  source: string;
  type: 'one-time' | 'recurring';
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: string;
  nextDate?: string;
  description?: string;
  tags?: string[];
  attachments?: Array<{
    _id?: string;
    filename: string;
    data: string;
    mimeType: string;
    uploadedAt: string;
  }>;
}

const categories = ['Salary', 'Freelance', 'Business', 'Investment', 'Rental', 'Gift', 'Bonus', 'Other'];

export default function Income() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; incomeId: string; incomeName: string }>({
    isOpen: false,
    incomeId: '',
    incomeName: '',
  });
  const [activeTab, setActiveTab] = useState<'all' | 'one-time' | 'recurring'>('all');
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Salary',
    source: '',
    type: 'one-time' as 'one-time' | 'recurring',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    date: new Date().toISOString().split('T')[0],
    description: '',
    tags: [] as string[],
  });

  useEffect(() => {
    fetchIncomes();
    fetchStats();
  }, []);

  useEffect(() => {
    // Get available years from incomes
    const years = new Set<number>();
    const currentYear = new Date().getFullYear();
    
    // Add current year and nearby years
    for (let i = currentYear - 5; i <= currentYear + 2; i++) {
      years.add(i);
    }
    
    // Add years from existing incomes
    incomes.forEach(income => {
      years.add(new Date(income.date).getFullYear());
    });
    
    setAvailableYears(Array.from(years).sort((a, b) => b - a));
  }, [incomes]);

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const response = await incomeAPI.getAll();
      setIncomes(response.data?.incomes || []);
    } catch (error: any) {
      if (error?.response?.status === 503) {
        console.warn('Database not connected');
      } else {
        console.error('Error fetching incomes:', error);
      }
      setIncomes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await incomeAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.amount || !formData.source) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      if (editingId) {
        await incomeAPI.update(editingId, data);
        toast({
          title: 'Success',
          description: 'Income updated successfully',
        });
      } else {
        await incomeAPI.create(data);
        toast({
          title: 'Success',
          description: 'Income added successfully',
        });
      }

      setFormData({
        title: '',
        amount: '',
        category: 'Salary',
        source: '',
        type: 'one-time',
        frequency: 'monthly',
        date: new Date().toISOString().split('T')[0],
        description: '',
        tags: [],
      });
      setEditingId(null);
      setShowForm(false);
      fetchIncomes();
      fetchStats();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to save income',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (income: Income) => {
    setEditingId(income._id);
    setFormData({
      title: income.title,
      amount: income.amount.toString(),
      category: income.category,
      source: income.source,
      type: income.type,
      frequency: income.frequency || 'monthly',
      date: income.date.split('T')[0],
      description: income.description || '',
      tags: income.tags || [],
    });
    setShowForm(true);
    setSelectedIncome(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (password: string) => {
    try {
      await incomeAPI.delete(deleteConfirm.incomeId, { password });
      toast({
        title: 'Success',
        description: 'Income deleted successfully',
      });
      setDeleteConfirm({ isOpen: false, incomeId: '', incomeName: '' });
      fetchIncomes();
      fetchStats();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to delete income',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedIncome || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (file.size > maxSize) {
      toast({
        title: 'Error',
        description: 'File size must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingFile(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        await incomeAPI.uploadAttachment(selectedIncome._id, {
          filename: file.name,
          data: base64,
          mimeType: file.type,
        });
        
        toast({
          title: 'Success',
          description: 'File uploaded successfully',
        });
        
        fetchIncomes();
        const updated = incomes.find(i => i._id === selectedIncome._id);
        if (updated) setSelectedIncome(updated);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!selectedIncome) return;

    try {
      await incomeAPI.deleteAttachment(selectedIncome._id, attachmentId);
      toast({
        title: 'Success',
        description: 'Attachment deleted successfully',
      });
      fetchIncomes();
      const updated = incomes.find(i => i._id === selectedIncome._id);
      if (updated) setSelectedIncome(updated);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete attachment',
        variant: 'destructive',
      });
    }
  };

  const filteredIncomes = incomes.filter(income => {
    const incomeDate = new Date(income.date);
    const incomeYear = incomeDate.getFullYear();
    const incomeMonth = incomeDate.getMonth() + 1;
    
    // Filter by type
    if (activeTab !== 'all' && income.type !== activeTab) {
      return false;
    }
    
    // Filter by year
    if (incomeYear !== selectedYear) {
      return false;
    }
    
    // Filter by month if selected
    if (selectedMonth) {
      const [filterYear, filterMonth] = selectedMonth.split('-').map(Number);
      if (incomeYear !== filterYear || incomeMonth !== filterMonth) {
        return false;
      }
    }
    
    return true;
  });

  const totalIncome = filteredIncomes.reduce((sum, income) => sum + income.amount, 0);
  
  // Calculate totals for current year
  const yearIncomes = incomes.filter(i => new Date(i.date).getFullYear() === selectedYear);
  const recurringIncome = yearIncomes.filter(i => i.type === 'recurring').reduce((sum, i) => sum + i.amount, 0);
  const oneTimeIncome = yearIncomes.filter(i => i.type === 'one-time').reduce((sum, i) => sum + i.amount, 0);
  
  // Group incomes by month for the selected year
  const monthlyIncomes = yearIncomes.reduce((acc, income) => {
    const month = new Date(income.date).getMonth();
    if (!acc[month]) {
      acc[month] = { total: 0, count: 0 };
    }
    acc[month].total += income.amount;
    acc[month].count += 1;
    return acc;
  }, {} as Record<number, { total: number; count: number }>);
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Income</h1>
            <p className="text-muted-foreground">Track all your income sources</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            Add Income
          </button>
        </div>

        {/* Year & Month Filters */}
        <div className="flex gap-4 flex-wrap items-center">
          <div>
            <label className="block text-sm font-medium mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(parseInt(e.target.value));
                setSelectedMonth(''); // Reset month when year changes
              }}
              className="input-glass px-4 py-2 text-sm min-w-[120px]"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-glass px-4 py-2 text-sm min-w-[150px]"
            >
              <option value="">All Months</option>
              {monthNames.map((month, index) => {
                const monthValue = `${selectedYear}-${(index + 1).toString().padStart(2, '0')}`;
                const monthData = monthlyIncomes[index];
                const hasData = monthData && monthData.count > 0;
                return (
                  <option key={monthValue} value={monthValue}>
                    {month} {hasData ? `(₹${monthData.total.toLocaleString('en-IN')})` : '(No data)'}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedMonth && (
            <button
              onClick={() => setSelectedMonth('')}
              className="mt-6 px-4 py-2 glass rounded-lg text-sm font-medium hover:bg-white/10 transition-all"
            >
              Clear Filter
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card hover-lift hover-glow group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success to-emerald-500 flex items-center justify-center shadow-lg shadow-success/30 group-hover:shadow-xl group-hover:shadow-success/40 transition-all">
                  <DollarSign className="text-white" size={22} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                {selectedMonth ? 'Month' : 'Year'} Total
              </p>
              <h3 className="text-2xl font-bold">₹{totalIncome.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedMonth ? monthNames[parseInt(selectedMonth.split('-')[1]) - 1] : selectedYear}
              </p>
            </div>
          </div>

          <div className="stat-card hover-lift hover-glow group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-xl group-hover:shadow-primary/40 transition-all">
                  <TrendingUp className="text-white" size={22} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Recurring ({selectedYear})</p>
              <h3 className="text-2xl font-bold">₹{recurringIncome.toLocaleString('en-IN')}</h3>
            </div>
          </div>

          <div className="stat-card hover-lift hover-glow group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-info to-cyan-500 flex items-center justify-center shadow-lg shadow-info/30 group-hover:shadow-xl group-hover:shadow-info/40 transition-all">
                  <Calendar className="text-white" size={22} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">One-time ({selectedYear})</p>
              <h3 className="text-2xl font-bold">₹{oneTimeIncome.toLocaleString('en-IN')}</h3>
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="glass-card">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Income' : 'Add New Income'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Monthly Salary"
                    className="input-glass w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Amount *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="input-glass w-full"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-glass w-full"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Source *</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="e.g., Company Name"
                    className="input-glass w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'one-time' | 'recurring' })}
                    className="input-glass w-full"
                  >
                    <option value="one-time">One-time</option>
                    <option value="recurring">Recurring</option>
                  </select>
                </div>

                {formData.type === 'recurring' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Frequency *</label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                      className="input-glass w-full"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input-glass w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional notes..."
                  className="input-glass w-full h-24 resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({
                      title: '',
                      amount: '',
                      category: 'Salary',
                      source: '',
                      type: 'one-time',
                      frequency: 'monthly',
                      date: new Date().toISOString().split('T')[0],
                      description: '',
                      tags: [],
                    });
                  }}
                  className="px-4 py-2 glass rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-700"
                >
                  {editingId ? 'Update' : 'Add'} Income
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="all">
                All ({filteredIncomes.length})
              </TabsTrigger>
              <TabsTrigger value="one-time">
                One-time ({incomes.filter(i => {
                  const year = new Date(i.date).getFullYear();
                  return i.type === 'one-time' && year === selectedYear;
                }).length})
              </TabsTrigger>
              <TabsTrigger value="recurring">
                Recurring ({incomes.filter(i => {
                  const year = new Date(i.date).getFullYear();
                  return i.type === 'recurring' && year === selectedYear;
                }).length})
              </TabsTrigger>
            </TabsList>
            
            {selectedMonth && (
              <div className="text-sm font-medium px-4 py-2 glass rounded-lg">
                Showing: {monthNames[parseInt(selectedMonth.split('-')[1]) - 1]} {selectedYear}
              </div>
            )}
          </div>

          <TabsContent value={activeTab} className="space-y-4">
            {loading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-card">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="skeleton-text w-1/3"></div>
                        <div className="skeleton-text w-2/3"></div>
                      </div>
                      <div className="skeleton w-20 h-10 rounded-lg"></div>
                    </div>
                  </div>
                ))}
              </>
            ) : filteredIncomes.length === 0 ? (
              <div className="glass-card text-center py-12">
                <div className="text-4xl mb-4">💰</div>
                <p className="text-foreground/60 mb-4">No income records found</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-medium"
                >
                  Add Your First Income
                </button>
              </div>
            ) : (
              filteredIncomes.map((income) => (
                <div
                  key={income._id}
                  className="glass-card hover:bg-white/5 transition-all cursor-pointer"
                  onClick={() => setSelectedIncome(income)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold">{income.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          income.type === 'recurring'
                            ? 'bg-primary/10 text-primary border border-primary/20'
                            : 'bg-info/10 text-info border border-info/20'
                        }`}>
                          {income.type === 'recurring' ? `Recurring (${income.frequency})` : 'One-time'}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                          {income.category}
                        </span>
                      </div>

                      {income.description && (
                        <p className="text-foreground/70 mb-2 text-sm">{income.description}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-foreground/60">
                        <span>💼 {income.source}</span>
                        <span>📅 {new Date(income.date).toLocaleDateString('en-IN')}</span>
                        {income.nextDate && (
                          <span className="text-primary">Next: {new Date(income.nextDate).toLocaleDateString('en-IN')}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-success">₹{income.amount.toLocaleString('en-IN')}</p>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(income);
                          }}
                          className="p-2 glass rounded-lg hover:bg-info/20 hover:text-info transition-all"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm({ isOpen: true, incomeId: income._id, incomeName: income.title });
                          }}
                          className="p-2 glass rounded-lg hover:bg-destructive/20 hover:text-destructive transition-all"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Income Detail Modal */}
        {selectedIncome && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{selectedIncome.title}</h2>
                <button
                  onClick={() => setSelectedIncome(null)}
                  className="p-2 hover:bg-white/10 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">Amount</p>
                    <p className="text-2xl font-bold text-success">₹{selectedIncome.amount.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">Category</p>
                    <p className="text-lg font-semibold">{selectedIncome.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">Source</p>
                    <p className="text-lg font-semibold">{selectedIncome.source}</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">Type</p>
                    <p className="text-lg font-semibold capitalize">{selectedIncome.type}</p>
                  </div>
                  {selectedIncome.frequency && (
                    <div>
                      <p className="text-sm text-foreground/60 mb-1">Frequency</p>
                      <p className="text-lg font-semibold capitalize">{selectedIncome.frequency}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-foreground/60 mb-1">Date</p>
                    <p className="text-lg font-semibold">{new Date(selectedIncome.date).toLocaleDateString('en-IN')}</p>
                  </div>
                  {selectedIncome.nextDate && (
                    <div>
                      <p className="text-sm text-foreground/60 mb-1">Next Date</p>
                      <p className="text-lg font-semibold text-primary">{new Date(selectedIncome.nextDate).toLocaleDateString('en-IN')}</p>
                    </div>
                  )}
                </div>

                {selectedIncome.description && (
                  <div>
                    <p className="text-sm text-foreground/60 mb-2">Description</p>
                    <p className="text-foreground/80">{selectedIncome.description}</p>
                  </div>
                )}

                {/* Attachments */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">📎 Attachments</h3>
                    <label className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 text-white rounded-lg font-medium hover:shadow-lg transition-all cursor-pointer">
                      <Upload size={18} />
                      {uploadingFile ? 'Uploading...' : 'Upload'}
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*,.pdf"
                        disabled={uploadingFile}
                      />
                    </label>
                  </div>

                  {selectedIncome.attachments && selectedIncome.attachments.length > 0 ? (
                    <div className="space-y-2">
                      {selectedIncome.attachments.map((att) => (
                        <div key={att._id} className="flex items-center justify-between p-3 glass rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {att.mimeType.startsWith('image/') ? '🖼️' : '📄'}
                            </span>
                            <div>
                              <p className="font-medium">{att.filename}</p>
                              <p className="text-xs text-foreground/60">
                                {new Date(att.uploadedAt).toLocaleDateString('en-IN')}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={att.data}
                              download={att.filename}
                              className="p-2 glass rounded-lg hover:bg-primary/20 hover:text-primary transition-all"
                              title="Download"
                            >
                              <Download size={18} />
                            </a>
                            <button
                              onClick={() => handleDeleteAttachment(att._id!)}
                              className="p-2 glass rounded-lg hover:bg-destructive/20 hover:text-destructive transition-all"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-foreground/60 text-center py-4">No attachments</p>
                  )}
                </div>

                <div className="flex justify-end border-t border-white/10 pt-4">
                  <button
                    onClick={() => setSelectedIncome(null)}
                    className="px-4 py-2 glass rounded-lg font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <PasswordConfirmModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, incomeId: '', incomeName: '' })}
          onConfirm={handleDelete}
          title="Delete Income"
          message={`Are you sure you want to delete "${deleteConfirm.incomeName}"? This action cannot be undone.`}
        />
      </div>
    </MainLayout>
  );
}
