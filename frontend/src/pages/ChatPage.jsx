import ChatLayout from '../components/chat/ChatLayout';
import { ChatProvider } from '../context/ChatContext';

const ChatPage = () => {
  return (
    <ChatProvider>
      <ChatLayout />
    </ChatProvider>
  );
};

export default ChatPage; 