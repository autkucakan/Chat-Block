import { createContext, useState, useContext, useEffect } from 'react';
import { getChats, getMessages, getUsers, deleteChat as apiDeleteChat } from '../api/api';
import { ChatWebSocket, StatusWebSocket } from '../api/websocket';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userStatuses, setUserStatuses] = useState({});
  const [chatSocket, setChatSocket] = useState(null);
  const [statusSocket, setStatusSocket] = useState(null);

  // Fetch chats when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchChats();
      fetchUsers();
      initStatusSocket();
    }
    return () => {
      if (statusSocket) {
        statusSocket.disconnect();
      }
    };
  }, [isAuthenticated]);

  // Initialize chat socket when activeChat changes
  useEffect(() => {
    if (activeChat && isAuthenticated) {
      fetchMessages(activeChat.id);
      initChatSocket(activeChat.id);
    }
    return () => {
      if (chatSocket) {
        chatSocket.disconnect();
      }
    };
  }, [activeChat, isAuthenticated]);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const response = await getChats();
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await getUsers(0, 100);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    setLoading(true);
    try {
      const response = await getMessages(chatId);
      // Sort messages by created_at from oldest to newest
      const sortedMessages = response.data.sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      );
      setMessages(sortedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (chatId) => {
    try {
      console.log(`Attempting to delete chat ${chatId}...`);
      
      // Optimistically update the UI first
      setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
      
      // If the active chat was deleted, clear it
      if (activeChat && activeChat.id === chatId) {
        setActiveChat(null);
        setMessages([]);
        if (chatSocket) {
          chatSocket.disconnect();
        }
      }
      
      // Then make the API call
      await apiDeleteChat(chatId);
      console.log(`Successfully deleted chat ${chatId}`);
      
      // Note: The backend should broadcast a chat.deleted event to all users
      // through the status websocket, which will update their chat list
      
      return true;
    } catch (error) {
      console.error('Error deleting chat:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('Error request:', error.request);
      }
      
      // Restore the deleted chat if the API call failed
      fetchChats();
      
      setError('Failed to delete chat. Check the console for details.');
      return false;
    }
  };

  const handleChatUpdate = (updateData) => {
    // This function handles chat update events from the websocket
    if (!updateData || !updateData.action) return;
    
    switch (updateData.action) {
      case 'chat.created':
        // Add the new chat to the list
        if (updateData.chat) {
          setChats(prevChats => {
            // Check if the chat already exists
            const exists = prevChats.some(chat => chat.id === updateData.chat.id);
            if (exists) return prevChats;
            return [...prevChats, updateData.chat];
          });
        }
        break;
        
      case 'chat.deleted':
        // Remove the chat from the list
        if (updateData.chat_id) {
          setChats(prevChats => prevChats.filter(chat => chat.id !== updateData.chat_id));
          
          // If it was the active chat, clear it
          if (activeChat && activeChat.id === updateData.chat_id) {
            setActiveChat(null);
            setMessages([]);
            if (chatSocket) {
              chatSocket.disconnect();
            }
          }
        }
        break;
        
      case 'chat.updated':
        // Update an existing chat
        if (updateData.chat) {
          setChats(prevChats => prevChats.map(chat => 
            chat.id === updateData.chat.id ? updateData.chat : chat
          ));
        }
        break;
        
      default:
        // Ignore unknown actions
        break;
    }
  };

  const initChatSocket = (chatId) => {
    if (chatSocket) {
      chatSocket.disconnect();
    }
    
    const newChatSocket = new ChatWebSocket(chatId, (message) => {
      // Append new message to the end of the array
      setMessages((prevMessages) => [...prevMessages, message]);
    });
    
    newChatSocket.connect();
    setChatSocket(newChatSocket);
  };

  const initStatusSocket = () => {
    if (statusSocket) {
      statusSocket.disconnect();
    }
    
    const newStatusSocket = new StatusWebSocket((update) => {
      // Handle different types of updates
      if (update.type === 'status') {
        // Handle user status updates
        setUserStatuses((prevStatuses) => ({
          ...prevStatuses,
          [update.user_id]: {
            status: update.status,
            lastSeen: update.last_seen
          }
        }));
      } else if (update.type === 'chat') {
        // Handle chat list updates
        handleChatUpdate(update);
      }
    });
    
    newStatusSocket.connect();
    setStatusSocket(newStatusSocket);
  };

  const sendMessage = (content) => {
    if (!activeChat || !chatSocket) {
      console.error('No active chat or socket connection');
      return;
    }
    
    chatSocket.sendMessage(content);
  };

  const setUserStatus = (status) => {
    if (!statusSocket) {
      console.error('No status socket connection');
      return;
    }
    
    statusSocket.updateStatus(status);
  };

  return (
    <ChatContext.Provider value={{
      chats,
      users,
      activeChat,
      setActiveChat,
      messages,
      loading,
      error,
      setError,
      userStatuses,
      sendMessage,
      setUserStatus,
      fetchChats,
      fetchUsers,
      fetchMessages,
      deleteChat
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext; 