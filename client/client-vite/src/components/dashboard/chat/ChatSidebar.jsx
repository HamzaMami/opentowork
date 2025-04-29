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
                    onMouseEnter={(e) => handleProfileMouseEnter(user._id, e)}
                    onMouseLeave={handleProfileMouseLeave}
                  >
                    <ChatAvatar 
                      user={user} 
                      onMouseEnter={handleProfileMouseEnter}
                      onMouseLeave={handleProfileMouseLeave}
                    />
                    <div className="chat-info">
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
        {loading && chats.length === 0 ? (
          <div className="chat-empty">Loading conversations...</div>
        ) : chats.length === 0 ? (
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
          chats.map(chat => {
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
                onMouseEnter={(e) => handleProfileMouseEnter(otherUser?._id, e)}
                onMouseLeave={handleProfileMouseLeave}
              >
                <ChatAvatar 
                  user={otherUser} 
                  onMouseEnter={handleProfileMouseEnter}
                  onMouseLeave={handleProfileMouseLeave}
                />
                <div className="chat-info">
                  <div className="chat-name">{otherUser?.name}</div>
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