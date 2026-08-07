import React, { useState, useEffect } from 'react';

export default function App() {
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [allPickedNumbers, setAllPickedNumbers] = useState([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [phase, setPhase] = useState('selection'); // 'selection' ወይም 'spinning'
  const [selectionTime, setSelectionTime] = useState(50);
  const [winningNumber, setWinningNumber] = useState('?');

  const STAKE = 10;

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
      {/* ለሽክርክሪቱ የተዘጋጀ CSS Animation */}
      <style>{`
        @keyframes spinWheel {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinning-wheel {
          animation: spinWheel 0.6s linear infinite;
          filter: drop-shadow(0 0 8px #eab308);
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
 {/* የዕጣ ማውጫ ሳጥን */}
          <div style={{
            backgroundColor: '#1b1b32',
            borderRadius: '8px',
            padding: '10px',
            height: '120px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #312e81',
            flexShrink: 0
          }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', color: '#f59e0b' }}>
               የዕጣ ማውጫ
            </div>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: phase === 'spinning' && allPickedNumbers.length > 0 ? '3px dashed #ef4444' : '3px dashed #eab308',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: winningNumber === 'ቁጥር አልተመረጠም' ? '9px' : '22px',
              fontWeight: 'bold',
              color: winningNumber === 'ቁጥር አልተመረጠም' ? '#ef4444' : (phase === 'spinning' ? '#22c55e' : '#ef4444'),
              textAlign: 'center'
            }}>
              {winningNumber === 'SPINNING' ? (
                <svg className="spinning-wheel" viewBox="0 0 100 100" width="44" height="44">
                  <circle cx="50" cy="50" r="46" fill="#1e1b4b" stroke="#eab308" strokeWidth="4" />
                  <path d="M50 50 L50 4 A46 46 0 0 1 96 50 Z" fill="#ef4444" />
                  <path d="M50 50 L96 50 A46 46 0 0 1 50 96 Z" fill="#3b82f6" />
                  <path d="M50 50 L50 96 A46 46 0 0 1 4 50 Z" fill="#22c55e" />
                  <path d="M50 50 L4 50 A46 46 0 0 1 50 4 Z" fill="#eab308" />
                  <circle cx="50" cy="50" r="14" fill="#121225" stroke="#ffffff" strokeWidth="3" />
                </svg>
              ) : (
                winningNumber
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}