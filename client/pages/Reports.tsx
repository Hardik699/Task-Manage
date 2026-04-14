import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { expenseAPI, paymentAPI, goalAPI, incomeAPI } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { TrendingUp, TrendingDown, DollarSign, Calendar, PieChart, BarChart3, Download } from 'lucide-react';

interface ExpenseData {
  _id: string;
  amount: number;
  category: string;
  date: string;
}

interface IncomeData {
  _id: string;
  amount: number;
  category: string;
  date: string;
  type: string;
}

interface PaymentData {
  _id: string;
  amount: number;
  category: string;
  status: string;
  isLoan?: boolean;
  paidAmount?: number;
  remainingAmount?: number;
}

interface GoalData {
  _id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  status: string;
}

export default function Reports() {
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [incomes, setIncomes] = useState<IncomeData[]>([]);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, [selectedPeriod, selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expensesRes, incomesRes, paymentsRes, goalsRes] = await Promise.all([
        expenseAPI.getAll({}),
        incomeAPI.getAll({}),
        paymentAPI.getAll({}),
        goalAPI.getAll({}),
      ]);

      setExpenses(expensesRes.data?.expenses || []);
      setIncomes(incomesRes.data?.incomes || []);
      setPayments(paymentsRes.data?.payments || []);
      setGoals(goalsRes.data?.goals || []);
    } catch (error: any) {
      if (error?.response?.status !== 503) {
        console.error('Error fetching data:', error);
      }
      setExpenses([]);
      setIncomes([]);
      setPayments([]);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const filterByPeriod = (data: any[], dateField: string = 'date') => {
    const now = new Date();
    return data.filter((item) => {
      const itemDate = new Date(item[dateField]);
      if (selectedPeriod === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return itemDate >= weekAgo;
      } else if (selectedPeriod === 'month') {
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
      } else {
        return itemDate.getFullYear() === selectedYear;
      }
    });
  };

  const filteredExpenses = filterByPeriod(expenses);
  const filteredIncomes = filterByPeriod(incomes);
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalIncome = filteredIncomes.reduce((sum, inc) => sum + inc.amount, 0);
  const netSavings = totalIncome - totalExpenses;

  const categoryBreakdown = filteredExpenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const incomeCategoryBreakdown = filteredIncomes.reduce((acc, inc) => {
    acc[inc.category] = (acc[inc.category] || 0) + inc.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topIncomeCategories = Object.entries(incomeCategoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const loans = payments.filter((p) => p.isLoan);
  const totalLoanAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
  const totalLoanPaid = loans.reduce((sum, loan) => sum + (loan.paidAmount || 0), 0);
  const totalLoanRemaining = loans.reduce((sum, loan) => sum + (loan.remainingAmount || 0), 0);

  const pendingPayments = payments.filter((p) => p.status === 'pending' && !p.isLoan);
  const totalPendingPayments = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  const activeGoals = goals.filter((g) => g.status === 'active');
  const totalGoalTarget = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalGoalSaved = activeGoals.reduce((sum, g) => sum + g.currentAmount, 0);

  const monthlyExpenses = Array.from({ length: 12 }, (_, i) => {
    const monthExpenses = expenses.filter((exp) => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === i && expDate.getFullYear() === selectedYear;
    });
    return monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  });

  const monthlyIncomes = Array.from({ length: 12 }, (_, i) => {
    const monthIncomes = incomes.filter((inc) => {
      const incDate = new Date(inc.date);
      return incDate.getMonth() === i && incDate.getFullYear() === selectedYear;
    });
    return monthIncomes.reduce((sum, inc) => sum + inc.amount, 0);
  });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const maxMonthlyExpense = Math.max(...monthlyExpenses, 1);
  const maxMonthlyIncome = Math.max(...monthlyIncomes, 1);

  const downloadReport = () => {
    const reportData = {
      period: selectedPeriod,
      year: selectedYear,
      summary: {
        totalIncome,
        totalExpenses,
        netSavings,
        totalLoanAmount,
        totalLoanPaid,
        totalLoanRemaining,
        totalPendingPayments,
        totalGoalTarget,
        totalGoalSaved,
      },
      categoryBreakdown,
      incomeCategoryBreakdown,
      monthlyExpenses: monthNames.map((month, i) => ({ month, amount: monthlyExpenses[i] })),
      monthlyIncomes: monthNames.map((month, i) => ({ month, amount: monthlyIncomes[i] })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${selectedYear}-${selectedPeriod}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Report downloaded successfully',
    });
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">📊 Financial Reports</h1>
            <p className="text-foreground/60">Detailed insights about your finances</p>
          </div>
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-violet-600 dark:from-primary-400 dark:to-violet-400 text-white rounded-lg font-medium hover:shadow-lg transition-all"
          >
            <Download size={20} />
            Download Report
          </button>
        </div>

        {/* Period Selector */}
        <div className="flex gap-4 items-center">
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedPeriod === period
                    ? 'bg-primary text-white'
                    : 'glass hover:bg-white/10'
                }`}
              >
                {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'Yearly'}
              </button>
            ))}
          </div>
          {selectedPeriod === 'year' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="input-glass px-4 py-2"
            >
              {Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-foreground/60">Loading reports...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-foreground/60 text-sm font-medium">Total Income</p>
                  <TrendingUp className="text-success" size={20} />
                </div>
                <p className="text-3xl font-bold text-success">₹{totalIncome.toLocaleString('en-IN')}</p>
                <p className="text-xs text-foreground/60 mt-2">{filteredIncomes.length} transactions</p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-foreground/60 text-sm font-medium">Total Expenses</p>
                  <TrendingDown className="text-destructive" size={20} />
                </div>
                <p className="text-3xl font-bold text-destructive">₹{totalExpenses.toLocaleString('en-IN')}</p>
                <p className="text-xs text-foreground/60 mt-2">{filteredExpenses.length} transactions</p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-foreground/60 text-sm font-medium">Net Savings</p>
                  <DollarSign className={netSavings >= 0 ? 'text-success' : 'text-destructive'} size={20} />
                </div>
                <p className={`text-3xl font-bold ${netSavings >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ₹{Math.abs(netSavings).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-foreground/60 mt-2">{netSavings >= 0 ? 'Surplus' : 'Deficit'}</p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-foreground/60 text-sm font-medium">Pending Payments</p>
                  <Calendar className="text-warning" size={20} />
                </div>
                <p className="text-3xl font-bold text-warning">₹{totalPendingPayments.toLocaleString('en-IN')}</p>
                <p className="text-xs text-foreground/60 mt-2">{pendingPayments.length} pending</p>
              </div>

              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-foreground/60 text-sm font-medium">Goals Progress</p>
                  <TrendingUp className="text-success" size={20} />
                </div>
                <p className="text-3xl font-bold text-success">
                  {totalGoalTarget ? Math.round((totalGoalSaved / totalGoalTarget) * 100) : 0}%
                </p>
                <p className="text-xs text-foreground/60 mt-2">
                  ₹{totalGoalSaved.toLocaleString('en-IN')} / ₹{totalGoalTarget.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Income vs Expense Chart */}
            {selectedPeriod === 'year' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Monthly Income Chart */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="text-success" size={24} />
                    <h2 className="text-2xl font-bold">Monthly Income - {selectedYear}</h2>
                  </div>
                  <div className="space-y-3">
                    {monthNames.map((month, i) => (
                      <div key={month}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{month}</span>
                          <span className="text-sm font-bold text-success">₹{monthlyIncomes[i].toLocaleString('en-IN')}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-success to-emerald-600 h-3 rounded-full transition-all"
                            style={{
                              width: `${(monthlyIncomes[i] / maxMonthlyIncome) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monthly Expense Chart */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="text-primary" size={24} />
                    <h2 className="text-2xl font-bold">Monthly Expenses - {selectedYear}</h2>
                  </div>
                  <div className="space-y-3">
                    {monthNames.map((month, i) => (
                      <div key={month}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{month}</span>
                          <span className="text-sm font-bold">₹{monthlyExpenses[i].toLocaleString('en-IN')}</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-primary-600 to-violet-600 h-3 rounded-full transition-all"
                            style={{
                              width: `${(monthlyExpenses[i] / maxMonthlyExpense) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Category Breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Income Categories */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="text-success" size={24} />
                  <h2 className="text-2xl font-bold">Top Income Sources</h2>
                </div>
                {topIncomeCategories.length === 0 ? (
                  <p className="text-center text-foreground/60 py-8">No income data available</p>
                ) : (
                  <div className="space-y-4">
                    {topIncomeCategories.map(([category, amount]) => {
                      const percentage = (amount / totalIncome) * 100;
                      return (
                        <div key={category}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{category}</span>
                            <div className="text-right">
                              <span className="font-bold text-success">₹{amount.toLocaleString('en-IN')}</span>
                              <span className="text-sm text-foreground/60 ml-2">({percentage.toFixed(1)}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-success to-emerald-600 h-3 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Expense Categories */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-2 mb-6">
                  <PieChart className="text-primary" size={24} />
                  <h2 className="text-2xl font-bold">Top Expense Categories</h2>
                </div>
                {topCategories.length === 0 ? (
                  <p className="text-center text-foreground/60 py-8">No expense data available</p>
                ) : (
                  <div className="space-y-4">
                    {topCategories.map(([category, amount]) => {
                      const percentage = (amount / totalExpenses) * 100;
                      return (
                        <div key={category}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{category}</span>
                            <div className="text-right">
                              <span className="font-bold">₹{amount.toLocaleString('en-IN')}</span>
                              <span className="text-sm text-foreground/60 ml-2">({percentage.toFixed(1)}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-primary to-violet-600 h-3 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Insights */}
            <div className="glass-card p-6">
              <h2 className="text-2xl font-bold mb-4">💡 Financial Insights</h2>
              <div className="space-y-3">
                {totalIncome > 0 && (
                  <div className="p-4 bg-success/20 rounded-lg border border-success/50">
                    <p className="text-sm">
                      Your total income is <span className="font-bold">₹{totalIncome.toLocaleString('en-IN')}</span> with net savings of <span className="font-bold">₹{Math.abs(netSavings).toLocaleString('en-IN')}</span>
                    </p>
                  </div>
                )}
                {netSavings < 0 && (
                  <div className="p-4 bg-destructive/20 rounded-lg border border-destructive/50">
                    <p className="text-sm">
                      ⚠️ You're spending <span className="font-bold">₹{Math.abs(netSavings).toLocaleString('en-IN')}</span> more than your income. Consider reducing expenses!
                    </p>
                  </div>
                )}
                {totalExpenses > 0 && (
                  <div className="p-4 bg-info/20 rounded-lg border border-info/50">
                    <p className="text-sm">
                      Your average daily expense is <span className="font-bold">₹{Math.round(totalExpenses / (selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 365)).toLocaleString('en-IN')}</span>
                    </p>
                  </div>
                )}
                {topCategories.length > 0 && (
                  <div className="p-4 bg-warning/20 rounded-lg border border-warning/50">
                    <p className="text-sm">
                      Your highest spending category is <span className="font-bold">{topCategories[0][0]}</span> with ₹{topCategories[0][1].toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
                {topIncomeCategories.length > 0 && (
                  <div className="p-4 bg-success/20 rounded-lg border border-success/50">
                    <p className="text-sm">
                      Your primary income source is <span className="font-bold">{topIncomeCategories[0][0]}</span> with ₹{topIncomeCategories[0][1].toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
                {activeGoals.length > 0 && (
                  <div className="p-4 bg-primary/20 rounded-lg border border-primary/50">
                    <p className="text-sm">
                      You're <span className="font-bold">{Math.round((totalGoalSaved / totalGoalTarget) * 100)}%</span> towards your savings goals!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
