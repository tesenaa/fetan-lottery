import React, { useState, useEffect } from 'react';

export default function App() {
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(50);

  useEffect(() => {
    if (timeLeft <= 0) {
      setTimeLeft(50);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const toggleNumber = (num) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter((n) => n !== num));
    } else {
      setSelectedNumbers([...selectedNumbers, num]);
    }
  };

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
          <div style={{ fontSize: '10px', fontWeight: 'bold' }}>12</div>
        </div>
        <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: '#9ca3af' }}>Stake</div>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#eab308' }}>10 ETB</div>
        </div>
        <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: '#9ca3af' }}>Derash</div>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#22c55e' }}>120 ETB</div>
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
          {/* በግራ በኩል ብቻ የተቀመጠ የመምረጫ ጊዜ */}
          <div style={{
            backgroundColor: '#0284c7',
            padding: '6px',
            borderRadius: '6px',
            textAlign: 'center',
            fontSize: '11px',
            fontWeight: 'bold',
            flexShrink: 0
          }}>
            ⏳ የመምረጫ ጊዜ፦ {timeLeft} ሰከንድ
          </div>

          {/* SCROLL የሚሆኑት ቁጥሮች (1-1000) */}
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
                  style={{
                    padding: '7px 0',
                    backgroundColor: isSelected ? '#22c55e' : '#2a2a40',
                color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>

        {/* በቀኝ በኩል፦ የተመረጡ ቁጥሮች (ቁመቱ ያጠረ) + የእጣ ማውጫ */}
        <div style={{
          width: '180px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flexShrink: 0
        }}>
          {/* የተመረጡ ቁጥሮች ሳጥን (ቁመቱ ያጠረ) */}
          <div style={{
            backgroundColor: '#1b1b32',
            borderRadius: '8px',
            padding: '8px',
            height: '140px',
            border: '1px solid #312e81',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0
          }}>
            <div style={{ fontSize: '11px', color: '#38bdf8', marginBottom: '4px', fontWeight: 'bold' }}>
              📌 የመረጧቸው ቁጥሮች ({selectedNumbers.length}):
            </div>
            <div style={{
              fontSize: '10px',
              color: '#9ca3af',
              lineHeight: '1.4',
              wordBreak: 'break-word',
              overflowY: 'auto',
              flex: 1
            }}>
              {selectedNumbers.length > 0 ? selectedNumbers.join(', ') : 'እስካሁን ምንም አልመረጡም'}
            </div>
          </div>

          {/* የእጣ ማውጫ ሳጥን */}
          <div style={{
            backgroundColor: '#1b1b32',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #312e81',
            flex: 1
          }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#f59e0b' }}>
              🎰 የዕጣ ማውጫ
            </div>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              border: '3px dashed #eab308',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#ef4444'
            }}>
              ?
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}