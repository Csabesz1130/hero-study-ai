import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    onError?: (error: Error) => void;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        if (this.props.onError) {
            this.props.onError(error);
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <h2>Hiba történt a komponens betöltése közben</h2>
                    <p>{this.state.error?.message}</p>
                    <button onClick={() => this.setState({ hasError: false })}>
                        Újrapróbálkozás
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
} 