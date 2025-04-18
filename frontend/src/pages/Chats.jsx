import { useEffect, useState, useContext } from 'react';
import { getChats } from '../services/authService';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export default function Chats() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await getChats();
        setChats(response.data);
      } catch (err) {
        setError('Sohbetler yüklenirken bir hata oluştu');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  if (loading) return <div className="text-center p-4">Yükleniyor...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl mb-4">Sohbetler</h2>
      {chats.length === 0 ? (
        <p className="text-center text-gray-500">Henüz hiç sohbetiniz yok</p>
      ) : (
        <ul>
          {chats.map(chat => (
            <li key={chat.id} className="p-3 border-b hover:bg-gray-50">
              <Link to={`/chats/${chat.id}`} className="block">
                <div className="font-medium">{chat.name}</div>
                <div className="text-sm text-gray-500">
                  {chat.is_group_chat 
                    ? `${chat.users.length} katılımcı` 
                    : chat.users.find(u => u.id !== user.id)?.username || 'Sohbet'}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
