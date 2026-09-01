/**
 * Nordic Settings — Color Palette Selector & Data Engine Configuration
 */
import { Settings as SettingsIcon, Save, Palette, Check, Database } from 'lucide-react';
import NordicCard from '../components/ui/NordicCard';
import useAppStore from '../store/useAppStore';
import toast from 'react-hot-toast';

export const LIGHT_THEMES = [
  {
    id: 'sage',
    name: 'Nordic Sage',
    description: 'Minimalist earthy warm sand with calming sage green accents',
    primary: '#7C9082',
    secondary: '#7A8B99',
    bg: '#F7F6F3',
    card: '#FFFFFF',
  },
  {
    id: 'azure',
    name: 'Royal Azure',
    description: 'Vibrant modern tech blue with clean ice-white background',
    primary: '#2563EB',
    secondary: '#0284C7',
    bg: '#F8FAFC',
    card: '#FFFFFF',
  },
  {
    id: 'emerald',
    name: 'Emerald Mint',
    description: 'Fresh botanical mint and deep emerald for clean data clarity',
    primary: '#059669',
    secondary: '#0D9488',
    bg: '#F4F9F6',
    card: '#FFFFFF',
  },
  {
    id: 'terracotta',
    name: 'Warm Terracotta',
    description: 'Sun-baked warm coral and sandstone linen editorial palette',
    primary: '#E06D53',
    secondary: '#B45309',
    bg: '#FAF6F4',
    card: '#FFFFFF',
  },
  {
    id: 'violet',
    name: 'Lavender & Iris',
    description: 'Futuristic AI purple and electric violet on soft cloud white',
    primary: '#7C3AED',
    secondary: '#6366F1',
    bg: '#F8F7FC',
    card: '#FFFFFF',
  },
  {
    id: 'amber',
    name: 'Amber Honey',
    description: 'Golden honey and warm copper on cream ivory parchment',
    primary: '#D97706',
    secondary: '#EA580C',
    bg: '#FDFBF7',
    card: '#FFFFFF',
  },
];

export default function Settings() {
  const { theme, setTheme } = useAppStore();

  const handleThemeChange = (newThemeId, newThemeName) => {
    setTheme(newThemeId);
    toast.success(`Active theme changed to ${newThemeName}!`, { icon: '🎨' });
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Settings &amp; Appearance</h2>
        <p className="text-gray-500 font-medium">Personalize your workspace light color palette and configure data cleaning parameters.</p>
      </div>

      {/* 1. Interactive Color Palette Card */}
      <NordicCard title="Light Color Palettes" icon={Palette} color="sage">
        <div className="flex flex-col gap-4 mt-2">
          <p className="text-xs text-gray-500 font-medium">
            Choose your preferred light theme aesthetic. The color palette applies instantly across all charts, buttons, badges, and interfaces.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
            {LIGHT_THEMES.map((t) => {
              const isSelected = theme === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => handleThemeChange(t.id, t.name)}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 relative overflow-hidden ${
                    isSelected
                      ? 'border-gray-900 shadow-md bg-white'
                      : 'border-gray-200/80 bg-gray-50/50 hover:bg-white hover:border-gray-300'
                  }`}
                  style={{
                    backgroundColor: isSelected ? '#FFFFFF' : `${t.bg}90`
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-extrabold text-gray-900 text-sm">{t.name}</span>
                      </div>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-xs">{t.description}</p>
                    </div>

                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-transform ${isSelected ? 'bg-gray-900 text-white scale-110' : 'bg-gray-200 text-transparent'}`}>
                      <Check size={14} />
                    </div>
                  </div>

                  {/* Color Swatches */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100/80">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full shadow-xs border border-white" style={{ backgroundColor: t.primary }} title="Primary Accent" />
                      <div className="w-5 h-5 rounded-full shadow-xs border border-white" style={{ backgroundColor: t.secondary }} title="Secondary Accent" />
                      <div className="w-5 h-5 rounded-full shadow-xs border border-gray-200" style={{ backgroundColor: t.bg }} title="Canvas Background" />
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 ml-auto">
                      {isSelected ? '✓ Active Theme' : 'Click to Apply'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </NordicCard>

      {/* 2. System Parameters Card */}
      <NordicCard title="System Parameters" icon={SettingsIcon} color="sage">
        <div className="flex flex-col gap-5 mt-2">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-bold text-gray-700">Max Dataset Ingestion Size (MB)</label>
              <span className="text-xs font-bold text-[#7C9082] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                5 GB Limit
              </span>
            </div>
            <input 
              type="number" 
              defaultValue={localStorage.getItem('DATACLEAN_MAX_SIZE_MB') || 5120} 
              id="input-max-size"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:bg-white focus:border-[#7C9082] outline-none transition-all" 
            />
            <p className="text-xs text-gray-400 mt-1">Default: 5120 MB (5 GB) supporting large enterprise CSVs and multi-sheet Excel files</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Outlier Z-Score Threshold</label>
            <input 
              type="number" 
              defaultValue={localStorage.getItem('DATACLEAN_ZSCORE_THRESHOLD') || 3.0} 
              step="0.1" 
              id="input-zscore"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:bg-white focus:border-[#7C9082] outline-none transition-all" 
            />
            <p className="text-xs text-gray-400 mt-1">Standard statistical threshold for flagging extreme outlier values (Default: 3.0)</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Default Imputation Strategy</label>
            <select 
              defaultValue={localStorage.getItem('DATACLEAN_IMPUTATION_STRATEGY') || "auto"} 
              id="select-imputation"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm cursor-pointer font-medium focus:bg-white focus:border-[#7C9082] outline-none transition-all"
            >
              <option value="auto">AI Recommended (Auto — Mean / Median / Mode based on distribution)</option>
              <option value="fast">Fast Imputation (Mean for numbers, Mode for text)</option>
              <option value="accurate">Multivariate Imputation (KNN / MICE)</option>
            </select>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                const maxSize = document.getElementById('input-max-size')?.value || 5120;
                const zscore = document.getElementById('input-zscore')?.value || 3.0;
                const strategy = document.getElementById('select-imputation')?.value || 'auto';
                localStorage.setItem('DATACLEAN_MAX_SIZE_MB', maxSize);
                localStorage.setItem('DATACLEAN_ZSCORE_THRESHOLD', zscore);
                localStorage.setItem('DATACLEAN_IMPUTATION_STRATEGY', strategy);
                toast.success('System parameters saved successfully!');
              }}
              className="btn-nd btn-nd-primary text-xs px-6"
            >
              <Save size={14} /> Save System Parameters
            </button>
          </div>
        </div>
      </NordicCard>

      {/* 3. Engine Configuration Card */}
      <NordicCard title="Engine Configuration" icon={Database} color="dusty">
        <div className="flex flex-col gap-4 text-xs font-medium text-gray-600">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-500">AI Recommendation Engine</span>
            <span className="font-bold text-gray-900">Tri-Ensemble (XGBoost + LightGBM + CatBoost)</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-500">Execution Mode</span>
            <span className="font-bold text-[#7C9082] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              High-Speed Vectorized (Chunk Streaming)
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-500">Supported Formats</span>
            <span className="font-bold text-gray-900">CSV, XLS, XLSX, XLSM, XLSB, JSON</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-500">Maximum Processing Limit</span>
            <span className="font-bold text-gray-900">Up to 50 Million Rows</span>
          </div>
        </div>
      </NordicCard>
    </div>
  );
}
