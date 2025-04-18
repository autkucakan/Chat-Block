import { useState, useEffect, useContext } from 'react';
import { getUsers, createChat } from '../services/authService';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getUsers();
        setUsers(response.data.filter(u => u.id !== user.id));
      } catch (err) {
        setError('Kullanıcılar yüklenirken bir hata oluştu');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user]);

  const startChat = async (userId) => {
    try {
      const response = await createChat({
        name: 'Yeni Sohbet',
        user_ids: [userId],
        is_group_chat: false
      });
      navigate(`/chats/${response.data.id}`);
    } catch (err) {
      setError('Sohbet oluşturulurken bir hata oluştu');
      console.error(err);
    }
  };

  if (loading) return <div className="text-center p-4">Yükleniyor...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl mb-4">Kullanıcılar</h2>
      <ul>
        {users.map(u => (
          <li key={u.id} className="p-2 border-b flex justify-between items-center">
            <div>
              <span className="font-medium">{u.username}</span>
              <span className={`ml-2 text-xs ${u.status === 'online' ? 'text-green-500' : 'text-gray-500'}`}>
                {u.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı'}
              </span>
            </div>
            <button 
              onClick={() => startChat(u.id)}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              Mesaj Gönder
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
