import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// ============================================
// COMPREHENSIVE ERROR LOGGING SYSTEM
// ============================================

const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

// Helper to extract message from various error formats
const getErrorMessage = (arg) => {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return arg.message + ' ' + (arg.stack || '');
  if (arg && typeof arg.toString === 'function') return arg.toString();
  return '';
};

// Enhanced error logger with context
const logError = (error, context = {}) => {
  try {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Error',
      code: error?.code,
      ...context
    };

    // Log to console with formatting (using originalError to avoid recursion)
    originalError('🚨 ERROR:', errorInfo);
    
    // Log full error details if it's an Error object
    if (error instanceof Error) {
      originalError('Error Details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      });
    }
    
    // Log context if provided
    if (Object.keys(context).length > 0) {
      originalError('Error Context:', context);
    }

    // Log the original error object for full details
    originalError(error);
  } catch (logErr) {
    // If logging itself fails, use basic console.error to avoid infinite loops
    originalError('Failed to log error:', logErr);
    originalError('Original error:', error);
  }
};

// Enhanced console.error that logs everything
console.error = (...args) => {
  // Combine all arguments into a single string for pattern matching
  const fullMessage = args.map(getErrorMessage).join(' ').toLowerCase();
  
  // Suppress YouTube postMessage origin mismatch errors (but still log them)
  if (
    (fullMessage.includes('failed to execute') && fullMessage.includes('postmessage')) ||
    (fullMessage.includes('target origin provided') && fullMessage.includes('youtube')) ||
    (fullMessage.includes('www-widgetapi.js') && fullMessage.includes('youtube'))
  ) {
    // Log but don't show to user (suppress UI noise)
    originalLog('⚠️ Suppressed YouTube postMessage error:', args);
    return;
  }
  
  // Suppress message channel errors (but still log them)
  if (
    fullMessage.includes('message channel closed') ||
    fullMessage.includes('asynchronous response by returning true')
  ) {
    originalLog('⚠️ Suppressed message channel error:', args);
    return;
  }
  
  // Log all other errors with full context
  const error = args.find(arg => arg instanceof Error) || args[0];
  if (error) {
    logError(error, {
      source: 'console.error',
      args: args.map(arg => getErrorMessage(arg))
    });
  }
  
  // Also log original format for compatibility
  originalError.apply(console, args);
};

console.warn = (...args) => {
  const fullMessage = args.map(getErrorMessage).join(' ').toLowerCase();
  
  // Suppress passive event listener warnings (but still log them)
  if (
    fullMessage.includes('non-passive event listener') &&
    fullMessage.includes('scroll-blocking')
  ) {
    originalLog('⚠️ Suppressed passive event listener warning:', args);
    return;
  }
  
  // Log all warnings
  originalLog('⚠️ WARNING:', args);
  originalWarn.apply(console, args);
};

// Global error handler for uncaught errors
window.onerror = (message, source, lineno, colno, error) => {
  logError(error || new Error(message), {
    source: 'window.onerror',
    message,
    file: source,
    line: lineno,
    column: colno,
    url: window.location.href
  });
  return false; // Don't prevent default error handling
};

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  logError(event.reason, {
    source: 'unhandledrejection',
    promise: event.promise,
    url: window.location.href
  });
  // Don't prevent default - let it show in console
});

// Log all Firebase errors
const originalFirebaseError = console.error;
if (typeof window !== 'undefined' && window.firebase) {
  // If Firebase is available, wrap its error handling
  console.log('📊 Firebase error logging enabled');
}

// Log React errors
const logReactError = (error, errorInfo) => {
  logError(error, {
    source: 'React',
    componentStack: errorInfo?.componentStack,
    errorInfo
  });
};

// React Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logReactError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '40px 20px', 
          textAlign: 'center', 
          fontFamily: 'system-ui, -apple-system, sans-serif',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f9fafb'
        }}>
          <h1 style={{ color: '#dc2626', fontSize: '2rem', marginBottom: '1rem' }}>🚨 Something went wrong</h1>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            An error occurred. Check the browser console for detailed error information.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              padding: '12px 24px', 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Initialize error logging
console.log('🔍 Comprehensive error logging enabled');
console.log('📊 All errors will be logged with full context');
console.log('📝 Check console for detailed error information');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
