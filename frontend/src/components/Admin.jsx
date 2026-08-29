import React from 'react';

export default function Admin({
  isSuperAdmin,
  fetchAdminData,
  adminTab, setAdminTab,
  txTypeView, setTxTypeView,
  txFilter, setTxFilter,
  activeTxList, filteredTransactions,
  handleProcessTx,
  financialStats,
  adminSearch, setAdminSearch,
  filteredAdminUsers,
  editingUser, setEditingUser,
  editMain, setEditMain,
  editPlay, setEditPlay,
  handleUpdateUserBalance,
  handleToggleBan,
  manualNumberInput, setManualNumberInput,
  handleSetManualWinner,
  sysSettings, setSysSettings,
  handleUpdateSettings,
  broadcastText, setBroadcastText,
  handleSendBroadcast
}) {
  return (
    <div style={{ flex: 1, padding: '20px 16px', display: 'flex', flexDirection: 'column', overflowY: 'auto', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>
          ⚙️ Admin Panel ({isSuperAdmin ? 'Super Admin' : 'Assistant Admin'})
        </h1>
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
            <button onClick={() => setTxTypeView('deposit')} style={{ flex: 1, padding: '8px', fontSize: '11px', borderRadius: '6px', border: 'none', backgroundColor: txTypeView === 'deposit' ? '#0284c7' : '#1e1b4b', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
              📥 የተሰቀሉ ጥያቄዎች (Deposit)
            </button>
            <button onClick={() => setTxTypeView('withdrawal')} style={{ flex: 1, padding: '8px', fontSize: '11px', borderRadius: '6px', border: 'none', backgroundColor: txTypeView === 'withdrawal' ? '#0284c7' : '#1e1b4b', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
              📤 የወጣ ጥያቄዎች (Withdrawal)
            </button>
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
                  {tx.pastedText && <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', backgroundColor: '#0f172a', padding: '6px', borderRadius: '4px', wordBreak: 'break-all' }}>{tx.pastedText}</div>}
                  
                  {tx.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <button onClick={() => handleProcessTx(tx._id, 'APPROVE', txTypeView === 'deposit' ? 'deposit' : 'withdrawal')} style={{ flex: 1, padding: '8px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>
                        ✓ Approve
                      </button>
                      <button onClick={() => handleProcessTx(tx._id, 'REJECT', txTypeView === 'deposit' ? 'deposit' : 'withdrawal')} style={{ flex: 1, padding: '8px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px', fontSize: '13px' }}>
                ምንም ጥያቄዎች አልተገኙም።
              </div>
            )}
          </div>
        </div>
      )}

      {isSuperAdmin && adminTab === 'reports' && financialStats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ backgroundColor: '#181830', padding: '12px', borderRadius: '8px', border: '1px solid #2a2a4a', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>Total Users</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#38bdf8' }}>{financialStats.totalUsers}</div>
            </div>
            <div style={{ backgroundColor: '#181830', padding: '12px', borderRadius: '8px', border: '1px solid #2a2a4a', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>Total Deposit</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e' }}>{financialStats.totalDeposit} ETB</div>
            </div>
            <div style={{ backgroundColor: '#181830', padding: '12px', borderRadius: '8px', border: '1px solid #2a2a4a', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>Total Withdrawal</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>{financialStats.totalWithdrawal} ETB</div>
            </div>
            <div style={{ backgroundColor: '#181830', padding: '12px', borderRadius: '8px', border: '1px solid #2a2a4a', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>Platform Balance</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>{financialStats.platformBalance} ETB</div>
            </div>
          </div>
        </div>
      )}

      {isSuperAdmin && adminTab === 'users' && (
        <div>
          <input type="text" placeholder="Search by ID, Name or Phone..." value={adminSearch} onChange={(e) => setAdminSearch(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredAdminUsers.map(u => (
              <div key={u.userId} style={{ backgroundColor: '#181830', padding: '10px', borderRadius: '8px', border: '1px solid #2a2a4a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{u.firstName || 'User'} ({u.userId})</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>Main: {u.mainWallet} | Play: {u.playWallet} | {u.phone || 'No Phone'}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => handleToggleBan(u.userId, u.isBanned)} style={{ padding: '6px 10px', backgroundColor: u.isBanned ? '#22c55e' : '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {u.isBanned ? 'Unban' : 'Ban'}
                  </button>
                  <button onClick={() => { setEditingUser(u); setEditMain(u.mainWallet); setEditPlay(u.playWallet); }} style={{ padding: '6px 10px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          {editingUser && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#15152a', borderRadius: '8px', border: '1px solid #38bdf8' }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Edit Balance for {editingUser.firstName}</div>
              <label style={{ fontSize: '10px', color: '#38bdf8' }}>Main Wallet:</label>
              <input type="number" value={editMain} onChange={(e) => setEditMain(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155' }} />
              <label style={{ fontSize: '10px', color: '#38bdf8' }}>Play Wallet:</label>
              <input type="number" value={editPlay} onChange={(e) => setEditPlay(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleUpdateUserBalance} style={{ flex: 1, padding: '8px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Save</button>
                <button onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '8px', backgroundColor: '#6b7280', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {isSuperAdmin && adminTab === 'game_control' && (
        <div style={{ backgroundColor: '#181830', padding: '16px', borderRadius: '8px', border: '1px solid #2a2a4a' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#f59e0b' }}>Manual Draw Number</h3>
          <input type="number" placeholder="Enter winning number (1-1000)" value={manualNumberInput} onChange={(e) => setManualNumberInput(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
          <button onClick={handleSetManualWinner} style={{ width: '100%', padding: '10px', backgroundColor: '#f59e0b', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Set Manual Winner</button>
        </div>
      )}

      {isSuperAdmin && adminTab === 'settings' && (
        <div style={{ backgroundColor: '#181830', padding: '16px', borderRadius: '8px', border: '1px solid #2a2a4a', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', color: '#f59e0b' }}>System Settings</h3>
          <label style={{ fontSize: '11px', color: '#38bdf8' }}>Ticket Price:</label>
          <input type="number" value={sysSettings.ticketPrice} onChange={(e) => setSysSettings({...sysSettings, ticketPrice: Number(e.target.value)})} style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155' }} />
          <label style={{ fontSize: '11px', color: '#38bdf8' }}>Winner Percentage (%):</label>
          <input type="number" value={sysSettings.winnerPercentage} onChange={(e) => setSysSettings({...sysSettings, winnerPercentage: Number(e.target.value)})} style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155' }} />
          <button onClick={() => handleUpdateSettings()} style={{ width: '100%', padding: '10px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '6px' }}>Save Settings</button>
        </div>
      )}

      {isSuperAdmin && adminTab === 'broadcast' && (
        <div style={{ backgroundColor: '#181830', padding: '16px', borderRadius: '8px', border: '1px solid #2a2a4a' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#f59e0b' }}>Broadcast Message</h3>
          <textarea rows="4" placeholder="Write message to all users..." value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
          <button onClick={handleSendBroadcast} style={{ width: '100%', padding: '10px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Send Broadcast</button>
        </div>
      )}
    </div>
  );
}