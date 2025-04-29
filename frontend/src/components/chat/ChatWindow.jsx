import { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { markMessagesAsRead } from '../../api/api';
import './ChatWindow.css';

const ChatWindow = () => {
  const { activeChat, messages, sendMessage, loading } = useChat();
  const { currentUser } = useAuth();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (activeChat) {
      markAsRead();
    }
  }, [activeChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && activeChat) {
      sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const markAsRead = async () => {
    try {
      await markMessagesAsRead(activeChat.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!activeChat) {
    return (
      <div className="chat-window empty-state">
        <div className="empty-state-content">
          <h3>Select a chat to start messaging</h3>
          <p>Choose from your existing conversations or start a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>{activeChat.name}</h3>
        <div className="chat-info">
          {activeChat.is_group_chat ? (
            <span>{activeChat.users.length} members</span>
          ) : (
            <span>Direct Message</span>
          )}
        </div>
      </div>

      <div className="messages-container">
        {loading ? (
          <div className="loading-messages">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="empty-messages">
            <p>No messages yet</p>
            <p>Send a message to start the conversation</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.user_id === currentUser?.id ? 'sent' : 'received'}`}
              >
                <div className="message-content">
                  {message.content}
                </div>
                <div className="message-info">
                  <span className="message-time">{formatTime(message.created_at)}</span>
                  {message.user_id === currentUser?.id && (
                    <span className="message-status">
                      {message.is_read ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <form className="message-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Type a message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={!inputMessage.trim() || loading}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWindow; 