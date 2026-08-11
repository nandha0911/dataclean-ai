import React from 'react';

const RetroInput = ({ type = 'text', placeholder, value, onChange, label, error, className = '' }) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-retro-green font-heading text-xs uppercase">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`bg-black border-2 border-retro-green text-retro-green p-2 font-mono outline-none focus:shadow-[0_0_10px_#39FF14] placeholder:text-retro-green/40 transition-shadow ${error ? 'border-retro-pink focus:shadow-[0_0_10px_#FF0099]' : ''}`}
      />
      {error && <span className="text-retro-pink text-sm font-mono mt-1">{error}</span>}
    </div>
  );
};

export default RetroInput;
