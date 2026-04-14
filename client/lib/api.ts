import axios from 'axios';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for handling token expiry
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, {
          withCredentials: true,
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data: any) => apiClient.post('/auth/register', data),
  login: (data: any) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  getCurrentUser: () => apiClient.get('/auth/me'),
  refreshToken: () => apiClient.post('/auth/refresh-token'),
};

type LocalTask = {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'done';
  category: string;
  source: 'website' | 'telegram';
  subtasks?: Array<{
    _id?: string;
    title: string;
    completed: boolean;
    createdAt?: string;
    completedAt?: string;
  }>;
};

const TASK_STORAGE_KEY = 'fintask-local-tasks';

const readLocalTasks = (): LocalTask[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = window.localStorage.getItem(TASK_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as LocalTask[]) : [];
  } catch {
    return [];
  }
};

const writeLocalTasks = (tasks: LocalTask[]) => {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
};

const createLocalTask = (data: any): LocalTask => ({
  _id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  title: data.title,
  description: data.description || '',
  dueDate: data.dueDate,
  priority: data.priority || 'medium',
  status: 'pending',
  category: data.category || 'General',
  source: 'website',
});

const filterLocalTasks = (tasks: LocalTask[], params?: any) => {
  if (!params) return tasks;

  return tasks.filter((task) => {
    if (params.status && task.status !== params.status) return false;
    if (params.priority && task.priority !== params.priority) return false;
    if (params.category && task.category !== params.category) return false;
    return true;
  });
};

const isServiceUnavailable = (error: any) => error?.response?.status === 503;

const localTaskResponse = (tasks: LocalTask[]) => ({
  data: {
    tasks,
    pagination: {
      total: tasks.length,
      page: 1,
      limit: tasks.length,
      pages: 1,
    },
  },
});

// Task APIs
export const taskAPI = {
  create: async (data: any) => {
    try {
      return await apiClient.post('/tasks', data);
    } catch (error) {
      if (!isServiceUnavailable(error)) {
        throw error;
      }

      const tasks = readLocalTasks();
      const task = createLocalTask(data);
      writeLocalTasks([task, ...tasks]);
      return { data: { message: 'Task created', task } };
    }
  },
  getAll: async (params?: any) => {
    try {
      return await apiClient.get('/tasks', { params });
    } catch (error) {
      if (!isServiceUnavailable(error)) {
        throw error;
      }

      return localTaskResponse(filterLocalTasks(readLocalTasks(), params));
    }
  },
  update: async (id: string, data: any) => {
    try {
      return await apiClient.put(`/tasks/${id}`, data);
    } catch (error) {
      if (!isServiceUnavailable(error)) {
        throw error;
      }

      const tasks = readLocalTasks();
      const taskIndex = tasks.findIndex((task) => task._id === id);

      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      const task = { ...tasks[taskIndex], ...data };
      tasks[taskIndex] = task;
      writeLocalTasks(tasks);
      return { data: { message: 'Task updated', task } };
    }
  },
  delete: async (id: string, data?: any) => {
    try {
      return await apiClient.delete(`/tasks/${id}`, { data });
    } catch (error) {
      if (!isServiceUnavailable(error)) {
        throw error;
      }

      const tasks = readLocalTasks();
      const nextTasks = tasks.filter((task) => task._id !== id);
      writeLocalTasks(nextTasks);
      return { data: { message: 'Task deleted' } };
    }
  },
  addSubtask: async (id: string, data: any) => {
    try {
      return await apiClient.post(`/tasks/${id}/subtasks`, data);
    } catch (error) {
      if (!isServiceUnavailable(error)) {
        throw error;
      }

      const tasks = readLocalTasks();
      const taskIndex = tasks.findIndex((task) => task._id === id);

      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      const task = tasks[taskIndex];
      if (!task.subtasks) {
        task.subtasks = [];
      }

      task.subtasks.push({
        _id: `local-${Date.now()}`,
        title: data.title,
        completed: false,
        createdAt: new Date().toISOString(),
      });

      tasks[taskIndex] = task;
      writeLocalTasks(tasks);
      return { data: { message: 'Subtask added', task } };
    }
  },
  updateSubtask: async (id: string, subtaskId: string, data: any) => {
    try {
      return await apiClient.put(`/tasks/${id}/subtasks/${subtaskId}`, data);
    } catch (error) {
      if (!isServiceUnavailable(error)) {
        throw error;
      }

      const tasks = readLocalTasks();
      const taskIndex = tasks.findIndex((task) => task._id === id);

      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      const task = tasks[taskIndex];
      const subtask = task.subtasks?.find((st) => st._id === subtaskId);

      if (!subtask) {
        throw new Error('Subtask not found');
      }

      if (data.title) subtask.title = data.title;
      if (data.completed !== undefined) {
        subtask.completed = data.completed;
        if (data.completed) {
          subtask.completedAt = new Date().toISOString();
        } else {
          subtask.completedAt = undefined;
        }
      }

      tasks[taskIndex] = task;
      writeLocalTasks(tasks);
      return { data: { message: 'Subtask updated', task } };
    }
  },
  deleteSubtask: async (id: string, subtaskId: string) => {
    try {
      return await apiClient.delete(`/tasks/${id}/subtasks/${subtaskId}`);
    } catch (error) {
      if (!isServiceUnavailable(error)) {
        throw error;
      }

      const tasks = readLocalTasks();
      const taskIndex = tasks.findIndex((task) => task._id === id);

      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      const task = tasks[taskIndex];
      if (task.subtasks) {
        task.subtasks = task.subtasks.filter((st) => st._id !== subtaskId);
      }

      tasks[taskIndex] = task;
      writeLocalTasks(tasks);
      return { data: { message: 'Subtask deleted', task } };
    }
  },
};

type LocalExpense = {
  _id: string;
  amount: number;
  category: string;
  note: string;
  date: string;
  paymentMethod: string;
  source: 'website' | 'telegram';
};

const EXPENSE_STORAGE_KEY = 'fintask-local-expenses';

const readLocalExpenses = (): LocalExpense[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = window.localStorage.getItem(EXPENSE_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as LocalExpense[]) : [];
  } catch {
    return [];
  }
};

const writeLocalExpenses = (expenses: LocalExpense[]) => {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(expenses));
};

const createLocalExpense = (data: any): LocalExpense => ({
  _id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  amount: Number(data.amount) || 0,
  category: data.category,
  note: data.note || '',
  date: data.date || new Date().toISOString().split('T')[0],
  paymentMethod: data.paymentMethod || '',
  source: 'website',
});

const filterLocalExpenses = (expenses: LocalExpense[], params?: any) => {
  if (!params) return expenses;

  return expenses.filter((expense) => {
    if (params.category && expense.category !== params.category) return false;
    if (params.startDate && new Date(expense.date) < new Date(params.startDate)) return false;
    if (params.endDate && new Date(expense.date) > new Date(params.endDate)) return false;
    return true;
  });
};

const buildLocalExpenseStats = (expenses: LocalExpense[]) => {
  const statsMap = new Map<string, { _id: string; total: number; count: number }>();

  for (const expense of expenses) {
    const current = statsMap.get(expense.category) ?? { _id: expense.category, total: 0, count: 0 };
    current.total += expense.amount;
    current.count += 1;
    statsMap.set(expense.category, current);
  }

  const stats = Array.from(statsMap.values()).sort((a, b) => b.total - a.total);
  const total = stats.reduce((sum, stat) => sum + stat.total, 0);

  return { stats, total };
};

// Expense APIs
export const expenseAPI = {
  create: async (data: any) => {
    try {
      return await apiClient.post('/expenses', data);
    } catch (error) {
      if (!isServiceUnavailable(error)) {
        throw error;
      }

      const expenses = readLocalExpenses();
      const expense = createLocalExpense(data);
      writeLocalExpenses([expense, ...expenses]);
      return { data: { message: 'Expense created', expense } };
    }
  },
  getAll: async (params?: any) => {
    try {
      return await apiClient.get('/expenses', { params });
    } catch (error) {
      if (!isServiceUnavailable(error)) {
        throw error;
      }

      return {
        data: {
          expenses: filterLocalExpenses(readLocalExpenses(), params),
          pagination: {
            total: filterLocalExpenses(readLocalExpenses(), params).length,
            page: 1,
            limit: filterLocalExpenses(readLocalExpenses(), params).length,
            pages: 1,
          },
        },
      };
    }
  },
  getStats: async (params?: any) => {
    try {
      return await apiClient.get('/expenses/stats', { params });
    } catch (error) {
      if (!isServiceUnavailable(error)) {
        throw error;
      }

      const expenses = filterLocalExpenses(readLocalExpenses(), params);
      return { data: buildLocalExpenseStats(expenses) };
    }
  },
  update: async (id: string, data: any) => {
    try {
      return await apiClient.put(`/expenses/${id}`, data);
    } catch (error) {
      if (!isServiceUnavailable(error)) {
        throw error;
      }

      const expenses = readLocalExpenses();
      const expenseIndex = expenses.findIndex((expense) => expense._id === id);

      if (expenseIndex === -1) {
        throw new Error('Expense not found');
      }

      const expense = { ...expenses[expenseIndex], ...data, amount: Number(data.amount ?? expenses[expenseIndex].amount) };
      expenses[expenseIndex] = expense;
      writeLocalExpenses(expenses);
      return { data: { message: 'Expense updated', expense } };
    }
  },
  delete: async (id: string, data?: any) => {
    try {
      return await apiClient.delete(`/expenses/${id}`, { data });
    } catch (error) {
      if (!isServiceUnavailable(error)) {
        throw error;
      }

      const expenses = readLocalExpenses();
      writeLocalExpenses(expenses.filter((expense) => expense._id !== id));
      return { data: { message: 'Expense deleted' } };
    }
  },
};

// Policy APIs
export const policyAPI = {
  create: (data: any) => apiClient.post('/policies', data),
  getAll: (params?: any) => apiClient.get('/policies', { params }),
  getById: (id: string) => apiClient.get(`/policies/${id}`),
  update: (id: string, data: any) => apiClient.put(`/policies/${id}`, data),
  delete: (id: string, data?: any) => apiClient.delete(`/policies/${id}`, { data }),
  logPayment: (id: string, data: any) => apiClient.post(`/policies/${id}/payment`, data),
  getDashboardStats: () => apiClient.get('/policies/dashboard'),
  getUpcoming: () => apiClient.get('/policies/upcoming'),
};

type LocalPayment = {
  _id: string;
  title: string;
  amount: number;
  category: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  notes: string;
  paidDate?: string;
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
};

const PAYMENT_STORAGE_KEY = 'fintask-local-payments';

const readLocalPayments = (): LocalPayment[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = window.localStorage.getItem(PAYMENT_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as LocalPayment[]) : [];
  } catch {
    return [];
  }
};

const writeLocalPayments = (payments: LocalPayment[]) => {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(payments));
};

const createLocalPayment = (data: any): LocalPayment => {
  let loanDetails = undefined;
  
  if (data.isLoan && data.loanDetails) {
    const { principalAmount, interestRate, tenure, tenureUnit } = data.loanDetails;
    const monthlyRate = interestRate / 12 / 100;
    const totalMonths = tenureUnit === 'years' ? tenure * 12 : tenure;
    const emiAmount = principalAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    const totalAmount = emiAmount * totalMonths;
    const totalInterest = totalAmount - principalAmount;
    
    const startDate = new Date(data.loanDetails.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + totalMonths);

    loanDetails = {
      bankName: data.loanDetails.bankName,
      loanType: data.loanDetails.loanType,
      principalAmount,
      interestRate,
      tenure,
      tenureUnit,
      emiAmount: Math.round(emiAmount * 100) / 100,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }

  return {
    _id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    title: data.title,
    amount: Number(data.amount) || 0,
    category: data.category || 'General',
    dueDate: data.dueDate,
    status: 'pending',
    notes: data.notes || '',
    source: 'website',
    isLoan: data.isLoan || false,
    totalLoanAmount: data.isLoan ? principalAmount : undefined,
    paidAmount: 0,
    remainingAmount: data.isLoan ? principalAmount : undefined,
    emiPayments: [],
    loanDetails,
  };
};

const filterLocalPayments = (payments: LocalPayment[], params?: any) => {
  if (!params) return payments;

  return payments.filter((payment) => {
    if (params.status && payment.status !== params.status) return false;
    return true;
  });
};

const localPaymentResponse = (payments: LocalPayment[]) => ({
  data: {
    payments,
    pagination: {
      total: payments.length,
      page: 1,
      limit: payments.length,
      pages: 1,
    },
  },
});

// Payment APIs
export const paymentAPI = {
  create: async (data: any) => {
    try {
      return await apiClient.post('/payments', data);
    } catch (error) {
      if (!isServiceUnavailable(error)) {
        throw error;
      }

      const payments = readLocalPayments();
      const payment = createLocalPayment(data);
      writeLocalPayments([payment, ...payments]);
      return { data: { message: 'Payment created', payment } };
    }
  },
  getAll: async (params?: any) => {
    try {
      return await apiClient.get('/payments', { params });
    } catch (error) {
      if (!isServiceUnavailable(error)) {
        throw error;
      }

      return localPaymentResponse(filterLocalPayments(readLocalPayments(), params));
    }
  },
  getOverdue: async () => {
    try {
      return await apiClient.get('/payments/overdue');
    } catch (error) {
      if (!isServiceUnavailable(error)) {
        throw error;
      }

      const payments = readLocalPayments();
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const overduePayments = payments.filter(
        (p) => p.status === 'pending' && new Date(p.dueDate) <= twoDaysAgo
      );

      return { data: { overduePayments, count: overduePayments.length } };
    }
  },
  update: async (id: string, data: any) => {
    try {
      return await apiClient.put(`/payments/${id}`, data);
    } catch (error) {
      if (!isServiceUnavailable(error)) {
        throw error;
      }

      const payments = readLocalPayments();
      const paymentIndex = payments.findIndex((payment) => payment._id === id);

      if (paymentIndex === -1) {
        throw new Error('Payment not found');
      }

      const payment = {
        ...payments[paymentIndex],
        ...data,
        amount: Number(data.amount ?? payments[paymentIndex].amount),
      };
      payments[paymentIndex] = payment;
      writeLocalPayments(payments);
      return { data: { message: 'Payment updated', payment } };
    }
  },
  markAsPaid: async (id: string) => {
    try {
      return await apiClient.put(`/payments/${id}/mark-paid`);
    } catch (error) {
      if (!isServiceUnavailable(error)) {
        throw error;
      }

      const payments = readLocalPayments();
      const paymentIndex = payments.findIndex((payment) => payment._id === id);

      if (paymentIndex === -1) {
        throw new Error('Payment not found');
      }

      const payment = {
        ...payments[paymentIndex],
        status: 'paid' as const,
        paidDate: new Date().toISOString(),
      };
      payments[paymentIndex] = payment;
      writeLocalPayments(payments);
      return { data: { message: 'Payment marked as paid', payment } };
    }
  },
  delete: async (id: string, data?: any) => {
    try {
      return await apiClient.delete(`/payments/${id}`, { data });
    } catch (error) {
      if (!isServiceUnavailable(error)) {
        throw error;
      }

      const payments = readLocalPayments();
      writeLocalPayments(payments.filter((payment) => payment._id !== id));
      return { data: { message: 'Payment deleted' } };
    }
  },
  addEmiPayment: async (id: string, data: any) => {
    try {
      return await apiClient.post(`/payments/${id}/emi-payment`, data);
    } catch (error) {
      if (!isServiceUnavailable(error)) {
        throw error;
      }

      const payments = readLocalPayments();
      const paymentIndex = payments.findIndex((payment) => payment._id === id);

      if (paymentIndex === -1) {
        throw new Error('Payment not found');
      }

      // Local EMI payment handling
      const payment = payments[paymentIndex];
      if (!payment.emiPayments) {
        payment.emiPayments = [];
      }
      payment.emiPayments.push({
        date: new Date(data.date || new Date()).toISOString(),
        amount: data.amount,
      });

      payment.paidAmount = (payment.paidAmount || 0) + data.amount;
      payment.remainingAmount = (payment.totalLoanAmount || 0) - payment.paidAmount;

      if (payment.remainingAmount <= 0) {
        payment.status = 'paid';
        payment.paidDate = new Date().toISOString();
        payment.remainingAmount = 0;
      }

      payments[paymentIndex] = payment;
      writeLocalPayments(payments);
      return { data: { message: 'EMI payment added', payment } };
    }
  },
  updateEmiPayment: async (id: string, emiIndex: number, data: any) => {
    try {
      return await apiClient.put(`/payments/${id}/emi-payment/${emiIndex}`, data);
    } catch (error) {
      if (!isServiceUnavailable(error)) {
        throw error;
      }

      const payments = readLocalPayments();
      const paymentIndex = payments.findIndex((payment) => payment._id === id);

      if (paymentIndex === -1) {
        throw new Error('Payment not found');
      }

      const payment = payments[paymentIndex];
      if (!payment.emiPayments || !payment.emiPayments[emiIndex]) {
        throw new Error('EMI payment not found');
      }

      payment.emiPayments[emiIndex] = {
        date: new Date(data.date).toISOString(),
        amount: data.amount,
      };

      const totalPaid = payment.emiPayments.reduce((sum: number, emi: any) => sum + emi.amount, 0);
      payment.paidAmount = totalPaid;
      payment.remainingAmount = (payment.totalLoanAmount || 0) - totalPaid;

      if (payment.remainingAmount <= 0) {
        payment.status = 'paid';
        payment.paidDate = new Date().toISOString();
        payment.remainingAmount = 0;
      } else if (payment.status === 'paid') {
        payment.status = 'pending';
        payment.paidDate = undefined;
      }

      payments[paymentIndex] = payment;
      writeLocalPayments(payments);
      return { data: { message: 'EMI payment updated', payment } };
    }
  },
  deleteEmiPayment: async (id: string, emiIndex: number) => {
    try {
      return await apiClient.delete(`/payments/${id}/emi-payment/${emiIndex}`);
    } catch (error) {
      if (!isServiceUnavailable(error)) {
        throw error;
      }

      const payments = readLocalPayments();
      const paymentIndex = payments.findIndex((payment) => payment._id === id);

      if (paymentIndex === -1) {
        throw new Error('Payment not found');
      }

      const payment = payments[paymentIndex];
      if (!payment.emiPayments || !payment.emiPayments[emiIndex]) {
        throw new Error('EMI payment not found');
      }

      payment.emiPayments.splice(emiIndex, 1);

      const totalPaid = payment.emiPayments.reduce((sum: number, emi: any) => sum + emi.amount, 0);
      payment.paidAmount = totalPaid;
      payment.remainingAmount = (payment.totalLoanAmount || 0) - totalPaid;

      if (payment.status === 'paid' && payment.remainingAmount > 0) {
        payment.status = 'pending';
        payment.paidDate = undefined;
      }

      payments[paymentIndex] = payment;
      writeLocalPayments(payments);
      return { data: { message: 'EMI payment deleted', payment } };
    }
  },
  uploadAttachment: async (id: string, data: { fileName: string; fileType: string; fileSize: number; fileData: string }) => {
    try {
      return await apiClient.post(`/payments/${id}/attachment`, data);
    } catch (error) {
      if (!isServiceUnavailable(error)) {
        throw error;
      }

      const payments = readLocalPayments();
      const paymentIndex = payments.findIndex((payment) => payment._id === id);

      if (paymentIndex === -1) {
        throw new Error('Payment not found');
      }

      const payment = payments[paymentIndex];
      if (!payment.attachments) {
        payment.attachments = [];
      }

      payment.attachments.push({
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
        fileUrl: data.fileData,
        uploadedAt: new Date().toISOString(),
      });

      payments[paymentIndex] = payment;
      writeLocalPayments(payments);
      return { data: { message: 'Attachment uploaded', payment } };
    }
  },
  deleteAttachment: async (id: string, attachmentIndex: number) => {
    try {
      return await apiClient.delete(`/payments/${id}/attachment/${attachmentIndex}`);
    } catch (error) {
      if (!isServiceUnavailable(error)) {
        throw error;
      }

      const payments = readLocalPayments();
      const paymentIndex = payments.findIndex((payment) => payment._id === id);

      if (paymentIndex === -1) {
        throw new Error('Payment not found');
      }

      const payment = payments[paymentIndex];
      if (!payment.attachments || !payment.attachments[attachmentIndex]) {
        throw new Error('Attachment not found');
      }

      payment.attachments.splice(attachmentIndex, 1);

      payments[paymentIndex] = payment;
      writeLocalPayments(payments);
      return { data: { message: 'Attachment deleted', payment } };
    }
  },
};

// Admin APIs
export const adminAPI = {
  getStats: () => apiClient.get('/admin/stats'),
  getUsers: (params?: any) => apiClient.get('/admin/users', { params }),
  getUserById: (id: string) => apiClient.get(`/admin/users/${id}`),
  getLogs: (params?: any) => apiClient.get('/admin/logs', { params }),
  getUserLogs: (id: string, params?: any) => apiClient.get(`/admin/users/${id}/logs`, { params }),
  deleteUser: (id: string) => apiClient.delete(`/admin/users/${id}`),
  impersonateUser: (id: string) => apiClient.post(`/admin/users/${id}/impersonate`),
};

// Goal APIs
export const goalAPI = {
  create: (data: any) => apiClient.post('/goals', data),
  getAll: (params?: any) => apiClient.get('/goals', { params }),
  update: (id: string, data: any) => apiClient.put(`/goals/${id}`, data),
  addSaving: (id: string, data: any) => apiClient.post(`/goals/${id}/saving`, data),
  delete: (id: string, data?: any) => apiClient.delete(`/goals/${id}`, { data }),
};

// Income APIs
export const incomeAPI = {
  create: (data: any) => apiClient.post('/income', data),
  getAll: (params?: any) => apiClient.get('/income', { params }),
  getStats: () => apiClient.get('/income/stats'),
  update: (id: string, data: any) => apiClient.put(`/income/${id}`, data),
  delete: (id: string, data?: any) => apiClient.delete(`/income/${id}`, { data }),
  uploadAttachment: (id: string, data: any) => apiClient.post(`/income/${id}/attachments`, data),
  deleteAttachment: (id: string, attachmentId: string) => apiClient.delete(`/income/${id}/attachments/${attachmentId}`),
};

export default apiClient;
