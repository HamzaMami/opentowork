import React from 'react';
import ChatAvatar from './ChatAvatar';

const ChatHeader = ({ 
  selectedChatData, 
  currentUserId, 
  handleProfileMouseEnter, 
  handleProfileMouseLeave 
}) => {
  if (!selectedChatData) return null;

  const otherUser = selectedChatData.participants.find(p => p._id !== currentUserId);
  
  return (
    <div className="chat-header">
      <div className="chat-header-info">
        <ChatAvatar 
          user={otherUser} 
          onMouseEnter={handleProfileMouseEnter}
          onMouseLeave={handleProfileMouseLeave}
        />
        <div>
          <div className="chat-contact-name">{otherUser?.name}</div>
          <div className="chat-status">
            {otherUser?.isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;