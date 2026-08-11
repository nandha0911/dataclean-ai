/**
 * Nordic Dataset Preview
 */
import { Eye, Database, Columns, FileJson, AlertCircle } from 'lucide-react';
import NordicCard from '../components/ui/NordicCard';
import useAppStore from '../store/useAppStore';

export default function DatasetPreview() {
  const { currentDataset } = useAppStore();

  if (!currentDataset) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">No Dataset Loaded</h2>
        <p className="text-gray-500 font-medium">Upload a dataset to view its internal structure.</p>
      </div>
    );
  }

  const { preview } = currentDataset;
  const headers = preview ? Object.keys(preview[0] || {}) : [];

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Dataset Preview</h2>
          <p className="text-gray-500 font-medium">Explore the raw structure of your data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NordicCard title="Total Rows" icon={Database} color="sage">
          <div className="text-4xl font-extrabold text-gray-900 tracking-tight mt-2">{currentDataset.rows?.toLocaleString()}</div>
        </NordicCard>
        <NordicCard title="Total Columns" icon={Columns} color="dusty">
          <div className="text-4xl font-extrabold text-gray-900 tracking-tight mt-2">{currentDataset.cols?.toLocaleString()}</div>
        </NordicCard>
        <NordicCard title="Format" icon={FileJson} color="mustard">
          <div className="text-4xl font-extrabold text-gray-900 tracking-tight mt-2">CSV / DF</div>
        </NordicCard>
      </div>

      <NordicCard title="First 5 Rows" icon={Eye} color="sage" className="overflow-x-auto">
        <div className="mt-4">
          {preview && preview.length > 0 ? (
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr>
                  {headers.map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i}>
                    {headers.map(h => (
                      <td key={`${i}-${h}`}>
                        {row[h] === null ? <span className="text-[#C88272] bg-[#F8F2F0] px-2 py-0.5 rounded-md text-xs font-bold">NULL</span> : String(row[h])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center p-12 text-gray-400 font-medium bg-gray-50 rounded-2xl">Preview data not available</div>
          )}
        </div>
      </NordicCard>
    </div>
  );
}
