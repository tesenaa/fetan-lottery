import React, { useState } from 'react';

export default function App() {
  // የራሳችን የተመረጡ ቁጥሮች
  const [selectedNumbers, setSelectedNumbers] = useState([]);

  // ለምሳሌ ያህል በሌሎች ተጫዋቾች የተያዙ ቁጥሮች (ቀይ የሚሆኑት)
  const [takenNumbers] = useState([5, 12, 45, 88, 120, 350, 500, 780]);

  const toggleNumber = (num) => {
    // ሌላ ሰው የወሰደው ቁጥር ከሆነ አይመረጥም (Locked)
    if (takenNumbers.includes(num)) return;

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
      padding: '8px',
      backgroundColor: '#121225',
      color: '#ffffff',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'sans-serif',
      boxSizing: 'border-box',
      overflow: 'hidden' // Butons/Layout እንዳይበላሽ
    }}>
      {/* 1. ቋሚ TOP HEADER (Game ID, Players, Stake, Derash) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '4px',
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

      {/* 2. MAIN BODY (ጎን ለጎን አቀማመጥ) */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '8px',
        flex: 1,
        marginTop: '8px',
        overflow: 'hidden'
      }}>
        
        {/* በግራ በኩል፦ ከላይ ወደ ታች ብቻ SCROLL የሚደረጉ ቁጥሮች (1-1000) */}
        <div style={{
          flex: '1',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '3px',
          overflowY: 'auto', // ቁጥሮቹ ብቻ Scroll እንዲሆኑ
          paddingRight: '2px',
          alignContent: 'start'
        }}>
          {Array.from({ length: 1000 }, (_, i) => i + 1).map((num) => {
            const isMine = selectedNumbers.includes(num);
            const isTaken = takenNumbers.includes(num);

            // ከለር አወሳሰድ፦
            // - አረንጓዴ (#22c55e) -> የኔ የተመረጠ ቁጥር
            // - ቀይ (#ef4444) -> በሌላ ተጫዋች የተያዘ ቁጥር
            // - ጥቁር ሰማያዊ (#2a2a40) -> ያልተመረጠ ነፃ ቁጥር
            let btnBg = '#2a2a40';
            if (isMine) btnBg = '#22c55e';
            else if (isTaken) btnBg = '#ef4444';

            return (
              <button
                key={num}
                onClick={() => toggleNumber(num)}
                style={{
                  padding: '7px 0',
                  backgroundColor: btnBg,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  cursor: isTaken ? 'not-allowed' : 'pointer',
                  opacity: isTaken ? 0.8 : 1
                }}
              >
                {num}
              </button>
            );
          })}
        </div>
{/* በቀኝ በኩል፦ ቋሚ የእጣ ማውጫ እና የተመረጡ ቁጥሮች ማሳያ (FIXED AREA) */}
        <div style={{
          flex: '1.1',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flexShrink: 0
        }}>
          {/* የእጣ ማውጫ ሳጥን */}
          <div style={{
            backgroundColor: '#1b1b32',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #312e81'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#f59e0b' }}>
              🎰 የዕጣ ማውጫ
            </div>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '3px dashed #eab308',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: 'bold',
              color: '#ef4444'
            }}>
              ?
            </div>
          </div>

          {/* የተመረጡ ቁጥሮች ማሳያ */}
          <div style={{
            backgroundColor: '#1b1b32',
            borderRadius: '8px',
            padding: '8px',
            flex: 1,
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
              maxHeight: '120px'
            }}>
              {selectedNumbers.length > 0 ? selectedNumbers.join(', ') : 'እስካሁን ምንም አልመረጡም'}
            </div>
          </div>

          {/* Timer Bar */}
          <div style={{
            backgroundColor: '#0284c7',
            padding: '8px',
            borderRadius: '6px',
            textAlign: 'center',
            fontSize: '11px',
            fontWeight: 'bold'
          }}>
            ⏳ የመምረጫ ጊዜ፦ 50 ሰከንድ
          </div>
        </div>

      </div>
    </div>
  );
}