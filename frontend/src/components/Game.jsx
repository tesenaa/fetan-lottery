import React from 'react';

export const NumberButton = React.memo(({ num, isMine, isOthers, disabled, onClick }) => {
  let bgColor = '#2a2a40';
  if (isMine) bgColor = '#22c55e';
  else if (isOthers) bgColor = '#ef4444';
  return (
    <button onClick={() => onClick(num)} disabled={disabled} style={{ padding: '8px 0', backgroundColor: bgColor, color: '#ffffff', border: '1px solid #3d3d5c', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', willChange: 'background-color' }} >
      {num}
    </button>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.num === nextProps.num && prevProps.isMine === nextProps.isMine && prevProps.isOthers === nextProps.isOthers && prevProps.disabled === nextProps.disabled
  );
});

export function GameScreen({
  currentScreen, setCurrentScreen, isBanned, activeCount, registeredCount,
  // Play 10 props
  currentGameId10, playerCount10, derash10, phase10, selectionTime10, winningNumber10,
  myPickedSet10, allPickedSet10, allPickedNumbers10, selectedNumbers10, winnerInfo10,
  // Play 20 props
  currentGameId20, playerCount20, derash20, phase20, selectionTime20, winningNumber20,
  myPickedSet20, allPickedSet20, allPickedNumbers20, selectedNumbers20, winnerInfo20,
  // Play 50 props
  currentGameId50, playerCount50, derash50, phase50, selectionTime50, winningNumber50,
  myPickedSet50, allPickedSet50, allPickedNumbers50, selectedNumbers50, winnerInfo50,
  // Play 100 props
  currentGameId100, playerCount100, derash100, phase100, selectionTime100, winningNumber100,
  myPickedSet100, allPickedSet100, allPickedNumbers100, selectedNumbers100, winnerInfo100,
  
  mainWallet, playWallet, visibleNumbers, toggleNumber, fetchUserData
}) {
  return (
    <>
      {currentScreen === 'home' && (
        <div style={{ flex: 1, width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center', width: '100%' }}>
            Welcome to <span style={{ color: '#f59e0b' }}>Fetan Lottery</span>
          </h1>
          {isBanned && (
            <div style={{ backgroundColor: '#ef4444', color: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center', width: '100%', fontWeight: 'bold' }}>
              ⚠️ አካውንትዎ ታግዶ በድጋሚ መሳተፍ አይችሉም!
            </div>
          )}
          <div style={{ width: '100%', backgroundColor: '#15152a', border: '1px solid #ef4444', borderRadius: '16px', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)', marginBottom: '20px', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>Choose Stake</div>
            <button onClick={() => setCurrentScreen('board10')} style={{ width: '100%', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '12px', textAlign: 'center' }}>
              ► Play 10 ETB
            </button>
            <button onClick={() => setCurrentScreen('board20')} style={{ width: '100%', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}>
              ► Play 20 ETB
            </button>
          </div>
          <div style={{ width: '100%', backgroundColor: '#15152a', border: '1px solid #ef4444', borderRadius: '16px', padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 0 20px rgba(239, 68, 68, 0.2)', marginBottom: '20px', boxSizing: 'border-box' }}>
            <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>Weekly</div>
            <button onClick={() => setCurrentScreen('board50')} style={{ width: '100%', backgroundColor: '#8b5cf6', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '12px', textAlign: 'center' }}>
              ► Play 50 ETB
            </button>
            <button onClick={() => setCurrentScreen('board100')} style={{ width: '100%', backgroundColor: '#ec4899', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}>
              ► Play 100 ETB
            </button>
          </div>
          <div style={{ width: '100%', backgroundColor: '#1b1b38', borderRadius: '16px', padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', boxSizing: 'border-box', border: '1px solid #2d2d50', alignItems: 'center' }}>
            <div style={{ width: '100%' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{activeCount}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Active Users</div>
            </div>
            <div style={{ width: '100%', borderTop: '1px solid #2d2d50', paddingTop: '12px' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{registeredCount}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>Registered Users</div>
            </div>
          </div>
        </div>
      )}

      {/* SEPARATE BOARD FOR 10 ETB */}
      {currentScreen === 'board10' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', backgroundColor: '#0a0a16', borderBottom: '1px solid #1e1b4b', flexShrink: 0, width: '100%' }}>
            <button onClick={() => setCurrentScreen('home')} style={{ backgroundColor: '#1e1b4b', color: '#38bdf8', border: '1px solid #312e81', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>← Back</button>
            <button onClick={() => fetchUserData()} style={{ backgroundColor: '#1e1b4b', color: '#22c55e', border: '1px solid #312e81', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Refresh</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', padding: '6px 8px 4px 8px', flexShrink: 0, width: '100%' }}>
            <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Game ID</div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#f59e0b' }}>{currentGameId10}</div>
            </div>
            <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Players</div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#38bdf8' }}>{playerCount10}</div>
            </div>
            <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Stake</div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#22c55e' }}>10 ETB</div>
            </div>
            <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Derash</div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#22c55e' }}>{derash10} ETB</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', flex: 1, padding: '4px 8px 8px 8px', overflow: 'hidden', width: '100%' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: phase10 === 'spinning' ? (allPickedNumbers10?.length > 0 ? '#dc2626' : '#6b7280') : '#22c55e', padding: '5px', borderRadius: '6px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>
                {phase10 === 'spinning' ? (allPickedNumbers10?.length > 0 ? 'ቁጥር እየሰነዘረ ነው...' : '⚠️ ማንም ቁጥር አልመረጠም!') : 'የምረቃ ጊዜ ' + selectionTime10 + ' S'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', overflowY: 'auto', alignContent: 'start', paddingRight: '4px', flex: 1 }}>
                {visibleNumbers.map((num) => {
                  const isMine = myPickedSet10?.has(num);
                  const isOthers = allPickedSet10?.has(num) && !isMine;
                  const hasEnoughMoney = (Number(mainWallet) + Number(playWallet)) >= 10;
                  const isDisabled = phase10 !== 'selecting' || isBanned || (!hasEnoughMoney && !isMine);
                  return <NumberButton key={num} num={num} disabled={isDisabled} isMine={isMine} isOthers={isOthers} onClick={(n) => toggleNumber(n, 10)} />;
                })}
              </div>
            </div>
            <div style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, justifyContent: 'flex-start', overflowY: 'auto' }}>
              <div style={{ backgroundColor: '#1b1b32', borderRadius: '8px', padding: '6px 8px', minHeight: '65px', maxHeight: '90px', border: '1px solid #312e81', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div style={{ fontSize: '10px', color: '#38bdf8', marginBottom: '2px', fontWeight: 'bold' }}>📌 የተመረጡ ቁጥሮች ({selectedNumbers10?.length || 0}):</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', lineHeight: '1.2', wordBreak: 'break-word', overflowY: 'auto', flex: 1 }}>
                  {selectedNumbers10?.length > 0 ? selectedNumbers10.join(', ') : 'እስካሁን ማንም አልመረጠም'}
                </div>
              </div>
              <div style={{ backgroundColor: '#13132b', borderRadius: '12px', padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #23234d', flexShrink: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '10px', color: '#f59e0b' }}>የቁጥር ማውጫ</div>
                <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: '#0d0d1a', border: winningNumber10 === 'SPINNING' ? '3px solid #00f2fe' : (winningNumber10 !== '?' && winningNumber10 !== 'NONE' ? '3px solid #00ffcc' : '3px solid #e11d48'), display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: winningNumber10 === 'SPINNING' ? '0 0 20px rgba(0, 242, 254, 0.6)' : '0 0 15px rgba(225, 29, 72, 0.3)' }}>
                  <span style={{ fontSize: winningNumber10 === '?' ? '42px' : '38px', fontWeight: 'bold', color: winningNumber10 === '?' ? '#ffffff' : '#00ffcc' }}>{winningNumber10}</span>
                </div>
              </div>
              {winnerInfo10 && (
                <div style={{ marginTop: '4px', padding: '8px', backgroundColor: '#064e3b', border: '2px solid #10b981', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#34d399' }}> 🎉 አሸናፊ አሸነፈ! </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}> 👤 {winnerInfo10.userName} </div>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#facc15' }}> ቁጥር: #{winnerInfo10.number} </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399' }}> የደረሽ ብር: {winnerInfo10.derash} ETB </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SEPARATE BOARD FOR 20 ETB */}
      {currentScreen === 'board20' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', backgroundColor: '#0a0a16', borderBottom: '1px solid #1e1b4b', flexShrink: 0, width: '100%' }}>
            <button onClick={() => setCurrentScreen('home')} style={{ backgroundColor: '#1e1b4b', color: '#38bdf8', border: '1px solid #312e81', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>← Back</button>
            <button onClick={() => fetchUserData()} style={{ backgroundColor: '#1e1b4b', color: '#22c55e', border: '1px solid #312e81', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Refresh</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', padding: '6px 8px 4px 8px', flexShrink: 0, width: '100%' }}>
            <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Game ID</div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#f59e0b' }}>{currentGameId20}</div>
            </div>
            <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Players</div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#38bdf8' }}>{playerCount20}</div>
            </div>
            <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Stake</div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#0284c7' }}>20 ETB</div>
            </div>
            <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Derash</div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#22c55e' }}>{derash20} ETB</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', flex: 1, padding: '4px 8px 8px 8px', overflow: 'hidden', width: '100%' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: phase20 === 'spinning' ? (allPickedNumbers20?.length > 0 ? '#dc2626' : '#6b7280') : '#0284c7', padding: '5px', borderRadius: '6px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>
                {phase20 === 'spinning' ? (allPickedNumbers20?.length > 0 ? 'ቁጥር እየሰነዘረ ነው...' : '⚠️ ማንም ቁጥር አልመረጠም!') : 'የምረቃ ጊዜ ' + selectionTime20 + ' S'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', overflowY: 'auto', alignContent: 'start', paddingRight: '4px', flex: 1 }}>
                {visibleNumbers.map((num) => {
                  const isMine = myPickedSet20?.has(num);
                  const isOthers = allPickedSet20?.has(num) && !isMine;
                  const hasEnoughMoney = (Number(mainWallet) + Number(playWallet)) >= 20;
                  const isDisabled = phase20 !== 'selecting' || isBanned || (!hasEnoughMoney && !isMine);
                  return <NumberButton key={num} num={num} disabled={isDisabled} isMine={isMine} isOthers={isOthers} onClick={(n) => toggleNumber(n, 20)} />;
                })}
              </div>
            </div>
            <div style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, justifyContent: 'flex-start', overflowY: 'auto' }}>
              <div style={{ backgroundColor: '#1b1b32', borderRadius: '8px', padding: '6px 8px', minHeight: '65px', maxHeight: '90px', border: '1px solid #312e81', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div style={{ fontSize: '10px', color: '#38bdf8', marginBottom: '2px', fontWeight: 'bold' }}>📌 የተመረጡ ቁጥሮች ({selectedNumbers20?.length || 0}):</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', lineHeight: '1.2', wordBreak: 'break-word', overflowY: 'auto', flex: 1 }}>
                  {selectedNumbers20?.length > 0 ? selectedNumbers20.join(', ') : 'እስካሁን ማንም አልመረጠም'}
                </div>
              </div>
              <div style={{ backgroundColor: '#13132b', borderRadius: '12px', padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #23234d', flexShrink: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '10px', color: '#f59e0b' }}>የቁጥር ማውጫ</div>
                <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: '#0d0d1a', border: winningNumber20 === 'SPINNING' ? '3px solid #00f2fe' : (winningNumber20 !== '?' && winningNumber20 !== 'NONE' ? '3px solid #00ffcc' : '3px solid #e11d48'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: winningNumber20 === '?' ? '42px' : '38px', fontWeight: 'bold', color: winningNumber20 === '?' ? '#ffffff' : '#00ffcc' }}>{winningNumber20}</span>
                </div>
              </div>
              {winnerInfo20 && (
                <div style={{ marginTop: '4px', padding: '8px', backgroundColor: '#064e3b', border: '2px solid #10b981', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#34d399' }}> 🎉 አሸናፊ አሸነፈ! </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}> 👤 {winnerInfo20.userName} </div>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#facc15' }}> ቁጥር: #{winnerInfo20.number} </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399' }}> የደረሽ ብር: {winnerInfo20.derash} ETB </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SEPARATE BOARD FOR 50 ETB */}
      {currentScreen === 'board50' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', backgroundColor: '#0a0a16', borderBottom: '1px solid #1e1b4b', flexShrink: 0, width: '100%' }}>
            <button onClick={() => setCurrentScreen('home')} style={{ backgroundColor: '#1e1b4b', color: '#38bdf8', border: '1px solid #312e81', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>← Back</button>
            <button onClick={() => fetchUserData()} style={{ backgroundColor: '#1e1b4b', color: '#22c55e', border: '1px solid #312e81', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Refresh</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', padding: '6px 8px 4px 8px', flexShrink: 0, width: '100%' }}>
            <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Game ID</div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#f59e0b' }}>{currentGameId50}</div>
            </div>
            <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Players</div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#38bdf8' }}>{playerCount50}</div>
            </div>
            <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Stake</div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#8b5cf6' }}>50 ETB</div>
            </div>
            <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Derash</div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#22c55e' }}>{derash50} ETB</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', flex: 1, padding: '4px 8px 8px 8px', overflow: 'hidden', width: '100%' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: phase50 === 'spinning' ? (allPickedNumbers50?.length > 0 ? '#dc2626' : '#6b7280') : '#8b5cf6', padding: '5px', borderRadius: '6px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>
                {phase50 === 'spinning' ? (allPickedNumbers50?.length > 0 ? 'ቁጥር እየሰነዘረ ነው...' : '⚠️ ማንም ቁጥር አልመረጠም!') : 'የምረቃ ጊዜ ' + selectionTime50 + ' S'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', overflowY: 'auto', alignContent: 'start', paddingRight: '4px', flex: 1 }}>
                {visibleNumbers.map((num) => {
                  const isMine = myPickedSet50?.has(num);
                  const isOthers = allPickedSet50?.has(num) && !isMine;
                  const hasEnoughMoney = (Number(mainWallet) + Number(playWallet)) >= 50;
                  const isDisabled = phase50 !== 'selecting' || isBanned || (!hasEnoughMoney && !isMine);
                  return <NumberButton key={num} num={num} disabled={isDisabled} isMine={isMine} isOthers={isOthers} onClick={(n) => toggleNumber(n, 50)} />;
                })}
              </div>
            </div>
            <div style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, justifyContent: 'flex-start', overflowY: 'auto' }}>
              <div style={{ backgroundColor: '#1b1b32', borderRadius: '8px', padding: '6px 8px', minHeight: '65px', maxHeight: '90px', border: '1px solid #312e81', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div style={{ fontSize: '10px', color: '#38bdf8', marginBottom: '2px', fontWeight: 'bold' }}>📌 የተመረጡ ቁጥሮች ({selectedNumbers50?.length || 0}):</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', lineHeight: '1.2', wordBreak: 'break-word', overflowY: 'auto', flex: 1 }}>
                  {selectedNumbers50?.length > 0 ? selectedNumbers50.join(', ') : 'እስካሁን ማንም አልመረጠም'}
                </div>
              </div>
              <div style={{ backgroundColor: '#13132b', borderRadius: '12px', padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #23234d', flexShrink: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '10px', color: '#f59e0b' }}>የቁጥር ማውጫ</div>
                <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: '#0d0d1a', border: winningNumber50 === 'SPINNING' ? '3px solid #00f2fe' : (winningNumber50 !== '?' && winningNumber50 !== 'NONE' ? '3px solid #00ffcc' : '3px solid #e11d48'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: winningNumber50 === '?' ? '42px' : '38px', fontWeight: 'bold', color: winningNumber50 === '?' ? '#ffffff' : '#00ffcc' }}>{winningNumber50}</span>
                </div>
              </div>
              {winnerInfo50 && (
                <div style={{ marginTop: '4px', padding: '8px', backgroundColor: '#064e3b', border: '2px solid #10b981', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#34d399' }}> 🎉 አሸናፊ አሸነፈ! </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}> 👤 {winnerInfo50.userName} </div>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#facc15' }}> ቁጥር: #{winnerInfo50.number} </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399' }}> የደረሽ ብር: {winnerInfo50.derash} ETB </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SEPARATE BOARD FOR 100 ETB */}
      {currentScreen === 'board100' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', backgroundColor: '#0a0a16', borderBottom: '1px solid #1e1b4b', flexShrink: 0, width: '100%' }}>
            <button onClick={() => setCurrentScreen('home')} style={{ backgroundColor: '#1e1b4b', color: '#38bdf8', border: '1px solid #312e81', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>← Back</button>
            <button onClick={() => fetchUserData()} style={{ backgroundColor: '#1e1b4b', color: '#22c55e', border: '1px solid #312e81', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Refresh</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', padding: '6px 8px 4px 8px', flexShrink: 0, width: '100%' }}>
            <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Game ID</div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#f59e0b' }}>{currentGameId100}</div>
            </div>
            <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Players</div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#38bdf8' }}>{playerCount100}</div>
            </div>
            <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Stake</div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#ec4899' }}>100 ETB</div>
            </div>
            <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#9ca3af' }}>Derash</div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#22c55e' }}>{derash100} ETB</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', flex: 1, padding: '4px 8px 8px 8px', overflow: 'hidden', width: '100%' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
              <div style={{ backgroundColor: phase100 === 'spinning' ? (allPickedNumbers100?.length > 0 ? '#dc2626' : '#6b7280') : '#ec4899', padding: '5px', borderRadius: '6px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>
                {phase100 === 'spinning' ? (allPickedNumbers100?.length > 0 ? 'ቁጥር እየሰነዘረ ነው...' : '⚠️ ማንም ቁጥር አልመረጠም!') : 'የምረቃ ጊዜ ' + selectionTime100 + ' S'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', overflowY: 'auto', alignContent: 'start', paddingRight: '4px', flex: 1 }}>
                {visibleNumbers.map((num) => {
                  const isMine = myPickedSet100?.has(num);
                  const isOthers = allPickedSet100?.has(num) && !isMine;
                  const hasEnoughMoney = (Number(mainWallet) + Number(playWallet)) >= 100;
                  const isDisabled = phase100 !== 'selecting' || isBanned || (!hasEnoughMoney && !isMine);
                  return <NumberButton key={num} num={num} disabled={isDisabled} isMine={isMine} isOthers={isOthers} onClick={(n) => toggleNumber(n, 100)} />;
                })}
              </div>
            </div>
            <div style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, justifyContent: 'flex-start', overflowY: 'auto' }}>
              <div style={{ backgroundColor: '#1b1b32', borderRadius: '8px', padding: '6px 8px', minHeight: '65px', maxHeight: '90px', border: '1px solid #312e81', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div style={{ fontSize: '10px', color: '#38bdf8', marginBottom: '2px', fontWeight: 'bold' }}>📌 የተመረጡ ቁጥሮች ({selectedNumbers100?.length || 0}):</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', lineHeight: '1.2', wordBreak: 'break-word', overflowY: 'auto', flex: 1 }}>
                  {selectedNumbers100?.length > 0 ? selectedNumbers100.join(', ') : 'እስካሁን ማንም አልመረጠም'}
                </div>
              </div>
              <div style={{ backgroundColor: '#13132b', borderRadius: '12px', padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #23234d', flexShrink: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '10px', color: '#f59e0b' }}>የቁጥር ማውጫ</div>
                <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: '#0d0d1a', border: winningNumber100 === 'SPINNING' ? '3px solid #00f2fe' : (winningNumber100 !== '?' && winningNumber100 !== 'NONE' ? '3px solid #00ffcc' : '3px solid #e11d48'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: winningNumber100 === '?' ? '42px' : '38px', fontWeight: 'bold', color: winningNumber100 === '?' ? '#ffffff' : '#00ffcc' }}>{winningNumber100}</span>
                </div>
              </div>
              {winnerInfo100 && (
                <div style={{ marginTop: '4px', padding: '8px', backgroundColor: '#064e3b', border: '2px solid #10b981', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#34d399' }}> 🎉 አሸናፊ አሸነፈ! </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff' }}> 👤 {winnerInfo100.userName} </div>
                  <div style={{ fontSize: '13px', fontWeight: '900', color: '#facc15' }}> ቁጥር: #{winnerInfo100.number} </div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399' }}> የደረሽ ብር: {winnerInfo100.derash} ETB </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}