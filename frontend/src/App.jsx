import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { GameScreen } from './Game';
import { HistoryScreen, WalletScreen, ProfileScreen, AdminPanel } from './WalletProfileAdmin';

const API_BASE_URL = "https://fetan-lottery-backend.onrender.com";
const SUPER_ADMIN_ID = "494653076";
const ASSISTANT_ADMIN_1 = "6557480753";
const ASSISTANT_ADMIN_2 = "6660106172";

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

  // ==========================================
  // INDEPENDENT STATES FOR STAKE 10, 20, 50, 100
  // ==========================================
  
  // STAKE 10
  const [selectedNumbers10, setSelectedNumbers10] = useState([]);
  const [allPickedNumbers10, setAllPickedNumbers10] = useState([]);
  const [playerCount10, setPlayerCount10] = useState(0);
  const [derash10, setDerash10] = useState(0);
  const [phase10, setPhase10] = useState('selecting');
  const [selectionTime10, setSelectionTime10] = useState(50);
  const [winningNumber10, setWinningNumber10] = useState('?');
  const [winnerInfo10, setWinnerInfo10] = useState(null);
  const [currentGameId10, setCurrentGameId10] = useState(generateRandomGameId());

  // STAKE 20
  const [selectedNumbers20, setSelectedNumbers20] = useState([]);
  const [allPickedNumbers20, setAllPickedNumbers20] = useState([]);
  const [playerCount20, setPlayerCount20] = useState(0);
  const [derash20, setDerash20] = useState(0);
  const [phase20, setPhase20] = useState('selecting');
  const [selectionTime20, setSelectionTime20] = useState(50);
  const [winningNumber20, setWinningNumber20] = useState('?');
  const [winnerInfo20, setWinnerInfo20] = useState(null);
  const [currentGameId20, setCurrentGameId20] = useState(generateRandomGameId());

  // STAKE 50
  const [selectedNumbers50, setSelectedNumbers50] = useState([]);
  const [allPickedNumbers50, setAllPickedNumbers50] = useState([]);
  const [playerCount50, setPlayerCount50] = useState(0);
  const [derash50, setDerash50] = useState(0);
  const [phase50, setPhase50] = useState('selecting');
  const [selectionTime50, setSelectionTime50] = useState(50);
  const [winningNumber50, setWinningNumber50] = useState('?');
  const [winnerInfo50, setWinnerInfo50] = useState(null);
  const [currentGameId50, setCurrentGameId50] = useState(generateRandomGameId());

  // STAKE 100
  const [selectedNumbers100, setSelectedNumbers100] = useState([]);
  const [allPickedNumbers100, setAllPickedNumbers100] = useState([]);
  const [playerCount100, setPlayerCount100] = useState(0);
  const [derash100, setDerash100] = useState(0);
  const [phase100, setPhase100] = useState('selecting');
  const [selectionTime100, setSelectionTime100] = useState(50);
  const [winningNumber100, setWinningNumber100] = useState('?');
  const [winnerInfo100, setWinnerInfo100] = useState(null);
  const [currentGameId100, setCurrentGameId100] = useState(generateRandomGameId());

  // MEMOIZED SETS
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

  // STATS UPDATERS FOR EACH STAKE
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
      alert("ስህተት ተፈጥሯል!");
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
      alert("ስህተት ተፈጥሯል!");
    }
  };

  const handleSetManualWinner = () => {
    if (!manualNumberInput) return alert("እባክዎ የማርሻል ቁጥር ይስጡ!");
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
      alert("ስህተት ተፈጥሯል!");
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
      alert("ስህተት ተፈጥሯል!");
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastText) return alert("እባክዎ መልክት ይጻፉ!");
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
      alert("ስህተት ተፈጥሯል!");
    }
  };

  // REFS FOR DERASH VALUES
  const derash10Ref = useRef(derash10);
  useEffect(() => { derash10Ref.current = derash10; }, [derash10]);
  const derash20Ref = useRef(derash20);
  useEffect(() => { derash20Ref.current = derash20; }, [derash20]);
  const derash50Ref = useRef(derash50);
  useEffect(() => { derash50Ref.current = derash50; }, [derash50]);
  const derash100Ref = useRef(derash100);
  useEffect(() => { derash100Ref.current = derash100; }, [derash100]);

  // SOCKET LISTENERS FOR ALL 4 STAKES
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
        setSelectionTime100(data.timeLeft !== undefined ? data.timeLeft : 50);
        setWinningNumber100(data.winningNumber || '?');
        if (data.gameId) setCurrentGameId100(data.gameId);
        else setCurrentGameId100(generateRandomGameId());
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
        setSelectionTime50(data.timeLeft !== undefined ? data.timeLeft : 50);
        setWinningNumber50(data.winningNumber || '?');
        if (data.gameId) setCurrentGameId50(data.gameId);
        else setCurrentGameId50(generateRandomGameId());
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
        else setCurrentGameId20(generateRandomGameId());
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
        else setCurrentGameId10(generateRandomGameId());
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
        setSelectionTime100(data.timeLeft);
        if (data.gamePhase) setPhase100(data.gamePhase);
        if (data.gameId) setCurrentGameId100(data.gameId);
      } else if (gameStake === 50) {
        setSelectionTime50(data.timeLeft);
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
          setDerash10(data.derash || 0);
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
          const winItem = data.selectedNumbers?.find(
            n => typeof n === 'object' && String(n.number) === String(winNum)
          );
          const winAmount = data.derash !== undefined ? data.derash : derash100Ref.current;
          if (winItem) {
            setWinnerInfo100({
              number: winNum,
              userName: winItem.userName || `user_${winItem.userId}`,
              derash: winAmount
            });
            if (String(winItem.userId) === String(userId)) {
              setMainWallet(prev => prev + winAmount);
              setGamesWon(prev => prev + 1);
            }
          } else {
            setWinnerInfo100({ number: winNum, userName: 'ማንም አልአሸነፈም', derash: 0 });
          }
          fetchUserData();
          resultTimeout100 = setTimeout(() => {
            setSelectedNumbers100([]);
            setAllPickedNumbers100([]);
            setWinningNumber100('?');
            setWinnerInfo100(null);
            setPhase100('selecting');
            setSelectionTime100(50);
            setPlayerCount100(0);
            setDerash100(0);
            setCurrentGameId100(data.nextGameId || generateRandomGameId());
          }, 4000);
        }, 1500);
      } else if (gameStake === 50) {
        setPhase50('spinning');
        setWinningNumber50('SPINNING');
        spinTimeout50 = setTimeout(() => {
          setPhase50('result');
          const winNum = data.winningNumber;
          setWinningNumber50(winNum);
          const winItem = data.selectedNumbers?.find(
            n => typeof n === 'object' && String(n.number) === String(winNum)
          );
          const winAmount = data.derash !== undefined ? data.derash : derash50Ref.current;
          if (winItem) {
            setWinnerInfo50({
              number: winNum,
              userName: winItem.userName || `user_${winItem.userId}`,
              derash: winAmount
            });
            if (String(winItem.userId) === String(userId)) {
              setMainWallet(prev => prev + winAmount);
              setGamesWon(prev => prev + 1);
            }
          } else {
            setWinnerInfo50({ number: winNum, userName: 'ማንም አልአሸነፈም', derash: 0 });
          }
          fetchUserData();
          resultTimeout50 = setTimeout(() => {
            setSelectedNumbers50([]);
            setAllPickedNumbers50([]);
            setWinningNumber50('?');
            setWinnerInfo50(null);
            setPhase50('selecting');
            setSelectionTime50(50);
            setPlayerCount50(0);
            setDerash50(0);
            setCurrentGameId50(data.nextGameId || generateRandomGameId());
          }, 4000);
        }, 1500);
      } else if (gameStake === 20) {
        setPhase20('spinning');
        setWinningNumber20('SPINNING');
        spinTimeout20 = setTimeout(() => {
          setPhase20('result');
          const winNum = data.winningNumber;
          setWinningNumber20(winNum);
          const winItem = data.selectedNumbers?.find(
            n => typeof n === 'object' && String(n.number) === String(winNum)
          );
          const winAmount = data.derash !== undefined ? data.derash : derash20Ref.current;
          if (winItem) {
            setWinnerInfo20({
              number: winNum,
              userName: winItem.userName || `user_${winItem.userId}`,
              derash: winAmount
            });
            if (String(winItem.userId) === String(userId)) {
              setMainWallet(prev => prev + winAmount);
              setGamesWon(prev => prev + 1);
            }
          } else {
            setWinnerInfo20({ number: winNum, userName: 'ማንም አልአሸነፈም', derash: 0 });
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
          const winItem = data.selectedNumbers?.find(
            n => typeof n === 'object' && String(n.number) === String(winNum)
          );
          const winAmount = data.derash !== undefined ? data.derash : derash10Ref.current;
          if (winItem) {
            setWinnerInfo10({
              number: winNum,
              userName: winItem.userName || `user_${winItem.userId}`,
              derash: winAmount
            });
            if (String(winItem.userId) === String(userId)) {
              setMainWallet(prev => prev + winAmount);
              setGamesWon(prev => prev + 1);
            }
          } else {
            setWinnerInfo10({ number: winNum, userName: 'ማንም አልአሸነፈም', derash: 0 });
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
        setSelectionTime100(data?.timeLeft || 50);
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
        setSelectionTime50(data?.timeLeft || 50);
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
    const isStake100 = stake === 100;
    const isStake50 = stake === 50;
    const isStake20 = stake === 20;

    const currentPhase = isStake100 ? phase100 : isStake50 ? phase50 : isStake20 ? phase20 : phase10;
    const mySet = isStake100 ? myPickedSet100 : isStake50 ? myPickedSet50 : isStake20 ? myPickedSet20 : myPickedSet10;

    if (currentPhase !== 'selecting') return;
    if (isBanned) return alert("አካውንትዎ በዲሲፕሊን ምክንያት ቁጥር መምረጥ አይችሉም!");

    const totalAvailableBalance = Number(mainWallet) + Number(playWallet);

    if (mySet.has(num)) {
      if (isStake100) {
        setSelectedNumbers100(prev => prev.filter(n => n !== num));
        setAllPickedNumbers100(prev => prev.filter(n => n !== num));
      } else if (isStake50) {
        setSelectedNumbers50(prev => prev.filter(n => n !== num));
        setAllPickedNumbers50(prev => prev.filter(n => n !== num));
      } else if (isStake20) {
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
        const msg = "⚠️ በቂ ሂሳብ የለዎትም! እባክዎ አካውንትዎ ላይ ገንዘብ ይሙሉ";
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

      if (isStake100) {
        setSelectedNumbers100(prev => [...prev, num]);
        setAllPickedNumbers100(prev => [...prev, num]);
      } else if (isStake50) {
        setSelectedNumbers50(prev => [...prev, num]);
        setAllPickedNumbers50(prev => [...prev, num]);
      } else if (isStake20) {
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
    if (!pastedSMS.trim()) return alert("እባክዎ የቴሌብር SMS መልክቶችዎ ድር አድር አድርጎ ይስጡ!");
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
      const msg = "⚠️ በ ዋና ኪስ (Main Wallet) ውስጥ በቂ ገንዘብ የለዎትም!";
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
        @keyframes arrowSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin-arrow-container {
          animation: arrowSpin 0.3s linear infinite;
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #312e81; border-radius: 4px; }
      `}} />

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
        {currentTab === 'game' && (
          <GameScreen
            currentScreen={currentScreen}
            setCurrentScreen={setCurrentScreen}
            isBanned={isBanned}
            activeCount={activeCount}
            registeredCount={registeredCount}
            
            // STAKE 10 PROPS
            currentGameId10={currentGameId10}
            playerCount10={playerCount10}
            derash10={derash10}
            phase10={phase10}
            selectionTime10={selectionTime10}
            winningNumber10={winningNumber10}
            myPickedSet10={myPickedSet10}
            allPickedSet10={allPickedSet10}
            selectedNumbers10={selectedNumbers10}
            winnerInfo10={winnerInfo10}

            // STAKE 20 PROPS
            currentGameId20={currentGameId20}
            playerCount20={playerCount20}
            derash20={derash20}
            phase20={phase20}
            selectionTime20={selectionTime20}
            winningNumber20={winningNumber20}
            myPickedSet20={myPickedSet20}
            allPickedSet20={allPickedSet20}
            selectedNumbers20={selectedNumbers20}
            winnerInfo20={winnerInfo20}

            // STAKE 50 PROPS
            currentGameId50={currentGameId50}
            playerCount50={playerCount50}
            derash50={derash50}
            phase50={phase50}
            selectionTime50={selectionTime50}
            winningNumber50={winningNumber50}
            myPickedSet50={myPickedSet50}
            allPickedSet50={allPickedSet50}
            selectedNumbers50={selectedNumbers50}
            winnerInfo50={winnerInfo50}

            // STAKE 100 PROPS
            currentGameId100={currentGameId100}
            playerCount100={playerCount100}
            derash100={derash100}
            phase100={phase100}
            selectionTime100={selectionTime100}
            winningNumber100={winningNumber100}
            myPickedSet100={myPickedSet100}
            allPickedSet100={allPickedSet100}
            selectedNumbers100={selectedNumbers100}
            winnerInfo100={winnerInfo100}

            // GENERAL PROPS
            mainWallet={mainWallet}
            playWallet={playWallet}
            visibleNumbers={visibleNumbers}
            toggleNumber={toggleNumber}
            fetchUserData={fetchUserData}
          />
        )}

        {currentTab === 'history' && (
          <HistoryScreen
            totalGames={totalGames}
            gameHistory={gameHistory}
          />
        )}

        {currentTab === 'wallet' && (
          <WalletScreen
            fetchUserData={fetchUserData}
            userPhone={userPhone}
            walletTab={walletTab}
            setWalletTab={setWalletTab}
            mainWallet={mainWallet}
            playWallet={playWallet}
            depAmount={depAmount}
            setDepAmount={setDepAmount}
            pastedSMS={pastedSMS}
            setPastedSMS={setPastedSMS}
            isSubmittingDep={isSubmittingDep}
            handleDeposit={handleDeposit}
            withAmount={withAmount}
            setWithAmount={setWithAmount}
            handleWithdraw={handleWithdraw}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileScreen
            userPhoto={userPhoto}
            userName={userName}
            userInitial={userInitial}
            tgUser={tgUser}
            mainWallet={mainWallet}
            playWallet={playWallet}
            gamesWon={gamesWon}
            totalInvite={totalInvite}
            copyReferralLink={copyReferralLink}
            copiedLink={copiedLink}
          />
        )}

        {isAdmin && currentTab === 'admin' && (
          <AdminPanel
            isSuperAdmin={isSuperAdmin}
            fetchAdminData={fetchAdminData}
            adminTab={adminTab}
            setAdminTab={setAdminTab}
            txTypeView={txTypeView}
            setTxTypeView={setTxTypeView}
            txFilter={txFilter}
            setTxFilter={setTxFilter}
            activeTxList={activeTxList}
            filteredTransactions={filteredTransactions}
            handleProcessTx={handleProcessTx}
            financialStats={financialStats}
            adminSearch={adminSearch}
            setAdminSearch={setAdminSearch}
            filteredAdminUsers={filteredAdminUsers}
            editingUser={editingUser}
            setEditingUser={setEditingUser}
            editMain={editMain}
            setEditMain={setEditMain}
            editPlay={editPlay}
            setEditPlay={setEditPlay}
            handleUpdateUserBalance={handleUpdateUserBalance}
            handleToggleBan={handleToggleBan}
            manualNumberInput={manualNumberInput}
            setManualNumberInput={setManualNumberInput}
            handleSetManualWinner={handleSetManualWinner}
            sysSettings={sysSettings}
            setSysSettings={setSysSettings}
            handleUpdateSettings={handleUpdateSettings}
            broadcastText={broadcastText}
            setBroadcastText={setBroadcastText}
            handleSendBroadcast={handleSendBroadcast}
          />
        )}
      </div>

      {/* BOTTOM NAVIGATION BAR */}
      <div style={{ width: '100%', backgroundColor: '#0e0e24', borderTop: '1px solid #1f1f3d', display: 'flex', justifyContent: 'space-around', padding: '8px 0', flexShrink: 0 }}>
        <button onClick={() => { setCurrentTab('game'); setCurrentScreen('home'); }} style={{ background: 'none', border: 'none', color: currentTab === 'game' ? '#f59e0b' : '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
          <span style={{ fontSize: '18px' }}>🎮</span>
          <span>Game</span>
        </button>
        <button onClick={() => setCurrentTab('history')} style={{ background: 'none', border: 'none', color: currentTab === 'history' ? '#f59e0b' : '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
          <span style={{ fontSize: '18px' }}>📜</span>
          <span>History</span>
        </button>
        <button onClick={() => setCurrentTab('wallet')} style={{ background: 'none', border: 'none', color: currentTab === 'wallet' ? '#f59e0b' : '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
          <span style={{ fontSize: '18px' }}>💳</span>
          <span>Wallet</span>
        </button>
        <button onClick={() => { setCurrentTab('profile'); }} style={{ background: 'none', border: 'none', color: currentTab === 'profile' ? '#f59e0b' : '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
          <span style={{ fontSize: '18px' }}>👤</span>
          <span>Profile</span>
        </button>
        {isAdmin && (
          <button onClick={() => { setCurrentTab('admin'); }} style={{ background: 'none', border: 'none', color: currentTab === 'admin' ? '#f59e0b' : '#9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>
            <span style={{ fontSize: '18px' }}>⚙️</span>
            <span>Admin</span>
          </button>
        )}
      </div>
    </div>
  );
}