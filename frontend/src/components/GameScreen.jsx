import React, { useState, useEffect, useRef } from 'react';
import { NumberButton } from './NumberButton';

export default function GameScreen({
  currentScreen,
  setCurrentScreen,
  isBanned,
  fetchUserData,
  currentGameId50, currentGameId100,
  playerCount10, playerCount20, playerCount50, playerCount100,
  derash10, derash20, derash50, derash100,
  phase50, phase100,
  selectionTime50, selectionTime100,
  winningNumber50, winningNumber100,
  winnerInfo50, winnerInfo100,
  selectedNumbers10, selectedNumbers20, selectedNumbers50, selectedNumbers100,
  myPickedSet10, myPickedSet20, myPickedSet50, myPickedSet100,
  allPickedSet10, allPickedSet20, allPickedSet50, allPickedSet100,
  allPickedNumbers10, allPickedNumbers20, allPickedNumbers50, allPickedNumbers100,
  mainWallet, playWallet,
  visibleNumbers,
  toggleNumber
}) {
  // Play 10 እና Play 20 ራሳቸውን የቻሉ 6 ዲጂት ጌም አይዲ እና የ50 ሰከንድ ታይመር
  const [game10, setGame10] = useState(() => ({
    gameId: Math.floor(100000 + Math.random() * 900000).toString(),
    timer: 50,
    phase: 'selecting', // 'selecting' (50s) -> 'spinning' (6s) -> 'showing_winner' (4s) -> restart
    winningNumber: '?',
    winnerInfo: null
  }));

  const [game20, setGame20] = useState(() => ({
    gameId: Math.floor(100000 + Math.random() * 900000).toString(),
    timer: 50,
    phase: 'selecting',
    winningNumber: '?',
    winnerInfo: null
  }));

  // ቁጥር ሲመረጥ ታይመሩ እንዳይሰንቀጠጥ/እንዳይቋረጥ ሬፍ (Refs) እንጠቀማለን
  const selectedNumbers10Ref = useRef(selectedNumbers10);
  useEffect(() => { selectedNumbers10Ref.current = selectedNumbers10; }, [selectedNumbers10]);

  const selectedNumbers20Ref = useRef(selectedNumbers20);
  useEffect(() => { selectedNumbers20Ref.current = selectedNumbers20; }, [selectedNumbers20]);

  // Play 50 እና Play 100 ሳምንታዊ ታይመሮች
  const [timers, setTimers] = useState({
    50: selectionTime50 || 300,
    100: selectionTime100 || 300
  });

  const [gameIds, setGameIds] = useState({
    50: currentGameId50 || 'FL50-' + Math.floor(1000 + Math.random() * 9000),
    100: currentGameId100 || 'FL100-' + Math.floor(1000 + Math.random() * 9000)
  });

  // የታይመር እና የፊዝ (Phase) ሎጂክ (ባዶ dependency በመጠቀም መብረቅ/መሰንቀጠጥ ሙሉ በሙሉ ጠፍቷል)
 // የታይመር እና የፊዝ (Phase) ሎጂክ
  useEffect(() => {
    const interval = setInterval(() => {
      // Play 10 ሎጂክ
      setGame10(prev => {
        if (prev.phase === 'selecting') {
          if (prev.timer > 1) {
            return { ...prev, timer: prev.timer - 1 };
          } else {
            return { ...prev, phase: 'spinning', timer: 6, winningNumber: 'SPINNING' };
          }
        } else if (prev.phase === 'spinning') {
          if (prev.timer > 1) {
            return { ...prev, timer: prev.timer - 1 };
          } else {
            const currentList = selectedNumbers10Ref.current;
            const winning = currentList && currentList.length > 0 
              ? currentList[Math.floor(Math.random() * currentList.length)]
              : 'NONE';
            const winner = winning !== 'NONE' ? { userName: 'ተጫዋች', number: winning, derash: currentList.length * 10 } : null;
            return { ...prev, phase: 'showing_winner', timer: 4, winningNumber: winning, winnerInfo: winner };
          }
        } else if (prev.phase === 'showing_winner') {
          if (prev.timer > 1) {
            return { ...prev, timer: prev.timer - 1 };
          } else {
            return {
              gameId: Math.floor(100000 + Math.random() * 900000).toString(),
              timer: 50,
              phase: 'selecting',
              winningNumber: '?',
              winnerInfo: null
            };
          }
        }
        return prev;
      });

      // Play 20 ሎጂክ
      setGame20(prev => {
        if (prev.phase === 'selecting') {
          if (prev.timer > 1) {
            return { ...prev, timer: prev.timer - 1 };
          } else {
            return { ...prev, phase: 'spinning', timer: 6, winningNumber: 'SPINNING' };
          }
        } else if (prev.phase === 'spinning') {
          if (prev.timer > 1) {
            return { ...prev, timer: prev.timer - 1 };
          } else {
            const currentList = selectedNumbers20Ref.current;
            const winning = currentList && currentList.length > 0 
              ? currentList[Math.floor(Math.random() * currentList.length)]
              : 'NONE';
            const winner = winning !== 'NONE' ? { userName: 'ተጫዋች', number: winning, derash: currentList.length * 20 } : null;
            return { ...prev, phase: 'showing_winner', timer: 4, winningNumber: winning, winnerInfo: winner };
          }
        } else if (prev.phase === 'showing_winner') {
          if (prev.timer > 1) {
            return { ...prev, timer: prev.timer - 1 };
          } else {
            return {
              gameId: Math.floor(100000 + Math.random() * 900000).toString(),
              timer: 50,
              phase: 'selecting',
              winningNumber: '?',
              winnerInfo: null
            };
          }
        }
        return prev;
      });

      // Play 50 እና Play 100 ሳምንታዊ ታይመሮች
      setTimers(prev => ({
        50: prev[50] > 0 ? prev[50] - 1 : 300,
        100: prev[100] > 0 ? prev[100] - 1 : 300
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {currentScreen === 'home' && (
        <div style={{ flex: 1, width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center', width: '100%' }}>
            Welcome to <span style={{ color: '#f59e0b' }}>Fetan Lottery</span>
          </h1>

          {isBanned && (
            <div style={{ backgroundColor: '#ef4444', color: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '16px', textAlign: 'center', width: '100%', fontWeight: 'bold' }}>
              ⚠️ አካውንትዎ ታግዶ በድርጊት መሳተፍ አይችሉም!
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
            <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>Weekly (ቅዳሜ የሚወጣ)</div>
            <button onClick={() => setCurrentScreen('board50')} style={{ width: '100%', backgroundColor: '#8b5cf6', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '12px', textAlign: 'center' }}>
              ► Play 50 ETB (ቅዳሜ 12:00)
            </button>
            <button onClick={() => setCurrentScreen('board100')} style={{ width: '100%', backgroundColor: '#ec4899', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}>
              ► Play 100 ETB (ቅዳሜ 12:40)
            </button>
          </div>
        </div>
      )}

      {/* BOARD 10 ETB */}
      {currentScreen === 'board10' && (
        <BoardView
          title="10 ETB" color="#22c55e"
          gameId={game10.gameId} playerCount={playerCount10} derash={derash10}
          phase={game10.phase} selectionTime={game10.timer}
          winningNumber={game10.winningNumber} winnerInfo={game10.winnerInfo}
          selectedNumbers={selectedNumbers10} myPickedSet={myPickedSet10} allPickedSet={allPickedSet10}
          allPickedNumbers={allPickedNumbers10} visibleNumbers={visibleNumbers}
          mainWallet={mainWallet} playWallet={playWallet} stake={10} isBanned={isBanned}
          setCurrentScreen={setCurrentScreen} fetchUserData={fetchUserData} toggleNumber={toggleNumber}
        />
      )}

      {/* BOARD 20 ETB */}
      {currentScreen === 'board20' && (
        <BoardView
          title="20 ETB" color="#0284c7"
          gameId={game20.gameId} playerCount={playerCount20} derash={derash20}
          phase={game20.phase} selectionTime={game20.timer}
          winningNumber={game20.winningNumber} winnerInfo={game20.winnerInfo}
          selectedNumbers={selectedNumbers20} myPickedSet={myPickedSet20} allPickedSet={allPickedSet20}
          allPickedNumbers={allPickedNumbers20} visibleNumbers={visibleNumbers}
          mainWallet={mainWallet} playWallet={playWallet} stake={20} isBanned={isBanned}
          setCurrentScreen={setCurrentScreen} fetchUserData={fetchUserData} toggleNumber={toggleNumber}
        />
      )}

      {/* BOARD 50 ETB */}
      {currentScreen === 'board50' && (
        <BoardView
          title="50 ETB" color="#8b5cf6" subLabel="📅 ሳምንታዊ (ቅዳሜ 12:00)"
          gameId={gameIds[50]} playerCount={playerCount50} derash={derash50}
          phase={phase50} selectionTime={timers[50]}
          winningNumber={winningNumber50} winnerInfo={winnerInfo50}
          selectedNumbers={selectedNumbers50} myPickedSet={myPickedSet50} allPickedSet={allPickedSet50}
          allPickedNumbers={allPickedNumbers50} visibleNumbers={visibleNumbers}
          mainWallet={mainWallet} playWallet={playWallet} stake={50} isBanned={isBanned}
          setCurrentScreen={setCurrentScreen} fetchUserData={fetchUserData} toggleNumber={toggleNumber}
        />
      )}

      {/* BOARD 100 ETB */}
      {currentScreen === 'board100' && (
        <BoardView
          title="100 ETB" color="#ec4899" subLabel="📅 ሳምንታዊ (ቅዳሜ 12:40)"
          gameId={gameIds[100]} playerCount={playerCount100} derash={derash100}
          phase={phase100} selectionTime={timers[100]}
          winningNumber={winningNumber100} winnerInfo={winnerInfo100}
          selectedNumbers={selectedNumbers100} myPickedSet={myPickedSet100} allPickedSet={allPickedSet100}
          allPickedNumbers={allPickedNumbers100} visibleNumbers={visibleNumbers}
          mainWallet={mainWallet} playWallet={playWallet} stake={100} isBanned={isBanned}
          setCurrentScreen={setCurrentScreen} fetchUserData={fetchUserData} toggleNumber={toggleNumber}
        />
      )}
    </>
  );
}

function BoardView({
  title, color, subLabel, gameId, playerCount, derash, phase, selectionTime,
  winningNumber, winnerInfo, selectedNumbers, myPickedSet, allPickedSet,
  allPickedNumbers, visibleNumbers, mainWallet, playWallet, stake, isBanned,
  setCurrentScreen, fetchUserData, toggleNumber
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', backgroundColor: '#0a0a16', borderBottom: '1px solid #1e1b4b', flexShrink: 0, width: '100%' }}>
        <button onClick={() => setCurrentScreen('home')} style={{ backgroundColor: '#1e1b4b', color: '#38bdf8', border: '1px solid #312e81', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
          ← Back
        </button>
        <button onClick={() => fetchUserData()} style={{ backgroundColor: '#1e1b4b', color: '#22c55e', border: '1px solid #312e81', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
          🔄 Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', padding: '6px 8px 4px 8px', flexShrink: 0, width: '100%' }}>
        <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: '#9ca3af' }}>Game ID</div>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#f59e0b' }}>{gameId}</div>
        </div>
        <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: '#9ca3af' }}>Players</div>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#38bdf8' }}>{playerCount}</div>
        </div>
        <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: '#9ca3af' }}>Stake</div>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: color }}>{title}</div>
        </div>
        <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}>
          <div style={{ fontSize: '9px', color: '#9ca3af' }}>Derash</div>
          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#22c55e' }}>{derash} ETB</div>
        </div>
      </div>

      {subLabel && (
        <div style={{ backgroundColor: '#111827', padding: '4px 12px', textAlign: 'center', fontSize: '10px', color: '#f43f5e', fontWeight: 'bold', borderBottom: '1px solid #1f2937' }}>
          {subLabel} - {selectionTime}s
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', flex: 1, padding: '4px 8px 8px 8px', overflow: 'hidden', width: '100%' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
          <div style={{ backgroundColor: phase === 'spinning' ? '#dc2626' : phase === 'showing_winner' ? '#059669' : color, padding: '5px', borderRadius: '6px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>
            {phase === 'spinning' ? 'ቁጥር እየሰነዘረ ነው (6s)...' : phase === 'showing_winner' ? 'አሸናፊው ታይቷል (4s)...' : ('የምረቃ ጊዜ ' + selectionTime + ' S')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', overflowY: 'auto', alignContent: 'start', paddingRight: '4px', flex: 1 }}>
            {visibleNumbers.map((num) => {
              const isMine = myPickedSet.has(num);
              const isOthers = allPickedSet.has(num) && !isMine;
              const hasEnoughMoney = (Number(mainWallet) + Number(playWallet)) >= stake;
              const isDisabled = phase !== 'selecting' || isBanned || (!hasEnoughMoney && !isMine);
              return (
                <NumberButton
                  key={num}
                  num={num}
                  disabled={isDisabled}
                  isMine={isMine}
                  isOthers={isOthers}
                  onClick={() => toggleNumber(num, stake)}
                />
              );
            })}
          </div>
        </div>

        <div style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, justifyContent: 'flex-start', overflowY: 'auto' }}>
          <div style={{ backgroundColor: '#1b1b32', borderRadius: '8px', padding: '6px 8px', minHeight: '65px', maxHeight: '90px', border: '1px solid #312e81', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ fontSize: '10px', color: '#38bdf8', marginBottom: '2px', fontWeight: 'bold' }}>
              📌 የተመረጡ ቁጥሮች ({selectedNumbers.length}):
            </div>
            <div style={{ fontSize: '10px', color: '#9ca3af', lineHeight: '1.2', wordBreak: 'break-word', overflowY: 'auto', flex: 1 }}>
              {selectedNumbers.length > 0 ? selectedNumbers.join(', ') : 'እስካሁን ማንም አልመረጠም'}
            </div>
          </div>

          <div style={{ backgroundColor: '#13132b', borderRadius: '12px', padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #23234d', flexShrink: 0 }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '10px', color: '#f59e0b' }}>
              የቁጥር ማውጫ
            </div>
            <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: '#0d0d1a', border: winningNumber === 'SPINNING' ? '3px solid #00f2fe' : (winningNumber !== '?' && winningNumber !== 'NONE' ? '3px solid #00ffcc' : '3px solid #e11d48'), display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: winningNumber === 'SPINNING' ? '0 0 20px rgba(0, 242, 254, 0.6)' : (winningNumber !== '?' && winningNumber !== 'NONE' ? '0 0 20px rgba(0, 255, 204, 0.6)' : '0 0 15px rgba(225, 29, 72, 0.3)'), transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden' }}>
              {winningNumber === 'SPINNING' ? (
                <div className="spin-arrow-container" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="80" height="80" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#00f2fe" strokeWidth="4" />
                    <polygon points="50,15 58,45 50,40 42,45" fill="#00f2fe" />
                    <polygon points="50,85 58,55 50,60 42,55" fill="#f59e0b" />
                    <circle cx="50" cy="50" r="7" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                  </svg>
                </div>
              ) : winningNumber === 'NONE' ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold', textAlign: 'center' }}>
                    እስካሁን ማንም አላወጣም
                  </span>
                </div>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <span style={{ fontSize: winningNumber === '?' ? '42px' : '38px', fontWeight: 'bold', color: winningNumber === '?' ? '#ffffff' : '#00ffcc', textShadow: winningNumber === '?' ? 'none' : '0 0 12px #00ffcc', lineHeight: '1', display: 'inline-block', margin: '0', padding: '0' }}>
                    {winningNumber}
                  </span>
                </div>
              )}
            </div>
          </div>

          {winnerInfo && (
            <div style={{ marginTop: '4px', padding: '8px', backgroundColor: '#064e3b', border: '2px solid #10b981', borderRadius: '10px', textAlign: 'center', boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#34d399' }}> 🎉 አሸናፊ አሸነፈ! </div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff', margin: '2px 0' }}> 👤 {winnerInfo.userName} </div>
              <div style={{ fontSize: '13px', fontWeight: '900', color: '#facc15' }}> ቁጥር: #{winnerInfo.number} </div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399', marginTop: '2px' }}> የደርሽ ብር: {winnerInfo.derash} ETB </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}