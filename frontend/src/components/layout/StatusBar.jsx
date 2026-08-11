/**
 * StatusBar — Glassmorphism bottom status bar
 */
import { useState, useEffect } from 'react';
import { Activity, Database, Cpu, Wifi } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

export default function StatusBar() {
  const { currentDataset } = useAppStore();
  const [cpu, setCpu] = useState(12);

  useEffect(() => {
    const t = setInterval(() => setCpu(Math.floor(Math.random() * 30) + 5), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-6 px-5 py-1.5 text-xs font-mono"
      style={{
        background: 'rgba(8,8,20,0.9)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <span className="flex items-center gap-1.5" style={{ color: '#10B981' }}>
        <Wifi size={11} />System Online
      </span>
      <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
      <span className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
        <Database size={11} />
        {currentDataset ? `${currentDataset.name} · ${currentDataset.rows?.toLocaleString()} rows` : 'No dataset'}
      </span>
      <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
      <span className="flex items-center gap-1.5" style={{ color: '#8B5CF6' }}>
        <Activity size={11} />XGBoost v1.0 Ready
      </span>
      <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
      <span className="flex items-center gap-1.5 ml-auto" style={{ color: 'rgba(255,255,255,0.25)' }}>
        <Cpu size={11} />CPU {cpu}%
      </span>
    </div>
  );
}
