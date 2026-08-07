 import React, { useState, useEffect, useRef } from 'react';

// ⚠️ የራስህን Backend Server API URL እዚህ ጋር ተካ
const API_BASE_URL = "https://your-backend-api.com/api";

export default function App() {
  // 1. Navigation States
  const [currentTab, setCurrentTab] = useState('game'); 
  const [currentScreen, setCurrentScreen] = useState('home'); 
  const [stake, setStake] = useState(10); 

  // 2. Dynamic User Stats & Wallet
  const [registeredCount, setRegisteredCount] = useState(0); 
  const [activeCount, setActiveCount] = useState(0);        
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [walletTab, setWalletTab] = useState('balance'); 

  const [mainWallet, setMainWallet] = useState(0);
  const [playWallet, setPlayWallet] = useState(0);
  const [gamesWon, setGamesWon] = useState(0);
  const [totalInvite, setTotalInvite] = useState(0);
  const [totalEarning, setTotalEarning] = useState(0);
  const [totalGames, setTotalGames] = useState(0);

  // 3. Game States
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [allPickedNumbers, setAllPickedNumbers] = useState([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [phase, setPhase] = useState('selection'); 
  const [selectionTime, setSelectionTime] = useState(54);
  const [winningNumber, setWinningNumber] = useState('?');
  const [winnerInfo, setWinnerInfo] = useState(null);

  const allPickedRef = useRef(allPickedNumbers);
  allPickedRef.current = allPickedNumbers;

  // Telegram WebApp API Integration
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const userId = tgUser?.id || 'GUEST_USER';
  const userName = tgUser ? (tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : '')) : 'ተጫዋች';
  const userPhone = tgUser?.phone_number || 'ስልክ አልተመዘገበም';
  const userInitial = userName ? userName.charAt(0).toUpperCase() : 'T';

  // 🔄 1. አውቶማቲክ ዳታ የመሳቢያ API FUNCTION
  const fetchUserData = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/user?id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setMainWallet(data.mainWallet || 0);
        setPlayWallet(data.playWallet || 0);
        setGamesWon(data.gamesWon || 0);
        setTotalInvite(data.totalInvite || 0);
        setTotalEarning(data.totalEarning || 0);
        setTotalGames(data.totalGames || 0);
        setActiveCount(data.activeCount || 0);
        setRegisteredCount(data.registeredCount || 0);
      }
    } catch (err) {
      console.error("Data Fetch Error:", err);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const formatStats = (num) => {
    if (num < 1000) return num.toString();
    return Math.floor(num / 1000) * 1000 + "+";
  };

  // 60-second Cycle Timer (54s Selection + 6s Spin)
  useEffect(() => {
    if (currentScreen !== 'board') return;

    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const cycleSeconds = now % 60;

      if (cycleSeconds < 54) {
        setPhase('selection');
        setSelectionTime(54 - cycleSeconds);

        if (cycleSeconds === 0) {
          setSelectedNumbers([]);
          setAllPickedNumbers([]);
          setPlayerCount(0);
          setWinningNumber('?');
          setWinnerInfo(null);
        }
      } else {
        setPhase('spinning');
        setSelectionTime(0);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentScreen]);

  // Spin Logic
  useEffect(() => {
    if (currentScreen === 'board' && phase === 'spinning') {
      const picked = allPickedRef.current;
      if (picked.length > 0) {
        setWinningNumber('SPINNING');

        const currentDerash = Math.floor(picked.length * stake * 0.8);

        const drawTimeout = setTimeout(() => {
          const randomIndex = Math.floor(Math.random() * picked.length);
              const winnerNum = picked[randomIndex];
          
          setWinningNumber(winnerNum);
          
          setWinnerInfo({ 
            number: winnerNum, 
            name: userName,
            derash: currentDerash 
          });

          fetch(`${API_BASE_URL}/game-result`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, winnerNum, derash: currentDerash })
          }).then(() => fetchUserData()).catch(() => {});

          setTimeout(() => {
            setWinnerInfo(null);
          }, 5000);

        }, 3000);

        return () => clearTimeout(drawTimeout);
      } else {
        setWinningNumber('አልተመረጠም');
        setWinnerInfo(null);
      }
    }
  }, [phase, userName, currentScreen, stake, userId]);

  const handleStartGame = (selectedStake) => {
    setStake(selectedStake);
    setCurrentScreen('board');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setSelectedNumbers([]);
    setAllPickedNumbers([]);
    setWinningNumber('?');
    setWinnerInfo(null);
  };

  // ✅ ሁለቱንም array (selectedNumbers እና allPickedNumbers) በትክክል የሚጨምር/ሚቀንስ
  const toggleNumber = async (num) => {
    if (phase === 'spinning') return;

    let updatedSelected;
    let updatedAll;

    if (selectedNumbers.includes(num)) {
      updatedSelected = selectedNumbers.filter((n) => n !== num);
      updatedAll = allPickedNumbers.filter((n) => n !== num);
    } else {
      updatedSelected = [...selectedNumbers, num];
      updatedAll = [...allPickedNumbers, num];
    }

    if (selectedNumbers.length === 0 && updatedSelected.length > 0) {
      setPlayerCount((prev) => prev + 1);
    } else if (selectedNumbers.length > 0 && updatedSelected.length === 0) {
      setPlayerCount((prev) => Math.max(0, prev - 1));
    }

    setSelectedNumbers(updatedSelected);
    setAllPickedNumbers(updatedAll);

    try {
      await fetch(`${API_BASE_URL}/select-number`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          userName: userName,
          selectedNumber: num,
          stake: stake
        })
      });
    } catch (error) {
      console.error("ቁጥሩን መላክ አልተቻለም:", error);
    }
  };

  const totalPool = allPickedNumbers.length * stake;
  const derash = Math.floor(totalPool * 0.8);

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
      <style>{`
        @keyframes arrowSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin-arrow-container {
          animation: arrowSpin 0.4s linear infinite;
        }`
      }</style>

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
                <h1 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  marginBottom: '24px',
                  textAlign: 'center'
                }}>
                  Welcome to <span style={{ color: '#f59e0b' }}>Fetan Lottery</span>
                </h1>
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
                  <div style={{
                    fontSize: '14px',
                    color: '#f59e0b',
                    fontWeight: 'bold',
                    marginBottom: '16px'
                  }}>
                    Choose Your Stake
                  </div>

                  <button
                    onClick={() => handleStartGame(10)}
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
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    ► Play 10 ETB
                  </button>

                  <button
                    onClick={() => handleStartGame(20)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '14px',
                      fontSize: '15px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
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
                    <div style={{ fontSize: '22px', fontWeight: 'bold' }}>
                      {formatStats(activeCount)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                      Active Users
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid #2d2d50', paddingTop: '12px' }}>
                    <div style={{ fontSize: '22px', fontWeight: 'bold' }}>
                      {formatStats(registeredCount)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                      Registered Users
                    </div>
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
                    onClick={handleBackToHome}
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

                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '8px',
                  flex: 1,
                  padding: '0 8px 8px 8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      backgroundColor: phase === 'spinning' ? (allPickedNumbers.length > 0 ? '#dc2626' : '#6b7280') : '#0284c7',
                      padding: '5px',
                      borderRadius: '6px',
                       textAlign: 'center',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {phase === 'spinning' 
                        ? (allPickedNumbers.length > 0 
                            ? '🎰 ዕጣ እየወጣ ነው...' 
                            : '⚠️ ምንም ቁጥር አልተመረጠም!')
                        : '⏳ የመምረጫ ጊዜ፦ ' + selectionTime + ' ሰከንድ'}
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '3px',
                      overflowY: 'auto',
                      alignContent: 'start',
                      paddingRight: '2px',
                      flex: 1
                    }}>
                      {Array.from({ length: 100 }, (_, i) => i + 1).map((num) => {
                        const isSelected = selectedNumbers.includes(num);
                        return (
                          <button
                            key={num}
                            onClick={() => toggleNumber(num)}
                            disabled={phase === 'spinning'}
                            style={{
                              padding: '7px 0',
                              backgroundColor: isSelected ? '#22c55e' : '#2a2a40',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 'bold',
                              cursor: phase === 'spinning' ? 'not-allowed' : 'pointer',
                              opacity: phase === 'spinning' ? 0.6 : 1
                            }}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{
                    width: '170px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    flexShrink: 0,
                    justifyContent: 'flex-start',
                    overflowY: 'auto'
                  }}>
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
                        📌 የተመረጡ ({selectedNumbers.length}):
                      </div>
                      <div style={{
                        fontSize: '10px',
                        color: '#9ca3af',
                        lineHeight: '1.2',
                        wordBreak: 'break-word',
                        overflowY: 'auto',
                        flex: 1
                      }}>
                        {selectedNumbers.length > 0 ? selectedNumbers.join(', ') : 'እስካሁን ምንም አልመረቱም'}
                      </div>
                    </div>

                    {/* 🎰 Spin ማድረጊያ እና የወጣው ቁጥር */}
                    <div style={{
                      backgroundColor: '#1b1b32',
                      borderRadius: '12px',
                      padding: '10px 6px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #312e81',
                      flexShrink: 0
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#f59e0b' }}>
                        🎰 የዕጣ ማውጫ
                      </div>

                      <div style={{
                        width: '85px',
                        height: '85px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, #1a1a36 0%, #0d0d1a 100%)',
                        border: winningNumber === 'SPINNING' 
                          ? '3px solid #00ffcc' 
                          : '3px solid #ff0055',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: winningNumber === 'SPINNING'
                          ? '0 0 25px rgba(0, 255, 204, 0.8), inset 0 0 12px rgba(0, 255, 204, 0.5)'
                          : '0 0 12px rgba(255, 0, 85, 0.4)',
                        transition: 'all 0.3s ease',
                        position: 'relative'
                      }}>
                        {winningNumber === 'SPINNING' ? (
                          <div className="spin-arrow-container" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="55" height="55" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="42" fill="none" stroke="#00ffcc" strokeWidth="4" strokeDasharray="15 10" />
                              <polygon points="50,12 62,48 50,40 38,48" fill="#00ffcc" />
                              <circle cx="50" cy="50" r="6" fill="#f59e0b" />
                            </svg>
                          </div>
                        ) : winningNumber === 'አልተመረጠም' ? (
                          <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold', textAlign: 'center' }}>አልተመረጠም</span>
                        ) : (
                          <span style={{
                            fontSize: winningNumber === '?' ? '36px' : '26px',
                            fontWeight: 'bold',
                            color: winningNumber === '?' ? '#9ca3af' : '#22c55e',
                            fontFamily: 'monospace',
                            textShadow: winningNumber === '?' ? 'none' : '0 0 10px #22c55e'
                          }}>
                            {winningNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 🎉 የአሸናፊው መረጃ ካርድ */}
                    {winnerInfo && (
                      <div style={{
                        backgroundColor: '#064e3b',
                        border: '1px solid #10b981',
                        borderRadius: '8px',
                        padding: '8px 6px',
                        textAlign: 'center',
                        boxShadow: '0 0 16px rgba(16, 185, 129, 0.6)',
                        flexShrink: 0
                      }}>
                        <div style={{ fontSize: '11px', color: '#a7f3d0', fontWeight: 'bold' }}>🎉 ዕጣው ወጥቷል!</div>
                        <div style={{ fontSize: '12px', color: '#ffffff', fontWeight: 'bold', marginTop: '3px' }}>
                          👤 {winnerInfo.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#facc15', fontWeight: 'bold', marginTop: '2px' }}>
                          ቁጥር፦ #{winnerInfo.number}
                        </div>
                        <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 'bold', marginTop: '2px' }}>
                          ደራሽ፦ {winnerInfo.derash} ETB
                        </div>
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
          <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 'bold' }}>Wallet</h1>
              <span onClick={fetchUserData} style={{ fontSize: '18px', cursor: 'pointer', color: '#9ca3af' }}>🔄</span>
            </div>
            <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', border: '1px solid #2a2a4a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>👤</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{userPhone}</span>
              </div>
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981', borderRadius: '20px', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold' }}>
                ✓ Verified
              </div>
            </div>
            <div style={{ backgroundColor: '#181830', borderRadius: '10px', padding: '4px', display: 'flex', marginBottom: '20px', border: '1px solid #2a2a4a' }}>
              <button onClick={() => setWalletTab('balance')} style={{ flex: 1, padding: '10px 0', borderRadius: '8px', border: 'none', backgroundColor: walletTab === 'balance' ? '#2a2a4a' : 'transparent', color: walletTab === 'balance' ? '#ffffff' : '#9ca3af', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>Balance</button>
              <button onClick={() => setWalletTab('history')} style={{ flex: 1, padding: '10px 0', borderRadius: '8px', border: 'none', backgroundColor: walletTab === 'history' ? '#2a2a4a' : 'transparent', color: walletTab === 'history' ? '#ffffff' : '#9ca3af', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>History</button>
            </div>
            {walletTab === 'balance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #2a2a4a' }}>
                  <span style={{ fontSize: '15px', color: '#9ca3af' }}>Main Wallet</span>
                  <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{mainWallet} ETB</span>
                </div>
                <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #2a2a4a' }}>
                  <span style={{ fontSize: '15px', color: '#9ca3af' }}>Play Wallet</span>
                  <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{playWallet.toFixed(1)} ETB</span>
                </div>
              </div>
            )}
          </div>
        )}
   {currentTab === 'profile' && (
          <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', marginBottom: '24px' }}>
              <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', color: '#ffffff', marginBottom: '12px' }}>
                {userInitial}
              </div>
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
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          backgroundColor: '#0a0a16',
          borderTop: '1px solid #1e1b4b',
          padding: '8px 0',
          flexShrink: 0
        }}>
          <button onClick={() => setCurrentTab('game')} style={{ background: 'none', border: 'none', color: currentTab === 'game' ? '#38bdf8' : '#6b7280', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 'bold' }}>
            🎮 Game
          </button>
          <button onClick={() => setCurrentTab('history')} style={{ background: 'none', border: 'none', color: currentTab === 'history' ? '#38bdf8' : '#6b7280', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 'bold' }}>
            📜 History
          </button>
          <button onClick={() => setCurrentTab('wallet')} style={{ background: 'none', border: 'none', color: currentTab === 'wallet' ? '#38bdf8' : '#6b7280', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 'bold' }}>
            👛 Wallet
          </button>
          <button onClick={() => setCurrentTab('profile')} style={{ background: 'none', border: 'none', color: currentTab === 'profile' ? '#38bdf8' : '#6b7280', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 'bold' }}>
            👤 Profile
          </button>
        </div>
      )}

    </div>
  );
}