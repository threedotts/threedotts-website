import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ChatWidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SECURITY] Chat widget error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="chat-widget-error" style={{ display: 'none' }}>
          {/* Hidden fallback - chat widget failed to load */}
        </div>
      );
    }

    return this.props.children;
  }
}