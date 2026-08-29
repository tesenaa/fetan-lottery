import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import https from 'https';
import mongoose from 'mongoose';
import { bot } from './bot.js';
import { webhookCallback, InlineKeyboard } from 'grammy';

const WEB_APP_URL = process.env.WEB_APP_URL || "https://fetan-lottery.vercel.app";
const SUPER_ADMIN_ID = process.env.SUPER_ADMIN_ID || process.env.ADMIN_ID || "494653076";
const ASSISTANT_ADMIN_1 = process.env.ASSISTANT_ADMIN_1 || "6557480753";
const ASSISTANT_ADMIN_2 = process.env.ASSISTANT_ADMIN_2 || "6660106172";
const ADMIN_GROUP_ID = process.env.ADMIN_GROUP_ID || "-1003928734889";

const app = express();
app.use(cors());
app.use(express.json());

// --- MONGODB CONNECTION WITH ADVANCED POOLING ---
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI, {
    maxPoolSize: 100,
    minPoolSize: 20,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log('✅ Connected to MongoDB Atlas successfully!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));
} else {
  console.warn('⚠️ MONGODB_URI environment variable is missing!');
}

// --- MONGOOSE SCHEMAS ---
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  firstName: { type: String, default: '' },
  username: { type: String, default: '' },
  phone: { type: String, default: '' },
  phoneBonusReceived: { type: Boolean, default: false },
  mainWallet: { type: Number, default: 0, min: 0 },
  playWallet: { type: Number, default: 0, min: 0 },
  totalInvite: { type: Number, default: 0 },
  invitedCount: { type: Number, default: 0 },
  hasReceivedInviteBonus: { type: Boolean, default: false },
  gamesWon: { type: Number, default: 0 },
  totalGames: { type: Number, default: 0 },
  isBanned: { type: Boolean, default: false }
}, { timestamps: true });

const depositSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  userName: { type: String, default: '' },
  amount: { type: Number, required: true },
  pastedText: { type: String, required: true },
  transactionId: { type: String, default: null, index: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  processedBy: { type: String, default: null },
  telegramMessageId: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now, expires: 7776000 }
});

const transactionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  userName: { type: String, default: '' },
  type: { type: String, enum: ['deposit', 'withdrawal'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  processedBy: { type: String, default: null },
  phone: { type: String, default: '' },
  telegramMessageId: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now, expires: 7776000 }
});

const gameHistorySchema = new mongoose.Schema({
  gameId: { type: String, required: true, index: true },
  winningNumber: { type: Number, required: true },
  winnerUserId: { type: String, required: true, index: true },
  winnerName: { type: String, default: '' },
  totalCollected: { type: Number, default: 0 },
  derash: { type: Number, default: 0 },
  houseProfit: { type: Number, default: 0 },
  playersCount: { type: Number, default: 0 },
  stake: { type: Number, default: 20 },
  createdAt: { type: Date, default: Date.now, expires: 7776000 }
});

const dailyStatSchema = new mongoose.Schema({
  dateStr: { type: String, required: true, unique: true, index: true },
  totalDeposit: { type: Number, default: 0 },
  totalWithdrawal: { type: Number, default: 0 },
  houseProfit: { type: Number, default: 0 },
  totalGamesCount: { type: Number, default: 0 }
}, { timestamps: true });

const systemSettingsSchema = new mongoose.Schema({
  ticketPrice: { type: Number, default: 20 },
  winnerPercentage: { type: Number, default: 80 },
  houseCommissionPercentage: { type: Number, default: 20 },
  manualWinningNumber: { type: Number, default: null },
  manualWinningNumber10: { type: Number, default: null },
  manualWinningNumber20: { type: Number, default: null },
  manualWinningNumber50: { type: Number, default: null },
  manualWinningNumber100: { type: Number, default: null },
  activeAdmins: {
    admin1: { type: Boolean, default: true },
    admin2: { type: Boolean, default: true }
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Deposit = mongoose.model('Deposit', depositSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const GameHistory = mongoose.model('GameHistory', gameHistorySchema);
const DailyStat = mongoose.model('DailyStat', dailyStatSchema);
const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

app.get('/', (req, res) => {
  res.send('Fetan Lottery Backend is running live 🚀');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
  perMessageDeflate: { threshold: 1024 }
});

// ጌም አይዲው ለሁሉም ስቴኮች (ለ 10፣ 20፣ 50፣ 100) የ6 ዲጂት ቁጥር ብቻ እንዲሆን ተደረገ
function generateGameId(stake) {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return randomNum.toString();
}

// --- Completely Independent Game States for stakes 10, 20, 50, and 100 with Proper Timers ---
const gameStates = {
  10: { currentGameId: generateGameId(10), selectedNumbers: [], timeLeft: 60, gamePhase: 'selecting', winningNumber: null, boardUpdateTimeout: null },
  20: { currentGameId: generateGameId(20), selectedNumbers: [], timeLeft: 60, gamePhase: 'selecting', winningNumber: null, boardUpdateTimeout: null },
  50: { currentGameId: generateGameId(50), selectedNumbers: [], timeLeft: 300, gamePhase: 'selecting', winningNumber: null, boardUpdateTimeout: null },
  100: { currentGameId: generateGameId(100), selectedNumbers: [], timeLeft: 305, gamePhase: 'selecting', winningNumber: null, boardUpdateTimeout: null }
};

const registeredUsersSet = new Set();
const activeUsersMap = new Map();
let cachedSettings = null;
let lastSettingsFetch = 0;
const SETTINGS_CACHE_TTL = 10000;

async function getSettings() {
  const now = Date.now();
  if (cachedSettings && (now - lastSettingsFetch < SETTINGS_CACHE_TTL)) {
    return cachedSettings;
  }
  let settings = await SystemSettings.findOne();
  if (!settings) {
    settings = await SystemSettings.create({
      ticketPrice: 20,
      winnerPercentage: 80,
      houseCommissionPercentage: 20,
      manualWinningNumber: null,
      manualWinningNumber10: null,
      manualWinningNumber20: null,
      manualWinningNumber50: null,
      manualWinningNumber100: null,
      activeAdmins: { admin1: true, admin2: true }
    });
  }
  cachedSettings = settings;
  lastSettingsFetch = now;
  return settings;
}

function broadcastBoard(stake) {
  const numericStake = Number(stake);
  const state = gameStates[numericStake];
  if (!state) return;
  if (state.boardUpdateTimeout) return;
  
  state.boardUpdateTimeout = setTimeout(async () => {
    state.boardUpdateTimeout = null;
    const uniquePlayers = new Set(state.selectedNumbers.map(n => String(n.userId))).size;
    const settings = await getSettings();
    const totalCollected = state.selectedNumbers.length * numericStake;
    const derash = Math.floor(totalCollected * (settings.winnerPercentage / 100));
    io.emit('board_updated', {
      stake: numericStake,
      selectedNumbers: state.selectedNumbers,
      totalPlayers: uniquePlayers,
      derash,
      ticketPrice: numericStake
    });
  }, 20);
}

const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
if (process.env.NODE_ENV === 'production' && RENDER_URL && bot) {
  app.use('/webhook', webhookCallback(bot, 'express'));
}

function extractTransactionId(text) {
  if (!text) return null;
  const explicitMatch = text.match(/(?:txn\s*id|transaction\s*id|ref\s*no|trans\s*id)[\s:-]*([a-z0-9]+)/i);
  if (explicitMatch && explicitMatch[1]) {
    return explicitMatch[1].toUpperCase();
  }
  const telebirrMatch = text.match(/\b([A-Z0-9]{10,12})\b/);
  if (telebirrMatch && telebirrMatch[1]) {
    return telebirrMatch[1].toUpperCase();
  }
  return null;
}

async function checkAdminAuth(req, res, next) {
  const adminKey = req.headers['admin-key'];
  const settings = await getSettings();
  if (adminKey === SUPER_ADMIN_ID) {
    req.adminRole = 'SUPER';
    return next();
  } else if (adminKey === ASSISTANT_ADMIN_1 && settings.activeAdmins?.admin1) {
    req.adminRole = 'ADMIN_1';
    return next();
  } else if (adminKey === ASSISTANT_ADMIN_2 && settings.activeAdmins?.admin2) {
    req.adminRole = 'ADMIN_2';
    return next();
  }
  return res.status(403).json({ success: false, message: "ባለቤቱ አላንቀሳቀሰዎም ወይም አስተዳዳሪ አይደለም!" });
}

function formatUserCount(num) {
  if (num >= 10000) return Math.floor(num / 1000) * 1000 + '+';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

async function getGameStats(stake) {
  const numericStake = Number(stake);
  const state = gameStates[numericStake];
  const settings = await getSettings();
  const winnerPct = settings.winnerPercentage / 100;
  const uniquePlayers = new Set(state.selectedNumbers.map(n => String(n.userId))).size;
  const totalCollected = state.selectedNumbers.length * numericStake;
  const derash = Math.floor(totalCollected * winnerPct);
  const houseProfit = totalCollected - derash;
  return { totalPlayers: uniquePlayers, totalCollected, derash, houseProfit, stake: numericStake };
}

async function getOrInitUser(userId, firstName = '', username = '', phone = '') {
  const uid = String(userId);
  let dbUser = await User.findOne({ userId: uid });
  if (!dbUser) {
    const isPhoneProvided = Boolean(phone);
    dbUser = await User.create({
      userId: uid,
      firstName: firstName || '',
      username: username || '',
      phone: phone || '',
      phoneBonusReceived: isPhoneProvided,
      mainWallet: 0,
      playWallet: isPhoneProvided ? 20 : 0,
      totalInvite: 0,
      invitedCount: 0,
      hasReceivedInviteBonus: false,
      gamesWon: 0,
      totalGames: 0,
      isBanned: false
    });
    if (isPhoneProvided && bot) {
      try {
        await bot.api.sendMessage(uid, `🎉 *እንኳን ደስ አለዎት!*\n\nስልክ ቁጥርዎን በመመዝገብ *20 ETB* በ Play Walletዎ ላይ ተሰጥቶዎታል✨`, { parse_mode: 'Markdown' });
      } catch (err) {}
    }
  } else if (phone && !dbUser.phoneBonusReceived) {
    dbUser.phone = phone;
    dbUser.playWallet += 20;
    dbUser.phoneBonusReceived = true;
    await dbUser.save();
    if (bot) {
      try {
        await bot.api.sendMessage(uid, `🎉 *እንኳን ደስ አለዎት!*\n\nስልክ ቁጥርዎን በመመዝገብ *20 ETB* በ Play Walletዎ ላይ ተሰጥቶዎታል✨`, { parse_mode: 'Markdown' });
      } catch (err) {}
    }
  } else if (phone && !dbUser.phone) {
    dbUser.phone = phone;
    await dbUser.save();
  }
  registeredUsersSet.add(uid);
  return dbUser;
}

async function updateDailyStats(depositAmount = 0, withdrawalAmount = 0, houseProfit = 0, gameCount = 0) {
  const today = new Date().toISOString().split('T')[0];
  await DailyStat.findOneAndUpdate(
    { dateStr: today },
    { $inc: { totalDeposit: depositAmount, totalWithdrawal: withdrawalAmount, houseProfit: houseProfit, totalGamesCount: gameCount } },
    { upsert: true, new: true }
  );
}

async function notifyUserBalanceUpdate(targetUid) {
  const updatedUser = await User.findOne({ userId: String(targetUid) });
  if (!updatedUser) return;
  for (let [socketId, userId] of activeUsersMap.entries()) {
    if (String(userId) === String(targetUid)) {
      io.to(socketId).emit('balance_updated', {
        balance: updatedUser.mainWallet,
        playWallet: updatedUser.playWallet
      });
    }
  }
}

// --- TELEGRAM BOT INLINE BUTTON ACTION HANDLERS ---
if (bot) {
  bot.callbackQuery(/^(dep_approve|dep_reject):(.+)$/, async (ctx) => {
    const action = ctx.match[1];
    const depositId = ctx.match[2];
    const adminTgId = String(ctx.from.id);
    try {
      const deposit = await Deposit.findById(depositId);
      if (!deposit) {
        return ctx.answerCallbackQuery({ text: '❌ ጥያቄው አልተገኘም!', show_alert: true });
      }
      if (deposit.status !== 'PENDING') {
        return ctx.answerCallbackQuery({ text: `⚠️ ይህ ጥያቄ አስቀድሞ ${deposit.status} ሆኗ!`, show_alert: true });
      }
      const targetUid = String(deposit.userId);
      if (action === 'dep_approve') {
        deposit.status = 'APPROVED';
        deposit.processedBy = adminTgId;
        await deposit.save();
        await User.updateOne({ userId: targetUid }, { $inc: { mainWallet: deposit.amount } });
        await updateDailyStats(deposit.amount, 0, 0, 0);
        await notifyUserBalanceUpdate(targetUid);
        try {
          await bot.api.sendMessage(
            targetUid,
            `✅ *ክፍያዎ ተረጋግጦልናል!*\n\n💰 *${deposit.amount} ETB* ወደ አካውንትዎ ገብቷል✨`,
            { parse_mode: 'Markdown' }
          );
        } catch (e) {}
        const user = await User.findOne({ userId: targetUid });
        await ctx.editMessageText(
          `📥 *የዲፖዚት ጥያቄ (✅ Approved by Admin: ${adminTgId})*\n\n` +
          `• *User:* @${user?.username || 'N/A'} (ID: \`${targetUid}\`)\n` +
          `• *Amount:* ${deposit.amount} ETB\n` +
          `• *Txn ID:* \`${deposit.transactionId || 'N/A'}\`\n` +
          `• *Pasted SMS:*\n\`${deposit.pastedText}\``,
          { parse_mode: 'Markdown' }
        );
        ctx.answerCallbackQuery({ text: '✅ ጥያቄው ተሰርቷል!' });
      } else if (action === 'dep_reject') {
        deposit.status = 'REJECTED';
        deposit.processedBy = adminTgId;
        await deposit.save();
        try {
          await bot.api.sendMessage(
            targetUid,
            `❌ *የተላከው የክፍያ ማረጋገጫ ውድቅ ተደርጓል!*`,
            { parse_mode: 'Markdown' }
          );
        } catch (e) {}
        const user = await User.findOne({ userId: targetUid });
        await ctx.editMessageText(
          `📥 *የዲፖዚት ጥያቄ (❌ Rejected by Admin: ${adminTgId})*\n\n` +
          `• *User:* @${user?.username || 'N/A'} (ID: \`${targetUid}\`)\n` +
          `• *Amount:* ${deposit.amount} ETB\n` +
          `• *Txn ID:* \`${deposit.transactionId || 'N/A'}\`\n` +
          `• *Pasted SMS:*\n\`${deposit.pastedText}\``,
          { parse_mode: 'Markdown' }
        );
        ctx.answerCallbackQuery({ text: '❌ ጥያቄው ውድቅ ተደርጓል!' });
      }
    } catch (err) {
      console.error('Callback handle error:', err);
      ctx.answerCallbackQuery({ text: 'ስህተት ተፈጥሯል!', show_alert: true });
    }
  });

  bot.callbackQuery(/^(wit_approve|wit_reject):(.+)$/, async (ctx) => {
    const action = ctx.match[1];
    const txId = ctx.match[2];
    const adminTgId = String(ctx.from.id);
    try {
      const tx = await Transaction.findById(txId);
      if (!tx) {
        return ctx.answerCallbackQuery({ text: '❌ የውጭ ጥያቄው አልተገኘም!', show_alert: true });
      }
      if (tx.status !== 'PENDING') {
        return ctx.answerCallbackQuery({ text: `⚠️ ይህ ጥያቄ አስቀድሞ ${tx.status} ሆኗ!`, show_alert: true });
      }
      const targetUid = String(tx.userId);
      const user = await User.findOne({ userId: targetUid });
      if (action === 'wit_approve') {
        tx.status = 'APPROVED';
        tx.processedBy = adminTgId;
        await tx.save();
        await updateDailyStats(0, tx.amount, 0, 0);
        try {
          await bot.api.sendMessage(
            targetUid,
            `✅ *የውጭ ጥያቄዎ ፈጣን አግኝቷል!*\n\n💰 *${tx.amount} ETB* ወደ ስልክ ቁጥርዎ (${tx.phone}) ተልኳልዟል✨`,
            { parse_mode: 'Markdown' }
          );
        } catch (e) {}
        await ctx.editMessageText(
          `📤 *የውጭ (Withdrawal) ጥያቄ (✅ Approved by Admin: ${adminTgId})*\n\n` +
          `• *User:* @${user?.username || 'N/A'} (ID: \`${targetUid}\`)\n` +
          `• *Amount:* ${tx.amount} ETB\n` +
          `• *Phone:* \`${tx.phone}\``,
          { parse_mode: 'Markdown' }
        );
        ctx.answerCallbackQuery({ text: '✅ የውጭ ጥያቄው ተሰርቷል!' });
      } else if (action === 'wit_reject') {
        tx.status = 'REJECTED';
        tx.processedBy = adminTgId;
        await tx.save();
        await User.updateOne({ userId: targetUid }, { $inc: { mainWallet: tx.amount } });
        await notifyUserBalanceUpdate(targetUid);
        try {
          await bot.api.sendMessage(
            targetUid,
            `❌ *የውጭ ጥያቄዎ ውድቅ ተደርጓል!*\n\n💰 *${tx.amount} ETB* ወደ ዋና አካውንትዎ ተመልሷል✨`,
            { parse_mode: 'Markdown' }
          );
        } catch (e) {}
        await ctx.editMessageText(
          `📤 *የውጭ (Withdrawal) ጥያቄ (❌ Rejected by Admin: ${adminTgId})*\n\n` +
          `• *User:* @${user?.username || 'N/A'} (ID: \`${targetUid}\`)\n` +
          `• *Amount:* ${tx.amount} ETB\n` +
          `• *Phone:* \`${tx.phone}\``,
          { parse_mode: 'Markdown' }
        );
        ctx.answerCallbackQuery({ text: '❌ የውጭ ጥያቄው ተሰርዞ ገንዘቡ ተመልሷል' });
      }
    } catch (err) {
      console.error('Withdrawal Callback error:', err);
      ctx.answerCallbackQuery({ text: 'ስህተት ተፈጥሯል!', show_alert: true });
    }
  });
}

const handleDepositRequest = async (req, res) => {
  const { userId, userName, amount, pastedText } = req.body;
  if (!userId || !amount || !pastedText) {
    return res.status(400).json({ success: false, message: "እባክዎ ሁለንም የሚያሟሉ መረጃዎች ይሙሉ!" });
  }
  const uid = String(userId);
  const depAmount = Number(amount);
  try {
    const user = await getOrInitUser(uid, userName);
    if (user.isBanned) {
      return res.status(403).json({ success: false, message: "አካውንትዎ ስለታገደ አገልግሎት ማግኘት አይችሉም!" });
    }
    const existingPending = await Deposit.findOne({ userId: uid, status: 'PENDING' });
    if (existingPending) {
      return res.status(400).json({ success: false, message: "⚠️ አስቀድሞ pending የዲፖዚት ጥያቄ አለዎት✨" });
    }
    const txnId = extractTransactionId(pastedText);
    if (!txnId) {
      return res.status(400).json({ success: false, message: "⚠️ ከተላከው SMS ውስጥ ትክክለኛ Transaction ID ማግኘት አልተቻለም✨" });
    }
    const duplicateTxn = await Deposit.findOne({ transactionId: txnId, status: { $in: ['PENDING', 'APPROVED'] } });
    if (duplicateTxn) {
      return res.status(400).json({ success: false, message: "⚠️ ይህ የትራንዛክሽን ማረጋገጫ ቀድሞ ጨዋታ ላይ ውሏል!" });
    }
    const deposit = await Deposit.create({
      userId: uid,
      userName: userName || user.username || `User_${uid}`,
      amount: depAmount,
      pastedText: pastedText,
      transactionId: txnId,
      status: 'PENDING'
    });
    if (bot && ADMIN_GROUP_ID) {
      try {
        const keyboard = new InlineKeyboard()
          .text('✅ Approve', `dep_approve:${deposit._id}`)
          .text('❌ Reject', `dep_reject:${deposit._id}`);
        const msgText = `🔔 <b>አዲስ የዲፖዚት (Deposit) ጥያቄ!</b>\n\n` +
          `• *User:* @${user.username || 'N/A'} (ID: \`${uid}\`)\n` +
          `• *Amount:* ${depAmount} ETB\n` +
          `• *Txn ID:* \`${txnId}\`\n` +
          `• *Pasted SMS:*\n\`${pastedText}\``;
        const sentMsg = await bot.api.sendMessage(ADMIN_GROUP_ID, msgText, {
          parse_mode: 'Markdown',
          disable_notification: false,
          reply_markup: keyboard
        });
        deposit.telegramMessageId = sentMsg.message_id;
        await deposit.save();
      } catch (err) {
        console.error('Admin telegram message error:', err.message);
      }
    }
    return res.json({ success: true, message: "ማረጋገጫዎ ተልኳል፤ እባክዎ ጥቂት ደቂቃ ይቆዩ" });
  } catch (err) {
    console.error("Deposit Processing Error:", err);
    res.status(500).json({ success: false, message: "የገንዘብ ማስታወቂያ ስህተት አጋጥሟል!" });
  }
};

app.post('/api/deposit', handleDepositRequest);
app.post('/api/deposit-request', handleDepositRequest);

app.get('/api/admin/settings', checkAdminAuth, async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/settings', checkAdminAuth, async (req, res) => {
  if (req.adminRole !== 'SUPER') {
    return res.status(403).json({ success: false, message: "ይህን ለማድረግ የሚሰጥ አስተዳዳሪ ስልጣን ይወናል!" });
  }
  const { ticketPrice, winnerPercentage, manualWinningNumber, manualWinningNumber10, manualWinningNumber20, manualWinningNumber50, manualWinningNumber100, activeAdmins } = req.body;
  try {
    let settings = await getSettings();
    if (ticketPrice !== undefined) {
      const newPrice = Number(ticketPrice);
      if ([10, 20, 50, 100].includes(newPrice)) {
        settings.ticketPrice = newPrice;
      }
    }
    if (winnerPercentage !== undefined) {
      settings.winnerPercentage = Number(winnerPercentage);
      settings.houseCommissionPercentage = 100 - Number(winnerPercentage);
    }
    if (manualWinningNumber !== undefined) {
      settings.manualWinningNumber = manualWinningNumber !== null ? Number(manualWinningNumber) : null;
    }
    if (manualWinningNumber10 !== undefined) {
      settings.manualWinningNumber10 = manualWinningNumber10 !== null ? Number(manualWinningNumber10) : null;
    }
    if (manualWinningNumber20 !== undefined) {
      settings.manualWinningNumber20 = manualWinningNumber20 !== null ? Number(manualWinningNumber20) : null;
    }
    if (manualWinningNumber50 !== undefined) {
      settings.manualWinningNumber50 = manualWinningNumber50 !== null ? Number(manualWinningNumber50) : null;
    }
    if (manualWinningNumber100 !== undefined) {
      settings.manualWinningNumber100 = manualWinningNumber100 !== null ? Number(manualWinningNumber100) : null;
    }
    if (activeAdmins !== undefined) {
      settings.activeAdmins = activeAdmins;
    }
    await settings.save();
    cachedSettings = settings;
    lastSettingsFetch = Date.now();
    io.emit('settings_updated', { ticketPrice: settings.ticketPrice, winnerPercentage: settings.winnerPercentage });
    res.json({ success: true, settings, message: "ቅንብሩ በሰሁል አዲስ ሁኔታ ተስተካክሏል!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/users', checkAdminAuth, async (req, res) => {
  if (req.adminRole !== 'SUPER') {
    return res.status(403).json({ success: false, message: "የተከለከለ ሕልክ!" });
  }
  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(500);
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/toggle-ban', checkAdminAuth, async (req, res) => {
  if (req.adminRole !== 'SUPER') {
    return res.status(403).json({ success: false, message: "የተከለከለ ሕልክ!" });
  }
  const { targetUserId, isBanned } = req.body;
  try {
    const updatedUser = await User.findOneAndUpdate(
      { userId: String(targetUserId) },
      { $set: { isBanned: Boolean(isBanned) } },
      { new: true }
    );
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/update-balance', checkAdminAuth, async (req, res) => {
  if (req.adminRole !== 'SUPER') {
    return res.status(403).json({ success: false, message: "የተከለከለ ሕልክ!" });
  }
  const { targetUserId, mainWallet, playWallet } = req.body;
  try {
    const updatedUser = await User.findOneAndUpdate(
      { userId: String(targetUserId) },
      { $set: { mainWallet: Math.max(0, Number(mainWallet)), playWallet: Math.max(0, Number(playWallet)) } },
      { new: true }
    );
    await notifyUserBalanceUpdate(String(targetUserId));
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/transactions', checkAdminAuth, async (req, res) => {
  try {
    const deposits = await Deposit.find().sort({ createdAt: -1 }).limit(100);
    const withdrawals = await Transaction.find({ type: 'withdrawal' }).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, transactions: deposits, withdrawals, role: req.adminRole });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/process-transaction', checkAdminAuth, async (req, res) => {
  const { txId, action, type } = req.body;
  const adminKey = req.headers['admin-key'];
  try {
    if (type === 'withdrawal') {
      const tx = await Transaction.findById(txId);
      if (!tx) return res.status(404).json({ success: false, message: "የውጭ ትራንዛክሽን አልተገኘም!" });
      if (tx.status !== 'PENDING') return res.status(400).json({ success: false, message: "ይህ ጥያቄ ቀድሞ ተሠርቷል!" });
      tx.status = action;
      tx.processedBy = adminKey;
      await tx.save();
      if (action === 'REJECTED') {
        await User.updateOne({ userId: String(tx.userId) }, { $inc: { mainWallet: tx.amount } });
        await notifyUserBalanceUpdate(String(tx.userId));
      } else if (action === 'APPROVED') {
        await updateDailyStats(0, tx.amount, 0, 0);
      }
      return res.json({ success: true, transaction: tx, message: `የውጭ ጥያቄው ${action} ሆኗ!` });
    } else {
      const deposit = await Deposit.findById(txId);
      if (!deposit) return res.status(404).json({ success: false, message: "ትራንዛክሽን አልተገኘም!" });
      if (deposit.status !== 'PENDING') return res.status(400).json({ success: false, message: "ይህ ጥያቄ ቀድሞ ተሠርቷል!" });
      deposit.status = action;
      deposit.processedBy = adminKey;
      await deposit.save();
      if (action === 'APPROVED') {
        await User.updateOne({ userId: String(deposit.userId) }, { $inc: { mainWallet: deposit.amount } });
        await updateDailyStats(deposit.amount, 0, 0, 0);
        await notifyUserBalanceUpdate(String(deposit.userId));
      }
      return res.json({ success: true, deposit, message: `የገንዘብ ትራንዛክሽን ${action} ሆኗ!` });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/financial-stats', checkAdminAuth, async (req, res) => {
  if (req.adminRole !== 'SUPER') {
    return res.status(403).json({ success: false, message: "የተከለከለ ሕልክ!" });
  }
  try {
    const totalDeposits = await Deposit.aggregate([
      { $match: { status: 'APPROVED' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalWithdrawals = await Transaction.aggregate([
      { $match: { type: 'withdrawal', status: 'APPROVED' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const pendingDeposits = await Deposit.aggregate([
      { $match: { status: 'PENDING' } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]);
    const pendingWithdrawals = await Transaction.aggregate([
      { $match: { type: 'withdrawal', status: 'PENDING' } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]);
    const gameStats = await GameHistory.aggregate([
      { $group: { _id: null, totalProfit: { $sum: "$houseProfit" }, totalPlayed: { $sum: "$totalCollected" }, totalGames: { $sum: 1 } } }
    ]);
    const adminBreakdown = await Deposit.aggregate([
      { $match: { status: 'APPROVED' } },
      { $group: { _id: "$processedBy", totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]);

    const adminStatsFormatted = { superAdmin: { amount: 0, count: 0 }, admin1: { amount: 0, count: 0 }, admin2: { amount: 0, count: 0 }, others: { amount: 0, count: 0 } };
    adminBreakdown.forEach(item => {
      if (item._id === SUPER_ADMIN_ID) adminStatsFormatted.superAdmin = { amount: item.totalAmount, count: item.count };
      else if (item._id === ASSISTANT_ADMIN_1) adminStatsFormatted.admin1 = { amount: item.totalAmount, count: item.count };
      else if (item._id === ASSISTANT_ADMIN_2) adminStatsFormatted.admin2 = { amount: item.totalAmount, count: item.count };
      else {
        adminStatsFormatted.others.amount += item.totalAmount;
        adminStatsFormatted.others.count += item.count;
      }
    });

    const dailyStats = await DailyStat.find().sort({ dateStr: -1 }).limit(10);
    const activeCount = new Set(activeUsersMap.values()).size;
    const registeredCount = registeredUsersSet.size;

    res.json({
      success: true,
      stats: {
        totalDeposit: totalDeposits[0]?.total || 0,
        totalWithdrawal: totalWithdrawals[0]?.total || 0,
        pendingDepositCount: pendingDeposits[0]?.count || 0,
        pendingDepositAmount: pendingDeposits[0]?.total || 0,
        pendingWithdrawalCount: pendingWithdrawals[0]?.count || 0,
        pendingWithdrawalAmount: pendingWithdrawals[0]?.total || 0,
        houseProfit: gameStats[0]?.totalProfit || 0,
        totalGamesPlayedAmount: gameStats[0]?.totalPlayed || 0,
        totalGamesCount: gameStats[0]?.totalGames || 0,
        adminBreakdown: adminStatsFormatted,
        dailyStats: dailyStats,
        activePlayers: activeCount,
        activePlayersFormatted: formatUserCount(activeCount),
        totalRegistered: registeredCount,
        totalRegisteredFormatted: formatUserCount(registeredCount)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/broadcast', checkAdminAuth, async (req, res) => {
  if (req.adminRole !== 'SUPER') {
    return res.status(403).json({ success: false, message: "የተከለከለ ሕልክ!" });
  }
  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, message: "መልእክት አልተጻፈም!" });
  try {
    const users = await User.find({}, 'userId');
    let sentCount = 0;
    for (const u of users) {
      if (bot) {
        try {
          await bot.api.sendMessage(u.userId, `📢 *ማስታወቂያ ከFetan Lottery*\n\n${message}`, { parse_mode: 'Markdown' });
          sentCount++;
        } catch (err) {}
      }
    }
    res.json({ success: true, message: `መልእክቱ ለ ${sentCount} ተጠቃሚዎች ተልጓል!` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/user/register', async (req, res) => {
  const { userId, firstName, username, referrerId, phone } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: "User ID አልተሰጠም" });
  const uid = String(userId);
  const existingInDb = await User.findOne({ userId: uid });
  const isNewUser = !existingInDb;
  const user = await getOrInitUser(uid, firstName, username, phone);

  if (isNewUser && referrerId && String(referrerId) !== uid) {
    const refUid = String(referrerId);
    const refUser = await getOrInitUser(refUid);
    if (refUser) {
      refUser.totalInvite += 1;
      refUser.invitedCount += 1;
      if (refUser.invitedCount >= 20 && !refUser.hasReceivedInviteBonus) {
        refUser.mainWallet += 100;
        refUser.hasReceivedInviteBonus = true;
        if (bot) {
          try {
            await bot.api.sendMessage(
              refUid,
              `🎉 *እንኳን ደስ አለዎት!*\n\n20 ሰዎችን በመጋበዝ *100 ETB* ወደ ዋናው አካውንትዎ ገብቷ!`,
              { parse_mode: 'Markdown' }
            );
          } catch (err) {}
        }
      } else {
        if (bot) {
          try {
            await bot.api.sendMessage(
              refUid,
              `👤 *አዲስ ሰው ተጋብዟል!*\n\n${firstName || 'አዲስ አባል'} ሊንክዎን ተጠቅሞ ገብቷል (አጠቃላይ የተጋበዙ: ${refUser.invitedCount}/20)`,
              { parse_mode: 'Markdown' }
            );
          } catch (err) {}
        }
      }
      await refUser.save();
      await notifyUserBalanceUpdate(refUid);
    }
  }
  res.json({ success: true, isNew: isNewUser, user });
});

app.post('/api/withdraw-request', async (req, res) => {
  const { userId, userName, amount, phone } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID አልተገኘም!" });
  }
  const uid = String(userId);
  const subAmount = Number(amount);
  if (!subAmount || subAmount <= 0) {
    return res.status(400).json({ success: false, message: "እባክዎ ትክክለኛ መጠን ይሙሉ!" });
  }
  try {
    let user = await getOrInitUser(uid, userName, '', phone);
    if (user.isBanned) {
      return res.status(400).json({ success: false, message: "አካውንትዎ የታገደ ነው!" });
    }
    if (user.mainWallet < subAmount) {
      return res.status(400).json({ success: false, message: "በቂ ሂሳብ የለዎትም (በ Main Wallet ውስጥ የሚቀንስ ገንዘብ የለም)!" });
    }
    const updatedUser = await User.findOneAndUpdate(
      { userId: uid, isBanned: false, mainWallet: { $gte: subAmount } },
      { $inc: { mainWallet: -subAmount } },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(400).json({ success: false, message: "በቂ ሂሳብ የለዎትም ወይም አካውንትዎ የታገደ ነው!" });
    }
    await notifyUserBalanceUpdate(uid);
    const tx = await Transaction.create({
      userId: uid,
      userName: userName || updatedUser.username || `User_${uid}`,
      type: 'withdrawal',
      amount: subAmount,
      phone: phone || updatedUser.phone,
      status: 'PENDING'
    });
    if (bot && ADMIN_GROUP_ID) {
      try {
        const keyboard = new InlineKeyboard()
          .text('✅ Approve', `wit_approve:${tx._id}`)
          .text('❌ Reject', `wit_reject:${tx._id}`);
        const msgText = `🔔 <b>አዲስ የውጭ (Withdrawal) ጥያቄ!</b>\n\n` +
          `• *User:* @${updatedUser.username || 'N/A'} (ID: \`${uid}\`)\n` +
          `• *Amount:* ${subAmount} ETB\n` +
          `• *Phone:* ${phone || updatedUser.phone || 'N/A'}`;
        const sentMsg = await bot.api.sendMessage(ADMIN_GROUP_ID, msgText, {
          parse_mode: 'Markdown',
          disable_notification: false,
          reply_markup: keyboard
        });
        tx.telegramMessageId = sentMsg.message_id;
        await tx.save();
      } catch (err) {
        console.error('Withdrawal admin telegram error:', err.message);
      }
    }
    res.json({ success: true, balance: updatedUser.mainWallet, message: "የውጭ ጥያቄዎ ተመዝግቧልና አስተዳዳሪ ማረጋገጫ ይሰጥብዎታል" });
  } catch (err) {
    console.error("Withdrawal Error:", err);
    res.status(500).json({ success: false, message: "የውጭ ጥያቄውን በሚያደርጉበት ጊዜ ስህተት ተፈጥሯል!" });
  }
});

app.get('/api/user', async (req, res) => {
  const id = req.query.id || req.query.userId;
  const uid = String(id);
  if (uid && uid !== 'GUEST_USER' && uid !== 'undefined') {
    const user = await getOrInitUser(uid);
    const history = await GameHistory.find({ winnerUserId: uid }).sort({ createdAt: -1 }).limit(10);
    const settings = await getSettings();
    return res.json({ ...user.toObject(), history, ticketPrice: settings.ticketPrice });
  }
  const settings = await getSettings();
  res.json({
    mainWallet: 0,
    playWallet: 0,
    gamesWon: 0,
    totalInvite: 0,
    invitedCount: 0,
    totalGames: 0,
    phone: "",
    isBanned: false,
    history: [],
    ticketPrice: settings.ticketPrice
  });
});

setInterval(() => {
  const backendPingUrl = RENDER_URL || 'https://fetan-lottery-backend.onrender.com';
  https.get(backendPingUrl, (res) => {}).on('error', (err) => {});
}, 10 * 60 * 1000);

// --- Fully Independent Game Loops for ALL Stakes (10, 20, 50, 100) ---
[10, 20, 50, 100].forEach(stake => {
  const numericStake = Number(stake);
  setInterval(async () => {
    const state = gameStates[numericStake];
    if (state.gamePhase === 'selecting') {
      state.timeLeft--;
      io.emit('timer_tick', {
        stake: numericStake,
        timeLeft: state.timeLeft,
        gamePhase: state.gamePhase,
        gameId: state.currentGameId
      });

      if (state.timeLeft <= 0) {
        state.gamePhase = 'spinning';
        const stats = await getGameStats(numericStake);
        const settings = await getSettings();
        let winNum = 'NONE';
        let winnerUser = null;

        if (state.selectedNumbers.length > 0) {
          const manualKey = `manualWinningNumber${numericStake}`;
          let activeManualWin = settings[manualKey] !== null ? settings[manualKey] : (numericStake === 10 ? null : settings.manualWinningNumber);
          if (activeManualWin !== null && activeManualWin !== undefined) {
            winNum = activeManualWin;
            settings[manualKey] = null;
            if (numericStake !== 10) settings.manualWinningNumber = null;
            await settings.save();
            cachedSettings = settings;
          } else {
            const randomIndex = Math.floor(Math.random() * state.selectedNumbers.length);
            winNum = state.selectedNumbers[randomIndex].number;
          }
          state.winningNumber = winNum;
          const winItem = state.selectedNumbers.find(n => Number(n.number) === Number(winNum));
          if (winItem) {
            winnerUser = winItem;
            await User.updateOne({ userId: String(winItem.userId) }, { $inc: { mainWallet: stats.derash, gamesWon: 1 } });
            await notifyUserBalanceUpdate(String(winItem.userId));
            await GameHistory.create({
              gameId: state.currentGameId,
              winningNumber: winNum,
              winnerUserId: String(winItem.userId),
              winnerName: winItem.userName,
              totalCollected: stats.totalCollected,
              derash: stats.derash,
              houseProfit: stats.houseProfit,
              playersCount: stats.totalPlayers,
              stake: numericStake
            });
            await updateDailyStats(0, 0, stats.houseProfit, 1);
          }
        } else {
          state.winningNumber = 'NONE';
        }

        const nextGameId = generateGameId(numericStake);
        io.emit('game_result', {
          stake: numericStake,
          winningNumber: winNum,
          selectedNumbers: state.selectedNumbers,
          derash: stats.derash,
          gameId: state.currentGameId,
          nextGameId: nextGameId,
          winnerName: winnerUser ? winnerUser.userName : null,
          winnerUserId: winnerUser ? winnerUser.userId : null
        });

        // Play 10 እና Play 20 ሁለቱም 60 ሰከንድ እንዲኖራቸው ተደረገ (Play 20 ታይመር በትክክል ከ Play 10 ጋር ይመሳሰላል)
        const resetTime = numericStake === 10 ? 60 : numericStake === 20 ? 60 : numericStake === 50 ? 300 : 305;
        setTimeout(() => {
          state.selectedNumbers = [];
          state.timeLeft = resetTime;
          state.gamePhase = 'selecting';
          state.winningNumber = '?';
          state.currentGameId = nextGameId;
          io.emit('reset_game', {
            stake: numericStake,
            timeLeft: resetTime,
            gamePhase: 'selecting',
            gameId: state.currentGameId
          });
        }, 10000);
      }
    }
  }, 1000);
});

io.on('connection', async (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId && userId !== 'GUEST_USER') {
    getOrInitUser(userId).catch(() => {});
    activeUsersMap.set(socket.id, String(userId));
  }

  const activeCount = new Set(activeUsersMap.values()).size;
  const registeredCount = registeredUsersSet.size;

  const stats10 = await getGameStats(10);
  const stats20 = await getGameStats(20);
  const stats50 = await getGameStats(50);
  const stats100 = await getGameStats(100);
  const settings = await getSettings();

  socket.emit('init_state', {
    stake10: { gameId: gameStates[10].currentGameId, selectedNumbers: gameStates[10].selectedNumbers, timeLeft: gameStates[10].timeLeft, gamePhase: gameStates[10].gamePhase, winningNumber: gameStates[10].winningNumber, totalPlayers: stats10.totalPlayers, derash: stats10.derash },
    stake20: { gameId: gameStates[20].currentGameId, selectedNumbers: gameStates[20].selectedNumbers, timeLeft: gameStates[20].timeLeft, gamePhase: gameStates[20].gamePhase, winningNumber: gameStates[20].winningNumber, totalPlayers: stats20.totalPlayers, derash: stats20.derash },
    stake50: { gameId: gameStates[50].currentGameId, selectedNumbers: gameStates[50].selectedNumbers, timeLeft: gameStates[50].timeLeft, gamePhase: gameStates[50].gamePhase, winningNumber: gameStates[50].winningNumber, totalPlayers: stats50.totalPlayers, derash: stats50.derash },
    stake100: { gameId: gameStates[100].currentGameId, selectedNumbers: gameStates[100].selectedNumbers, timeLeft: gameStates[100].timeLeft, gamePhase: gameStates[100].gamePhase, winningNumber: gameStates[100].winningNumber, totalPlayers: stats100.totalPlayers, derash: stats100.derash },
    ticketPrice: settings.ticketPrice
  });

  io.emit('stats_updated', {
    activePlayers: activeCount,
    activePlayersFormatted: formatUserCount(activeCount),
    totalRegistered: registeredCount,
    totalRegisteredFormatted: formatUserCount(registeredCount)
  });

  socket.on('select_number', async (data) => {
    const stake = Number(data.stake) || 10;
    const state = gameStates[stake];
    if (!state || state.gamePhase !== 'selecting') return;

    const { numbersChosen, numberChosen, userId, userName } = data;
    const uid = String(userId);
    let chosenList = [];
    if (Array.isArray(numbersChosen)) {
      chosenList = numbersChosen;
    } else if (numberChosen !== undefined) {
      chosenList = [numberChosen];
    } else {
      return;
    }
    if (chosenList.length === 0) return;

    const currentSelectedSet = new Set(state.selectedNumbers.map(n => Number(n.number)));
    const uniqueNewNumbers = chosenList.filter(num => !currentSelectedSet.has(Number(num)));
    if (uniqueNewNumbers.length === 0) return;

    const userDoc = await User.findOne({ userId: uid });
    if (!userDoc || userDoc.isBanned) {
      socket.emit('error_message', { message: 'አካውንትዎ ስለታገደ ቁጥር መምረጥ አይችሉም!' });
      return;
    }

    const TOTAL_COST = stake * uniqueNewNumbers.length;
    if ((userDoc.mainWallet + userDoc.playWallet) < TOTAL_COST) {
      socket.emit('error_message', { message: 'በቂ ሂሳብ የለዎትም! እባክዎ አካውንትዎን ይሙሉ::' });
      return;
    }

    let updatedUser = null;
    let usedWalletType = 'play';
    if (userDoc.playWallet >= TOTAL_COST) {
      updatedUser = await User.findOneAndUpdate(
        { userId: uid, playWallet: { $gte: TOTAL_COST } },
        { $inc: { playWallet: -TOTAL_COST } },
        { new: true }
      );
      usedWalletType = 'play';
    } else if (userDoc.playWallet > 0) {
      const remainingFromMain = TOTAL_COST - userDoc.playWallet;
      updatedUser = await User.findOneAndUpdate(
        { userId: uid, playWallet: userDoc.playWallet, mainWallet: { $gte: remainingFromMain } },
        { $set: { playWallet: 0 }, $inc: { mainWallet: -remainingFromMain } },
        { new: true }
      );
      usedWalletType = 'mixed';
    } else {
      updatedUser = await User.findOneAndUpdate(
        { userId: uid, mainWallet: { $gte: TOTAL_COST } },
        { $inc: { mainWallet: -TOTAL_COST } },
        { new: true }
      );
      usedWalletType = 'main';
    }

    if (!updatedUser) {
      socket.emit('error_message', { message: 'በቂ ሂሳብ የለዎትም!' });
      return;
    }

    uniqueNewNumbers.forEach(num => {
      state.selectedNumbers.push({
        number: Number(num),
        userId: uid,
        userName: userName || `ተጫዋቾች_${uid}`,
        walletUsed: usedWalletType,
        costPerNumber: stake
      });
    });

    broadcastBoard(stake);
    socket.emit('balance_updated', {
      balance: updatedUser.mainWallet,
      playWallet: updatedUser.playWallet
    });
  });

  socket.on('deselect_number', async (data) => {
    const stake = Number(data.stake) || 10;
    const state = gameStates[stake];
    if (!state || state.gamePhase !== 'selecting') return;

    const { numberChosen, userId } = data;
    const uid = String(userId);
    const index = state.selectedNumbers.findIndex(n => Number(n.number) === Number(numberChosen) && String(n.userId) === uid);
    if (index !== -1) {
      const removedItem = state.selectedNumbers[index];
      state.selectedNumbers.splice(index, 1);
      let updateQuery = { $inc: { mainWallet: stake } };
      if (removedItem.walletUsed === 'play') {
        updateQuery = { $inc: { playWallet: stake } };
      }
      const updatedUser = await User.findOneAndUpdate(
        { userId: uid },
        updateQuery,
        { new: true }
      );
      broadcastBoard(stake);
      if (updatedUser) {
        socket.emit('balance_user', {
          balance: updatedUser.mainWallet,
          playWallet: updatedUser.playWallet
        });
      }
    }
  });

  socket.on('disconnect', () => {
    activeUsersMap.delete(socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});