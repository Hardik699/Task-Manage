import cron from 'node-cron';
import { Task } from '../models/Task';
import { Payment } from '../models/Payment';
import { Policy } from '../models/Policy';
import { Expense } from '../models/Expense';
import { User } from '../models/User';
import {
  notifyTaskDue,
  notifyPaymentDue,
  notifyPolicyRenewal,
  notifyOverdueItems,
  notifyMonthlySummary,
} from './notifications';
import { formatInTimeZone } from 'date-fns-tz';
import { format as formatDate } from 'date-fns';

const TIMEZONE = 'Asia/Kolkata'; // IST

// Check task reminders every minute
export function startTaskReminders() {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      const tasks = await Task.find({
        status: { $ne: 'done' },
        dueDate: { $lte: now },
        reminderSentAt: null,
      }).populate('userId');

      for (const task of tasks) {
        const user = task.userId as any;
        if (user.telegramLinked) {
          const dueTime = formatInTimeZone(task.dueDate, TIMEZONE, 'HH:mm');
          await notifyTaskDue(user._id.toString(), task.title, dueTime);
          task.reminderSentAt = now;
          await task.save();
        }
      }
    } catch (error) {
      console.error('Task reminders error:', error);
    }
  });
}

// Check payment reminders daily at 9 AM IST
export function startPaymentReminders() {
  cron.schedule('0 9 * * *', async () => {
    try {
      const users = await User.find({ telegramLinked: true });

      for (const user of users) {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // Check payments due today
        const dueTodayPayments = await Payment.find({
          userId: user._id,
          status: 'pending',
          dueDate: { $gte: now, $lt: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
        });

        for (const payment of dueTodayPayments) {
          await notifyPaymentDue(user._id.toString(), payment.title, payment.amount, 0);
        }

        // Check payments due in 1 day
        const dueInOneDay = await Payment.find({
          userId: user._id,
          status: 'pending',
          dueDate: { $gte: tomorrow, $lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000) },
          reminderSentAt: null,
        });

        for (const payment of dueInOneDay) {
          await notifyPaymentDue(user._id.toString(), payment.title, payment.amount, 1);
          payment.reminderSentAt = now;
          await payment.save();
        }
      }
    } catch (error) {
      console.error('Payment reminders error:', error);
    }
  });
}

// Check policy renewal reminders daily at 9 AM IST
export function startPolicyReminders() {
  cron.schedule('0 9 * * *', async () => {
    try {
      const policies = await Policy.find({ status: 'active' }).populate('userId');

      for (const policy of policies) {
        const user = policy.userId as any;

        if (!user.telegramLinked) continue;

        const now = new Date();
        const renewalDate = new Date(policy.renewalDate);
        const daysUntilRenewal = Math.ceil(
          (renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Check if reminder needs to be sent
        const shouldSendReminder = policy.reminderDays.includes(daysUntilRenewal) &&
          !policy.lastReminderSentDays.includes(daysUntilRenewal);

        if (shouldSendReminder && daysUntilRenewal > 0) {
          await notifyPolicyRenewal(user._id.toString(), policy.name, daysUntilRenewal);

          // Mark reminder as sent
          policy.lastReminderSentDays.push(daysUntilRenewal);
          await policy.save();
        }

        // Update status based on renewal date
        if (renewalDate < now) {
          policy.status = 'expired';
          await policy.save();
        }
      }
    } catch (error) {
      console.error('Policy reminders error:', error);
    }
  });
}

// Check overdue items daily at 10 AM IST
export function startOverdueAlerts() {
  cron.schedule('0 10 * * *', async () => {
    try {
      const users = await User.find({ telegramLinked: true });

      for (const user of users) {
        const now = new Date();

        const overdueTasks = await Task.countDocuments({
          userId: user._id,
          status: { $ne: 'done' },
          dueDate: { $lt: now },
        });

        const overduePayments = await Payment.countDocuments({
          userId: user._id,
          status: 'pending',
          dueDate: { $lt: now },
        });

        const totalOverdue = overdueTasks + overduePayments;

        if (totalOverdue > 0) {
          await notifyOverdueItems(user._id.toString(), totalOverdue);
        }
      }
    } catch (error) {
      console.error('Overdue alerts error:', error);
    }
  });
}

// Monthly summary on 1st of month at 8 AM IST
export function startMonthlySummary() {
  cron.schedule('0 8 1 * *', async () => {
    try {
      const users = await User.find({ telegramLinked: true });

      for (const user of users) {
        // Get last month's expenses
        const now = new Date();
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const expenses = await Expense.find({
          userId: user._id,
          date: { $gte: firstDayLastMonth, $lte: lastDayLastMonth },
        });

        const categoryMap = new Map<string, number>();
        let totalExpenses = 0;

        for (const expense of expenses) {
          totalExpenses += expense.amount;
          categoryMap.set(
            expense.category,
            (categoryMap.get(expense.category) || 0) + expense.amount
          );
        }

        const categoryBreakdown = Array.from(categoryMap, ([category, amount]) => ({
          category,
          amount,
        })).sort((a, b) => b.amount - a.amount);

        // Get last month's payments
        const payments = await Payment.find({
          userId: user._id,
          paidDate: { $gte: firstDayLastMonth, $lte: lastDayLastMonth },
        });

        const paidPayments = payments.filter((p) => p.status === 'paid').length;

        if (user.notificationPrefs.monthlyReport) {
          await notifyMonthlySummary(user._id.toString(), {
            totalExpenses,
            categoryBreakdown,
            totalPayments: payments.length,
            paidPayments,
          });
        }
      }
    } catch (error) {
      console.error('Monthly summary error:', error);
    }
  });
}

// Initialize all cron jobs
export function initializeCronJobs() {
  console.log('📅 Initializing cron jobs...');
  startTaskReminders();
  console.log('  ✓ Task reminders scheduled');
  startPaymentReminders();
  console.log('  ✓ Payment reminders scheduled');
  startPolicyReminders();
  console.log('  ✓ Policy renewal reminders scheduled');
  startOverdueAlerts();
  console.log('  ✓ Overdue alerts scheduled');
  startMonthlySummary();
  console.log('  ✓ Monthly summary scheduled');
  console.log('📅 All cron jobs initialized successfully');
}
