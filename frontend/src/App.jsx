import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const socket = io(BACKEND_URL, { autoConnect: true });

const formatToK = (num) => {
  if (!num && num !== 0) return '0';
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K+';
  }
  return num.toLocaleString();
};

export default function App() {
  const [currentUserId] = useState(() => {
    let savedId = sessionStorage.getItem('fetan_user_id');
    if (!savedId) {
      savedId = 'USER_' + Math.floor(100000 + Math.random() * 900000);
      sessionStorage.setItem('fetan_user_id', savedId);
    }
    return savedId;
  });

  const [activeTab, setActiveTab] = useState('game');
  const [selectedStake, setSelectedStake] = useState(null);
  const [timeLeft, setTimeLeft] = useState(50);
  const [gamePhase, setGamePhase] = useState('selecting');

  const [stats, setStats] = useState({
    activePlayers: 0,
    totalRegistered: 0,
  });
  
  const [gameData, setGameData] = useState({
    gameId: 'Fetan-001',
    derash: 0,
    totalPlayers: 0,
    selectedNumbers: [],
    winningNumber: null,
  });

  const handleSelectStake = (stake) => {
    setSelectedStake(stake);
    window.history.pushState({ stakeSelected: true }, '');
  };

  useEffect(() => {
    const handlePopState = () => {
      if (selectedStake) {
        setSelectedStake(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [selectedStake]);

  useEffect(() => {
    socket.on('init_state', (data) => {
      setGameData((prev) => ({
        ...prev,
        selectedNumbers: data.selectedNumbers || [],
        totalPlayers: data.totalPlayers || 0,
        derash: data.derash || 0,
        winningNumber: data.winningNumber
      }));
      setTimeLeft(data.timeLeft);
      setGamePhase(data.gamePhase);
    });

    socket.on('stats_updated', (data) => {
      setStats({
        activePlayers: data.activePlayers || 0,
        totalRegistered: data.totalRegistered || 0,
      });
    });

    socket.on('board_updated', (data) => {
      setGameData((prev) => ({
        ...prev,
        selectedNumbers: data.selectedNumbers || [],
        totalPlayers: data.totalPlayers || 0,
        derash: data.derash || 0
      }));
    });

    socket.on('timer_tick', (data) => {
      setTimeLeft(data.timeLeft);
      setGamePhase(data.gamePhase);
    });

    socket.on('game_result', (data) => {
      setGameData((prev) => ({
        ...prev,
        winningNumber: data.winningNumber,
        derash: data.derash || prev.derash,
        totalPlayers: data.totalPlayers || prev.totalPlayers
      }));
      setGamePhase('spinning');
    });

    socket.on('reset_game', () => {
      setGameData((prev) => ({
        ...prev,
        selectedNumbers: [],
        totalPlayers: 0,
        derash: 0,
        winningNumber: null
      }));
      setTimeLeft(50);
      setGamePhase('selecting');
    });

    return () => {
      socket.off('init_state');
      socket.off('stats_updated');
      socket.off('board_updated');
      socket.off('timer_tick');
      socket.off('game_result');
      socket.off('reset_game');
    };
  }, []);

  const handleSelectNumber = (num) => {
    if (gamePhase !== 'selecting') return;

    const existingItem = gameData.selectedNumbers.find((n) => n.number === num);

    if (existingItem) {
      if (existingItem.userId === currentUserId) {
        socket.emit('deselect_number', {
          userId: currentUserId,
          numberChosen: num
        });
      }
      return;
    }

    socket.emit('select_number', {
      userId: currentUserId,
      numberChosen: num
    });
  };

  const mySelectedNumbers = gameData.selectedNumbers
    .filter((n) => n.userId === currentUserId)
    .map((n) => n.number);

  const totalNumbers = Array.from({ length: 100 }, (_, i) => i + 1);
        const calculatedDerash = selectedStake 
    ? (gameData.selectedNumbers.length * selectedStake * 0.8) 
    : gameData.derash;

  return (
    <div style={{ backgroundColor: '#0d0b1e', color: '#ffffff', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Segoe UI, sans-serif', width: '100%', maxWidth: '100vw', overflowX: 'hidden', boxSizing: 'border-box' }}>
      
      <style>{`
        * {
          box-sizing: border-box !important;
        }
        body, html {
          margin: 0;
          padding: 0;
          width: 100%;
          overflow-x: hidden;
        }
        @keyframes spinAnimation {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinning-wheel {
          animation: spinAnimation 0.6s linear infinite;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#facc15', color: '#0d0b1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
            F
          </div>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Fetan Lottery</span>
        </div>
        
        {!selectedStake && activeTab === 'game' && (
          <button style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>
            ❓ Rules
          </button>
        )}
      </div>

      {/* Main Container */}
      <div style={{ flex: 1, padding: '12px', paddingBottom: selectedStake ? '20px' : '80px', width: '100%', maxWidth: '100vw', boxSizing: 'border-box' }}>
        
        {activeTab === 'game' && (
          <>
            {!selectedStake ? (
              <div style={{ textAlign: 'center', marginTop: '10px', width: '100%' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '20px', lineHeight: '1.3' }}>
                  Welcome to <span style={{ color: '#facc15' }}>Fetan<br />Lottery</span>
                </h1>

                <div style={{ backgroundColor: '#181534', borderRadius: '16px', padding: '20px 16px', border: '1px solid #d97706', marginBottom: '20px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#f2b94b', fontSize: '15px', fontWeight: 'bold', marginBottom: '16px' }}>
                     Choose Your Stake
                  </div>

                  <button 
                    onClick={() => handleSelectStake(10)}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '12px' }}
                  >
                    ▶️ Play 10 ETB
                  </button>

                  <button 
                    onClick={() => handleSelectStake(20)}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(90deg, #2563eb 0%, #6366f1 100%)', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    ▶️ Play 20 ETB
                  </button>
                </div>

                <div style={{ backgroundColor: '#181534', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', width: '100%' }}>
                 <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff' }}>
                      {formatToK(stats.activePlayers)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Active Users</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff' }}>
                      {formatToK(stats.totalRegistered)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Registered Users</div>
                  </div>
                </div>

              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
                
                {/* 1. የዕጣ ማውጫ (በሞባይል ከላይ እንዲሆን) */}
                <div style={{ backgroundColor: '#181534', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center', width: '100%', boxSizing: 'border-box' }}>
                  <h3 style={{ color: '#facc15', margin: '0 0 12px 0', fontSize: '16px' }}>🎰 የዕጣ ማውጫ</h3>
                  
                  <div 
                    className={gamePhase === 'spinning' && !gameData.winningNumber ? "spinning-wheel" : ""}
                    style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: '50%',
                      border: '4px dashed #facc15',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px',
                      backgroundColor: '#0d0b1e',
                      boxShadow: '0 0 15px rgba(250, 204, 21, 0.2)'
                    }}
                  >
                    <span style={{ fontSize: gameData.winningNumber === 'NONE' ? '11px' : '22px', fontWeight: 'bold', color: '#4ade80' }}>
                      {gamePhase === 'spinning' && !gameData.winningNumber && '🌀'}
                      {gamePhase !== 'spinning' && !gameData.winningNumber && '❓'}
                      {gameData.winningNumber === 'NONE' && 'ቁጥር አልተመረጠም'}
                      {gameData.winningNumber && gameData.winningNumber !== 'NONE' && `#${gameData.winningNumber}`}
                    </span>
                  </div>
                  {gameData.winningNumber && (
                    <div style={{ padding: '8px 12px', backgroundColor: gameData.winningNumber === 'NONE' ? '#dc2626' : '#16a34a', borderRadius: '8px', width: '100%' }}>
                      <span style={{ fontSize: '11px', display: 'block', color: '#ffffff' }}>
                        {gameData.winningNumber === 'NONE' ? '⚠️ ሁኔታ፦' : '🎉 አሸናፊ ቁጥር፦'}
                      </span>
                      <strong style={{ fontSize: gameData.winningNumber === 'NONE' ? '12px' : '18px', color: '#ffffff' }}>
                        {gameData.winningNumber === 'NONE' ? 'ቁጥር አልተመረጠም' : `#${gameData.winningNumber}`}
                      </strong>
                    </div>
                  )}
                </div>

                {/* 2. የመምረጫ ክፍል (ከስር የሚሆን) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', boxSizing: 'border-box' }}>
                  
                  {/* Stats Bar */}
                  <div style={{ backgroundColor: '#181534', padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', width: '100%' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', textAlign: 'center', fontSize: '10px' }}>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '6px 2px', borderRadius: '6px' }}>
                        <span style={{ color: '#94a3b8', display: 'block' }}>Game ID</span>
                        <strong>{gameData.gameId}</strong>
                      </div>
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '6px 2px', borderRadius: '6px' }}>
                        <span style={{ color: '#94a3b8', display: 'block' }}>Players</span>
                        <strong>{gameData.totalPlayers}</strong>
                      </div>
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '6px 2px', borderRadius: '6px' }}>
                        <span style={{ color: '#94a3b8', display: 'block' }}>Stake</span>
                        <strong style={{ color: '#facc15' }}>{selectedStake} ETB</strong>
                      </div>
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '6px 2px', borderRadius: '6px' }}>
                        <span style={{ color: '#94a3b8', display: 'block' }}>Derash</span>
                        <strong style={{ color: '#4ade80' }}>{calculatedDerash} ETB</strong>
                      </div>
                    </div>
                  </div>

                  {/* Selected Numbers */}
                  <div style={{ backgroundColor: '#181534', padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', width: '100%' }}>
                    <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                      📌 የመረጥካቸው ቁጥሮች ({mySelectedNumbers.length})፦
                    </span>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', minHeight: '20px', alignItems: 'center' }}>
                      {mySelectedNumbers.length === 0 ? (
                        <span style={{ color: '#64748b', fontSize: '11px', fontStyle: 'italic' }}>እስካሁን ምንም ቁጥር አልመረጥክም</span>
                      ) : (
                        mySelectedNumbers.map((num) => (
                          <span key={num} style={{ backgroundColor: '#16a34a', color: '#fff', padding: '2px 6px', borderRadius: '8px', fontWeight: 'bold', fontSize: '11px' }}>
                            #{num}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Timer Bar */}
                  <div style={{ backgroundColor: gamePhase === 'selecting' ? '#0284c7' : '#eab308', padding: '8px', borderRadius: '8px', color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: '12px', width: '100%' }}>
                    {gamePhase === 'selecting' 
                      ? '⏳ የመምረጫ ጊዜ፦ ' + timeLeft + ' ሰከንድ' 
                      : '🎰 ዕጣ እየወጣ ነው...'}
                  </div>

                  {/* Grid (ቁጥሮች በ 5 column የተቀመጡ) */}
                  <div style={{ backgroundColor: '#181534', padding: '8px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', width: '100%' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', width: '100%' }}>
                      {totalNumbers.map((num) => {
                        const selectedItem = gameData.selectedNumbers.find((n) => n.number === num);
                        const isTaken = !!selectedItem;
                        const isMine = selectedItem?.userId === currentUserId;

                        let bgColor = 'rgba(255,255,255,0.08)';
                        if (isTaken) {
                          bgColor = isMine ? '#16a34a' : '#dc2626';
                        }

                        const canClick = gamePhase === 'selecting' && (!isTaken || isMine);
                       return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => canClick && handleSelectNumber(num)}
                            style={{
                              backgroundColor: bgColor,
                              color: '#ffffff',
                              border: isMine ? '2px solid #86efac' : 'none',
                              padding: '10px 0',
                              borderRadius: '6px',
                              fontWeight: 'bold',
                              fontSize: '12px',
                              cursor: canClick ? 'pointer' : 'not-allowed',
                              opacity: gamePhase === 'selecting' ? (canClick ? 1 : 0.6) : 0.7,
                              width: '100%'
                            }}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>
            )}
          </>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
            <h3>📜 Game History</h3>
            <p>ያለፉ የጨዋታ ታሪኮች እዚህ ይታያሉ።</p>
          </div>
        )}

        {/* WALLET TAB */}
        {activeTab === 'wallet' && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
            <h3>👛 Wallet / ሒሳብ</h3>
            <p>ተቀማጭ ማድረግና ገንዘብ ማውጫ እዚህ ይገኛል።</p>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
            <h3>👤 Profile</h3>
            <p>የተጠቃሚ መረጃ እና መቼቶች።</p>
          </div>
        )}

      </div>

      {/* Bottom Nav */}
      {!selectedStake && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#13112a', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-around', padding: '8px 0', zIndex: 100 }}>
          <button 
            onClick={() => setActiveTab('game')}
            style={{ background: 'none', border: 'none', color: activeTab === 'game' ? '#38bdf8' : '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px' }}
          >
            <span style={{ fontSize: '18px' }}>🎮</span>
            <span>Game</span>
          </button>

          <button 
            onClick={() => setActiveTab('history')}
            style={{ background: 'none', border: 'none', color: activeTab === 'history' ? '#38bdf8' : '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px' }}
          >
            <span style={{ fontSize: '18px' }}>📜</span>
            <span>History</span>
          </button>

          <button 
            onClick={() => setActiveTab('wallet')}
            style={{ background: 'none', border: 'none', color: activeTab === 'wallet' ? '#38bdf8' : '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px' }}
          >
            <span style={{ fontSize: '18px' }}>👛</span>
            <span>Wallet</span>
          </button>

          <button 
            onClick={() => setActiveTab('profile')}
            style={{ background: 'none', border: 'none', color: activeTab === 'profile' ? '#38bdf8' : '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px' }}
          >
            <span style={{ fontSize: '18px' }}>👤</span>
            <span>Profile</span>
          </button>
        </div>
      )}

    </div>
  );
}