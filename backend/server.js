 import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json()); // 👈 ይህንን መጨመር የግድ ነው!

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// --- STATE VARIABLES ---
let selectedNumbers = []; 
let timeLeft = 50;
let gamePhase = 'selecting';
let winningNumber = null;
const STAKE_PER_NUMBER = 10;
let totalRegisteredUsers = 12500;
// የተጠቃሚ ሂሳብ መያዣ (ለሙከራ በ Memory)
let userBalances = {}; 

// --- HELPER FUNCTIONS ---
const getGameStats = () => {
  const uniquePlayers = new Set(selectedNumbers.map(n => n.userId)).size;
  const totalCollected = selectedNumbers.length * STAKE_PER_NUMBER;
  const derash = totalCollected * 0.8;
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

// --- SOCKET LOGIC (የተጣመረ) ---
io.on('connection', (socket) => {
  console.log('ተጫዋች ተገናኝቷል:', socket.id);

  // 1. Initial State
  const stats = getGameStats();
  socket.emit('init_state', {
    selectedNumbers, timeLeft, gamePhase, winningNumber,
    totalPlayers: stats.totalPlayers, derash: stats.derash
  });

  // 2. Active User Stats
  const activeCount = io.engine.clientsCount;
  io.emit('stats_updated', {
    activePlayers: activeCount,
    activePlayersFormatted: formatK(activeCount),
    totalRegistered: totalRegisteredUsers,
    totalRegisteredFormatted: formatK(totalRegisteredUsers)
  });

  // 3. Game Events
  socket.on('select_number', (data) => {
    if (gamePhase !== 'selecting') return;
    if (!selectedNumbers.some(n => n.number === data.numberChosen)) {
      selectedNumbers.push({ number: data.numberChosen, userId: data.userId });
      const s = getGameStats();
      io.emit('board_updated', { selectedNumbers, totalPlayers: s.totalPlayers, derash: s.derash });
    }
  });

  socket.on('deselect_number', (data) => {
    if (gamePhase !== 'selecting') return;
    selectedNumbers = selectedNumbers.filter(n => !(n.number === data.numberChosen && n.userId === data.userId));
    const s = getGameStats();
    io.emit('board_updated', { selectedNumbers, totalPlayers: s.totalPlayers, derash: s.derash });
  });

  // 4. Disconnect
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

// --- TIMER LOGIC (የቀድሞው) ---
setInterval(() => {
  if (gamePhase === 'selecting') {
    if (timeLeft > 0) timeLeft--;
    else {
      gamePhase = 'spinning';
      winningNumber = selectedNumbers.length > 0 ? selectedNumbers[Math.floor(Math.random() * selectedNumbers.length)].number : 'NONE';
      const stats = getGameStats();
      io.emit('game_result', { winningNumber, gamePhase: 'spinning', selectedNumbers, ...stats });
      
      setTimeout(() => {
        selectedNumbers = []; winningNumber = null; gamePhase = 'selecting'; timeLeft = 50;
     io.emit('reset_game', { selectedNumbers: [], totalPlayers: 0, derash: 0, timeLeft: 50, gamePhase: 'selecting', winningNumber: null });
      }, 10000);
    }
  }
  io.emit('timer_tick', { timeLeft, gamePhase });
}, 1000);

server.listen(5000, () => console.log('Server is running on port 5000'));