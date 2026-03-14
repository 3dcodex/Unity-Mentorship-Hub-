import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logAdminAction } from '../services/adminService';
import { errorService } from '../services/errorService';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    errorService.handleError(error, 'Admin panel error');
    
    // Log error to Firestore
    try {
      logAdminAction(
        'system',
        'Error Boundary',
        'error_caught',
        JSON.stringify({
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack
        })
      );
    } catch (e) {
      errorService.handleError(e, 'Failed to log error');
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-red-600 text-5xl">error</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              {this.state.error?.message || 'An unexpected error occurred in the admin panel'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => window.history.back()}
                className="flex-1 px-4 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200"
              >
                Go Back
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;
