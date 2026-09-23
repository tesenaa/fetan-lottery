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
  if (d > 0) return `${d}ቀ ${h}ሰ ${String(m).padStart(2, '0')}ደ ${String(s).padStart(2, '0')}ሰ`;
  if (h > 0) return `${h}ሰ ${String(m).padStart(2, '0')}ደ ${String(s).padStart(2, '0')}ሰ`;
  return `${m}ደ ${String(s).padStart(2, '0')}ሰ`;
}

const NumberButton = React.memo(({ num, isMine, isOthers, disabled, onClick }) => {
  let background = 'linear-gradient(160deg, #2e2e48, #1c1c32)';
  let borderColor = '#3a3a5e';
  let boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.4)';
  let textColor = '#cbd5e1';
  if (isMine) {
    background = 'linear-gradient(160deg, #34d399, #059669)';
    borderColor = '#6ee7b7';
    boxShadow = '0 0 10px rgba(52, 211, 153, 0.55), inset 0 1px 0 rgba(255,255,255,0.25)';
    textColor = '#ffffff';
  } else if (isOthers) {
    background = 'linear-gradient(160deg, #fb7185, #dc2626)';
    borderColor = '#fda4af';
    boxShadow = '0 0 10px rgba(239, 68, 68, 0.45), inset 0 1px 0 rgba(255,255,255,0.2)';
    textColor = '#ffffff';
  }
  return (
    <button
      onClick={() => onClick(num)}
      disabled={disabled}
      style={{
        padding: '8px 0',
        background,
        color: textColor,
        border: `1px solid ${borderColor}`,
        borderRadius: '8px',
        fontSize: '11px',
        fontWeight: '800',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        boxShadow,
        transition: 'transform 0.08s ease, box-shadow 0.18s ease, filter 0.18s ease',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        willChange: 'transform',
        letterSpacing: '0.3px'
      }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.92)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
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

// Virtualized number grid: renders only the rows near the visible scroll area
const GRID_COLUMNS = 5;
const GRID_ROW_HEIGHT = 34;
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
        paddingRight: '4px',
        flex: 1,
        background: 'linear-gradient(180deg, #0f0f24, #0a0a1c)',
        borderRadius: '10px',
        padding: '6px',
        border: '1px solid #23234a',
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)'
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
            gap: '4px',
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
    return Array.from({ length: 1000 }, (_, i) => i + 1);
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
      const gameStake = data.ticketPrice || 10;
      if (gameStake === 100) {
        setPhase100(data.gamePhase || 'selecting');
        setWinningNumber100(data.winningNumber || '?');
        if (data.gameId) setCurrentGameId100(data.gameId);
        if (data.selectedNumbers && Array.isArray(data.selectedNumbers)) {
          const allPicked = data.selectedNumbers.map(n => typeof n === 'object' ? n.number : n);
          setAllPickedNumbers100(allPicked);
          const myPicked = data.selectedNumbers
            .filter(n => typeof n === 'object' && String(n.userId) === String(userId))
            .map(n => n.number);
          setSelectedNumbers100(myPicked);
          updateBoardStats100(data.selectedNumbers);
        }
      } else if (gameStake === 50) {
        setPhase50(data.gamePhase || 'selecting');
        setWinningNumber50(data.winningNumber || '?');
        if (data.gameId) setCurrentGameId50(data.gameId);
        if (data.selectedNumbers && Array.isArray(data.selectedNumbers)) {
          const allPicked = data.selectedNumbers.map(n => typeof n === 'object' ? n.number : n);
          setAllPickedNumbers50(allPicked);
          const myPicked = data.selectedNumbers
            .filter(n => typeof n === 'object' && String(n.userId) === String(userId))
            .map(n => n.number);
          setSelectedNumbers50(myPicked);
          updateBoardStats50(data.selectedNumbers);
        }
      } else if (gameStake === 20) {
        setPhase20(data.gamePhase || 'selecting');
        setSelectionTime20(data.timeLeft !== undefined ? data.timeLeft : 50);
        setWinningNumber20(data.winningNumber || '?');
        if (data.gameId) setCurrentGameId20(data.gameId);
        if (data.selectedNumbers && Array.isArray(data.selectedNumbers)) {
          const allPicked = data.selectedNumbers.map(n => typeof n === 'object' ? n.number : n);
          setAllPickedNumbers20(allPicked);
          const myPicked = data.selectedNumbers
            .filter(n => typeof n === 'object' && String(n.userId) === String(userId))
            .map(n => n.number);
          setSelectedNumbers20(myPicked);
          updateBoardStats20(data.selectedNumbers);
        }
      } else {
        setPhase10(data.gamePhase || 'selecting');
        setSelectionTime10(data.timeLeft !== undefined ? data.timeLeft : 50);
        setWinningNumber10(data.winningNumber || '?');
        if (data.gameId) setCurrentGameId10(data.gameId);
        if (data.selectedNumbers && Array.isArray(data.selectedNumbers)) {
          const allPicked = data.selectedNumbers.map(n => typeof n === 'object' ? n.number : n);
          setAllPickedNumbers10(allPicked);
          const myPicked = data.selectedNumbers
            .filter(n => typeof n === 'object' && String(n.userId) === String(userId))
            .map(n => n.number);
          setSelectedNumbers10(myPicked);
          updateBoardStats10(data.selectedNumbers);
        }
      }
    });

    socket.on('timer_tick', (data) => {
      if (!data) return;
      const gameStake = data.ticketPrice || 10;
      if (gameStake === 100) {
        if (data.gamePhase) setPhase100(data.gamePhase);
        if (data.gameId) setCurrentGameId100(data.gameId);
      } else if (gameStake === 50) {
        if (data.gamePhase) setPhase50(data.gamePhase);
        if (data.gameId) setCurrentGameId50(data.gameId);
      } else if (gameStake === 20) {
        setSelectionTime20(data.timeLeft);
        if (data.gamePhase) setPhase20(data.gamePhase);
        if (data.gameId) setCurrentGameId20(data.gameId);
      } else {
        setSelectionTime10(data.timeLeft);
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
          const myPicked = data.selectedNumbers
            .filter(n => typeof n === 'object' && String(n.userId) === String(userId))
            .map(n => n.number);
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
          const myPicked = data.selectedNumbers
            .filter(n => typeof n === 'object' && String(n.userId) === String(userId))
            .map(n => n.number);
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
          const myPicked = data.selectedNumbers
            .filter(n => typeof n === 'object' && String(n.userId) === String(userId))
            .map(n => n.number);
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
          const myPicked = data.selectedNumbers
            .filter(n => typeof n === 'object' && String(n.userId) === String(userId))
            .map(n => n.number);
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
      if (isAdmin) {
        fetchAdminData();
      }
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
  }, [socket, userId, updateBoardStats10, updateBoardStats20, updateBoardStats50, updateBoardStats100, fetchUserData, fetchAdminData, isAdmin]);

  const toggleNumber = useCallback((num, stake) => {
    let currentPhase = phase10;
    let mySet = myPickedSet10;
    if (stake === 20) {
      currentPhase = phase20;
      mySet = myPickedSet20;
    } else if (stake === 50) {
      currentPhase = phase50;
      mySet = myPickedSet50;
    } else if (stake === 100) {
      currentPhase = phase100;
      mySet = myPickedSet100;
    }

    if (currentPhase !== 'selecting') return;
    if (isBanned) return alert("አካውንትዎ በድርጊት ማገድ ምክንያት መምረጥ አይችሉም!");

    const totalAvailableBalance = Number(mainWallet) + Number(playWallet);

    if (mySet.has(num)) {
      if (stake === 100) {
        setSelectedNumbers100(prev => prev.filter(n => n !== num));
        setAllPickedNumbers100(prev => prev.filter(n => n !== num));
      } else if (stake === 50) {
        setSelectedNumbers50(prev => prev.filter(n => n !== num));
        setAllPickedNumbers50(prev => prev.filter(n => n !== num));
      } else if (stake === 20) {
        setSelectedNumbers20(prev => prev.filter(n => n !== num));
        setAllPickedNumbers20(prev => prev.filter(n => n !== num));
      } else {
        setSelectedNumbers10(prev => prev.filter(n => n !== num));
        setAllPickedNumbers10(prev => prev.filter(n => n !== num));
      }
      setMainWallet(prev => Number(prev) + Number(stake));
      socket.emit('deselect_number', { numberChosen: num, userId, stake });
    } else {
      if (totalAvailableBalance < Number(stake)) {
        const msg = `⚠️ በቂ ሂሳብ የለዎትም! እባክዎ አካውንት ላይ ገንዘብ ይሙሉ።`;
        if (window.Telegram?.WebApp?.showAlert) {
          window.Telegram.WebApp.showAlert(msg);
        } else {
          alert(msg);
        }
        return;
      }

      if (Number(playWallet) >= Number(stake)) {
        setPlayWallet(prev => Number(prev) - Number(stake));
      } else {
        const remainingStake = Number(stake) - Number(playWallet);
        setPlayWallet(0);
        setMainWallet(prev => Number(prev) - Number(remainingStake));
      }

      if (stake === 100) {
        setSelectedNumbers100(prev => [...prev, num]);
        setAllPickedNumbers100(prev => [...prev, num]);
      } else if (stake === 50) {
        setSelectedNumbers50(prev => [...prev, num]);
        setAllPickedNumbers50(prev => [...prev, num]);
      } else if (stake === 20) {
        setSelectedNumbers20(prev => [...prev, num]);
        setAllPickedNumbers20(prev => [...prev, num]);
      } else {
        setSelectedNumbers10(prev => [...prev, num]);
        setAllPickedNumbers10(prev => [...prev, num]);
      }
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
  const isDisabled50 = useCallback((isMine) => isBanned || (!hasEnoughMoney50 && !isMine), [isBanned, hasEnoughMoney50]);
  const isDisabled100 = useCallback((isMine) => isBanned || (!hasEnoughMoney100 && !isMine), [isBanned, hasEnoughMoney100]);

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
      if (data.success) {
        setPastedSMS('');
      }
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
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert(msg);
      } else {
        alert(msg);
      }
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
        if (data.balance !== undefined) {
          setMainWallet(data.balance);
        } else {
          setMainWallet(prev => Number(prev) - Number(withAmount));
        }
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

  // Shared visual helpers
  const cardStyle = {
    background: 'linear-gradient(160deg, #1a1a36, #12122a)',
    border: '1px solid #2a2a52',
    borderRadius: '14px',
    boxShadow: '0 4px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)'
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
    gap: '2px',
    transition: 'color 0.2s ease, transform 0.15s ease',
    transform: active ? 'translateY(-2px)' : 'none',
    filter: active ? 'drop-shadow(0 0 8px rgba(251,191,36,0.6))' : 'none'
  });

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
      overflow: 'hidden'
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box !important; }
        @keyframes arrowSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spin-arrow-container { animation: arrowSpin 0.3s linear infinite; }
        @keyframes pulseUrgent { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.75; transform: scale(0.995); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glowPulse { 0%, 100% { box-shadow: 0 0 12px rgba(251,191,36,0.35); } 50% { box-shadow: 0 0 24px rgba(251,191,36,0.65); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes floatIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        .fade-in-up { animation: fadeInUp 0.35s ease-out both; }
        .float-in { animation: floatIn 0.35s ease-out both; }
        input, textarea { outline: none; transition: border-color 0.2s ease, box-shadow 0.2s ease; font-family: inherit; }
        input:focus, textarea:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.18); }
        button { transition: filter 0.15s ease, transform 0.08s ease, box-shadow 0.2s ease; }
        button:hover:not(:disabled) { filter: brightness(1.08); }
        button:active:not(:disabled) { transform: scale(0.97); }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #4338ca, #312e81); border-radius: 6px; }
      `}} />

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
        {currentTab === 'game' && (
          <>
            {currentScreen === 'home' && (
              <div className="fade-in-up" style={{ flex: 1, width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' }}>
                <h1 style={{
                  fontSize: '30px',
                  fontWeight: '900',
                  marginBottom: '6px',
                  textAlign: 'center',
                  width: '100%',
                  letterSpacing: '-0.5px',
                  background: 'linear-gradient(120deg, #ffffff 0%, #c7d2fe 50%, #ffffff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 2px 12px rgba(99,102,241,0.35))'
                }}>
                  Welcome to <span style={{ background: 'linear-gradient(120deg, #fbbf24, #f59e0b, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Fetan Lottery</span>
                </h1>
                <div style={{ fontSize: '12px', color: '#8b8ba7', marginBottom: '22px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>✦ የዕድል ጨዋታ ✦</div>

                {isBanned && (
                  <div className="float-in" style={{
                    background: 'linear-gradient(160deg, #ef4444, #b91c1c)',
                    color: '#fff',
                    padding: '14px',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    textAlign: 'center',
                    width: '100%',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 18px rgba(239,68,68,0.4)',
                    border: '1px solid #fca5a5'
                  }}>
                    ⚠️ አካውንትዎ ታግዶ በድርጊት መሳተፍ አይችሉም!
                  </div>
                )}

                <div className="float-in" style={{
                  ...cardStyle,
                  width: '100%',
                  padding: '22px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  boxShadow: '0 0 26px rgba(245, 158, 11, 0.18), inset 0 1px 0 rgba(255,255,255,0.05)',
                  marginBottom: '18px'
                }}>
                  <div style={{
                    fontSize: '13px',
                    color: '#fbbf24',
                    fontWeight: '800',
                    marginBottom: '16px',
                    textAlign: 'center',
                    letterSpacing: '1.2px',
                    textTransform: 'uppercase'
                  }}>⚡ Choose Stake ⚡</div>

                  <button onClick={() => setCurrentScreen('board10')} style={{
                    width: '100%',
                    background: 'linear-gradient(120deg, #22c55e, #16a34a)',
                    color: '#ffffff',
                    border: '1px solid #4ade80',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    marginBottom: '10px',
                    textAlign: 'center',
                    boxShadow: '0 4px 16px rgba(34,197,94,0.35)',
                    letterSpacing: '0.5px'
                  }}>
                    ► Play 10 ETB
                  </button>
                  <button onClick={() => setCurrentScreen('board20')} style={{
                    width: '100%',
                    background: 'linear-gradient(120deg, #0ea5e9, #0369a1)',
                    color: '#ffffff',
                    border: '1px solid #38bdf8',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    marginBottom: '4px',
                    textAlign: 'center',
                    boxShadow: '0 4px 16px rgba(14,165,233,0.35)',
                    letterSpacing: '0.5px'
                  }}>
                    ► Play 20 ETB
                  </button>
                </div>

                <div className="float-in" style={{
                  ...cardStyle,
                  width: '100%',
                  padding: '22px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  boxShadow: '0 0 26px rgba(245, 158, 11, 0.18), inset 0 1px 0 rgba(255,255,255,0.05)',
                  marginBottom: '18px'
                }}>
                  <div style={{
                    fontSize: '13px',
                    color: '#fbbf24',
                    fontWeight: '800',
                    marginBottom: '16px',
                    textAlign: 'center',
                    letterSpacing: '1.2px',
                    textTransform: 'uppercase'
                  }}>🏆 Weekly Game 🏆</div>

                  <button onClick={() => setCurrentScreen('board50')} style={{
                    width: '100%',
                    background: 'linear-gradient(120deg, #8b5cf6, #6d28d9)',
                    color: '#ffffff',
                    border: '1px solid #a78bfa',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    textAlign: 'center',
                    boxShadow: '0 4px 16px rgba(139,92,246,0.4)',
                    letterSpacing: '0.5px'
                  }}>
                    ► Play 50 ETB
                  </button>
                  <div style={{ textAlign: 'center', fontSize: '11px', color: '#facc15', marginTop: '8px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                    📅 weekly (ቅዳሜ ማታ 12:00)
                  </div>

                  <button onClick={() => setCurrentScreen('board100')} style={{
                    width: '100%',
                    background: 'linear-gradient(120deg, #eab308, #a16207)',
                    color: '#1a1400',
                    border: '1px solid #facc15',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    textAlign: 'center',
                    marginTop: '14px',
                    boxShadow: '0 4px 16px rgba(234,179,8,0.4)',
                    letterSpacing: '0.5px'
                  }}>
                    ► Play 100 ETB
                  </button>
                  <div style={{ textAlign: 'center', fontSize: '11px', color: '#facc15', marginTop: '8px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                    📅 weekly (ቅዳሜ ማታ 12:05)
                  </div>
                </div>

                {isSuperAdmin && (
                  <div className="float-in" style={{
                    width: '100%',
                    ...cardStyle,
                    padding: '20px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    alignItems: 'center',
                    border: '1px solid #2d2d58'
                  }}>
                    <div style={{ width: '100%' }}>
                      <div style={{ fontSize: '26px', fontWeight: '900', color: '#38bdf8', textShadow: '0 0 14px rgba(56,189,248,0.5)' }}>{activeCount}</div>
                      <div style={{ fontSize: '11px', color: '#8b8ba7', marginTop: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>Active Users</div>
                    </div>
                    <div style={{ width: '100%', borderTop: '1px solid #2d2d58', paddingTop: '14px' }}>
                      <div style={{ fontSize: '26px', fontWeight: '900', color: '#22c55e', textShadow: '0 0 14px rgba(34,197,94,0.5)' }}>{registeredCount}</div>
                      <div style={{ fontSize: '11px', color: '#8b8ba7', marginTop: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>Registered Users</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SEPARATE BOARD FOR 10 ETB */}
            {currentScreen === 'board10' && (
              <div className="fade-in-up" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'linear-gradient(180deg, #0e0e22, #0a0a16)', borderBottom: '1px solid #1e1b4b', flexShrink: 0, width: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
                  <button onClick={() => setCurrentScreen('home')} style={{ background: 'linear-gradient(160deg, #1e1b4b, #12122a)', color: '#38bdf8', border: '1px solid #312e81', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>← Back</button>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#22c55e', letterSpacing: '1px' }}>🎯 10 ETB BOARD</div>
                  <button onClick={() => fetchUserData()} style={{ background: 'linear-gradient(160deg, #1e1b4b, #12122a)', color: '#22c55e', border: '1px solid #312e81', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>🔄</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px', padding: '8px 8px 4px 8px', flexShrink: 0, width: '100%' }}>
                  <div style={{ background: 'linear-gradient(160deg, #24244a, #16162e)', padding: '7px 2px', borderRadius: '9px', textAlign: 'center', border: '1px solid #2d2d5c', boxShadow: '0 2px 6px rgba(0,0,0,0.35)' }}><div style={{ fontSize: '9px', color: '#8b8ba7', letterSpacing: '0.5px' }}>GAME ID</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#fbbf24' }}>{currentGameId10}</div></div>
                  <div style={{ background: 'linear-gradient(160deg, #24244a, #16162e)', padding: '7px 2px', borderRadius: '9px', textAlign: 'center', border: '1px solid #2d2d5c', boxShadow: '0 2px 6px rgba(0,0,0,0.35)' }}><div style={{ fontSize: '9px', color: '#8b8ba7', letterSpacing: '0.5px' }}>PLAYERS</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#38bdf8' }}>{playerCount10}</div></div>
                  <div style={{ background: 'linear-gradient(160deg, #24244a, #16162e)', padding: '7px 2px', borderRadius: '9px', textAlign: 'center', border: '1px solid #2d2d5c', boxShadow: '0 2px 6px rgba(0,0,0,0.35)' }}><div style={{ fontSize: '9px', color: '#8b8ba7', letterSpacing: '0.5px' }}>STAKE</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#22c55e' }}>10 ETB</div></div>
                  <div style={{ background: 'linear-gradient(160deg, #24244a, #16162e)', padding: '7px 2px', borderRadius: '9px', textAlign: 'center', border: '1px solid #2d2d5c', boxShadow: '0 2px 6px rgba(0,0,0,0.35)' }}><div style={{ fontSize: '9px', color: '#8b8ba7', letterSpacing: '0.5px' }}>DERASH</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#22c55e' }}>{derash10} ETB</div></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', flex: 1, padding: '4px 8px 8px 8px', overflow: 'hidden', width: '100%' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
                    <div style={{
                      background: phase10 === 'spinning'
                        ? (allPickedNumbers10.length > 0 ? 'linear-gradient(90deg, #dc2626, #991b1b)' : 'linear-gradient(90deg, #6b7280, #4b5563)')
                        : (selectionTime10 <= 10 ? 'linear-gradient(90deg, #f59e0b, #dc2626)' : 'linear-gradient(90deg, #22c55e, #15803d)'),
                      padding: '8px',
                      borderRadius: '10px',
                      textAlign: 'center',
                      fontSize: '11px',
                      fontWeight: '800',
                      flexShrink: 0,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
                      animation: (phase10 === 'selecting' && selectionTime10 <= 10) ? 'pulseUrgent 1s ease-in-out infinite' : 'none',
                      letterSpacing: '0.5px'
                    }}>
                      {phase10 === 'spinning' ? (allPickedNumbers10.length > 0 ? '✦ ቁጥር እያሰበሰበ ነው...' : '⚠️ ማንም ቁጥር አልመረጠም!') : '⏱ የምረጣ ጊዜ ' + selectionTime10 + ' S'}
                    </div>
                    <NumberGrid
                      numbers={visibleNumbers}
                      myPickedSet={myPickedSet10}
                      allPickedSet={allPickedSet10}
                      isDisabled={isDisabled10}
                      onToggle={onToggle10}
                    />
                  </div>
                  <div style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, justifyContent: 'flex-start', overflowY: 'auto' }}>
                    <div style={{ ...cardStyle, borderRadius: '10px', padding: '8px 10px', minHeight: '65px', maxHeight: '90px', display: 'flex', flexDirection: 'column', flexShrink: 0, border: '1px solid #312e81' }}>
                      <div style={{ fontSize: '10px', color: '#38bdf8', marginBottom: '4px', fontWeight: '800', letterSpacing: '0.3px' }}> 📌 የተመረጡ ({selectedNumbers10.length}) </div>
                      <div style={{ fontSize: '10px', color: '#c7d2fe', lineHeight: '1.35', wordBreak: 'break-word', overflowY: 'auto', flex: 1 }}>
                        {selectedNumbers10.length > 0 ? selectedNumbers10.join(', ') : 'እስካሁን ማንም አልመረጠም'}
                      </div>
                    </div>
                    <div style={{ ...cardStyle, borderRadius: '12px', padding: '14px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', marginBottom: '10px', color: '#fbbf24', letterSpacing: '0.8px' }}>🎲 የቁጥር ማውጣት</div>
                      <div style={{
                        width: '110px', height: '110px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #1a1a3a, #0a0a1a)',
                        border: winningNumber10 === 'SPINNING' ? '3px solid #00f2fe' : (winningNumber10 !== '?' && winningNumber10 !== 'NONE' ? '3px solid #00ffcc' : '3px solid #e11d48'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: winningNumber10 === 'SPINNING' ? '0 0 24px rgba(0, 242, 254, 0.7), inset 0 0 20px rgba(0,242,254,0.25)' : (winningNumber10 !== '?' && winningNumber10 !== 'NONE' ? '0 0 24px rgba(0, 255, 204, 0.7), inset 0 0 20px rgba(0,255,204,0.25)' : '0 0 18px rgba(225, 29, 72, 0.45), inset 0 0 12px rgba(225,29,72,0.15)'),
                        transition: 'all 0.35s ease', position: 'relative', overflow: 'hidden'
                      }}>
                        {winningNumber10 === 'SPINNING' ? (
                          <div className="spin-arrow-container" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="80" height="80" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="40" fill="none" stroke="#00f2fe" strokeWidth="4" />
                              <polygon points="50,15 58,45 50,40 42,45" fill="#00f2fe" />
                              <polygon points="50,85 58,55 50,60 42,55" fill="#f59e0b" />
                              <circle cx="50" cy="50" r="7" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                            </svg>
                          </div>
                        ) : winningNumber10 === 'NONE' ? (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold', textAlign: 'center' }}> እስካሁን ማንም አልወጣም </span>
                          </div>
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                            <span style={{ fontSize: winningNumber10 === '?' ? '44px' : '40px', fontWeight: '900', color: winningNumber10 === '?' ? '#ffffff' : '#00ffcc', textShadow: winningNumber10 === '?' ? 'none' : '0 0 14px #00ffcc', lineHeight: '1', display: 'inline-block', margin: '0', padding: '0' }}>
                              {winningNumber10}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {winnerInfo10 && (
                      <div className="float-in" style={{ marginTop: '4px', padding: '10px', background: 'linear-gradient(160deg, #064e3b, #022c22)', border: '2px solid #10b981', borderRadius: '12px', textAlign: 'center', boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#34d399', letterSpacing: '0.5px' }}> 🎉 አሸናፊ አሸነፈ! </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff', margin: '4px 0' }}> 👤 {winnerInfo10.userName} </div>
                        <div style={{ fontSize: '14px', fontWeight: '900', color: '#facc15' }}> ቁጥር: #{winnerInfo10.number} </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399', marginTop: '4px' }}> የድረሽ ብር: {winnerInfo10.derash} ETB </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SEPARATE BOARD FOR 20 ETB */}
            {currentScreen === 'board20' && (
              <div className="fade-in-up" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'linear-gradient(180deg, #0e0e22, #0a0a16)', borderBottom: '1px solid #1e1b4b', flexShrink: 0, width: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
                  <button onClick={() => setCurrentScreen('home')} style={{ background: 'linear-gradient(160deg, #1e1b4b, #12122a)', color: '#38bdf8', border: '1px solid #312e81', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>← Back</button>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#38bdf8', letterSpacing: '1px' }}>🎯 20 ETB BOARD</div>
                  <button onClick={() => fetchUserData()} style={{ background: 'linear-gradient(160deg, #1e1b4b, #12122a)', color: '#22c55e', border: '1px solid #312e81', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>🔄</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px', padding: '8px 8px 4px 8px', flexShrink: 0, width: '100%' }}>
                  <div style={{ background: 'linear-gradient(160deg, #24244a, #16162e)', padding: '7px 2px', borderRadius: '9px', textAlign: 'center', border: '1px solid #2d2d5c', boxShadow: '0 2px 6px rgba(0,0,0,0.35)' }}><div style={{ fontSize: '9px', color: '#8b8ba7', letterSpacing: '0.5px' }}>GAME ID</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#fbbf24' }}>{currentGameId20}</div></div>
                  <div style={{ background: 'linear-gradient(160deg, #24244a, #16162e)', padding: '7px 2px', borderRadius: '9px', textAlign: 'center', border: '1px solid #2d2d5c', boxShadow: '0 2px 6px rgba(0,0,0,0.35)' }}><div style={{ fontSize: '9px', color: '#8b8ba7', letterSpacing: '0.5px' }}>PLAYERS</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#38bdf8' }}>{playerCount20}</div></div>
                  <div style={{ background: 'linear-gradient(160deg, #24244a, #16162e)', padding: '7px 2px', borderRadius: '9px', textAlign: 'center', border: '1px solid #2d2d5c', boxShadow: '0 2px 6px rgba(0,0,0,0.35)' }}><div style={{ fontSize: '9px', color: '#8b8ba7', letterSpacing: '0.5px' }}>STAKE</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#0284c7' }}>20 ETB</div></div>
                  <div style={{ background: 'linear-gradient(160deg, #24244a, #16162e)', padding: '7px 2px', borderRadius: '9px', textAlign: 'center', border: '1px solid #2d2d5c', boxShadow: '0 2px 6px rgba(0,0,0,0.35)' }}><div style={{ fontSize: '9px', color: '#8b8ba7', letterSpacing: '0.5px' }}>DERASH</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#22c55e' }}>{derash20} ETB</div></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', flex: 1, padding: '4px 8px 8px 8px', overflow: 'hidden', width: '100%' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
                    <div style={{
                      background: phase20 === 'spinning'
                        ? (allPickedNumbers20.length > 0 ? 'linear-gradient(90deg, #dc2626, #991b1b)' : 'linear-gradient(90deg, #6b7280, #4b5563)')
                        : (selectionTime20 <= 10 ? 'linear-gradient(90deg, #f59e0b, #dc2626)' : 'linear-gradient(90deg, #0ea5e9, #0369a1)'),
                      padding: '8px',
                      borderRadius: '10px',
                      textAlign: 'center',
                      fontSize: '11px',
                      fontWeight: '800',
                      flexShrink: 0,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
                      animation: (phase20 === 'selecting' && selectionTime20 <= 10) ? 'pulseUrgent 1s ease-in-out infinite' : 'none',
                      letterSpacing: '0.5px'
                    }}>
                      {phase20 === 'spinning' ? (allPickedNumbers20.length > 0 ? '✦ ቁጥር እያሰበሰበ ነው...' : '⚠️ ማንም ቁጥር አልመረጠም!') : '⏱ የምረጣ ጊዜ ' + selectionTime20 + ' S'}
                    </div>
                    <NumberGrid
                      numbers={visibleNumbers}
                      myPickedSet={myPickedSet20}
                      allPickedSet={allPickedSet20}
                      isDisabled={isDisabled20}
                      onToggle={onToggle20}
                    />
                  </div>
                  <div style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, justifyContent: 'flex-start', overflowY: 'auto' }}>
                    <div style={{ ...cardStyle, borderRadius: '10px', padding: '8px 10px', minHeight: '65px', maxHeight: '90px', display: 'flex', flexDirection: 'column', flexShrink: 0, border: '1px solid #312e81' }}>
                      <div style={{ fontSize: '10px', color: '#38bdf8', marginBottom: '4px', fontWeight: '800', letterSpacing: '0.3px' }}> 📌 የተመረጡ ({selectedNumbers20.length}) </div>
                      <div style={{ fontSize: '10px', color: '#c7d2fe', lineHeight: '1.35', wordBreak: 'break-word', overflowY: 'auto', flex: 1 }}>
                        {selectedNumbers20.length > 0 ? selectedNumbers20.join(', ') : 'እስካሁን ማንም አልመረጠም'}
                      </div>
                    </div>
                    <div style={{ ...cardStyle, borderRadius: '12px', padding: '14px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', marginBottom: '10px', color: '#fbbf24', letterSpacing: '0.8px' }}>🎲 የቁጥር ማውጣት</div>
                      <div style={{
                        width: '110px', height: '110px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #1a1a3a, #0a0a1a)',
                        border: winningNumber20 === 'SPINNING' ? '3px solid #00f2fe' : (winningNumber20 !== '?' && winningNumber20 !== 'NONE' ? '3px solid #00ffcc' : '3px solid #e11d48'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: winningNumber20 === 'SPINNING' ? '0 0 24px rgba(0, 242, 254, 0.7), inset 0 0 20px rgba(0,242,254,0.25)' : (winningNumber20 !== '?' && winningNumber20 !== 'NONE' ? '0 0 24px rgba(0, 255, 204, 0.7), inset 0 0 20px rgba(0,255,204,0.25)' : '0 0 18px rgba(225, 29, 72, 0.45), inset 0 0 12px rgba(225,29,72,0.15)'),
                        transition: 'all 0.35s ease', position: 'relative', overflow: 'hidden'
                      }}>
                        {winningNumber20 === 'SPINNING' ? (
                          <div className="spin-arrow-container" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="80" height="80" viewBox="0 0 100 100">
                              <circle cx="50" cy="50" r="40" fill="none" stroke="#00f2fe" strokeWidth="4" />
                              <polygon points="50,15 58,45 50,40 42,45" fill="#00f2fe" />
                              <polygon points="50,85 58,55 50,60 42,55" fill="#f59e0b" />
                              <circle cx="50" cy="50" r="7" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                            </svg>
                          </div>
                        ) : winningNumber20 === 'NONE' ? (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 'bold', textAlign: 'center' }}> እስካሁን ማንም አልወጣም </span>
                          </div>
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                            <span style={{ fontSize: winningNumber20 === '?' ? '44px' : '40px', fontWeight: '900', color: winningNumber20 === '?' ? '#ffffff' : '#00ffcc', textShadow: winningNumber20 === '?' ? 'none' : '0 0 14px #00ffcc', lineHeight: '1', display: 'inline-block', margin: '0', padding: '0' }}>
                              {winningNumber20}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {winnerInfo20 && (
                      <div className="float-in" style={{ marginTop: '4px', padding: '10px', background: 'linear-gradient(160deg, #064e3b, #022c22)', border: '2px solid #10b981', borderRadius: '12px', textAlign: 'center', boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#34d399', letterSpacing: '0.5px' }}> 🎉 አሸናፊ አሸነፈ! </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff', margin: '4px 0' }}> 👤 {winnerInfo20.userName} </div>
                        <div style={{ fontSize: '14px', fontWeight: '900', color: '#facc15' }}> ቁጥር: #{winnerInfo20.number} </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399', marginTop: '4px' }}> የድረሽ ብር: {winnerInfo20.derash} ETB </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SEPARATE BOARD FOR 50 ETB */}
            {currentScreen === 'board50' && (
              <div className="fade-in-up" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'linear-gradient(180deg, #0e0e22, #0a0a16)', borderBottom: '1px solid #1e1b4b', flexShrink: 0, width: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
                  <button onClick={() => setCurrentScreen('home')} style={{ background: 'linear-gradient(160deg, #1e1b4b, #12122a)', color: '#38bdf8', border: '1px solid #312e81', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>← Back</button>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#a78bfa', letterSpacing: '1px' }}>🎯 50 ETB BOARD</div>
                  <button onClick={() => fetchUserData()} style={{ background: 'linear-gradient(160deg, #1e1b4b, #12122a)', color: '#22c55e', border: '1px solid #312e81', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>🔄</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px', padding: '8px 8px 4px 8px', flexShrink: 0, width: '100%' }}>
                  <div style={{ background: 'linear-gradient(160deg, #24244a, #16162e)', padding: '7px 2px', borderRadius: '9px', textAlign: 'center', border: '1px solid #2d2d5c', boxShadow: '0 2px 6px rgba(0,0,0,0.35)' }}><div style={{ fontSize: '9px', color: '#8b8ba7', letterSpacing: '0.5px' }}>GAME ID</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#fbbf24' }}>{currentGameId50}</div></div>
                  <div style={{ background: 'linear-gradient(160deg, #24244a, #16162e)', padding: '7px 2px', borderRadius: '9px', textAlign: 'center', border: '1px solid #2d2d5c', boxShadow: '0 2px 6px rgba(0,0,0,0.35)' }}><div style={{ fontSize: '9px', color: '#8b8ba7', letterSpacing: '0.5px' }}>PLAYERS</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#38bdf8' }}>{playerCount50}</div></div>
                  <div style={{ background: 'linear-gradient(160deg, #24244a, #16162e)', padding: '7px 2px', borderRadius: '9px', textAlign: 'center', border: '1px solid #2d2d5c', boxShadow: '0 2px 6px rgba(0,0,0,0.35)' }}><div style={{ fontSize: '9px', color: '#8b8ba7', letterSpacing: '0.5px' }}>STAKE</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#a78bfa' }}>50 ETB</div></div>
                  <div style={{ background: 'linear-gradient(160deg, #24244a, #16162e)', padding: '7px 2px', borderRadius: '9px', textAlign: 'center', border: '1px solid #2d2d5c', boxShadow: '0 2px 6px rgba(0,0,0,0.35)' }}><div style={{ fontSize: '9px', color: '#8b8ba7', letterSpacing: '0.5px' }}>DERASH</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#22c55e' }}>{derash50} ETB</div></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', flex: 1, padding: '4px 8px 8px 8px', overflow: 'hidden', width: '100%' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
                    <div style={{ background: 'linear-gradient(90deg, #8b5cf6, #6d28d9)', padding: '8px', borderRadius: '10px', textAlign: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0, boxShadow: '0 2px 10px rgba(139,92,246,0.4), inset 0 1px 0 rgba(255,255,255,0.1)', letterSpacing: '0.5px' }}>
                      📅 Weekly: ቅዳሜ ማታ 12:00
                    </div>
                    <NumberGrid
                      numbers={visibleNumbers}
                      myPickedSet={myPickedSet50}
                      allPickedSet={allPickedSet50}
                      isDisabled={isDisabled50}
                      onToggle={onToggle50}
                    />
                  </div>
                  <div style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, justifyContent: 'flex-start', overflowY: 'auto' }}>
                    <div style={{ ...cardStyle, borderRadius: '10px', padding: '8px 10px', minHeight: '65px', maxHeight: '90px', display: 'flex', flexDirection: 'column', flexShrink: 0, border: '1px solid #312e81' }}>
                      <div style={{ fontSize: '10px', color: '#38bdf8', marginBottom: '4px', fontWeight: '800', letterSpacing: '0.3px' }}> 📌 የተመረጡ ({selectedNumbers50.length}) </div>
                      <div style={{ fontSize: '10px', color: '#c7d2fe', lineHeight: '1.35', wordBreak: 'break-word', overflowY: 'auto', flex: 1 }}>
                        {selectedNumbers50.length > 0 ? selectedNumbers50.join(', ') : 'እስካሁን ማንም አልመረጠም'}
                      </div>
                    </div>
                    <div style={{ ...cardStyle, borderRadius: '12px', padding: '14px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', marginBottom: '10px', color: '#fbbf24', letterSpacing: '0.8px' }}>🎲 የቁጥር ማውጣት</div>
                      <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #1a1a3a, #0a0a1a)', border: '3px solid #8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(139, 92, 246, 0.5), inset 0 0 15px rgba(139,92,246,0.15)' }}>
                        <span style={{ fontSize: '40px', fontWeight: '900', color: '#ffffff' }}>{winningNumber50}</span>
                      </div>
                    </div>
                    {winnerInfo50 && (
                      <div className="float-in" style={{ marginTop: '4px', padding: '10px', background: 'linear-gradient(160deg, #064e3b, #022c22)', border: '2px solid #10b981', borderRadius: '12px', textAlign: 'center', boxShadow: '0 0 20px rgba(16,185,129,0.5)' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#34d399', letterSpacing: '0.5px' }}> 🎉 አሸናፊ አሸነፈ! </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff', margin: '4px 0' }}> 👤 {winnerInfo50.userName} </div>
                        <div style={{ fontSize: '14px', fontWeight: '900', color: '#facc15' }}> ቁጥር: #{winnerInfo50.number} </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399', marginTop: '4px' }}> የድረሽ ብር: {winnerInfo50.derash} ETB </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SEPARATE BOARD FOR 100 ETB */}
            {currentScreen === 'board100' && (
              <div className="fade-in-up" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'linear-gradient(180deg, #0e0e22, #0a0a16)', borderBottom: '1px solid #1e1b4b', flexShrink: 0, width: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
                  <button onClick={() => setCurrentScreen('home')} style={{ background: 'linear-gradient(160deg, #1e1b4b, #12122a)', color: '#38bdf8', border: '1px solid #312e81', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>← Back</button>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#facc15', letterSpacing: '1px' }}>🎯 100 ETB BOARD</div>
                  <button onClick={() => fetchUserData()} style={{ background: 'linear-gradient(160deg, #1e1b4b, #12122a)', color: '#22c55e', border: '1px solid #312e81', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>🔄</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px', padding: '8px 8px 4px 8px', flexShrink: 0, width: '100%' }}>
                  <div style={{ background: 'linear-gradient(160deg, #24244a, #16162e)', padding: '7px 2px', borderRadius: '9px', textAlign: 'center', border: '1px solid #2d2d5c', boxShadow: '0 2px 6px rgba(0,0,0,0.35)' }}><div style={{ fontSize: '9px', color: '#8b8ba7', letterSpacing: '0.5px' }}>GAME ID</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#fbbf24' }}>{currentGameId100}</div></div>
                  <div style={{ background: 'linear-gradient(160deg, #24244a, #16162e)', padding: '7px 2px', borderRadius: '9px', textAlign: 'center', border: '1px solid #2d2d5c', boxShadow: '0 2px 6px rgba(0,0,0,0.35)' }}><div style={{ fontSize: '9px', color: '#8b8ba7', letterSpacing: '0.5px' }}>PLAYERS</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#38bdf8' }}>{playerCount100}</div></div>
                  <div style={{ background: 'linear-gradient(160deg, #24244a, #16162e)', padding: '7px 2px', borderRadius: '9px', textAlign: 'center', border: '1px solid #2d2d5c', boxShadow: '0 2px 6px rgba(0,0,0,0.35)' }}><div style={{ fontSize: '9px', color: '#8b8ba7', letterSpacing: '0.5px' }}>STAKE</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#eab308' }}>100 ETB</div></div>
                  <div style={{ background: 'linear-gradient(160deg, #24244a, #16162e)', padding: '7px 2px', borderRadius: '9px', textAlign: 'center', border: '1px solid #2d2d5c', boxShadow: '0 2px 6px rgba(0,0,0,0.35)' }}><div style={{ fontSize: '9px', color: '#8b8ba7', letterSpacing: '0.5px' }}>DERASH</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#22c55e' }}>{derash100} ETB</div></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', flex: 1, padding: '4px 8px 8px 8px', overflow: 'hidden', width: '100%' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
                    <div style={{ background: 'linear-gradient(90deg, #facc15, #ca8a04)', color: '#1a1400', padding: '8px', borderRadius: '10px', textAlign: 'center', fontSize: '11px', fontWeight: '800', flexShrink: 0, boxShadow: '0 2px 10px rgba(250,204,21,0.4), inset 0 1px 0 rgba(255,255,255,0.25)', letterSpacing: '0.5px' }}>
                      📅 Weekly: ቅዳሜ ማታ 12:05
                    </div>
                    <NumberGrid
                      numbers={visibleNumbers}
                      myPickedSet={myPickedSet100}
                      allPickedSet={allPickedSet100}
                      isDisabled={isDisabled100}
                      onToggle={onToggle100}
                    />
                  </div>
                  <div style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, justifyContent: 'flex-start', overflowY: 'auto' }}>
                    <div style={{ ...cardStyle, borderRadius: '10px', padding: '8px 10px', minHeight: '65px', maxHeight: '90px', display: 'flex', flexDirection: 'column', flexShrink: 0, border: '1px solid #312e81' }}>
                      <div style={{ fontSize: '10px', color: '#38bdf8', marginBottom: '4px', fontWeight: '800', letterSpacing: '0.3px' }}> 📌 የተመረጡ ({selectedNumbers100.length}) </div>
                      <div style={{ fontSize: '10px', color: '#c7d2fe', lineHeight: '1.35', wordBreak: 'break-word', overflowY: 'auto', flex: 1 }}>
                        {selectedNumbers100.length > 0 ? selectedNumbers100.join(', ') : 'እስካሁን ማንም አልመረጠም'}
                      </div>
                    </div>
                    <div style={{ ...cardStyle, borderRadius: '12px', padding: '14px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: '800', marginBottom: '10px', color: '#fbbf24', letterSpacing: '0.8px' }}>🎲 የቁጥር ማውጣት</div>
                      <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #1a1a3a, #0a0a1a)', border: '3px solid #eab308', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(234, 179, 8, 0.5), inset 0 0 15px rgba(234,179,8,0.15)' }}>
                        <span style={{ fontSize: '40px', fontWeight: '900', color: '#ffffff' }}>{winningNumber100}</span>
                      </div>
                    </div>
                    {winnerInfo100 && (
                      <div className="float-in" style={{ marginTop: '4px', padding: '10px', background: 'linear-gradient(160deg, #064e3b, #022c22)', border: '2px solid #10b981', borderRadius: '12px', textAlign: 'center', boxShadow: '0 0 20px rgba(16,185,129,0.5)' }}>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#34d399', letterSpacing: '0.5px' }}> 🎉 አሸናፊ አሸነፈ! </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff', margin: '4px 0' }}> 👤 {winnerInfo100.userName} </div>
                        <div style={{ fontSize: '14px', fontWeight: '900', color: '#facc15' }}> ቁጥር: #{winnerInfo100.number} </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399', marginTop: '4px' }}> የድረሽ ብር: {winnerInfo100.derash} ETB </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {currentTab === 'history' && (
          <div className="fade-in-up" style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '16px', textAlign: 'center', letterSpacing: '-0.3px' }}>📜 Game History</h1>
            <div style={{ ...cardStyle, padding: '16px', marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#8b8ba7', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>Total Games Played</div>
              <div style={{ fontSize: '32px', fontWeight: '900', background: 'linear-gradient(120deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{totalGames}</div>
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', marginBottom: '12px', letterSpacing: '0.3px' }}>🏆 Your Winning History</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {gameHistory.length > 0 ? (
                gameHistory.map((item, idx) => (
                  <div key={idx} style={{ ...cardStyle, borderRadius: '12px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #2a2a52' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#38bdf8' }}>Winning Num: #{item.winningNumber}</div>
                      <div style={{ fontSize: '11px', color: '#8b8ba7', marginTop: '4px' }}>Winner: {item.winnerName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: '900', color: '#22c55e', textShadow: '0 0 10px rgba(34,197,94,0.4)' }}>+{item.derash} ETB</div>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently'}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '30px', fontSize: '13px' }}> እስካሁን የሎቶሪ ታሪክ አልተመዘገበም </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'wallet' && (
          <div className="fade-in-up" style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.3px' }}>💳 Wallet</h1>
              <button onClick={fetchUserData} style={{ background: 'linear-gradient(160deg, #1e1b4b, #12122a)', color: '#38bdf8', border: '1px solid #312e81', borderRadius: '8px', padding: '7px 12px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>🔄</button>
            </div>
            <div style={{ ...cardStyle, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>👤</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{userPhone || 'ስልክ አልተመዘገበ'}</span>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981', borderRadius: '20px', padding: '4px 12px', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 0 12px rgba(16,185,129,0.25)' }}>
                ✓ Verified
              </div>
            </div>
            <div style={{ ...cardStyle, padding: '5px', display: 'flex', marginBottom: '16px' }}>
              <button onClick={() => setWalletTab('balance')} style={{ flex: 1, padding: '11px 0', borderRadius: '10px', border: 'none', background: walletTab === 'balance' ? 'linear-gradient(120deg, #4338ca, #3730a3)' : 'transparent', color: walletTab === 'balance' ? '#ffffff' : '#8b8ba7', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: walletTab === 'balance' ? '0 2px 10px rgba(67,56,202,0.4)' : 'none' }}> Balance </button>
            </div>
            {walletTab === 'balance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ ...cardStyle, padding: '16px', textAlign: 'center', border: '1px solid rgba(96,165,250,0.35)', boxShadow: '0 0 18px rgba(96,165,250,0.15), inset 0 1px 0 rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: '11px', color: '#93c5fd', marginBottom: '6px', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 'bold' }}>Main Wallet</div>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#ffffff' }}>{mainWallet} <span style={{ fontSize: '12px', color: '#93c5fd' }}>ETB</span></div>
                  </div>
                  <div style={{ ...cardStyle, padding: '16px', textAlign: 'center', border: '1px solid rgba(16,185,129,0.35)', boxShadow: '0 0 18px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: '11px', color: '#6ee7b7', marginBottom: '6px', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 'bold' }}>Play Wallet</div>
                    <div style={{ fontSize: '22px', fontWeight: '900', color: '#10b981' }}>{playWallet} <span style={{ fontSize: '12px' }}>ETB</span></div>
                  </div>
                </div>
                <div style={{ ...cardStyle, padding: '18px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#fbbf24', letterSpacing: '0.3px' }}>📥 Deposit (በቴሌብር ብር መሞላት)</h4>
                  <div style={{ fontSize: '12px', color: '#a5a5c5', marginBottom: '12px', lineHeight: '1.5' }}>
                    1. የሚለውን የብር መጠን ይላኩ ወይም ያስገቡ<br />
                    2. የቴሌብር SMS መልእክትዎን ሙሉ በሙሉ ኮፒ በማድረግ ከዚህ በታች ባለው ሳጥን ውስጥ እሰገብቱ<br />
                  </div>
                  <label style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 'bold', display: 'block', marginBottom: '6px', letterSpacing: '0.3px' }}>የብር መጠን (ETB):</label>
                  <input type="number" placeholder="ለአርአያ 100" value={depAmount} onChange={(e) => setDepAmount(e.target.value)} style={{ width: '100%', padding: '11px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0a0a1a', color: '#fff', boxSizing: 'border-box', fontSize: '14px' }} />
                  <label style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 'bold', display: 'block', marginBottom: '6px', letterSpacing: '0.3px' }}>የቴሌብር SMS መልእክት (Copy Paste):</label>
                  <textarea rows="4" placeholder="ድረሶትን ሙሉ የቴሌብር SMS መልእክት እዚህ ጋር ድራፍ አ ዱ (Paste) ይድርጉ..." value={pastedSMS} onChange={(e) => setPastedSMS(e.target.value)} style={{ width: '100%', padding: '11px', marginBottom: '14px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0a0a1a', color: '#fff', boxSizing: 'border-box', fontSize: '12px' }} />
                  <button onClick={handleDeposit} disabled={isSubmittingDep} style={{ width: '100%', padding: '13px', background: isSubmittingDep ? 'linear-gradient(120deg, #6b7280, #4b5563)' : 'linear-gradient(120deg, #22c55e, #16a34a)', color: '#fff', border: '1px solid #4ade80', borderRadius: '10px', fontWeight: '800', cursor: isSubmittingDep ? 'not-allowed' : 'pointer', fontSize: '14px', boxShadow: isSubmittingDep ? 'none' : '0 4px 16px rgba(34,197,94,0.35)', letterSpacing: '0.3px' }}>
                    {isSubmittingDep ? 'እየተላከ ነው...' : '✓ Submit Deposit'}
                  </button>
                </div>
                <div style={{ ...cardStyle, padding: '18px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#fca5a5', letterSpacing: '0.3px' }}>📤 Withdraw (ገንዘብ ማውጣት)</h4>
                  <input type="number" placeholder="መጠን (ETB)" value={withAmount} onChange={(e) => setWithAmount(e.target.value)} style={{ width: '100%', padding: '11px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0a0a1a', color: '#fff', boxSizing: 'border-box', fontSize: '14px' }} />
                  <button onClick={handleWithdraw} style={{ width: '100%', padding: '13px', background: 'linear-gradient(120deg, #ef4444, #b91c1c)', color: '#fff', border: '1px solid #fca5a5', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 16px rgba(239,68,68,0.35)', letterSpacing: '0.3px' }}>
                    ✓ Submit Withdraw
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentTab === 'profile' && (
          <div className="fade-in-up" style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', marginBottom: '24px' }}>
              <div style={{
                width: '82px',
                height: '82px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #3b82f6, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '30px',
                fontWeight: '900',
                color: '#ffffff',
                marginBottom: '14px',
                overflow: 'hidden',
                border: '3px solid rgba(96,165,250,0.7)',
                boxShadow: '0 0 24px rgba(99,102,241,0.55), inset 0 0 20px rgba(255,255,255,0.1)'
              }}>
                {userPhoto ? <img src={userPhoto} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : userInitial}
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '900', margin: 0, letterSpacing: '-0.3px' }}>{userName}</h2>
              {tgUser?.username && <span style={{ fontSize: '13px', color: '#8b8ba7', marginTop: '5px' }}>@{tgUser.username}</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ ...cardStyle, padding: '16px', textAlign: 'center', border: '1px solid rgba(96,165,250,0.3)' }}>
                <div style={{ color: '#60a5fa', fontSize: '12px', marginBottom: '8px', letterSpacing: '0.3px' }}>💳 Main Wallet</div>
                <div style={{ fontSize: '20px', fontWeight: '900' }}>{mainWallet} <span style={{ fontSize: '11px' }}>ETB</span></div>
              </div>
              <div style={{ ...cardStyle, padding: '16px', textAlign: 'center', border: '1px solid rgba(52,211,153,0.3)' }}>
                <div style={{ color: '#34d399', fontSize: '12px', marginBottom: '8px', letterSpacing: '0.3px' }}>💳 Play Wallet</div>
                <div style={{ fontSize: '20px', fontWeight: '900' }}>{playWallet} <span style={{ fontSize: '11px' }}>ETB</span></div>
              </div>
              <div style={{ ...cardStyle, padding: '16px', textAlign: 'center', border: '1px solid rgba(192,132,252,0.3)' }}>
                <div style={{ color: '#c084fc', fontSize: '12px', marginBottom: '8px', letterSpacing: '0.3px' }}>🏆 Games Won</div>
                <div style={{ fontSize: '20px', fontWeight: '900' }}>{gamesWon}</div>
              </div>
              <div style={{ ...cardStyle, padding: '16px', textAlign: 'center', border: '1px solid rgba(248,113,113,0.3)' }}>
                <div style={{ color: '#f87171', fontSize: '12px', marginBottom: '8px', letterSpacing: '0.3px' }}>👥 Total Invite</div>
                <div style={{ fontSize: '20px', fontWeight: '900' }}>{totalInvite}</div>
              </div>
            </div>
            <div style={{ ...cardStyle, padding: '20px', textAlign: 'center', border: '1px solid rgba(245,158,11,0.35)', boxShadow: '0 0 20px rgba(245,158,11,0.12), inset 0 1px 0 rgba(255,255,255,0.04)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', marginTop: 0, marginBottom: '10px', color: '#fbbf24', letterSpacing: '0.3px' }}> 🎁 ጓደኞችን ይጋብዙ </h3>
              <p style={{ fontSize: '12px', color: '#a5a5c5', marginBottom: '14px', lineHeight: '1.5' }}>
                የእርስዎን የመጋበዣ ሊንክ ለአርደኞችዎ በመላክ በእያንዳንዱ ግንኙነት ተጨማሪ ቦነስ ይደርስ!
              </p>
              <button onClick={copyReferralLink} style={{
                width: '100%',
                padding: '13px',
                background: copiedLink ? 'linear-gradient(120deg, #10b981, #059669)' : 'linear-gradient(120deg, #0ea5e9, #0369a1)',
                color: '#ffffff',
                border: '1px solid ' + (copiedLink ? '#6ee7b7' : '#38bdf8'),
                borderRadius: '10px',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '14px',
                boxShadow: copiedLink ? '0 4px 16px rgba(16,185,129,0.4)' : '0 4px 16px rgba(14,165,233,0.4)',
                letterSpacing: '0.3px'
              }}>
                {copiedLink ? '✓ የመጋበዣ ሊንክ ተቀድቷል' : '🔗 Copy Invite Link'}
              </button>
            </div>
          </div>
        )}

        {isAdmin && currentTab === 'admin' && (
          <div className="fade-in-up" style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: '900', color: '#fbbf24', letterSpacing: '0.3px' }}>
                ⚙️ Admin Panel
              </h1>
              <button onClick={fetchAdminData} style={{ background: 'linear-gradient(160deg, #1e1b4b, #12122a)', color: '#38bdf8', border: '1px solid #312e81', borderRadius: '8px', padding: '7px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Refresh</button>
            </div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button onClick={() => setAdminTab('requests')} style={{ flex: 1, minWidth: '80px', padding: '9px 6px', borderRadius: '8px', border: '1px solid ' + (adminTab === 'requests' ? '#fbbf24' : '#2d2d58'), background: adminTab === 'requests' ? 'linear-gradient(120deg, #f59e0b, #d97706)' : 'linear-gradient(160deg, #1e1b4b, #12122a)', color: adminTab === 'requests' ? '#000' : '#fff', fontSize: '11px', fontWeight: '800', cursor: 'pointer', boxShadow: adminTab === 'requests' ? '0 4px 14px rgba(245,158,11,0.4)' : 'none' }}>📁 Txns</button>
              {isSuperAdmin && (
                <>
                  <button onClick={() => setAdminTab('reports')} style={{ flex: 1, minWidth: '80px', padding: '9px 6px', borderRadius: '8px', border: '1px solid ' + (adminTab === 'reports' ? '#fbbf24' : '#2d2d58'), background: adminTab === 'reports' ? 'linear-gradient(120deg, #f59e0b, #d97706)' : 'linear-gradient(160deg, #1e1b4b, #12122a)', color: adminTab === 'reports' ? '#000' : '#fff', fontSize: '11px', fontWeight: '800', cursor: 'pointer', boxShadow: adminTab === 'reports' ? '0 4px 14px rgba(245,158,11,0.4)' : 'none' }}>📊 Stats</button>
                  <button onClick={() => setAdminTab('users')} style={{ flex: 1, minWidth: '80px', padding: '9px 6px', borderRadius: '8px', border: '1px solid ' + (adminTab === 'users' ? '#fbbf24' : '#2d2d58'), background: adminTab === 'users' ? 'linear-gradient(120deg, #f59e0b, #d97706)' : 'linear-gradient(160deg, #1e1b4b, #12122a)', color: adminTab === 'users' ? '#000' : '#fff', fontSize: '11px', fontWeight: '800', cursor: 'pointer', boxShadow: adminTab === 'users' ? '0 4px 14px rgba(245,158,11,0.4)' : 'none' }}>Users</button>
                  <button onClick={() => setAdminTab('game_control')} style={{ flex: 1, minWidth: '80px', padding: '9px 6px', borderRadius: '8px', border: '1px solid ' + (adminTab === 'game_control' ? '#fbbf24' : '#2d2d58'), background: adminTab === 'game_control' ? 'linear-gradient(120deg, #f59e0b, #d97706)' : 'linear-gradient(160deg, #1e1b4b, #12122a)', color: adminTab === 'game_control' ? '#000' : '#fff', fontSize: '11px', fontWeight: '800', cursor: 'pointer', boxShadow: adminTab === 'game_control' ? '0 4px 14px rgba(245,158,11,0.4)' : 'none' }}>Draw</button>
                  <button onClick={() => setAdminTab('settings')} style={{ flex: 1, minWidth: '80px', padding: '9px 6px', borderRadius: '8px', border: '1px solid ' + (adminTab === 'settings' ? '#fbbf24' : '#2d2d58'), background: adminTab === 'settings' ? 'linear-gradient(120deg, #f59e0b, #d97706)' : 'linear-gradient(160deg, #1e1b4b, #12122a)', color: adminTab === 'settings' ? '#000' : '#fff', fontSize: '11px', fontWeight: '800', cursor: 'pointer', boxShadow: adminTab === 'settings' ? '0 4px 14px rgba(245,158,11,0.4)' : 'none' }}>Config</button>
                  <button onClick={() => setAdminTab('broadcast')} style={{ flex: 1, minWidth: '80px', padding: '9px 6px', borderRadius: '8px', border: '1px solid ' + (adminTab === 'broadcast' ? '#fbbf24' : '#2d2d58'), background: adminTab === 'broadcast' ? 'linear-gradient(120deg, #f59e0b, #d97706)' : 'linear-gradient(160deg, #1e1b4b, #12122a)', color: adminTab === 'broadcast' ? '#000' : '#fff', fontSize: '11px', fontWeight: '800', cursor: 'pointer', boxShadow: adminTab === 'broadcast' ? '0 4px 14px rgba(245,158,11,0.4)' : 'none' }}>📢</button>
                </>
              )}
            </div>
            {adminTab === 'requests' && (
              <div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                  <button onClick={() => setTxTypeView('deposit')} style={{ flex: 1, padding: '9px', fontSize: '11px', borderRadius: '8px', border: '1px solid ' + (txTypeView === 'deposit' ? '#38bdf8' : '#2d2d58'), background: txTypeView === 'deposit' ? 'linear-gradient(120deg, #0ea5e9, #0369a1)' : 'linear-gradient(160deg, #1e1b4b, #12122a)', color: '#fff', fontWeight: '800', cursor: 'pointer', boxShadow: txTypeView === 'deposit' ? '0 4px 14px rgba(14,165,233,0.35)' : 'none' }}> 📥 Deposits </button>
                  <button onClick={() => setTxTypeView('withdrawal')} style={{ flex: 1, padding: '9px', fontSize: '11px', borderRadius: '8px', border: '1px solid ' + (txTypeView === 'withdrawal' ? '#38bdf8' : '#2d2d58'), background: txTypeView === 'withdrawal' ? 'linear-gradient(120deg, #0ea5e9, #0369a1)' : 'linear-gradient(160deg, #1e1b4b, #12122a)', color: '#fff', fontWeight: '800', cursor: 'pointer', boxShadow: txTypeView === 'withdrawal' ? '0 4px 14px rgba(14,165,233,0.35)' : 'none' }}> 📤 Withdrawals </button>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                  {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(status => (
                    <button key={status} onClick={() => setTxFilter(status)} style={{ flex: 1, padding: '7px 4px', fontSize: '10px', borderRadius: '6px', border: '1px solid ' + (txFilter === status ? '#fbbf24' : '#2d2d58'), backgroundColor: txFilter === status ? 'rgba(245,158,11,0.15)' : 'transparent', color: txFilter === status ? '#fbbf24' : '#8b8ba7', fontWeight: '800', cursor: 'pointer' }}>
                      {status} ({activeTxList.filter(t => status === 'ALL' ? true : t.status === status).length})
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => (
                      <div key={tx._id} style={{ ...cardStyle, borderRadius: '12px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: txTypeView === 'deposit' ? '#22c55e' : '#ef4444', fontWeight: '800', letterSpacing: '0.5px' }}>
                            {txTypeView === 'deposit' ? '▼ DEPOSIT' : '▲ WITHDRAWAL'}
                          </span>
                          <span style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '12px', backgroundColor: tx.status === 'PENDING' ? '#eab308' : (tx.status === 'APPROVED' ? '#22c55e' : '#ef4444'), color: '#000', fontWeight: '800', letterSpacing: '0.5px' }}>
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
                          <div style={{ marginTop: '10px', padding: '10px', background: '#0a0a1a', borderRadius: '8px', border: '1px solid #1e293b' }}>
                            <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 'bold', marginBottom: '4px', letterSpacing: '0.3px' }}>📄 PASTED SMS</div>
                            <div style={{ fontSize: '11px', color: '#fff', wordBreak: 'break-all', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{tx.pastedText}</div>
                          </div>
                        )}
                        {tx.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <button onClick={() => handleProcessTx(tx._id, 'APPROVED', txTypeView)} style={{ flex: 1, padding: '9px', background: 'linear-gradient(120deg, #22c55e, #16a34a)', color: '#fff', border: '1px solid #4ade80', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '12px', boxShadow: '0 3px 12px rgba(34,197,94,0.35)' }}> ✓ Approve </button>
                            <button onClick={() => handleProcessTx(tx._id, 'REJECTED', txTypeView)} style={{ flex: 1, padding: '9px', background: 'linear-gradient(120deg, #ef4444, #b91c1c)', color: '#fff', border: '1px solid #fca5a5', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '12px', boxShadow: '0 3px 12px rgba(239,68,68,0.35)' }}> ✕ Reject </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', color: '#8b8ba7', padding: '30px', fontSize: '13px' }}>ምንም አልተመዘገበ</div>
                  )}
                </div>
              </div>
            )}
            {isSuperAdmin && adminTab === 'reports' && financialStats && (
              <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h3 style={{ fontSize: '14px', color: '#fbbf24', margin: '0 0 4px 0', letterSpacing: '0.3px' }}>📊 Financial Dashboard</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ ...cardStyle, padding: '16px', border: '1px solid rgba(34,197,94,0.4)', textAlign: 'center', boxShadow: '0 0 18px rgba(34,197,94,0.15)' }}>
                    <div style={{ fontSize: '11px', color: '#8b8ba7', letterSpacing: '0.5px' }}>ገቢ (Deposit)</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#22c55e', marginTop: '6px', textShadow: '0 0 10px rgba(34,197,94,0.4)' }}>{financialStats.totalDeposit} <span style={{ fontSize: '11px' }}>ETB</span></div>
                  </div>
                  <div style={{ ...cardStyle, padding: '16px', border: '1px solid rgba(239,68,68,0.4)', textAlign: 'center', boxShadow: '0 0 18px rgba(239,68,68,0.15)' }}>
                    <div style={{ fontSize: '11px', color: '#8b8ba7', letterSpacing: '0.5px' }}>ወጪ (Withdrawal)</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#ef4444', marginTop: '6px', textShadow: '0 0 10px rgba(239,68,68,0.4)' }}>{financialStats.totalWithdrawal} <span style={{ fontSize: '11px' }}>ETB</span></div>
                  </div>
                </div>
                <div style={{ ...cardStyle, padding: '20px', border: '1px solid rgba(250,204,21,0.5)', textAlign: 'center', boxShadow: '0 0 22px rgba(250,204,21,0.2)' }}>
                  <div style={{ fontSize: '12px', color: '#8b8ba7', letterSpacing: '0.5px', textTransform: 'uppercase' }}>House Net Commission</div>
                  <div style={{ fontSize: '30px', fontWeight: '900', color: '#facc15', marginTop: '8px', textShadow: '0 0 16px rgba(250,204,21,0.6)' }}>{financialStats.houseProfit} <span style={{ fontSize: '14px' }}>ETB</span></div>
                </div>
              </div>
            )}
            {isSuperAdmin && adminTab === 'users' && (
              <>
                <input type="text" placeholder="🔍 በተጠቃሚ ID ወይም ስልክ ፈልግ..." value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0a0a1a', color: '#fff', marginBottom: '16px', boxSizing: 'border-box', fontSize: '13px' }} />
                {editingUser && (
                  <div className="float-in" style={{ background: 'linear-gradient(160deg, #1b1b38, #12122a)', border: '1px solid #fbbf24', borderRadius: '14px', padding: '18px', marginBottom: '16px', boxShadow: '0 0 22px rgba(251,191,36,0.2)' }}>
                    <h3 style={{ fontSize: '13px', color: '#fbbf24', margin: '0 0 12px 0', letterSpacing: '0.3px' }}>✏️ የተጠቃሚ ሒሳብ: {editingUser.userId}</h3>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10px', color: '#8b8ba7', letterSpacing: '0.3px' }}>Main Wallet:</label>
                        <input type="number" value={editMain} onChange={(e) => setEditMain(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #312e81', backgroundColor: '#05050f', color: '#fff', marginTop: '4px' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10px', color: '#8b8ba7', letterSpacing: '0.3px' }}>Play Wallet:</label>
                        <input type="number" value={editPlay} onChange={(e) => setEditPlay(e.target.value)} style={{ width: '100%', padding: '9px', borderRadius: '6px', border: '1px solid #312e81', backgroundColor: '#05050f', color: '#fff', marginTop: '4px' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleUpdateUserBalance} style={{ flex: 1, padding: '10px', background: 'linear-gradient(120deg, #22c55e, #16a34a)', color: '#fff', border: '1px solid #4ade80', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '12px' }}>💾 Save</button>
                      <button onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '10px', background: 'linear-gradient(120deg, #ef4444, #b91c1c)', color: '#fff', border: '1px solid #fca5a5', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '12px' }}>✕ Cancel</button>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredAdminUsers.map((u) => (
                    <div key={u.userId} style={{ ...cardStyle, borderRadius: '12px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#38bdf8' }}>{u.firstName || 'ተጠቃሚ'} <span style={{ color: '#8b8ba7', fontSize: '11px' }}>(ID: {u.userId})</span></div>
                        <div style={{ fontSize: '11px', color: '#8b8ba7', marginTop: '3px' }}>📱 {u.phone || 'ስልክ የለው'}</div>
                        <div style={{ fontSize: '11px', color: '#22c55e', marginTop: '3px' }}>💳 {u.mainWallet} | 🎮 {u.playWallet} ETB</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <button onClick={() => { setEditingUser(u); setEditMain(u.mainWallet); setEditPlay(u.playWallet); }} style={{ background: 'linear-gradient(120deg, #0ea5e9, #0369a1)', color: '#fff', border: '1px solid #38bdf8', borderRadius: '7px', padding: '7px 12px', fontSize: '11px', cursor: 'pointer', fontWeight: '800' }}> ✏️ Edit </button>
                        <button onClick={() => handleToggleBan(u.userId, u.isBanned)} style={{ background: u.isBanned ? 'linear-gradient(120deg, #10b981, #059669)' : 'linear-gradient(120deg, #ef4444, #b91c1c)', color: '#fff', border: '1px solid ' + (u.isBanned ? '#6ee7b7' : '#fca5a5'), borderRadius: '7px', padding: '7px 12px', fontSize: '11px', cursor: 'pointer', fontWeight: '800' }}> {u.isBanned ? '✓ Unban' : '✕ Ban'} </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {isSuperAdmin && adminTab === 'game_control' && (
              <div style={{ ...cardStyle, padding: '20px', border: '1px solid rgba(245,158,11,0.35)' }}>
                <h3 style={{ fontSize: '15px', color: '#fbbf24', marginTop: 0, letterSpacing: '0.3px' }}>🎯 የቁጥር ማውጫ መቆጣጠሪያ</h3>
                <input type="number" placeholder="የማሸነፊያ ቁጥር አስገባ (1-1000)" value={manualNumberInput} onChange={(e) => setManualNumberInput(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0a0a1a', color: '#fff', marginBottom: '12px', boxSizing: 'border-box', fontSize: '13px' }} />
                <button onClick={handleSetManualWinner} style={{ width: '100%', padding: '12px', background: 'linear-gradient(120deg, #f59e0b, #d97706)', color: '#000', border: '1px solid #fbbf24', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 16px rgba(245,158,11,0.35)' }}>✓ መደብ አስቀምጥ</button>
              </div>
            )}
            {isSuperAdmin && adminTab === 'settings' && (
              <div style={{ ...cardStyle, padding: '20px', border: '1px solid rgba(245,158,11,0.35)' }}>
                <h3 style={{ fontSize: '15px', color: '#fbbf24', marginTop: 0, letterSpacing: '0.3px' }}>⚙️ የሲስተም ማስተካከያዎች</h3>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', color: '#8b8ba7', letterSpacing: '0.3px' }}>የቲኬት ዋጋ (Ticket Price):</label>
                  <input type="number" value={sysSettings.ticketPrice} onChange={(e) => setSysSettings({...sysSettings, ticketPrice: Number(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0a0a1a', color: '#fff', marginTop: '6px', fontSize: '13px' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '11px', color: '#8b8ba7', letterSpacing: '0.3px' }}>የአሸናፊው ድርሻ በመቶኛ (Winner %):</label>
                  <input type="number" value={sysSettings.winnerPercentage} onChange={(e) => setSysSettings({...sysSettings, winnerPercentage: Number(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0a0a1a', color: '#fff', marginTop: '6px', fontSize: '13px' }} />
                </div>
                <button onClick={() => handleUpdateSettings()} style={{ width: '100%', padding: '12px', background: 'linear-gradient(120deg, #22c55e, #16a34a)', color: '#fff', border: '1px solid #4ade80', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 16px rgba(34,197,94,0.35)' }}>💾 ቅንብሮችን አዘምን</button>
              </div>
            )}
            {isSuperAdmin && adminTab === 'broadcast' && (
              <div style={{ ...cardStyle, padding: '20px', border: '1px solid rgba(14,165,233,0.35)' }}>
                <h3 style={{ fontSize: '15px', color: '#38bdf8', marginTop: 0, letterSpacing: '0.3px' }}>📢 ለሁሉም ተጠቃሚዎች መልእክት መላክ</h3>
                <textarea rows="4" placeholder="መልእክትዎን እዚህ ይጻፉ..." value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: '#0a0a1a', color: '#fff', marginBottom: '12px', boxSizing: 'border-box', fontSize: '13px' }} />
                <button onClick={handleSendBroadcast} style={{ width: '100%', padding: '12px', background: 'linear-gradient(120deg, #0ea5e9, #0369a1)', color: '#fff', border: '1px solid #38bdf8', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 16px rgba(14,165,233,0.35)' }}>📤 መልእክት አስተላልፍ</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER NAVIGATION */}
      {!(currentTab === 'game' && currentScreen !== 'home') && (
        <div style={{
          width: '100%',
          height: '64px',
          background: 'linear-gradient(180deg, rgba(10,10,22,0.95), rgba(5,5,15,1))',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderTop: '1px solid #1e1b4b',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          flexShrink: 0,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.5)'
        }}>
          <button onClick={() => { setCurrentTab('game'); setCurrentScreen('home'); }} style={navBtnStyle(currentTab === 'game')}>
            <span style={{ fontSize: '20px' }}>🎮</span> Game
          </button>
          <button onClick={() => setCurrentTab('history')} style={navBtnStyle(currentTab === 'history')}>
            <span style={{ fontSize: '20px' }}>📜</span> History
          </button>
          <button onClick={() => setCurrentTab('wallet')} style={navBtnStyle(currentTab === 'wallet')}>
            <span style={{ fontSize: '20px' }}>💳</span> Wallet
          </button>
          <button onClick={() => setCurrentTab('profile')} style={navBtnStyle(currentTab === 'profile')}>
            <span style={{ fontSize: '20px' }}>👤</span> Profile
          </button>
          {isAdmin && (
            <button onClick={() => setCurrentTab('admin')} style={navBtnStyle(currentTab === 'admin')}>
              <span style={{ fontSize: '20px' }}>⚙️</span> Admin
            </button>
          )}
        </div>
      )}
    </div>
  );
}