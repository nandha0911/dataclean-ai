import React from 'react';

const RetroProgress = ({ value = 0, label, color = 'green', animated = true }) => {
  const colorMap = {
    green: 'bg-retro-green shadow-[0_0_10px_#39FF14]',
    amber: 'bg-retro-amber shadow-[0_0_10px_#FFB000]',
    cyan: 'bg-retro-cyan shadow-[0_0_10px_#00FFFF]',
    magenta: 'bg-retro-magenta shadow-[0_0_10px_#FF00FF]',
    pink: 'bg-retro-pink shadow-[0_0_10px_#FF0099]',
  };

  const textMap = {
    green: 'text-retro-green',
    amber: 'text-retro-amber',
    cyan: 'text-retro-cyan',
    magenta: 'text-retro-magenta',
    pink: 'text-retro-pink',
  };

  return (
    <div className="w-full font-body">
      {label && (
        <div className="flex justify-between mb-1">
          <span className={textMap[color]}>{label}</span>
          <span className={textMap[color]}>{Math.round(value)}%</span>
        </div>
      )}
      <div className={`h-4 border-2 p-[2px] border-inherit flex ${textMap[color].replace('text-', 'border-')}`}>
        <div 
          className={`h-full ${colorMap[color]} ${animated ? 'transition-all duration-500 ease-out' : ''}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        ></div>
      </div>
    </div>
  );
};

export default RetroProgress;
