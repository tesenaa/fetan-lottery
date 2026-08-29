import React from 'react';

export function HistoryScreen({ totalGames, gameHistory }) {
  return (
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
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px', fontSize: '13px' }}>
            እስካሁን ምንም ጨዋታዎች አልተመዘገቡም።
          </div>
        )}
      </div>
    </div>
  );
}

export function WalletScreen({
  fetchUserData, userPhone, walletTab, setWalletTab, mainWallet, playWallet,
  depAmount, setDepAmount, pastedSMS, setPastedSMS, isSubmittingDep, handleDeposit,
  withAmount, setWithAmount, handleWithdraw
}) {
  return (
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
        <button onClick={() => setWalletTab('balance')} style={{ flex: 1, padding: '10px 0', borderRadius: '8px', border: 'none', backgroundColor: walletTab === 'balance' ? '#2a2a4a' : 'transparent', color: walletTab === 'balance' ? '#ffffff' : '#9ca3af', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>
          Balance
        </button>
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
              1. የሚፈለገውን የብር መጠን ይምረጡ ወይም ያስገቡ<br />
              2. የቴሌብር SMS መልእክቱን ሙሉ በሙሉ ኮፒ በማድረግ ከዚህ በታች ባለው ሳጥን ውስጥ ይለጥፉ<br />
            </div>
            <label style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>የብር መጠን (ETB):</label>
            <input type="number" placeholder="ለአማካይ 100" value={depAmount} onChange={(e) => setDepAmount(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
            <label style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>የቴሌብር SMS መልእክት (Copy Paste):</label>
            <textarea rows="4" placeholder="የደረሰዎትን ሙሉ የቴሌብር SMS መልእክት እዚህ ጋር ድር አድርገው (Paste) ይወፍሩ..." value={pastedSMS} onChange={(e) => setPastedSMS(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box', fontSize: '12px' }} />
            <button onClick={handleDeposit} disabled={isSubmittingDep} style={{ width: '100%', padding: '12px', backgroundColor: isSubmittingDep ? '#6b7280' : '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isSubmittingDep ? 'not-allowed' : 'pointer' }}>
              {isSubmittingDep ? 'እየተላከ ነው...' : 'የተረጋገጠ ማመልከቻ ላክ (Submit Deposit)'}
            </button>
          </div>
          <div style={{ backgroundColor: '#181830', padding: '16px', borderRadius: '12px', border: '1px solid #2a2a4a' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>📤 Withdraw (ငንዘብ ማውጣት ማመልከቻ)</h4>
            <input type="number" placeholder="መጠን (ETB)" value={withAmount} onChange={(e) => setWithAmount(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
            <button onClick={handleWithdraw} style={{ width: '100%', padding: '12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              የወጣ ማመልከቻ ላክ (Submit Withdraw)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProfileScreen({ userPhoto, userName, userInitial, tgUser, mainWallet, playWallet, gamesWon, totalInvite, copyReferralLink, copiedLink }) {
  return (
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
        <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginTop: 0, marginBottom: '8px', color: '#f59e0b' }}> 🎁 ጓደኛሞችዎ ይጋብዙ (Invite Friends) </h3>
        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px', lineHeight: '1.4' }}> የእርስዎን የመጋበዣ ሊንክ ለአጓደኛሞችዎ በመላክ በእያንዳንዱ ግብይት ተጨማሪ በድዎ ያግኙ! </p>
        <button onClick={copyReferralLink} style={{ width: '100%', padding: '12px', backgroundColor: copiedLink ? '#10b981' : '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
          {copiedLink ? '✓ የመጋበዣ ሊንክ ተቀድቷል (Copied)' : '🔗 የመጋበዣ ሊንክ ቅዳ (Copy Invite Link)'}
        </button>
      </div>
    </div>
  );
}

export function AdminPanel({
  isSuperAdmin, fetchAdminData, adminTab, setAdminTab,
  txTypeView, setTxTypeView, txFilter, setTxFilter, activeTxList,
  filteredTransactions, handleProcessTx, financialStats, adminSearch,
  setAdminSearch, filteredAdminUsers, editingUser, setEditingUser,
  editMain, setEditMain, editPlay, setEditPlay, handleUpdateUserBalance,
  handleToggleBan, manualNumberInput, setManualNumberInput, handleSetManualWinner,
  sysSettings, setSysSettings, handleUpdateSettings, broadcastText, setBroadcastText,
  handleSendBroadcast
}) {
  return (
    <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}> ⚙️ Admin Panel ({isSuperAdmin ? 'Super Admin' : 'Assistant Admin'}) </h1>
        <button onClick={fetchAdminData} style={{ backgroundColor: '#1e1b4b', color: '#38bdf8', border: '1px solid #312e81', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}>🔄 Refresh</button>
      </div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button onClick={() => setAdminTab('requests')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: adminTab === 'requests' ? '#f59e0b' : '#1e1b4b', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>📂 Transactions</button>
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
            <button onClick={() => setTxTypeView('deposit')} style={{ flex: 1, padding: '8px', fontSize: '11px', borderRadius: '6px', border: 'none', backgroundColor: txTypeView === 'deposit' ? '#0284c7' : '#1e1b4b', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}> 📥 የተከሉ ማመልከቻዎች (Deposit) </button>
            <button onClick={() => setTxTypeView('withdrawal')} style={{ flex: 1, padding: '8px', fontSize: '11px', borderRadius: '6px', border: 'none', backgroundColor: txTypeView === 'withdrawal' ? '#0284c7' : '#1e1b4b', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}> 📤 የወጣ ማመልከቻዎች (Withdrawal) </button>
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
                  {tx.processedBy && <div style={{ fontSize: '10px', color: '#a7f3d0', marginTop: '2px' }}>አስተካክሎ: {tx.processedBy}</div>}
                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>±ይ Time: {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : 'N/A'}</div>
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
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px', fontSize: '13px' }}>
                ሐሎል ማመልከቻዎች አልተገኙምልዕ.
              </div>
            )}
          </div>
        </div>
      )}

      {adminTab === 'reports' && isSuperAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#38bdf8' }}>📊 የሰሙሉ አጠቃላይ ገቢ እና ወጪ ሪፖርት</div>
          {financialStats ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ backgroundColor: '#181830', padding: '12px', borderRadius: '8px', border: '1px solid #2a2a4a' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>Total Deposits</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#22c55e' }}>{financialStats.totalDeposits || 0} ETB</div>
              </div>
              <div style={{ backgroundColor: '#181830', padding: '12px', borderRadius: '8px', border: '1px solid #2a2a4a' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>Total Withdrawals</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ef4444' }}>{financialStats.totalWithdrawals || 0} ETB</div>
              </div>
              <div style={{ backgroundColor: '#181830', padding: '12px', borderRadius: '8px', border: '1px solid #2a2a4a' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>User Main Wallets</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f59e0b' }}>{financialStats.totalMainWallet || 0} ETB</div>
              </div>
              <div style={{ backgroundColor: '#181830', padding: '12px', borderRadius: '8px', border: '1px solid #2a2a4a' }}>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>User Play Wallets</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#38bdf8' }}>{financialStats.totalPlayWallet || 0} ETB</div>
              </div>
            </div>
          ) : (
            <div style={{ color: '#6b7280', fontSize: '12px' }}>ስታቲስቲክስ እየተጫነ ነው...</div>
          )}
        </div>
      )}

      {adminTab === 'users' && isSuperAdmin && (
        <div>
          <input type="text" placeholder="🔍 በ ID, ስም ወይም ስልክ ፈልግ..." value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredAdminUsers.map(u => (
              <div key={u.userId} style={{ backgroundColor: '#181830', borderRadius: '8px', padding: '10px', border: '1px solid #2a2a4a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{u.firstName || 'User'} ({u.userId})</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>Main: {u.mainWallet} ETB | Play: {u.playWallet} ETB</div>
                  <div style={{ fontSize: '11px', color: '#38bdf8' }}>Phone: {u.phone || 'N/A'}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => { setEditingUser(u); setEditMain(u.mainWallet); setEditPlay(u.playWallet); }} style={{ padding: '6px 10px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}> Edit </button>
                  <button onClick={() => handleToggleBan(u.userId, u.isBanned)} style={{ padding: '6px 10px', backgroundColor: u.isBanned ? '#22c55e' : '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}> {u.isBanned ? 'Unban' : 'Ban'} </button>
                </div>
              </div>
            ))}
          </div>
          {editingUser && (
            <div style={{ marginTop: '16px', backgroundColor: '#1b1b38', padding: '12px', borderRadius: '8px', border: '1px solid #f59e0b' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#f59e0b' }}>Edit Balance for {editingUser.firstName}</div>
              <label style={{ fontSize: '10px', color: '#9ca3af' }}>Main Wallet:</label>
              <input type="number" value={editMain} onChange={(e) => setEditMain(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '8px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '4px' }} />
              <label style={{ fontSize: '10px', color: '#9ca3af' }}>Play Wallet:</label>
              <input type="number" value={editPlay} onChange={(e) => setEditPlay(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '8px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '4px' }} />
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={handleUpdateUserBalance} style={{ flex: 1, padding: '8px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
                <button onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '8px', backgroundColor: '#6b7280', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {adminTab === 'game_control' && isSuperAdmin && (
        <div style={{ backgroundColor: '#181830', padding: '14px', borderRadius: '8px', border: '1px solid #2a2a4a' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>🎲 ማዕከላዊ የማርሻል ቁጥር ማስታወቂያ</div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '10px' }}>ለሚቀጥለው ሉሪ ጨዋታ አሸናፊ ቁጥር በግድ (Manual) እንዲወጣ ማድረግ ካፈለጉ ከዚህ በታች ያስመዝግሉ።</div>
          <input type="number" placeholder="ቁጥር (ከ 1 እስከ 1000)" value={manualNumberInput} onChange={(e) => setManualNumberInput(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px' }} />
          <button onClick={handleSetManualWinner} style={{ width: '100%', padding: '10px', backgroundColor: '#f59e0b', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}> ጻይወሰን የማርሻል ቁጥር (Set Manual Winner) </button>
        </div>
      )}

      {adminTab === 'settings' && isSuperAdmin && (
        <div style={{ backgroundColor: '#181830', padding: '14px', borderRadius: '8px', border: '1px solid #2a2a4a' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '10px' }}>⚙️ የሰሙሉ ቀንበሮች</div>
          <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Ticket Price (ETB):</label>
          <input type="number" value={sysSettings.ticketPrice} onChange={(e) => setSysSettings({ ...sysSettings, ticketPrice: Number(e.target.value) })} style={{ width: '100%', padding: '8px', marginBottom: '10px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '4px' }} />
          <label style={{ fontSize: '11px', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Winner Percentage (%):</label>
          <input type="number" value={sysSettings.winnerPercentage} onChange={(e) => setSysSettings({ ...sysSettings, winnerPercentage: Number(e.target.value) })} style={{ width: '100%', padding: '8px', marginBottom: '10px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '4px' }} />
          <button onClick={() => handleUpdateSettings()} style={{ width: '100%', padding: '10px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}> ቀንበሮችን Amed (Save Settings) </button>
        </div>
      )}

      {adminTab === 'broadcast' && isSuperAdmin && (
        <div style={{ backgroundColor: '#181830', padding: '14px', borderRadius: '8px', border: '1px solid #2a2a4a' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>📢 ለሁሉም ተጠቃሚዎች መልክት መላክ (Broadcast)</div>
          <textarea rows="4" placeholder="የማስታወቂያ መልክቱን እዚህ ይጻፉ..." value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px', fontSize: '12px' }} />
          <button onClick={handleSendBroadcast} style={{ width: '100%', padding: '10px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}> መልክት ላክ (Send Broadcast) </button>
        </div>
      )}
    </div>
  );
}