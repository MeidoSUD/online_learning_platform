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
        <div className="min-h-screen flex items-center justify-center bg-[var(--light-bg)] p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] p-8 text-center border border-[var(--border)]">
             <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
                <AlertTriangle size={40} className="text-red-500" />
             </div>
             <h2 className="text-2xl font-bold text-navy mb-2">Something went wrong</h2>
             <p className="text-[var(--text-muted)] mb-6 text-sm leading-relaxed">
                We encountered an unexpected error. We've logged the issue and notified our team.
             </p>
             
             {this.state.error && (
                 <div className="bg-[var(--light-bg)] p-3 rounded-lg text-xs text-left text-[var(--text-muted)] font-mono mb-6 overflow-auto max-h-32 border border-[var(--border)]">
                     {this.state.error.toString()}
                 </div>
             )}

             <div className="flex flex-col gap-3">
                <button
                    onClick={() => window.location.reload()}
                    className="w-full py-3 px-4 bg-primary text-white rounded-full font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-[var(--shadow-md)]"
                >
                    <RefreshCw size={18} /> Reload Application
                </button>
                <button
                    onClick={() => {
                        localStorage.clear();
                        window.location.href = '/';
                    }}
                    className="w-full py-3 px-4 bg-white text-navy border border-[var(--border)] rounded-full font-semibold hover:bg-[var(--light-bg)] transition-colors flex items-center justify-center gap-2"
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