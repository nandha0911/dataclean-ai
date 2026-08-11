/**
 * Nordic Settings
 */
import { Settings as SettingsIcon, Save } from 'lucide-react';
import NordicCard from '../components/ui/NordicCard';

export default function Settings() {
  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Settings</h2>
        <p className="text-gray-500 font-medium">Configure global system parameters.</p>
      </div>

      <NordicCard title="System Parameters" icon={SettingsIcon} color="dusty">
        <div className="flex flex-col gap-6 mt-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Max Dataset Size (MB)</label>
            <input type="number" defaultValue={100} className="w-full bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Outlier Z-Score Threshold</label>
            <input type="number" defaultValue={3.0} step="0.1" className="w-full bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Imputation Strategy</label>
            <select defaultValue="auto" className="w-full bg-gray-50 cursor-pointer">
              <option value="auto">AI Recommended (Auto)</option>
              <option value="fast">Fast (Mean / Mode)</option>
              <option value="accurate">Accurate (KNN / MICE)</option>
            </select>
          </div>

          <button className="btn-nd btn-nd-primary justify-center w-full py-4 mt-4 shadow-sm">
            <Save size={16} /> Save Configuration
          </button>
        </div>
      </NordicCard>
    </div>
  );
}
