import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "https://fetan-lottery-backend.onrender.com";
const SUPER_ADMIN_ID = "494653076";
const ASSISTANT_ADMIN_1 = "6557480753";
const ASSISTANT_ADMIN_2 = "6660106172";

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
  let bgColor = '#2a2a40';
  if (isMine) bgColor = '#22c55e';
  else if (isOthers) bgColor = '#ef4444';
  return (
    <button
      onClick={() => onClick(num)}
      disabled={disabled}
      style={{
        padding: '8px 0',
        backgroundColor: bgColor,
        color: '#ffffff',
        border: '1px solid #3d3d5c',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 'bold',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        willChange: 'background-color'
      }}
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

export default function App() {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const userId = useMemo(() => (tgUser?.id ? String(tgUser.id) : 'GUEST_USER'), [tgUser]);
  const userName = useMemo(() => {
    if (!tgUser) return 'ተጠቃሚ';
    const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ');
    return fullName || 'ተጠቃሚ';
  }, [tgUser]);
  const userPhoto = tgUser?.photo_url || null;

  // ADMIN ROLES CHECK
  const isSuperAdmin = useMemo(() => String(userId) === String(SUPER_ADMIN_ID), [userId]);
  const isAssistantAdmin1 = useMemo(() => String(userId) === String(ASSISTANT_ADMIN_1), [userId]);
  const isAssistantAdmin2 = useMemo(() => String(userId) === String(ASSISTANT_ADMIN_2), [userId]);
  const isAdmin = isSuperAdmin || isAssistantAdmin1 || isAssistantAdmin2;

  const [userPhone, setUserPhone] = useState('');
  const [isBanned, setIsBanned] = useState(false);
  const userInitial = userName ? userName.charAt(0).toUpperCase() : 'U';

  const socket = useMemo(() => io(API_BASE_URL, {
    autoConnect: true,
    transports: ['websocket', 'polling'],
    query: { userId }
  }), [userId]);

  const [currentTab, setCurrentTab] = useState('game');
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home', 'board10', 'board20', 'board50', 'board100'
  const [registeredCount, setRegisteredCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [walletTab, setWalletTab] = useState('balance');
  const [mainWallet, setMainWallet] = useState(0);
  const [playWallet, setPlayWallet] = useState(0);
  const [gamesWon, setGamesWon] = useState(0);
  const [totalInvite, setTotalInvite] = useState(0);
  const [totalGames, setTotalGames] = useState(0);

  // Helper to generate FL + 6 digit random number
  const generateRandomGameId = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `FL-${randomNum}`;
  };

  // INDEPENDENT STATES FOR STAKE 10, 20, 50, AND 100
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

  // PLAY 50 & PLAY 100 (WEEKLY INDEPENDENT)
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

  // DEPOSIT & WITHDRAW STATES
  const [depAmount, setDepAmount] = useState('200');
  const [pastedSMS, setPastedSMS] = useState('');
  const [isSubmittingDep, setIsSubmittingDep] = useState(false);
  const [withAmount, setWithAmount] = useState('');
  const [gameHistory, setGameHistory] = useState([]);
  const [copiedLink, setCopiedLink] = useState(false);

  // ADMIN STATES
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

  // SYSTEM SETTINGS STATE
  const [sysSettings, setSysSettings] = useState({
    ticketPrice: 10,
    winnerPercentage: 80,
    manualWinningNumber: null,
    activeAdmins: { admin1: true, admin2: true }
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
        activeAdmins: sysSettings.activeAdmins,
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

  return (
    <div style={{ maxWidth: '500px', width: '100%', margin: '0 auto', backgroundColor: '#0c0c1e', color: '#ffffff', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', boxSizing: 'border-box', overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        * { box-sizing: border-box !important; }
        @keyframes arrowSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spin-arrow-container { animation: arrowSpin 0.3s linear infinite; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #312e81; border-radius: 4px; }
      `}} />

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
        {currentTab === 'game' && (
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

                <div style={{ width: '100%', backgroundColor: '#15152a', border: '1px solid #f59e0b', borderRadius: '16px', padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)', marginBottom: '20px', boxSizing: 'border-box' }}>
                  <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>Choose Stake</div>
                  
                  <button onClick={() => setCurrentScreen('board10')} style={{ width: '100%', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px', textAlign: 'center' }}>
                    ► Play 10 ETB
                  </button>
                  <button onClick={() => setCurrentScreen('board20')} style={{ width: '100%', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px', textAlign: 'center' }}>
                    ► Play 20 ETB
                  </button>
                  </div>

                 {/* Play 50 (Weekly - Saturday 12:00) */}
                   <div style={{ width: '100%', backgroundColor: '#15152a', border: '1px solid #f59e0b', borderRadius: '16px', padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)', marginBottom: '20px', boxSizing: 'border-box' }}>
                    <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>Weekly Game</div>
                 
                    <button onClick={() => setCurrentScreen('board50')} style={{ width: '100%', backgroundColor: '#2481cc', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}>
                      ► Play 50 ETB
                    </button>
                    <div style={{ textAlign: 'center', fontSize: '11px', color: '#facc15', marginTop: '4px', fontWeight: 'bold' }}>
                      weekly (ቅዳሜ ማታ 12:00)
                    
                  </div>

                  {/* Play 100 (Weekly - Saturday 12:05) */}
                  
                    <button onClick={() => setCurrentScreen('board100')} style={{ width: '100%', backgroundColor: '#22c55e', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center' }}>
                      ► Play 100 ETB
                    </button>
                    <div style={{ textAlign: 'center', fontSize: '11px', color: '#facc15', marginTop: '4px', fontWeight: 'bold' }}>
                      weekly (ቅዳሜ ማታ 12:05)
                    
                  </div>
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
                  <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#9ca3af' }}>Game ID</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#f59e0b' }}>{currentGameId10}</div></div>
                  <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#9ca3af' }}>Players</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#38bdf8' }}>{playerCount10}</div></div>
                  <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#9ca3af' }}>Stake</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#22c55e' }}>10 ETB</div></div>
                  <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#9ca3af' }}>Derash</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#22c55e' }}>{derash10} ETB</div></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', flex: 1, padding: '4px 8px 8px 8px', overflow: 'hidden', width: '100%' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: phase10 === 'spinning' ? (allPickedNumbers10.length > 0 ? '#dc2626' : '#6b7280') : '#22c55e', padding: '5px', borderRadius: '6px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>
                      {phase10 === 'spinning' ? (allPickedNumbers10.length > 0 ? 'ቁጥር እያሰበሰበ ነው...' : '⚠️ ማንም ቁጥር አልመረጠም!') : 'የምረጣ ጊዜ ' + selectionTime10 + ' S'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', overflowY: 'auto', alignContent: 'start', paddingRight: '4px', flex: 1 }}>
                      {visibleNumbers.map((num) => {
                        const isMine = myPickedSet10.has(num);
                        const isOthers = allPickedSet10.has(num) && !isMine;
                        const hasEnoughMoney = (Number(mainWallet) + Number(playWallet)) >= 10;
                        const isDisabled = phase10 !== 'selecting' || isBanned || (!hasEnoughMoney && !isMine);
                        return <NumberButton key={num} num={num} disabled={isDisabled} isMine={isMine} isOthers={isOthers} onClick={() => toggleNumber(num, 10)} />;
                      })}
                    </div>
                  </div>
                  <div style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, justifyContent: 'flex-start', overflowY: 'auto' }}>
                    <div style={{ backgroundColor: '#1b1b32', borderRadius: '8px', padding: '6px 8px', minHeight: '65px', maxHeight: '90px', border: '1px solid #312e81', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                      <div style={{ fontSize: '10px', color: '#38bdf8', marginBottom: '2px', fontWeight: 'bold' }}> 📌 የተመረጡ ቁጥሮች ({selectedNumbers10.length}): </div>
                      <div style={{ fontSize: '10px', color: '#9ca3af', lineHeight: '1.2', wordBreak: 'break-word', overflowY: 'auto', flex: 1 }}>
                        {selectedNumbers10.length > 0 ? selectedNumbers10.join(', ') : 'እስካሁን ማንም አልመረጠም'}
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#13132b', borderRadius: '12px', padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #23234d', flexShrink: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '10px', color: '#f59e0b' }}> የቁጥር ማውጣት </div>
                      <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: '#0d0d1a', border: winningNumber10 === 'SPINNING' ? '3px solid #00f2fe' : (winningNumber10 !== '?' && winningNumber10 !== 'NONE' ? '3px solid #00ffcc' : '3px solid #e11d48'), display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: winningNumber10 === 'SPINNING' ? '0 0 20px rgba(0, 242, 254, 0.6)' : (winningNumber10 !== '?' && winningNumber10 !== 'NONE' ? '0 0 20px rgba(0, 255, 204, 0.6)' : '0 0 15px rgba(225, 29, 72, 0.3)'), transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden' }}>
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
                            <span style={{ fontSize: winningNumber10 === '?' ? '42px' : '38px', fontWeight: 'bold', color: winningNumber10 === '?' ? '#ffffff' : '#00ffcc', textShadow: winningNumber10 === '?' ? 'none' : '0 0 12px #00ffcc', lineHeight: '1', display: 'inline-block', margin: '0', padding: '0' }}>
                              {winningNumber10}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {winnerInfo10 && (
                      <div style={{ marginTop: '4px', padding: '8px', backgroundColor: '#064e3b', border: '2px solid #10b981', borderRadius: '10px', textAlign: 'center', boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#34d399' }}> 🎉 አሸናፊ አሸነፈ! </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff', margin: '2px 0' }}> 👤 {winnerInfo10.userName} </div>
                        <div style={{ fontSize: '13px', fontWeight: '900', color: '#facc15' }}> ቁጥር: #{winnerInfo10.number} </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399', marginTop: '2px' }}> የድረሽ ብር: {winnerInfo10.derash} ETB </div>
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
                  <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#9ca3af' }}>Game ID</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#f59e0b' }}>{currentGameId20}</div></div>
                  <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#9ca3af' }}>Players</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#38bdf8' }}>{playerCount20}</div></div>
                  <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#9ca3af' }}>Stake</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#0284c7' }}>20 ETB</div></div>
                  <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#9ca3af' }}>Derash</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#22c55e' }}>{derash20} ETB</div></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', flex: 1, padding: '4px 8px 8px 8px', overflow: 'hidden', width: '100%' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: phase20 === 'spinning' ? (allPickedNumbers20.length > 0 ? '#dc2626' : '#6b7280') : '#0284c7', padding: '5px', borderRadius: '6px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>
                      {phase20 === 'spinning' ? (allPickedNumbers20.length > 0 ? 'ቁጥር እያሰበሰበ ነው...' : '⚠️ ማንም ቁጥር አልመረጠም!') : 'የምረጣ ጊዜ ' + selectionTime20 + ' S'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', overflowY: 'auto', alignContent: 'start', paddingRight: '4px', flex: 1 }}>
                      {visibleNumbers.map((num) => {
                        const isMine = myPickedSet20.has(num);
                        const isOthers = allPickedSet20.has(num) && !isMine;
                        const hasEnoughMoney = (Number(mainWallet) + Number(playWallet)) >= 20;
                        const isDisabled = phase20 !== 'selecting' || isBanned || (!hasEnoughMoney && !isMine);
                        return <NumberButton key={num} num={num} disabled={isDisabled} isMine={isMine} isOthers={isOthers} onClick={() => toggleNumber(num, 20)} />;
                      })}
                    </div>
                  </div>
                  <div style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, justifyContent: 'flex-start', overflowY: 'auto' }}>
                    <div style={{ backgroundColor: '#1b1b32', borderRadius: '8px', padding: '6px 8px', minHeight: '65px', maxHeight: '90px', border: '1px solid #312e81', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                      <div style={{ fontSize: '10px', color: '#38bdf8', marginBottom: '2px', fontWeight: 'bold' }}> 📌 የተመረጡ ቁጥሮች ({selectedNumbers20.length}): </div>
                      <div style={{ fontSize: '10px', color: '#9ca3af', lineHeight: '1.2', wordBreak: 'break-word', overflowY: 'auto', flex: 1 }}>
                        {selectedNumbers20.length > 0 ? selectedNumbers20.join(', ') : 'እስካሁን ማንም አልመረጠም'}
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#13132b', borderRadius: '12px', padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #23234d', flexShrink: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '10px', color: '#f59e0b' }}> የቁጥር ማውጣት </div>
                      <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: '#0d0d1a', border: winningNumber20 === 'SPINNING' ? '3px solid #00f2fe' : (winningNumber20 !== '?' && winningNumber20 !== 'NONE' ? '3px solid #00ffcc' : '3px solid #e11d48'), display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: winningNumber20 === 'SPINNING' ? '0 0 20px rgba(0, 242, 254, 0.6)' : (winningNumber20 !== '?' && winningNumber20 !== 'NONE' ? '0 0 20px rgba(0, 255, 204, 0.6)' : '0 0 15px rgba(225, 29, 72, 0.3)'), transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden' }}>
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
                            <span style={{ fontSize: winningNumber20 === '?' ? '42px' : '38px', fontWeight: 'bold', color: winningNumber20 === '?' ? '#ffffff' : '#00ffcc', textShadow: winningNumber20 === '?' ? 'none' : '0 0 12px #00ffcc', lineHeight: '1', display: 'inline-block', margin: '0', padding: '0' }}>
                              {winningNumber20}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {winnerInfo20 && (
                      <div style={{ marginTop: '4px', padding: '8px', backgroundColor: '#064e3b', border: '2px solid #10b981', borderRadius: '10px', textAlign: 'center', boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#34d399' }}> 🎉 አሸናፊ አሸነፈ! </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff', margin: '2px 0' }}> 👤 {winnerInfo20.userName} </div>
                        <div style={{ fontSize: '13px', fontWeight: '900', color: '#facc15' }}> ቁጥር: #{winnerInfo20.number} </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399', marginTop: '2px' }}> የድረሽ ብር: {winnerInfo20.derash} ETB </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SEPARATE BOARD FOR 50 ETB (WEEKLY - Saturday 12:00) */}
            {currentScreen === 'board50' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', backgroundColor: '#0a0a16', borderBottom: '1px solid #1e1b4b', flexShrink: 0, width: '100%' }}>
                  <button onClick={() => setCurrentScreen('home')} style={{ backgroundColor: '#1e1b4b', color: '#38bdf8', border: '1px solid #312e81', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>← Back</button>
                  <button onClick={() => fetchUserData()} style={{ backgroundColor: '#1e1b4b', color: '#22c55e', border: '1px solid #312e81', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Refresh</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', padding: '6px 8px 4px 8px', flexShrink: 0, width: '100%' }}>
                  <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#9ca3af' }}>Game ID</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#f59e0b' }}>{currentGameId50}</div></div>
                  <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#9ca3af' }}>Players</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#38bdf8' }}>{playerCount50}</div></div>
                  <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#9ca3af' }}>Stake</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#8b5cf6' }}>50 ETB</div></div>
                  <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#9ca3af' }}>Derash</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#22c55e' }}>{derash50} ETB</div></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', flex: 1, padding: '4px 8px 8px 8px', overflow: 'hidden', width: '100%' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#8b5cf6', padding: '5px', borderRadius: '6px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>
                      Weekly: ቅዳሜ ማታ 12:00
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', overflowY: 'auto', alignContent: 'start', paddingRight: '4px', flex: 1 }}>
                      {visibleNumbers.map((num) => {
                        const isMine = myPickedSet50.has(num);
                        const isOthers = allPickedSet50.has(num) && !isMine;
                        const hasEnoughMoney = (Number(mainWallet) + Number(playWallet)) >= 50;
                        const isDisabled = isBanned || (!hasEnoughMoney && !isMine);
                        return <NumberButton key={num} num={num} disabled={isDisabled} isMine={isMine} isOthers={isOthers} onClick={() => toggleNumber(num, 50)} />;
                      })}
                    </div>
                  </div>
                  <div style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, justifyContent: 'flex-start', overflowY: 'auto' }}>
                    <div style={{ backgroundColor: '#1b1b32', borderRadius: '8px', padding: '6px 8px', minHeight: '65px', maxHeight: '90px', border: '1px solid #312e81', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                      <div style={{ fontSize: '10px', color: '#38bdf8', marginBottom: '2px', fontWeight: 'bold' }}> 📌 የተመረጡ ቁጥሮች ({selectedNumbers50.length}): </div>
                      <div style={{ fontSize: '10px', color: '#9ca3af', lineHeight: '1.2', wordBreak: 'break-word', overflowY: 'auto', flex: 1 }}>
                        {selectedNumbers50.length > 0 ? selectedNumbers50.join(', ') : 'እስካሁን ማንም አልመረጠም'}
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#13132b', borderRadius: '12px', padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #23234d', flexShrink: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '10px', color: '#f59e0b' }}> የቁጥር ማውጣት </div>
                      <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: '#0d0d1a', border: '3px solid #8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)' }}>
                        <span style={{ fontSize: '38px', fontWeight: 'bold', color: '#ffffff' }}>{winningNumber50}</span>
                      </div>
                    </div>
                    {winnerInfo50 && (
                      <div style={{ marginTop: '4px', padding: '8px', backgroundColor: '#064e3b', border: '2px solid #10b981', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#34d399' }}> 🎉 አሸናፊ አሸነፈ! </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff', margin: '2px 0' }}> 👤 {winnerInfo50.userName} </div>
                        <div style={{ fontSize: '13px', fontWeight: '900', color: '#facc15' }}> ቁጥር: #{winnerInfo50.number} </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399', marginTop: '2px' }}> የድረሽ ብር: {winnerInfo50.derash} ETB </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SEPARATE BOARD FOR 100 ETB (WEEKLY - Saturday 12:05) */}
            {currentScreen === 'board100' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', backgroundColor: '#0a0a16', borderBottom: '1px solid #1e1b4b', flexShrink: 0, width: '100%' }}>
                  <button onClick={() => setCurrentScreen('home')} style={{ backgroundColor: '#1e1b4b', color: '#38bdf8', border: '1px solid #312e81', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>← Back</button>
                  <button onClick={() => fetchUserData()} style={{ backgroundColor: '#1e1b4b', color: '#22c55e', border: '1px solid #312e81', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Refresh</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', padding: '6px 8px 4px 8px', flexShrink: 0, width: '100%' }}>
                  <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#9ca3af' }}>Game ID</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#f59e0b' }}>{currentGameId100}</div></div>
                  <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#9ca3af' }}>Players</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#38bdf8' }}>{playerCount100}</div></div>
                  <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#9ca3af' }}>Stake</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#eab308' }}>100 ETB</div></div>
                  <div style={{ backgroundColor: '#1e1b4b', padding: '6px 2px', borderRadius: '6px', textAlign: 'center' }}><div style={{ fontSize: '9px', color: '#9ca3af' }}>Derash</div><div style={{ fontSize: '10px', fontWeight: 'bold', color: '#22c55e' }}>{derash100} ETB</div></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px', flex: 1, padding: '4px 8px 8px 8px', overflow: 'hidden', width: '100%' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#eab308', color: '#000', padding: '5px', borderRadius: '6px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 }}>
                      Weekly: ቅዳሜ ማታ 12:05
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', overflowY: 'auto', alignContent: 'start', paddingRight: '4px', flex: 1 }}>
                      {visibleNumbers.map((num) => {
                        const isMine = myPickedSet100.has(num);
                        const isOthers = allPickedSet100.has(num) && !isMine;
                        const hasEnoughMoney = (Number(mainWallet) + Number(playWallet)) >= 100;
                        const isDisabled = isBanned || (!hasEnoughMoney && !isMine);
                        return <NumberButton key={num} num={num} disabled={isDisabled} isMine={isMine} isOthers={isOthers} onClick={() => toggleNumber(num, 100)} />;
                      })}
                    </div>
                  </div>
                  <div style={{ width: '160px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0, justifyContent: 'flex-start', overflowY: 'auto' }}>
                    <div style={{ backgroundColor: '#1b1b32', borderRadius: '8px', padding: '6px 8px', minHeight: '65px', maxHeight: '90px', border: '1px solid #312e81', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                      <div style={{ fontSize: '10px', color: '#38bdf8', marginBottom: '2px', fontWeight: 'bold' }}> 📌 የተመረጡ ቁጥሮች ({selectedNumbers100.length}): </div>
                      <div style={{ fontSize: '10px', color: '#9ca3af', lineHeight: '1.2', wordBreak: 'break-word', overflowY: 'auto', flex: 1 }}>
                        {selectedNumbers100.length > 0 ? selectedNumbers100.join(', ') : 'እስካሁን ማንም አልመረጠም'}
                      </div>
                    </div>
                    <div style={{ backgroundColor: '#13132b', borderRadius: '12px', padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px solid #23234d', flexShrink: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '10px', color: '#f59e0b' }}> የቁጥር ማውጣት </div>
                      <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: '#0d0d1a', border: '3px solid #eab308', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(234, 179, 8, 0.3)' }}>
                        <span style={{ fontSize: '38px', fontWeight: 'bold', color: '#ffffff' }}>{winningNumber100}</span>
                      </div>
                    </div>
                    {winnerInfo100 && (
                      <div style={{ marginTop: '4px', padding: '8px', backgroundColor: '#064e3b', border: '2px solid #10b981', borderRadius: '10px', textAlign: 'center' }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#34d399' }}> 🎉 አሸናፊ አሸነፈ! </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffffff', margin: '2px 0' }}> 👤 {winnerInfo100.userName} </div>
                        <div style={{ fontSize: '13px', fontWeight: '900', color: '#facc15' }}> ቁጥር: #{winnerInfo100.number} </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#34d399', marginTop: '2px' }}> የድረሽ ብር: {winnerInfo100.derash} ETB </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {currentTab === 'history' && (
          <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>📜 Game History</h1>
            <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid #2a2a4a', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '6px' }}>Total Games Played</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{totalGames}</div>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '12px' }}>Your Winning History</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {gameHistory.length > 0 ? (
                gameHistory.map((item, idx) => (
                  <div key={idx} style={{ backgroundColor: '#181830', border: '1px solid #2a2a4a', borderRadius: '10px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#38bdf8' }}>Winning Num: #{item.winningNumber}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Winner: {item.winnerName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#22c55e' }}>+{item.derash} ETB</div>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently'}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px', fontSize: '13px' }}> እስካሁን የሎቶሪ ታሪክ አልተመዘገበም </div>
              )}
            </div>
          </div>
        )}

        {currentTab === 'wallet' && (
          <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>💳 Wallet & Transactions</h1>
              <span onClick={fetchUserData} style={{ fontSize: '18px', cursor: 'pointer', color: '#9ca3af' }}>🔄</span>
            </div>
            <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', border: '1px solid #2a2a4a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>👤</span>
                <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{userPhone || 'ስልክ አልተመዘገበ'}</span>
              </div>
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981', borderRadius: '20px', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold' }}>
                ✓ Verified
              </div>
            </div>
            <div style={{ backgroundColor: '#181830', borderRadius: '10px', padding: '4px', display: 'flex', marginBottom: '16px', border: '1px solid #2a2a4a' }}>
              <button onClick={() => setWalletTab('balance')} style={{ flex: 1, padding: '10px 0', borderRadius: '8px', border: 'none', backgroundColor: walletTab === 'balance' ? '#2a2a4a' : 'transparent', color: walletTab === 'balance' ? '#ffffff' : '#9ca3af', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}> Balance </button>
            </div>
            {walletTab === 'balance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '14px', border: '1px solid #2a2a4a', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>Main Wallet</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{mainWallet} ETB</div>
                  </div>
                  <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '14px', border: '1px solid #2a2a4a', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>Play Wallet</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>{playWallet} ETB</div>
                  </div>
                </div>
                <div style={{ backgroundColor: '#181830', padding: '16px', borderRadius: '12px', border: '1px solid #2a2a4a' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#f59e0b' }}>📥 Deposit (በቴሌብር ብር መሞላት)</h4>
                  <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '10px', lineHeight: '1.4' }}>
                    1. የሚለውን የብር መጠን ይላኩ ወይም ያስገቡ<br />
                    2. የቴሌብር SMS መልእክትዎን ሙሉ በሙሉ ኮፒ በማድረግ ከዚህ በታች ባለው ሳጥን ውስጥ እሰገብቱ<br />
                  </div>
                  <label style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>የብር መጠን (ETB):</label>
                  <input type="number" placeholder="ለአርአያ 100" value={depAmount} onChange={(e) => setDepAmount(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
                  <label style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>የቴሌብር SMS መልእክት (Copy Paste):</label>
                  <textarea rows="4" placeholder="ድረሶትን ሙሉ የቴሌብር SMS መልእክት እዚህ ጋር ድራፍ አ ዱ (Paste) ይድርጉ..." value={pastedSMS} onChange={(e) => setPastedSMS(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box', fontSize: '12px' }} />
                  <button onClick={handleDeposit} disabled={isSubmittingDep} style={{ width: '100%', padding: '12px', backgroundColor: isSubmittingDep ? '#6b7280' : '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isSubmittingDep ? 'not-allowed' : 'pointer' }}>
                    {isSubmittingDep ? 'እየተላከ ነው...' : 'የተረጋገጠ ፎርም ልክ (Submit Deposit)'}
                  </button>
                </div>
                <div style={{ backgroundColor: '#181830', padding: '16px', borderRadius: '12px', border: '1px solid #2a2a4a' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>📤 Withdraw (ገንዘብ ማውጣት ፎርም)</h4>
                  <input type="number" placeholder="መጠን (ETB)" value={withAmount} onChange={(e) => setWithAmount(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
                  <button onClick={handleWithdraw} style={{ width: '100%', padding: '12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    የወጣ ፎርም ልክ (Submit Withdraw)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentTab === 'profile' && (
          <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '10px', marginBottom: '20px' }}>
              <div style={{ width: '75px', height: '75px', borderRadius: '50%', backgroundColor: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold', color: '#ffffff', marginBottom: '12px', overflow: 'hidden', border: '2px solid #60a5fa' }}>
                {userPhoto ? <img src={userPhoto} alt={userName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : userInitial}
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>{userName}</h2>
              {tgUser?.username && <span style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>@{tgUser.username}</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '14px', border: '1px solid #2a2a4a', textAlign: 'center' }}>
                <div style={{ color: '#60a5fa', fontSize: '13px', marginBottom: '8px' }}>💳 Main Wallet</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{mainWallet} ETB</div>
              </div>
              <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '14px', border: '1px solid #2a2a4a', textAlign: 'center' }}>
                <div style={{ color: '#34d399', fontSize: '13px', marginBottom: '8px' }}>💳 Play Wallet</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{playWallet} ETB</div>
              </div>
              <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '14px', border: '1px solid #2a2a4a', textAlign: 'center' }}>
                <div style={{ color: '#c084fc', fontSize: '13px', marginBottom: '8px' }}>🏆 Games Won</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{gamesWon}</div>
              </div>
              <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '14px', border: '1px solid #2a2a4a', textAlign: 'center' }}>
                <div style={{ color: '#f87171', fontSize: '13px', marginBottom: '8px' }}>👥 Total Invite</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{totalInvite}</div>
              </div>
            </div>
            <div style={{ backgroundColor: '#181830', borderRadius: '12px', padding: '16px', border: '1px solid #2a2a4a', textAlign: 'center' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginTop: 0, marginBottom: '8px', color: '#f59e0b' }}> 🎁 ጓደኞችን ይጋብዙ (Invite Friends) </h3>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px', lineHeight: '1.4' }}>
                የእርስዎን የመጋበዣ ሊንክ ለአርደኞችዎ በመላክ በእያንዳንዱ ግንኙነት ተጨማሪ ቦነስ ይደርስ!
              </p>
              <button onClick={copyReferralLink} style={{ width: '100%', padding: '12px', backgroundColor: copiedLink ? '#10b981' : '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                {copiedLink ? '✓ የመጋበዣ ሊንክ ተቀድቷል (Copied)' : '🔗 የመጋበዣ ሊንክ ቅዳ (Copy Invite Link)'}
              </button>
            </div>
          </div>
        )}

        {isAdmin && currentTab === 'admin' && (
          <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>
                ⚙️ Admin Panel ({isSuperAdmin ? 'Super Admin' : 'Assistant Admin'})
              </h1>
              <button onClick={fetchAdminData} style={{ backgroundColor: '#1e1b4b', color: '#38bdf8', border: '1px solid #312e81', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>🔄 Refresh</button>
            </div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button onClick={() => setAdminTab('requests')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: adminTab === 'requests' ? '#f59e0b' : '#1e1b4b', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>📁 Transactions</button>
              {isSuperAdmin && (
                <>
                  <button onClick={() => setAdminTab('reports')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: adminTab === 'reports' ? '#f59e0b' : '#1e1b4b', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>📊 Dashboard</button>
                  <button onClick={() => setAdminTab('users')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: adminTab === 'users' ? '#f59e0b' : '#1e1b4b', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>Users</button>
                  <button onClick={() => setAdminTab('game_control')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: adminTab === 'game_control' ? '#f59e0b' : '#1e1b4b', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>Draw</button>
                  <button onClick={() => setAdminTab('settings')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: adminTab === 'settings' ? '#f59e0b' : '#1e1b4b', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>Settings</button>
                  <button onClick={() => setAdminTab('broadcast')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: adminTab === 'broadcast' ? '#f59e0b' : '#1e1b4b', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>Broadcast</button>
                </>
              )}
            </div>
            {adminTab === 'requests' && (
              <div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                  <button onClick={() => setTxTypeView('deposit')} style={{ flex: 1, padding: '8px', fontSize: '11px', borderRadius: '6px', border: 'none', backgroundColor: txTypeView === 'deposit' ? '#0284c7' : '#1e1b4b', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}> 📥 የተካቱ ጥያቄዎች (Deposit) </button>
                  <button onClick={() => setTxTypeView('withdrawal')} style={{ flex: 1, padding: '8px', fontSize: '11px', borderRadius: '6px', border: 'none', backgroundColor: txTypeView === 'withdrawal' ? '#0284c7' : '#1e1b4b', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}> 📤 የወጣ ጥያቄዎች (Withdrawal) </button>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                  {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(status => (
                    <button key={status} onClick={() => setTxFilter(status)} style={{ flex: 1, padding: '6px', fontSize: '10px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: txFilter === status ? '#f59e0b' : '#0f172a', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                      {status} ({activeTxList.filter(t => status === 'ALL' ? true : t.status === status).length})
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => (
                      <div key={tx._id} style={{ backgroundColor: '#181830', border: '1px solid #2a2a4a', borderRadius: '10px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px', color: txTypeView === 'deposit' ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>
                            {txTypeView === 'deposit' ? 'DEPOSIT REQUEST' : 'WITHDRAWAL REQUEST'}
                          </span>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', backgroundColor: tx.status === 'PENDING' ? '#eab308' : (tx.status === 'APPROVED' ? '#22c55e' : '#ef4444'), color: '#000', fontWeight: 'bold' }}>
                            {tx.status}
                          </span>
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#facc15', marginBottom: '4px' }}>{tx.amount} ETB</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>👤 User: {tx.userName} (ID: {tx.userId})</div>
                        {tx.phone && <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '2px' }}>📱 Phone: {tx.phone}</div>}
                        {tx.transactionId && <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '2px' }}>🔑 Txn ID: {tx.transactionId}</div>}
                        {tx.processedBy && <div style={{ fontSize: '10px', color: '#a7f3d0', marginTop: '2px' }}>👨‍💼 Processed By Admin: {tx.processedBy}</div>}
                        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>⏱️ Time: {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}</div>
                        {tx.pastedText && (
                          <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#0f172a', borderRadius: '6px', border: '1px solid #1e293b' }}>
                            <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 'bold', marginBottom: '2px' }}>📄 Pasted Telebirr SMS:</div>
                            <div style={{ fontSize: '11px', color: '#fff', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>{tx.pastedText}</div>
                          </div>
                        )}
                        {tx.status === 'PENDING' && (
                          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <button onClick={() => handleProcessTx(tx._id, 'APPROVED', txTypeView)} style={{ flex: 1, padding: '8px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}> ✅ Approve </button>
                            <button onClick={() => handleProcessTx(tx._id, 'REJECTED', txTypeView)} style={{ flex: 1, padding: '8px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}> ❌ Reject </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>ማንም እጅግ አልተመዘገበ</div>
                  )}
                </div>
              </div>
            )}
            {isSuperAdmin && adminTab === 'reports' && financialStats && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '15px', color: '#f59e0b', margin: '0 0 4px 0' }}>📊 Financial Dashboard</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ backgroundColor: '#181830', padding: '14px', borderRadius: '10px', border: '1px solid #22c55e', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>አጠቃላይ ገቢ (Approved Deposit)</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#22c55e', marginTop: '4px' }}>{financialStats.totalDeposit} ETB</div>
                  </div>
                  <div style={{ backgroundColor: '#181830', padding: '14px', borderRadius: '10px', border: '1px solid #ef4444', textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>አጠቃላይ ወጪ (Approved Withdrawal)</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444', marginTop: '4px' }}>{financialStats.totalWithdrawal} ETB</div>
                  </div>
                </div>
                <div style={{ backgroundColor: '#181830', padding: '16px', borderRadius: '10px', border: '1px solid #facc15', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#9ca3af' }}>የቤት የተቆረጠ ትር (House Net Commission)</div>
                  <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#facc15', marginTop: '4px' }}>{financialStats.houseProfit} ETB</div>
                </div>
              </div>
            )}
            {isSuperAdmin && adminTab === 'users' && (
              <>
                <input type="text" placeholder="በተጠቃሚ ID ወይም ስልክ ፈልግ..." value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', marginBottom: '16px', boxSizing: 'border-box' }} />
                {editingUser && (
                  <div style={{ backgroundColor: '#1b1b38', border: '1px solid #f59e0b', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '14px', color: '#f59e0b', margin: '0 0 10px 0' }}>የተጠቃሚ ሒሳብ ማስተካከያ: {editingUser.userId}</h3>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10px', color: '#9ca3af' }}>Main Wallet:</label>
                        <input type="number" value={editMain} onChange={(e) => setEditMain(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #312e81', backgroundColor: '#0d0d1a', color: '#fff' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10px', color: '#9ca3af' }}>Play Wallet:</label>
                        <input type="number" value={editPlay} onChange={(e) => setEditPlay(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #312e81', backgroundColor: '#0d0d1a', color: '#fff' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleUpdateUserBalance} style={{ flex: 1, padding: '8px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}>💾 አዲስ</button>
                      <button onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '8px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px' }}>ሰርዝ</button>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredAdminUsers.map((u) => (
                    <div key={u.userId} style={{ backgroundColor: '#181830', border: '1px solid #2a2a4a', borderRadius: '10px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8' }}>{u.firstName || 'ተጠቃሚ'} (ID: {u.userId})</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>📱 {u.phone || 'ስልክ የለው'}</div>
                        <div style={{ fontSize: '11px', color: '#22c55e', marginTop: '2px' }}>Main: {u.mainWallet} ETB | Play: {u.playWallet} ETB</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <button onClick={() => { setEditingUser(u); setEditMain(u.mainWallet); setEditPlay(u.playWallet); }} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}> ማስተካከል </button>
                        <button onClick={() => handleToggleBan(u.userId, u.isBanned)} style={{ backgroundColor: u.isBanned ? '#10b981' : '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}> {u.isBanned ? 'Unban' : 'Ban'} </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {isSuperAdmin && adminTab === 'game_control' && (
              <div style={{ backgroundColor: '#181830', padding: '16px', borderRadius: '12px', border: '1px solid #2a2a4a' }}>
                <h3 style={{ fontSize: '15px', color: '#f59e0b', marginTop: 0 }}>🎯 የቁጥር ማውጫ መቆጣጠሪያ (Draw Control)</h3>
                <input type="number" placeholder="የማሸነፊያ ቁጥር አስገባ (1-1000)" value={manualNumberInput} onChange={(e) => setManualNumberInput(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', marginBottom: '12px', boxSizing: 'border-box' }} />
                <button onClick={handleSetManualWinner} style={{ width: '100%', padding: '10px', backgroundColor: '#f59e0b', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>መደብ አስቀምጥ</button>
              </div>
            )}
            {isSuperAdmin && adminTab === 'settings' && (
              <div style={{ backgroundColor: '#181830', padding: '16px', borderRadius: '12px', border: '1px solid #2a2a4a' }}>
                <h3 style={{ fontSize: '15px', color: '#f59e0b', marginTop: 0 }}>⚙️ የሲስተም ማስተካከያዎች</h3>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', color: '#9ca3af' }}>የቲኬት ዋጋ (Ticket Price):</label>
                  <input type="number" value={sysSettings.ticketPrice} onChange={(e) => setSysSettings({...sysSettings, ticketPrice: Number(e.target.value)})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', marginTop: '4px' }} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', color: '#9ca3af' }}>የአሸናፊው ድርሻ በመቶኛ (Winner %):</label>
                  <input type="number" value={sysSettings.winnerPercentage} onChange={(e) => setSysSettings({...sysSettings, winnerPercentage: Number(e.target.value)})} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', marginTop: '4px' }} />
                </div>
                <button onClick={() => handleUpdateSettings()} style={{ width: '100%', padding: '10px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>ቅንብሮችን አዘምን</button>
              </div>
            )}
            {isSuperAdmin && adminTab === 'broadcast' && (
              <div style={{ backgroundColor: '#181830', padding: '16px', borderRadius: '12px', border: '1px solid #2a2a4a' }}>
                <h3 style={{ fontSize: '15px', color: '#f59e0b', marginTop: 0 }}>📢 ለሁሉም ተጠቃሚዎች መልእክት መላክ</h3>
                <textarea rows="4" placeholder="መልእክትዎን እዚህ ይጻፉ..." value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', marginBottom: '12px', boxSizing: 'border-box' }} />
                <button onClick={handleSendBroadcast} style={{ width: '100%', padding: '10px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>መልእክት አስተላልፍ</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER NAVIGATION */}
      <div style={{ width: '100%', height: '60px', backgroundColor: '#0a0a16', borderTop: '1px solid #1e1b4b', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexShrink: 0 }}>
        <button onClick={() => { setCurrentTab('game'); setCurrentScreen('home'); }} style={{ background: 'none', border: 'none', color: currentTab === 'game' ? '#f59e0b' : '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
          <span style={{ fontSize: '18px' }}>🎮</span> Game
        </button>
        <button onClick={() => setCurrentTab('history')} style={{ background: 'none', border: 'none', color: currentTab === 'history' ? '#f59e0b' : '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
          <span style={{ fontSize: '18px' }}>📜</span> History
        </button>
        <button onClick={() => setCurrentTab('wallet')} style={{ background: 'none', border: 'none', color: currentTab === 'wallet' ? '#f59e0b' : '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
          <span style={{ fontSize: '18px' }}>💳</span> Wallet
        </button>
        <button onClick={() => setCurrentTab('profile')} style={{ background: 'none', border: 'none', color: currentTab === 'profile' ? '#f59e0b' : '#10b981', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
          <span style={{ fontSize: '18px' }}>👤</span> Profile
        </button>
        {isAdmin && (
          <button onClick={() => setCurrentTab('admin')} style={{ background: 'none', border: 'none', color: currentTab === 'admin' ? '#f59e0b' : '#facc15', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
            <span style={{ fontSize: '18px' }}>⚙️</span> Admin
          </button>
        )}
      </div>
    </div>
  );
}