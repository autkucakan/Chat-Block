// src/pages/ChatRoom.jsx
import { useEffect, useState } from 'react';
import { useParams }       from 'react-router-dom';
import api                 from '../services/api';
import useWebSocket        from '../hooks/useWebSocket';
import MessageInput        from '../components/MessageInput';

const apiUrl = process.env.REACT_APP_API_URL;
const plainUrl = process.env.REACT_APP_PLAIN_URL;
console.log(apiUrl); //Daha sonra sil bunu
console.log(plainUrl);

export default function ChatRoom() {
  const { chatId } = useParams();
  const [msgs, setMsgs] = useState([]);
  const token = localStorage.getItem('token');
  const wsUrl = `ws://${plainUrl}/api/ws/chat/${chatId}?token=${token}`;

  // İlk olarak geçmiş mesajları al
  useEffect(() => {
    api.get(`/chats/${chatId}/messages`)
      .then(res => setMsgs(res.data.reverse()))
      .catch(console.error);
  }, [chatId]);

  // WebSocket’i dinle ve sendMessage fonksiyonunu al
  const sendMessage = useWebSocket(wsUrl, newMsg => {
    setMsgs(prev => [...prev, newMsg]);
  });

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto p-4">
      <div className="flex-1 overflow-auto mb-4">
        {msgs.map(m => (
          <div
            key={m.id}
            className={`p-2 mb-2 rounded max-w-xs ${
              m.user_id === JSON.parse(atob(token.split('.')[1])).user_id
                ? 'bg-blue-100 self-end'
                : 'bg-gray-100 self-start'
            }`}
          >
            <p>{m.content}</p>
            <small className="text-xs text-gray-600">
              {new Date(m.created_at).toLocaleTimeString()}
            </small>
          </div>
        ))}
      </div>

      {/* MessageInput props’unda artık doğru sendMessage var */}
      <MessageInput onSend={sendMessage} />
    </div>
  );
}
