/**
 * NordicCard — Nordic Light clean card component
 */
import { motion } from 'framer-motion';

const ACCENT = {
  sage:    { bg: '#F2F5F3', text: '#7C9082' },
  dusty:   { bg: '#F2F4F5', text: '#7A8B99' },
  mustard: { bg: '#F9F6F2', text: '#D4A373' },
  terra:   { bg: '#F8F2F0', text: '#C88272' },
  // Mappings for older themes
  green:   { bg: '#F2F5F3', text: '#7C9082' },
  teal:    { bg: '#F2F4F5', text: '#7A8B99' },
  amber:   { bg: '#F9F6F2', text: '#D4A373' },
  red:     { bg: '#F8F2F0', text: '#C88272' },
  lime:    { bg: '#F9F6F2', text: '#D4A373' },
  blue:    { bg: '#F2F4F5', text: '#7A8B99' },
  purple:  { bg: '#F4F2F5', text: '#8B7A99' },
  cyan:    { bg: '#F2F5F3', text: '#7C9082' },
};

export default function NordicCard({
  title, subtitle, icon: Icon, color = 'sage',
  children, className = '', animate = true,
}) {
  const ac = ACCENT[color] || ACCENT.sage;
  const Wrap = animate ? motion.div : 'div';
  const wrapProps = animate
    ? { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, ease: 'easeOut' } }
    : {};

  return (
    <Wrap className={`nordic-card flex flex-col ${className}`} {...wrapProps}>
      {(title || Icon) && (
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          {Icon && (
            <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ background: ac.bg }}>
              <Icon size={16} style={{ color: ac.text }} />
            </div>
          )}
          <div>
            {title && <h3 className="font-bold text-gray-800 text-sm">{title}</h3>}
            {subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col p-6">{children}</div>
    </Wrap>
  );
}
