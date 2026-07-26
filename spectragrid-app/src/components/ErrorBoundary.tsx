import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            zIndex: 99999,
            background: 'rgba(255,0,0,0.15)',
            color: '#ffcccc',
            padding: '8px 12px',
            fontFamily: 'monospace',
            fontSize: '12px',
            pointerEvents: 'none',
          }}
        >
          Something went wrong. Check the console for details.
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
