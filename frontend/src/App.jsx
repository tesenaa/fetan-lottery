import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://fetan-lottery-backend.onrender.com";
const SUPER_ADMIN_ID = "494653076";

function eventStake(data) {
  const value = Number(data?.stake ?? data?.ticketPrice);
  return [10, 20, 50, 100].includes(value) ? value : null;
}

function formatCountdown(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (d > 0) return `${d}ቀ ${h}ሰ ${String(m).padStart(2, '0')}ደ`;
  if (h > 0) return `${h}ሰ ${String(m).padStart(2, '0')}ደ ${String(s).padStart(2, '0')}ሰ`;
  return `${m}ደ ${String(s).padStart(2, '0')}ሰ`;
}

/* ═══════════════════════════════════════════════════════════════════
   ✨ Confetti Burst Component — animated particles on win
   ═══════════════════════════════════════════════════════════════════ */
const ConfettiBurst = ({ show }) => {
  if (!show) return null;
  const colors = ['#fbbf24', '#22c55e', '#38bdf8', '#f472b6', '#a78bfa', '#fb7185'];
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: Math.random() * 100,
    delay: Math.random() * 0.3,
    duration: 1.2 + Math.random() * 0.8,
    size: 5 + Math.random() * 6,
    rotate: Math.random() * 360
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            transform: `rotate(${p.rotate}deg)`,
            animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
            boxShadow: `0 0 8px ${p.color}`
          }}
        />
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   ✨ Circular Progress Ring Countdown
   ═══════════════════════════════════════════════════════════════════ */
const CountdownRing = ({ timeLeft, maxTime, size = 120, strokeWidth = 6, color = '#8b5cf6', label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, timeLeft / maxTime));
  const dashOffset = circumference * (1 - progress);
  const isUrgent = timeLeft <= 10 && timeLeft > 0;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke={isUrgent ? '#ef4444' : color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease',
            filter: `drop-shadow(0 0 8px ${isUrgent ? '#ef4444' : color})`,
            animation: isUrgent ? 'pulseUrgent 1s ease-in-out infinite' : 'none'
          }}
        />
      </svg>
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{
          fontSize: size > 100 ? '22px' : '18px',
          fontWeight: '900',
          background: isUrgent
            ? 'linear-gradient(120deg, #ef4444, #f59e0b)'
            : `linear-gradient(120deg, #ffffff, ${color})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1
        }}>
          {timeLeft}
        </div>
        <div style={{ fontSize: '9px', color: '#8b8ba7', marginTop: '2px', letterSpacing: '1px' }}>SEC</div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   ✨ Number Button — polished with glow and micro-interactions
   ═══════════════════════════════════════════════════════════════════ */
const NumberButton = React.memo(({ num, isMine, isOthers, disabled, onClick }) => {
  let background = 'linear-gradient(160deg, #2a2a48, #1a1a32)';
  let borderColor = 'rgba(100, 100, 160, 0.25)';
  let boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 3px rgba(0,0,0,0.5)';
  let textColor = '#cbd5e1';
  let transform = 'none';

  if (isMine) {
    background = 'linear-gradient(160deg, #34d399, #059669)';
    borderColor = '#6ee7b7';
    boxShadow = '0 0 14px rgba(52, 211, 153, 0.7), 0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.35)';
    textColor = '#ffffff';
    transform = 'translateY(-1px)';
  } else if (isOthers) {
    background = 'linear-gradient(160deg, #fb7185, #dc2626)';
    borderColor = '#fda4af';
    boxShadow = '0 0 14px rgba(239, 68, 68, 0.55), 0 4px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)';
    textColor = '#ffffff';
  }

  return (
    <button
      onClick={() => onClick(num)}
      disabled={disabled}
      style={{
        padding: '9px 0',
        background,
        color: textColor,
        border: `1.5px solid ${borderColor}`,
        borderRadius: '10px',
        fontSize: '11px',
        fontWeight: '800',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled && !isMine ? 0.4 : 1,
        boxShadow,
        transform,
        transition: 'transform 0.1s ease, box-shadow 0.2s ease, filter 0.15s ease',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        willChange: 'transform',
        letterSpacing: '0.4px',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.88)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = isMine ? 'translateY(-1px)' : 'scale(1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = isMine ? 'translateY(-1px)' : 'scale(1)'; }}
    >
      {num}
    </button>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.num === nextProps.num &&
    prevProps.isMine === nextProps.isMine &&
    prevProps.isOthers === nextProps.isOthers &&
    prevProps.disabled === nextProps.disabled
  );
});

const GRID_COLUMNS = 5;
const GRID_ROW_HEIGHT = 36;
const GRID_BUFFER_ROWS = 4;

const NumberGrid = React.memo(function NumberGrid({ numbers, myPickedSet, allPickedSet, isDisabled, onToggle }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(300);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setViewportHeight(el.clientHeight || 300);
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setViewportHeight(entry.contentRect.height || 300);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const totalRows = Math.ceil(numbers.length / GRID_COLUMNS);
  const totalHeight = totalRows * GRID_ROW_HEIGHT;

  const startRow = Math.max(0, Math.floor(scrollTop / GRID_ROW_HEIGHT) - GRID_BUFFER_ROWS);
  const rowsInView = Math.ceil(viewportHeight / GRID_ROW_HEIGHT) + GRID_BUFFER_ROWS * 2;
  const endRow = Math.min(totalRows, startRow + rowsInView);

  const startIndex = startRow * GRID_COLUMNS;
  const endIndex = Math.min(numbers.length, endRow * GRID_COLUMNS);
  const visibleSlice = numbers.slice(startIndex, endIndex);

  return (
    <div
      ref={containerRef}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      style={{
        overflowY: 'auto',
        flex: 1,
        background: 'linear-gradient(180deg, rgba(15,15,36,0.9), rgba(8,8,22,0.95))',
        borderRadius: '14px',
        padding: '10px',
        border: '1px solid rgba(100, 100, 180, 0.15)',
        boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.6), 0 0 20px rgba(99,102,241,0.06)'
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: startRow * GRID_ROW_HEIGHT,
            left: 0,
            right: 0,
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
            gap: '5px',
            alignContent: 'start'
          }}
        >
          {visibleSlice.map((num) => {
            const isMine = myPickedSet.has(num);
            const isOthers = allPickedSet.has(num) && !isMine;
            return (
              <NumberButton
                key={num}
                num={num}
                disabled={isDisabled(isMine)}
                isMine={isMine}
                isOthers={isOthers}
                onClick={onToggle}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════════
   ✨ Winning Number Display — rotating rays + glowing pulse
   ═══════════════════════════════════════════════════════════════════ */
const WinningDisplay = ({ winningNumber, accentColor, size = 130 }) => {
  const isSpinning = winningNumber === 'SPINNING';
  const isNone = winningNumber === 'NONE';
  const isIdle = winningNumber === '?';
  const hasWinner = !isSpinning && !isNone && !isIdle;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Rotating rays behind */}
      <div style={{
        position: 'absolute',
        inset: -18,
        borderRadius: '50%',
        background: `conic-gradient(from 0deg, transparent 0deg, ${accentColor}44 20deg, transparent 40deg, transparent 180deg, ${accentColor}44 200deg, transparent 220deg)`,
        animation: (isSpinning || hasWinner) ? 'rotateSlow 4s linear infinite' : 'none',
        opacity: isIdle ? 0.3 : 1,
        filter: 'blur(6px)'
      }} />

      {/* Outer glow */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        boxShadow: `0 0 40px ${isNone ? '#ef4444' : (isIdle ? accentColor : (isSpinning ? '#00f2fe' : '#00ffcc'))}66, inset 0 0 30px ${isIdle ? accentColor : (isSpinning ? '#00f2fe' : '#00ffcc')}22`,
        transition: 'box-shadow 0.5s ease'
      }} />

      {/* Main circle */}
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        background: 'radial-gradient(circle at 30% 25%, #1e1e44, #0a0a1a 70%)',
        border: `3px solid ${isSpinning ? '#00f2fe' : (hasWinner ? '#00ffcc' : (isNone ? '#ef4444' : accentColor))}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        transition: 'border 0.4s ease'
      }}>
        {/* Shimmer effect */}
        {hasWinner && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite'
          }} />
        )}

        {isSpinning ? (
          <div className="spin-arrow-container" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="80%" height="80%" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#00f2fe" strokeWidth="2" opacity="0.4" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="#00f2fe" strokeWidth="4" strokeDasharray="20 100" />
              <polygon points="50,15 58,45 50,40 42,45" fill="#00f2fe" />
              <polygon points="50,85 58,55 50,60 42,55" fill="#f59e0b" />
              <circle cx="50" cy="50" r="8" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
            </svg>
          </div>
        ) : isNone ? (
          <div style={{ textAlign: 'center', padding: '10px' }}>
            <div style={{ fontSize: '26px', marginBottom: '4px' }}>😔</div>
            <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 'bold' }}>ማንም አልወጣም</span>
          </div>
        ) : (
          <span style={{
            fontSize: isIdle ? '52px' : '44px',
            fontWeight: '900',
            background: hasWinner
              ? 'linear-gradient(120deg, #ffffff, #00ffcc)'
              : 'linear-gradient(120deg, #ffffff, #c7d2fe)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: hasWinner ? '0 0 30px rgba(0,255,204,0.8)' : 'none',
            filter: hasWinner ? 'drop-shadow(0 0 15px rgba(0,255,204,0.9))' : 'none',
            animation: hasWinner ? 'numberPop 0.6s ease-out' : 'none',
            lineHeight: 1
          }}>
            {winningNumber}
          </span>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   ✨ Winner Info Card — celebratory design
   ═══════════════════════════════════════════════════════════════════ */
const WinnerInfo = ({ info }) => {
  if (!info) return null;
  return (
    <div style={{
      marginTop: '8px',
      padding: '14px 12px',
      background: 'linear-gradient(160deg, rgba(6,78,59,0.9), rgba(2,44,34,0.95))',
      border: '2px solid #10b981',
      borderRadius: '14px',
      textAlign: 'center',
      boxShadow: '0 0 30px rgba(16,185,129,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
      position: 'relative',
      overflow: 'hidden',
      animation: 'floatIn 0.5s ease-out'
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(120deg, transparent 30%, rgba(52,211,153,0.15) 50%, transparent 70%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 3s infinite'
      }} />
      <div style={{ fontSize: '12px', fontWeight: '900', color: '#34d399', letterSpacing: '1px', marginBottom: '6px' }}>
        🎉 አሸናፊ አሸነፈ! 🎉
      </div>
      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffff', margin: '6px 0' }}>
        👤 {info.userName}
      </div>
      <div style={{
        fontSize: '16px', fontWeight: '900',
        background: 'linear-gradient(120deg, #facc15, #f59e0b)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        margin: '4px 0'
      }}>
        ቁጥር: #{info.number}
      </div>
      <div style={{ fontSize: '14px', fontWeight: '900', color: '#34d399', marginTop: '6px', textShadow: '0 0 10px rgba(52,211,153,0.6)' }}>
        💰 {info.derash} ETB
      </div>
    </div>
  );
};

export default function App() {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const userId = useMemo(() => (tgUser?.id ? String(tgUser.id) : 'GUEST_USER'), [tgUser]);
  const userName = useMemo(() => {
    if (!tgUser) return 'ተጠቃሚ';
    const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ');
    return fullName || 'ተጠቃሚ';
  }, [tgUser]);
  const userPhoto = tgUser?.photo_url || null;

  const isSuperAdmin = useMemo(() => String(userId) === String(SUPER_ADMIN_ID), [userId]);
  const isAdmin = isSuperAdmin;

  const [userPhone, setUserPhone] = useState('');
  const [isBanned, setIsBanned] = useState(false);
  const userInitial = userName ? userName.charAt(0).toUpperCase() : 'U';

  const socket = useMemo(() => io(API_BASE_URL, {
    autoConnect: true,
    transports: ['websocket', 'polling'],
    query: { userId }
  }), [userId]);

  const [currentTab, setCurrentTab] = useState('game');
  const [currentScreen, setCurrentScreen] = useState('home');
  const [registeredCount, setRegisteredCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [walletTab, setWalletTab] = useState('balance');
  const [mainWallet, setMainWallet] = useState(0);
  const [playWallet, setPlayWallet] = useState(0);
  const [gamesWon, setGamesWon] = useState(0);
  const [totalInvite, setTotalInvite] = useState(0);
  const [totalGames, setTotalGames] = useState(0);

  const generateRandomGameId = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `FL-${randomNum}`;
  };

  const [selectedNumbers10, setSelectedNumbers10] = useState([]);
  const [allPickedNumbers10, setAllPickedNumbers10] = useState([]);
  const [playerCount10, setPlayerCount10] = useState(0);
  const [derash10, setDerash10] = useState(0);
  const [phase10, setPhase10] = useState('selecting');
  const [selectionTime10, setSelectionTime10] = useState(50);
  const [winningNumber10, setWinningNumber10] = useState('?');
  const [winnerInfo10, setWinnerInfo10] = useState(null);
  const [currentGameId10, setCurrentGameId10] = useState(generateRandomGameId());

  const [selectedNumbers20, setSelectedNumbers20] = useState([]);
  const [allPickedNumbers20, setAllPickedNumbers20] = useState([]);
  const [playerCount20, setPlayerCount20] = useState(0);
  const [derash20, setDerash20] = useState(0);
  const [phase20, setPhase20] = useState('selecting');
  const [selectionTime20, setSelectionTime20] = useState(50);
  const [winningNumber20, setWinningNumber20] = useState('?');
  const [winnerInfo20, setWinnerInfo20] = useState(null);
  const [currentGameId20, setCurrentGameId20] = useState(generateRandomGameId());

  const [selectedNumbers50, setSelectedNumbers50] = useState([]);
  const [allPickedNumbers50, setAllPickedNumbers50] = useState([]);
  const [playerCount50, setPlayerCount50] = useState(0);
  const [derash50, setDerash50] = useState(0);
  const [phase50, setPhase50] = useState('selecting');
  const [selectionTime50, setSelectionTime50] = useState(0);
  const [winningNumber50, setWinningNumber50] = useState('?');
  const [winnerInfo50, setWinnerInfo50] = useState(null);
  const [currentGameId50, setCurrentGameId50] = useState(generateRandomGameId());

  const [selectedNumbers100, setSelectedNumbers100] = useState([]);
  const [allPickedNumbers100, setAllPickedNumbers100] = useState([]);
  const [playerCount100, setPlayerCount100] = useState(0);
  const [derash100, setDerash100] = useState(0);
  const [phase100, setPhase100] = useState('selecting');
  const [selectionTime100, setSelectionTime100] = useState(0);
  const [winningNumber100, setWinningNumber100] = useState('?');
  const [winnerInfo100, setWinnerInfo100] = useState(null);
  const [currentGameId100, setCurrentGameId100] = useState(generateRandomGameId());

  const myPickedSet10 = useMemo(() => new Set(selectedNumbers10), [selectedNumbers10]);
  const allPickedSet10 = useMemo(() => new Set(allPickedNumbers10), [allPickedNumbers10]);
  const myPickedSet20 = useMemo(() => new Set(selectedNumbers20), [selectedNumbers20]);
  const allPickedSet20 = useMemo(() => new Set(allPickedNumbers20), [allPickedNumbers20]);
  const myPickedSet50 = useMemo(() => new Set(selectedNumbers50), [selectedNumbers50]);
  const allPickedSet50 = useMemo(() => new Set(allPickedNumbers50), [allPickedNumbers50]);
  const myPickedSet100 = useMemo(() => new Set(selectedNumbers100), [selectedNumbers100]);
  const allPickedSet100 = useMemo(() => new Set(allPickedNumbers100), [allPickedNumbers100]);

  const [depAmount, setDepAmount] = useState('200');
  const [pastedSMS, setPastedSMS] = useState('');
  const [isSubmittingDep, setIsSubmittingDep] = useState(false);
  const [withAmount, setWithAmount] = useState('');
  const [gameHistory, setGameHistory] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);

  const [adminUsers, setAdminUsers] = useState([]);
  const [adminSearch, setAdminSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editMain, setEditMain] = useState(0);
  const [editPlay, setEditPlay] = useState(0);
  const [adminTab, setAdminTab] = useState('requests');
  const [txFilter, setTxFilter] = useState('PENDING');
  const [allTx, setAllTx] = useState([]);
  const [allWithdrawals, setAllWithdrawals] = useState([]);
  const [txTypeView, setTxTypeView] = useState('deposit');
  const [financialStats, setFinancialStats] = useState(null);
  const [broadcastText, setBroadcastText] = useState('');

  const [sysSettings, setSysSettings] = useState({
    ticketPrice: 10,
    winnerPercentage: 80,
    manualWinningNumber: null
  });
  const [manualNumberInput, setManualNumberInput] = useState('');

  const visibleNumbers = useMemo(() => {
    return Array.from({ length: 1250 }, (_, i) => i + 1);
  }, []);

  const updateBoardStats10 = useCallback((allSelectedList) => {
    if (allSelectedList && Array.isArray(allSelectedList)) {
      const uniquePlayers = new Set(
        allSelectedList.map(item => typeof item === 'object' ? String(item.userId) : String(item))
      ).size;
      setPlayerCount10(uniquePlayers);
      setDerash10(Math.floor(allSelectedList.length * 10 * (sysSettings.winnerPercentage / 100)));
    }
  }, [sysSettings.winnerPercentage]);

  const updateBoardStats20 = useCallback((allSelectedList) => {
    if (allSelectedList && Array.isArray(allSelectedList)) {
      const uniquePlayers = new Set(
        allSelectedList.map(item => typeof item === 'object' ? String(item.userId) : String(item))
      ).size;
      setPlayerCount20(uniquePlayers);
      setDerash20(Math.floor(allSelectedList.length * 20 * (sysSettings.winnerPercentage / 100)));
    }
  }, [sysSettings.winnerPercentage]);

  const updateBoardStats50 = useCallback((allSelectedList) => {
    if (allSelectedList && Array.isArray(allSelectedList)) {
      const uniquePlayers = new Set(
        allSelectedList.map(item => typeof item === 'object' ? String(item.userId) : String(item))
      ).size;
      setPlayerCount50(uniquePlayers);
      setDerash50(Math.floor(allSelectedList.length * 50 * (sysSettings.winnerPercentage / 100)));
    }
  }, [sysSettings.winnerPercentage]);

  const updateBoardStats100 = useCallback((allSelectedList) => {
    if (allSelectedList && Array.isArray(allSelectedList)) {
      const uniquePlayers = new Set(
        allSelectedList.map(item => typeof item === 'object' ? String(item.userId) : String(item))
      ).size;
      setPlayerCount100(uniquePlayers);
      setDerash100(Math.floor(allSelectedList.length * 100 * (sysSettings.winnerPercentage / 100)));
    }
  }, [sysSettings.winnerPercentage]);

  const applyStakeSnapshot = useCallback((stake, snapshot) => {
    if (!snapshot) return;
    const allSelected = Array.isArray(snapshot.selectedNumbers) ? snapshot.selectedNumbers : [];
    const allPicked = allSelected.map(n => (typeof n === 'object' ? n.number : n));
    const myPicked = allSelected
      .filter(n => typeof n === 'object' && String(n.userId) === String(userId))
      .map(n => n.number);
    const phase = snapshot.gamePhase || 'selecting';
    const winning = snapshot.winningNumber || '?';
    const gameId = snapshot.gameId;
    const timeLeft = snapshot.timeLeft;

    if (stake === 100) {
      setPhase100(phase);
      setWinningNumber100(winning);
      if (gameId) setCurrentGameId100(gameId);
      if (timeLeft !== undefined) setSelectionTime100(timeLeft);
      setAllPickedNumbers100(allPicked);
      setSelectedNumbers100(myPicked);
      updateBoardStats100(allSelected);
      if (snapshot.totalPlayers !== undefined && allSelected.length === 0) setPlayerCount100(snapshot.totalPlayers);
      if (snapshot.derash !== undefined && allSelected.length === 0) setDerash100(snapshot.derash);
    } else if (stake === 50) {
      setPhase50(phase);
      setWinningNumber50(winning);
      if (gameId) setCurrentGameId50(gameId);
      if (timeLeft !== undefined) setSelectionTime50(timeLeft);
      setAllPickedNumbers50(allPicked);
      setSelectedNumbers50(myPicked);
      updateBoardStats50(allSelected);
      if (snapshot.totalPlayers !== undefined && allSelected.length === 0) setPlayerCount50(snapshot.totalPlayers);
      if (snapshot.derash !== undefined && allSelected.length === 0) setDerash50(snapshot.derash);
    } else if (stake === 20) {
      setPhase20(phase);
      setWinningNumber20(winning);
      if (gameId) setCurrentGameId20(gameId);
      if (timeLeft !== undefined) setSelectionTime20(timeLeft);
      setAllPickedNumbers20(allPicked);
      setSelectedNumbers20(myPicked);
      updateBoardStats20(allSelected);
      if (snapshot.totalPlayers !== undefined && allSelected.length === 0) setPlayerCount20(snapshot.totalPlayers);
      if (snapshot.derash !== undefined && allSelected.length === 0) setDerash20(snapshot.derash);
    } else if (stake === 10) {
      setPhase10(phase);
      setWinningNumber10(winning);
      if (gameId) setCurrentGameId10(gameId);
      if (timeLeft !== undefined) setSelectionTime10(timeLeft);
      setAllPickedNumbers10(allPicked);
      setSelectedNumbers10(myPicked);
      updateBoardStats10(allSelected);
      if (snapshot.totalPlayers !== undefined && allSelected.length === 0) setPlayerCount10(snapshot.totalPlayers);
      if (snapshot.derash !== undefined && allSelected.length === 0) setDerash10(snapshot.derash);
    }
  }, [userId, updateBoardStats10, updateBoardStats20, updateBoardStats50, updateBoardStats100]);

  const fetchUserData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/user?id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setMainWallet(data.mainWallet || 0);
        setPlayWallet(data.playWallet || 0);
        setGamesWon(data.gamesWon || 0);
        setTotalInvite(data.totalInvite || 0);
        setTotalGames(data.totalGames || 0);
        setIsBanned(data.isBanned || false);
        setGameHistory(data.history || []);
        if (data.phone) {
          setUserPhone(data.phone);
        } else if (tgUser?.username) {
          setUserPhone(`@${tgUser.username}`);
        } else {
          setUserPhone(userId);
        }
      }
    } catch (err) {
      console.error("Data Fetch Error:", err);
    }
  }, [userId, tgUser]);

  const fetchAdminData = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const headers = { 'admin-key': userId };
      const tRes = await fetch(`${API_BASE_URL}/api/admin/transactions`, { headers });
      const tData = await tRes.json();
      if (tData.success) {
        setAllTx(tData.transactions || []);
        setAllWithdrawals(tData.withdrawals || []);
      }
      if (isSuperAdmin) {
        const [uRes, fRes, sRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/admin/users`, { headers }),
          fetch(`${API_BASE_URL}/api/admin/financial-stats`, { headers }),
          fetch(`${API_BASE_URL}/api/admin/settings`, { headers })
        ]);
        const uData = await uRes.json();
        const fData = await fRes.json();
        const sData = await sRes.json();
        if (uData.success) setAdminUsers(uData.users);
        if (fData.success) setFinancialStats(fData.stats);
        if (sData.success) {
          setSysSettings(sData.settings);
        }
      }
    } catch (err) {
      console.error("Admin Fetch Error:", err);
    }
  }, [isAdmin, isSuperAdmin, userId]);

  useEffect(() => {
    if (isAdmin && currentTab === 'admin') {
      fetchAdminData();
    }
  }, [isAdmin, currentTab, fetchAdminData]);

  const handleProcessTx = async (txId, action, type = 'deposit') => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/process-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'admin-key': userId },
        body: JSON.stringify({ txId, action, type })
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        fetchAdminData();
        fetchUserData();
      }
    } catch (e) {
      alert("ስህተት ተፈጽሟል!");
    }
  };

  const handleUpdateSettings = async (overrideParams = {}) => {
    try {
      const payload = {
        ticketPrice: sysSettings.ticketPrice,
        winnerPercentage: sysSettings.winnerPercentage,
        manualWinningNumber: sysSettings.manualWinningNumber,
        ...overrideParams
      };
      const res = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'admin-key': userId },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setSysSettings(data.settings);
      }
    } catch (e) {
      alert("ስህተት ተፈጽሟል!");
    }
  };

  const handleSetManualWinner = () => {
    if (!manualNumberInput) return alert("እባክዎ የማሸነፊያ ቁጥር ይስጡ!");
    handleUpdateSettings({ manualWinningNumber: Number(manualNumberInput) });
    setManualNumberInput('');
  };

  const handleToggleBan = async (targetUserId, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/toggle-ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'admin-key': userId },
        body: JSON.stringify({ targetUserId, isBanned: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        alert("የተጠቃሚው Status ተስተካክሏል!");
        fetchAdminData();
      }
    } catch (e) {
      alert("ስህተት ተፈጽሟል!");
    }
  };

  const handleUpdateUserBalance = async () => {
    if (!editingUser || !isSuperAdmin) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/update-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'admin-key': userId },
        body: JSON.stringify({ targetUserId: editingUser.userId, mainWallet: editMain, playWallet: editPlay })
      });
      const data = await res.json();
      if (data.success) {
        alert("የተጠቃሚ ገንዘብ ተስተካክሏል!");
        setEditingUser(null);
        fetchAdminData();
      }
    } catch (err) {
      alert("ስህተት ተፈጽሟል!");
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastText) return alert("እባክዎ መልእክት ይጻፉ!");
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'admin-key': userId },
        body: JSON.stringify({ message: broadcastText })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setBroadcastText('');
      }
    } catch (e) {
      alert("ስህተት ተፈጽሟል!");
    }
  };

  const derash10Ref = useRef(derash10);
  useEffect(() => { derash10Ref.current = derash10; }, [derash10]);
  const derash20Ref = useRef(derash20);
  useEffect(() => { derash20Ref.current = derash20; }, [derash20]);
  const derash50Ref = useRef(derash50);
  useEffect(() => { derash50Ref.current = derash50; }, [derash50]);
  const derash100Ref = useRef(derash100);
  useEffect(() => { derash100Ref.current = derash100; }, [derash100]);

  useEffect(() => {
    fetchUserData();
    let spinTimeout10, resultTimeout10;
    let spinTimeout20, resultTimeout20;
    let spinTimeout50, resultTimeout50;
    let spinTimeout100, resultTimeout100;

    socket.on('init_state', (data) => {
      if (!data) return;
      if (data.stake10 || data.stake20 || data.stake50 || data.stake100) {
        if (data.stake10) applyStakeSnapshot(10, data.stake10);
        if (data.stake20) applyStakeSnapshot(20, data.stake20);
        if (data.stake50) applyStakeSnapshot(50, data.stake50);
        if (data.stake100) applyStakeSnapshot(100, data.stake100);
        return;
      }
      const gameStake = data.ticketPrice || 10;
      if (gameStake === 100) {
        setPhase100(data.gamePhase || 'selecting');
        setWinningNumber100(data.winningNumber || '?');
        if (data.gameId) setCurrentGameId100(data.gameId);
        if (data.timeLeft !== undefined) setSelectionTime100(data.timeLeft);
        if (data.selectedNumbers && Array.isArray(data.selectedNumbers)) {
          const allPicked = data.selectedNumbers.map(n => typeof n === 'object' ? n.number : n);
          setAllPickedNumbers100(allPicked);
          const myPicked = data.selectedNumbers.filter(n => typeof n === 'object' && String(n.userId) === String(userId)).map(n => n.number);
          setSelectedNumbers100(myPicked);
          updateBoardStats100(data.selectedNumbers);
        }
      } else if (gameStake === 50) {
        setPhase50(data.gamePhase || 'selecting');
        setWinningNumber50(data.winningNumber || '?');
        if (data.gameId) setCurrentGameId50(data.gameId);
        if (data.timeLeft !== undefined) setSelectionTime50(data.timeLeft);
        if (data.selectedNumbers && Array.isArray(data.selectedNumbers)) {
          const allPicked = data.selectedNumbers.map(n => typeof n === 'object' ? n.number : n);
          setAllPickedNumbers50(allPicked);
          const myPicked = data.selectedNumbers.filter(n => typeof n === 'object' && String(n.userId) === String(userId)).map(n => n.number);
          setSelectedNumbers50(myPicked);
          updateBoardStats50(data.selectedNumbers);
        }
      } else if (gameStake === 20) {
        setPhase20(data.gamePhase || 'selecting');
        if (data.timeLeft !== undefined) setSelectionTime20(data.timeLeft);
        setWinningNumber20(data.winningNumber || '?');
        if (data.gameId) setCurrentGameId20(data.gameId);
        if (data.selectedNumbers && Array.isArray(data.selectedNumbers)) {
          const allPicked = data.selectedNumbers.map(n => typeof n === 'object' ? n.number : n);
          setAllPickedNumbers20(allPicked);
          const myPicked = data.selectedNumbers.filter(n => typeof n === 'object' && String(n.userId) === String(userId)).map(n => n.number);
          setSelectedNumbers20(myPicked);
          updateBoardStats20(data.selectedNumbers);
        }
      } else {
        setPhase10(data.gamePhase || 'selecting');
        if (data.timeLeft !== undefined) setSelectionTime10(data.timeLeft);
        setWinningNumber10(data.winningNumber || '?');
        if (data.gameId) setCurrentGameId10(data.gameId);
        if (data.selectedNumbers && Array.isArray(data.selectedNumbers)) {
          const allPicked = data.selectedNumbers.map(n => typeof n === 'object' ? n.number : n);
          setAllPickedNumbers10(allPicked);
          const myPicked = data.selectedNumbers.filter(n => typeof n === 'object' && String(n.userId) === String(userId)).map(n => n.number);
          setSelectedNumbers10(myPicked);
          updateBoardStats10(data.selectedNumbers);
        }
      }
    });

    socket.on('timer_tick', (data) => {
      if (!data) return;
      const gameStake = data.ticketPrice || 10;
      if (gameStake === 100) {
        if (data.timeLeft !== undefined) setSelectionTime100(data.timeLeft);
        if (data.gamePhase) setPhase100(data.gamePhase);
        if (data.gameId) setCurrentGameId100(data.gameId);
      } else if (gameStake === 50) {
        if (data.timeLeft !== undefined) setSelectionTime50(data.timeLeft);
        if (data.gamePhase) setPhase50(data.gamePhase);
        if (data.gameId) setCurrentGameId50(data.gameId);
      } else if (gameStake === 20) {
        if (data.timeLeft !== undefined) setSelectionTime20(data.timeLeft);
        if (data.gamePhase) setPhase20(data.gamePhase);
        if (data.gameId) setCurrentGameId20(data.gameId);
      } else {
        if (data.timeLeft !== undefined) setSelectionTime10(data.timeLeft);
        if (data.gamePhase) setPhase10(data.gamePhase);
        if (data.gameId) setCurrentGameId10(data.gameId);
      }
    });

    socket.on('board_updated', (data) => {
      if (!data) return;
      const gameStake = data.ticketPrice || 10;
      if (gameStake === 100) {
        if (data.selectedNumbers && Array.isArray(data.selectedNumbers)) {
          const allPicked = data.selectedNumbers.map(n => typeof n === 'object' ? n.number : n);
          setAllPickedNumbers100(allPicked);
          const myPicked = data.selectedNumbers.filter(n => typeof n === 'object' && String(n.userId) === String(userId)).map(n => n.number);
          setSelectedNumbers100(myPicked);
          updateBoardStats100(data.selectedNumbers);
        } else {
          setPlayerCount100(data.totalPlayers || 0);
          setDerash100(data.derash || 0);
        }
      } else if (gameStake === 50) {
        if (data.selectedNumbers && Array.isArray(data.selectedNumbers)) {
          const allPicked = data.selectedNumbers.map(n => typeof n === 'object' ? n.number : n);
          setAllPickedNumbers50(allPicked);
          const myPicked = data.selectedNumbers.filter(n => typeof n === 'object' && String(n.userId) === String(userId)).map(n => n.number);
          setSelectedNumbers50(myPicked);
          updateBoardStats50(data.selectedNumbers);
        } else {
          setPlayerCount50(data.totalPlayers || 0);
          setDerash50(data.derash || 0);
        }
      } else if (gameStake === 20) {
        if (data.selectedNumbers && Array.isArray(data.selectedNumbers)) {
          const allPicked = data.selectedNumbers.map(n => typeof n === 'object' ? n.number : n);
          setAllPickedNumbers20(allPicked);
          const myPicked = data.selectedNumbers.filter(n => typeof n === 'object' && String(n.userId) === String(userId)).map(n => n.number);
          setSelectedNumbers20(myPicked);
          updateBoardStats20(data.selectedNumbers);
        } else {
          setPlayerCount20(data.totalPlayers || 0);
          setDerash20(data.derash || 0);
        }
      } else {
        if (data.selectedNumbers && Array.isArray(data.selectedNumbers)) {
          const allPicked = data.selectedNumbers.map(n => typeof n === 'object' ? n.number : n);
          setAllPickedNumbers10(allPicked);
          const myPicked = data.selectedNumbers.filter(n => typeof n === 'object' && String(n.userId) === String(userId)).map(n => n.number);
          setSelectedNumbers10(myPicked);
          updateBoardStats10(data.selectedNumbers);
        } else {
          setPlayerCount10(data.totalPlayers || 0);
          setDerash10(data.totalPlayers ? data.derash : 0);
        }
      }
    });

    socket.on('error_message', (data) => alert(data.message));
    socket.on('balance_updated', (data) => {
      if (data.balance !== undefined) setMainWallet(data.balance);
      if (data.playWallet !== undefined) setPlayWallet(data.playWallet);
    });
    socket.on('new_transaction', () => {
      if (isAdmin) fetchAdminData();
    });
    socket.on('stats_updated', (data) => {
      if (!data) return;
      setActiveCount(data.activePlayersFormatted || data.activePlayers);
      setRegisteredCount(data.totalRegisteredFormatted || data.totalRegistered);
    });

    socket.on('game_result', (data) => {
      if (!data || data.winningNumber === 'NONE') return;
      const gameStake = data.ticketPrice || 10;
      if (gameStake === 100) {
        setPhase100('spinning');
        setWinningNumber100('SPINNING');
        spinTimeout100 = setTimeout(() => {
          setPhase100('result');
          const winNum = data.winningNumber;
          setWinningNumber100(winNum);
          const winItem = data.selectedNumbers?.find(n => typeof n === 'object' && String(n.number) === String(winNum));
          const winAmount = data.derash !== undefined ? data.derash : derash100Ref.current;
          if (winItem) {
            setWinnerInfo100({ number: winNum, userName: winItem.userName || `user_${winItem.userId}`, derash: winAmount });
            if (String(winItem.userId) === String(userId)) {
              setMainWallet(prev => prev + winAmount);
              setGamesWon(prev => prev + 1);
            }
          } else {
            setWinnerInfo100({ number: winNum, userName: 'ማንም አልመረጠም', derash: 0 });
          }
          fetchUserData();
        }, 1500);
      } else if (gameStake === 50) {
        setPhase50('spinning');
        setWinningNumber50('SPINNING');
        spinTimeout50 = setTimeout(() => {
          setPhase50('result');
          const winNum = data.winningNumber;
          setWinningNumber50(winNum);
          const winItem = data.selectedNumbers?.find(n => typeof n === 'object' && String(n.number) === String(winNum));
          const winAmount = data.derash !== undefined ? data.derash : derash50Ref.current;
          if (winItem) {
            setWinnerInfo50({ number: winNum, userName: winItem.userName || `user_${winItem.userId}`, derash: winAmount });
            if (String(winItem.userId) === String(userId)) {
              setMainWallet(prev => prev + winAmount);
              setGamesWon(prev => prev + 1);
            }
          } else {
            setWinnerInfo50({ number: winNum, userName: 'ማንም አልመረጠም', derash: 0 });
          }
          fetchUserData();
        }, 1500);
      } else if (gameStake === 20) {
        setPhase20('spinning');
        setWinningNumber20('SPINNING');
        spinTimeout20 = setTimeout(() => {
          setPhase20('result');
          const winNum = data.winningNumber;
          setWinningNumber20(winNum);
          const winItem = data.selectedNumbers?.find(n => typeof n === 'object' && String(n.number) === String(winNum));
          const winAmount = data.derash !== undefined ? data.derash : derash20Ref.current;
          if (winItem) {
            setWinnerInfo20({ number: winNum, userName: winItem.userName || `user_${winItem.userId}`, derash: winAmount });
            if (String(winItem.userId) === String(userId)) {
              setMainWallet(prev => prev + winAmount);
              setGamesWon(prev => prev + 1);
            }
          } else {
            setWinnerInfo20({ number: winNum, userName: 'ማንም አልመረጠም', derash: 0 });
          }
          fetchUserData();
          resultTimeout20 = setTimeout(() => {
            setSelectedNumbers20([]);
            setAllPickedNumbers20([]);
            setWinningNumber20('?');
            setWinnerInfo20(null);
            setPhase20('selecting');
            setSelectionTime20(50);
            setPlayerCount20(0);
            setDerash20(0);
            setCurrentGameId20(data.nextGameId || generateRandomGameId());
          }, 4000);
        }, 1500);
      } else {
        setPhase10('spinning');
        setWinningNumber10('SPINNING');
        spinTimeout10 = setTimeout(() => {
          setPhase10('result');
          const winNum = data.winningNumber;
          setWinningNumber10(winNum);
          const winItem = data.selectedNumbers?.find(n => typeof n === 'object' && String(n.number) === String(winNum));
          const winAmount = data.derash !== undefined ? data.derash : derash10Ref.current;
          if (winItem) {
            setWinnerInfo10({ number: winNum, userName: winItem.userName || `user_${winItem.userId}`, derash: winAmount });
            if (String(winItem.userId) === String(userId)) {
              setMainWallet(prev => prev + winAmount);
              setGamesWon(prev => prev + 1);
            }
          } else {
            setWinnerInfo10({ number: winNum, userName: 'ማንም አልመረጠም', derash: 0 });
          }
          fetchUserData();
          resultTimeout10 = setTimeout(() => {
            setSelectedNumbers10([]);
            setAllPickedNumbers10([]);
            setWinningNumber10('?');
            setWinnerInfo10(null);
            setPhase10('selecting');
            setSelectionTime10(50);
            setPlayerCount10(0);
            setDerash10(0);
            setCurrentGameId10(data.nextGameId || generateRandomGameId());
          }, 4000);
        }, 1500);
      }
    });

    socket.on('reset_game', (data) => {
      const gameStake = data?.ticketPrice || 10;
      if (gameStake === 100) {
        clearTimeout(spinTimeout100);
        clearTimeout(resultTimeout100);
        setSelectedNumbers100([]);
        setAllPickedNumbers100([]);
        setWinningNumber100('?');
        setWinnerInfo100(null);
        setPhase100(data?.gamePhase || 'selecting');
        setSelectionTime100(data?.timeLeft || 0);
        setPlayerCount100(0);
        setDerash100(0);
        setCurrentGameId100(data?.gameId || generateRandomGameId());
      } else if (gameStake === 50) {
        clearTimeout(spinTimeout50);
        clearTimeout(resultTimeout50);
        setSelectedNumbers50([]);
        setAllPickedNumbers50([]);
        setWinningNumber50('?');
        setWinnerInfo50(null);
        setPhase50(data?.gamePhase || 'selecting');
        setSelectionTime50(data?.timeLeft || 0);
        setPlayerCount50(0);
        setDerash50(0);
        setCurrentGameId50(data?.gameId || generateRandomGameId());
      } else if (gameStake === 20) {
        clearTimeout(spinTimeout20);
        clearTimeout(resultTimeout20);
        setSelectedNumbers20([]);
        setAllPickedNumbers20([]);
        setWinningNumber20('?');
        setWinnerInfo20(null);
        setPhase20(data?.gamePhase || 'selecting');
        setSelectionTime20(data?.timeLeft || 50);
        setPlayerCount20(0);
        setDerash20(0);
        setCurrentGameId20(data?.gameId || generateRandomGameId());
      } else {
        clearTimeout(spinTimeout10);
        clearTimeout(resultTimeout10);
        setSelectedNumbers10([]);
        setAllPickedNumbers10([]);
        setWinningNumber10('?');
        setWinnerInfo10(null);
        setPhase10(data?.gamePhase || 'selecting');
        setSelectionTime10(data?.timeLeft || 50);
        setPlayerCount10(0);
        setDerash10(0);
        setCurrentGameId10(data?.gameId || generateRandomGameId());
      }
    });

    return () => {
      socket.off('init_state');
      socket.off('timer_tick');
      socket.off('board_updated');
      socket.off('stats_updated');
      socket.off('game_result');
      socket.off('reset_game');
      socket.off('error_message');
      socket.off('balance_updated');
      socket.off('new_transaction');
      clearTimeout(spinTimeout10);
      clearTimeout(resultTimeout10);
      clearTimeout(spinTimeout20);
      clearTimeout(resultTimeout20);
      clearTimeout(spinTimeout50);
      clearTimeout(resultTimeout50);
      clearTimeout(spinTimeout100);
      clearTimeout(resultTimeout100);
    };
  }, [socket, userId, updateBoardStats10, updateBoardStats20, updateBoardStats50, updateBoardStats100, fetchUserData, fetchAdminData, isAdmin, applyStakeSnapshot]);

  const toggleNumber = useCallback((num, stake) => {
    let currentPhase = phase10;
    let mySet = myPickedSet10;
    if (stake === 20) { currentPhase = phase20; mySet = myPickedSet20; }
    else if (stake === 50) { currentPhase = phase50; mySet = myPickedSet50; }
    else if (stake === 100) { currentPhase = phase100; mySet = myPickedSet100; }

    if (currentPhase !== 'selecting') return;
    if (isBanned) return alert("አካውንትዎ በድርጊት ማገድ ምክንያት መምረጥ አይችሉም!");

    const totalAvailableBalance = Number(mainWallet) + Number(playWallet);

    if (mySet.has(num)) {
      if (stake === 100) { setSelectedNumbers100(prev => prev.filter(n => n !== num)); setAllPickedNumbers100(prev => prev.filter(n => n !== num)); }
      else if (stake === 50) { setSelectedNumbers50(prev => prev.filter(n => n !== num)); setAllPickedNumbers50(prev => prev.filter(n => n !== num)); }
      else if (stake === 20) { setSelectedNumbers20(prev => prev.filter(n => n !== num)); setAllPickedNumbers20(prev => prev.filter(n => n !== num)); }
      else { setSelectedNumbers10(prev => prev.filter(n => n !== num)); setAllPickedNumbers10(prev => prev.filter(n => n !== num)); }
      setMainWallet(prev => Number(prev) + Number(stake));
      socket.emit('deselect_number', { numberChosen: num, userId, stake });
    } else {
      if (totalAvailableBalance < Number(stake)) {
        const msg = `⚠️ በቂ ሂሳብ የለዎትም! እባክዎ አካውንት ላይ ገንዘብ ይሙሉ።`;
        if (window.Telegram?.WebApp?.showAlert) window.Telegram.WebApp.showAlert(msg);
        else alert(msg);
        return;
      }
      if (Number(playWallet) >= Number(stake)) {
        setPlayWallet(prev => Number(prev) - Number(stake));
      } else {
        const remainingStake = Number(stake) - Number(playWallet);
        setPlayWallet(0);
        setMainWallet(prev => Number(prev) - Number(remainingStake));
      }
      if (stake === 100) { setSelectedNumbers100(prev => [...prev, num]); setAllPickedNumbers100(prev => [...prev, num]); }
      else if (stake === 50) { setSelectedNumbers50(prev => [...prev, num]); setAllPickedNumbers50(prev => [...prev, num]); }
      else if (stake === 20) { setSelectedNumbers20(prev => [...prev, num]); setAllPickedNumbers20(prev => [...prev, num]); }
      else { setSelectedNumbers10(prev => [...prev, num]); setAllPickedNumbers10(prev => [...prev, num]); }
      socket.emit('select_number', { numberChosen: num, userId, userName, stake });
    }
  }, [phase10, phase20, phase50, phase100, isBanned, myPickedSet10, myPickedSet20, myPickedSet50, myPickedSet100, mainWallet, playWallet, socket, userId, userName]);

  const onToggle10 = useCallback((num) => toggleNumber(num, 10), [toggleNumber]);
  const onToggle20 = useCallback((num) => toggleNumber(num, 20), [toggleNumber]);
  const onToggle50 = useCallback((num) => toggleNumber(num, 50), [toggleNumber]);
  const onToggle100 = useCallback((num) => toggleNumber(num, 100), [toggleNumber]);

  const hasEnoughMoney10 = (Number(mainWallet) + Number(playWallet)) >= 10;
  const hasEnoughMoney20 = (Number(mainWallet) + Number(playWallet)) >= 20;
  const hasEnoughMoney50 = (Number(mainWallet) + Number(playWallet)) >= 50;
  const hasEnoughMoney100 = (Number(mainWallet) + Number(playWallet)) >= 100;

  const isDisabled10 = useCallback((isMine) => phase10 !== 'selecting' || isBanned || (!hasEnoughMoney10 && !isMine), [phase10, isBanned, hasEnoughMoney10]);
  const isDisabled20 = useCallback((isMine) => phase20 !== 'selecting' || isBanned || (!hasEnoughMoney20 && !isMine), [phase20, isBanned, hasEnoughMoney20]);
  const isDisabled50 = useCallback((isMine) => phase50 !== 'selecting' || isBanned || (!hasEnoughMoney50 && !isMine), [phase50, isBanned, hasEnoughMoney50]);
  const isDisabled100 = useCallback((isMine) => phase100 !== 'selecting' || isBanned || (!hasEnoughMoney100 && !isMine), [phase100, isBanned, hasEnoughMoney100]);

  const handleDeposit = async () => {
    if (!depAmount || Number(depAmount) <= 0) return alert("እባክዎ ትክክለኛ መጠን ይስጡ!");
    if (!pastedSMS.trim()) return alert("እባክዎ የቴሌብር SMS መልእክትዎትን ድራፍ አድርገው ያስገቡ!");
    setIsSubmittingDep(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/deposit-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userName, amount: depAmount, pastedText: pastedSMS })
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) setPastedSMS('');
    } catch (err) {
      alert("የገንዘብ ማስታወቂያ ስህተት አጋጥሟል!");
    } finally {
      setIsSubmittingDep(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withAmount || Number(withAmount) <= 0) return alert("እባክዎ ትክክለኛ መጠን ይስጡ!");
    if (Number(withAmount) > Number(mainWallet)) {
      const msg = "⚠️ በቂ ዋና ሒሳብ (Main Wallet) የለዎትም!";
      if (window.Telegram?.WebApp?.showAlert) window.Telegram.WebApp.showAlert(msg);
      else alert(msg);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/withdraw-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userName, amount: withAmount, phone: userPhone })
      });
      const data = await res.json();
      alert(data.message);
      if (data.success) {
        if (data.balance !== undefined) setMainWallet(data.balance);
        else setMainWallet(prev => Number(prev) - Number(withAmount));
        setWithAmount('');
        fetchUserData();
      }
    } catch (err) {
      alert("የገንዘብ ማውጣት ስህተት አጋጥሟል!");
    }
  };

  const copyReferralLink = () => {
    const refLink = `https://t.me/fetan_lottery_bot?start=${userId}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(refLink).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = refLink;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (err) {}
      document.body.removeChild(textArea);
    }
  };

  const filteredAdminUsers = useMemo(() => {
    return adminUsers.filter(u =>
      u.userId.includes(adminSearch) ||
      (u.phone && u.phone.includes(adminSearch)) ||
      (u.firstName && u.firstName.toLowerCase().includes(adminSearch.toLowerCase()))
    );
  }, [adminUsers, adminSearch]);

  const activeTxList = txTypeView === 'deposit' ? allTx : allWithdrawals;
  const filteredTransactions = useMemo(() => {
    if (txFilter === 'ALL') return activeTxList;
    return activeTxList.filter(t => t.status === txFilter);
  }, [activeTxList, txFilter]);

  const cardStyle = {
    background: 'linear-gradient(160deg, rgba(26,26,54,0.85), rgba(18,18,42,0.9))',
    border: '1px solid rgba(100, 100, 180, 0.2)',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)'
  };

  const navBtnStyle = (active) => ({
    background: 'none',
    border: 'none',
    color: active ? '#fbbf24' : '#8b8ba7',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 'bold',
    gap: '3px',
    transition: 'color 0.2s ease, transform 0.2s ease',
    transform: active ? 'translateY(-3px)' : 'none',
    filter: active ? 'drop-shadow(0 0 12px rgba(251,191,36,0.8))' : 'none',
    padding: '6px 10px',
    borderRadius: '10px'
  });

  const boardHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    background: 'linear-gradient(180deg, rgba(14,14,34,0.95), rgba(10,10,22,0.95))',
    borderBottom: '1px solid rgba(100, 100, 180, 0.15)',
    flexShrink: 0,
    width: '100%',
    boxShadow: '0 2px 16px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)'
  };

  const statBoxStyle = (accentColor) => ({
    background: `linear-gradient(160deg, rgba(36,36,74,0.9), rgba(22,22,46,0.9))`,
    padding: '8px 4px',
    borderRadius: '12px',
    textAlign: 'center',
    border: `1px solid ${accentColor}33`,
    boxShadow: `0 3px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`
  });

  /* ═══════════════════════════════════════════════════════════════════
     Render a game board for any stake
     ═══════════════════════════════════════════════════════════════════ */
  const renderBoard = (stake) => {
    const isDaily = stake === 50 || stake === 100;
    const cfg = {
      10: {
        title: '10 ETB BOARD', accent: '#22c55e', accent2: '#16a34a',
        phase: phase10, time: selectionTime10, timeMax: 50,
        winning: winningNumber10, winner: winnerInfo10,
        playerCount: playerCount10, derash: derash10, gameId: currentGameId10,
        selected: selectedNumbers10, mySet: myPickedSet10, allSet: allPickedSet10,
        onToggle: onToggle10, isDisabled: isDisabled10, allPickedCount: allPickedNumbers10.length,
        bannerColor: 'linear-gradient(90deg, #22c55e, #15803d)',
        urgentColor: 'linear-gradient(90deg, #f59e0b, #dc2626)',
        spinColor: 'linear-gradient(90deg, #dc2626, #991b1b)'
      },
      20: {
        title: '20 ETB BOARD', accent: '#38bdf8', accent2: '#0369a1',
        phase: phase20, time: selectionTime20, timeMax: 50,
        winning: winningNumber20, winner: winnerInfo20,
        playerCount: playerCount20, derash: derash20, gameId: currentGameId20,
        selected: selectedNumbers20, mySet: myPickedSet20, allSet: allPickedSet20,
        onToggle: onToggle20, isDisabled: isDisabled20, allPickedCount: allPickedNumbers20.length,
        bannerColor: 'linear-gradient(90deg, #0ea5e9, #0369a1)',
        urgentColor: 'linear-gradient(90deg, #f59e0b, #dc2626)',
        spinColor: 'linear-gradient(90deg, #dc2626, #991b1b)'
      },
      50: {
        title: '50 ETB BOARD', accent: '#a78bfa', accent2: '#6d28d9',
        phase: phase50, time: selectionTime50, timeMax: 86400,
        winning: winningNumber50, winner: winnerInfo50,
        playerCount: playerCount50, derash: derash50, gameId: currentGameId50,
        selected: selectedNumbers50, mySet: myPickedSet50, allSet: allPickedSet50,
        onToggle: onToggle50, isDisabled: isDisabled50, allPickedCount: allPickedNumbers50.length,
        bannerColor: 'linear-gradient(90deg, #8b5cf6, #6d28d9)',
        urgentColor: 'linear-gradient(90deg, #f59e0b, #dc2626)',
        spinColor: 'linear-gradient(90deg, #dc2626, #991b1b)',
        resultColor: 'linear-gradient(90deg, #10b981, #059669)'
      },
      100: {
        title: '100 ETB BOARD', accent: '#facc15', accent2: '#ca8a04',
        phase: phase100, time: selectionTime100, timeMax: 86400,
        winning: winningNumber100, winner: winnerInfo100,
        playerCount: playerCount100, derash: derash100, gameId: currentGameId100,
        selected: selectedNumbers100, mySet: myPickedSet100, allSet: allPickedSet100,
        onToggle: onToggle100, isDisabled: isDisabled100, allPickedCount: allPickedNumbers100.length,
        bannerColor: 'linear-gradient(90deg, #facc15, #ca8a04)',
        urgentColor: 'linear-gradient(90deg, #f59e0b, #dc2626)',
        spinColor: 'linear-gradient(90deg, #dc2626, #991b1b)',
        resultColor: 'linear-gradient(90deg, #10b981, #059669)'
      }
    }[stake];

    const stakeLabelColor = stake === 10 ? '#22c55e' : stake === 20 ? '#38bdf8' : stake === 50 ? '#a78bfa' : '#facc15';
    const boardBg = stake === 10 ? 'rgba(34,197,94,0.12)' : stake === 20 ? 'rgba(56,189,248,0.12)' : stake === 50 ? 'rgba(167,139,250,0.12)' : 'rgba(250,204,21,0.12)';

    return (
      <div className="fade-in-up" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
        {/* Header */}
        <div style={boardHeaderStyle}>
          <button
            onClick={() => setCurrentScreen('home')}
            style={{
              background: 'linear-gradient(160deg, #1e1b4b, #12122a)',
              color: '#38bdf8',
              border: '1px solid #312e81',
              borderRadius: '10px',
              padding: '8px 16px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '800',
              boxShadow: '0 3px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(56,189,248,0.2)'
            }}
          >← Back</button>
          <div style={{
            fontSize: '12px',
            fontWeight: '900',
            background: `linear-gradient(120deg, ${cfg.accent}, ${cfg.accent2})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '1.5px'
          }}>
            {cfg.title}
          </div>
          <button
            onClick={() => fetchUserData()}
            style={{
              background: 'linear-gradient(160deg, #1e1b4b, #12122a)',
              color: '#22c55e',
              border: '1px solid #312e81',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '800',
              boxShadow: '0 3px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(34,197,94,0.2)'
            }}
          >🔄</button>
        </div>

        {/* Stat row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', padding: '10px 10px 6px 10px', flexShrink: 0, width: '100%' }}>
          <div style={statBoxStyle('#fbbf24')}>
            <div style={{ fontSize: '9px', color: '#8b8ba7', letterSpacing: '0.6px', fontWeight: '700' }}>GAME ID</div>
            <div style={{ fontSize: '10px', fontWeight: '900', color: '#fbbf24', marginTop: '2px' }}>{cfg.gameId}</div>
          </div>
          <div style={statBoxStyle('#38bdf8')}>
            <div style={{ fontSize: '9px', color: '#8b8ba7', letterSpacing: '0.6px', fontWeight: '700' }}>PLAYERS</div>
            <div style={{ fontSize: '13px', fontWeight: '900', color: '#38bdf8', marginTop: '1px' }}>{cfg.playerCount}</div>
          </div>
          <div style={statBoxStyle(stakeLabelColor)}>
            <div style={{ fontSize: '9px', color: '#8b8ba7', letterSpacing: '0.6px', fontWeight: '700' }}>STAKE</div>
            <div style={{ fontSize: '11px', fontWeight: '900', color: stakeLabelColor, marginTop: '2px' }}>{stake} ETB</div>
          </div>
          <div style={statBoxStyle('#22c55e')}>
            <div style={{ fontSize: '9px', color: '#8b8ba7', letterSpacing: '0.6px', fontWeight: '700' }}>DERASH</div>
            <div style={{ fontSize: '12px', fontWeight: '900', color: '#22c55e', marginTop: '1px' }}>{cfg.derash} ETB</div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: '10px', flex: 1, padding: '4px 10px 10px 10px', overflow: 'hidden', width: '100%' }}>
          {/* Left: number grid */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
            {/* Status banner */}
            <div style={{
              background: cfg.phase === 'spinning'
                ? (cfg.allPickedCount > 0 ? cfg.spinColor : 'linear-gradient(90deg, #6b7280, #4b5563)')
                : isDaily && cfg.phase === 'result'
                  ? cfg.resultColor
                  : (!isDaily && cfg.time <= 10) || (isDaily && cfg.time <= 60 && cfg.time > 0)
                    ? cfg.urgentColor
                    : cfg.bannerColor,
              padding: '10px 8px',
              borderRadius: '12px',
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: '800',
              flexShrink: 0,
              boxShadow: `0 3px 14px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)`,
              animation: ((!isDaily && cfg.time <= 10) || (isDaily && cfg.time <= 60 && cfg.time > 0)) && cfg.phase === 'selecting' ? 'pulseUrgent 1s ease-in-out infinite' : 'none',
              letterSpacing: '0.6px',
              color: stake === 100 && cfg.phase === 'selecting' && cfg.time > 60 ? '#1a1400' : '#ffffff'
            }}>
              {cfg.phase === 'spinning'
                ? (cfg.allPickedCount > 0 ? '✦ ቁጥር እያሰበሰበ ነው...' : '⚠️ ማንም ቁጥር አልመረጠም!')
                : isDaily && cfg.phase === 'result'
                  ? '🎉 ውጤት ወጥቷል!'
                  : isDaily
                    ? `📅 ዕጣ በ ማታ ${stake === 50 ? '12:00' : '12:05'} ⏱ ${formatCountdown(cfg.time)}`
                    : `⏱ የምረጣ ጊዜ ${cfg.time} S`}
            </div>

            <NumberGrid
              numbers={visibleNumbers}
              myPickedSet={cfg.mySet}
              allPickedSet={cfg.allSet}
              isDisabled={cfg.isDisabled}
              onToggle={cfg.onToggle}
            />
          </div>

          {/* Right: selection + winning number */}
          <div style={{ width: '170px', display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0, justifyContent: 'flex-start', overflowY: 'auto' }}>
            {/* Selected numbers */}
            <div style={{ ...cardStyle, borderRadius: '12px', padding: '10px 12px', minHeight: '70px', maxHeight: '100px', display: 'flex', flexDirection: 'column', flexShrink: 0, border: `1px solid ${cfg.accent}44` }}>
              <div style={{ fontSize: '10px', color: cfg.accent, marginBottom: '5px', fontWeight: '800', letterSpacing: '0.4px' }}>
                📌 የተመረጡ ({cfg.selected.length})
              </div>
              <div style={{ fontSize: '10px', color: '#c7d2fe', lineHeight: '1.4', wordBreak: 'break-word', overflowY: 'auto', flex: 1 }}>
                {cfg.selected.length > 0 ? cfg.selected.join(', ') : 'እስካሁን ማንም አልመረጠም'}
              </div>
            </div>

            {/* Winning display */}
            <div style={{ ...cardStyle, borderRadius: '14px', padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${cfg.accent}44`, position: 'relative' }}>
              <WinnerInfoTop label="🎲 የቁጥር ማውጣት" accent={cfg.accent} />
              <WinningDisplay winningNumber={cfg.winning} accentColor={cfg.accent} size={120} />
              {cfg.phase === 'result' && cfg.winner && <ConfettiBurst show={true} />}
            </div>

            {cfg.winner && <WinnerInfo info={cfg.winner} />}
          </div>
        </div>
      </div>
    );
  };

  const WinnerInfoTop = ({ label, accent }) => (
    <div style={{
      fontSize: '11px',
      fontWeight: '900',
      marginBottom: '12px',
      background: `linear-gradient(120deg, #ffffff, ${accent})`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      letterSpacing: '0.8px'
    }}>{label}</div>
  );

  return (
    <div style={{
      maxWidth: '500px',
      width: '100%',
      margin: '0 auto',
      background: 'radial-gradient(circle at 50% 0%, #1a1a3e 0%, #0c0c1e 55%, #05050f 100%)',
      color: '#ffffff',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxSizing: 'border-box',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box !important; }
        html, body { overscroll-behavior: none; }

        @keyframes arrowSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes rotateSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulseUrgent { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(0.99); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes floatIn { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(400px) rotate(720deg); opacity: 0; }
        }
        @keyframes numberPop {
          0% { transform: scale(0.4); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(251,191,36,0.4); }
          50% { box-shadow: 0 0 40px rgba(251,191,36,0.8); }
        }
        @keyframes auroraMove {
          0% { transform: translateX(-20%) translateY(-10%) rotate(0deg); }
          50% { transform: translateX(20%) translateY(10%) rotate(180deg); }
          100% { transform: translateX(-20%) translateY(-10%) rotate(360deg); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.7); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }

        .spin-arrow-container { animation: arrowSpin 0.3s linear infinite; }
        .fade-in-up { animation: fadeInUp 0.4s ease-out both; }
        .float-in { animation: floatIn 0.4s ease-out both; }

        input, textarea {
          outline: none;
          transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
          font-family: inherit;
        }
        input:focus, textarea:focus {
          border-color: #818cf8 !important;
          box-shadow: 0 0 0 4px rgba(129,140,248,0.2), 0 0 20px rgba(129,140,248,0.3) !important;
        }
        button {
          transition: filter 0.2s ease, transform 0.1s ease, box-shadow 0.25s ease;
          -webkit-tap-highlight-color: transparent;
        }
        button:hover:not(:disabled) { filter: brightness(1.12); }
        button:active:not(:disabled) { transform: scale(0.96); }

        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #4338ca, #312e81);
          border-radius: 6px;
        }
        ::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #6366f1, #4338ca); }
      `}} />

      {/* Aurora background effect */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0.4
      }}>
        <div style={{
          position: 'absolute',
          top: '-30%', left: '-20%',
          width: '80%', height: '80%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 60%)',
          animation: 'auroraMove 20s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          top: '20%', right: '-30%',
          width: '90%', height: '90%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 60%)',
          animation: 'auroraMove 25s ease-in-out infinite reverse'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-40%', left: '10%',
          width: '70%', height: '70%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 60%)',
          animation: 'auroraMove 30s ease-in-out infinite'
        }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        {currentTab === 'game' && (
          <>
            {currentScreen === 'home' && (
              <div className="fade-in-up" style={{ flex: 1, width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
                <h1 style={{
                  fontSize: '34px',
                  fontWeight: '900',
                  marginBottom: '4px',
                  textAlign: 'center',
                  width: '100%',
                  letterSpacing: '-0.8px',
                  background: 'linear-gradient(120deg, #ffffff 0%, #c7d2fe 50%, #ffffff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 4px 20px rgba(99,102,241,0.5))'
                }}>
                  Welcome to{' '}
                  <span style={{
                    background: 'linear-gradient(120deg, #fbbf24, #f59e0b, #fbbf24)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    backgroundSize: '200% auto',
                    animation: 'shimmer 3s linear infinite'
                  }}>Fetan Lottery</span>
                </h1>
                <div style={{ fontSize: '11px', color: '#8b8ba7', marginBottom: '26px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: '700' }}>
                  ✦ የዕድል ጨዋታ ✦
                </div>

                {isBanned && (
                  <div className="float-in" style={{
                    background: 'linear-gradient(160deg, #ef4444, #b91c1c)',
                    color: '#fff',
                    padding: '16px',
                    borderRadius: '14px',
                    marginBottom: '18px',
                    textAlign: 'center',
                    width: '100%',
                    fontWeight: '800',
                    boxShadow: '0 8px 24px rgba(239,68,68,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
                    border: '1px solid #fca5a5',
                    animation: 'glowPulse 2s infinite'
                  }}>
                    ⚠️ አካውንትዎ ታግዶ በድርጊት መሳተፍ አይችሉም!
                  </div>
                )}

                {/* Fast games */}
                <div className="float-in" style={{
                  ...cardStyle,
                  width: '100%',
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  border: '1px solid rgba(34,197,94,0.35)',
                  boxShadow: '0 0 40px rgba(34,197,94,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
                  marginBottom: '18px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                    background: 'linear-gradient(90deg, transparent, #22c55e, transparent)',
                    animation: 'shimmer 3s linear infinite'
                  }} />
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '900',
                    marginBottom: '18px',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    background: 'linear-gradient(120deg, #22c55e, #38bdf8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>⚡ Instant Games ⚡</div>

                  <button onClick={() => setCurrentScreen('board10')} style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    color: '#ffffff',
                    border: '1px solid #4ade80',
                    borderRadius: '14px',
                    padding: '15px',
                    fontSize: '15px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    marginBottom: '10px',
                    textAlign: 'center',
                    boxShadow: '0 6px 20px rgba(34,197,94,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
                    letterSpacing: '0.6px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    ► Play 10 ETB
                  </button>
                  <button onClick={() => setCurrentScreen('board20')} style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #0ea5e9, #0369a1)',
                    color: '#ffffff',
                    border: '1px solid #38bdf8',
                    borderRadius: '14px',
                    padding: '15px',
                    fontSize: '15px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    textAlign: 'center',
                    boxShadow: '0 6px 20px rgba(14,165,233,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
                    letterSpacing: '0.6px'
                  }}>
                    ► Play 20 ETB
                  </button>
                </div>

                {/* Daily games */}
                <div className="float-in" style={{
                  ...cardStyle,
                  width: '100%',
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  border: '1px solid rgba(245,158,11,0.35)',
                  boxShadow: '0 0 40px rgba(245,158,11,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
                  marginBottom: '18px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                    background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)',
                    animation: 'shimmer 3s linear infinite'
                  }} />
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '900',
                    marginBottom: '18px',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    background: 'linear-gradient(120deg, #f59e0b, #facc15)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>🏆 Daily Jackpot 🏆</div>

                  <button onClick={() => setCurrentScreen('board50')} style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                    color: '#ffffff',
                    border: '1px solid #a78bfa',
                    borderRadius: '14px',
                    padding: '15px',
                    fontSize: '15px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    textAlign: 'center',
                    boxShadow: '0 6px 20px rgba(139,92,246,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
                    letterSpacing: '0.6px'
                  }}>
                    ► Play 50 ETB
                  </button>
                  <div style={{ textAlign: 'center', fontSize: '10px', color: '#facc15', marginTop: '8px', fontWeight: '800', letterSpacing: '0.8px' }}>
                    📅 daily (በየቀኑ ማታ 12:00)
                  </div>

                  <button onClick={() => setCurrentScreen('board100')} style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #eab308, #a16207)',
                    color: '#1a1400',
                    border: '1px solid #facc15',
                    borderRadius: '14px',
                    padding: '15px',
                    fontSize: '15px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    textAlign: 'center',
                    marginTop: '16px',
                    boxShadow: '0 6px 20px rgba(234,179,8,0.5), inset 0 1px 0 rgba(255,255,255,0.35)',
                    letterSpacing: '0.6px'
                  }}>
                    ► Play 100 ETB
                  </button>
                  <div style={{ textAlign: 'center', fontSize: '10px', color: '#facc15', marginTop: '8px', fontWeight: '800', letterSpacing: '0.8px' }}>
                    📅 daily (በየቀኑ ማታ 12:05)
                  </div>
                </div>

                {isSuperAdmin && (
                  <div className="float-in" style={{
                    width: '100%',
                    ...cardStyle,
                    padding: '20px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '14px',
                    border: '1px solid #2d2d58'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', fontWeight: '900', background: 'linear-gradient(120deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textShadow: '0 0 20px rgba(56,189,248,0.5)' }}>{activeCount}</div>
                      <div style={{ fontSize: '10px', color: '#8b8ba7', marginTop: '6px', letterSpacing: '1.2px', textTransform: 'uppercase', fontWeight: '700' }}>Active Users</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', fontWeight: '900', background: 'linear-gradient(120deg, #22c55e, #16a34a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', textShadow: '0 0 20px rgba(34,197,94,0.5)' }}>{registeredCount}</div>
                      <div style={{ fontSize: '10px', color: '#8b8ba7', marginTop: '6px', letterSpacing: '1.2px', textTransform: 'uppercase', fontWeight: '700' }}>Registered</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentScreen === 'board10' && renderBoard(10)}
            {currentScreen === 'board20' && renderBoard(20)}
            {currentScreen === 'board50' && renderBoard(50)}
            {currentScreen === 'board100' && renderBoard(100)}
          </>
        )}

        {/* HISTORY TAB */}
        {currentTab === 'history' && (
          <div className="fade-in-up" style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '16px', textAlign: 'center', letterSpacing: '-0.5px' }}>📜 Game History</h1>
            <div style={{ ...cardStyle, padding: '20px', marginBottom: '20px', textAlign: 'center', border: '1px solid rgba(56,189,248,0.3)', boxShadow: '0 0 30px rgba(56,189,248,0.15)' }}>
              <div style={{ fontSize: '11px', color: '#8b8ba7', marginBottom: '8px', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: '700' }}>Total Games Played</div>
              <div style={{ fontSize: '38px', fontWeight: '900', background: 'linear-gradient(120deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 0 15px rgba(56,189,248,0.4))' }}>{totalGames}</div>
            </div>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff', marginBottom: '12px', letterSpacing: '0.4px' }}>🏆 Your Winning History</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {gameHistory.length > 0 ? (
                gameHistory.map((item, idx) => (
                  <div key={idx} style={{ ...cardStyle, borderRadius: '14px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #2a2a52' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#38bdf8' }}>Winning: #{item.winningNumber}</div>
                      <div style={{ fontSize: '11px', color: '#8b8ba7', marginTop: '4px' }}>👤 {item.winnerName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: '900', color: '#22c55e', textShadow: '0 0 12px rgba(34,197,94,0.5)' }}>+{item.derash} ETB</div>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently'}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '40px', fontSize: '13px' }}> እስካሁን የሎቶሪ ታሪክ አልተመዘገበም </div>
              )}
            </div>
          </div>
        )}

        {/* WALLET TAB */}
        {currentTab === 'wallet' && (
          <div className="fade-in-up" style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.4px' }}>💳 Wallet</h1>
              <button onClick={fetchUserData} style={{ background: 'linear-gradient(160deg, #1e1b4b, #12122a)', color: '#38bdf8', border: '1px solid #312e81', borderRadius: '10px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer', fontWeight: '800' }}>🔄</button>
            </div>
            <div style={{ ...cardStyle, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>👤</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{userPhone || 'ስልክ አልተመዘገበ'}</span>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: '800', boxShadow: '0 0 14px rgba(16,185,129,0.35)' }}>
                ✓ Verified
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ ...cardStyle, padding: '18px', textAlign: 'center', border: '1px solid rgba(96,165,250,0.4)', boxShadow: '0 0 24px rgba(96,165,250,0.2)' }}>
                  <div style={{ fontSize: '11px', color: '#93c5fd', marginBottom: '8px', letterSpacing: '0.6px', textTransform: 'uppercase', fontWeight: '800' }}>Main Wallet</div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff' }}>{mainWallet} <span style={{ fontSize: '12px', color: '#93c5fd' }}>ETB</span></div>
                </div>
                <div style={{ ...cardStyle, padding: '18px', textAlign: 'center', border: '1px solid rgba(16,185,129,0.4)', boxShadow: '0 0 24px rgba(16,185,129,0.2)' }}>
                  <div style={{ fontSize: '11px', color: '#6ee7b7', marginBottom: '8px', letterSpacing: '0.6px', textTransform: 'uppercase', fontWeight: '800' }}>Play Wallet</div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#10b981' }}>{playWallet} <span style={{ fontSize: '12px' }}>ETB</span></div>
                </div>
              </div>

              <div style={{ ...cardStyle, padding: '20px', border: '1px solid rgba(34,197,94,0.3)' }}>
                <h4 style={{ margin: '0 0 14px 0', fontSize: '15px', color: '#fbbf24', letterSpacing: '0.4px', fontWeight: '900' }}>📥 Deposit</h4>
                <div style={{ fontSize: '12px', color: '#a5a5c5', marginBottom: '14px', lineHeight: '1.6' }}>
                  1. የሚለውን የብር መጠን ይላኩ ወይም ያስገቡ<br />
                  2. የቴሌብር SMS መልእክትዎን ሙሉ በሙሉ ኮፒ በማድረግ ከዚህ በታች ባለው ሳጥን ውስጥ ያስገቡ
                </div>
                <label style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '800', display: 'block', marginBottom: '6px', letterSpacing: '0.4px' }}>የብር መጠን (ETB):</label>
                <input type="number" placeholder="ለአርአያ 100" value={depAmount} onChange={(e) => setDepAmount(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '14px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0a0a1a', color: '#fff', boxSizing: 'border-box', fontSize: '14px', fontWeight: '600' }} />
                <label style={{ fontSize: '11px', color: '#38bdf8', fontWeight: '800', display: 'block', marginBottom: '6px', letterSpacing: '0.4px' }}>የቴሌብር SMS መልእክት:</label>
                <textarea rows="4" placeholder="የቴሌብር SMS መልእክት እዚህ ጋር ድራፍ አድርገው ያስገቡ..." value={pastedSMS} onChange={(e) => setPastedSMS(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0a0a1a', color: '#fff', boxSizing: 'border-box', fontSize: '12px' }} />
                <button onClick={handleDeposit} disabled={isSubmittingDep} style={{ width: '100%', padding: '14px', background: isSubmittingDep ? 'linear-gradient(120deg, #6b7280, #4b5563)' : 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: '1px solid #4ade80', borderRadius: '12px', fontWeight: '900', cursor: isSubmittingDep ? 'not-allowed' : 'pointer', fontSize: '14px', boxShadow: isSubmittingDep ? 'none' : '0 6px 20px rgba(34,197,94,0.45), inset 0 1px 0 rgba(255,255,255,0.2)', letterSpacing: '0.4px' }}>
                  {isSubmittingDep ? 'እየተላከ ነው...' : '✓ Submit Deposit'}
                </button>
              </div>

              <div style={{ ...cardStyle, padding: '20px', border: '1px solid rgba(239,68,68,0.3)' }}>
                <h4 style={{ margin: '0 0 14px 0', fontSize: '15px', color: '#fca5a5', letterSpacing: '0.4px', fontWeight: '900' }}>📤 Withdraw</h4>
                <input type="number" placeholder="መጠን (ETB)" value={withAmount} onChange={(e) => setWithAmount(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '14px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0a0a1a', color: '#fff', boxSizing: 'border-box', fontSize: '14px', fontWeight: '600' }} />
                <button onClick={handleWithdraw} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff', border: '1px solid #fca5a5', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '14px', boxShadow: '0 6px 20px rgba(239,68,68,0.45), inset 0 1px 0 rgba(255,255,255,0.2)', letterSpacing: '0.4px' }}>
                  ✓ Submit Withdraw
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {currentTab === 'profile' && (
          <div className="fade-in-up" style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', marginBottom: '26px' }}>
              <div style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #3b82f6, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: '900',
                color: '#ffffff',
                marginBottom: '16px',
                overflow: 'hidden',
                border: '3px solid rgba(96,165,250,0.8)',
                boxShadow: '0 0 35px rgba(99,102,241,0.7), inset 0 0 25px rgba(255,255,255,0.15)'
              }}>
                {userPhoto ? <img src={userPhoto} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : userInitial}
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '900', margin: 0, letterSpacing: '-0.4px' }}>{userName}</h2>
              {tgUser?.username && <span style={{ fontSize: '13px', color: '#8b8ba7', marginTop: '6px', fontWeight: '600' }}>@{tgUser.username}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: '💳 Main Wallet', value: `${mainWallet} ETB`, color: '#60a5fa' },
                { label: '💳 Play Wallet', value: `${playWallet} ETB`, color: '#34d399' },
                { label: '🏆 Games Won', value: gamesWon, color: '#c084fc' },
                { label: '👥 Total Invite', value: totalInvite, color: '#f87171' }
              ].map((item, i) => (
                <div key={i} style={{
                  ...cardStyle,
                  padding: '18px',
                  textAlign: 'center',
                  border: `1px solid ${item.color}4d`,
                  boxShadow: `0 0 20px ${item.color}22, inset 0 1px 0 rgba(255,255,255,0.05)`
                }}>
                  <div style={{ color: item.color, fontSize: '12px', marginBottom: '8px', letterSpacing: '0.4px', fontWeight: '700' }}>{item.label}</div>
                  <div style={{ fontSize: '20px', fontWeight: '900' }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ ...cardStyle, padding: '22px', textAlign: 'center', border: '1px solid rgba(245,158,11,0.4)', boxShadow: '0 0 30px rgba(245,158,11,0.2), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '900', marginTop: 0, marginBottom: '12px', color: '#fbbf24', letterSpacing: '0.4px' }}> 🎁 ጓደኞችን ይጋብዙ </h3>
              <p style={{ fontSize: '12px', color: '#a5a5c5', marginBottom: '16px', lineHeight: '1.6' }}>
                የእርስዎን የመጋበዣ ሊንክ ለአርደኞችዎ በመላክ በእያንዳንዱ ግንኙነት ተጨማሪ ቦነስ ይደርስ!
              </p>
              <button onClick={copyReferralLink} style={{
                width: '100%',
                padding: '14px',
                background: copiedLink ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #0ea5e9, #0369a1)',
                color: '#ffffff',
                border: '1px solid ' + (copiedLink ? '#6ee7b7' : '#38bdf8'),
                borderRadius: '12px',
                fontWeight: '900',
                cursor: 'pointer',
                transition: 'all 0.25s',
                fontSize: '14px',
                boxShadow: copiedLink ? '0 6px 20px rgba(16,185,129,0.5)' : '0 6px 20px rgba(14,165,233,0.5)',
                letterSpacing: '0.4px'
              }}>
                {copiedLink ? '✓ የመጋበዣ ሊንክ ተቀድቷል' : '🔗 Copy Invite Link'}
              </button>
            </div>
          </div>
        )}

        {/* ADMIN TAB */}
        {isAdmin && currentTab === 'admin' && (
          <div className="fade-in-up" style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: '900', color: '#fbbf24', letterSpacing: '0.4px' }}>⚙️ Admin Panel</h1>
              <button onClick={fetchAdminData} style={{ background: 'linear-gradient(160deg, #1e1b4b, #12122a)', color: '#38bdf8', border: '1px solid #312e81', borderRadius: '10px', padding: '8px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: '800' }}>🔄 Refresh</button>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button onClick={() => setAdminTab('requests')} style={{ flex: 1, minWidth: '80px', padding: '10px 6px', borderRadius: '10px', border: '1px solid ' + (adminTab === 'requests' ? '#fbbf24' : '#2d2d58'), background: adminTab === 'requests' ? 'linear-gradient(120deg, #f59e0b, #d97706)' : 'linear-gradient(160deg, #1e1b4b, #12122a)', color: adminTab === 'requests' ? '#000' : '#fff', fontSize: '11px', fontWeight: '900', cursor: 'pointer', boxShadow: adminTab === 'requests' ? '0 4px 14px rgba(245,158,11,0.5)' : 'none' }}>📁 Txns</button>
              {isSuperAdmin && (
                <>
                  <button onClick={() => setAdminTab('reports')} style={{ flex: 1, minWidth: '80px', padding: '10px 6px', borderRadius: '10px', border: '1px solid ' + (adminTab === 'reports' ? '#fbbf24' : '#2d2d58'), background: adminTab === 'reports' ? 'linear-gradient(120deg, #f59e0b, #d97706)' : 'linear-gradient(160deg, #1e1b4b, #12122a)', color: adminTab === 'reports' ? '#000' : '#fff', fontSize: '11px', fontWeight: '900', cursor: 'pointer', boxShadow: adminTab === 'reports' ? '0 4px 14px rgba(245,158,11,0.5)' : 'none' }}>📊 Stats</button>
                  <button onClick={() => setAdminTab('users')} style={{ flex: 1, minWidth: '80px', padding: '10px 6px', borderRadius: '10px', border: '1px solid ' + (adminTab === 'users' ? '#fbbf24' : '#2d2d58'), background: adminTab === 'users' ? 'linear-gradient(120deg, #f59e0b, #d97706)' : 'linear-gradient(160deg, #1e1b4b, #12122a)', color: adminTab === 'users' ? '#000' : '#fff', fontSize: '11px', fontWeight: '900', cursor: 'pointer', boxShadow: adminTab === 'users' ? '0 4px 14px rgba(245,158,11,0.5)' : 'none' }}>Users</button>
                  <button onClick={() => setAdminTab('game_control')} style={{ flex: 1, minWidth: '80px', padding: '10px 6px', borderRadius: '10px', border: '1px solid ' + (adminTab === 'game_control' ? '#fbbf24' : '#2d2d58'), background: adminTab === 'game_control' ? 'linear-gradient(120deg, #f59e0b, #d97706)' : 'linear-gradient(160deg, #1e1b4b, #12122a)', color: adminTab === 'game_control' ? '#000' : '#fff', fontSize: '11px', fontWeight: '900', cursor: 'pointer', boxShadow: adminTab === 'game_control' ? '0 4px 14px rgba(245,158,11,0.5)' : 'none' }}>Draw</button>
                  <button onClick={() => setAdminTab('settings')} style={{ flex: 1, minWidth: '80px', padding: '10px 6px', borderRadius: '10px', border: '1px solid ' + (adminTab === 'settings' ? '#fbbf24' : '#2d2d58'), background: adminTab === 'settings' ? 'linear-gradient(120deg, #f59e0b, #d97706)' : 'linear-gradient(160deg, #1e1b4b, #12122a)', color: adminTab === 'settings' ? '#000' : '#fff', fontSize: '11px', fontWeight: '900', cursor: 'pointer', boxShadow: adminTab === 'settings' ? '0 4px 14px rgba(245,158,11,0.5)' : 'none' }}>Config</button>
                  <button onClick={() => setAdminTab('broadcast')} style={{ flex: 1, minWidth: '80px', padding: '10px 6px', borderRadius: '10px', border: '1px solid ' + (adminTab === 'broadcast' ? '#fbbf24' : '#2d2d58'), background: adminTab === 'broadcast' ? 'linear-gradient(120deg, #f59e0b, #d97706)' : 'linear-gradient(160deg, #1e1b4b, #12122a)', color: adminTab === 'broadcast' ? '#000' : '#fff', fontSize: '11px', fontWeight: '900', cursor: 'pointer', boxShadow: adminTab === 'broadcast' ? '0 4px 14px rgba(245,158,11,0.5)' : 'none' }}>📢</button>
                </>
              )}
            </div>

            {adminTab === 'requests' && (
              <div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                  <button onClick={() => setTxTypeView('deposit')} style={{ flex: 1, padding: '10px', fontSize: '11px', borderRadius: '10px', border: '1px solid ' + (txTypeView === 'deposit' ? '#38bdf8' : '#2d2d58'), background: txTypeView === 'deposit' ? 'linear-gradient(120deg, #0ea5e9, #0369a1)' : 'linear-gradient(160deg, #1e1b4b, #12122a)', color: '#fff', fontWeight: '900', cursor: 'pointer', boxShadow: txTypeView === 'deposit' ? '0 4px 14px rgba(14,165,233,0.4)' : 'none' }}> 📥 Deposits </button>
                  <button onClick={() => setTxTypeView('withdrawal')} style={{ flex: 1, padding: '10px', fontSize: '11px', borderRadius: '10px', border: '1px solid ' + (txTypeView === 'withdrawal' ? '#38bdf8' : '#2d2d58'), background: txTypeView === 'withdrawal' ? 'linear-gradient(120deg, #0ea5e9, #0369a1)' : 'linear-gradient(160deg, #1e1b4b, #12122a)', color: '#fff', fontWeight: '900', cursor: 'pointer', boxShadow: txTypeView === 'withdrawal' ? '0 4px 14px rgba(14,165,233,0.4)' : 'none' }}> 📤 Withdrawals </button>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                  {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(status => (
                    <button key={status} onClick={() => setTxFilter(status)} style={{ flex: 1, padding: '8px 4px', fontSize: '10px', borderRadius: '8px', border: '1px solid ' + (txFilter === status ? '#fbbf24' : '#2d2d58'), backgroundColor: txFilter === status ? 'rgba(245,158,11,0.2)' : 'transparent', color: txFilter === status ? '#fbbf24' : '#8b8ba7', fontWeight: '900', cursor: 'pointer' }}>
                      {status} ({activeTxList.filter(t => status === 'ALL' ? true : t.status === status).length})
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => (
                      <div key={tx._id} style={{ ...cardStyle, borderRadius: '14px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: txTypeView === 'deposit' ? '#22c55e' : '#ef4444', fontWeight: '900', letterSpacing: '0.6px' }}>
                            {txTypeView === 'deposit' ? '▼ DEPOSIT' : '▲ WITHDRAWAL'}
                          </span>
                          <span style={{ fontSize: '10px', padding: '4px 12px', borderRadius: '14px', backgroundColor: tx.status === 'PENDING' ? '#eab308' : (tx.status === 'APPROVED' ? '#22c55e' : '#ef4444'), color: '#000', fontWeight: '900', letterSpacing: '0.5px' }}>
                            {tx.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: '#facc15', marginBottom: '6px' }}>{tx.amount} ETB</div>
                        <div style={{ fontSize: '11px', color: '#a5a5c5' }}>👤 {tx.userName} (ID: {tx.userId})</div>
                        {tx.phone && <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '3px' }}>📱 {tx.phone}</div>}
                        {tx.transactionId && <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '3px' }}>🔑 {tx.transactionId}</div>}
                        {tx.processedBy && <div style={{ fontSize: '10px', color: '#a7f3d0', marginTop: '3px' }}>👨‍💼 {tx.processedBy}</div>}
                        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '3px' }}>⏱️ {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}</div>
                        {tx.pastedText && (
                          <div style={{ marginTop: '10px', padding: '10px', background: '#0a0a1a', borderRadius: '10px', border: '1px solid #1e293b' }}>
                            <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '800', marginBottom: '4px', letterSpacing: '0.4px' }}>📄 PASTED SMS</div>
                            <div style={{ fontSize: '11px', color: '#fff', wordBreak: 'break-all', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{tx.pastedText}</div>
                          </div>
                        )}
                        {tx.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button onClick={() => handleProcessTx(tx._id, 'APPROVED', txTypeView)} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: '1px solid #4ade80', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontSize: '12px', boxShadow: '0 4px 14px rgba(34,197,94,0.4)' }}> ✓ Approve </button>
                            <button onClick={() => handleProcessTx(tx._id, 'REJECTED', txTypeView)} style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff', border: '1px solid #fca5a5', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontSize: '12px', boxShadow: '0 4px 14px rgba(239,68,68,0.4)' }}> ✕ Reject </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', color: '#8b8ba7', padding: '40px', fontSize: '13px' }}>ምንም አልተመዘገበ</div>
                  )}
                </div>
              </div>
            )}

            {isSuperAdmin && adminTab === 'reports' && financialStats && (
              <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ fontSize: '14px', color: '#fbbf24', margin: '0 0 4px 0', letterSpacing: '0.4px', fontWeight: '900' }}>📊 Financial Dashboard</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ ...cardStyle, padding: '18px', border: '1px solid rgba(34,197,94,0.5)', textAlign: 'center', boxShadow: '0 0 24px rgba(34,197,94,0.25)' }}>
                    <div style={{ fontSize: '11px', color: '#8b8ba7', letterSpacing: '0.6px', fontWeight: '700' }}>ገቢ (Deposit)</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#22c55e', marginTop: '6px', textShadow: '0 0 14px rgba(34,197,94,0.5)' }}>{financialStats.totalDeposit} <span style={{ fontSize: '11px' }}>ETB</span></div>
                  </div>
                  <div style={{ ...cardStyle, padding: '18px', border: '1px solid rgba(239,68,68,0.5)', textAlign: 'center', boxShadow: '0 0 24px rgba(239,68,68,0.25)' }}>
                    <div style={{ fontSize: '11px', color: '#8b8ba7', letterSpacing: '0.6px', fontWeight: '700' }}>ወጪ (Withdrawal)</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#ef4444', marginTop: '6px', textShadow: '0 0 14px rgba(239,68,68,0.5)' }}>{financialStats.totalWithdrawal} <span style={{ fontSize: '11px' }}>ETB</span></div>
                  </div>
                </div>
                <div style={{ ...cardStyle, padding: '24px', border: '1px solid rgba(250,204,21,0.6)', textAlign: 'center', boxShadow: '0 0 30px rgba(250,204,21,0.3)' }}>
                  <div style={{ fontSize: '12px', color: '#8b8ba7', letterSpacing: '0.6px', textTransform: 'uppercase', fontWeight: '700' }}>House Net Commission</div>
                  <div style={{ fontSize: '32px', fontWeight: '900', background: 'linear-gradient(120deg, #facc15, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginTop: '10px', filter: 'drop-shadow(0 0 20px rgba(250,204,21,0.6))' }}>{financialStats.houseProfit} <span style={{ fontSize: '14px' }}>ETB</span></div>
                </div>
              </div>
            )}

            {isSuperAdmin && adminTab === 'users' && (
              <>
                <input type="text" placeholder="🔍 በተጠቃሚ ID ወይም ስልክ ፈልግ..." value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} style={{ width: '100%', padding: '13px', borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0a0a1a', color: '#fff', marginBottom: '16px', boxSizing: 'border-box', fontSize: '13px', fontWeight: '600' }} />
                {editingUser && (
                  <div className="float-in" style={{ background: 'linear-gradient(160deg, #1b1b38, #12122a)', border: '1px solid #fbbf24', borderRadius: '16px', padding: '18px', marginBottom: '16px', boxShadow: '0 0 30px rgba(251,191,36,0.3)' }}>
                    <h3 style={{ fontSize: '13px', color: '#fbbf24', margin: '0 0 14px 0', letterSpacing: '0.4px', fontWeight: '900' }}>✏️ የተጠቃሚ ሒሳብ: {editingUser.userId}</h3>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10px', color: '#8b8ba7', letterSpacing: '0.4px', fontWeight: '700' }}>Main Wallet:</label>
                        <input type="number" value={editMain} onChange={(e) => setEditMain(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #312e81', backgroundColor: '#05050f', color: '#fff', marginTop: '4px' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10px', color: '#8b8ba7', letterSpacing: '0.4px', fontWeight: '700' }}>Play Wallet:</label>
                        <input type="number" value={editPlay} onChange={(e) => setEditPlay(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #312e81', backgroundColor: '#05050f', color: '#fff', marginTop: '4px' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleUpdateUserBalance} style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: '1px solid #4ade80', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontSize: '12px' }}>💾 Save</button>
                      <button onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff', border: '1px solid #fca5a5', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontSize: '12px' }}>✕ Cancel</button>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredAdminUsers.map((u) => (
                    <div key={u.userId} style={{ ...cardStyle, borderRadius: '14px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '900', color: '#38bdf8' }}>{u.firstName || 'ተጠቃሚ'} <span style={{ color: '#8b8ba7', fontSize: '11px', fontWeight: '600' }}>(ID: {u.userId})</span></div>
                        <div style={{ fontSize: '11px', color: '#8b8ba7', marginTop: '4px' }}>📱 {u.phone || 'ስልክ የለው'}</div>
                        <div style={{ fontSize: '11px', color: '#22c55e', marginTop: '4px', fontWeight: '700' }}>💳 {u.mainWallet} | 🎮 {u.playWallet} ETB</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <button onClick={() => { setEditingUser(u); setEditMain(u.mainWallet); setEditPlay(u.playWallet); }} style={{ background: 'linear-gradient(135deg, #0ea5e9, #0369a1)', color: '#fff', border: '1px solid #38bdf8', borderRadius: '8px', padding: '8px 14px', fontSize: '11px', cursor: 'pointer', fontWeight: '900' }}> ✏️ Edit </button>
                        <button onClick={() => handleToggleBan(u.userId, u.isBanned)} style={{ background: u.isBanned ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #b91c1c)', color: '#fff', border: '1px solid ' + (u.isBanned ? '#6ee7b7' : '#fca5a5'), borderRadius: '8px', padding: '8px 14px', fontSize: '11px', cursor: 'pointer', fontWeight: '900' }}> {u.isBanned ? '✓ Unban' : '✕ Ban'} </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {isSuperAdmin && adminTab === 'game_control' && (
              <div style={{ ...cardStyle, padding: '22px', border: '1px solid rgba(245,158,11,0.4)' }}>
                <h3 style={{ fontSize: '15px', color: '#fbbf24', marginTop: 0, letterSpacing: '0.4px', fontWeight: '900' }}>🎯 የቁጥር ማውጫ መቆጣጠሪያ</h3>
                <input type="number" placeholder="የማሸነፊያ ቁጥር አስገባ (1-1250)" value={manualNumberInput} onChange={(e) => setManualNumberInput(e.target.value)} style={{ width: '100%', padding: '13px', borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0a0a1a', color: '#fff', marginBottom: '14px', boxSizing: 'border-box', fontSize: '13px' }} />
                <button onClick={handleSetManualWinner} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#000', border: '1px solid #fbbf24', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '13px', boxShadow: '0 6px 20px rgba(245,158,11,0.5)' }}>✓ መደብ አስቀምጥ</button>
              </div>
            )}

            {isSuperAdmin && adminTab === 'settings' && (
              <div style={{ ...cardStyle, padding: '22px', border: '1px solid rgba(245,158,11,0.4)' }}>
                <h3 style={{ fontSize: '15px', color: '#fbbf24', marginTop: 0, letterSpacing: '0.4px', fontWeight: '900' }}>⚙️ የሲስተም ማስተካከያዎች</h3>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', color: '#8b8ba7', letterSpacing: '0.4px', fontWeight: '700' }}>የቲኬት ዋጋ (Ticket Price):</label>
                  <input type="number" value={sysSettings.ticketPrice} onChange={(e) => setSysSettings({...sysSettings, ticketPrice: Number(e.target.value)})} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0a0a1a', color: '#fff', marginTop: '6px', fontSize: '13px' }} />
                </div>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ fontSize: '11px', color: '#8b8ba7', letterSpacing: '0.4px', fontWeight: '700' }}>የአሸናፊው ድርሻ በመቶኛ (Winner %):</label>
                  <input type="number" value={sysSettings.winnerPercentage} onChange={(e) => setSysSettings({...sysSettings, winnerPercentage: Number(e.target.value)})} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0a0a1a', color: '#fff', marginTop: '6px', fontSize: '13px' }} />
                </div>
                <button onClick={() => handleUpdateSettings()} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: '1px solid #4ade80', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '13px', boxShadow: '0 6px 20px rgba(34,197,94,0.5)' }}>💾 ቅንብሮችን አዘምን</button>
              </div>
            )}

            {isSuperAdmin && adminTab === 'broadcast' && (
              <div style={{ ...cardStyle, padding: '22px', border: '1px solid rgba(14,165,233,0.4)' }}>
                <h3 style={{ fontSize: '15px', color: '#38bdf8', marginTop: 0, letterSpacing: '0.4px', fontWeight: '900' }}>📢 ለሁሉም ተጠቃሚዎች መልእክት መላክ</h3>
                <textarea rows="4" placeholder="መልእክትዎን እዚህ ይጻፉ..." value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} style={{ width: '100%', padding: '13px', borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0a0a1a', color: '#fff', marginBottom: '14px', boxSizing: 'border-box', fontSize: '13px' }} />
                <button onClick={handleSendBroadcast} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #0ea5e9, #0369a1)', color: '#fff', border: '1px solid #38bdf8', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '13px', boxShadow: '0 6px 20px rgba(14,165,233,0.5)' }}>📤 መልእክት አስተላልፍ</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      {!(currentTab === 'game' && currentScreen !== 'home') && (
        <div style={{
          width: '100%',
          height: '70px',
          background: 'linear-gradient(180deg, rgba(10,10,22,0.98), rgba(5,5,15,1))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(100, 100, 180, 0.2)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          flexShrink: 0,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.6)',
          padding: '0 8px',
          position: 'relative',
          zIndex: 10
        }}>
          <button onClick={() => { setCurrentTab('game'); setCurrentScreen('home'); }} style={navBtnStyle(currentTab === 'game')}>
            <span style={{ fontSize: '22px' }}>🎮</span>
            <span style={{ fontSize: '10px', fontWeight: '900' }}>Game</span>
          </button>
          <button onClick={() => setCurrentTab('history')} style={navBtnStyle(currentTab === 'history')}>
            <span style={{ fontSize: '22px' }}>📜</span>
            <span style={{ fontSize: '10px', fontWeight: '900' }}>History</span>
          </button>
          <button onClick={() => setCurrentTab('wallet')} style={navBtnStyle(currentTab === 'wallet')}>
            <span style={{ fontSize: '22px' }}>💳</span>
            <span style={{ fontSize: '10px', fontWeight: '900' }}>Wallet</span>
          </button>
          <button onClick={() => setCurrentTab('profile')} style={navBtnStyle(currentTab === 'profile')}>
            <span style={{ fontSize: '22px' }}>👤</span>
            <span style={{ fontSize: '10px', fontWeight: '900' }}>Profile</span>
          </button>
          {isAdmin && (
            <button onClick={() => setCurrentTab('admin')} style={navBtnStyle(currentTab === 'admin')}>
              <span style={{ fontSize: '22px' }}>⚙️</span>
              <span style={{ fontSize: '10px', fontWeight: '900' }}>Admin</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}