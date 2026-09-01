/**
 * Nordic Settings — System Parameters and Data Engine Configuration
 */
import { Settings as SettingsIcon, Save, Sliders, Shield, Database } from 'lucide-react';
import NordicCard from '../components/ui/NordicCard';
import toast from 'react-hot-toast';

export default function Settings() {
  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Settings</h2>
        <p className="text-gray-500 font-medium">Configure cleaning engine parameters and data thresholds.</p>
      </div>

      {/* System Parameters Card */}
      <NordicCard title="System Parameters" icon={SettingsIcon} color="sage">
        <div className="flex flex-col gap-5 mt-2">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-bold text-gray-700">Max Dataset Size (MB)</label>
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
            <p className="text-xs text-gray-400 mt-1">Default: 5120 MB (5 GB) supporting large enterprise CSVs/Excel files</p>
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

      {/* Engine Info Card */}
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
