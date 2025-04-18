import { createContext, useState, useEffect } from 'react';
import { login, register, me } from '../services/authService';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      me()
        .then(res => setUser(res.data))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function loginUser(creds) {
    try {
      const res = await login(creds);
      localStorage.setItem('token', res.data.access_token);
      const userData = await me();
      setUser(userData.data);
      return userData.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async function registerUser(data) {
    try {
      const res = await register(data);
      localStorage.setItem('token', res.data.access_token);
      const userData = await me();
      setUser(userData.data);
      return userData.data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, loginUser, registerUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
