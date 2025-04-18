import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login    from './pages/Login';
import Register from './pages/Register';
import Users    from './pages/Users';
import Chats    from './pages/Chats';
import ChatRoom from './pages/ChatRoom';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <div className="p-4">
          <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/users"    element={<ProtectedRoute><Users/></ProtectedRoute>} />
            <Route path="/chats"    element={<ProtectedRoute><Chats/></ProtectedRoute>} />
            <Route path="/chats/:chatId" element={<ProtectedRoute><ChatRoom/></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/chats" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
