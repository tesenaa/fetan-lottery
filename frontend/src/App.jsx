import React, { useState, useEffect } from 'react';

export default function App() {
  const [selectedNumbers, setSelectedNumbers] = useState([]); // የተጠቃሚው ምርጫ
  const [allPickedNumbers, setAllPickedNumbers] = useState([]); // የሁሉም ተጫዋቾች ቁጥሮች
  const [playerCount, setPlayerCount] = useState(0); // የነኩት ሰዎች ብዛት
  const [timeLeft, setTimeLeft] = useState(60);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winningNumber, setWinningNumber] = useState('?');

  const STAKE = 10; // የአንድ ቁጥር ዋጋ በ ETB

  // 1. በሁሉም ስልክ የተመሳሰለ ሰዓት (Global UTC Timer - 60s rounds)
  useEffect(() => {
    const updateSyncTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const secondsLeft = 60 - (now % 60);

      setTimeLeft(secondsLeft);

      // ሰዓቱ 0 ሲደርስ የ 10 ሰከንድ ዕጣ ማውጣት ይጀምራል
      if (secondsLeft === 60 && !isSpinning) {
        startDraw();
      }
    };

    updateSyncTimer();
    const timer = setInterval(updateSyncTimer, 1000);
    return () => clearInterval(timer);
  }, [allPickedNumbers, isSpinning]);

  // 2. ቁጥር ሲነካ ተጫዋች እና ደራሽ ይጨምራል
  const toggleNumber = (num) => {
    if (isSpinning) return; // ዕጣ ሲወጣ መምረጥ አይቻልም

    if (selectedNumbers.includes(num)) {
      const updated = selectedNumbers.filter((n) => n !== num);
      setSelectedNumbers(updated);
      setAllPickedNumbers(allPickedNumbers.filter((n) => n !== num));
    } else {
      setSelectedNumbers([...selectedNumbers, num]);
      setAllPickedNumbers([...allPickedNumbers, num]);
    }

    // የነኩት ተጫዋቾች ብዛት (ደግመው ቢነኩም በአንድ ተጫዋች ይያዛል)
    if (selectedNumbers.length === 0) {
      setPlayerCount((prev) => prev + 1);
    }
  };

  // 3. የ 10 ሰከንድ Spin አድርጎ ከተነኩት ቁጥሮች ዕጣ ማውጣት
  const startDraw = () => {
    if (allPickedNumbers.length === 0) return;

    setIsSpinning(true);
    let duration = 10000; // 10 ሰከንድ
    let intervalTime = 100;

    const spinInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * allPickedNumbers.length);
      setWinningNumber(allPickedNumbers[randomIndex]);
    }, intervalTime);

    setTimeout(() => {
      clearInterval(spinInterval);
      // ከተነኩት ቁጥሮች አሸናፊውን ይመርጣል
      const finalWinner = allPickedNumbers[Math.floor(Math.random() * allPickedNumbers.length)];
      setWinningNumber(finalWinner);
      setIsSpinning(false);
      
      // ከዕጣው በኋላ ለቀጣይ ዙር ዳታውን ያጸዳል
      setTimeout(() => {
        setSelectedNumbers([]);
        setAllPickedNumbers([]);
        setPlayerCount(0);
        setWinningNumber('?');
      }, 5000);
    }, duration);
  };

  // ደራሽ calculation (80% ብቻ)
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
        
        {/* በግራ በኩል፦ የመምረጫ ጊዜ + የቁጥሮች ሰንጠረዥ */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          overflow: 'hidden'
        }}>
          {/* የተመሳሰለ የመምረጫ ጊዜ */}
          <div style={{
            backgroundColor: isSpinning ? '#dc2626' : '#0284c7',
            padding: '5px',
            borderRadius: '6px',
            textAlign: 'center',
            fontSize: '11px',
            fontWeight: 'bold',
            flexShrink: 0
          }}>
            {isSpinning ? '🎰 ዕጣ እየወጣ ነው...' :'⏳ የመምረጫ ጊዜ፦ ${timeLeft} ሰከንድ'}
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
                  disabled={isSpinning}
                  style={{
                    padding: '7px 0',
                    backgroundColor: isSelected ? '#22c55e' : '#2a2a40',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: isSpinning ? 'not-allowed' : 'pointer',
                    opacity: isSpinning ? 0.6 : 1
                  }}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>

        {/* በቀኝ በኩል፦ የተመረጡ + የዕጣ ማውጫ ሳጥን */}
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
              border: isSpinning ? '3px dashed #ef4444' : '3px dashed #eab308',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold',
              color: isSpinning ? '#22c55e' : '#ef4444',
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