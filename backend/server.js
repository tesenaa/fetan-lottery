 import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: '*',
     methods: ['GET', 'POST'] },
     transports:['polling','websocket']
});

// --- STATE VARIABLES ---
let selectedNumbers = []; // [{ number: 12, userId: '123', userName: 'John' }]
let timeLeft = 50;
let gamePhase = 'selecting'; // 'selecting' | 'spinning' | 'result'
let winningNumber = null;
const STAKE_PER_NUMBER = 10;
let totalRegisteredUsers = 12500;
let userBalances = {};

// --- HELPER FUNCTIONS ---
const getGameStats = () => {
  const uniquePlayers = new Set(selectedNumbers.map(n => String(n.userId))).size;
  const totalCollected = selectedNumbers.length * STAKE_PER_NUMBER;
  const derash = Math.floor(totalCollected * 0.8);
  return { totalPlayers: uniquePlayers, derash };
};

function formatK(num) {
  return num >= 1000 ? (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K' : num.toString();
}

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
  res.json({
    mainWallet: userBalances[id] || 0,
    playWallet: 0,
    gamesWon: 0,
    totalInvite: 0,
    totalGames: 0
  });
});

// Render ሰርቨር እንዳይተኛ እራሱን በየ14 ደቂቃው Ping ያደርጋል
setInterval(() => {
  https.get('https://fetan-lottery-backend.onrender.com', (res) => {
    console.log('Keep-alive ping sent');
  }).on('error', (err) => {
    console.log('Ping error:', err.message);
  });
}, 14 * 60 * 1000); // በየ 14 ደቂቃው

// --- SOCKET LOGIC ---
io.on('connection', (socket) => {
  console.log('ተጫዋች ተገናኝቷል:', socket.id);

  const stats = getGameStats();
  socket.emit('init_state', {
    selectedNumbers,
    timeLeft,
    gamePhase,
    winningNumber,
    totalPlayers: stats.totalPlayers,
    derash: stats.derash
  });

  const activeCount = io.engine.clientsCount;
  io.emit('stats_updated', {
    activePlayers: activeCount,
    activePlayersFormatted: formatK(activeCount),
    totalRegistered: totalRegisteredUsers,
    totalRegisteredFormatted: formatK(totalRegisteredUsers)
  });

  socket.on('select_number', (data) => {
    if (gamePhase !== 'selecting') return;
    const exists = selectedNumbers.some(n => Number(n.number) === Number(data.numberChosen));
    if (!exists) {
      selectedNumbers.push({
        number: Number(data.numberChosen),
        userId: String(data.userId),
        userName: data.userName || `ተጫዋች_${data.userId}`
      });
      const s = getGameStats();
      io.emit('board_updated', { selectedNumbers, totalPlayers: s.totalPlayers, derash: s.derash });
    }
  });

  socket.on('deselect_number', (data) => {
    if (gamePhase !== 'selecting') return;
    selectedNumbers = selectedNumbers.filter(
      n => !(Number(n.number) === Number(data.numberChosen) && String(n.userId) === String(data.userId))
    );
    const s = getGameStats();
    io.emit('board_updated', { selectedNumbers, totalPlayers: s.totalPlayers, derash: s.derash });
  });

  socket.on('disconnect', () => {
    const currentActive = io.engine.clientsCount;
    io.emit('stats_updated', {
      activePlayers: currentActive,
      activePlayersFormatted: formatK(currentActive),
      totalRegistered: totalRegisteredUsers,
      totalRegisteredFormatted: formatK(totalRegisteredUsers)
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
        // ቁጥር ተመርጦ ከሆነ ብቻ ዕጣ ይወጣል
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
        // ቁጥር ካልተመረጠ ዕጣ አይወጣም፤ ሰዓቱ እንደገና 50 ብሎ ይጀምራል
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

server.listen(5000, () => console.log('Server is running on port 5000'));