import React from 'react';

export function GameScreen({
  currentScreen,
  setCurrentScreen,
  isBanned,
  activeCount,
  registeredCount,
  
  // STAKE 10 PROPS
  currentGameId10,
  playerCount10,
  derash10,
  phase10,
  selectionTime10,
  winningNumber10,
  myPickedSet10,
  allPickedSet10,
  selectedNumbers10,
  winnerInfo10,

  // STAKE 20 PROPS
  currentGameId20,
  playerCount20,
  derash20,
  phase20,
  selectionTime20,
  winningNumber20,
  myPickedSet20,
  allPickedSet20,
  selectedNumbers20,
  winnerInfo20,

  // STAKE 50 PROPS
  currentGameId50,
  playerCount50,
  derash50,
  phase50,
  selectionTime50,
  winningNumber50,
  myPickedSet50,
  allPickedSet50,
  selectedNumbers50,
  winnerInfo50,

  // STAKE 100 PROPS
  currentGameId100,
  playerCount100,
  derash100,
  phase100,
  selectionTime100,
  winningNumber100,
  myPickedSet100,
  allPickedSet100,
  selectedNumbers100,
  winnerInfo100,

  // GENERAL PROPS
  mainWallet,
  playWallet,
  visibleNumbers,
  toggleNumber,
  fetchUserData
}) {

  if (currentScreen === 'home') {
    return (
      <div style={{ width: '100%', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box' }}>
        {/* BAN WARNING */}
        {isBanned && (
          <div style={{ backgroundColor: '#7f1d1d', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px', borderRadius: '8px', fontSize: '13px', textAlign: 'center', fontWeight: 'bold' }}>
            ⚠️ አካውንትዎ ታግዷል! ቁጥር መምረጥ ወይም መጫወት አይችሉም።
          </div>
        )}

        {/* TOP STATS BANNER */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div style={{ backgroundColor: '#13132b', border: '1px solid #23234a', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>አጠቃላይ ተጫዋቾች</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f59e0b' }}>{registeredCount || 0}</div>
          </div>
          <div style={{ backgroundColor: '#13132b', border: '1px solid #23234a', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>ኦንላይን ያሉ</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>{activeCount || 0}</div>
          </div>
        </div>

        {/* WALLET SUMMARY CARD */}
        <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', border: '1px solid #4338ca', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#c7d2fe', marginBottom: '4px' }}>የእርስዎ ቀሪ ሂሳብ</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>{(Number(mainWallet) + Number(playWallet)).toLocaleString()} ETB</div>
          </div>
          <button onClick={fetchUserData} style={{ backgroundColor: '#4f46e5', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
            🔄 አድስ
          </button>
        </div>

        {/* GAME BOARDS LIST */}
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffffff', marginTop: '4px' }}>የጨዋታ አማራጮች (Stakes)</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* STAKE 10 CARD */}
          <div onClick={() => setCurrentScreen('board10')} style={{ backgroundColor: '#13132b', border: '1px solid #23234a', borderRadius: '14px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '2px' }}>🎲 የ 10 ብር ሎተሪ</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>ቲኬት ዋጋ: 10 ETB</div>
            </div>
            <div style={{ backgroundColor: '#1e1b4b', color: '#818cf8', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>ግባ ➡️</div>
          </div>

          {/* STAKE 20 CARD */}
          <div onClick={() => setCurrentScreen('board20')} style={{ backgroundColor: '#13132b', border: '1px solid #23234a', borderRadius: '14px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '2px' }}>🎲 የ 20 ብር ሎተሪ</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>ቲኬት ዋጋ: 20 ETB</div>
            </div>
            <div style={{ backgroundColor: '#1e1b4b', color: '#818cf8', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>ግባ ➡️</div>
          </div>

          {/* STAKE 50 CARD */}
          <div onClick={() => setCurrentScreen('board50')} style={{ backgroundColor: '#13132b', border: '1px solid #23234a', borderRadius: '14px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#a855f7', marginBottom: '2px' }}>🎲 የ 50 ብር ሎተሪ</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>ቲኬት ዋጋ: 50 ETB</div>
            </div>
            <div style={{ backgroundColor: '#1e1b4b', color: '#818cf8', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>ግባ ➡️</div>
          </div>

          {/* STAKE 100 CARD */}
          <div onClick={() => setCurrentScreen('board100')} style={{ backgroundColor: '#13132b', border: '1px solid #23234a', borderRadius: '14px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#ec4899', marginBottom: '2px' }}>🎲 የ 100 ብር ሎተሪ</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>ቲኬት ዋጋ: 100 ETB</div>
            </div>
            <div style={{ backgroundColor: '#1e1b4b', color: '#818cf8', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>ግባ ➡️</div>
          </div>

        </div>
      </div>
    );
  }

  // RENDER SPECIFIC BOARD BASED ON currentScreen
  let stake = 10;
  let currentGameId = currentGameId10;
  let playerCount = playerCount10;
  let derash = derash10;
  let phase = phase10;
  let selectionTime = selectionTime10;
  let winningNumber = winningNumber10;
  let myPickedSet = myPickedSet10;
  let allPickedSet = allPickedSet10;
  let selectedNumbers = selectedNumbers10;
  let winnerInfo = winnerInfo10;

  if (currentScreen === 'board20') {
    stake = 20;
    currentGameId = currentGameId20;
    playerCount = playerCount20;
    derash = derash20;
    phase = phase20;
    selectionTime = selectionTime20;
    winningNumber = winningNumber20;
    myPickedSet = myPickedSet20;
    allPickedSet = allPickedSet20;
    selectedNumbers = selectedNumbers20;
    winnerInfo = winnerInfo20;
  } else if (currentScreen === 'board50') {
    stake = 50;
    currentGameId = currentGameId50;
    playerCount = playerCount50;
    derash = derash50;
    phase = phase50;
    selectionTime = selectionTime50;
    winningNumber = winningNumber50;
    myPickedSet = myPickedSet50;
    allPickedSet = allPickedSet50;
    selectedNumbers = selectedNumbers50;
    winnerInfo = winnerInfo50;
  } else if (currentScreen === 'board100') {
    stake = 100;
    currentGameId = currentGameId100;
    playerCount = playerCount100;
    derash = derash100;
    phase = phase100;
    selectionTime = selectionTime100;
    winningNumber = winningNumber100;
    myPickedSet = myPickedSet100;
    allPickedSet = allPickedSet100;
    selectedNumbers = selectedNumbers100;
    winnerInfo = winnerInfo100;
  }

  // Cap timer display strictly between 0 and 50 seconds
  const displayTime = Math.min(Math.max(selectionTime, 0), 50);

  return (
    <div style={{ width: '100%', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', boxSizing: 'border-box' }}>
      
      {/* TOP HEADER CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => setCurrentScreen('home')} style={{ backgroundColor: '#1e1b4b', color: '#818cf8', border: '1px solid #4338ca', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
          ⬅️ Back
        </button>
        <button onClick={fetchUserData} style={{ backgroundColor: '#1e1b4b', color: '#34d399', border: '1px solid #065f46', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
          🔄 Refresh
        </button>
      </div>

      {/* STATS INFO ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
        <div style={{ backgroundColor: '#13132b', border: '1px solid #23234a', padding: '8px 4px', borderRadius: '8px' }}>
          <div style={{ fontSize: '9px', color: '#9ca3af' }}>Game ID</div>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#f59e0b', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentGameId}</div>
        </div>
        <div style={{ backgroundColor: '#13132b', border: '1px solid #23234a', padding: '8px 4px', borderRadius: '8px' }}>
          <div style={{ fontSize: '9px', color: '#9ca3af' }}>Players</div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}>{playerCount}</div>
        </div>
        <div style={{ backgroundColor: '#13132b', border: '1px solid #23234a', padding: '8px 4px', borderRadius: '8px' }}>
          <div style={{ fontSize: '9px', color: '#9ca3af' }}>Stake</div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#38bdf8' }}>{stake} ETB</div>
        </div>
        <div style={{ backgroundColor: '#13132b', border: '1px solid #23234a', padding: '8px 4px', borderRadius: '8px' }}>
          <div style={{ fontSize: '9px', color: '#9ca3af' }}>Derash</div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981' }}>{derash} ETB</div>
        </div>
      </div>

      {/* TIMER BANNER */}
      <div style={{ backgroundColor: phase === 'selecting' ? '#065f46' : '#7f1d1d', color: '#ffffff', padding: '10px', borderRadius: '8px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' }}>
        {phase === 'selecting' && `⏳ የመምረጫ ጊዜ ${displayTime} S`}
        {phase === 'spinning' && `🎲 እጣው እየወጣ ነው...`}
        {phase === 'result' && `🏆 ጨዋታው አልቋል!`}
      </div>

      {/* MAIN CONTAINER: NUMBERS GRID & SIDE PANEL */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        
        {/* NUMBERS GRID 1 to 1000 */}
        <div style={{ flex: 1, height: '360px', overflowY: 'auto', backgroundColor: '#13132b', border: '1px solid #23234a', borderRadius: '8px', padding: '8px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px', alignContent: 'flex-start' }}>
          {visibleNumbers.map(num => {
            const isMyPick = myPickedSet.has(num);
            const isOtherPick = allPickedSet.has(num) && !isMyPick;

            let bg = '#1e1b4b';
            let color = '#ffffff';
            let border = '1px solid #312e81';

            if (isMyPick) {
              bg = '#f59e0b';
              color = '#0c0c1e';
              border = '1px solid #d97706';
            } else if (isOtherPick) {
              bg = '#374151';
              color = '#9ca3af';
              border = '1px solid #4b5563';
            }

            return (
              <button
                key={num}
                onClick={() => toggleNumber(num, stake)}
                disabled={phase !== 'selecting' || isOtherPick}
                style={{
                  backgroundColor: bg,
                  color: color,
                  border: border,
                  borderRadius: '6px',
                  padding: '10px 0',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  cursor: (phase === 'selecting' && !isOtherPick) ? 'pointer' : 'not-allowed',
                  opacity: isOtherPick ? 0.6 : 1
                }}
              >
                {num}
              </button>
            );
          })}
        </div>

        {/* RIGHT SIDE PANEL: MY PICKS & RESULT CIRCLE */}
        <div style={{ width: '150px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* MY PICKS BOX */}
          <div style={{ backgroundColor: '#13132b', border: '1px solid #23234a', borderRadius: '8px', padding: '8px', height: '150px', overflowY: 'auto' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '4px' }}>
              📌 የተመረጡ ቁጥሮች ({selectedNumbers.length}):
            </div>
            {selectedNumbers.length === 0 ? (
              <div style={{ fontSize: '10px', color: '#9ca3af' }}>እስካሁን ምንም አልመረጡም</div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                {selectedNumbers.map(n => (
                  <span key={n} style={{ backgroundColor: '#f59e0b', color: '#0c0c1e', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                    {n}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* RESULT CIRCLE / SPINNER BOX */}
          <div style={{ backgroundColor: '#13132b', border: '1px solid #23234a', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <div style={{ fontSize: '11px', color: '#f59e0b', marginBottom: '6px', fontWeight: 'bold' }}>የቁጥር ውጤል</div>
            
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', border: '3px solid #ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e1b4b', position: 'relative' }}>
              {phase === 'spinning' ? (
                <div className="spin-arrow-container" style={{ fontSize: '28px' }}>🎲</div>
              ) : (
                <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#ffffff' }}>{winningNumber}</span>
              )}
            </div>

            {winnerInfo && (
              <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '9px', color: '#34d399' }}>
                <div>አሸናፊ: {winnerInfo.userName}</div>
                <div>ሽልማት: {winnerInfo.derash} ETB</div>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}