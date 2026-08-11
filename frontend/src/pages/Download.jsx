/**
 * Nordic Download / Export Page
 * Fully functional CSV and PDF Report exporter.
 */
import { useState } from 'react';
import { Download, FileText, FileCode, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { downloadDataset, generateReport } from '../api/client';
import toast from 'react-hot-toast';

export default function DownloadPage() {
  const { currentDataset } = useAppStore();
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadCSV = async () => {
    if (!currentDataset?.id) return toast.error('No dataset active. Please upload a dataset first.');
    setDownloadingCsv(true);
    try {
      const res = await downloadDataset(currentDataset.id, 'cleaned');
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const isCleaned = !!currentDataset.cleaned_path || currentDataset.status === 'cleaned';
      const baseName = currentDataset.name || `dataset_${currentDataset.id}.csv`;
      const fileName = isCleaned ? `cleaned_${baseName}` : baseName;
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Cleaned dataset downloaded successfully!');
    } catch (err) {
      console.error('CSV download error:', err);
      toast.error(err.message || 'Failed to download dataset CSV');
    } finally {
      setDownloadingCsv(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!currentDataset?.id) return toast.error('No dataset active. Please upload a dataset first.');
    setDownloadingPdf(true);
    try {
      const res = await generateReport(currentDataset.id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `quality_report_${currentDataset.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF Quality Report generated & downloaded!');
    } catch (err) {
      console.error('PDF report error:', err);
      toast.error(err.message || 'Failed to generate PDF report');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div className="text-center mb-4">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-soft flex items-center justify-center mx-auto mb-6 text-[#7C9082]">
          <Download size={28} />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Export Data</h2>
        <p className="text-gray-500 font-medium">Download your cleaned dataset and comprehensive PDF quality report.</p>
      </div>

      {!currentDataset && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex items-center gap-3 text-sm font-semibold max-w-md mx-auto">
          <AlertCircle size={18} className="text-amber-600 flex-shrink-0" />
          <span>No active dataset loaded. Please upload a dataset to enable export options.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* CSV Card */}
        <div className="bg-white rounded-3xl p-10 text-center shadow-soft border border-gray-100 flex flex-col items-center transition-transform hover:-translate-y-1 hover:shadow-soft-lg">
          <div className="w-16 h-16 rounded-2xl bg-[#F2F5F3] text-[#7C9082] flex items-center justify-center mb-6">
            <FileCode size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Cleaned Dataset</h3>
          <p className="text-gray-500 text-sm font-medium mb-6">
            Export complete dataset in CSV format with all applied imputations, outlier fixes & transformations.
          </p>

          {currentDataset && (
            <div className="mb-6 px-4 py-2 bg-gray-50 rounded-xl text-xs font-semibold text-gray-500">
              {currentDataset.rows || 0} rows · {currentDataset.cols || 0} columns
            </div>
          )}

          <button
            onClick={handleDownloadCSV}
            disabled={!currentDataset || downloadingCsv}
            className="w-full btn-nd btn-nd-primary py-4 shadow-sm flex items-center justify-center gap-2"
          >
            {downloadingCsv ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download size={16} />
                Download CSV
              </>
            )}
          </button>
        </div>

        {/* PDF Card */}
        <div className="bg-white rounded-3xl p-10 text-center shadow-soft border border-gray-100 flex flex-col items-center transition-transform hover:-translate-y-1 hover:shadow-soft-lg">
          <div className="w-16 h-16 rounded-2xl bg-[#F9F6F2] text-[#D4A373] flex items-center justify-center mb-6">
            <FileText size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Quality Report</h3>
          <p className="text-gray-500 text-sm font-medium mb-6">
            Export a publication-ready PDF report detailing data health scores, issue breakdowns & cleaning log.
          </p>

          {currentDataset && (
            <div className="mb-6 px-4 py-2 bg-gray-50 rounded-xl text-xs font-semibold text-gray-500">
              PDF Document · Standard Format
            </div>
          )}

          <button
            onClick={handleDownloadPDF}
            disabled={!currentDataset || downloadingPdf}
            className="w-full btn-nd bg-[#D4A373] text-white hover:bg-opacity-90 py-4 shadow-sm flex items-center justify-center gap-2"
          >
            {downloadingPdf ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download size={16} />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
