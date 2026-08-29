import React from 'react';

export default function History({ totalGames, gameHistory }) {
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
            እስካሁን ምንም ጫወታት ሪኮርድ አልተመዘገበም።
          </div>
        )}
      </div>
    </div>
  );
}