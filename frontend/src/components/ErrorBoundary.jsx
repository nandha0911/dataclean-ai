/**
 * ErrorBoundary — catches React render crashes and shows a helpful recovery UI
 */
import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary caught]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F6F3] flex items-center justify-center p-8">
          <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-12 max-w-lg w-full text-center">
            <div className="w-16 h-16 bg-[#F8F2F0] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={28} className="text-[#C88272]" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-3">
              Something went wrong
            </h2>
            <p className="text-gray-500 font-medium mb-2 text-sm">
              A rendering error occurred on this page.
            </p>
            <p className="font-mono text-xs text-[#C88272] bg-[#F8F2F0] rounded-xl p-3 mb-8 text-left break-all">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/dashboard'; }}
              className="btn-nd btn-nd-primary mx-auto"
            >
              <RefreshCw size={16} /> Return to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
