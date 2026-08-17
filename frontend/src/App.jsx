import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const API_BASE_URL = "https://fetan-lottery-backend.onrender.com";
const ADMIN_ID = "494653076";

const NumberButton = React.memo(({ num, isMine, isOthers, disabled, onClick }) => {
  let bgColor = '#2a2a40';
  if (isMine) bgColor = '#22c55e';
  else if (isOthers) bgColor = '#ef4444';

  return (
    <button
      onClick={() => onClick(num)}
      disabled={disabled}
      style={{
        padding: '8px 0',
        backgroundColor: bgColor,
        color: '#ffffff',
        border: '1px solid #3d3d5c',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 'bold',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        willChange: 'background-color'
      }}
    >
      {num}
    </button>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.num === nextProps.num &&
    prevProps.isMine === nextProps.isMine &&
    prevProps.isOthers === nextProps.isOthers &&
    prevProps.disabled === nextProps.disabled
  );
});

export default function App() {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const userId = useMemo(() => (tgUser?.id ? String(tgUser.id) : 'GUEST_USER'), [tgUser]);
  const userName = useMemo(() => {
    if (!tgUser) return 'ተጫዋች';
    const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ');
    return fullName || 'ተጫዋች';
  }, [tgUser]);

  const userPhoto = tgUser?.photo_url || null;
  const isAdmin = useMemo(() => String(userId) === String(ADMIN_ID), [userId]);

  const [userPhone, setUserPhone] = useState('');
  const [isBanned, setIsBanned] = useState(false);
  const userInitial = userName ? userName.charAt(0).toUpperCase() : 'U';

  const socket = useMemo(() => io(API_BASE_URL, {
    autoConnect: true,
    transports: ['websocket', 'polling'],
    query: { userId }
  }), [userId]);

  const [currentTab, setCurrentTab] = useState('game');
  const [currentScreen, setCurrentScreen] = useState('home');
  const [stake, setStake] = useState(10);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  const [walletTab, setWalletTab] = useState('balance');
  const [mainWallet, setMainWallet] = useState(0);
  const [playWallet, setPlayWallet] = useState(0);
  const [gamesWon, setGamesWon] = useState(0);
  const [totalInvite, setTotalInvite] = useState(0);
  const [totalGames, setTotalGames] = useState(0);

  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [allPickedNumbers, setAllPickedNumbers] = useState([]);

  const myPickedSet = useMemo(() => new Set(selectedNumbers), [selectedNumbers]);
  const allPickedSet = useMemo(() => new Set(allPickedNumbers), [allPickedNumbers]);

  const [playerCount, setPlayerCount] = useState(0);
  const [derash, setDerash] = useState(0);
  const [phase, setPhase] = useState('selecting');
  const [selectionTime, setSelectionTime] = useState(50);
  const [winningNumber, setWinningNumber] = useState('?');
  const [winnerInfo, setWinnerInfo] = useState(null);

  const [depAmount, setDepAmount] = useState('');
  const [depProof, setDepProof] = useState('');
  const [withAmount, setWithAmount] = useState('');
  const [gameHistory, setGameHistory] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);

  const [page, setPage] = useState(1);
  const itemsPerPage = 200;

  // ADMIN STATES
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editMain, setEditMain] = useState(0);
  const [editPlay, setEditPlay] = useState(0);
  const [adminTab, setAdminTab] = useState('users');
  const [pendingTx, setPendingTx] = useState([]);
  const [financialStats, setFinancialStats] = useState(null);
  const [broadcastText, setBroadcastText] = useState('');

  // SYSTEM SETTINGS
  const [sysSettings, setSysSettings] = useState({
    ticketPrice: 10,
    winnerPercentage: 80,
    manualWinningNumber: null
  });
  const [manualNumberInput, setManualNumberInput] = useState('');

  const visibleNumbers = useMemo(() => {
    const start = (page - 1) * itemsPerPage + 1;
    const end = page * itemsPerPage;
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page]);

  const updateBoardStats = useCallback((allSelectedList) => {
    if (allSelectedList && Array.isArray(allSelectedList)) {
      const uniquePlayers = new Set(
        allSelectedList.map(item => typeof item === 'object' ? String(item.userId) : String(item))
      ).size;
      setPlayerCount(uniquePlayers);
      setDerash(Math.floor(allSelectedList.length * stake * (sysSettings.winnerPercentage / 100)));
    }
  }, [stake, sysSettings.winnerPercentage]);

  const fetchUserData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user?id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setMainWallet(data.mainWallet || 0);
        setPlayWallet(data.playWallet || 0);
        setGamesWon(data.gamesWon || 0);
        setTotalInvite(data.totalInvite || 0);
        setTotalGames(data.totalGames || 0);
        setIsBanned(data.isBanned || false);
        setGameHistory(data.history || []);
        if (data.phone) {
          setUserPhone(data.phone);
        } else if (tgUser?.username) {
          setUserPhone(`@${tgUser.username}`);
        } else {
          setUserPhone(userId);
        }
      }
    } catch (err) {
      console.error("Data Fetch Error:", err);
    }
  }, [userId, tgUser]);

  const fetchAdminData = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const headers = { 'admin-key': userId };
      const [uRes, tRes, fRes, sRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/users`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/transactions`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/financial-stats`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/settings`, { headers })
      ]);
      const uData = await uRes.json();
      const tData = await tRes.json();
      const fData = await fRes.json();
      const sData = await sRes.json();

      if (uData.success) setAdminUsers(uData.users);
      if (tData.success) setPendingTx(tData.transactions);
      if (fData.success) setFinancialStats(fData.stats);
      if (sData.success) {
        setSysSettings(sData.settings);
        setStake(sData.settings.ticketPrice);
      }
    } catch (err) {
      console.error("Admin Fetch Error:", err);
    }
  }, [isAdmin, userId]);

  const handleUpdateSettings = async (overrideParams = {}) => {
    try {
      const payload = {
        ticketPrice: sysSettings.ticketPrice,
        winnerPercentage: sysSettings.winnerPercentage,
        manualWinningNumber: sysSettings.manualWinningNumber,
        ...overrideParams
      };
      const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'admin-key': userId },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setSysSettings(data.settings);
        setStake(data.settings.ticketPrice);
      }
    } catch (e) {
      alert("ስህተት ተፈጥሯል!");
    }
  };

  const handleSetManualWinner = () => {
    if (!manualNumberInput) return alert("እባክዎን የዕጣ ቁጥር ያስገቡ!");
    handleUpdateSettings({ manualWinningNumber: Number(manualNumberInput) });
    setManualNumberInput('');
  };

  const handleToggleBan = async (targetUserId, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/toggle-ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'admin-key': userId },
        body: JSON.stringify({ targetUserId, isBanned: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        alert("የተጠቃሚው Status ተቀይሯል!");
        fetchAdminData();
      }
    } catch (e) {
      alert("ስህተት ተፈጥሯል!");
    }
  };

  const handleUpdateUserBalance = async () => {
    if (!editingUser || !isAdmin) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/update-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'admin-key': userId },
        body: JSON.stringify({
          targetUserId: editingUser.userId,
          mainWallet: editMain,
          playWallet: editPlay
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("የተጠቃሚ ሂሳብ ተስተካክሏል!");
        setEditingUser(null);
        fetchAdminData();
      }
    } catch (err) {
      alert("ስህተት ተፈጥሯል!");
    }
  };

  const handleProcessTransaction = async (transactionId, action) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/process-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'admin-key': userId },
        body: JSON.stringify({ transactionId, action })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchAdminData();
      }
    } catch (e) {
      alert("ስህተት ተፈጥሯል!");
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastText) return alert("እባክዎን መልዕክት ይፃፉ!");
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'admin-key': userId },
        body: JSON.stringify({ message: broadcastText })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setBroadcastText('');
      }
    } catch (e) {
      alert("ስህተት ተፈጥሯል!");
    }
  };

  const derashRef = useRef(derash);
  useEffect(() => {
    derashRef.current = derash;
  }, [derash]);

  useEffect(() => {
    fetchUserData();
    let spinTimeout;
    let resultTimeout;

    socket.on('init_state', (data) => {
      if (!data) return;
      setPhase(data.gamePhase || 'selecting');
      setSelectionTime(data.timeLeft !== undefined ? data.timeLeft : 50);
      setWinningNumber(data.winningNumber || '?');
      if (data.ticketPrice) setStake(data.ticketPrice);
      if (data.selectedNumbers && Array.isArray(data.selectedNumbers)) {
        const allPicked = data.selectedNumbers.map(n => typeof n === 'object' ? n.number : n);
        setAllPickedNumbers(allPicked);

        const myPicked = data.selectedNumbers
          .filter(n => typeof n === 'object' && String(n.userId) === String(userId))
          .map(n => n.number);
        setSelectedNumbers(myPicked);
        updateBoardStats(data.selectedNumbers);
      }
    });

    socket.on('timer_tick', (data) => {
      if (!data) return;
      setSelectionTime(data.timeLeft);
      if (data.gamePhase) setPhase(data.gamePhase);
    });

    socket.on('board_updated', (data) => {
      if (!data) return;
      if (data.selectedNumbers && Array.isArray(data.selectedNumbers)) {
        const allPicked = data.selectedNumbers.map(n => typeof n === 'object' ? n.number : n);
        setAllPickedNumbers(allPicked);

        const myPicked = data.selectedNumbers
          .filter(n => typeof n === 'object' && String(n.userId) === String(userId))
          .map(n => n.number);
        setSelectedNumbers(myPicked);
        updateBoardStats(data.selectedNumbers);
      } else {
        setPlayerCount(data.totalPlayers || 0);
        setDerash(data.derash || 0);
      }
    });

    socket.on('error_message', (data) => alert(data.message));

    socket.on('balance_updated', (data) => {
      setMainWallet(data.balance);
      if (data.playWallet !== undefined) setPlayWallet(data.playWallet);
    });

    socket.on('stats_updated', (data) => {
      if (!data) return;
      setActiveCount(data.activePlayersFormatted || data.activePlayers);
      setRegisteredCount(data.totalRegisteredFormatted || data.totalRegistered);
    });

    socket.on('game_result', (data) => {
      if (!data || data.winningNumber === 'NONE') return;

      setPhase('spinning');
      setWinningNumber('SPINNING');

      spinTimeout = setTimeout(() => {
        setPhase('result');
        const winNum = data.winningNumber;
        setWinningNumber(winNum);

        const winItem = data.selectedNumbers?.find(
          n => typeof n === 'object' && String(n.number) === String(winNum)
        );
        const winAmount = data.derash !== undefined ? data.derash : derashRef.current;

        if (winItem) {
          setWinnerInfo({
            number: winNum,
            userName: winItem.userName || `user_${winItem.userId}`,
            derash: winAmount
          });

          if (String(winItem.userId) === String(userId)) {
            setMainWallet(prev => prev + winAmount);
            setGamesWon(prev => prev + 1);
            alert(`🎉 እንኳን ደስ አለዎት! ዕጣው በቁጥር #${winNum} ለእርስዎ ወጥቷል! ${winAmount} ETB ወደ ዋሌትዎ ገቢ ሆኗል ።`);
          }
        }

        fetchUserData();

        resultTimeout = setTimeout(() => {
          setSelectedNumbers([]);
          setAllPickedNumbers([]);
          setWinningNumber('?');
          setWinnerInfo(null);
          setPhase('selecting');
          setSelectionTime(50);
          setPlayerCount(0);
          setDerash(0);
        }, 4000);
      }, 6000);
    });

    socket.on('reset_game', (data) => {
      clearTimeout(spinTimeout);
      clearTimeout(resultTimeout);
      setSelectedNumbers([]);
      setAllPickedNumbers([]);
      setWinningNumber('?');
      setWinnerInfo(null);
      setPhase(data?.gamePhase || 'selecting');
      setSelectionTime(data?.timeLeft || 50);
      setPlayerCount(0);
      setDerash(0);
    });

    return () => {
      socket.off('init_state');
      socket.off('timer_tick');
      socket.off('board_updated');
      socket.off('stats_updated');
      socket.off('game_result');
      socket.off('reset_game');
      socket.off('error_message');
      socket.off('balance_updated');
      clearTimeout(spinTimeout);
      clearTimeout(resultTimeout);
    };
  }, [socket, userId, updateBoardStats, fetchUserData]);

  const toggleNumber = useCallback((num) => {
    if (phase !== 'selecting') return;
    if (isBanned) return alert("አካውንትዎ የታገደ ስለሆነ መጫወት አይችሉም!");

    if (myPickedSet.has(num)) {
      setSelectedNumbers(prev => prev.filter(n => n !== num));
      setAllPickedNumbers(prev => prev.filter(n => n !== num));
      setMainWallet(prev => prev + stake);
      socket.emit('deselect_number', { numberChosen: num, userId });
    } else {
      const totalAvailableBalance = mainWallet + playWallet;
      if (totalAvailableBalance < stake) {
        alert("⚠️ የእርስዎ ቀሪ ሂሳብ በቂ አይደለም! እባክዎን አስቀድመው ገንዘብ ያስገቡ ።");
        return;
      }

      if (playWallet >= stake) {
        setPlayWallet(prev => prev - stake);
      } else {
        const remainingStake = stake - playWallet;
        setPlayWallet(0);
        setMainWallet(prev => prev - remainingStake);
      }

      setSelectedNumbers(prev => [...prev, num]);
      setAllPickedNumbers(prev => [...prev, num]);
      socket.emit('select_number', { numberChosen: num, userId, userName });
    }
  }, [phase, isBanned, myPickedSet, mainWallet, playWallet, stake, socket, userId, userName]);

  const handleDeposit = async () => {
    if (!depAmount || Number(depAmount) <= 0) return alert("እባክዎን ትክክለኛ መጠን ያስገቡ!");
    try {
      const res = await fetch(`${API_BASE_URL}/api/deposit-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userName, amount: depAmount, proof: depProof })
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        setDepAmount('');
        setDepProof('');
      }
    } catch (err) {
      alert("የገንዘብ ማስገባት ስህተት አጋጥሟል!");
    }
  };

  const handleWithdraw = async () => {
    if (!withAmount || Number(withAmount) <= 0) return alert("እባክዎን ትክክለኛ መጠን ያስገቡ!");
    try {
      const res = await fetch(`${API_BASE_URL}/api/withdraw-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userName, amount: withAmount, phone: userPhone })
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        setMainWallet(data.balance);
        setWithAmount('');
      }
    } catch (err) {
      alert("የገንዘብ ማውጣት ስህተት አጋጥሟል!");
    }
  };

  const copyReferralLink = () => {
    const refLink = `https://t.me/fetan_lottery_bot?start=${userId}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(refLink).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = refLink;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (err) {}
      document.body.removeChild(textArea);
    }
  };

  const filteredAdminUsers = useMemo(() => {
    return adminUsers.filter(u =>
      u.userId.includes(adminSearch) ||
      (u.phone && u.phone.includes(adminSearch)) ||
      (u.firstName && u.firstName.toLowerCase().includes(adminSearch.toLowerCase()))
    );
  }, [adminUsers, adminSearch]);

  return (
    <div style={{
      maxWidth: '500px',
      width: '100%',
      margin: '0 auto',
      backgroundColor: '#0c0c1e',
      color: '#ffffff',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes arrowSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin-arrow-container {
          animation: arrowSpin 0.5s linear infinite;
        }
        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: #312e81;
          border-radius: 4px;
        }
      `}} />

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', width: '100%' }}>
        {currentTab === 'game' && (
          <>
            {currentScreen === 'home' && (
              <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center', width: '100%' }}>
                  Welcome to <span style={{ color: '#f59e0b' }}>Fetan Lottery</span>
                </h1>
                {isBanned && (
                  <div style={{ backgroundColor: '#ef4444', color: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center', width: '100%', fontWeight: 'bold' }}>
                    ⚠️ አካውንትዎ ህግ በመጣስ ምክንያት የታገደ ነው (Banned)!
                  </div>
                )}
                <div style={{ width: '100%', backgroundColor: '#15152a', border: '1px solid #ef4444', borderRadius: '16px', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)', marginBottom: '20px', boxSizing: 'border-box' }}>
                  <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 'bold', marginBottom: '16px' }}>Current Ticket Stake: {stake} ETB</div>
                  <button onClick={() => { setStake(10); setCurrentScreen('board'); }} style={{ width: '100%', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '12px' }}>
                    ► Play 10 ETB
                  </button>
                  <button onClick={() => { setStake(20); setCurrentScreen('board'); }} style={{ width: '100%', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}>
                    ► Play 20 ETB
                  </button>
                </div>

                <div style={{ width: '100%', backgroundColor: '#1b1b38', borderRadius: '16px', padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box', border: '1px solid #2d2d50' }}>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{activeCount}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Active Users</div>
                  </div>
                  <div style={{ borderTop: '1px solid #2d2d50', paddingTop: '12px' }}>
                    <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{registeredCount}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Registered Users</div>
                  </div>
                </div>
              </div>
            )}

            {currentScreen === 'board' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', backgroundColor: '#0a0a16', borderBottom: '1px solid #1e1b4b', flexShrink: 0 }}>
                  <button onClick={() => setCurrentScreen('home')} style={{ backgroundColor: '#1e1b4b', color: '#38bdf8', border: '1px solid #312e81', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                    ← Back
                  </button>
                  <button onClick={() => fetchUserData()} style={{ backgroundColor: '#1e1b4b', color: '#22c55e', border: '1px solid #312e81', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                    🔄 Refresh
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', padding: '6px 8px 4px 8px', flexShrink: 0 }}>
                  <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#9ca3af' }}>Game ID</div>
                    <div style={{ fontSize: '10px', fontWeight: 'bold' }}>Fetan-001</div>
                  </div>
                  <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#9ca3af' }}>Players</div>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#38bdf8' }}>{playerCount}</div>
                  </div>
                  <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#9ca3af' }}>Stake</div>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#eab308' }}>{stake} ETB</div>
                  </div>
                  <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#9ca3af' }}>Derash</div>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#22c55e' }}>{derash} ETB</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', padding: '4px 8px', backgroundColor: '#13132b', flexShrink: 0 }}>
                  {[1, 2, 3, 4, 5].map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        padding: '3px 8px',
                        fontSize: '10px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: page === p ? '#f59e0b' : '#1e1b4b',
                        color: '#fff',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      {(p - 1) * 200 + 1}-{p * 200}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', flex: 1, padding: '4px 8px 8px 8px', overflow: 'hidden' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
                    <div style={{
                      backgroundColor: phase === 'spinning' ? (allPickedNumbers.length > 0 ? '#dc2626' : '#6b7280') : '#0284c7',
                      padding: '5px',
                      borderRadius: '6px',
                      textAlign: 'center',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {phase === 'spinning' ? (allPickedNumbers.length > 0 ? '🎰 ዕጣ እየወጣ ነው...' : '⚠️ ምንም ቁጥር አልተመረጠም!') : '⏳ የምርጫ ጊዜ፡ ' + selectionTime + ' ሰከንድ'}
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      gap: '4px',
                      overflowY: 'auto',
                      alignContent: 'start',
                      paddingRight: '4px',
                      flex: 1
                    }}>
                      {visibleNumbers.map((num) => {
                        const isMine = myPickedSet.has(num);
                        const isOthers = allPickedSet.has(num) && !isMine;
                        return (
                          <NumberButton
                            key={num}
                            num={num}
                            disabled={phase !== 'selecting' || isBanned}
                            isMine={isMine}
                            isOthers={isOthers}
                            onClick={() => toggleNumber(num)}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, justifyContent: 'flex-start', overflowY: 'auto' }}>
                    <div style={{
                      backgroundColor: '#1b1b32',
                      borderRadius: '8px',
                      padding: '6px 8px',
                      minHeight: '65px',
                      maxHeight: '90px',
                      border: '1px solid #312e81',
                      display: 'flex',
                      flexDirection: 'column',
                      flexShrink: 0
                    }}>
                      <div style={{ fontSize: '10px', color: '#38bdf8', marginBottom: '2px', fontWeight: 'bold' }}>
                        📌 የተመረጡ ቁጥሮች ({selectedNumbers.length}):
                      </div>
                      <div style={{ fontSize: '10px', color: '#9ca3af', lineHeight: '1.2', wordBreak: 'break-word', overflowY: 'auto', flex: 1 }}>
                        {selectedNumbers.length > 0 ? selectedNumbers.join(', ') : 'እስካሁን ምንም አልመረጡም'}
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: '#13132b',
                      borderRadius: '12px',
                      padding: '12px 6px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justify: 'center',
                      border: '1px solid #23234d',
                      flexShrink: 0
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '10px', color: '#f59e0b' }}>
                        🎰 የዕጣ ማውጫ
                      </div>
                      <div style={{
                        width: '110px',
                        height: '110px',
                        borderRadius: '50%',
                        background: '#0d0d1a',
                        border: winningNumber === 'SPINNING' ? '3px solid #00f2fe' : (winningNumber !== '?' && winningNumber !== 'NONE' ? '3px solid #00ffcc' : '3px solid #e11d48'),
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        boxShadow: winningNumber === 'SPINNING' ? '0 0 20px rgba(0, 242, 254, 0.6)' : (winningNumber !== '?' && winningNumber !== 'NONE' ? '0 0 20px rgba(0, 255, 204, 0.6)' : '0 0 15px rgba(225, 29, 72, 0.3)'),
                        transition: 'all 0.3s ease',
                        position: 'relative'
                      }}>
                        {winningNumber === 'SPINNING' ? (
                          <div className="spin-arrow-container" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="80" height="80" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="40" fill="none" stroke="#00f2fe" strokeWidth="2" strokeDasharray="6 6" />
                              <polygon points="50,15 58,45 50,40 42,45" fill="#00f2fe" />
                              <polygon points="50,85 58,55 50,60 42,55" fill="#f59e0b" />
                              <circle cx="50" cy="50" r="7" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                            </svg>
                          </div>
                        ) : winningNumber === 'NONE' ? (
                          <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold', textAlign: 'center' }}>አልተመረጠም</span>
                        ) : (
                          <span style={{
                            fontSize: winningNumber === '?' ? '42px' : '38px',
                            fontWeight: 'bold',
                            color: winningNumber === '?' ? '#ffffff' : '#00ffcc',
                            textShadow: winningNumber === '?' ? 'none' : '0 0 12px #00ffcc'
                          }}>
                            {winningNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {winnerInfo && (
                      <div style={{
                        marginTop: '4px',
                        padding: '8px',
                        backgroundColor: '#064e3b',
                        border: '2px solid #10b981',
                        borderRadius: '10px',
                        textAlign: 'center',
                        boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
                      }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#34d399' }}> 🎉 ዕጣው ወጥቷል! </div>
                        <div style={{ fontSize: '14px', fontWeight: '900', color: '#facc15', margin: '2px 0' }}> አሸናፊ ቁጥር: #{winnerInfo.number} </div>
                        <div style={{ fontSize: '10px', color: '#ffffff', fontWeight: '600' }}> 👤 {winnerInfo.userName} </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {currentTab === 'history' && (
          <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>📜 Game History</h1>
            <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #2a2a4a' }}>
              <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '6px' }}>Total Games Played</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{totalGames}</div>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '12px' }}>Your Winning History</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {gameHistory.length > 0 ? (
                gameHistory.map((item, idx) => (
                  <div key={idx} style={{ backgroundColor: '#181830', border: '1px solid #2a2a4a', borderRadius: '10px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#38bdf8' }}>Winning Num: #{item.winningNumber}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Winner: {item.winnerName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#22c55e' }}>+{item.derash} ETB</div>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently'}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px', fontSize: '13px' }}>
                  ምንም የጨዋታ ታሪክ አልተገኘም።
                </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'wallet' && (
          <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>👛 Wallet & Transactions</h1>
              <span onClick={fetchUserData} style={{ fontSize: '18px', cursor: 'pointer', color: '#9ca3af' }}>🔄</span>
            </div>
            <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', border: '1px solid #2a2a4a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>👤</span>
                <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{userPhone || 'ስልክ አልተመዘገበም'}</span>
              </div>
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981', borderRadius: '20px', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold' }}>
                ✓ Verified
              </div>
            </div>

            <div style={{ backgroundColor: '#181830', borderRadius: '10px', padding: '4px', display: 'flex', marginBottom: '16px', border: '1px solid #2a2a4a' }}>
              <button onClick={() => setWalletTab('balance')} style={{ flex: 1, padding: '10px 0', borderRadius: '8px', border: 'none', backgroundColor: walletTab === 'balance' ? '#2a2a4a' : 'transparent', color: walletTab === 'balance' ? '#ffffff' : '#9ca3af', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>Balance</button>
            </div>

            {walletTab === 'balance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '14px', border: '1px solid #2a2a4a' }}>
                    <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>Main Wallet</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{mainWallet} ETB</div>
                  </div>
                  <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '14px', border: '1px solid #2a2a4a' }}>
                    <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>Play Wallet</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{playWallet} ETB</div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#181830', padding: '16px', borderRadius: '12px', border: '1px solid #2a2a4a' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>📥 Deposit (ገንዘብ ማስገቢያ ጥያቄ)</h4>
                  <input type="number" placeholder="መጠን (ETB)" value={depAmount} onChange={(e) => setDepAmount(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
                  <input type="text" placeholder="የክፍያ ማረጋገጫ / Transaction Ref / ፎቶ ሊንክ" value={depProof} onChange={(e) => setDepProof(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
                  <button onClick={handleDeposit} style={{ width: '100%', padding: '12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    የገቢ ጥያቄ ላክ (Submit Deposit)
                  </button>
                </div>

                <div style={{ backgroundColor: '#181830', padding: '16px', borderRadius: '12px', border: '1px solid #2a2a4a' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>📤 Withdraw (ገንዘብ ማውጫ ጥያቄ)</h4>
                  <input type="number" placeholder="መጠን (ETB)" value={withAmount} onChange={(e) => setWithAmount(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
                  <button onClick={handleWithdraw} style={{ width: '100%', padding: '12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    የወጪ ጥያቄ ላክ (Submit Withdraw)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentTab === 'profile' && (
          <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', marginBottom: '20px' }}>
              <div style={{ width: '75px', height: '75px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', color: '#ffffff', marginBottom: '12px', overflow: 'hidden', border: '2px solid #60a5fa' }}>
                {userPhoto ? (
                  <img src={userPhoto} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  userInitial
                )}
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>{userName}</h2>
              {tgUser?.username && <span style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>@{tgUser.username}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '14px', border: '1px solid #2a2a4a' }}>
                <div style={{ color: '#60a5fa', fontSize: '13px', marginBottom: '8px' }}>👛 Main Wallet</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{mainWallet} ETB</div>
              </div>
              <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '14px', border: '1px solid #2a2a4a' }}>
                <div style={{ color: '#34d399', fontSize: '13px', marginBottom: '8px' }}>👛 Play Wallet</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{playWallet} ETB</div>
              </div>
              <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '14px', border: '1px solid #2a2a4a' }}>
                <div style={{ color: '#c084fc', fontSize: '13px', marginBottom: '8px' }}>🏆 Games Won</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{gamesWon}</div>
              </div>
              <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '14px', border: '1px solid #2a2a4a' }}>
                <div style={{ color: '#f87171', fontSize: '13px', marginBottom: '8px' }}>👥 Total Invite</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{totalInvite}</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '16px', border: '1px solid #2a2a4a' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginTop: 0, marginBottom: '8px', color: '#f59e0b' }}>
                🎁 ጓደኞችዎን ይጋብዙ (Invite Friends)
              </h3>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px', lineHeight: '1.4' }}>
                የእርስዎን የመጋበዣ ሊንክ ለጓደኞችዎ በማጋራት በእያንዳንዱ የጋበዙት ሰው ተጨማሪ የ Play Wallet ቦነስ ያግኙ!
              </p>
              <button onClick={copyReferralLink} style={{ width: '100%', padding: '12px', backgroundColor: copiedLink ? '#10b981' : '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                {copiedLink ? '✓ የመጋበዣ ሊንኩ ተቀድቷል (Copied)' : '🔗 የመጋበዣ ሊንክ ቅዳ (Copy Invite Link)'}
              </button>
            </div>
          </div>
        )}

        {/* ADMIN TAB */}
        {isAdmin && currentTab === 'admin' && (
          <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>⚙️ Admin Control Panel</h1>
              <button onClick={fetchAdminData} style={{ backgroundColor: '#1e1b4b', color: '#38bdf8', border: '1px solid #312e81', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>🔄 Refresh Data</button>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button onClick={() => setAdminTab('users')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: adminTab === 'users' ? '#f59e0b' : '#1e1b4b', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>Users</button>
              <button onClick={() => setAdminTab('requests')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: adminTab === 'requests' ? '#f59e0b' : '#1e1b4b', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>Requests ({pendingTx.length})</button>
              <button onClick={() => setAdminTab('game_control')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: adminTab === 'game_control' ? '#f59e0b' : '#1e1b4b', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>Draw Control</button>
              <button onClick={() => setAdminTab('settings')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: adminTab === 'settings' ? '#f59e0b' : '#1e1b4b', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>Settings</button>
              <button onClick={() => setAdminTab('reports')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: adminTab === 'reports' ? '#f59e0b' : '#1e1b4b', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>Reports</button>
              <button onClick={() => setAdminTab('broadcast')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: adminTab === 'broadcast' ? '#f59e0b' : '#1e1b4b', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>Broadcast</button>
            </div>

            {adminTab === 'users' && (
              <>
                <input type="text" placeholder="በተጠቃሚ ID ወይም ስልክ ፈልግ..." value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', marginBottom: '16px', boxSizing: 'border-box' }} />
                {editingUser && (
                  <div style={{ backgroundColor: '#1b1b38', border: '1px solid #f59e0b', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '14px', color: '#f59e0b', margin: '0 0 10px 0' }}>ወደ ሂሳብ ማስተካከያ: {editingUser.userId}</h3>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10px', color: '#9ca3af' }}>Main Wallet:</label>
                        <input type="number" value={editMain} onChange={(e) => setEditMain(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #312e81', backgroundColor: '#0d0d1a', color: '#fff' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10px', color: '#9ca3af' }}>Play Wallet:</label>
                        <input type="number" value={editPlay} onChange={(e) => setEditPlay(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #312e81', backgroundColor: '#0d0d1a', color: '#fff' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleUpdateUserBalance} style={{ flex: 1, padding: '8px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>ሴቭ አድርግ</button>
                      <button onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '8px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px' }}>ሰርዝ</button>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredAdminUsers.map((u) => (
                    <div key={u.userId} style={{ backgroundColor: '#181830', border: '1px solid #2a2a4a', borderRadius: '10px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8' }}>{u.firstName || 'ተጠቃሚ'} (ID: {u.userId})</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>📱 {u.phone || 'ስልክ የለም'}</div>
                        <div style={{ fontSize: '11px', color: '#22c55e', marginTop: '2px' }}>Main: {u.mainWallet} ETB | Play: {u.playWallet} ETB</div>
                        <div style={{ fontSize: '10px', color: u.isBanned ? '#ef4444' : '#10b981', marginTop: '2px', fontWeight: 'bold' }}>Status: {u.isBanned ? 'Banned 🛑' : 'Active ✅'}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <button onClick={() => { setEditingUser(u); setEditMain(u.mainWallet); setEditPlay(u.playWallet); }} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                          አስተካክል
                        </button>
                        <button onClick={() => handleToggleBan(u.userId, u.isBanned)} style={{ backgroundColor: u.isBanned ? '#10b981' : '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                          {u.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {adminTab === 'requests' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pendingTx.length > 0 ? (
                  pendingTx.map((tx) => (
                    <div key={tx._id} style={{ backgroundColor: '#181830', border: '1px solid #2a2a4a', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', color: tx.type === 'deposit' ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                          {tx.type.toUpperCase()} REQUEST
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#facc15' }}>{tx.amount} ETB</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>User: {tx.userName} (ID: {tx.userId})</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>Phone: {tx.phone || 'N/A'}</div>
                      {tx.proof && <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '4px', wordBreak: 'break-all' }}>Proof: {tx.proof}</div>}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <button onClick={() => handleProcessTransaction(tx._id, 'approve')} style={{ flex: 1, padding: '8px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Approve ✅</button>
                        <button onClick={() => handleProcessTransaction(tx._id, 'reject')} style={{ flex: 1, padding: '8px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Reject ❌</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>ምንም የሚጠበቅ የክፍያ ጥያቄ የለም።</div>
                )}
              </div>
            )}

            {adminTab === 'game_control' && (
              <div style={{ backgroundColor: '#181830', padding: '16px', borderRadius: '12px', border: '1px solid #2a2a4a' }}>
                <h3 style={{ fontSize: '15px', color: '#f59e0b', marginTop: 0 }}>🎯 የዕጣ ቁጥር ማውጣት መቆጣጠሪያ (Draw Control)</h3>
                <p style={{ fontSize: '11px', color: '#9ca3af' }}>የሚቀጥለው የዕጣ ቁጥር በራስ-ሰር (Random) ሳይሆን እርስዎ በሚመርጡት ቁጥር እንዲወጣ ማድረግ ይችላሉ ።</p>
                <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#0f172a', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', color: '#38bdf8' }}>
                    የተያዘው Manual ቁጥር፡ {sysSettings.manualWinningNumber !== null ? `#${sysSettings.manualWinningNumber}` : 'የለም (በራስ-ሰር ይወጣል)'}
                  </div>
                </div>
                <input type="number" placeholder="የአሸናፊ ቁጥር ያስገቡ (1-1000)" value={manualNumberInput} onChange={(e) => setManualNumberInput(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', marginBottom: '12px', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleSetManualWinner} style={{ flex: 1, padding: '10px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    ቁጥሩን መዝግብ (Set Manual Number)
                  </button>
                  {sysSettings.manualWinningNumber !== null && (
                    <button onClick={() => handleUpdateSettings({ manualWinningNumber: null })} style={{ padding: '10px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                      ወደ ራስ-ሰር ቀይር (Reset)
                    </button>
                  )}
                </div>
              </div>
            )}

            {adminTab === 'settings' && (
              <div style={{ backgroundColor: '#181830', padding: '16px', borderRadius: '12px', border: '1px solid #2a2a4a' }}>
                <h3 style={{ fontSize: '15px', color: '#f59e0b', marginTop: 0 }}>⚙️ የሲስተም አጠቃላይ ሶፍትዌር ማስተካከያ</h3>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>የቲኬት ዋጋ (ETB):</label>
                  <input type="number" value={sysSettings.ticketPrice} onChange={(e) => setSysSettings({ ...sysSettings, ticketPrice: Number(e.target.value) })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>የአሸናፊዎች ድርሻ / ደራሽ የመቶኛ መጠን (%):</label>
                  <input type="number" value={sysSettings.winnerPercentage} onChange={(e) => setSysSettings({ ...sysSettings, winnerPercentage: Number(e.target.value) })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
                  <div style={{ fontSize: '10px', color: '#f59e0b', marginTop: '2px' }}>የሲስተም/ቤት ኮሚሽን መቶኛ፡ {100 - Number(sysSettings.winnerPercentage || 0)}% ይሆናል ።</div>
                </div>
                <button onClick={() => handleUpdateSettings()} style={{ width: '100%', padding: '12px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  ሴቲንግ አስቀምጥ (Save Settings)
                </button>
              </div>
            )}

            {adminTab === 'reports' && financialStats && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ backgroundColor: '#181830', padding: '16px', borderRadius: '10px', border: '1px solid #2a2a4a' }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>Total Deposits Approved</div>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#22c55e' }}>{financialStats.totalDeposit} ETB</div>
                </div>
                <div style={{ backgroundColor: '#181830', padding: '16px', borderRadius: '10px', border: '1px solid #2a2a4a' }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>Total Withdrawals Approved</div>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#ef4444' }}>{financialStats.totalWithdrawal} ETB</div>
                </div>
                <div style={{ backgroundColor: '#181830', padding: '16px', borderRadius: '10px', border: '1px solid #2a2a4a' }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>House Revenue / Net Profit</div>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#facc15' }}>{financialStats.houseProfit} ETB</div>
                </div>
              </div>
            )}

            {adminTab === 'broadcast' && (
              <div style={{ backgroundColor: '#181830', padding: '16px', borderRadius: '12px', border: '1px solid #2a2a4a' }}>
                <h3 style={{ fontSize: '15px', color: '#f59e0b', marginTop: 0 }}>📢 Broadcast Message to Users</h3>
                <textarea rows="4" placeholder="ለተጠቃሚዎች የሚላከውን መልዕክት እዚህ ይጻፉ..." value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', marginBottom: '12px', boxSizing: 'border-box' }} />
                <button onClick={handleSendBroadcast} style={{ width: '100%', padding: '12px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                  ለማንኛውም ተጠቃሚ ላክ (Send Broadcast)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {currentScreen !== 'board' && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          backgroundColor: '#0f0f26',
          borderTop: '1px solid #2a2a50',
          padding: '6px 4px 8px 4px',
          flexShrink: 0,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.4)',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <button onClick={() => setCurrentTab('game')} style={{ background: 'none', border: 'none', color: currentTab === 'game' ? '#38bdf8' : '#8e8ea8', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '11px', fontWeight: '600', padding: '4px 8px', borderRadius: '8px' }}>
            <span style={{ fontSize: '18px' }}>🎮</span> Game
          </button>
          <button onClick={() => setCurrentTab('history')} style={{ background: 'none', border: 'none', color: currentTab === 'history' ? '#38bdf8' : '#8e8ea8', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '11px', fontWeight: '600', padding: '4px 8px', borderRadius: '8px' }}>
            <span style={{ fontSize: '18px' }}>📜</span> History
          </button>
          <button onClick={() => setCurrentTab('wallet')} style={{ background: 'none', border: 'none', color: currentTab === 'wallet' ? '#38bdf8' : '#8e8ea8', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '11px', fontWeight: '600', padding: '4px 8px', borderRadius: '8px' }}>
            <span style={{ fontSize: '18px' }}>👛</span> Wallet
          </button>
          <button onClick={() => setCurrentTab('profile')} style={{ background: 'none', border: 'none', color: currentTab === 'profile' ? '#38bdf8' : '#8e8ea8', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '11px', fontWeight: '600', padding: '4px 8px', borderRadius: '8px' }}>
            <span style={{ fontSize: '18px' }}>👤</span> Profile
          </button>
          {isAdmin && (
            <button onClick={() => { setCurrentTab('admin'); fetchAdminData(); }} style={{ background: 'none', border: 'none', color: currentTab === 'admin' ? '#f59e0b' : '#8e8ea8', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '11px', fontWeight: '600', padding: '4px 8px', borderRadius: '8px' }}>
              <span style={{ fontSize: '18px' }}>⚙️</span> Admin
            </button>
          )}
        </div>
      )}
    </div>
  );
}