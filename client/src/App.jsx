import { useState, useEffect } from 'react';
import './App.css';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Database } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api/auth';

function App() {
  const [mode, setMode] = useState('signup'); // 'signup' | 'login'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);
  
  // Validation errors
  const [errors, setErrors] = useState({});
  
  // Backend & MongoDB Atlas connection status
  const [dbStatus, setDbStatus] = useState({
    server: 'checking',
    database: 'checking',
    message: '',
  });

  // Check MongoDB & Server health on load
  const checkStatus = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/status`);
      const data = await res.json();
      setDbStatus(data);
    } catch {
      setDbStatus({
        server: 'offline',
        database: 'offline',
        message: 'Backend server is not running on port 5000.',
      });
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 6000);
    return () => clearInterval(interval);
  }, []);

  // Validate form before submitting
  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validate()) return;

    setIsLoading(true);

    try {
      const endpoint = mode === 'signup' ? `${API_BASE_URL}/signup` : `${API_BASE_URL}/login`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMsg(data.message || 'Something went wrong. Please try again.');
        if (data.isDbOffline) {
          checkStatus();
        }
      } else {
        if (data.token) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        setSuccessData(data);
      }
    } catch {
      setErrorMsg('Could not connect to the Express server. Please verify backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signup' ? 'login' : 'signup');
    setErrorMsg('');
    setErrors({});
    setSuccessData(null);
  };

  return (
    <div className="signup-page-container">
      {/* MongoDB Atlas Connectivity Indicator */}
      <div
        className={`atlas-status-badge ${
          dbStatus.database === 'connected' ? 'connected' : 'disconnected'
        }`}
        title={dbStatus.message}
      >
        <span
          className={`status-dot ${
            dbStatus.database === 'connected' ? 'green' : 'amber'
          }`}
        />
        <Database size={14} />
        {dbStatus.database === 'connected'
          ? 'MongoDB Atlas: Connected'
          : 'MongoDB Atlas: Waiting for URI in server/.env'}
      </div>

      <div className="auth-card">
        {successData ? (
          <div className="success-screen">
            <div className="success-icon-badge">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="auth-title" style={{ fontSize: '32px', marginBottom: '8px' }}>
              {mode === 'signup' ? 'Successfully Registered!' : 'Successfully Logged In!'}
            </h2>
            <p style={{ color: '#4b5563', fontSize: '15px', marginTop: '6px' }}>
              {mode === 'signup'
                ? 'Your account is created and you are now logged in.'
                : 'Login successful! Welcome back.'}
            </p>
            <div className="success-email">{successData.user?.email}</div>

            <div className="success-status-tag">
              <span className="status-dot green"></span>
              Active Session in MongoDB Atlas
            </div>
          </div>
        ) : (
          <>
            {/* Title matching screenshot */}
            <h1 className="auth-title">
              {mode === 'signup' ? 'Sign Up' : 'Log In'}
            </h1>

            {/* Subtitle matching screenshot */}
            <div className="auth-subtitle">
              <span>
                {mode === 'signup' ? 'Already a member?' : "Don't have an account?"}
              </span>
              <button
                type="button"
                className="auth-subtitle-link"
                onClick={toggleMode}
              >
                {mode === 'signup' ? 'Log In' : 'Sign Up'}
              </button>
            </div>

            {/* Error banner if any */}
            {errorMsg && (
              <div className="alert-box error">
                <AlertCircle size={18} className="alert-icon" />
                <div>{errorMsg}</div>
              </div>
            )}

            {/* Form */}
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {/* Email Input */}
              <div className="form-group">
                <div className="input-container">
                  <input
                    type="email"
                    id="email"
                    className={`underline-input ${errors.email ? 'has-error' : ''}`}
                    placeholder="Email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <span className="field-error-text">{errors.email}</span>
                )}
              </div>

              {/* Password Input */}
              <div className="form-group">
                <div className="input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className={`underline-input ${errors.password ? 'has-error' : ''}`}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="field-error-text">{errors.password}</span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    <span>Processing...</span>
                  </>
                ) : mode === 'signup' ? (
                  'Sign Up'
                ) : (
                  'Log In'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
