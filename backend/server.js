import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import https from 'https';

const app = express();
app.use(cors());
app.use(express.json());

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
let userBalances = {};

// ሁሉንም የተመዘገቡ ተጠቃሚዎች መያዣ (Unique User IDs)
const registeredUsersSet = new Set();

// አሁን አክቲቭ የሆኑ ተጠቃሚዎች መያዣ (socket.id -> userId)
const activeUsersMap = new Map();

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

// --- API ENDPOINTS ---
app.post('/api/deposit', (req, res) => {
  const { userId, amount } = req.body;
  if (!userBalances[userId]) userBalances[userId] = 0;
  userBalances[userId] += Number(amount);
  res.json({ success: true, balance: userBalances[userId] });
});

app.post('/api/withdraw', (req, res) => {
  const { userId, amount } = req.body;
  if (!userBalances[userId] || userBalances[userId] < amount) {
    return res.status(400).json({ success: false, message: "በቂ ሂሳብ የለም!" });
  }
  userBalances[userId] -= Number(amount);
  res.json({ success: true, balance: userBalances[userId], message: "ተሳክቷል!" });
});

app.get('/api/user', (req, res) => {
  const { id } = req.query;
  
  if (id && id !== 'GUEST_USER') {
    registeredUsersSet.add(String(id));
  }

  res.json({
    mainWallet: userBalances[id] || 0,
    playWallet: 0,
    gamesWon: 0,
    totalInvite: 0,
    totalGames: 0
  });
});

// --- RENDER KEEP-ALIVE PING ---
setInterval(() => {
  https.get('https://fetan-lottery-backend.onrender.com', (res) => {
    console.log('Keep-alive ping sent');
  }).on('error', (err) => {
    console.log('Ping error:', err.message);
  });
}, 14 * 60 * 1000);

// --- SOCKET LOGIC ---
io.on('connection', (socket) => {
  console.log('ተጫዋች ተገናኝቷል:', socket.id);

  const userId = socket.handshake.query.userId;

  if (userId && userId !== 'GUEST_USER') {
    registeredUsersSet.add(String(userId));
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

    const exists = selectedNumbers.some(n => Number(n.number) === Number(numberChosen));
    if (exists) return;

    const currentBalance = userBalances[uid] || 0;
    if (currentBalance < STAKE_PER_NUMBER) {
      socket.emit('error_message', { message: 'በቂ ሂሳብ የለም! እባክዎን አስቀድመው ሂሳብዎን ይሙሉ::' });
      return;
    }

    userBalances[uid] -= STAKE_PER_NUMBER;

    selectedNumbers.push({
      number: Number(numberChosen),
      userId: uid,
      userName: userName || `ተጫዋች_${uid}`
    });
 const s = getGameStats();
    io.emit('board_updated', { selectedNumbers, totalPlayers: s.totalPlayers, derash: s.derash });
    socket.emit('balance_updated', { balance: userBalances[uid] });
  });

  socket.on('deselect_number', (data) => {
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

      if (!userBalances[uid]) userBalances[uid] = 0;
      userBalances[uid] += STAKE_PER_NUMBER;

      const s = getGameStats();
      io.emit('board_updated', { selectedNumbers, totalPlayers: s.totalPlayers, derash: s.derash });
      socket.emit('balance_updated', { balance: userBalances[uid] });
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
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));