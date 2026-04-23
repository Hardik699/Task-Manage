import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { TrendingUp, AlertCircle, Clock, CheckCircle, Bell } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { taskAPI, expenseAPI, paymentAPI, policyAPI } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DashboardStats {
  totalExpenses: number;
  pendingPayments: number;
  upcomingRenewals: number;
  pendingTasks: number;
  overdueTasks: number;
}

interface ExpenseStats {
  _id: string;
  total: number;
  count: number;
}

interface Activity {
  id: string;
  type: 'expense' | 'payment' | 'task' | 'policy';
  title: string;
  amount?: number;
  date: string;
  icon: string;
}

interface OverduePayment {
  _id: string;
  title: string;
  amount: number;
  dueDate: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalExpenses: 0,
    pendingPayments: 0,
    upcomingRenewals: 0,
    pendingTasks: 0,
    overdueTasks: 0,
  });
  const [expenseStats, setExpenseStats] = useState<ExpenseStats[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = useState<any[]>([]);
  const [monthlyIncomeVsExpense, setMonthlyIncomeVsExpense] = useState<any[]>([]);
  const [monthlySavings, setMonthlySavings] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [userName, setUserName] = useState('User');
  const [overduePayments, setOverduePayments] = useState<OverduePayment[]>([]);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    // Get user name from localStorage
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUserName(userData?.name || 'User');
    } catch {
      setUserName('User');
    }
    
    fetchDashboardData();
  }, [selectedYear]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const results = await Promise.allSettled([
        taskAPI.getAll(),
        expenseAPI.getAll({ limit: 1000 }), // Fetch up to 1000 expenses
        paymentAPI.getAll(),
        policyAPI.getAll(),
        paymentAPI.getOverdue(),
        fetch('/api/income', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }).then(res => res.json()),
      ]);

      const tasksRes = results[0].status === 'fulfilled' ? results[0].value : { data: { tasks: [] } };
      const expensesRes = results[1].status === 'fulfilled' ? results[1].value : { data: { expenses: [] } };
      const paymentsRes = results[2].status === 'fulfilled' ? results[2].value : { data: { payments: [] } };
      const policiesRes = results[3].status === 'fulfilled' ? results[3].value : { data: { policies: [] } };
      const overdueRes = results[4].status === 'fulfilled' ? results[4].value : { data: { overduePayments: [] } };
      const incomesRes = results[5].status === 'fulfilled' ? results[5].value : { incomes: [] };

      const tasks = tasksRes.data?.tasks || [];
      const expenses = expensesRes.data?.expenses || [];
      const payments = paymentsRes.data?.payments || [];
      const policies = policiesRes.data?.policies || [];
      const overdue = overdueRes.data?.overduePayments || [];
      const incomes = incomesRes.incomes || [];

      // Set overdue payments and show dialog if any
      if (overdue.length > 0) {
        setOverduePayments(overdue);
        // Only show once per session
        const overdueShown = sessionStorage.getItem('overdueShown');
        if (!overdueShown) {
          setShowNotificationDialog(true);
          sessionStorage.setItem('overdueShown', 'true');
        }
      }

      // Calculate stats
      const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
      const pendingPayments = payments
        .filter((p: any) => p.status === 'pending' || p.status === 'overdue')
        .reduce((sum: number, p: any) => sum + p.amount, 0);

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const upcomingRenewals = policies.filter((p: any) => {
        const renewalDate = new Date(p.renewalDate);
        return renewalDate >= now && renewalDate <= thirtyDaysFromNow;
      }).length;

      const pendingTasks = tasks.filter((t: any) => t.status !== 'done').length;
      const overdueTasks = tasks.filter((t: any) => {
        return t.status !== 'done' && new Date(t.dueDate) < new Date();
      }).length;

      setStats({
        totalExpenses,
        pendingPayments,
        upcomingRenewals,
        pendingTasks,
        overdueTasks,
      });

      // Get expense stats for pie chart
      const statsRes = await expenseAPI.getStats({ limit: 1000 });
      const categorizedStats = Array.isArray(statsRes.data?.stats) ? statsRes.data.stats : [];
      setExpenseStats(categorizedStats.slice(0, 6)); // Top 6 categories

      // Build monthly expenses data - all 12 months of selected year
      const monthlyMap = new Map<number, number>();
      
      // Initialize all 12 months with 0
      for (let i = 1; i <= 12; i++) {
        monthlyMap.set(i, 0);
      }
      
      // Get all available years from expenses
      const yearsSet = new Set<number>();
      expenses.forEach((exp: any) => {
        yearsSet.add(new Date(exp.date).getFullYear());
      });
      
      // Add current year and a few years before/after
      const currentYear = new Date().getFullYear();
      for (let i = currentYear - 5; i <= currentYear + 2; i++) {
        yearsSet.add(i);
      }
      
      const years = Array.from(yearsSet).sort((a, b) => b - a);
      setAvailableYears(years);
      
      // Add expenses for selected year only
      expenses.forEach((exp: any) => {
        const date = new Date(exp.date);
        if (date.getFullYear() === selectedYear) {
          const month = date.getMonth() + 1;
          monthlyMap.set(month, (monthlyMap.get(month) || 0) + exp.amount);
        }
      });

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const sortedMonthly = Array.from(monthlyMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([monthNum, amount]) => ({
          month: monthNames[monthNum - 1],
          amount: Math.round(amount),
        }));
      setMonthlyExpenses(sortedMonthly);

      // Build Income vs Expense data for 12 months
      const incomeMap = new Map<number, number>();
      const expenseMap = new Map<number, number>();
      
      // Initialize all 12 months with 0
      for (let i = 1; i <= 12; i++) {
        incomeMap.set(i, 0);
        expenseMap.set(i, 0);
      }
      
      // Add incomes for selected year
      incomes.forEach((inc: any) => {
        const date = new Date(inc.date);
        if (date.getFullYear() === selectedYear) {
          const month = date.getMonth() + 1;
          incomeMap.set(month, (incomeMap.get(month) || 0) + inc.amount);
        }
      });
      
      // Add expenses for selected year
      expenses.forEach((exp: any) => {
        const date = new Date(exp.date);
        if (date.getFullYear() === selectedYear) {
          const month = date.getMonth() + 1;
          expenseMap.set(month, (expenseMap.get(month) || 0) + exp.amount);
        }
      });
      
      const incomeVsExpenseData = monthNames.map((monthName, index) => {
        const monthNum = index + 1;
        return {
          month: monthName,
          income: Math.round(incomeMap.get(monthNum) || 0),
          expense: Math.round(expenseMap.get(monthNum) || 0),
        };
      });
      setMonthlyIncomeVsExpense(incomeVsExpenseData);
      
      // Build Savings data (Income - Expense)
      const savingsData = monthNames.map((monthName, index) => {
        const monthNum = index + 1;
        const income = incomeMap.get(monthNum) || 0;
        const expense = expenseMap.get(monthNum) || 0;
        const savings = income - expense;
        return {
          month: monthName,
          savings: Math.round(savings),
          income: Math.round(income),
          expense: Math.round(expense),
        };
      });
      setMonthlySavings(savingsData);

      // Build recent activity
      const activity: Activity[] = [];

      // Add recent expenses
      expenses.slice(0, 3).forEach((exp: any) => {
        activity.push({
          id: exp._id,
          type: 'expense',
          title: `Expense: ${exp.category}`,
          amount: exp.amount,
          date: new Date(exp.date).toLocaleDateString('en-IN'),
          icon: '💳',
        });
      });

      // Add recent payments
      payments.slice(0, 2).forEach((pay: any) => {
        activity.push({
          id: pay._id,
          type: 'payment',
          title: `Payment: ${pay.title}`,
          amount: pay.amount,
          date: new Date(pay.dueDate).toLocaleDateString('en-IN'),
          icon: '📄',
        });
      });

      // Add recent tasks
      tasks.slice(0, 2).forEach((task: any) => {
        activity.push({
          id: task._id,
          type: 'task',
          title: `Task: ${task.title}`,
          date: new Date(task.dueDate).toLocaleDateString('en-IN'),
          icon: '📝',
        });
      });

      setRecentActivity(activity.slice(0, 5));
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error.message);
      // App will continue with empty data - local storage fallback will work
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="skeleton-title mb-2"></div>
              <div className="skeleton-text w-1/3"></div>
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-card"></div>
            ))}
          </div>

          {/* Chart Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 skeleton" style={{ height: '400px' }}></div>
            <div className="skeleton" style={{ height: '400px' }}></div>
          </div>

          {/* Insights Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card"></div>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Welcome back, {userName}! 👋</h1>
            <p className="text-muted-foreground">Here's what's happening with your finances today</p>
          </div>
          <button
            onClick={() => setShowNotificationDialog(true)}
            className="btn-icon relative"
            title="Notifications"
          >
            <Bell size={20} className={overduePayments.length > 0 ? 'text-warning' : ''} />
            {overduePayments.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs rounded-full flex items-center justify-center font-semibold">
                {overduePayments.length}
              </span>
            )}
          </button>
        </div>

        {/* Summary Cards - Premium Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Expenses */}
          <div className="stat-card hover-lift hover-glow group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-xl group-hover:shadow-primary/40 transition-all">
                  <TrendingUp className="text-white" size={22} />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-success/10 text-success border border-success/20">
                  +12.5%
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Total Expenses</p>
              <h3 className="text-2xl font-bold">₹{stats.totalExpenses.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-muted-foreground mt-2">vs last month</p>
            </div>
          </div>

          {/* Pending Payments */}
          <div className="stat-card hover-lift hover-glow group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning to-orange-500 flex items-center justify-center shadow-lg shadow-warning/30 group-hover:shadow-xl group-hover:shadow-warning/40 transition-all">
                  <Clock className="text-white" size={22} />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-warning/10 text-warning border border-warning/20">
                  Due
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Pending Payments</p>
              <h3 className="text-2xl font-bold">{stats.pendingPayments}</h3>
              <p className="text-xs text-muted-foreground mt-2">Action required</p>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="stat-card hover-lift hover-glow group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-info to-cyan-500 flex items-center justify-center shadow-lg shadow-info/30 group-hover:shadow-xl group-hover:shadow-info/40 transition-all">
                  <CheckCircle className="text-white" size={22} />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                  {stats.overdueTasks}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Pending Tasks</p>
              <h3 className="text-2xl font-bold">{stats.pendingTasks}</h3>
              <p className="text-xs text-muted-foreground mt-2">{stats.overdueTasks} overdue</p>
            </div>
          </div>

          {/* Upcoming Renewals */}
          <div className="stat-card hover-lift hover-glow group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success to-emerald-500 flex items-center justify-center shadow-lg shadow-success/30 group-hover:shadow-xl group-hover:shadow-success/40 transition-all">
                  <AlertCircle className="text-white" size={22} />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-success/10 text-success border border-success/20">
                  Active
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">Upcoming Renewals</p>
              <h3 className="text-2xl font-bold">{stats.upcomingRenewals}</h3>
              <p className="text-xs text-muted-foreground mt-2">Next 30 days</p>
            </div>
          </div>
        </div>

        {/* Charts Section - Premium Design */}
        <div className="grid grid-cols-1 gap-4">
          {/* Income vs Expense Chart - 12 Months */}
          <div className="modern-card">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-1">💰 Income vs Expense - {selectedYear}</h2>
                <p className="text-sm text-muted-foreground">Compare your monthly income and expenses</p>
              </div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="input text-sm w-auto"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            {monthlyIncomeVsExpense.length > 0 ? (
              <ResponsiveContainer width="100%" height={340}>
                <LineChart
                  data={monthlyIncomeVsExpense}
                  margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#EF4444" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                    style={{ fontSize: '13px', fontWeight: '500' }}
                    axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                  />
                  <YAxis
                    stroke={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                    style={{ fontSize: '13px' }}
                    axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                      border: `2px solid ${isDark ? 'rgba(139, 92, 246, 0.5)' : 'rgba(139, 92, 246, 0.3)'}`,
                      borderRadius: '0.75rem',
                      boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                      padding: '12px 16px',
                    }}
                    itemStyle={{ color: isDark ? '#fff' : '#000' }}
                    labelStyle={{ color: isDark ? '#fff' : '#000', fontWeight: 'bold', marginBottom: '8px' }}
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, '']}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: '#10B981', r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Income"
                    animationDuration={800}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="#EF4444"
                    strokeWidth={3}
                    dot={{ fill: '#EF4444', r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Expense"
                    animationDuration={800}
                    animationBegin={200}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-foreground/40 bg-white/5 rounded-lg">
                <div className="text-center">
                  <p className="text-5xl mb-3">📊</p>
                  <p>No income/expense data available</p>
                </div>
              </div>
            )}
          </div>

          {/* Total Savings Chart - 12 Months */}
          <div className="modern-card">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-1">💎 Total Savings - {selectedYear}</h2>
              <p className="text-sm text-muted-foreground">Monthly savings (Income - Expense)</p>
            </div>
            {monthlySavings.length > 0 ? (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart
                  data={monthlySavings}
                  margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="savingsPositive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.7}/>
                    </linearGradient>
                    <linearGradient id="savingsNegative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#DC2626" stopOpacity={0.7}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                    style={{ fontSize: '13px', fontWeight: '500' }}
                    axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                  />
                  <YAxis
                    stroke={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                    style={{ fontSize: '13px' }}
                    axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                      border: `2px solid ${isDark ? 'rgba(139, 92, 246, 0.5)' : 'rgba(139, 92, 246, 0.3)'}`,
                      borderRadius: '0.75rem',
                      boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                      padding: '12px 16px',
                    }}
                    itemStyle={{ color: isDark ? '#fff' : '#000' }}
                    labelStyle={{ color: isDark ? '#fff' : '#000', fontWeight: 'bold', marginBottom: '8px' }}
                    cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                    formatter={(value, name) => {
                      if (name === 'savings') {
                        return [`₹${value.toLocaleString('en-IN')}`, 'Savings'];
                      }
                      return [`₹${value.toLocaleString('en-IN')}`, name];
                    }}
                  />
                  <Bar
                    dataKey="savings"
                    radius={[8, 8, 0, 0]}
                    animationDuration={600}
                    animationBegin={100}
                  >
                    {monthlySavings.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.savings >= 0 ? 'url(#savingsPositive)' : 'url(#savingsNegative)'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-80 flex items-center justify-center text-foreground/40 bg-white/5 rounded-lg">
                <div className="text-center">
                  <p className="text-5xl mb-3">💎</p>
                  <p>No savings data available</p>
                </div>
              </div>
            )}
          </div>

          {/* Monthly Expenses Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="modern-card">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-1">Monthly Expenses</h2>
                <p className="text-sm text-muted-foreground">Track your spending patterns</p>
              </div>
              {monthlyExpenses.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={monthlyExpenses}
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.7}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      stroke={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                      style={{ fontSize: '13px', fontWeight: '500' }}
                      axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                    />
                    <YAxis
                      stroke={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                      style={{ fontSize: '13px' }}
                      axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                        border: `2px solid ${isDark ? 'rgba(139, 92, 246, 0.5)' : 'rgba(139, 92, 246, 0.3)'}`,
                        borderRadius: '0.75rem',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                        padding: '12px 16px',
                      }}
                      itemStyle={{ color: isDark ? '#fff' : '#000' }}
                      labelStyle={{ color: isDark ? '#fff' : '#000', fontWeight: 'bold', marginBottom: '8px' }}
                      cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                      formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                    />
                    <Bar
                      dataKey="amount"
                      fill="url(#barGradient)"
                      radius={[8, 8, 0, 0]}
                      animationDuration={600}
                      animationBegin={100}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-80 flex items-center justify-center text-foreground/40 bg-white/5 rounded-lg">
                  <div className="text-center">
                    <p className="text-5xl mb-3">📊</p>
                    <p>No expense data available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Category Breakdown Pie Chart */}
            <div className="glass-card p-6 hover:border-primary/30 transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet/5 via-transparent to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <div className="mb-6">
                <h2 className="text-xl font-bold bg-gradient-to-r from-violet-500 to-primary-500 bg-clip-text text-transparent">Category Breakdown</h2>
                <p className="text-sm text-foreground/50 mt-1">🥧 Top spending categories</p>
              </div>
              {expenseStats.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={expenseStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="total"
                        animationDuration={800}
                        animationBegin={200}
                      >
                        {expenseStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                          border: `2px solid ${isDark ? 'rgba(139, 92, 246, 0.5)' : 'rgba(139, 92, 246, 0.3)'}`,
                          borderRadius: '0.75rem',
                          boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                          padding: '12px 16px',
                        }}
                        itemStyle={{ color: isDark ? '#fff' : '#000' }}
                        labelStyle={{ color: isDark ? '#fff' : '#000', fontWeight: 'bold', marginBottom: '8px' }}
                        formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-4">
                    {expenseStats.map((stat, index) => (
                      <div key={stat._id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{stat._id}</span>
                        </div>
                        <span className="text-foreground/60">₹{stat.total.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-80 flex items-center justify-center text-foreground/40 bg-white/5 rounded-lg">
                  <div className="text-center">
                    <p className="text-5xl mb-3">🥧</p>
                    <p>No category data</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>

        {/* Quick Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Average Monthly Expense */}
          <div className="glass-card p-6 hover:border-primary/30 transition-all duration-300 group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">📈</span>
              </div>
              <div>
                <p className="text-sm text-foreground/60 font-medium">Avg Monthly Expense</p>
                <p className="text-2xl font-bold">
                  ₹{Math.round(monthlyExpenses.reduce((sum, m) => sum + m.amount, 0) / 12).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            <p className="text-xs text-foreground/50">Based on {selectedYear} data</p>
          </div>

          {/* Highest Expense Month */}
          <div className="glass-card p-6 hover:border-primary/30 transition-all duration-300 group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">🔥</span>
              </div>
              <div>
                <p className="text-sm text-foreground/60 font-medium">Highest Expense</p>
                <p className="text-2xl font-bold">
                  {monthlyExpenses.length > 0 
                    ? monthlyExpenses.reduce((max, m) => m.amount > max.amount ? m : max, monthlyExpenses[0]).month
                    : 'N/A'}
                </p>
              </div>
            </div>
            <p className="text-xs text-foreground/50">
              {monthlyExpenses.length > 0 
                ? `₹${monthlyExpenses.reduce((max, m) => m.amount > max.amount ? m : max, monthlyExpenses[0]).amount.toLocaleString('en-IN')}`
                : 'No data'}
            </p>
          </div>

          {/* Savings Potential */}
          <div className="glass-card p-6 hover:border-primary/30 transition-all duration-300 group">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-sm text-foreground/60 font-medium">Top Category</p>
                <p className="text-2xl font-bold">
                  {expenseStats.length > 0 ? expenseStats[0]._id : 'N/A'}
                </p>
              </div>
            </div>
            <p className="text-xs text-foreground/50">
              {expenseStats.length > 0 
                ? `₹${expenseStats[0].total.toLocaleString('en-IN')} spent`
                : 'No data'}
            </p>
          </div>
        </div>

        {/* Activity Feed and Category Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 glass-card">
            <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 pb-4 border-b border-white/10 last:border-0">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">{activity.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{activity.title}</p>
                      <p className="text-sm text-foreground/60">
                        {activity.amount ? `₹${activity.amount.toLocaleString('en-IN')} • ` : ''}{activity.date}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-foreground/60 text-center py-8">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* Overdue Payments Notification Dialog */}
        <AlertDialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="text-red-500" size={24} />
                Overdue Payments Alert
              </AlertDialogTitle>
              <AlertDialogDescription>
                You have {overduePayments.length} payment{overduePayments.length !== 1 ? 's' : ''} that {overduePayments.length !== 1 ? 'are' : 'is'} overdue by 2+ days.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {overduePayments.map((payment) => (
                <div key={payment._id} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="font-semibold text-foreground">{payment.title}</p>
                  <p className="text-sm text-foreground/70">Amount: ₹{payment.amount.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-red-500 mt-1">
                    Due: {new Date(payment.dueDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
              ))}
            </div>

            <AlertDialogAction onClick={() => setShowNotificationDialog(false)}>
              Acknowledge
            </AlertDialogAction>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
