import React, { useEffect } from 'react';
import ChatMessage from './ChatMessage';
import '../ChatMessages.css';

const ChatMessageList = ({ 
  messages, 
  currentUserId, 
  formatTime, 
  onProfileHover, 
  onProfileLeave, 
  loadingMore, 
  messagesEndRef,
  onDeleteMessage
}) => {
  // Group messages and filter out any invalid ones
  const groupMessagesByDate = (msgs) => {
    if (!msgs || msgs.length === 0) return [];
    
    const groups = [];
    let currentDate = null;
    let currentGroup = [];
    
    msgs.forEach(message => {
      if (!message.createdAt) {
        console.warn('Message missing createdAt:', message);
        return; // Skip this message
      }
      
        // Format date consistently as YYYY-MM-DD for comparison
      const messageDate = new Date(message.createdAt).toLocaleDateString('en-CA');
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({
            date: currentDate,
            displayDate: new Date(currentGroup[0].createdAt).toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            messages: currentGroup
          });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });
    
    // Add the last group
    if (currentGroup.length > 0) {
      groups.push({
        date: currentDate,
        displayDate: new Date(currentGroup[0].createdAt).toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        messages: currentGroup
      });
    }
    
    return groups;
  };
  
  // Moved validation below the function definition so hooks are always called in the same order
  const validMessages = Array.isArray(messages) ? messages : [];
  const messageGroups = groupMessagesByDate(validMessages);
  
  // Log messages length for debugging - now always called regardless of message validity
  useEffect(() => {
    console.log(`Rendering ${validMessages.length} messages, ${messageGroups.length} groups`);
  }, [validMessages.length, messageGroups.length]);
  
  // Display loading indicator for messages
  const renderLoadingIndicator = () => (
    <div className="loading-messages">
      <div className="loading-spinner"></div>
    </div>
  );
  
  // If messages array is invalid, show empty state
  if (!messages || !Array.isArray(messages)) {
    console.error('Invalid messages data:', messages);
    return (
      <div className="chat-message-list">
        <div className="chat-empty">No messages available</div>
      </div>
    );
  }
  
  // Display today, yesterday or the actual date
  const formatDisplayDate = (dateStr) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const messageDate = new Date(dateStr);
    
    // Format for comparison (remove time)
    const todayFormatted = today.toLocaleDateString('en-CA');
    const yesterdayFormatted = yesterday.toLocaleDateString('en-CA');
    const messageDateFormatted = messageDate.toLocaleDateString('en-CA');
    
    if (messageDateFormatted === todayFormatted) {
      return 'Today';
    } else if (messageDateFormatted === yesterdayFormatted) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };
  
  return (
    <div className="chat-message-list">
      {loadingMore && renderLoadingIndicator()}
      
      {validMessages.length === 0 ? (
        <div className="chat-empty">
          No messages yet. Start the conversation!
        </div>
      ) : messageGroups.length === 0 ? (
        <div className="chat-empty">
          Unable to display messages. There might be an issue with the message data.
        </div>
      ) : (
        <>
          {messageGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="message-group">
              <div className="chat-date-divider">
                <span>{formatDisplayDate(group.messages[0].createdAt)}</span>
              </div>
              <div className="message-group-content">
                {group.messages.map(message => (
                  <ChatMessage 
                    key={message._id || `msg-${groupIndex}-${Math.random()}`}
                    message={message}
                    currentUserId={currentUserId}
                    formatTime={formatTime}
                    onProfileHover={onProfileHover}
                    onProfileLeave={onProfileLeave}
                    onDeleteMessage={onDeleteMessage}
                  />
                ))}
              </div>
            </div>
          ))}
          
          {/* Message end marker - positioned after the last message */}
          <div 
            ref={messagesEndRef} 
            style={{ 
              height: '1px', 
              width: '100%',
              marginTop: '16px',
              float: 'left',
              clear: 'both'
            }} 
            className="message-end-marker"
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );
};

export default ChatMessageList;