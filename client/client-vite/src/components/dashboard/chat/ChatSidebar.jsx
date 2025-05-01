import React from 'react';
import ChatAvatar from './ChatAvatar';

const ChatSidebar = ({
  chatListRef,
  showNewChat,
  setShowNewChat,
  searchTerm,
  handleSearch,
  isSearching,
  searchResults,
  handleStartConversation,
  handleProfileMouseEnter,
  handleProfileMouseLeave,
  loading,
  chats,
  currentUser,
  selectedChat,
  setSelectedChat
}) => {
    // Filter out chats with deleted users
  const validChats = chats.filter(chat => {
    // Check if the chat has at least two participants
    if (!chat.participants || chat.participants.length < 2) {
      return false;
    }
    
    // Check if the other user's information is complete
    const otherUser = chat.participants.find(p => p._id !== currentUser._id);
    return otherUser && otherUser._id && otherUser.name;
  });

  return (
    <div className="chat-sidebar" ref={chatListRef}>
      <div className="chat-search">
        <div className="chat-toolbar">
          <h3>Conversations</h3>
          <button 
            onClick={() => setShowNewChat(prev => !prev)}
            className="new-chat-button"
            aria-label="New conversation"
          >
            New
          </button>
        </div>
        
        {showNewChat && (
          <div className="chat-search-container">
            <input
              type="text"
              className="chat-search-input"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearch}
              aria-label="Search users"
            />
            
            {isSearching && searchResults.length > 0 && (
              <div className="chat-search-results">
                {searchResults.map(user => (
                  <div
                    key={user._id}
                    onClick={() => handleStartConversation(user._id)}
                    className="chat-search-item"
                    data-user-id={user._id}
                    onMouseEnter={(e) => handleProfileMouseEnter(user._id, e)}
                    onMouseLeave={() => handleProfileMouseLeave()}
                  >
                    <ChatAvatar user={user} />
                    <div 
                      className="chat-info"
                      data-user-id={user._id}
                      onMouseEnter={(e) => handleProfileMouseEnter(user._id, e)}
                      onMouseLeave={() => handleProfileMouseLeave()}
                    >
                      <div className="chat-name">{user.name}</div>
                      <div className="chat-preview">{user.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="chat-list">
        {loading && validChats.length === 0 ? (
          <div className="chat-empty">Loading conversations...</div>
        ) : validChats.length === 0 ? (
          <div className="chat-empty">
            <p>No conversations yet</p>
            <button 
              onClick={() => setShowNewChat(true)}
              className="dashboard-action-button"
            >
              Start a new conversation
            </button>
          </div>
        ) : (
          validChats.map(chat => {
            const otherUser = chat.participants.find(p => p._id !== currentUser._id);
            const lastMessageTime = chat.lastMessage?.createdAt 
              ? new Date(chat.lastMessage.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric'
                })
              : '';
            
            return (
              <div
                key={chat._id}
                className={`chat-item ${selectedChat === chat._id ? 'active' : ''}`}
                onClick={() => setSelectedChat(chat._id)}
                data-user-id={otherUser?._id}
                onMouseEnter={(e) => otherUser && handleProfileMouseEnter(otherUser._id, e)}
                onMouseLeave={() => handleProfileMouseLeave()}
              >
                <ChatAvatar 
                  user={otherUser} 
                  onMouseEnter={(e) => otherUser && handleProfileMouseEnter(otherUser._id, e)}
                  onMouseLeave={() => handleProfileMouseLeave()}
                />
                <div 
                  className="chat-info"
                  data-user-id={otherUser?._id} 
                >
                  <div 
                    className="chat-name"
                    onMouseEnter={(e) => otherUser && handleProfileMouseEnter(otherUser._id, e)}
                    onMouseLeave={() => handleProfileMouseLeave()}
                  >{otherUser?.name}</div>
                  <div className="chat-preview">
                    {chat.lastMessage?.content || 'No messages yet'}
                  </div>
                </div>
                <div className="chat-meta">
                  {lastMessageTime && (
                    <span className="chat-time">
                      {lastMessageTime}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;