import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { paymentAPI } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import PasswordConfirmModal from '@/components/PasswordConfirmModal';
import { Plus, Trash2, CheckCircle, AlertCircle, Clock, X, Upload, FileText, Image as ImageIcon, Download, Edit } from 'lucide-react';

interface Payment {
  _id: string;
  title: string;
  amount: number;
  category: string;
  paymentMethod: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  notes: string;
  source: 'website' | 'telegram';
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
  attachments?: Array<{
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    uploadedAt: string;
  }>;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  paid: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  overdue: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
};

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [categories, setCategories] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; paymentId: string; paymentName: string }>({
    isOpen: false,
    paymentId: '',
    paymentName: '',
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    paymentMethod: '',
    dueDate: '',
    notes: '',
  });
  const [emiModal, setEmiModal] = useState<{ isOpen: boolean; paymentId: string; paymentTitle: string }>({
    isOpen: false,
    paymentId: '',
    paymentTitle: '',
  });
  const [emiAmount, setEmiAmount] = useState('');
  const [emiDate, setEmiDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<{ url: string; type: string; name: string } | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    amount: '',
    category: '',
    paymentMethod: '',
    dueDate: '',
    notes: '',
  });

  useEffect(() => {
    fetchPayments();
  }, [filterStatus]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus) params.status = filterStatus;

      const response = await paymentAPI.getAll(params);
      const paymentsData = response.data?.payments || [];
      setPayments(paymentsData);

      // Extract unique categories and payment methods
      const uniqueCategories = Array.from(
        new Set(paymentsData.map((p: Payment) => p.category).filter(Boolean))
      ) as string[];
      const uniqueMethods = Array.from(
        new Set(paymentsData.map((p: Payment) => p.paymentMethod).filter(Boolean))
      ) as string[];

      setCategories(uniqueCategories);
      setPaymentMethods(uniqueMethods);
    } catch (error: any) {
      if (error?.response?.status === 503) {
        console.warn('Database not connected. Set MONGODB_URI environment variable to enable database features.');
      } else {
        console.error('Error fetching payments:', error);
      }
      setPayments([]);
      setCategories([]);
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.dueDate) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (title, amount, and due date)',
        variant: 'destructive',
      });
      return;
    }

    try {
      await paymentAPI.create({
        title: formData.title,
        amount: parseFloat(formData.amount),
        category: formData.category,
        paymentMethod: formData.paymentMethod,
        dueDate: formData.dueDate,
        notes: formData.notes,
      });
      toast({
        title: 'Success',
        description: 'Payment created successfully',
      });
      setFormData({ 
        title: '', 
        amount: '', 
        category: '', 
        paymentMethod: '', 
        dueDate: '', 
        notes: '', 
        isLoan: false, 
        totalLoanAmount: '',
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
      fetchPayments();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to create payment';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Error creating payment:', error);
    }
  };

  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      await paymentAPI.markAsPaid(paymentId);
      toast({
        title: 'Success',
        description: 'Payment marked as paid',
      });
      fetchPayments();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to mark payment as paid';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Error marking payment as paid:', error);
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
      await paymentAPI.addEmiPayment(emiModal.paymentId, {
        amount: parseFloat(emiAmount),
        date: emiDate,
      });

      toast({
        title: 'Success',
        description: 'EMI payment added successfully',
      });

      setEmiModal({ isOpen: false, paymentId: '', paymentTitle: '' });
      setEmiAmount('');
      setEmiDate(new Date().toISOString().split('T')[0]);
      fetchPayments();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to add EMI payment';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Error adding EMI payment:', error);
    }
  };

  const handleFileUpload = async (paymentId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Only images (JPEG, PNG, GIF) and PDF files are allowed',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File Too Large',
        description: 'File size must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadingFile(true);

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;

        await paymentAPI.uploadAttachment(paymentId, {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileData: base64Data,
        });

        toast({
          title: 'Success',
          description: 'File uploaded successfully',
        });

        fetchPayments();
      };

      reader.onerror = () => {
        toast({
          title: 'Error',
          description: 'Failed to read file',
          variant: 'destructive',
        });
      };

      reader.readAsDataURL(file);
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
      event.target.value = '';
    }
  };

  const handleDeleteAttachment = async (paymentId: string, attachmentIndex: number) => {
    try {
      await paymentAPI.deleteAttachment(paymentId, attachmentIndex);

      toast({
        title: 'Success',
        description: 'Attachment deleted successfully',
      });

      fetchPayments();
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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const openDeleteConfirm = (paymentId: string, paymentName: string) => {
    setDeleteConfirm({ isOpen: true, paymentId, paymentName });
  };

  const handleDeletePayment = async (password: string) => {
    if (!deleteConfirm.paymentId) return;

    try {
      setDeletingId(deleteConfirm.paymentId);
      await paymentAPI.delete(deleteConfirm.paymentId, { password });

      toast({
        title: 'Success',
        description: 'Payment deleted successfully',
      });
      setDeleteConfirm({ isOpen: false, paymentId: '', paymentName: '' });
      setDeletingId(null);
      fetchPayments();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to delete payment';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Error deleting payment:', error);
      setDeletingId(null);
    }
  };

  const openEditModal = (payment: Payment) => {
    setEditingPayment(payment);
    setEditFormData({
      title: payment.title,
      amount: payment.amount.toString(),
      category: payment.category || '',
      paymentMethod: payment.paymentMethod || '',
      dueDate: payment.dueDate.split('T')[0],
      notes: payment.notes || '',
    });
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    try {
      await paymentAPI.update(editingPayment._id, {
        title: editFormData.title,
        amount: parseFloat(editFormData.amount),
        category: editFormData.category,
        paymentMethod: editFormData.paymentMethod,
        dueDate: editFormData.dueDate,
        notes: editFormData.notes,
      });

      toast({
        title: 'Success',
        description: 'Payment updated successfully',
      });

      setEditingPayment(null);
      setEditFormData({
        title: '',
        amount: '',
        category: '',
        paymentMethod: '',
        dueDate: '',
        notes: '',
      });
      fetchPayments();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to update payment';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      console.error('Error updating payment:', error);
    }
  };

  const totalPending = payments
    .filter((p) => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="text-green-600 dark:text-green-400" size={20} />;
      case 'overdue':
        return <AlertCircle className="text-red-600 dark:text-red-400" size={20} />;
      default:
        return <Clock className="text-amber-600 dark:text-amber-400" size={20} />;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Payments</h1>
            <p className="text-foreground/60">Track and manage your due payments</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            Add Payment
          </button>
        </div>

        {/* Summary Cards */}
        <div className="glass-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground/60 text-sm font-medium mb-1">Total Pending</p>
              <p className="text-4xl font-bold">₹{totalPending.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-16 h-16 bg-warning/20 rounded-lg flex items-center justify-center">
              <Clock className="text-warning" size={32} />
            </div>
          </div>
        </div>

        {/* Create Payment Form */}
        {showForm && (
          <div className="glass-card">
            <h2 className="text-xl font-bold mb-4">Add New Payment</h2>
            <form onSubmit={handleCreatePayment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Payment Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Electricity Bill"
                    className="input-glass w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Amount (₹)</label>
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
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Utilities, Rent"
                    list="categories-list"
                    className="input-glass w-full"
                  />
                  <datalist id="categories-list">
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
                    placeholder="e.g., UPI, Card, Cash"
                    list="payment-methods-list"
                    className="input-glass w-full"
                  />
                  <datalist id="payment-methods-list">
                    {paymentMethods.map((method) => (
                      <option key={method} value={method} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
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
                  placeholder="Additional notes (optional)"
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
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-glass px-4 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {/* Payments List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-foreground/60">Loading payments...</p>
              </div>
            </div>
          ) : payments.length === 0 ? (
            <div className="glass-card text-center py-12">
              <div className="text-4xl mb-4">💳</div>
              <p className="text-foreground/60 mb-4">No payments found. Add your first payment to get started!</p>
            </div>
          ) : (
            payments.map((payment) => (
              <div 
                key={payment._id} 
                className="glass-card flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => setSelectedPaymentId(payment._id)}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="pt-2">
                    {getStatusIcon(payment.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold">{payment.title}</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[payment.status]}`}>
                        {payment.status}
                      </span>
                      <span className="text-xs font-medium px-2 py-1 rounded bg-primary/20 text-primary">
                        {payment.source === 'telegram' ? '🤖 Telegram' : '🌐 Website'}
                      </span>
                    </div>

                    <div className="flex gap-4 text-sm text-foreground/70 mb-2">
                      {payment.category && <span>📁 {payment.category}</span>}
                      {payment.paymentMethod && <span>💳 {payment.paymentMethod}</span>}
                      <span>📅 {new Date(payment.dueDate).toLocaleDateString('en-IN')}</span>
                    </div>

                    {payment.notes && (
                      <p className="text-sm text-foreground/60">{payment.notes}</p>
                    )}

                    {payment.isLoan && payment.loanDetails && (
                      <div className="mt-3 p-3 bg-white/5 rounded border border-white/10 text-sm">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <span className="text-foreground/60">🏦 Bank:</span> {payment.loanDetails.bankName}
                          </div>
                          <div>
                            <span className="text-foreground/60">📋 Type:</span> {payment.loanDetails.loanType}
                          </div>
                          <div>
                            <span className="text-foreground/60">💰 Principal:</span> ₹{payment.loanDetails.principalAmount.toLocaleString('en-IN')}
                          </div>
                          <div>
                            <span className="text-foreground/60">📊 Rate:</span> {payment.loanDetails.interestRate}% p.a.
                          </div>
                          <div>
                            <span className="text-foreground/60">⏱️ Tenure:</span> {payment.loanDetails.tenure} {payment.loanDetails.tenureUnit}
                          </div>
                          <div>
                            <span className="text-foreground/60">📅 EMI/Month:</span> ₹{payment.loanDetails.emiAmount.toLocaleString('en-IN')}
                          </div>
                          <div>
                            <span className="text-foreground/60">📈 Total Interest:</span> ₹{payment.loanDetails.totalInterest.toLocaleString('en-IN')}
                          </div>
                          <div>
                            <span className="text-foreground/60">💵 Total Amount:</span> ₹{payment.loanDetails.totalAmount.toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div className="text-xs text-foreground/50">
                          📍 {new Date(payment.loanDetails.startDate).toLocaleDateString('en-IN')} to {new Date(payment.loanDetails.endDate).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold">₹{payment.amount.toLocaleString('en-IN')}</p>
                    {payment.isLoan && payment.remainingAmount !== undefined && (
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        Remaining: ₹{payment.remainingAmount.toLocaleString('en-IN')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {payment.isLoan && payment.status !== 'paid' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEmiModal({ isOpen: true, paymentId: payment._id, paymentTitle: payment.title });
                        }}
                        className="p-2 glass rounded-lg hover:bg-white/20 dark:hover:bg-white/10 text-info"
                        title="Add EMI payment"
                      >
                        💰
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(payment);
                      }}
                      className="p-2 glass rounded-lg hover:bg-white/20 dark:hover:bg-white/10 text-primary"
                      title="Edit payment"
                    >
                      <Edit size={20} />
                    </button>
                    {payment.status !== 'paid' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsPaid(payment._id);
                        }}
                        className="p-2 glass rounded-lg hover:bg-white/20 dark:hover:bg-white/10 text-success"
                        title="Mark as paid"
                      >
                        <CheckCircle size={20} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteConfirm(payment._id, payment.title);
                      }}
                      className="p-2 glass rounded-lg hover:bg-white/20 dark:hover:bg-white/10 text-destructive"
                      title="Delete payment"
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
          onConfirm={handleDeletePayment}
          onCancel={() => setDeleteConfirm({ isOpen: false, paymentId: '', paymentName: '' })}
          isLoading={deletingId === deleteConfirm.paymentId}
          itemName={`payment "${deleteConfirm.paymentName}"`}
        />

        {/* EMI Payment Modal */}
        {emiModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-card max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Add EMI Payment</h2>
                <button
                  onClick={() => setEmiModal({ isOpen: false, paymentId: '', paymentTitle: '' })}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-foreground/70 mb-4">Payment: <span className="font-semibold">{emiModal.paymentTitle}</span></p>

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
                    onClick={() => setEmiModal({ isOpen: false, paymentId: '', paymentTitle: '' })}
                    className="px-4 py-2 glass rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddEmiPayment}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-700"
                  >
                    Add Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Payment Modal */}
        {editingPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="glass-card max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Edit Payment</h2>
                <button
                  onClick={() => setEditingPayment(null)}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdatePayment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Payment Title</label>
                    <input
                      type="text"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      placeholder="e.g., Electricity Bill"
                      className="input-glass w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Amount (₹)</label>
                    <input
                      type="number"
                      value={editFormData.amount}
                      onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="input-glass w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Category</label>
                    <input
                      type="text"
                      value={editFormData.category}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                      placeholder="e.g., Utilities, Rent"
                      list="edit-categories-list"
                      className="input-glass w-full"
                    />
                    <datalist id="edit-categories-list">
                      {categories.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Payment Method</label>
                    <input
                      type="text"
                      value={editFormData.paymentMethod}
                      onChange={(e) => setEditFormData({ ...editFormData, paymentMethod: e.target.value })}
                      placeholder="e.g., UPI, Card, Cash"
                      list="edit-payment-methods-list"
                      className="input-glass w-full"
                    />
                    <datalist id="edit-payment-methods-list">
                      {paymentMethods.map((method) => (
                        <option key={method} value={method} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Due Date</label>
                    <input
                      type="date"
                      value={editFormData.dueDate}
                      onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                      className="input-glass w-full"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                    placeholder="Additional notes (optional)"
                    className="input-glass w-full h-20 resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingPayment(null)}
                    className="px-4 py-2 glass rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-700"
                  >
                    Update Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment Detail Page */}
        {selectedPaymentId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="glass-card max-w-2xl w-full p-8 my-8">
              {(() => {
                const payment = payments.find(p => p._id === selectedPaymentId);
                if (!payment) return null;

                return (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div>
                        <h1 className="text-3xl font-bold">{payment.title}</h1>
                        <p className="text-foreground/60 mt-1">
                          {payment.isLoan ? '🏦 Loan Payment' : '💳 Regular Payment'}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedPaymentId(null)}
                        className="p-2 hover:bg-white/10 rounded-lg"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    {/* Basic Info */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-foreground/60 text-sm mb-1">Amount</p>
                        <p className="text-2xl font-bold">₹{payment.amount.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-foreground/60 text-sm mb-1">Status</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[payment.status]}`}>
                          {payment.status}
                        </span>
                      </div>
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-foreground/60 text-sm mb-1">Due Date</p>
                        <p className="font-semibold">{new Date(payment.dueDate).toLocaleDateString('en-IN')}</p>
                      </div>
                      {payment.category && (
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-foreground/60 text-sm mb-1">Category</p>
                          <p className="font-semibold">📁 {payment.category}</p>
                        </div>
                      )}
                      {payment.paymentMethod && (
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-foreground/60 text-sm mb-1">Payment Method</p>
                          <p className="font-semibold">💳 {payment.paymentMethod}</p>
                        </div>
                      )}
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-foreground/60 text-sm mb-1">Source</p>
                        <p className="font-semibold">{payment.source === 'telegram' ? '🤖 Telegram' : '🌐 Website'}</p>
                      </div>
                    </div>

                    {/* Notes */}
                    {payment.notes && (
                      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-foreground/60 text-sm mb-2">Notes</p>
                        <p className="text-foreground">{payment.notes}</p>
                      </div>
                    )}

                    {/* Loan Details */}
                    {payment.isLoan && payment.loanDetails && (
                      <div className="space-y-4">
                        <h2 className="text-xl font-bold">Loan Details</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                            <p className="text-foreground/60 text-sm mb-1">🏦 Bank</p>
                            <p className="font-semibold">{payment.loanDetails.bankName}</p>
                          </div>
                          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                            <p className="text-foreground/60 text-sm mb-1">📋 Loan Type</p>
                            <p className="font-semibold">{payment.loanDetails.loanType}</p>
                          </div>
                          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                            <p className="text-foreground/60 text-sm mb-1">💰 Principal</p>
                            <p className="font-semibold">₹{payment.loanDetails.principalAmount.toLocaleString('en-IN')}</p>
                          </div>
                          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                            <p className="text-foreground/60 text-sm mb-1">📊 Interest Rate</p>
                            <p className="font-semibold">{payment.loanDetails.interestRate}% p.a.</p>
                          </div>
                          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                            <p className="text-foreground/60 text-sm mb-1">⏱️ Tenure</p>
                            <p className="font-semibold">{payment.loanDetails.tenure} {payment.loanDetails.tenureUnit}</p>
                          </div>
                          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                            <p className="text-foreground/60 text-sm mb-1">📅 Monthly EMI</p>
                            <p className="font-semibold">₹{payment.loanDetails.emiAmount.toLocaleString('en-IN')}</p>
                          </div>
                          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                            <p className="text-foreground/60 text-sm mb-1">📈 Total Interest</p>
                            <p className="font-semibold">₹{payment.loanDetails.totalInterest.toLocaleString('en-IN')}</p>
                          </div>
                          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                            <p className="text-foreground/60 text-sm mb-1">💵 Total Amount</p>
                            <p className="font-semibold">₹{payment.loanDetails.totalAmount.toLocaleString('en-IN')}</p>
                          </div>
                          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                            <p className="text-foreground/60 text-sm mb-1">📍 Duration</p>
                            <p className="text-sm font-semibold">
                              {new Date(payment.loanDetails.startDate).toLocaleDateString('en-IN')} to {new Date(payment.loanDetails.endDate).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* EMI Payments History */}
                    {payment.isLoan && payment.emiPayments && payment.emiPayments.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-bold">EMI Payment History</h2>
                          <div className="text-right">
                            <p className="text-foreground/60 text-sm">Paid Amount</p>
                            <p className="text-2xl font-bold">₹{(payment.paidAmount || 0).toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {payment.emiPayments.map((emi, idx) => (
                            <div key={idx} className="p-3 bg-white/5 rounded border border-white/10 flex items-center justify-between">
                              <div>
                                <p className="font-semibold">EMI #{idx + 1}</p>
                                <p className="text-sm text-foreground/60">
                                  📅 {new Date(emi.date).toLocaleDateString('en-IN')} {new Date(emi.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <p className="text-lg font-bold">₹{emi.amount.toLocaleString('en-IN')}</p>
                            </div>
                          ))}
                        </div>
                        {payment.remainingAmount !== undefined && (
                          <div className="p-4 bg-amber-500/20 rounded-lg border border-amber-500/50">
                            <p className="text-foreground/60 text-sm mb-1">Remaining Amount</p>
                            <p className="text-2xl font-bold text-amber-400">₹{payment.remainingAmount.toLocaleString('en-IN')}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Attachments Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">📎 Attachments</h2>
                        <label className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 text-white rounded-lg font-medium hover:shadow-lg transition-all cursor-pointer">
                          <Upload size={18} />
                          {uploadingFile ? 'Uploading...' : 'Upload File'}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif,application/pdf"
                            onChange={(e) => handleFileUpload(payment._id, e)}
                            disabled={uploadingFile}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {payment.attachments && payment.attachments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {payment.attachments.map((attachment, idx) => {
                            const isImage = attachment.fileType.startsWith('image/');
                            const isPDF = attachment.fileType === 'application/pdf';

                            return (
                              <div
                                key={idx}
                                className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                                    {isImage ? (
                                      <ImageIcon className="text-primary" size={24} />
                                    ) : (
                                      <FileText className="text-primary" size={24} />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate" title={attachment.fileName}>
                                      {attachment.fileName}
                                    </p>
                                    <p className="text-sm text-foreground/60">
                                      {formatFileSize(attachment.fileSize)}
                                    </p>
                                    <p className="text-xs text-foreground/50">
                                      {new Date(attachment.uploadedAt).toLocaleDateString('en-IN')} {new Date(attachment.uploadedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setViewingAttachment({ url: attachment.fileUrl, type: attachment.fileType, name: attachment.fileName })}
                                      className="p-2 hover:bg-white/10 rounded-lg text-primary"
                                      title="View"
                                    >
                                      <Download size={18} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAttachment(payment._id, idx)}
                                      className="p-2 hover:bg-white/10 rounded-lg text-destructive"
                                      title="Delete"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 bg-white/5 rounded-lg border border-white/10 text-center">
                          <div className="text-4xl mb-2">📎</div>
                          <p className="text-foreground/60">No attachments yet</p>
                          <p className="text-sm text-foreground/50 mt-1">Upload receipts, bills, or documents</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 justify-end border-t border-white/10 pt-4">
                      {payment.isLoan && payment.status !== 'paid' && (
                        <button
                          onClick={() => {
                            setSelectedPaymentId(null);
                            setEmiModal({ isOpen: true, paymentId: payment._id, paymentTitle: payment.title });
                          }}
                          className="px-4 py-2 bg-info text-white rounded-lg font-medium hover:bg-info/80"
                        >
                          💰 Add EMI Payment
                        </button>
                      )}
                      {payment.status !== 'paid' && (
                        <button
                          onClick={() => {
                            setSelectedPaymentId(null);
                            handleMarkAsPaid(payment._id);
                          }}
                          className="px-4 py-2 bg-success text-white rounded-lg font-medium hover:bg-success/80"
                        >
                          ✓ Mark as Paid
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedPaymentId(null)}
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

        {/* Attachment Viewer Modal */}
        {viewingAttachment && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4">
            <div className="max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">{viewingAttachment.name}</h2>
                <div className="flex gap-2">
                  <a
                    href={viewingAttachment.url}
                    download={viewingAttachment.name}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                    title="Download"
                  >
                    <Download size={20} />
                  </a>
                  <button
                    onClick={() => setViewingAttachment(null)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-white/5 rounded-lg flex items-center justify-center">
                {viewingAttachment.type.startsWith('image/') ? (
                  <img
                    src={viewingAttachment.url}
                    alt={viewingAttachment.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : viewingAttachment.type === 'application/pdf' ? (
                  <iframe
                    src={viewingAttachment.url}
                    className="w-full h-full min-h-[600px]"
                    title={viewingAttachment.name}
                  />
                ) : (
                  <div className="text-center text-white">
                    <FileText size={64} className="mx-auto mb-4 opacity-50" />
                    <p>Preview not available</p>
                    <a
                      href={viewingAttachment.url}
                      download={viewingAttachment.name}
                      className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700"
                    >
                      <Download size={18} />
                      Download File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
