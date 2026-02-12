import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  private observer: MutationObserver | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a DOM manipulation error (removeChild/insertBefore)
    // These are typically caused by third-party libraries (Recharts, Radix UI)
    // manipulating the DOM outside React's control
    const isDOMError = error.name === 'NotFoundError' && (
      error.message.includes('removeChild') || 
      error.message.includes('insertBefore') ||
      error.message.includes('appendChild')
    );

    if (isDOMError) {
      // For DOM manipulation errors, we can try to recover silently
      // by not showing the error screen
      console.warn('[ErrorBoundary] Caught DOM manipulation error, attempting recovery:', error.message);
      return { hasError: false, error: null };
    }

    return { hasError: true, error };
  }

  componentDidMount() {
    // Listen for URL changes to reset error state
    this.setupRouteChangeListener();
  }

  componentWillUnmount() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const isDOMError = error.name === 'NotFoundError' && (
      error.message.includes('removeChild') || 
      error.message.includes('insertBefore') ||
      error.message.includes('appendChild')
    );

    if (isDOMError) {
      // Attempt recovery by forcing a re-render
      console.warn('[ErrorBoundary] DOM error caught, forcing recovery');
      this.setState({ hasError: false, error: null });
      return;
    }

    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  setupRouteChangeListener() {
    // Listen for popstate events (browser back/forward)
    const resetError = () => {
      if (this.state.hasError) {
        this.setState({ hasError: false, error: null });
      }
    };

    window.addEventListener('popstate', resetError);

    // Also intercept pushState/replaceState for SPA navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      resetError();
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      resetError();
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4">Ocorreu um erro inesperado.</h2>

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
              <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                {this.state.error?.message}
              </pre>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-secondary text-secondary-foreground",
                  "hover:opacity-90 cursor-pointer"
                )}
              >
                <RotateCcw size={16} />
                Tentar Novamente
              </button>
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 cursor-pointer"
                )}
              >
                <RotateCcw size={16} />
                Recarregar Página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
