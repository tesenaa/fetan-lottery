import React from 'react';

export const NumberButton = React.memo(({ num, isMine, isOthers, disabled, onClick }) => {
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