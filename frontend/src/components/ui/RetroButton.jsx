import React from 'react';
import { motion } from 'framer-motion';

const RetroButton = ({ onClick, variant = 'primary', children, icon: Icon, loading = false, disabled = false, className = '' }) => {
  const baseStyles = "px-4 py-2 font-body text-xl uppercase border-2 transition-all flex items-center justify-center gap-2 pixel-corners";
  
  const variants = {
    primary: "border-retro-green text-retro-green hover:bg-retro-green hover:text-black hover:shadow-[0_0_15px_#39FF14]",
    danger: "border-retro-pink text-retro-pink hover:bg-retro-pink hover:text-black hover:shadow-[0_0_15px_#FF0099]",
    warning: "border-retro-amber text-retro-amber hover:bg-retro-amber hover:text-black hover:shadow-[0_0_15px_#FFB000]",
    ghost: "border-transparent text-retro-cyan hover:border-retro-cyan hover:shadow-[0_0_10px_#00FFFF] bg-transparent",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {loading ? (
        <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
      ) : (
        Icon && <Icon size={18} />
      )}
      {children}
    </motion.button>
  );
};

export default RetroButton;
