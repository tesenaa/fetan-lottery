 import React, { useState, useEffect } from 'react';

export default function App() {
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [allPickedNumbers, setAllPickedNumbers] = useState([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [phase, setPhase] = useState('selection'); // 'selection' ወይም 'spinning'
  const [selectionTime, setSelectionTime] = useState(50);
  const [spinTime, setSpinTime] = useState(10);
  const [winningNumber, setWinningNumber] = useState('?');

  const STAKE = 10;

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const cycleSeconds = now % 60; // 60 ሰከንድ ዙር (0 - 59)

      if (cycleSeconds < 50) {
        // 1. የመምረጫ ደረጃ (50 ሰከንድ)
        setPhase('selection');
        setSelectionTime(50 - cycleSeconds);
        setSpinTime(10);

        // አዲስ ዙር ሲጀምር (በ 0ኛ ሰከንድ) ዳታ ማጽዳት
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
        setSpinTime(60 - cycleSeconds);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // የ Spin እጣ ማውጣት Logic (ቁጥር ከተመረጠ ብቻ)
  useEffect(() => {
    let spinInterval;

    if (phase === 'spinning') {
      if (allPickedNumbers.length > 0) {
        // ቁጥር ከተመረጠ በየ 100ms Spin ያደርጋል
        spinInterval = setInterval(() => {
          const randomIndex = Math.floor(Math.random() * allPickedNumbers.length);
          setWinningNumber(allPickedNumbers[randomIndex]);
        }, 100);
      } else {
        // ምንም ቁጥር ካልተመረጠ Spin አያደርግም
        setWinningNumber('-');
      }
    }

    return () => clearInterval(spinInterval);
  }, [phase, allPickedNumbers]);

  const toggleNumber = (num) => {
    if (phase === 'spinning') return; // እጣ እየወጣ ቁጥር መምረጥ አይቻልም

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
[8/7/2026 3:10 AM] Mr tes: <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#eab308' }}>{STAKE} ETB</div>
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
                  ? '🎰 ዕጣ እየወጣ ነው... (' + spinTime + ' ሰከንድ)' 
                  : '⚠️ ምንም ቁጥር አልተመረጠም! (' + spinTime + ' ሰከንድ)')
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
              🎰 የዕጣ ማውጫ
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: phase === 'spinning' && allPickedNumbers.length > 0 ? '3px dashed #ef4444' : '3px dashed #eab308',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold',
              color: phase === 'spinning' && allPickedNumbers.length > 0 ? '#22c55e' : '#ef4444',
              transition: 'all 0.2s ease'
            }}>
              {winningNumber}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}