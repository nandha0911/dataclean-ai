import React from 'react';

const BlinkingCursor = ({ color = 'bg-retro-green', size = 'w-2 h-5' }) => {
  return (
    <span className={`inline-block animate-blink align-middle ${color} ${size} ml-1`}></span>
  );
};

export default BlinkingCursor;
