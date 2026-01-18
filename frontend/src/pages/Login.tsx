import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>CareerOps</h1>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.94 6.08A6.93 6.93 0 0 1 12 6c3.18 0 6.17 2.29 7.91 6a15.23 15.23 0 0 1-.9 1.64 1 1 0 0 0-.16.55 1 1 0 0 0 1.86.5 15.77 15.77 0 0 0 1.21-2.3 1 1 0 0 0 0-.79C19.9 6.91 16.1 4 12 4a7.77 7.77 0 0 0-1.4.12 1 1 0 1 0 .34 2ZM3.71 2.29a1 1 0 0 0-1.42 1.42l3.1 3.09a14.62 14.62 0 0 0-3.31 4.8 1 1 0 0 0 0 .8C4.1 17.09 7.9 20 12 20a9.26 9.26 0 0 0 5.05-1.54l3.24 3.25a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42l-18-18Zm6.36 9.19 2.45 2.45A1.81 1.81 0 0 1 12 14a2 2 0 0 1-2-2 1.81 1.81 0 0 1 .07-.52ZM12 18c-3.18 0-6.17-2.29-7.9-6a12.09 12.09 0 0 1 2.7-3.19L8.54 9.3a4 4 0 0 0 5.16 5.16l1.61 1.6A9.26 9.26 0 0 1 12 18Z" fill="currentColor"/>
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5ZM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" fill="currentColor"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          <button type="submit" disabled={isLoading} className="primary-button">
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="auth-link">
          Don't have an account? <Link to="/register">Sign up here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

