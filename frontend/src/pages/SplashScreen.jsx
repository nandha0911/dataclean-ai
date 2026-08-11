/**
 * Nordic Light Splash Screen
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hexagon } from 'lucide-react';

export default function SplashScreen() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const interval = 20;
    const steps = duration / interval;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setProgress(Math.min((step / steps) * 100, 100));
      if (step >= steps) {
        clearInterval(timer);
        setTimeout(() => navigate('/dashboard'), 400);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-[#F7F6F3] flex flex-col items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col items-center"
      >
        <div className="w-20 h-20 bg-white rounded-3xl shadow-soft-lg flex items-center justify-center mb-8 text-[#7C9082]">
          <Hexagon size={40} className="fill-[#F2F5F3]" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
          DataClean AI
        </h1>
        <p className="text-gray-500 font-medium tracking-wide">
          Workspace Initialization
        </p>

        <div className="mt-12 w-64 h-1 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-[#7C9082] rounded-full"
            style={{ width: `${progress}%` }}
            initial={{ width: '0%' }}
          />
        </div>
      </motion.div>
    </div>
  );
}
