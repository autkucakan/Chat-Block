import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ErrorNotification from '../common/ErrorNotification';
import axios from 'axios';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [statusError, setStatusError] = useState(null);
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the backend is running
    const checkBackendStatus = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
        await axios.get(`${apiUrl.replace(/\/$/, '')}/test`, { timeout: 5000 });
        setBackendStatus('online');
        setStatusError(null);
      } catch (error) {
        console.error('Backend connection error:', error);
        setBackendStatus('offline');
        setStatusError('Cannot connect to the backend server. Please ensure it is running.');
      }
    };

    checkBackendStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      return;
    }
    
    if (backendStatus === 'offline') {
      setStatusError('Cannot log in: Backend server is not available');
      return;
    }
    
    const success = await login(username, password);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Chat Block</h2>
        <div className={`backend-status ${backendStatus}`}>
          Backend server: {backendStatus}
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={backendStatus === 'offline'}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={backendStatus === 'offline'}
              autoComplete="current-password"
            />
          </div>
          
          <button 
            type="submit" 
            className="login-button" 
            disabled={loading || backendStatus === 'offline' || backendStatus === 'checking'}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
      
      <ErrorNotification 
        message={statusError}
        onClose={() => setStatusError(null)}
        autoHideDuration={15000}
      />
    </div>
  );
};

export default Login; 