import React, { useState, useEffect } from 'react';

const TerminalText = ({ text = '', speed = 50, className = '', onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let i = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, speed);
    
    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      <span className="animate-blink inline-block w-2 h-[1em] bg-retro-green ml-1 align-middle"></span>
    </span>
  );
};

export default TerminalText;
