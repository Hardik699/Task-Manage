import { bot } from './telegramBot';
import { User } from '../models/User';

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
}

export async function sendTelegramNotification(userId: string, payload: NotificationPayload) {
  try {
    const user = await User.findById(userId);

    if (!user || !user.telegramLinked || !user.telegramChatId) {
      return false;
    }

    const message = `${payload.icon || '📢'} *${payload.title}*\n\n${payload.body}`;

    await bot.sendMessage(user.telegramChatId, message, { parse_mode: 'Markdown' });
    return true;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return false;
  }
}

export async function notifyTaskDue(userId: string, taskTitle: string, dueTime: string) {
  return sendTelegramNotification(userId, {
    icon: '⏰',
    title: 'Task Due Reminder',
    body: `Your task "*${taskTitle}*" is due at ${dueTime}`,
  });
}

export async function notifyPaymentDue(userId: string, paymentTitle: string, amount: number, daysUntil: number) {
  const message = daysUntil === 0
    ? `Your payment "*${paymentTitle}*" is due TODAY!\nAmount: ₹${amount}`
    : `Your payment "*${paymentTitle}*" is due in ${daysUntil} day(s).\nAmount: ₹${amount}`;

  return sendTelegramNotification(userId, {
    icon: '💳',
    title: 'Payment Due Reminder',
    body: message,
  });
}

export async function notifyPolicyRenewal(userId: string, policyName: string, daysUntil: number) {
  return sendTelegramNotification(userId, {
    icon: '🔄',
    title: 'Policy Renewal Reminder',
    body: `Your policy "*${policyName}*" renews in ${daysUntil} day(s)`,
  });
}

export async function notifyTaskCreated(userId: string, taskTitle: string) {
  return sendTelegramNotification(userId, {
    icon: '✅',
    title: 'Task Created',
    body: `New task added: "*${taskTitle}*"`,
  });
}

export async function notifyOverdueItems(userId: string, overdueCount: number) {
  return sendTelegramNotification(userId, {
    icon: '🚨',
    title: 'Overdue Alert',
    body: `You have ${overdueCount} overdue item(s). Check your dashboard!`,
  });
}

export async function notifyMonthlySummary(userId: string, summary: {
  totalExpenses: number;
  categoryBreakdown: { category: string; amount: number }[];
  totalPayments: number;
  paidPayments: number;
}) {
  let body = `*Monthly Summary*\n\n`;
  body += `💰 Total Expenses: ₹${summary.totalExpenses}\n\n`;
  body += `*Breakdown by Category:*\n`;

  summary.categoryBreakdown.forEach((cat) => {
    body += `  • ${cat.category}: ₹${cat.amount}\n`;
  });

  body += `\n💳 Payments: ${summary.paidPayments}/${summary.totalPayments} paid`;

  return sendTelegramNotification(userId, {
    icon: '📊',
    title: 'Monthly Report',
    body,
  });
}
