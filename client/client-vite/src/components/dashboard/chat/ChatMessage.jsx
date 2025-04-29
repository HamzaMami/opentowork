import React, { memo, useState } from 'react';
import '../ChatMessages.css';

// Memoized message component for better performance
const ChatMessage = memo(({ message, currentUserId, formatTime, onProfileHover, onProfileLeave, onDeleteMessage }) => {
  const [showOptions, setShowOptions] = useState(false);
  
  // Extra validation for the message structure
  if (!message) {
    console.error('Received null or undefined message');
    return null;
  }

  // Check if message has sender property
  if (!message.sender) {
    console.error('Message has no sender property:', message);
    return (
      <div className="chat-message error">
        <div className="chat-message-content">
          <p>Error displaying message</p>
        </div>
      </div>
    );
  }

  // Handle different sender structures (populated or unpopulated)
  let senderId;
  let senderName;
  
  if (typeof message.sender === 'object') {
    senderId = message.sender._id;
    senderName = message.sender.name;
  } else {
    // If sender is just an ID string
    senderId = message.sender;
    senderName = 'Unknown User';
  }
  
  const isSender = senderId === currentUserId;
  
  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this message?')) {
      onDeleteMessage(message._id);
    }
    setShowOptions(false);
  };

  return (
    <div 
      className={`chat-message ${isSender ? 'sent' : 'received'}`}
      onMouseEnter={() => isSender && setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      {!isSender && (
        <div 
          className="chat-message-sender"
          onMouseEnter={(e) => onProfileHover(senderId, e)}
          onMouseLeave={onProfileLeave}
        >
          {senderName}
        </div>
      )}
      <div className="chat-message-content">
        {message.content && message.content !== '[Attachment]' && <p>{message.content}</p>}
        {message.attachments && message.attachments.length > 0 && (
          <div className="attachment-preview">
            {message.attachments.map((attachment, index) => {
              const isImage = attachment.mimetype?.startsWith('image/');
              
              // Improved attachment URL construction
              let fileUrl;
              if (attachment.url.startsWith('http')) {
                fileUrl = attachment.url;
              } else {
                // Ensure the URL starts with a proper base path
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                // Clean the URL path to avoid double slashes
                const cleanPath = attachment.url.replace(/^\/+|\/+$/g, '');
                fileUrl = `${baseUrl}/${cleanPath}`;
              }
              
              return (
                <div key={index} className="attachment-item">
                  {isImage ? (
                    <img 
                      src={fileUrl} 
                      alt="attachment" 
                      className="attachment-image"
                      loading="lazy"
                      onClick={() => window.open(fileUrl, '_blank')}
                    />
                  ) : (
                    <a 
                      href={fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="attachment-file"
                    >
                      <span role="img" aria-label="attachment">📎</span>
                      <span>{attachment.originalFilename || 'Download file'}</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="chat-message-footer">
        <div className="chat-message-time">
          {message.createdAt ? formatTime(message.createdAt) : ''}
        </div>
        
        {/* Message options for sender */}
        {isSender && showOptions && (
          <button 
            className="message-delete-btn"
            onClick={handleDelete}
            title="Delete message"
          >
            <i className="fas fa-trash-alt"></i>
          </button>
        )}
      </div>
    </div>
  );
});

export default ChatMessage;