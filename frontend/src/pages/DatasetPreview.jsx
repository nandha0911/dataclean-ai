/**
 * Nordic Dataset Preview
 * Interactive client-side/server-side live table explorer supporting head, tail, sample, and all modes.
 */
import { useState, useEffect } from 'react';
import { Eye, Database, Columns, FileJson, AlertCircle, RefreshCw } from 'lucide-react';
import NordicCard from '../components/ui/NordicCard';
import useAppStore from '../store/useAppStore';
import { getDatasetPreview } from '../api/client';
import toast from 'react-hot-toast';

export default function DatasetPreview() {
  const { currentDataset } = useAppStore();
  const [mode, setMode] = useState('head');
  const [limit, setLimit] = useState(20);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch preview when currentDataset, mode, or limit changes
  useEffect(() => {
    if (!currentDataset?.id) return;
    
    let isMounted = true;
    const fetchPreview = async () => {
      setLoading(true);
      try {
        const res = await getDatasetPreview(currentDataset.id, mode, limit);
        if (isMounted) {
          setPreviewData(res.data.preview || []);
        }
      } catch (err) {
        console.error('Failed to fetch preview:', err);
        toast.error(err.message || 'Error fetching dataset preview');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPreview();
    return () => {
      isMounted = false;
    };
  }, [currentDataset?.id, mode, limit]);

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

  const headers = previewData.length > 0 ? Object.keys(previewData[0]) : [];

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Dataset Preview</h2>
          <p className="text-gray-500 font-medium">Explore the raw structure of your data.</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NordicCard title="Total Rows" icon={Database} color="sage">
          <div className="text-4xl font-extrabold text-gray-900 tracking-tight mt-2">
            {currentDataset.rows?.toLocaleString()}
          </div>
        </NordicCard>
        <NordicCard title="Total Columns" icon={Columns} color="dusty">
          <div className="text-4xl font-extrabold text-gray-900 tracking-tight mt-2">
            {currentDataset.cols?.toLocaleString()}
          </div>
        </NordicCard>
        <NordicCard title="Format" icon={FileJson} color="mustard">
          <div className="text-4xl font-extrabold text-gray-900 tracking-tight mt-2">
            {currentDataset.filename?.split('.').pop()?.toUpperCase() || 'CSV'}
          </div>
        </NordicCard>
      </div>

      {/* Explorer Controls */}
      <NordicCard title="Data Explorer" icon={Eye} color="sage">
        <div className="flex flex-col gap-6 mt-4">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            {/* Mode selector */}
            <div className="flex gap-2">
              {[
                { id: 'head', label: 'First Rows (Head)' },
                { id: 'tail', label: 'Last Rows (Tail)' },
                { id: 'sample', label: 'Random Sample' },
                { id: 'all', label: 'All Data (Max 1000)' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                    mode === m.id
                      ? 'bg-[#7C9082] text-white shadow-soft'
                      : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Row limit selector */}
            {mode !== 'all' && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-gray-500">Rows to show:</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="bg-white border border-gray-200 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-[#7C9082] transition-colors"
                >
                  <option value={10}>10 Rows</option>
                  <option value={20}>20 Rows</option>
                  <option value={50}>50 Rows</option>
                  <option value={100}>100 Rows</option>
                  <option value={500}>500 Rows</option>
                </select>
              </div>
            )}
          </div>

          {/* Preview Table */}
          <div className="overflow-x-auto border border-gray-100 rounded-2xl relative min-h-[300px]">
            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
                <RefreshCw className="animate-spin text-[#7C9082]" size={36} />
              </div>
            )}

            {previewData.length > 0 ? (
              <table className="w-full text-left whitespace-nowrap text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="py-3.5 px-4 font-bold text-gray-400 w-12">#</th>
                    {headers.map((h) => (
                      <th key={h} className="py-3.5 px-4 font-bold text-gray-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {previewData.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-gray-400">{i + 1}</td>
                      {headers.map((h) => (
                        <td key={`${i}-${h}`} className="py-3.5 px-4 text-gray-600 font-medium">
                          {row[h] === null || row[h] === '' ? (
                            <span className="text-[#C88272] bg-[#F8F2F0] px-2 py-0.5 rounded-md text-[10px] font-bold">
                              NULL
                            </span>
                          ) : (
                            String(row[h])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 font-medium">
                Preview data not available
              </div>
            )}
          </div>
        </div>
      </NordicCard>
    </div>
  );
}
