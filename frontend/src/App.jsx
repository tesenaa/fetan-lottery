import React, { useState, useEffect } from 'react';

export default function App() {
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(50);

  // ሰዓቱ ከ 50 ጀምሮ ወደ ታች እንዲቆጥር
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
      {/* 1. TOP HEADER (Game ID, Players, Stake, Derash) */}
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

      {/* 2. የመምረጫ ጊዜ (ከHeader ስር) */}
      <div style={{
        padding: '0 8px 6px 8px',
        flexShrink: 0
      }}>
        <div style={{
          backgroundColor: '#0284c7',
          padding: '6px',
          borderRadius: '6px',
          textAlign: 'center',
          fontSize: '11px',
          fontWeight: 'bold'
        }}>
          ⏳ የመምረጫ ጊዜ፦ {timeLeft} ሰከንድ
        </div>
      </div>

      {/* 3. MAIN BODY (ግራ እና ቀኝ) */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '8px',
        flex: 1,
        padding: '0 8px 8px 8px',
        overflow: 'hidden'
      }}>
        
        {/* በግራ በኩል፦ SCROLL የሚሆኑት ቁጥሮች (1-1000) */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '3px',
          overflowY: 'auto',
          alignContent: 'start',
          paddingRight: '2px'
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
         {/* በቀኝ በኩል፦ (ከላይ የተመረጡ ቁጥሮች፣ ከታች የእጣ ማውጫ) */}
        <div style={{
          width: '180px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flexShrink: 0
        }}>
          {/* 1. የተመረጡ ቁጥሮች ሳጥን (ከላይ) */}
          <div style={{
            backgroundColor: '#1b1b32',
            borderRadius: '8px',
            padding: '8px',
            flex: 1,
            border: '1px solid #312e81',
            display: 'flex',
            flexDirection: 'column'
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
              maxHeight: '220px'
            }}>
              {selectedNumbers.length > 0 ? selectedNumbers.join(', ') : 'እስካሁን ምንም አልመረጡም'}
            </div>
          </div>

          {/* 2. የእጣ ማውጫ (ከታች) */}
          <div style={{
            backgroundColor: '#1b1b32',
            borderRadius: '8px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #312e81'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', color: '#f59e0b' }}>
              🎰 የዕጣ ማውጫ
            </div>
            <div style={{
              width: '52px',
              height: '52px',
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