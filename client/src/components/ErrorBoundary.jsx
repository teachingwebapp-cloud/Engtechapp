import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error, errorInfo);
    }
    
    this.setState({
      error,
      errorInfo
    });
    
    // TODO: Send error to monitoring service (Sentry, etc.)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          backgroundColor: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1f2937',
              textAlign: 'center',
              marginBottom: '0.5rem'
            }}>
              Something went wrong
            </h1>
            
            <p style={{
              color: '#6b7280',
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              We're sorry for the inconvenience. The application encountered an unexpected error.
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <details style={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                fontSize: '0.875rem'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Error Details (Development Only)
                </summary>
                <pre style={{
                  overflow: 'auto',
                  fontSize: '0.75rem',
                  color: '#dc2626',
                  margin: '0.5rem 0 0 0'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center'
            }}>
              <button
                onClick={this.handleReset}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
              >
                Return to Home
              </button>
              
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: 'white',
                  color: '#374151',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#f9fafb'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
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

export default ErrorBoundary;
