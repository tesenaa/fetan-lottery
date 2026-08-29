import React from 'react';

export default function Profile({
  userPhoto, userName, userInitial, tgUser,
  mainWallet, playWallet, gamesWon, totalInvite,
  copiedLink, copyReferralLink
}) {
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
        <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginTop: 0, marginBottom: '8px', color: '#f59e0b' }}> 🎁 ጓደኞችን ይጋብዙ (Invite Friends) </h3>
        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px', lineHeight: '1.4' }}>
          የእርስዎን የመጋበዣ ሊንክ ለጓደኞችዎ በማላክ በአጠቃላይ ግብይት ተጨማሪ በሸልሻ ያገኛሉ!
        </p>
        <button onClick={copyReferralLink} style={{ width: '100%', padding: '12px', backgroundColor: copiedLink ? '#10b981' : '#0284c7', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
          {copiedLink ? '✓ የመጋበዣ ሊንክ ተቀድቷል (Copied)' : '🔗 የመጋበዣ ሊንክ ቅዳ (Copy Invite Link)'}
        </button>
      </div>
    </div>
  );
}