import React from 'react';

export default function Wallet({
  fetchUserData,
  userPhone,
  walletTab, setWalletTab,
  mainWallet, playWallet,
  depAmount, setDepAmount,
  pastedSMS, setPastedSMS,
  isSubmittingDep, handleDeposit,
  withAmount, setWithAmount,
  handleWithdraw
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
              1. የሚለውን የብር መጠን ይምረጡ ወይም ያስገቡ<br />
              2. የቴሌብር SMS መልእክቱን ሙሉ በሙሉ ኮፒ በማድረግ ከዚህ በታች ባለው ሳጥን ውስጥ እንድትለጥፉ<br />
            </div>
            <label style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>የብር መጠን (ETB):</label>
            <input type="number" placeholder="ለአርአያ 100" value={depAmount} onChange={(e) => setDepAmount(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
            <label style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>የቴሌብር SMS መልእክት (Copy Paste):</label>
            <textarea rows="4" placeholder="የደረሰዎትን ሙሉ የቴሌብር SMS መልእክት እዚህ ጋር ድር አድርገው ዎይ (Paste) ይወፍሩ..." value={pastedSMS} onChange={(e) => setPastedSMS(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box', fontSize: '12px' }} />
            <button onClick={handleDeposit} disabled={isSubmittingDep} style={{ width: '100%', padding: '12px', backgroundColor: isSubmittingDep ? '#6b7280' : '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isSubmittingDep ? 'not-allowed' : 'pointer' }}>
              {isSubmittingDep ? 'እየተላከ ነው...' : 'የተረጋገጠ ጥያቄ ላክ (Submit Deposit)'}
            </button>
          </div>

          <div style={{ backgroundColor: '#181830', padding: '16px', borderRadius: '12px', border: '1px solid #2a2a4a' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>📤 Withdraw (ገንዘብ ማውጣት ጥያቄ)</h4>
            <input type="number" placeholder="መጠን (ETB)" value={withAmount} onChange={(e) => setWithAmount(e.target.value)} style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#fff', boxSizing: 'border-box' }} />
            <button onClick={handleWithdraw} style={{ width: '100%', padding: '12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              የወጣ ጥያቄ ላክ (Submit Withdraw)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}