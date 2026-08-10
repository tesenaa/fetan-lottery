import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { io } from 'socket.io-client';

const API_BASE_URL = "https://fetan-lottery-backend.onrender.com";

export default function App() {
  const socket = useMemo(() => io(API_BASE_URL, { 
    autoConnect: true,
    transports: ['polling', 'websocket']
  }), []);

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
  const [playerCount, setPlayerCount] = useState(0);
  const [derash, setDerash] = useState(0);
  const [phase, setPhase] = useState('selecting');
  const [selectionTime, setSelectionTime] = useState(50);
  const [winningNumber, setWinningNumber] = useState('?');
  const [winnerInfo, setWinnerInfo] = useState(null);
  const [depAmount, setDepAmount] = useState('');
  const [withAmount, setWithAmount] = useState('');

  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const userId = tgUser?.id ? String(tgUser.id) : 'GUEST_USER';
  const userName = tgUser ? (tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : '')) : 'ተጫዋች';
  const userPhone = tgUser?.phone_number || 'ስልክ አልተመዘገበም';
  const userInitial = userName ? userName.charAt(0).toUpperCase() : 'T';

  const updateBoardStats = useCallback((allSelectedList) => {
    if (allSelectedList && Array.isArray(allSelectedList)) {
      const uniquePlayers = new Set(
        allSelectedList.map(item => typeof item === 'object' ? String(item.userId) : String(item))
      ).size;
      setPlayerCount(uniquePlayers);
      const totalSelectedCount = allSelectedList.length;
      const calculatedDerash = Math.floor(totalSelectedCount * stake * 0.8);
      setDerash(calculatedDerash);
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
      }
    } catch (err) {
      console.error("Data Fetch Error:", err);
    }
  }, [userId]);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("✅ Socket በተሳካ ሁኔታ ተገናኝቷል! ID:", socket.id);
    });
    socket.on("connect_error", (err) => {
      console.log("❌ የ Socket ግንኙነት አልተሳካም! ስህተት:", err.message);
    });
  }, [socket]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
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

    socket.on('stats_updated', (data) => {
      if (!data) return;
      setActiveCount(data.activePlayersFormatted || data.activePlayers);
      setRegisteredCount(data.totalRegisteredFormatted || data.totalRegistered);
    });

    socket.on('game_result', (data) => {
  if (!data || data.winningNumber === 'NONE') return; // ቁጥር ካልተመረጠ 采用 አያደርግም

  setPhase('spinning');
  setWinningNumber('SPINNING');

  spinTimeout = setTimeout(() => {
    setPhase('result');
    const winNum = data.winningNumber;
    setWinningNumber(winNum);

    const winItem = data.selectedNumbers?.find(
      n => typeof n === 'object' && String(n.number) === String(winNum)
    );

    if (winItem) {
      setWinnerInfo({
        number: winNum,
        userName: winItem.userName || `@user_${winItem.userId}`,
        derash: data.derash !== undefined ? data.derash : derash
      });
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
      clearTimeout(spinTimeout);
      clearTimeout(resultTimeout);
    };
  }, [socket, userId, updateBoardStats, fetchUserData, derash]);

  const toggleNumber = (num) => {
    if (phase !== 'selecting') return;
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(prev => prev.filter(n => n !== num));
      setAllPickedNumbers(prev => prev.filter(n => n !== num));
      socket.emit('deselect_number', { numberChosen: num, userId });
    } else {
      setSelectedNumbers(prev => [...prev, num]);
      setAllPickedNumbers(prev => [...prev, num]);
      socket.emit('select_number', { numberChosen: num, userId, userName });
    }
  };

  const handleDeposit = async () => {
    if (!depAmount || Number(depAmount) <= 0) return alert("እባክዎ ትክክለኛ መጠን ያስገቡ!");
    try {
      const res = await fetch(`${API_BASE_URL}/api/deposit`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Remainder': 'true'
        },
        body: JSON.stringify({ userId, amount: depAmount })
      });
      const data = await res.json();
      if (data.success) {
        setMainWallet(data.balance);
        setDepAmount('');
        alert("ገንዘቡ በተሳካ ሁኔታ ገቢ ሆኗል!");
      }
    } catch (err) {
      alert("የገንዘብ ማስገባት ስህተት አጋጥሟል!");
    }
  };
 const handleWithdraw = async () => {
    if (!withAmount || Number(withAmount) <= 0) return alert("እባክዎ ትክክለኛ መጠን ያስገቡ!");
    try {
      const res = await fetch(`${API_BASE_URL}/api/withdraw`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Remainder': 'true'
        },
        body: JSON.stringify({ userId, amount: withAmount, phone: userPhone })
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

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', backgroundColor: '#0c0c1e', color: '#ffffff', height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', boxSizing: 'border-box', overflow: 'hidden' }}>
      <style>{`
        @keyframes arrowSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin-arrow-container { animation: arrowSpin 0.5s linear infinite; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #312e81; border-radius: 4px; }
      `}</style>
      
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {currentTab === 'game' && (
          <>
            {currentScreen === 'home' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center' }}>
                  Welcome to <span style={{ color: '#f59e0b' }}>Fetan Lottery</span>
                </h1>
                <div style={{ width: '100%', backgroundColor: '#15152a', border: '1px solid #ef4444', borderRadius: '16px', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)', marginBottom: '20px', boxSizing: 'border-box' }}>
                  <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 'bold', marginBottom: '16px' }}> Choose Your Stake </div>
                  <button onClick={() => { setStake(10); setCurrentScreen('board'); }} style={{ width: '100%', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '12px' }}> ► Play 10 ETB </button>
                  <button onClick={() => { setStake(20); setCurrentScreen('board'); }} style={{ width: '100%', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}> ► Play 20 ETB </button>
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
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', backgroundColor: '#0a0a16', borderBottom: '1px solid #1e1b4b', flexShrink: 0 }}>
                  <button onClick={() => setCurrentScreen('home')} style={{ backgroundColor: '#1e1b4b', color: '#38bdf8', border: '1px solid #312e81', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}> ← Back </button>
                  
                  <button onClick={() => fetchUserData()} style={{ backgroundColor: '#1e1b4b', color: '#22c55e', border: '1px solid #312e81', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}> 🔄 Refresh </button>
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
                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', flex: 1, padding: '0 8px 8px 8px', overflow: 'hidden' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: phase === 'spinning' ? (allPickedNumbers.length > 0 ? '#dc2626' : '#6b7280') : '#0284c7', padding: '5px', borderRadius: '6px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>
                      {phase === 'spinning' ? (allPickedNumbers.length > 0 ? '🎰 ዕጣ እየወጣ ነው...' : '⚠️ ምንም ቁጥር አልተመረጠም!') : '⏳ የምርጫ ጊዜ፡ ' + selectionTime + ' ሰከንድ'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', overflowY: 'auto', alignContent: 'start', paddingRight: '2px', flex: 1 }}>
                      {Array.from({ length: 90 }, (_, i) => i + 1).map((num) => {
                        const isMine = selectedNumbers.includes(num);
                        const isOthers = allPickedNumbers.includes(num) && !isMine;
                        let bgColor = '#2a2a40';
                        if (isMine) bgColor = '#22c55e';
                        else if (isOthers) bgColor = '#ef4444';
 return (
                          <button key={num} onClick={() => toggleNumber(num)} disabled={phase !== 'selecting'  || isOthers} style={{ padding: '8px 0', backgroundColor: bgColor, color: '#ffffff', border: '1px solid #3d3d5c', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: (phase !== 'selecting' || isOthers) ? 'not-allowed' : 'pointer', opacity: (phase !== 'selecting' || isOthers) ? 0.6 : 1 }}>
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, justifyContent: 'flex-start', overflowY: 'auto' }}>
                    <div style={{ backgroundColor: '#1b1b32', borderRadius: '8px', padding: '6px 8px', minHeight: '65px', maxHeight: '90px', border: '1px solid #312e81', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                      <div style={{ fontSize: '10px', color: '#38bdf8', marginBottom: '2px', fontWeight: 'bold' }}> 📌 የተመረጡ ቁጥሮች ({selectedNumbers.length}): </div>
                      <div style={{ fontSize: '10px', color: '#9ca3af', lineHeight: '1.2', wordBreak: 'break-word', overflowY: 'auto', flex: 1 }}>
                        {selectedNumbers.length > 0 ? selectedNumbers.join(', ') : 'እስካሁን ምንም አልመረጡም'}
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#13132b', borderRadius: '12px', padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #23234d', flexShrink: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '10px', color: '#f59e0b' }}> 🎰 የዕጣ ማውጫ </div>
                      <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: '#0d0d1a', border: winningNumber === 'SPINNING' ? '3px solid #00f2fe' : (winningNumber !== '?' && winningNumber !== 'NONE' ? '3px solid #00ffcc' : '3px solid #e11d48'), display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: winningNumber === 'SPINNING' ? '0 0 20px rgba(0, 242, 254, 0.6), inset 0 0 10px rgba(0, 242, 254, 0.4)' : (winningNumber !== '?' && winningNumber !== 'NONE' ? '0 0 20px rgba(0, 255, 204, 0.6)' : '0 0 15px rgba(225, 29, 72, 0.3)'), transition: 'all 0.3s ease', position: 'relative' }}>
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
                          <span style={{ fontSize: winningNumber === '?' ? '42px' : '38px', fontWeight: 'bold', color: winningNumber === '?' ? '#ffffff' : '#00ffcc', textShadow: winningNumber === '?' ? 'none' : '0 0 12px #00ffcc' }}>
                            {winningNumber}
                          </span>
 )}
                      </div>
                    </div>

                    // App.jsx ውስጥ winnerInfo የሚታይበት ክፍል (Conditional Rendering)

{winnerInfo && winnerInfo.number && winnerInfo.number !== 'NONE' && winnerInfo.number !== '?' && (
  <div style={{ backgroundColor: '#064e3b', border: '1px solid #10b981', borderRadius: '10px', padding: '10px 8px', textAlign: 'center', boxShadow: '0 0 16px rgba(16, 185, 129, 0.5)', flexShrink: 0 }}>
    <div style={{ fontSize: '11px', color: '#a7f3d0', fontWeight: 'bold' }}>🎉 ዕጣው ወጥቷል!</div>
    <div style={{ fontSize: '13px', color: '#facc15', fontWeight: 'bold', marginTop: '4px' }}> አሸናፊ ቁጥር: #{winnerInfo.number} </div>
    <div style={{ fontSize: '10px', color: '#ffffff', marginTop: '4px' }}> 👤 {winnerInfo.userName} </div>
  </div>
)}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {currentTab === 'history' && (
          <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '16px' }}>Game History</h1>
            <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '16px', marginBottom: '24px', border: '1px solid #2a2a4a' }}>
              <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '6px' }}>Total Games</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{totalGames}</div>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>Recent Games</div>
          </div>
        )}

        {currentTab === 'wallet' && (
          <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>👛 Wallet & Transactions</h1>
              <span onClick={fetchUserData} style={{ fontSize: '18px', cursor: 'pointer', color: '#9ca3af' }}>🔄</span>
            </div>
            <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', border: '1px solid #2a2a4a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>👤</span>
                <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{userPhone}</span>
              </div>
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981', borderRadius: '20px', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold' }}> ✓ Verified </div>
            </div>
            <div style={{ backgroundColor: '#181830', borderRadius: '10px', padding: '4px', display: 'flex', marginBottom: '16px', border: '1px solid #2a2a4a' }}>
              <button onClick={() => setWalletTab('balance')} style={{ flex: 1, padding: '10px 0', borderRadius: '8px', border: 'none', backgroundColor: walletTab === 'balance' ? '#2a2a4a' : 'transparent', color: walletTab === 'balance' ? '#ffffff' : '#9ca3af', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>Balance</button>
              <button onClick={() => setWalletTab('history')} style={{ flex: 1, padding: '10px 0', borderRadius: '8px', border: 'none', backgroundColor: walletTab === 'history' ? '#2a2a4a' : 'transparent', color: walletTab === 'history' ? '#ffffff' : '#9ca3af', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>History</button>
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
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>📥 Deposit (ገንዘብ ማስገቢያ)</h4>
                  <input type="number" placeholder="መጠን (ETB)" value={depAmount} onChange={(e) => setDepAmount(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
                  <button onClick={handleDeposit} style={{ width: '100%', padding: '12px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}> ገንዘብ አስገባ (Deposit) </button>
                </div>
                <div style={{ backgroundColor: '#181830', padding: '16px', borderRadius: '12px', border: '1px solid #2a2a4a' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>📤 Withdraw (ገንዘብ ማውጫ)</h4>
                  <input type="number" placeholder="መጠን (ETB)" value={withAmount} onChange={(e) => setWithAmount(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
                  <button onClick={handleWithdraw} style={{ width: '100%', padding: '12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}> ገንዘብ ወጪ አድርግ (Withdraw) </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentTab === 'profile' && (
          <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', marginBottom: '24px' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', color: '#ffffff', marginBottom: '12px' }}> {userInitial} </div>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>{userName}</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
              <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '14px', border: '1px solid #2a2a4a' }}>
                <div style={{ color: '#60a5fa', fontSize: '13px', marginBottom: '8px' }}>👛 Main Wallet</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{mainWallet} ETB</div>
              </div>
              <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '14px', border: '1px solid #2a2a4a' }}>
               <div style={{ color: '#34d399', fontSize: '13px', marginBottom: '8px' }}>👛 Play Wallet</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{playWallet} ETB</div>
              </div>
              <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '14px', border: '1px solid #2a2a4a' }}>
                <div style={{ color: '#c084fc', fontSize: '13px', marginBottom: '8px' }}>🏆 Games Won</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{gamesWon}</div>
              </div>
              <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '14px', border: '1px solid #2a2a4a' }}>
                <div style={{ color: '#f87171', fontSize: '13px', marginBottom: '8px' }}>👥 Total Invite</div>
                <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{totalInvite}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {currentScreen !== 'board' && (
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#0f0f26', borderTop: '1px solid #2a2a50', padding: '6px 4px 8px 4px', flexShrink: 0, boxShadow: '0 -4px 12px rgba(0,0,0,0.4)' }}>
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
        </div>
      )}
    </div>
  );
}