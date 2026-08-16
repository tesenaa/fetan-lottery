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
  const userId = useMemo(() => tgUser?.id ? String(tgUser.id) : 'GUEST_USER', [tgUser]);
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

  const numbersArray = useMemo(() => Array.from({ length: 1000 }, (_, i) => i + 1), []);

  const updateBoardStats = useCallback((allSelectedList) => {
    if (allSelectedList && Array.isArray(allSelectedList)) {
      const uniquePlayers = new Set(
        allSelectedList.map(item => typeof item === 'object' ? String(item.userId) : String(item))
      ).size;
      setPlayerCount(uniquePlayers);
      setDerash(Math.floor(allSelectedList.length * stake * 0.8));
    }
  }, [stake]);

  const fetchUserData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user?id=${userId}`, {
        headers: { 'Bypass-Tunnel-Remainder': 'true' }
      });
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
      const [uRes, tRes, fRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/users`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/transactions`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/financial-stats`, { headers })
      ]);
      const uData = await uRes.json();
      const tData = await tRes.json();
      const fData = await fRes.json();

      if (uData.success) setAdminUsers(uData.users);
      if (tData.success) setPendingTx(tData.transactions);
      if (fData.success) setFinancialStats(fData.stats);
    } catch (err) {
      console.error("Admin Fetch Error:", err);
    }
  }, [isAdmin, userId]);

  const handleToggleBan = async (targetUserId, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/toggle-ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'admin-key': userId
        },
        body: JSON.stringify({ targetUserId, isBanned: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        alert("የተጠቃሚው status ተቀይሯል!");
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
        headers: {
          'Content-Type': 'application/json',
          'admin-key': userId
        },
        body: JSON.stringify({ targetUserId: editingUser.userId, mainWallet: editMain, playWallet: editPlay })
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
        headers: {
          'Content-Type': 'application/json',
          'admin-key': userId
        },
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
    if (!broadcastText) return alert("እባክዎን መልእክት ይጻፉ!");
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'admin-key': userId
        },
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
            alert(`🎉 እንኳን ደስ አለዎት! ዕጣው በቁጥር #${winNum} ለእርስዎ ወጥቷል! ${winAmount} ETB ወደ ዋሌትዎ ገቢ ሆኗል 💸`);
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
        alert("⚠️ የእርስዎ ቀሪ ሂሳብ በቂ አይደለም! እባክዎን አስቀድመው ገንዘብ ያስገቡ።");
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
      (u.userId && String(u.userId).includes(adminSearch)) ||
      (u.phone && u.phone.includes(adminSearch)) ||
      (u.firstName && u.firstName.toLowerCase().includes(adminSearch.toLowerCase()))
    );
  }, [adminUsers, adminSearch]);

  return (
    <div style={{
      maxWidth: '500px',
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
      ` }} />

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {currentTab === 'game' && (
          <>
            {currentScreen === 'home' && (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                boxSizing: 'border-box'
              }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center' }}>
                  Welcome to <span style={{ color: '#f59e0b' }}>Fetan Lottery</span>
                </h1>

                {isBanned && (
                  <div style={{
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    textAlign: 'center',
                    width: '100%',
                    fontWeight: 'bold'
                  }}>
                    ⚠️ አካውንትዎ በህግ ጥሰት ምክንያት የታገደ ነው (Banned)!
                  </div>
                )}

                <div style={{
                  width: '100%',
                  backgroundColor: '#15152a',
                  border: '1px solid #ef4444',
                  borderRadius: '16px',
                  padding: '24px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)',
                  marginBottom: '20px',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 'bold', marginBottom: '16px' }}>
                    Choose Your Stake
                  </div>
                  <button
                    onClick={() => { setStake(10); setCurrentScreen('board'); }}
                    style={{
                      width: '100%',
                      backgroundColor: '#22c55e',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '14px',
                      fontSize: '15px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      marginBottom: '12px'
                    }}
                  >
                    ► Play 10 ETB
                  </button>
                  <button
                    onClick={() => { setStake(20); setCurrentScreen('board'); }}
                    style={{
                      width: '100%',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '14px',
                      fontSize: '15px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    ► Play 20 ETB
                  </button>
                </div>

                <div style={{
                  width: '100%',
                  backgroundColor: '#1b1b38',
                  borderRadius: '16px',
                  padding: '20px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxSizing: 'border-box',
                  border: '1px solid #2d2d50'
                }}>
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
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 12px',
                  backgroundColor: '#0a0a16',
                  borderBottom: '1px solid #1e1b4b',
                  flexShrink: 0
                }}>
                  <button
                    onClick={() => setCurrentScreen('home')}
                    style={{
                      backgroundColor: '#1e1b4b',
                      color: '#38bdf8',
                      border: '1px solid #312e81',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => fetchUserData()}
                    style={{
                      backgroundColor: '#1e1b4b',
                      color: '#22c55e',
                      border: '1px solid #312e81',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    🔄 Refresh
                  </button>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '4px',
                  padding: '6px 8px 4px 8px',
                  flexShrink: 0
                }}>
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

                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', flex: 1, padding: '0 8px 8px 8px', overflow: 'hidden' }}>
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
                      {numbersArray.map((num) => {
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
                      justifyContent: 'center',
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
                        justifyContent: 'center',
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
                        marginTop: '12px',
                        padding: '12px',
                        backgroundColor: '#064e3b',
                        border: '2px solid #10b981',
                        borderRadius: '10px',
                        textAlign: 'center',
                        boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
                      }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#34d399', marginBottom: '4px' }}>
                          🎉 ዕጣው ወጥቷል!
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#facc15', margin: '4px 0' }}>
                          አሸናፊ ቁጥር: #{winnerInfo.number}
                        </div>
                        <div style={{ fontSize: '12px', color: '#ffffff', fontWeight: '600', marginTop: '6px' }}>
                          👤 አሸናፊው፡ {winnerInfo.userName}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* WALLET TAB */}
        {currentTab === 'wallet' && (
          <div style={{ padding: '16px', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>💰 Wallet Management</h2>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button onClick={() => setWalletTab('balance')} style={{ flex: 1, padding: '8px', borderRadius: '6px', backgroundColor: walletTab === 'balance' ? '#0284c7' : '#1e1b4b', color: '#fff', border: 'none' }}>Balance</button>
              <button onClick={() => setWalletTab('deposit')} style={{ flex: 1, padding: '8px', borderRadius: '6px', backgroundColor: walletTab === 'deposit' ? '#0284c7' : '#1e1b4b', color: '#fff', border: 'none' }}>Deposit</button>
              <button onClick={() => setWalletTab('withdraw')} style={{ flex: 1, padding: '8px', borderRadius: '6px', backgroundColor: walletTab === 'withdraw' ? '#0284c7' : '#1e1b4b', color: '#fff', border: 'none' }}>Withdraw</button>
            </div>

            {walletTab === 'balance' && (
              <div style={{ backgroundColor: '#15152a', padding: '16px', borderRadius: '12px' }}>
                <p>Main Wallet: <strong>{mainWallet} ETB</strong></p>
                <p>Play Bonus Wallet: <strong>{playWallet} ETB</strong></p>
              </div>
            )}

            {walletTab === 'deposit' && (
              <div style={{ backgroundColor: '#15152a', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="number" placeholder="Amount (ETB)" value={depAmount} onChange={e => setDepAmount(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #3d3d5c' }} />
                <input type="text" placeholder="Transaction Ref / Proof" value={depProof} onChange={e => setDepProof(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #3d3d5c' }} />
                <button onClick={handleDeposit} style={{ padding: '10px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Submit Deposit</button>
              </div>
            )}

            {walletTab === 'withdraw' && (
              <div style={{ backgroundColor: '#15152a', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="number" placeholder="Amount (ETB)" value={withAmount} onChange={e => setWithAmount(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #3d3d5c' }} />
                <button onClick={handleWithdraw} style={{ padding: '10px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Request Withdrawal</button>
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {currentTab === 'profile' && (
          <div style={{ padding: '16px', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>👤 User Profile</h2>
            <div style={{ backgroundColor: '#15152a', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p>Name: <strong>{userName}</strong></p>
              <p>ID: <strong>{userId}</strong></p>
              <p>Phone: <strong>{userPhone}</strong></p>
              <p>Games Won: <strong>{gamesWon}</strong></p>
              <button onClick={copyReferralLink} style={{ padding: '8px', backgroundColor: '#38bdf8', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                {copiedLink ? "✓ Link Copied!" : "📋 Copy Invite Link"}
              </button>
            </div>
          </div>
        )}

        {/* ADMIN TAB */}
        {currentTab === 'admin' && isAdmin && (
          <div style={{ padding: '16px', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>🛠️ Admin Dashboard</h2>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button onClick={() => { setAdminTab('users'); fetchAdminData(); }} style={{ flex: 1, padding: '6px', borderRadius: '6px', backgroundColor: adminTab === 'users' ? '#0284c7' : '#1e1b4b', color: '#fff', border: 'none' }}>Users</button>
              <button onClick={() => { setAdminTab('tx'); fetchAdminData(); }} style={{ flex: 1, padding: '6px', borderRadius: '6px', backgroundColor: adminTab === 'tx' ? '#0284c7' : '#1e1b4b', color: '#fff', border: 'none' }}>Transactions</button>
              <button onClick={() => setAdminTab('broadcast')} style={{ flex: 1, padding: '6px', borderRadius: '6px', backgroundColor: adminTab === 'broadcast' ? '#0284c7' : '#1e1b4b', color: '#fff', border: 'none' }}>Broadcast</button>
            </div>

            {adminTab === 'users' && (
              <div>
                <input type="text" placeholder="Search Users..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', marginBottom: '10px', boxSizing: 'border-box' }} />
                {filteredAdminUsers.map(u => (
                  <div key={u.userId} style={{ backgroundColor: '#15152a', padding: '10px', borderRadius: '8px', marginBottom: '8px', fontSize: '12px' }}>
                    <p><strong>{u.firstName || 'User'}</strong> ({u.userId})</p>
                    <p>Main: {u.mainWallet} | Play: {u.playWallet}</p>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <button onClick={() => handleToggleBan(u.userId, u.isBanned)} style={{ padding: '4px 8px', backgroundColor: u.isBanned ? '#22c55e' : '#ef4444', color: '#fff', border: 'none', borderRadius: '4px' }}>
                        {u.isBanned ? 'Unban' : 'Ban'}
                      </button>
                      <button onClick={() => { setEditingUser(u); setEditMain(u.mainWallet); setEditPlay(u.playWallet); }} style={{ padding: '4px 8px', backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px' }}>Edit Balance</button>
                    </div>
                  </div>
                ))}

                {editingUser && (
                  <div style={{ backgroundColor: '#1e1b4b', padding: '12px', borderRadius: '8px', marginTop: '10px' }}>
                    <h4>Editing: {editingUser.userId}</h4>
                    <input type="number" value={editMain} onChange={e => setEditMain(Number(e.target.value))} placeholder="Main Balance" style={{ width: '100%', padding: '6px', marginBottom: '6px' }} />
                    <input type="number" value={editPlay} onChange={e => setEditPlay(Number(e.target.value))} placeholder="Play Balance" style={{ width: '100%', padding: '6px', marginBottom: '6px' }} />
                    <button onClick={handleUpdateUserBalance} style={{ padding: '6px 12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px' }}>Save</button>
                    <button onClick={() => setEditingUser(null)} style={{ padding: '6px 12px', backgroundColor: '#6b7280', color: '#fff', border: 'none', borderRadius: '4px', marginLeft: '6px' }}>Cancel</button>
                  </div>
                )}
              </div>
            )}

            {adminTab === 'tx' && (
              <div>
                {pendingTx.map(tx => (
                  <div key={tx._id || tx.id} style={{ backgroundColor: '#15152a', padding: '10px', borderRadius: '8px', marginBottom: '8px', fontSize: '12px' }}>
                    <p>Type: <strong>{tx.type}</strong> | Amount: <strong>{tx.amount} ETB</strong></p>
                    <p>User: {tx.userName} ({tx.userId})</p>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <button onClick={() => handleProcessTransaction(tx._id || tx.id, 'approve')} style={{ padding: '4px 8px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px' }}>Approve</button>
                      <button onClick={() => handleProcessTransaction(tx._id || tx.id, 'reject')} style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px' }}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {adminTab === 'broadcast' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea rows={4} value={broadcastText} onChange={e => setBroadcastText(e.target.value)} placeholder="Enter broadcast message..." style={{ padding: '8px', borderRadius: '6px' }} />
                <button onClick={handleSendBroadcast} style={{ padding: '10px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>Send Broadcast</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION BAR */}
      <div style={{
        display: 'flex',
        justify: 'space-around',
        alignItems: 'center',
        backgroundColor: '#0a0a16',
        borderTop: '1px solid #1e1b4b',
        padding: '10px 0',
        flexShrink: 0
      }}>
        <button onClick={() => setCurrentTab('game')} style={{ backgroundColor: 'transparent', color: currentTab === 'game' ? '#38bdf8' : '#9ca3af', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>🎮 Game</button>
        <button onClick={() => setCurrentTab('wallet')} style={{ backgroundColor: 'transparent', color: currentTab === 'wallet' ? '#38bdf8' : '#9ca3af', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>💰 Wallet</button>
        <button onClick={() => setCurrentTab('profile')} style={{ backgroundColor: 'transparent', color: currentTab === 'profile' ? '#38bdf8' : '#9ca3af', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>👤 Profile</button>
        {isAdmin && (
          <button onClick={() => setCurrentTab('admin')} style={{ backgroundColor: 'transparent', color: currentTab === 'admin' ? '#f59e0b' : '#9ca3af', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>🛠️ Admin</button>
        )}
      </div>
    </div>
  );
}