import React from 'react';

const ChatInput = ({
  message,
  setMessage,
  attachments,
  handleSendMessage,
  fileInputRef,
  sending,
  renderAttachmentPreview,
  handleFileChange
}) => {
  return (
    <form className="chat-input" onSubmit={handleSendMessage}>
      {attachments.length > 0 && (
        <div className="attachment-preview">
          {attachments.map((file, index) => renderAttachmentPreview(file, index))}
        </div>
      )}
      
      <div className="chat-input-container">
        <button 
          type="button"
          className="chat-attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          title="Attach files"
          aria-label="Attach files"
        >
          📎
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
          multiple
          accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        />
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={sending}
          className="chat-message-input"
        />
        <button 
          type="submit" 
          className="chat-send-btn"
          disabled={(!message.trim() && attachments.length === 0) || sending}
          aria-label="Send message"
        >
          Send
        </button>
      </div>
    </form>
  );
};

export default ChatInput;