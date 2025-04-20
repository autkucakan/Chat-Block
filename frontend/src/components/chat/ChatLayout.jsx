import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import ErrorNotification from '../common/ErrorNotification';
import { useChat } from '../../context/ChatContext';
import './ChatLayout.css';

const ChatLayout = () => {
  const { error, setError } = useChat();

  return (
    <div className="chat-layout">
      <ChatSidebar />
      <ChatWindow />
      
      {/* Display global errors (separate from the sidebar's error display) */}
      <ErrorNotification 
        message={error} 
        onClose={() => setError(null)} 
        autoHideDuration={8000}
      />
    </div>
  );
};

export default ChatLayout; 