import { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { createChat } from '../../api/api';
import ErrorNotification from '../common/ErrorNotification';
import './ChatSidebar.css';

const ChatSidebar = () => {
  const { currentUser, logout } = useAuth();
  const { 
    chats, 
    users, 
    setActiveChat, 
    activeChat,
    userStatuses,
    fetchChats,
    deleteChat,
    error
  } = useChat();
  
  const [showUsers, setShowUsers] = useState(false);
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [localError, setLocalError] = useState(null);
  const [currentUsername, setCurrentUsername] = useState('');

  const handleChatSelect = (chat) => {
    setActiveChat(chat);
  };

  const handleUserSelect = (user) => {
    // Find existing direct chat with this user
    const existingChat = chats.find(chat => 
      !chat.is_group_chat && chat.users.some(u => u.id === user.id)
    );

    if (existingChat) {
      setActiveChat(existingChat);
    } else {
      // Create new direct chat
      createNewChat(user.id, false, `Chat with ${user.username}`);
    }
  };

  const toggleUserSelection = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const createNewChat = async (userId, isGroup, name) => {
    try {
      let userIds = isGroup ? selectedUsers : [userId];
      
      const response = await createChat({
        name,
        is_group_chat: isGroup,
        user_ids: userIds
      });
      
      await fetchChats();
      setActiveChat(response.data);
      
      // Reset form state
      setGroupName('');
      setSelectedUsers([]);
      setShowNewGroupForm(false);
    } catch (error) {
      console.error('Error creating chat:', error);
      setLocalError('Failed to create chat. Please try again.');
    }
  };

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (groupName.trim() && selectedUsers.length > 0) {
      createNewChat(null, true, groupName);
    }
  };

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation(); // Prevent chat selection when clicking delete
    
    // Use a more complete confirmation dialog
    if (window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      try {
        // Show a temporary "deleting" message
        setLocalError('Deleting chat...');
        
        const success = await deleteChat(chatId);
        
        if (success) {
          setLocalError(null);
        } else {
          setLocalError('Error deleting chat. Please try again later.');
        }
      } catch (err) {
        console.error('Error in delete handler:', err);
        setLocalError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const getUserStatusClass = (userId) => {
    const userStatus = userStatuses[userId]?.status;
    if (!userStatus) return 'status-offline';
    
    return `status-${userStatus.toLowerCase()}`;
  };

  // Find current username when users list loads
  useEffect(() => {
    if (currentUser && users.length > 0) {
      const userObject = users.find(user => user.id === currentUser.id);
      if (userObject) {
        setCurrentUsername(userObject.username);
      }
    }
  }, [currentUser, users]);

  return (
    <div className="chat-sidebar">
      <div className="sidebar-header">
        <h2>Chat Block</h2>
        <div className="user-info">
          <span>Logged in as: {currentUsername || `User ${currentUser?.id}`}</span>
          {console.log()}
          <button onClick={logout} className="logout-button">Logout</button>
        </div>
      </div>
      
      <div className="tabs">
        <button 
          className={`tab-button ${!showUsers ? 'active' : ''}`} 
          onClick={() => setShowUsers(false)}
        >
          Chats
        </button>
        <button 
          className={`tab-button ${showUsers ? 'active' : ''}`} 
          onClick={() => setShowUsers(true)}
        >
          Users
        </button>
      </div>
      
      {!showUsers ? (
        <div className="chats-container">
          <div className="section-header">
            <h3>Your Chats</h3>
            <button 
              className="new-group-button" 
              onClick={() => setShowNewGroupForm(!showNewGroupForm)}
            >
              {showNewGroupForm ? 'Cancel' : 'New Group'}
            </button>
          </div>
          
          {showNewGroupForm && (
            <form onSubmit={handleCreateGroup} className="new-group-form">
              <input
                type="text"
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />
              <div className="user-selection">
                <p>Select users:</p>
                {users
                  .filter(user => user.id !== currentUser?.id)
                  .map(user => (
                    <div key={user.id} className="user-checkbox">
                      <input
                        type="checkbox"
                        id={`user-${user.id}`}
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                      />
                      <label htmlFor={`user-${user.id}`}>{user.username}</label>
                    </div>
                  ))
                }
              </div>
              <button type="submit" disabled={!groupName || selectedUsers.length === 0}>
                Create Group
              </button>
            </form>
          )}
          
          <div className="chat-list">
            {chats.length === 0 ? (
              <p className="no-chats">No chats yet. Start a conversation!</p>
            ) : (
              chats.map(chat => (
                <div 
                  key={chat.id} 
                  className={`chat-item ${activeChat?.id === chat.id ? 'active' : ''}`}
                  onClick={() => handleChatSelect(chat)}
                >
                  <div className="chat-item-avatar">
                    {chat.is_group_chat ? (
                      <span className="group-avatar">G</span>
                    ) : (
                      <span className="user-avatar">U</span>
                    )}
                  </div>
                  <div className="chat-item-details">
                    <h4>{chat.name}</h4>
                    <p className="chat-preview">
                      {chat.is_group_chat 
                        ? `${chat.users.length} members` 
                        : 'Direct message'
                      }
                    </p>
                  </div>
                  <button 
                    className="delete-chat-button"
                    onClick={(e) => handleDeleteChat(e, chat.id)}
                    title="Delete chat"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="users-container">
          <h3>All Users</h3>
          <div className="user-list">
            {users
              .filter(user => user.id !== currentUser?.id)
              .map(user => (
                <div 
                  key={user.id} 
                  className="user-item"
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="user-item-avatar">
                    <span className="user-avatar">U</span>
                    <span className={`status-indicator ${getUserStatusClass(user.id)}`}></span>
                  </div>
                  <div className="user-item-details">
                    <h4>{user.username}</h4>
                    <p className="user-status">
                      {userStatuses[user.id]?.status || 'Offline'}
                    </p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
      
      {/* Error notification */}
      <ErrorNotification 
        message={localError || error}
        onClose={() => setLocalError(null)}
      />
    </div>
  );
};

export default ChatSidebar; 