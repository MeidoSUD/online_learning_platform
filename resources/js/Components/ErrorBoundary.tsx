import React, { ErrorInfo, ReactNode, Component } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
             <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
                <AlertTriangle size={40} className="text-red-500" />
             </div>
             <h2 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h2>
             <p className="text-slate-500 mb-6 text-sm leading-relaxed">
                We encountered an unexpected error. We've logged the issue and notified our team.
             </p>
             
             {this.state.error && (
                 <div className="bg-slate-50 p-3 rounded-lg text-xs text-left text-slate-600 font-mono mb-6 overflow-auto max-h-32 border border-slate-200">
                     {this.state.error.toString()}
                 </div>
             )}

             <div className="flex flex-col gap-3">
                <button
                    onClick={() => window.location.reload()}
                    className="w-full py-3 px-4 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                    <RefreshCw size={18} /> Reload Application
                </button>
                <button
                    onClick={() => {
                        localStorage.clear();
                        window.location.href = '/';
                    }}
                    className="w-full py-3 px-4 bg-white text-slate-600 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                    <Home size={18} /> Go to Home
                </button>
             </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}