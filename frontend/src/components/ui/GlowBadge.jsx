import React from 'react';

const GlowBadge = ({ text, color = 'green', size = 'sm' }) => {
  const colorMap = {
    green: 'border-retro-green text-retro-green shadow-[0_0_5px_#39FF14,inset_0_0_2px_#39FF14]',
    amber: 'border-retro-amber text-retro-amber shadow-[0_0_5px_#FFB000,inset_0_0_2px_#FFB000]',
    cyan: 'border-retro-cyan text-retro-cyan shadow-[0_0_5px_#00FFFF,inset_0_0_2px_#00FFFF]',
    magenta: 'border-retro-magenta text-retro-magenta shadow-[0_0_5px_#FF00FF,inset_0_0_2px_#FF00FF]',
    pink: 'border-retro-pink text-retro-pink shadow-[0_0_5px_#FF0099,inset_0_0_2px_#FF0099]',
  };

  const sizeMap = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span className={`inline-block border uppercase font-mono ${colorMap[color]} ${sizeMap[size]}`}>
      {text}
    </span>
  );
};

export default GlowBadge;
