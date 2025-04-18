import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  return (
    <nav className="p-4 border-b flex items-center">
      <Link to="/chats" className="mr-4">Sohbetler</Link>
      <Link to="/users" className="mr-4">Kullanıcılar</Link>
      {user ? (
        <button onClick={logout} className="ml-auto">Çıkış</button>
      ) : (
        <div className="ml-auto">
          <Link to="/login" className="mr-2">Giriş</Link>
          <Link to="/register">Kayıt</Link>
        </div>
      )}
    </nav>
  );
}
