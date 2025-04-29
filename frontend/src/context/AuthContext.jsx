import { createContext, useState, useEffect, useContext } from 'react';
import { loginUser, refreshToken } from '../api/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for token and try to refresh on page load
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await refreshToken();
          const { access_token } = response.data;
          setToken(access_token);
          localStorage.setItem('token', access_token);
          
          // Parse the token to get user information (assuming JWT)
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const { user_id } = JSON.parse(jsonPayload);
          setCurrentUser({ id: user_id });
        } catch (error) {
          console.error("Token refresh failed:", error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await loginUser(username, password);
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      setToken(access_token);
      
      // Parse the token to get user information
      const base64Url = access_token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const { user_id } = JSON.parse(jsonPayload);
      setCurrentUser({ id: user_id });
      setLoading(false);
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      setError(error.response?.data?.detail || 'Login failed');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      token, 
      loading, 
      error, 
      login, 
      logout,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 