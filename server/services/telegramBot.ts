import TelegramBot from 'node-telegram-bot-api';
import { User } from '../models/User';
import { Task } from '../models/Task';
import { Expense } from '../models/Expense';
import { Policy } from '../models/Policy';
import { Payment } from '../models/Payment';
import crypto from 'crypto';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// Conversation states for multi-step flows
const conversationState: {
  [chatId: number]: {
    state: string;
    data: any;
    timeout: NodeJS.Timeout;
  };
} = {};

// Initialize bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Helper: Generate 6-digit code
function generateLinkCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Helper: Clear conversation state
function clearConversationState(chatId: number) {
  if (conversationState[chatId]) {
    clearTimeout(conversationState[chatId].timeout);
    delete conversationState[chatId];
  }
}

// Helper: Set conversation state with timeout
function setConversationState(chatId: number, state: string, data: any = {}) {
  clearConversationState(chatId);
  const timeout = setTimeout(() => clearConversationState(chatId), 5 * 60 * 1000); // 5 min timeout
  conversationState[chatId] = { state, data, timeout };
}

// Start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const user = await User.findOne({ telegramChatId: chatId });

    if (user && user.telegramLinked) {
      bot.sendMessage(
        chatId,
        `Welcome back, ${user.name}! 👋\n\nYou can use these commands:\n/status - Today's summary\n/help - List all commands`
      );
    } else {
      const code = generateLinkCode();
      const tempCode = `temp_${chatId}_${code}`;

      // Store temporary code for verification
      setConversationState(chatId, 'awaiting_link', { code });

      bot.sendMessage(
        chatId,
        `🎉 Welcome to FinTask!\n\nTo link your account:\n\n1. Go to your FinTask Settings\n2. Enter this code: *${code}*\n\nCode expires in 5 minutes.`,
        { parse_mode: 'Markdown' }
      );
    }
  } catch (error) {
    console.error('Start command error:', error);
    bot.sendMessage(chatId, '❌ An error occurred. Please try again later.');
  }
});

// Link command
bot.onText(/\/link\s+(.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const code = match[1];

  try {
    const user = await User.findOne({
      telegramLinkCode: code,
      telegramLinked: false,
    });

    if (!user) {
      return bot.sendMessage(chatId, '❌ Invalid or expired code. Please try /start again.');
    }

    // Link the account
    user.telegramChatId = chatId.toString();
    user.telegramLinked = true;
    user.telegramLinkCode = undefined;
    await user.save();

    clearConversationState(chatId);

    bot.sendMessage(chatId, `✅ Account linked successfully! Welcome, ${user.name}!`);
  } catch (error) {
    console.error('Link command error:', error);
    bot.sendMessage(chatId, '❌ An error occurred during linking. Please try again.');
  }
});

// Status command
bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const user = await User.findOne({ telegramChatId: chatId });

    if (!user || !user.telegramLinked) {
      return bot.sendMessage(chatId, '❌ Please link your account first using /start');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = await Task.find({
      userId: user._id,
      dueDate: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
    });

    const pendingPayments = await Payment.find({
      userId: user._id,
      status: { $in: ['pending', 'overdue'] },
    });

    const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

    let message = `📊 Today's Summary (${today.toLocaleDateString('en-IN')})\n\n`;
    message += `📝 Tasks due today: ${tasks.length}\n`;
    message += `💳 Pending payments: ${pendingPayments.length} (₹${totalPending})\n\n`;
    message += 'Commands: /help';

    bot.sendMessage(chatId, message);
  } catch (error) {
    console.error('Status command error:', error);
    bot.sendMessage(chatId, '❌ Failed to fetch status.');
  }
});

// Add expense command (multi-step)
bot.onText(/\/addexpense/, (msg) => {
  const chatId = msg.chat.id;
  setConversationState(chatId, 'expense_amount');
  bot.sendMessage(chatId, 'What is the expense amount (in ₹)?');
});

// Add task command (multi-step)
bot.onText(/\/addtask/, (msg) => {
  const chatId = msg.chat.id;
  setConversationState(chatId, 'task_title');
  bot.sendMessage(chatId, 'What is the task title?');
});

// Add payment command (multi-step)
bot.onText(/\/addpayment/, (msg) => {
  const chatId = msg.chat.id;
  setConversationState(chatId, 'payment_title');
  bot.sendMessage(chatId, 'What is the payment title?');
});

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `📚 Available Commands:\n\n` +
    `/start - Link your account\n` +
    `/link <code> - Link with verification code\n` +
    `/status - Today's summary\n` +
    `/addexpense - Add a new expense\n` +
    `/addtask - Add a new task\n` +
    `/addpayment - Add a new payment\n` +
    `/expenses - View this month's expenses\n` +
    `/pending - View pending tasks & payments\n` +
    `/renewals - View upcoming renewals\n` +
    `/report - Monthly financial report\n` +
    `/help - Show this help message`;

  bot.sendMessage(chatId, helpMessage);
});

// Handle message responses for multi-step flows
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || '';

  // Skip command messages
  if (text.startsWith('/')) return;

  try {
    const state = conversationState[chatId];
    if (!state) return;

    const user = await User.findOne({ telegramChatId: chatId });
    if (!user || !user.telegramLinked) {
      return bot.sendMessage(chatId, '❌ Please link your account first using /start');
    }

    // Expense flow
    if (state.state === 'expense_amount') {
      const amount = parseFloat(text);
      if (isNaN(amount) || amount <= 0) {
        return bot.sendMessage(chatId, '❌ Invalid amount. Please enter a valid number.');
      }
      state.data.amount = amount;
      setConversationState(chatId, 'expense_category', state.data);
      bot.sendMessage(chatId, 'What is the category (e.g., Food, Transport, Utilities)?');
    } else if (state.state === 'expense_category') {
      state.data.category = text;
      setConversationState(chatId, 'expense_note', state.data);
      bot.sendMessage(chatId, 'Any notes? (or reply "skip")');
    } else if (state.state === 'expense_note') {
      state.data.note = text === 'skip' ? '' : text;
      const expense = await Expense.create({
        userId: user._id,
        amount: state.data.amount,
        category: state.data.category,
        note: state.data.note,
        date: new Date(),
        source: 'telegram',
      });
      clearConversationState(chatId);
      bot.sendMessage(chatId, `✅ Expense added: ₹${expense.amount} for ${expense.category}`);
    }
    // Task flow
    else if (state.state === 'task_title') {
      state.data.title = text;
      setConversationState(chatId, 'task_due_date', state.data);
      bot.sendMessage(chatId, 'Due date? (format: YYYY-MM-DD)');
    } else if (state.state === 'task_due_date') {
      const dueDate = new Date(text);
      if (isNaN(dueDate.getTime())) {
        return bot.sendMessage(chatId, '❌ Invalid date format. Use YYYY-MM-DD');
      }
      state.data.dueDate = dueDate;
      setConversationState(chatId, 'task_priority', state.data);
      bot.sendMessage(chatId, 'Priority? (low/medium/high/critical)');
    } else if (state.state === 'task_priority') {
      const priority = text.toLowerCase();
      if (!['low', 'medium', 'high', 'critical'].includes(priority)) {
        return bot.sendMessage(chatId, '❌ Invalid priority. Choose: low/medium/high/critical');
      }
      const task = await Task.create({
        userId: user._id,
        title: state.data.title,
        dueDate: state.data.dueDate,
        priority,
        status: 'pending',
        source: 'telegram',
      });
      clearConversationState(chatId);
      bot.sendMessage(chatId, `✅ Task added: ${task.title}`);
    }
    // Payment flow
    else if (state.state === 'payment_title') {
      state.data.title = text;
      setConversationState(chatId, 'payment_amount', state.data);
      bot.sendMessage(chatId, 'Payment amount (in ₹)?');
    } else if (state.state === 'payment_amount') {
      const amount = parseFloat(text);
      if (isNaN(amount) || amount <= 0) {
        return bot.sendMessage(chatId, '❌ Invalid amount. Please enter a valid number.');
      }
      state.data.amount = amount;
      setConversationState(chatId, 'payment_due_date', state.data);
      bot.sendMessage(chatId, 'Due date? (format: YYYY-MM-DD)');
    } else if (state.state === 'payment_due_date') {
      const dueDate = new Date(text);
      if (isNaN(dueDate.getTime())) {
        return bot.sendMessage(chatId, '❌ Invalid date format. Use YYYY-MM-DD');
      }
      const payment = await Payment.create({
        userId: user._id,
        title: state.data.title,
        amount: state.data.amount,
        dueDate,
        status: 'pending',
        source: 'telegram',
      });
      clearConversationState(chatId);
      bot.sendMessage(chatId, `✅ Payment added: ₹${payment.amount} - ${payment.title}`);
    }
  } catch (error) {
    console.error('Message handler error:', error);
    bot.sendMessage(chatId, '❌ An error occurred. Please try again.');
    clearConversationState(chatId);
  }
});

export { bot, generateLinkCode, clearConversationState, setConversationState };
