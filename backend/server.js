import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import https from 'https';
import mongoose from 'mongoose';
import { bot } from './bot.js';
import { webhookCallback, InlineKeyboard } from 'grammy';
import { telebirrRoutes } from './telebirr/routes.js';

const WEB_APP_URL = process.env.WEB_APP_URL || "https://fetan-lottery.vercel.app";
const SUPER_ADMIN_ID = process.env.SUPER_ADMIN_ID || process.env.ADMIN_ID || "494653076";
const ADMIN_GROUP_ID = process.env.ADMIN_GROUP_ID || "-1003928734889";

const app = express();
app.use(cors());
app.use(express.json());

// --- MONGODB CONNECTION WITH ADVANCED POOLING ---
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI, {
    maxPoolSize: 100,
    minPoolSize: 20,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000,
  })
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas successfully!');
    await hydrateLiveGames();
  })
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
  pastedText: { type: String, default: '' }, // only used by the manual SMS-paste flow
  transactionId: { type: String, default: null, index: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED', 'FAILED'], default: 'PENDING' },
  method: { type: String, enum: ['MANUAL_SMS', 'TELEBIRR_AUTO'], default: 'MANUAL_SMS' },
  prepayId: { type: String, default: null }, // Telebirr order id, for the auto flow
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
  manualWinningNumber100: { type: Number, default: null }
}, { timestamps: true });

const liveGameSchema = new mongoose.Schema({
  stake: { type: Number, required: true, unique: true },
  currentGameId: { type: String, required: true },
  selectedNumbers: { type: Array, default: [] },
  gamePhase: { type: String, default: 'selecting' },
  winningNumber: { type: mongoose.Schema.Types.Mixed, default: '?' },
  lastDrawKey: { type: String, default: null }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Deposit = mongoose.model('Deposit', depositSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const GameHistory = mongoose.model('GameHistory', gameHistorySchema);
const DailyStat = mongoose.model('DailyStat', dailyStatSchema);
const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
const LiveGame = mongoose.model('LiveGame', liveGameSchema);

app.get('/', (req, res) => {
  res.send('Fetan Lottery Backend is running live 🚀');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
  perMessageDeflate: { threshold: 1024 }
});

function generateGameId(stake) {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `FL-${stake}-${randomNum}`;
}

// Ethiopian evening 12:00 = 18:00 EAT (UTC+3). Play 50 at 18:00, Play 100 at 18:05 Saturday.
const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;
const WEEKLY_DRAW_HOUR_EAT = 18;
const WEEKLY_DRAW_WINDOW_MS = 60 * 1000;

function getWeeklyTargetUtc(eatHour, eatMinute, fromMs = Date.now()) {
  const eatDate = new Date(fromMs + EAT_OFFSET_MS);
  const y = eatDate.getUTCFullYear();
  const mo = eatDate.getUTCMonth();
  const dayDate = eatDate.getUTCDate();
  const dow = eatDate.getUTCDay();
  const addDays = (6 - dow + 7) % 7;
  const thisWeekEatUtcFields = Date.UTC(y, mo, dayDate + addDays, eatHour, eatMinute, 0, 0);
  return thisWeekEatUtcFields - EAT_OFFSET_MS;
}

function getWeeklyDrawKey(stake, eatHour, eatMinute, fromMs = Date.now()) {
  const targetUtc = getWeeklyTargetUtc(eatHour, eatMinute, fromMs);
  const eat = new Date(targetUtc + EAT_OFFSET_MS);
  const y = eat.getUTCFullYear();
  const m = String(eat.getUTCMonth() + 1).padStart(2, '0');
  const d = String(eat.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}-${stake}`;
}

function getSecondsUntilWeeklyDraw(eatHour, eatMinute, lastDrawKey, stake) {
  const now = Date.now();
  let targetUtc = getWeeklyTargetUtc(eatHour, eatMinute, now);
  const weekKey = getWeeklyDrawKey(stake, eatHour, eatMinute, now);
  if (now >= targetUtc + WEEKLY_DRAW_WINDOW_MS || lastDrawKey === weekKey) {
    targetUtc += 7 * 24 * 60 * 60 * 1000;
  }
  return Math.max(0, Math.floor((targetUtc - now) / 1000));
}

function getWeeklyDrawMinute(stake) {
  return stake === 50 ? 0 : 5;
}

// --- Completely Independent Game States for all stakes (10, 20, 50, 100) ---
const gameStates = {
  10: { currentGameId: generateGameId(10), selectedNumbers: [], timeLeft: 50, gamePhase: 'selecting', winningNumber: '?', boardUpdateTimeout: null, processing: false, lastDrawKey: null },
  20: { currentGameId: generateGameId(20), selectedNumbers: [], timeLeft: 50, gamePhase: 'selecting', winningNumber: '?', boardUpdateTimeout: null, processing: false, lastDrawKey: null },
  50: { currentGameId: generateGameId(50), selectedNumbers: [], timeLeft: 0, gamePhase: 'selecting', winningNumber: '?', boardUpdateTimeout: null, isWeekly: true, processing: false, lastDrawKey: null },
  100: { currentGameId: generateGameId(100), selectedNumbers: [], timeLeft: 0, gamePhase: 'selecting', winningNumber: '?', boardUpdateTimeout: null, isWeekly: true, processing: false, lastDrawKey: null }
};

async function persistLiveGame(stake) {
  const state = gameStates[stake];
  if (!state) return;
  try {
    await LiveGame.findOneAndUpdate(
      { stake: Number(stake) },
      {
        stake: Number(stake),
        currentGameId: state.currentGameId,
        selectedNumbers: state.selectedNumbers,
        gamePhase: state.gamePhase === 'spinning' ? 'selecting' : state.gamePhase,
        winningNumber: state.winningNumber,
        lastDrawKey: state.lastDrawKey || null
      },
      { upsert: true }
    );
  } catch (err) {
    console.error('LiveGame persist error:', err.message);
  }
}

async function hydrateLiveGames() {
  try {
    const saved = await LiveGame.find({ stake: { $in: [10, 20, 50, 100] } });
    saved.forEach((doc) => {
      const state = gameStates[doc.stake];
      if (!state) return;
      if (Array.isArray(doc.selectedNumbers)) state.selectedNumbers = doc.selectedNumbers;
      if (doc.currentGameId) state.currentGameId = doc.currentGameId;
      if (doc.lastDrawKey) state.lastDrawKey = doc.lastDrawKey;
      state.gamePhase = 'selecting';
      state.winningNumber = '?';
      if (!state.isWeekly) state.timeLeft = 50;
    });
    console.log('✅ Live game states restored from MongoDB');
  } catch (err) {
    console.error('LiveGame hydrate error:', err.message);
  }
}

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
      manualWinningNumber100: null
    });
  }
  cachedSettings = settings;
  lastSettingsFetch = now;
  return settings;
}

function broadcastBoard(stake) {
  const state = gameStates[stake];
  if (!state) return;
  if (state.boardUpdateTimeout) return;
  state.boardUpdateTimeout = setTimeout(async () => {
    state.boardUpdateTimeout = null;
    const uniquePlayers = new Set(state.selectedNumbers.map(n => String(n.userId))).size;
    const settings = await getSettings();
    const totalCollected = state.selectedNumbers.length * stake;
    const derash = Math.floor(totalCollected * (settings.winnerPercentage / 100));
    io.emit('board_updated', {
      stake: Number(stake),
      selectedNumbers: state.selectedNumbers,
      totalPlayers: uniquePlayers,
      derash,
      ticketPrice: stake
    });
  }, 20);
}

const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
if (process.env.NODE_ENV === 'production' && RENDER_URL && bot) {
  app.use('/webhook', webhookCallback(bot, 'express'));

  // Re-register the webhook with Telegram every time the server boots.
  // This matters whenever TELEGRAM_BOT_TOKEN is rotated/changed: Telegram routes
  // updates based on whichever webhook URL was last registered for a token. If the
  // token changes but setWebhook is never called again, this server keeps replying
  // with the NEW token to chats that only ever talked to the OLD bot/token — which
  // Telegram rejects with "400: Bad Request: chat not found".
  bot.api.setWebhook(`${RENDER_URL}/webhook`)
    .then(() => console.log(`✅ Webhook registered: ${RENDER_URL}/webhook`))
    .catch((err) => console.error('❌ setWebhook failed:', err));
}

// Safety net: never let a single failed Telegram API call (e.g. a blocked/invalid
// chat) crash and restart the whole server for every user. Log it and keep running.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection (ignored, server keeps running):', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception (ignored, server keeps running):', err);
});

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
  if (adminKey === SUPER_ADMIN_ID) {
    req.adminRole = 'SUPER';
    return next();
  }
  return res.status(403).json({ success: false, message: "ባለልዩ ፈቃድ ስልጣን አይደለም ወይም አስተዳዳሪ አይደለም!" });
}

function formatUserCount(num) {
  if (num >= 10000) return Math.floor(num / 1000) * 1000 + '+';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

async function getGameStats(stake) {
  const state = gameStates[stake];
  const settings = await getSettings();
  const winnerPct = settings.winnerPercentage / 100;
  const uniquePlayers = new Set(state.selectedNumbers.map(n => String(n.userId))).size;
  const totalCollected = state.selectedNumbers.length * stake;
  const derash = Math.floor(totalCollected * winnerPct);
  const houseProfit = totalCollected - derash;
  return { totalPlayers: uniquePlayers, totalCollected, derash, houseProfit, stake };
}

function snapshotStake(stake) {
  const state = gameStates[stake];
  return {
    gameId: state.currentGameId,
    selectedNumbers: state.selectedNumbers,
    timeLeft: state.timeLeft,
    gamePhase: state.gamePhase,
    winningNumber: state.winningNumber,
    isWeekly: !!state.isWeekly
  };
}

async function runDraw(stake) {
  const state = gameStates[stake];
  if (!state || state.processing) return;
  state.processing = true;
  state.gamePhase = 'spinning';

  const stats = await getGameStats(stake);
  const settings = await getSettings();
  let winNum = 'NONE';
  let winnerUser = null;

  if (state.selectedNumbers.length > 0) {
    const manualKey = `manualWinningNumber${stake}`;
    let activeManualWin = settings[manualKey] !== null && settings[manualKey] !== undefined
      ? settings[manualKey]
      : (stake === 20 ? settings.manualWinningNumber : null);
    if (activeManualWin !== null && activeManualWin !== undefined) {
      const exists = state.selectedNumbers.some(n => Number(n.number) === Number(activeManualWin));
      winNum = exists ? activeManualWin : state.selectedNumbers[Math.floor(Math.random() * state.selectedNumbers.length)].number;
      settings[manualKey] = null;
      if (stake === 20) settings.manualWinningNumber = null;
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
      await User.updateOne({ userId: String(winItem.userId) }, { $inc: { mainWallet: stats.derash, gamesWon: 1, totalGames: 1 } });
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
        stake: stake
      });
      await updateDailyStats(0, 0, stats.houseProfit, 1);
    }
  } else {
    state.winningNumber = 'NONE';
  }

  const nextGameId = generateGameId(stake);
  io.emit('game_result', {
    stake: Number(stake),
    ticketPrice: Number(stake),
    winningNumber: winNum,
    selectedNumbers: state.selectedNumbers,
    derash: stats.derash,
    gameId: state.currentGameId,
    nextGameId: nextGameId,
    winnerName: winnerUser ? winnerUser.userName : null,
    winnerUserId: winnerUser ? winnerUser.userId : null
  });

  const resetDelay = state.isWeekly ? 15000 : 10000;
  setTimeout(async () => {
    state.selectedNumbers = [];
    state.gamePhase = 'selecting';
    state.winningNumber = '?';
    state.currentGameId = nextGameId;
    state.processing = false;
    if (state.isWeekly) {
      const minute = getWeeklyDrawMinute(stake);
      state.timeLeft = getSecondsUntilWeeklyDraw(WEEKLY_DRAW_HOUR_EAT, minute, state.lastDrawKey, stake);
    } else {
      state.timeLeft = 50;
    }
    io.emit('reset_game', {
      stake: Number(stake),
      ticketPrice: Number(stake),
      timeLeft: state.timeLeft,
      gamePhase: 'selecting',
      gameId: state.currentGameId,
      isWeekly: !!state.isWeekly
    });
    await persistLiveGame(stake);
  }, resetDelay);
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
        await bot.api.sendMessage(uid, `🎉 *እንኳን ደህና መጡ!*\n\nስልክ ቁጥርዎን በመመዝገብ *20 ETB* በ Play Walletዎ ላይ ተሰጥوታል!`, { parse_mode: 'Markdown' });
      } catch (err) {}
    }
  } else if (phone && !dbUser.phoneBonusReceived) {
    dbUser.phone = phone;
    dbUser.playWallet += 20;
    dbUser.phoneBonusReceived = true;
    await dbUser.save();
    if (bot) {
      try {
        await bot.api.sendMessage(uid, `🎉 *እንኳን ደህና መጡ!*\n\nስልክ ቁጥርዎን በመመዝገብ *20 ETB* በ Play Walletዎ ላይ ተሰጥوታል!`, { parse_mode: 'Markdown' });
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
      io.to(socketId).emit('balance_updated', { balance: updatedUser.mainWallet, playWallet: updatedUser.playWallet });
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
        return ctx.answerCallbackQuery({ text: `⚠️ ይህ ጥያቄ አስቀድሞ ${deposit.status} ሆኗል!`, show_alert: true });
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
            `✅ *ሂሳብዎ ተረጋገጠ!*\n\n💰 *${deposit.amount} ETB* ወደ አካውንትዎ ገብቷል።`,
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
        return ctx.answerCallbackQuery({ text: '❌ የውል ጥያቄው አልተገኘም!', show_alert: true });
      }
      if (tx.status !== 'PENDING') {
        return ctx.answerCallbackQuery({ text: `⚠️ ይህ ጥያቄ አስቀድሞ ${tx.status} ሆኗል!`, show_alert: true });
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
            `✅ *የውል ጥያቄዎ ፈጣን አግኝቷል!*\n\n💰 *${tx.amount} ETB* ወደ ስልክ ቁጥርዎ (${tx.phone}) ተልጓል።`,
            { parse_mode: 'Markdown' }
          );
        } catch (e) {}
        await ctx.editMessageText(
          `📤 *የውል (Withdrawal) ጥያቄ (✅ Approved by Admin: ${adminTgId})*\n\n` +
          `• *User:* @${user?.username || 'N/A'} (ID: \`${targetUid}\`)\n` +
          `• *Amount:* ${tx.amount} ETB\n` +
          `• *Phone:* \`${tx.phone}\``,
          { parse_mode: 'Markdown' }
        );
        ctx.answerCallbackQuery({ text: '✅ የውል ጥያቄው ተሰርቷል!' });
      } else if (action === 'wit_reject') {
        tx.status = 'REJECTED';
        tx.processedBy = adminTgId;
        await tx.save();
        await User.updateOne({ userId: targetUid }, { $inc: { mainWallet: tx.amount } });
        await notifyUserBalanceUpdate(targetUid);
        try {
          await bot.api.sendMessage(
            targetUid,
            `❌ *የውል ጥያቄዎ ውድቅ ተደርጓል!*\n\n🪙 *${tx.amount} ETB* ወደ ዋና አካውንትዎ ተመልሷል።`,
            { parse_mode: 'Markdown' }
          );
        } catch (e) {}
        await ctx.editMessageText(
          `📤 *የውል (Withdrawal) ጥያቄ (❌ Rejected by Admin: ${adminTgId})*\n\n` +
          `• *User:* @${user?.username || 'N/A'} (ID: \`${targetUid}\`)\n` +
          `• *Amount:* ${tx.amount} ETB\n` +
          `• *Phone:* \`${tx.phone}\``,
          { parse_mode: 'Markdown' }
        );
        ctx.answerCallbackQuery({ text: '❌ የውል ጥያቄው ውድቅ ተደርጓል እና ገንዘቡ ተመልሷል' });
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
    return res.status(400).json({ success: false, message: "እባክዎ ሁሉንም አስፈላጊ መረጃዎች ያስገቡ!" });
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
      return res.status(400).json({ success: false, message: "⚠️ አስቀድሞ የפתח የዲፖዚት ጥያቄ አለዎት።" });
    }
    const txnId = extractTransactionId(pastedText);
    if (!txnId) {
      return res.status(400).json({ success: false, message: "⚠️ ከተላከው SMS ውስጥ ትክክለኛ Transaction ID ማግኘት አልተቻለም።" });
    }
    const duplicateTxn = await Deposit.findOne({ transactionId: txnId, status: { $in: ['PENDING', 'APPROVED'] } });
    if (duplicateTxn) {
      return res.status(400).json({ success: false, message: "⚠️ ይህ ትራንዛክሽን ማረጋገጫ ቀድሞ ጠረጴዛ ላይ አለ!" });
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
        const sentMsg = await bot.api.sendMessage(ADMIN_GROUP_ID, msgText, { parse_mode: 'Markdown', disable_notification: false, reply_markup: keyboard });
        deposit.telegramMessageId = sentMsg.message_id;
        await deposit.save();
      } catch (err) {
        console.error('Admin telegram message error:', err.message);
      }
    }
    return res.json({ success: true, message: "ማረጋገጫዎ ተልክቷል፤ እባክዎ ትንሽ ደቂቃ ይጠብቁ" });
  } catch (err) {
    console.error("Deposit Processing Error:", err);
    res.status(500).json({ success: false, message: "የገንዘብ ማስታወቂያ ስህተት አጋጥሟል!" });
  }
};

app.post('/api/deposit', handleDepositRequest);
app.post('/api/deposit-request', handleDepositRequest);

// --- Telebirr Fabric Gateway automated deposit + webhook routes ---
// See ./telebirr/*.js. Kept as separate endpoints alongside the existing
// manual SMS-paste flow above, so you can roll this out gradually and
// keep the manual flow as a fallback while testing.
app.use('/api/telebirr', telebirrRoutes({ Deposit, User, notifyUserBalanceUpdate }));

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
    return res.status(403).json({ success: false, message: "ይህን ለማድረግ የሰርቨር አስተዳዳሪ ስልጣን ያስፈልጋል!" });
  }
  const { ticketPrice, winnerPercentage, manualWinningNumber, manualWinningNumber10, manualWinningNumber20, manualWinningNumber50, manualWinningNumber100 } = req.body;
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
    await settings.save();
    cachedSettings = settings;
    lastSettingsFetch = Date.now();
    io.emit('settings_updated', { ticketPrice: settings.ticketPrice, winnerPercentage: settings.winnerPercentage });
    res.json({ success: true, settings, message: "ቅንብሩ በሳካ ሁኔታ ተስተካክሏል!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/users', checkAdminAuth, async (req, res) => {
  if (req.adminRole !== 'SUPER') {
    return res.status(403).json({ success: false, message: "የተከለከለ ክልክ!" });
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
    return res.status(403).json({ success: false, message: "የተከለከለ ክልክ!" });
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
    return res.status(403).json({ success: false, message: "የተከለከለ ክልክ!" });
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
      if (!tx) return res.status(404).json({ success: false, message: "የውል ትራንዛክሽን አልተገኘም!" });
      if (tx.status !== 'PENDING') return res.status(400).json({ success: false, message: "ይህ ጥያቄ ቀድሞ ተሳልቷል!" });
      tx.status = action;
      tx.processedBy = adminKey;
      await tx.save();
      if (action === 'REJECTED') {
        await User.updateOne({ userId: String(tx.userId) }, { $inc: { mainWallet: tx.amount } });
        await notifyUserBalanceUpdate(String(tx.userId));
      } else if (action === 'APPROVED') {
        await updateDailyStats(0, tx.amount, 0, 0);
      }
      return res.json({ success: true, transaction: tx, message: `የውል ጥያቄው ${action} ሆኗ!` });
    } else {
      const deposit = await Deposit.findById(txId);
      if (!deposit) return res.status(404).json({ success: false, message: "ትራንዛክሽን አልተገኘም!" });
      if (deposit.status !== 'PENDING') return res.status(400).json({ success: false, message: "ይህ ጥያቄ ቀድሞ ተሳልቷል!" });
      deposit.status = action;
      deposit.processedBy = adminKey;
      await deposit.save();
      if (action === 'APPROVED') {
        await User.updateOne({ userId: String(deposit.userId) }, { $inc: { mainWallet: deposit.amount } });
        await updateDailyStats(deposit.amount, 0, 0, 0);
        await notifyUserBalanceUpdate(String(deposit.userId));
      }
      return res.json({ success: true, deposit, message: `የገባ ትራንዛክሽን ${action} ሆኗ!` });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/financial-stats', checkAdminAuth, async (req, res) => {
  if (req.adminRole !== 'SUPER') {
    return res.status(403).json({ success: false, message: "የተከለከለ ክልክ!" });
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

    const adminStatsFormatted = {
      superAdmin: { amount: 0, count: 0 },
      others: { amount: 0, count: 0 }
    };
    adminBreakdown.forEach(item => {
      if (item._id === SUPER_ADMIN_ID) adminStatsFormatted.superAdmin = { amount: item.totalAmount, count: item.count };
      else {
        adminStatsFormatted.others.amount += item.totalAmount;
        adminStatsFormatted.others.count += item.count;
      }
    });

    const dailyStats = await DailyStat.find().sort({ dateStr: -1 }).limit(10);
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
        dailyStats: dailyStats
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/broadcast', checkAdminAuth, async (req, res) => {
  if (req.adminRole !== 'SUPER') {
    return res.status(403).json({ success: false, message: "የተከለከለ ክልክ!" });
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
              `🎉 *እንኳን ደህና መጡ!*\n\n20 ሰዎችን በመጋበዝ *100 ETB* ወደ ዋናው አካውንትዎ ገብቷል!`,
              { parse_mode: 'Markdown' }
            );
          } catch (err) {}
        }
      } else {
        if (bot) {
          try {
            await bot.api.sendMessage(
              refUid,
              `👤 *አዲስ ሰው ተጋብዟል!*\n\n${firstName || 'አዲስ አባል'} ሊንክዎን ተጠቅሞ ገብቷል (ቀርቶ ያለው የተጋበዙ: ${refUser.invitedCount}/20)`,
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
    return res.status(400).json({ success: false, message: "እባክዎ ትክክለኛ መጠን ያስገቡ!" });
  }
  try {
    let user = await getOrInitUser(uid, userName, '', phone);
    if (user.isBanned) {
      return res.status(400).json({ success: false, message: "አካውንትዎ የታገደ ነው!" });
    }
    if (user.mainWallet < subAmount) {
      return res.status(400).json({ success: false, message: "በቂ ሰንዘ የለው (በ Main Wallet ውስጥ የሚበቃ ገንዘብ የለው)!" });
    }
    const updatedUser = await User.findOneAndUpdate(
      { userId: uid, isBanned: false, mainWallet: { $gte: subAmount } },
      { $inc: { mainWallet: -subAmount } },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(400).json({ success: false, message: "በቂ ሰንዘ የለው ወይም አካውንትዎ የታገደ ነው!" });
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
        const msgText = `🔔 <b>አዲስ የውል (Withdrawal) ጥያቄ!</b>\n\n` +
          `• *User:* @${updatedUser.username || 'N/A'} (ID: \`${uid}\`)\n` +
          `• *Amount:* ${subAmount} ETB\n` +
          `• *Phone:* ${phone || updatedUser.phone || 'N/A'}`;
        const sentMsg = await bot.api.sendMessage(ADMIN_GROUP_ID, msgText, { parse_mode: 'Markdown', disable_notification: false, reply_markup: keyboard });
        tx.telegramMessageId = sentMsg.message_id;
        await tx.save();
      } catch (err) {
        console.error('Withdrawal admin telegram error:', err.message);
      }
    }
    res.json({ success: true, balance: updatedUser.mainWallet, message: "የውል ጥያቄዎ ተመዝግቧል! አስተዳዳሪ አክብሮ ይከፍሎታል" });
  } catch (err) {
    console.error("Withdrawal Error:", err);
    res.status(500).json({ success: false, message: "የውል ጥያቄውን በሚያሟሉበት ጊዜ ስህተት ተፈጥሯል!" });
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

function refreshWeeklyCountdowns() {
  [50, 100].forEach((stake) => {
    const state = gameStates[stake];
    if (!state || state.gamePhase !== 'selecting') return;
    const minute = getWeeklyDrawMinute(stake);
    state.timeLeft = getSecondsUntilWeeklyDraw(WEEKLY_DRAW_HOUR_EAT, minute, state.lastDrawKey, stake);
  });
}

refreshWeeklyCountdowns();

// Independent loops: Play 10 and Play 20 each have their own 50s timer.
// Play 50 draws Saturday 18:00 EAT (ቅዳሜ ማታ 12:00). Play 100 draws Saturday 18:05 EAT.
[10, 20, 50, 100].forEach((stake) => {
  setInterval(async () => {
    const state = gameStates[stake];
    if (!state || state.processing) return;

    if (state.isWeekly) {
      if (state.gamePhase !== 'selecting') return;
      const minute = getWeeklyDrawMinute(stake);
      const weekKey = getWeeklyDrawKey(stake, WEEKLY_DRAW_HOUR_EAT, minute);
      const now = Date.now();
      const targetUtc = getWeeklyTargetUtc(WEEKLY_DRAW_HOUR_EAT, minute, now);
      const inDrawWindow = now >= targetUtc && now < targetUtc + WEEKLY_DRAW_WINDOW_MS && state.lastDrawKey !== weekKey;
      state.timeLeft = getSecondsUntilWeeklyDraw(WEEKLY_DRAW_HOUR_EAT, minute, state.lastDrawKey, stake);

      io.emit('timer_tick', {
        stake: Number(stake),
        ticketPrice: Number(stake),
        timeLeft: state.timeLeft,
        gamePhase: state.gamePhase,
        gameId: state.currentGameId,
        isWeekly: true
      });

      if (inDrawWindow) {
        state.lastDrawKey = weekKey;
        await persistLiveGame(stake);
        await runDraw(stake);
      }
      return;
    }

    if (state.gamePhase === 'selecting') {
      state.timeLeft--;
      io.emit('timer_tick', {
        stake: Number(stake),
        ticketPrice: Number(stake),
        timeLeft: state.timeLeft,
        gamePhase: state.gamePhase,
        gameId: state.currentGameId
      });
      if (state.timeLeft <= 0) {
        await runDraw(stake);
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

  refreshWeeklyCountdowns();
  const stats10 = await getGameStats(10);
  const stats20 = await getGameStats(20);
  const stats50 = await getGameStats(50);
  const stats100 = await getGameStats(100);
  const settings = await getSettings();

  socket.emit('init_state', {
    stake10: { ...snapshotStake(10), totalPlayers: stats10.totalPlayers, derash: stats10.derash },
    stake20: { ...snapshotStake(20), totalPlayers: stats20.totalPlayers, derash: stats20.derash },
    stake50: { ...snapshotStake(50), totalPlayers: stats50.totalPlayers, derash: stats50.derash },
    stake100: { ...snapshotStake(100), totalPlayers: stats100.totalPlayers, derash: stats100.derash },
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
      socket.emit('error_message', { message: 'በቂ ሰንዘ የለው! እባክዎ ሰንዘዎን ይሙሉ::' });
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
      socket.emit('error_message', { message: 'በቂ ሰንዘ የለው!' });
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
    persistLiveGame(stake);
    socket.emit('balance_updated', { balance: updatedUser.mainWallet, playWallet: updatedUser.playWallet });
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
      persistLiveGame(stake);
      if (updatedUser) {
        socket.emit('balance_updated', { balance: updatedUser.mainWallet, playWallet: updatedUser.playWallet });
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