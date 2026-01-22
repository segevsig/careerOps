import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setResetLink(null);
    setIsLoading(true);

    try {
      const { data } = await api.post<{ message: string; resetLink?: string }>('/api/auth/forgot-password', { email });
      setSuccess(true);
      if (data.resetLink) setResetLink(data.resetLink);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>CareerOps</h1>
        <h2>Forgot password</h2>
        {success ? (
          <>
            <div className="success-message">
              {resetLink ? (
                <>
                  <p>No email configured. Use this link to reset your password (expires in 1 hour):</p>
                  <p style={{ marginTop: 12 }}>
                    <a href={resetLink} className="reset-link-inline">
                      Reset password
                    </a>
                  </p>
                  <p style={{ marginTop: 8, fontSize: 13, color: '#666', wordBreak: 'break-all' }}>
                    {resetLink}
                  </p>
                </>
              ) : (
                'If that email is registered, you’ll receive a password reset link shortly. Check your inbox and spam folder.'
              )}
            </div>
            <p className="auth-link">
              <Link to="/login">Back to login</Link>
            </p>
          </>
        ) : (
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
                placeholder="Enter your account email"
                dir="ltr"
              />
            </div>
            <button type="submit" disabled={isLoading} className="primary-button">
              {isLoading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}
        {!success && (
          <p className="auth-link">
            Remember your password? <Link to="/login">Login</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
