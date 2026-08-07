 import React, { useState, useEffect } from 'react';

export default function App() {
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [allPickedNumbers, setAllPickedNumbers] = useState([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [phase, setPhase] = useState('selection'); // 'selection' ወይም 'spinning'
  const [selectionTime, setSelectionTime] = useState(50);
  const [winningNumber, setWinningNumber] = useState('?');

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
          setWinningNumber(allPickedNumbers[randomIndex]);
        }, 9000);

        return () => clearTimeout(drawTimeout);
      } else {
        setWinningNumber('አልተመረጠም');
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
      {/* የሎተሪ መንኮራኩር ሽክርክሪት CSS Animation */}
      <style>{`
        @keyframes customSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin-icon {
          animation: customSpin 0.7s linear infinite;
        }`
      }</style>

      {/* 1. TOP HEADER */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '4px',
        padding: '8px 8px 4px 8px',
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
                {/* አዲሱ የዕጣ ማውጫ ሳጥን */}
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
              transform: phase === 'spinning' && winningNumber === 'SPINNING' ? 'scale(1.05)' : 'scale(1)'
            }}>
              {winningNumber === 'SPINNING' ? (
                /* Spin በሚያደርግበት ጊዜ የሚሽከረከር ዘመናዊ SVG Spinner (ቁጥሮች አይታዩም) */
                <svg className="spin-icon" width="50" height="50" viewBox="0 0 50 50">
                  <circle cx="25" cy="25" r="20" fill="none" stroke="#222" strokeWidth="4" />
                  <circle cx="25" cy="25" r="20" fill="none" stroke="#00ffcc" strokeWidth="4" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                  <circle cx="25" cy="25" r="8" fill="#f59e0b" />
                </svg>
              ) : winningNumber === 'አልተመረጠም' ? (
                <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold' }}>አልተመረጠም</span>
              ) : (
                /* አሸናፊው ቁጥር ወይም ምልክት በሚወጣበት ጊዜ የሚታይ */
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
        </div>

      </div>
    </div>
  );
}