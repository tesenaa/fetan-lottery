import React, { useState, useEffect } from 'react';

export default function App() {
  // 1. Navigation States
  const [currentTab, setCurrentTab] = useState('game'); // 'game', 'history', 'wallet', 'profile'
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home' ወይም 'board'
  const [stake, setStake] = useState(10); // 10 ETB ወይም 20 ETB

  // 2. User Stats (በሺህ የሚቆጠሩ - Raw count)
  const [registeredCount, setRegisteredCount] = useState(3000); 
  const [activeCount, setActiveCount] = useState(1000);        

  // 3. Game States
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [allPickedNumbers, setAllPickedNumbers] = useState([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [phase, setPhase] = useState('selection'); // 'selection' ወይም 'spinning'
  const [selectionTime, setSelectionTime] = useState(54);
  const [winningNumber, setWinningNumber] = useState('?');
  const [winnerInfo, setWinnerInfo] = useState(null);

  // Telegram User Data
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const userName = tgUser ? (tgUser.first_name + (tgUser.last_name ? ' ' + tgUser.last_name : '')) : 'ተጫዋች';

  // ቁጥርን ወደ 1000+ / 3000+ መቀየሪያ
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

  // Spin Logic (6 Seconds Spin)
  useEffect(() => {
    if (currentScreen === 'board' && phase === 'spinning') {
      if (allPickedNumbers.length > 0) {
        setWinningNumber('SPINNING');

        const drawTimeout = setTimeout(() => {
          const randomIndex = Math.floor(Math.random() * allPickedNumbers.length);
          const winnerNum = allPickedNumbers[randomIndex];
          
          setWinningNumber(winnerNum);
          setWinnerInfo({ number: winnerNum, name: userName });

          setTimeout(() => {
            setWinnerInfo(null);
          }, 4000);

        }, 6000);

        return () => clearTimeout(drawTimeout);
      } else {
        setWinningNumber('አልተመረጠም');
        setWinnerInfo(null);
      }
    }
  }, [phase, allPickedNumbers, userName, currentScreen]);

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

  const toggleNumber = (num) => {
    if (phase === 'spinning') return;

    if (selectedNumbers.includes(num)) {
      const updated = selectedNumbers.filter((n) => n !== num);
      setSelectedNumbers(updated);
      setAllPickedNumbers(allPickedNumbers.filter((n) => n !== num));
    } else {
      setSelectedNumbers([...selectedNumbers, num]);
      setAllPickedNumbers([...allPickedNumbers, num]);
    }

    if (selectedNumbers.length === 0) {
      setPlayerCount((prev) => prev + 1);
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
      fontFamily: 'sans-serif',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes arrowSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin-arrow-container {
          animation: arrowSpin 0.5s linear infinite;
        }`
      }</style>

      {/* ----------------- TAB CONTENTS ----------------- */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {currentTab === 'game' && (
          <>
            {/* PAGE 1: WELCOME & STAKE SELECTION */}
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

                {/* Stake selection box */}
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
 {/* Users Stat Box (እንደነበረው በአንድ ሳጥን ውስጥ ተደርድሮ) */}
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

            {/* PAGE 2: LOTTERY BOARD SCREEN */}
            {currentScreen === 'board' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* TOP NAV BAR */}
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
                      padding: '4px 10px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 'bold'
                    }}
                  >
                    ← Back
                  </button>

                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#9ca3af' }}>Fetan Lottery</span>

                  <button 
                    onClick={() => window.location.reload()}
                    style={{
                      backgroundColor: '#1e1b4b',
                      color: '#22c55e',
                      border: '1px solid #312e81',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 'bold'
                    }}
                  >
                    🔄 Refresh
                  </button>
                </div>

                {/* HEADER STATS */}
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

                {/* BOARD BODY */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '8px',
                  flex: 1,
                  padding: '0 8px 8px 8px',
                  overflow: 'hidden'
                }}>
                  {/* LEFT NUMBERS */}
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
                      {Array.from({ length: 1000 }, (_, i) => i + 1).map((num) => {
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

                  {/* RIGHT PANEL */}
                  <div style={{
                    width: '170px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    flexShrink: 0,
                    justifyContent: 'flex-start'
                  }}>
                    <div style={{
                      backgroundColor: '#1b1b32',
                      borderRadius: '8px',
                      padding: '6px 8px',
                      height: '70px',
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
                        {selectedNumbers.length > 0 ? selectedNumbers.join(', ') : 'እስካሁን ምንም አልመረጡም'}
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: '#1b1b32',
                      borderRadius: '12px',
                      padding: '10px',
                      height: '140px',
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
                        width: '90px',
                        height: '90px',
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, #1a1a36 0%, #0d0d1a 100%)',
                        border: phase === 'spinning' && winningNumber === 'SPINNING' 
                          ? '3px solid #00ffcc' 
                          : '3px solid #ff0055',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: phase === 'spinning' && winningNumber === 'SPINNING'
                          ? '0 0 25px rgba(0, 255, 204, 0.8), inset 0 0 12px rgba(0, 255, 204, 0.5)'
                          : '0 0 12px rgba(255, 0, 85, 0.4)',
                        transition: 'all 0.3s ease',
                        transform: phase === 'spinning' && winningNumber === 'SPINNING' ? 'scale(1.05)' : 'scale(1)',
                        position: 'relative'
                      }}>
                        {winningNumber === 'SPINNING' ? (
                          <div className="spin-arrow-container" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="60" height="60" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="42" fill="none" stroke="#00ffcc" strokeWidth="3" strokeDasharray="15 10" />
                             <polygon points="50,15 62,50 50,42 38,50" fill="#00ffcc" />
                              <circle cx="50" cy="50" r="6" fill="#f59e0b" />
                            </svg>
                          </div>
                        ) : winningNumber === 'አልተመረጠም' ? (
                          <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold' }}>አልተመረጠም</span>
                        ) : (
                          <span style={{
                            fontSize: '32px',
                            fontWeight: 'bold',
                            color: '#ffffff',
                            fontFamily: 'monospace',
                            textShadow: '0 0 10px #00ffcc, 0 0 20px #00ffcc'
                          }}>
                            {winningNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {winnerInfo && (
                      <div style={{
                        backgroundColor: '#064e3b',
                        border: '1px solid #10b981',
                        borderRadius: '8px',
                        padding: '8px 6px',
                        textAlign: 'center',
                        boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)'
                      }}>
                        <div style={{ fontSize: '10px', color: '#a7f3d0', fontWeight: 'bold' }}>🎉 ዕጣው ወጥቷል!</div>
                        <div style={{ fontSize: '12px', color: '#ffffff', fontWeight: 'bold', marginTop: '2px' }}>
                          👤 {winnerInfo.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#facc15', fontWeight: 'bold', marginTop: '1px' }}>
                          ቁጥር፦ #{winnerInfo.number}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: HISTORY */}
        {currentTab === 'history' && (
          <div style={{ flex: 1, padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '18px', color: '#f59e0b' }}>📜 Game History</h2>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '8px' }}>የበፊቱ የጨዋታ ታሪክ እዚህ ይታያል።</p>
          </div>
        )}

        {/* TAB 3: WALLET */}
        {currentTab === 'wallet' && (
          <div style={{ flex: 1, padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '18px', color: '#22c55e' }}>👛 Wallet</h2>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '8px' }}>የሂሳብ መጠን እና የገንዘብ ገቢ/ወጪ እዚህ ይታያል።</p>
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {currentTab === 'profile' && (
          <div style={{ flex: 1, padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h2 style={{ fontSize: '18px', color: '#38bdf8' }}>👤 Profile</h2>
            <p style={{ color: '#ffffff', fontSize: '15px', fontWeight: 'bold', marginTop: '12px' }}>{userName}</p>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '4px' }}>የተጫዋቹ መረጃ እና ሴቲንግ እዚህ ይታያል።</p>
          </div>
        )}
      </div>

      {/* ----------------- BOTTOM NAVIGATION BAR ----------------- */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#0a0a16',
        borderTop: '1px solid #1e1b4b',
        padding: '8px 0',
               flexShrink: 0
      }}>
        <button
          onClick={() => setCurrentTab('game')}
          style={{
            background: 'none',
            border: 'none',
            color: currentTab === 'game' ? '#22c55e' : '#6b7280',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}
        >
          <span style={{ fontSize: '16px' }}>🎮</span>
          Game
        </button>

        <button
          onClick={() => setCurrentTab('history')}
          style={{
            background: 'none',
            border: 'none',
            color: currentTab === 'history' ? '#22c55e' : '#6b7280',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}
        >
          <span style={{ fontSize: '16px' }}>📜</span>
          History
        </button>

        <button
          onClick={() => setCurrentTab('wallet')}
          style={{
            background: 'none',
            border: 'none',
            color: currentTab === 'wallet' ? '#22c55e' : '#6b7280',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}
        >
          <span style={{ fontSize: '16px' }}>👛</span>
          Wallet
        </button>

        <button
          onClick={() => setCurrentTab('profile')}
          style={{
            background: 'none',
            border: 'none',
            color: currentTab === 'profile' ? '#22c55e' : '#6b7280',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '3px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}
        >
          <span style={{ fontSize: '16px' }}>👤</span>
          Profile
        </button>
      </div>

    </div>
  );
}