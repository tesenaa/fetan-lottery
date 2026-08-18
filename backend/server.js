import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import https from 'https';
import mongoose from 'mongoose';
import { bot } from './bot.js';
import { webhookCallback, InlineKeyboard } from 'grammy';

const WEB_APP_URL = process.env.WEB_APP_URL || "https://fetan-lottery.vercel.app";
const ADMIN_ID = process.env.ADMIN_ID || "494653076";
const ADMIN_GROUP_ID = process.env.ADMIN_GROUP_ID || "-100234567890"; // የቴሌግራም አድሚን ግሩፕ/ቻናል ID

const app = express();
app.use(cors());
app.use(express.json());

// --- MONGODB CONNECTION ---
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
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
  mainWallet: { type: Number, default: 0, min: 0 },
  playWallet: { type: Number, default: 0, min: 0 },
  totalInvite: { type: Number, default: 0 },
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
  telegramMessageId: { type: Number, default: null } // የአድሚን ግሩፕ መልእክትን Update ለማድረግ
}, { timestamps: true });

const transactionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  userName: { type: String, default: '' },
  type: { type: String, enum: ['deposit', 'withdrawal'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  proof: { type: String, default: '' },
  phone: { type: String, default: '' }
}, { timestamps: true });

const gameHistorySchema = new mongoose.Schema({
  gameId: { type: String, required: true },
  winningNumber: { type: Number, required: true },
  winnerUserId: { type: String, required: true },
  winnerName: { type: String, default: '' },
  totalCollected: { type: Number, default: 0 },
  derash: { type: Number, default: 0 },
  houseProfit: { type: Number, default: 0 },
  playersCount: { type: Number, default: 0 }
}, { timestamps: true });

const systemSettingsSchema = new mongoose.Schema({
  ticketPrice: { type: Number, default: 10 },
  winnerPercentage: { type: Number, default: 80 }, 
  houseCommissionPercentage: { type: Number, default: 20 }, 
  manualWinningNumber: { type: Number, default: null } 
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Deposit = mongoose.model('Deposit', depositSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const GameHistory = mongoose.model('GameHistory', gameHistorySchema);
const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

app.get('/', (req, res) => {
  res.send('Fetan Lottery Backend is running live 🚀');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['polling', 'websocket']
});

let selectedNumbers = [];
let timeLeft = 50;
let gamePhase = 'selecting';
let winningNumber = null;

const registeredUsersSet = new Set();
const activeUsersMap = new Map();

const RENDER_URL = process.env.RENDER_EXTERNAL_URL;

if (process.env.NODE_ENV === 'production' && RENDER_URL) {
  app.use('/webhook', webhookCallback(bot, 'express'));
}

// --- HELPER FUNCTIONS ---
function extractTransactionId(text) {
  if (!text) return null;
  // Telebirr transaction ID pattern (e.g., Txn ID: CC12345678, or standalone 10+ character alphanumeric)
  const match = text.match(/(?:txn\s*id|transaction\s*id|ref\s*no)[\s:-]*([a-z0-9]+)/i) || text.match(/\b([A-Z0-9]{10,12})\b/);
  return match ? match[1].toUpperCase() : null;
}

async function getSettings() {
  let settings = await SystemSettings.findOne();
  if (!settings) {
    settings = await SystemSettings.create({
      ticketPrice: 10,
      winnerPercentage: 80,
      houseCommissionPercentage: 20,
      manualWinningNumber: null
    });
  }
  return settings;
}

function formatUserCount(num) {
  if (num >= 10000) return Math.floor(num / 1000) * 1000 + '+';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

async function getGameStats() {
  const settings = await getSettings();
  const stake = settings.ticketPrice;
  const winnerPct = settings.winnerPercentage / 100;

  const uniquePlayers = new Set(selectedNumbers.map(n => String(n.userId))).size;
  const totalCollected = selectedNumbers.length * stake;
  const derash = Math.floor(totalCollected * winnerPct);
  const houseProfit = totalCollected - derash;
  
  return { totalPlayers: uniquePlayers, totalCollected, derash, houseProfit, stake };
}

async function getOrInitUser(userId, firstName = '', username = '', phone = '') {
  const uid = String(userId);
  let dbUser = await User.findOne({ userId: uid });
  
  if (!dbUser) {
    dbUser = await User.create({
      userId: uid,
      firstName: firstName || '',
      username: username || '',
      phone: phone || '',
      mainWallet: 0,
      playWallet: 0,
      totalInvite: 0,
      gamesWon: 0,
      totalGames: 0,
      isBanned: false
    });
  } else if (phone && !dbUser.phone) {
    dbUser.phone = phone;
    await dbUser.save();
  }

  registeredUsersSet.add(uid);
  return dbUser;
}

// --- TELEGRAM BOT INLINE BUTTON ACTION HANDLERS (APPROVE / REJECT) ---
if (bot) {
  bot.callbackQuery(/^(dep_approve|dep_reject):(.+)$/, async (ctx) => {
    const action = ctx.match[1];
    const depositId = ctx.match[2];

    try {
      const deposit = await Deposit.findById(depositId);
      if (!deposit) {
        return ctx.answerCallbackQuery({ text: '❌ ጥያቄው አልተገኘም!', show_alert: true });
      }

      if (deposit.status !== 'PENDING') {
        return ctx.answerCallbackQuery({ text: `⚠️ ይህ ጥያቄ አስቀድሞ ${deposit.status} ሆኗል!`, show_alert: true });
      }

      const user = await User.findOne({ userId: deposit.userId });

      if (action === 'dep_approve') {
        deposit.status = 'APPROVED';
        await deposit.save();

        if (user) {
          user.mainWallet += deposit.amount;
          await user.save();
        }

        // ኖቲፊኬሽን ለተጠቃሚው
        try {
          await bot.api.sendMessage(
            deposit.userId,
            `✅ *ክፍያዎ ተረጋግጧል!*\n\n💰 *${deposit.amount} ETB* ወደ አካውንትዎ ገቢ ሆኗል።`,
            { parse_mode: 'Markdown' }
          );
        } catch (e) {}

        // በአድሚን ግሩፕ ያለውን መልእክት መቀየር
        await ctx.editMessageText(
          `📥 *የዴፖዚት ጥያቄ (✅ Approved by Admin)*\n\n` +
          `• *User:* @${user?.username || 'N/A'} (ID: \`${deposit.userId}\`)\n` +
          `• *Amount:* ${deposit.amount} ETB\n` +
          `• *Txn ID:* \`${deposit.transactionId || 'N/A'}\`\n` +
          `• *Pasted SMS:*\n\`${deposit.pastedText}\``,
          { parse_mode: 'Markdown' }
        );

        ctx.answerCallbackQuery({ text: '✅ ጥያቄው ጸድቋል!' });

      } else if (action === 'dep_reject') {
        deposit.status = 'REJECTED';
        await deposit.save();

        // ኖቲፊኬሽን ለተጠቃሚው
        try {
          await bot.api.sendMessage(
            deposit.userId,
            `❌ *የተላከው የክፍያ ማረጋገጫ ውድቅ ተደርጓል!*`,
            { parse_mode: 'Markdown' }
          );
        } catch (e) {}

        // በአድሚን ግሩፕ ያለውን መልእክት መቀየር
        await ctx.editMessageText(
          `📥 *የዴፖዚት ጥያቄ (❌ Rejected by Admin)*\n\n` +
          `• *User:* @${user?.username || 'N/A'} (ID: \`${deposit.userId}\`)\n` +
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
}

// --- DEPOSIT REQUEST ENDPOINT WITH TELEGRAM NOTIFICATION ---
app.post('/api/deposit-request', async (req, res) => {
  const { userId, userName, amount, pastedText } = req.body;

  if (!userId || !amount || !pastedText) {
    return res.status(400).json({ success: false, message: "እባክዎን ሁሉንም አስፈላጊ መረጃዎች ያስገቡ!" });
  }

  const uid = String(userId);
  const depAmount = Number(amount);

  try {
    const user = await getOrInitUser(uid);
    if (user.isBanned) {
      return res.status(403).json({ success: false, message: "አካውንትዎ የታገደ ስለሆነ አገልግሎቱን ማግኘት አይችሉም!" });
    }

    // 1. Rate Limiting Check (Pending ጥያቄ ካለው ማገድ)
    const existingPending = await Deposit.findOne({ userId: uid, status: 'PENDING' });
    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: "⚠️ አስቀድሞ የቀረበ የዴፖዚት ጥያቄ አለዎት። እባክዎን አድሚኑ እስኪያፀድቀው ይታገሱ!"
      });
    }

    // 2. Transaction ID extraction & Duplicate check via Regex
    const txnId = extractTransactionId(pastedText);

    if (txnId) {
      const duplicateTxn = await Deposit.findOne({ transactionId: txnId });
      if (duplicateTxn) {
        return res.status(400).json({
          success: false,
          message: "⚠️ ይህ የትራንዛክሽን ማረጋገጫ (SMS) ቀደም ሲል ጥቅም ላይ ውሏል!"
        });
      }
    }

    // 3. Create Deposit Document in DB
    const deposit = await Deposit.create({
      userId: uid,
      userName: userName || user.username || `User_${uid}`,
      amount: depAmount,
      pastedText: pastedText,
      transactionId: txnId,
      status: 'PENDING'
    });

    // 4. Send Message to Admin Telegram Group with Inline Keyboard Buttons
    if (bot && ADMIN_GROUP_ID) {
      try {
        const keyboard = new InlineKeyboard()
          .text('✅ Approve', `dep_approve:${deposit._id}`)
          .text('❌ Reject', `dep_reject:${deposit._id}`);

        const msgText = 
          `📥 *አዲስ የዴፖዚት ጥያቄ*\n\n` +
          `• *User:* @${user.username || 'N/A'} (ID: \`${uid}\`)\n` +
          `• *Amount:* ${depAmount} ETB\n` +
          `• *Txn ID:* \`${txnId || 'ያልተለየ'}\`\n` +
          `• *Pasted SMS:*\n\`${pastedText}\``;

        const sentMsg = await bot.api.sendMessage(ADMIN_GROUP_ID, msgText, {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        });

        deposit.telegramMessageId = sentMsg.message_id;
        await deposit.save();
      } catch (err) {
        console.error('የአድሚን ኖቲፊኬሽን መላክ አልተቻለም:', err.message);
      }
    }

    return res.json({
      success: true,
      message: "ማረጋገጫዎ ደርሶናል፤ አድሚኑ አረጋግጦ እስኪያፀድቀው ድረስ ጥቂት ደቂቃ ይታገሱ"
    });

  } catch (err) {
    console.error("Deposit Processing Error:", err);
    res.status(500).json({ success: false, message: "የገንዘብ ማስገባት ስህተት አጋጥሟል!" });
  }
});

// --- ADMIN API ENDPOINTS ---
app.get('/api/admin/settings', async (req, res) => {
  const adminKey = req.headers['admin-key'];
  if (adminKey !== ADMIN_ID) return res.status(403).json({ success: false, message: "ባለስልጣን አይደሉም!" });

  try {
    const settings = await getSettings();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/settings', async (req, res) => {
  const adminKey = req.headers['admin-key'];
  if (adminKey !== ADMIN_ID) return res.status(403).json({ success: false, message: "ባለስልጣን አይደሉም!" });

  const { ticketPrice, winnerPercentage, manualWinningNumber } = req.body;

  try {
    let settings = await getSettings();
    if (ticketPrice !== undefined) settings.ticketPrice = Number(ticketPrice);
    if (winnerPercentage !== undefined) {
      settings.winnerPercentage = Number(winnerPercentage);
      settings.houseCommissionPercentage = 100 - Number(winnerPercentage);
    }
    if (manualWinningNumber !== undefined) {
      settings.manualWinningNumber = manualWinningNumber !== null ? Number(manualWinningNumber) : null;
    }
    await settings.save();
    res.json({ success: true, settings, message: "የሲስተም ሰቲንግ በተሳካ ሁኔታ ተስተካክሏል!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/users', async (req, res) => {
  const adminKey = req.headers['admin-key'];
  if (adminKey !== ADMIN_ID) return res.status(403).json({ success: false, message: "ባለስልጣን አይደሉም!" });

  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/toggle-ban', async (req, res) => {
  const adminKey = req.headers['admin-key'];
  if (adminKey !== ADMIN_ID) return res.status(403).json({ success: false, message: "ባለስልጣን አይደሉም!" });
  const { targetUserId, isBanned } = req.body;
  const uid = String(targetUserId);

  try {
    const updatedUser = await User.findOneAndUpdate(
      { userId: uid },
      { $set: { isBanned: Boolean(isBanned) } },
      { new: true }
    );
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/update-balance', async (req, res) => {
  const adminKey = req.headers['admin-key'];
  if (adminKey !== ADMIN_ID) return res.status(403).json({ success: false, message: "ባለስልጣን አይደሉም!" });
  const { targetUserId, mainWallet, playWallet } = req.body;
  const uid = String(targetUserId);

  try {
    const updatedUser = await User.findOneAndUpdate(
      { userId: uid },
      { $set: { mainWallet: Math.max(0, Number(mainWallet)), playWallet: Math.max(0, Number(playWallet)) } },
      { new: true }
    );
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/transactions', async (req, res) => {
  const adminKey = req.headers['admin-key'];
  if (adminKey !== ADMIN_ID) return res.status(403).json({ success: false, message: "ባለስልጣን አይደሉም!" });

  try {
    const deposits = await Deposit.find().sort({ createdAt: -1 });
    res.json({ success: true, transactions: deposits });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/financial-stats', async (req, res) => {
  const adminKey = req.headers['admin-key'];
  if (adminKey !== ADMIN_ID) return res.status(403).json({ success: false, message: "ባለስልጣን አይደሉም!" });

  try {
    const totalDeposits = await Deposit.aggregate([
      { $match: { status: 'APPROVED' } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const pendingDeposits = await Deposit.aggregate([
      { $match: { status: 'PENDING' } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]);

    const gameStats = await GameHistory.aggregate([
      { $group: { _id: null, totalProfit: { $sum: "$houseProfit" }, totalPlayed: { $sum: "$totalCollected" }, totalGames: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalDeposit: totalDeposits[0]?.total || 0,
        totalWithdrawal: 0,
        pendingDepositCount: pendingDeposits[0]?.count || 0,
        pendingDepositAmount: pendingDeposits[0]?.total || 0,
        pendingWithdrawalCount: 0,
        pendingWithdrawalAmount: 0,
        houseProfit: gameStats[0]?.totalProfit || 0,
        totalGamesPlayedAmount: gameStats[0]?.totalPlayed || 0,
        totalGamesCount: gameStats[0]?.totalGames || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/broadcast', async (req, res) => {
  const adminKey = req.headers['admin-key'];
  if (adminKey !== ADMIN_ID) return res.status(403).json({ success: false, message: "ባለስልጣን አይደሉም!" });

  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, message: "መልዕክት አልተጻፈም!" });

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

    res.json({ success: true, message: `መልዕክቱ ለ ${sentCount} ተጠቃሚዎች ተልኳል!` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- PUBLIC USER API ENDPOINTS ---
app.post('/api/user/register', async (req, res) => {
  const { userId, firstName, username, referrerId, phone } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: "User ID ያስፈልጋል።" });

  const uid = String(userId);
  const existingInDb = await User.findOne({ userId: uid });
  const isNewUser = !existingInDb;

  const user = await getOrInitUser(uid, firstName, username, phone);

  if (isNewUser && referrerId && String(referrerId) !== uid) {
    const refUid = String(referrerId);
    const refUser = await getOrInitUser(refUid);
    if (refUser) {
      await User.updateOne(
        { userId: refUid },
        { $inc: { totalInvite: 1, playWallet: 10 } }
      );

      if (bot) {
        try {
          await bot.api.sendMessage(
            refUid,
            `🎉 *እንኳን ደስ አለዎት!*\n\n${firstName || 'አዲስ አባል'} የእርስዎን መጋበዣ ሊንክ ተጠቅሞ ስለገባ *10 ETB* ቦነስ በ Play Walletዎ ላይ ተጨምሯል!`,
            { parse_mode: 'Markdown' }
          );
        } catch (err) {}
      }
    }
  }

  res.json({ success: true, isNew: isNewUser, user });
});

app.post('/api/withdraw-request', async (req, res) => {
  const { userId, userName, amount, phone } = req.body;
  const uid = String(userId);
  const subAmount = Number(amount);

  const updatedUser = await User.findOneAndUpdate(
    { userId: uid, isBanned: false, mainWallet: { $gte: subAmount } },
    { $inc: { mainWallet: -subAmount } },
    { new: true }
  );

  if (!updatedUser) {
    return res.status(400).json({ success: false, message: "በቂ ሂሳብ የለም ወይም አካውንትዎ የታገደ ነው!" });
  }

  await Transaction.create({
    userId: uid,
    userName: userName || `User_${uid}`,
    type: 'withdrawal',
    amount: subAmount,
    phone: phone || updatedUser.phone
  });

  res.json({ success: true, balance: updatedUser.mainWallet, message: "የወጪ ጥያቄዎ ተልኳል! በቅርቡ ይስተናገዳል።" });
});

app.get('/api/user', async (req, res) => {
  const id = req.query.id || req.query.userId;
  const uid = String(id);

  if (uid && uid !== 'GUEST_USER' && uid !== 'undefined') {
    const user = await getOrInitUser(uid);
    const history = await GameHistory.find({ winnerUserId: uid }).sort({ createdAt: -1 }).limit(10);
    return res.json({ ...user.toObject(), history });
  }

  res.json({
    mainWallet: 0,
    playWallet: 0,
    gamesWon: 0,
    totalInvite: 0,
    totalGames: 0,
    phone: "",
    isBanned: false,
    history: []
  });
});

setInterval(() => {
  const backendPingUrl = RENDER_URL || 'https://fetan-lottery-backend.onrender.com';
  https.get(backendPingUrl, (res) => {}).on('error', (err) => {});
}, 10 * 60 * 1000);

// --- SOCKET LOGIC ---
io.on('connection', async (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId && userId !== 'GUEST_USER') {
    await getOrInitUser(userId);
    activeUsersMap.set(socket.id, String(userId));
  }

  const activeCount = new Set(activeUsersMap.values()).size;
  const registeredCount = registeredUsersSet.size;

  const stats = await getGameStats();
  const settings = await getSettings();

  socket.emit('init_state', {
    selectedNumbers,
    timeLeft,
    gamePhase,
    winningNumber,
    totalPlayers: stats.totalPlayers,
    derash: stats.derash,
    ticketPrice: settings.ticketPrice
  });

  io.emit('stats_updated', {
    activePlayers: activeCount,
    activePlayersFormatted: formatUserCount(activeCount),
    totalRegistered: registeredCount,
    totalRegisteredFormatted: formatUserCount(registeredCount)
  });

  socket.on('select_number', async (data) => {
    if (gamePhase !== 'selecting') return;
    const { numberChosen, userId, userName } = data;
    const uid = String(userId);

    const exists = selectedNumbers.some(n => Number(n.number) === Number(numberChosen));
    if (exists) return;

    const userDoc = await User.findOne({ userId: uid });
    if (!userDoc || userDoc.isBanned) {
      socket.emit('error_message', { message: 'አካውንትዎ ስለታገደ መጫወት አይችሉም!' });
      return;
    }

    const settings = await getSettings();
    const STAKE = settings.ticketPrice;

    if ((userDoc.mainWallet + userDoc.playWallet) < STAKE) {
      socket.emit('error_message', { message: 'በቂ ሂሳብ የለም! እባክዎን አስቀድመው ሂሳብዎን ይሙሉ::' });
      return;
    }

    let updatedUser;
    if (userDoc.playWallet >= STAKE) {
      updatedUser = await User.findOneAndUpdate(
        { userId: uid, playWallet: { $gte: STAKE } },
        { $inc: { playWallet: -STAKE } },
        { new: true }
      );
    } else {
      const remaining = STAKE - userDoc.playWallet;
      updatedUser = await User.findOneAndUpdate(
        { userId: uid, mainWallet: { $gte: remaining } },
        { playWallet: 0, $inc: { mainWallet: -remaining } },
        { new: true }
      );
    }

    if (!updatedUser) {
      socket.emit('error_message', { message: 'ክፍያው አልተሳካም። እባክዎን ድጋሚ ይሞክሩ።' });
      return;
    }

    selectedNumbers.push({
      number: Number(numberChosen),
      userId: uid,
      userName: userName || `ተጫዋች_${uid}`
    });

    const s = await getGameStats();
    io.emit('board_updated', { selectedNumbers, totalPlayers: s.totalPlayers, derash: s.derash });
    socket.emit('balance_updated', { balance: updatedUser.mainWallet, playWallet: updatedUser.playWallet });
  });

  socket.on('deselect_number', async (data) => {
    if (gamePhase !== 'selecting') return;

    const { numberChosen, userId } = data;
    const uid = String(userId);

    const isSelected = selectedNumbers.some(
      n => Number(n.number) === Number(numberChosen) && String(n.userId) === uid
    );

    if (isSelected) {
      selectedNumbers = selectedNumbers.filter(
        n => !(Number(n.number) === Number(numberChosen) && String(n.userId) === uid)
      );

      const settings = await getSettings();
      const updatedUser = await User.findOneAndUpdate(
        { userId: uid },
        { $inc: { mainWallet: settings.ticketPrice } },
        { new: true }
      );

      const s = await getGameStats();
      io.emit('board_updated', { selectedNumbers, totalPlayers: s.totalPlayers, derash: s.derash });
      if (updatedUser) {
        socket.emit('balance_updated', { balance: updatedUser.mainWallet, playWallet: updatedUser.playWallet });
      }
    }
  });

  socket.on('disconnect', () => {
    activeUsersMap.delete(socket.id);
    const updatedActiveCount = new Set(activeUsersMap.values()).size;
    const currentRegisteredCount = registeredUsersSet.size;

    io.emit('stats_updated', {
      activePlayers: updatedActiveCount,
      activePlayersFormatted: formatUserCount(updatedActiveCount),
      totalRegistered: currentRegisteredCount,
      totalRegisteredFormatted: formatUserCount(currentRegisteredCount)
    });
  });
});

// --- TIMER & DRAW CONTROL LOGIC ---
setInterval(async () => {
  if (gamePhase === 'selecting') {
    if (timeLeft > 0) {
      timeLeft--;
    } else {
      if (selectedNumbers.length > 0) {
        gamePhase = 'spinning';
        const settings = await getSettings();
        
        let winner = null;
        
        if (settings.manualWinningNumber !== null) {
          const manualMatch = selectedNumbers.find(n => Number(n.number) === Number(settings.manualWinningNumber));
          if (manualMatch) {
            winner = manualMatch;
          }
        }

        if (!winner) {
          const randomIndex = Math.floor(Math.random() * selectedNumbers.length);
          winner = selectedNumbers[randomIndex];
        }

        winningNumber = winner.number;
        const stats = await getGameStats();

        if (winner && winner.userId) {
          const wUid = String(winner.userId);
          
          await User.updateOne(
            { userId: wUid },
            { $inc: { mainWallet: stats.derash, gamesWon: 1 } }
          );

          await GameHistory.create({
            gameId: `GAME_${Date.now()}`,
            winningNumber: winner.number,
            winnerUserId: wUid,
            winnerName: winner.userName,
            totalCollected: stats.totalCollected,
            derash: stats.derash,
            houseProfit: stats.houseProfit,
            playersCount: stats.totalPlayers
          });
        }

        const participantIds = [...new Set(selectedNumbers.map(n => String(n.userId)))];
        await User.updateMany(
          { userId: { $in: participantIds } },
          { $inc: { totalGames: 1 } }
        );

        if (settings.manualWinningNumber !== null) {
          settings.manualWinningNumber = null;
          await settings.save();
        }

        io.emit('game_result', {
          winningNumber,
          gamePhase: 'spinning',
          selectedNumbers,
          ...stats
        });

        setTimeout(() => {
          selectedNumbers = [];
          winningNumber = null;
          gamePhase = 'selecting';
          timeLeft = 50;
          io.emit('reset_game', {
            selectedNumbers: [],
            totalPlayers: 0,
            derash: 0,
            timeLeft: 50,
            gamePhase: 'selecting',
            winningNumber: null
          });
        }, 10000);
      } else {
        timeLeft = 50;
        winningNumber = 'NONE';
        io.emit('reset_game', {
          selectedNumbers: [],
          totalPlayers: 0,
          derash: 0,
          timeLeft: 50,
          gamePhase: 'selecting',
          winningNumber: null
        });
      }
    }
  }
  io.emit('timer_tick', { timeLeft, gamePhase });
}, 1000);

const PORT = process.env.PORT || 10000;

server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  if (bot) {
    bot.catch((err) => {
      console.error('Bot Error:', err.message);
    });

    try {
      if (process.env.NODE_ENV === 'production' && RENDER_URL) {
        const webhookUrl = `${RENDER_URL}/webhook`;
        await bot.api.setWebhook(webhookUrl, { drop_pending_updates: true });
        console.log(`🤖 Telegram Bot set up with Webhook: ${webhookUrl}`);
      } else {
        await bot.api.deleteWebhook({ drop_pending_updates: true });
        bot.start({
          drop_pending_updates: true,
          onStart: (botInfo) => console.log(`🤖 Telegram Bot (@${botInfo.username}) started locally!`),
        });
      }
    } catch (err) {
      console.error('Bot start error:', err);
    }
  }
});