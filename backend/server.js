import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import https from 'https';
import { bot } from './bot.js';
import { webhookCallback } from 'grammy';

const WEB_APP_URL = process.env.WEB_APP_URL || "https://fetan-lottery.vercel.app";

const app = express();
app.use(cors());
app.use(express.json());

// Server Ping Check Route
app.get('/', (req, res) => {
  res.send('Fetan Lottery Backend is running live 🚀');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['polling', 'websocket']
});

// --- STATE VARIABLES ---
let selectedNumbers = [];
let timeLeft = 50;
let gamePhase = 'selecting';
let winningNumber = null;
const STAKE_PER_NUMBER = 10;

// የተጠቃሚዎች ዳታ መያዣ (In-Memory Database)
const usersData = {};
const registeredUsersSet = new Set();
const activeUsersMap = new Map();

const RENDER_URL = process.env.RENDER_EXTERNAL_URL;

if (process.env.NODE_ENV === 'production' && RENDER_URL) {
  app.use('/webhook', webhookCallback(bot, 'express'));
}

// --- HELPER FUNCTIONS ---
function formatUserCount(num) {
  if (num >= 10000) {
    return Math.floor(num / 1000) * 1000 + '+';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

const getGameStats = () => {
  const uniquePlayers = new Set(selectedNumbers.map(n => String(n.userId))).size;
  const totalCollected = selectedNumbers.length * STAKE_PER_NUMBER;
  const derash = Math.floor(totalCollected * 0.8);
  return { totalPlayers: uniquePlayers, derash };
};

function initUser(userId, firstName = '', username = '') {
  const uid = String(userId);
  if (!usersData[uid]) {
    usersData[uid] = {
      userId: uid,
      firstName: firstName || '',
      username: username || '',
      mainWallet: 0,
      playWallet: 0,
      totalInvite: 0,
      gamesWon: 0,
      totalGames: 0
    };
  }
  registeredUsersSet.add(uid);
  return usersData[uid];
}

// --- API ENDPOINTS ---

// 1. የተጠቃሚ ምዝገባ እና የሪፌራል (10 ETB ቦነስ)
app.post('/api/user/register', async (req, res) => {
  const { userId, firstName, username, referrerId } = req.body;
  if (!userId) return res.status(400).json({ success: false, message: "User ID ያስፈልጋል።" });

  const uid = String(userId);
  const isNewUser = !usersData[uid];

  const user = initUser(uid, firstName, username);

  if (isNewUser && referrerId && String(referrerId) !== uid) {
    const refUid = String(referrerId);
    if (usersData[refUid]) {
      usersData[refUid].totalInvite += 1;
      usersData[refUid].playWallet += 10;

      if (bot) {
        try {
          await bot.api.sendMessage(
            refUid,
            `🎉 *እንኳን ደስ አለዎት!*\n\n${firstName || 'አዲስ አባል'} የእርስዎን መጋበዣ ሊንክ ተጠቅሞ ስለገባ *10 ETB* ቦነስ በ Play Walletዎ ላይ ተጨምሯል!\n\n👥 *ጠቅላላ የጋበዟቸው:* ${usersData[refUid].totalInvite}`,
            { parse_mode: 'Markdown' }
          );
        } catch (err) {
          console.error('ለጋባዡ መልዕክት መላክ አልተቻለም:', err.message);
        }
      }
    }
  }

  res.json({ success: true, isNew: isNewUser, user });
});

// 2. Deposit
app.post('/api/deposit', (req, res) => {
  const { userId, amount } = req.body;
  const uid = String(userId);
  const user = initUser(uid);
  user.mainWallet += Number(amount || 0);
  res.json({ success: true, balance: user.mainWallet });
});

// 3. Withdraw
app.post('/api/withdraw', (req, res) => {
  const { userId, amount } = req.body;
  const uid = String(userId);
  const user = initUser(uid);

  if (user.mainWallet < Number(amount)) {
    return res.status(400).json({ success: false, message: "በቂ ሂሳብ የለም!" });
  }

  user.mainWallet -= Number(amount);
  res.json({ success: true, balance: user.mainWallet, message: "ተሳክቷል!" });
});

// 4. የተጠቃሚ መረጃ ማግኛ
app.get('/api/user', (req, res) => {
  const { id } = req.query;
  const uid = String(id);

  if (uid && uid !== 'GUEST_USER') {
    const user = initUser(uid);
    return res.json(user);
  }
res.json({
    mainWallet: 0,
    playWallet: 0,
    gamesWon: 0,
    totalInvite: 0,
    totalGames: 0
  });
});

// --- RENDER KEEP-ALIVE PING ---
setInterval(() => {
  const backendPingUrl = RENDER_URL || 'https://fetan-lottery-backend.onrender.com';
  https.get(backendPingUrl, (res) => {
    console.log('Keep-alive ping sent');
  }).on('error', (err) => {
    console.log('Ping error:', err.message);
  });
}, 10 * 60 * 1000); // በየ 10 ደቂቃው እንዲነቃ ያደርገዋል

// --- SOCKET LOGIC ---
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId && userId !== 'GUEST_USER') {
    initUser(userId);
    activeUsersMap.set(socket.id, String(userId));
  }

  const activeCount = new Set(activeUsersMap.values()).size;
  const registeredCount = registeredUsersSet.size;

  const stats = getGameStats();
  socket.emit('init_state', {
    selectedNumbers,
    timeLeft,
    gamePhase,
    winningNumber,
    totalPlayers: stats.totalPlayers,
    derash: stats.derash
  });

  io.emit('stats_updated', {
    activePlayers: activeCount,
    activePlayersFormatted: formatUserCount(activeCount),
    totalRegistered: registeredCount,
    totalRegisteredFormatted: formatUserCount(registeredCount)
  });

  socket.on('select_number', (data) => {
    if (gamePhase !== 'selecting') return;

    const { numberChosen, userId, userName } = data;
    const uid = String(userId);
    const user = initUser(uid);

    const exists = selectedNumbers.some(n => Number(n.number) === Number(numberChosen));
    if (exists) return;

    const totalAvailable = user.mainWallet + user.playWallet;
    if (totalAvailable < STAKE_PER_NUMBER) {
      socket.emit('error_message', { message: 'በቂ ሂሳብ የለም! እባክዎን አስቀድመው ሂሳብዎን ይሙሉ::' });
      return;
    }

    if (user.playWallet >= STAKE_PER_NUMBER) {
      user.playWallet -= STAKE_PER_NUMBER;
    } else {
      const remaining = STAKE_PER_NUMBER - user.playWallet;
      user.playWallet = 0;
      user.mainWallet -= remaining;
    }

    selectedNumbers.push({
      number: Number(numberChosen),
      userId: uid,
      userName: userName || `ተጫዋች_${uid}`
    });

    const s = getGameStats();
    io.emit('board_updated', { selectedNumbers, totalPlayers: s.totalPlayers, derash: s.derash });
    socket.emit('balance_updated', { balance: user.mainWallet });
  });

  socket.on('deselect_number', (data) => {
    if (gamePhase !== 'selecting') return;

    const { numberChosen, userId } = data;
    const uid = String(userId);
    const user = initUser(uid);

    const isSelected = selectedNumbers.some(
      n => Number(n.number) === Number(numberChosen) && String(n.userId) === uid
    );

    if (isSelected) {
      selectedNumbers = selectedNumbers.filter(
        n => !(Number(n.number) === Number(numberChosen) && String(n.userId) === uid)
      );

      user.mainWallet += STAKE_PER_NUMBER;

      const s = getGameStats();
      io.emit('board_updated', { selectedNumbers, totalPlayers: s.totalPlayers, derash: s.derash });
      socket.emit('balance_updated', { balance: user.mainWallet });
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

// --- TIMER LOGIC ---
setInterval(() => {
  if (gamePhase === 'selecting') {
    if (timeLeft > 0) {
      timeLeft--;
    } else {
      if (selectedNumbers.length > 0) {
        gamePhase = 'spinning';
        const randomIndex = Math.floor(Math.random() * selectedNumbers.length);
        winningNumber = selectedNumbers[randomIndex].number;
 const stats = getGameStats();
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

// --- SERVER START ---
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