import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

let selectedNumbers = []; // [{ number: 1, userId: 'USER_123' }]
let timeLeft = 50;
let gamePhase = 'selecting';
let winningNumber = null;
const STAKE_PER_NUMBER = 10;

// የደራሽ (80%) እና የተጫዋቾች ስሌት
const getGameStats = () => {
  const uniquePlayers = new Set(selectedNumbers.map(n => n.userId)).size;
  const totalCollected = selectedNumbers.length * STAKE_PER_NUMBER;
  const derash = totalCollected * 0.8; // 80% ደራሽ
  return { totalPlayers: uniquePlayers, derash };
};

// በየ 1 ሰከንዱ ሰዓት ማስቆጠር
setInterval(() => {
  if (gamePhase === 'selecting') {
    if (timeLeft > 0) {
      timeLeft--;
    } else {
      gamePhase = 'spinning';
      
      if (selectedNumbers.length > 0) {
        const randomIndex = Math.floor(Math.random() * selectedNumbers.length);
        winningNumber = selectedNumbers[randomIndex].number;
      } else {
        winningNumber = 'NONE';
      }

      const stats = getGameStats();
      io.emit('game_result', { 
        winningNumber, 
        gamePhase: 'spinning',
        selectedNumbers,
        totalPlayers: stats.totalPlayers,
        derash: stats.derash
      });

      // ከ 10 ሰከንድ በኋላ አዲስ ጨዋታ ማስጀመር
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
    }
  }
  io.emit('timer_tick', { timeLeft, gamePhase });
}, 1000);

io.on('connection', (socket) => {
  const stats = getGameStats();
  
  // አዲስ ተጠቃሚ ሲገናኝ መረጃ መላክ
  socket.emit('init_state', {
    selectedNumbers,
    timeLeft,
    gamePhase,
    winningNumber,
    totalPlayers: stats.totalPlayers,
    derash: stats.derash
  });

  // ቁጥር ሲመረጥ
  socket.on('select_number', (data) => {
    if (gamePhase !== 'selecting') return;

    const exists = selectedNumbers.some(n => n.number === data.numberChosen);
    if (!exists) {
      selectedNumbers.push({
        number: data.numberChosen,
        userId: data.userId
      });

      const updatedStats = getGameStats();
      io.emit('board_updated', {
        selectedNumbers,
        totalPlayers: updatedStats.totalPlayers,
        derash: updatedStats.derash
      });
    }
  });

  // ቁጥር ሲሰረዝ (Deselect)
  socket.on('deselect_number', (data) => {
    if (gamePhase !== 'selecting') return;

    selectedNumbers = selectedNumbers.filter(
      (n) => !(n.number === data.numberChosen && n.userId === data.userId)
    );

    const updatedStats = getGameStats();
    io.emit('board_updated', {
      selectedNumbers,
      totalPlayers: updatedStats.totalPlayers,
      derash: updatedStats.derash
    });
  });
});
let totalRegisteredUsers = 12500; // ለሙከራ 12,500 ተመዝጋቢ ብንል

// ቁጥሮችን ወደ "K" (Thousands) የሚቀይር helper function
function formatK(num) {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

io.on('connection', (socket) => {
  // 1. ተጠቃሚ ሲገባ Active ቁጥሩን በ Real-time ማሻሻል
  const activeCount = io.engine.clientsCount;
  
  io.emit('stats_updated', {
    activePlayers: activeCount,
    activePlayersFormatted: formatK(activeCount),
    totalRegistered: totalRegisteredUsers,
    totalRegisteredFormatted: formatK(totalRegisteredUsers)
  });

  // 2. ተጠቃሚ ሲወጣ Active ቁጥሩን ወዲያውኑ ቀንሶ ማሰራጨት
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
server.listen(5000, () => {
  console.log('Server is running on port 5000');
});
