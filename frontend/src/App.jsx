[8/7import React, { useState, useEffect } from 'react';

export default function App() {
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [allPickedNumbers, setAllPickedNumbers] = useState([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [phase, setPhase] = useState('selection'); // 'selection' ወይም 'spinning'
  const [selectionTime, setSelectionTime] = useState(50);
  const [winningNumber, setWinningNumber] = useState('?');
  const [winnerAnnouncement, setWinnerAnnouncement] = useState(null);

  const STAKE = 10;

  // የ 60 ሰከንድ ዙር ታይመር
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const cycleSeconds = now % 60; // 60 ሰከንድ ዙር

      if (cycleSeconds < 50) {
        // 1. የመምረጫ ደረጃ (50 ሰከንድ)
        setPhase('selection');
        setSelectionTime(50 - cycleSeconds);

        // አዲስ ዙር ሲጀምር ዳታ ማጽዳት
        if (cycleSeconds === 0) {
          setSelectedNumbers([]);
          setAllPickedNumbers([]);
          setPlayerCount(0);
          setWinningNumber('?');
          setWinnerAnnouncement(null); // አዲስ ጨዋታ ሲጀምር የማሸናፊ ሳጥኑን ማጥፋት
        }
      } else {
        // 2. የዕጣ ማውጣት ደረጃ (10 ሰከንድ)
        setPhase('spinning');
        setSelectionTime(0);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // የ Spin እጣ ማውጣት Logic
  useEffect(() => {
    if (phase === 'spinning') {
      if (allPickedNumbers.length > 0) {
        setWinningNumber('SPINNING');

        // ከ 9 ሰከንድ በኋላ አሸናፊውን ያወጣል
        const drawTimeout = setTimeout(() => {
          const randomIndex = Math.floor(Math.random() * allPickedNumbers.length);
          const winner = allPickedNumbers[randomIndex];
          setWinningNumber(winner);
          setWinnerAnnouncement(winner); // የአሸናፊ ማስታወቂያ ማሳየት
        }, 9000);

        return () => clearTimeout(drawTimeout);
      } else {
        setWinningNumber('አልተመረጠም');
        setWinnerAnnouncement(null);
      }
    }
  }, [phase, allPickedNumbers]);

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

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      alert("ወደ ኋላ የሚመለስበት ገጽ የለም");
    }
  };

  const totalPool = allPickedNumbers.length * STAKE;
  const derash = Math.floor(totalPool * 0.8);

  return (
    <div style={{
      maxWidth: '500px',
      margin: '0 auto',
      backgroundColor: '#121225',
      color: '#ffffff',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'sans-serif',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      {/* የኒዮን ቀስት ማሽከርከሪያ CSS Animation */}
      <style>{`
        @keyframes arrowSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin-arrow-container {
          animation: arrowSpin 0.6s linear infinite;
        }`
      }</style>

      {/* 0. TOP NAVIGATION BAR (Back & Refresh) */}
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
          onClick={handleBack}
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
          onClick={handleRefresh}
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

      {/* 1. TOP HEADER STATS */}
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
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#eab308' }}>{STAKE} ETB</div>
        </div>
        <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: '#9ca3af' }}>Derash</div>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#22c55e' }}>{derash} ETB</div>
        </div>
      </div>

      {/* 2. MAIN BODY */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '8px',
        flex: 1,
        padding: '0 8px 8px 8px',
        overflow: 'hidden'
      }}>
        
        {/* በግራ በኩል */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          overflow: 'hidden'
        }}>
          {/* የጊዜ ማሳያ */}
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

          {/* ቁጥሮች (1-1000) */}
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

        {/* በቀኝ በኩል */}
        <div style={{
          width: '170px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flexShrink: 0,
          justifyContent: 'flex-start'
        }}>
          {/* የተመረጡ ቁጥሮች ሳጥን */}
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

          {/* የዕጣ ማውጫ ሳጥን */}
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
                /* 1. የሚሽከረከር የቀስት (Spin Arrow Pointer) አኒሜሽን */
                <div className="spin-arrow-container" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="60" height="60" viewBox="0 0 100 100">
                    {/* የውጭ ኒዮን ከለር ክበብ */}
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#00ffcc" strokeWidth="3" strokeDasharray="15 10" />
                    {/* የመሃል አቅጣጫ ጠቋሚ ቀስት */}
                    <polygon points="50,15 62,50 50,42 38,50" fill="#00ffcc" />
                    {/* የመሃል ነጥብ */}
                    <circle cx="50" cy="50" r="6" fill="#f59e0b" />
                  </svg>
                </div>
              ) : winningNumber === 'አልተመረጠም' ? (
                <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold' }}>አልተመረጠም</span>
              ) : (
                /* አሸናፊ ቁጥር ሲወጣ */
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

          {/* 3. የአሸናፊ ማስታወቂያ ሳጥን (ዕጣው ሲወጣ ብቻ የሚመጣ) */}
          {winnerAnnouncement !== null && (
            <div style={{
              backgroundColor: '#064e3b',
              border: '1px solid #10b981',
              borderRadius: '8px',
              padding: '8px 6px',
              textAlign: 'center',
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
              animation: 'pulse 1.5s infinite'
            }}>
              <div style={{ fontSize: '10px', color: '#a7f3d0', fontWeight: 'bold' }}>🎉 ዕጣው ወጥቷል!</div>
              <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 'bold', marginTop: '2px' }}>
                አሸናፊ ቁጥር: <span style={{ color: '#facc15' }}>#{winnerAnnouncement}</span>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}