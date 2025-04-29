import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { chatAPI, usersAPI } from '../../api';
import io from 'socket.io-client';

// CSS imports
import './DashboardBase.css';
import './ChatComponents.css';
import './ChatMessages.css';

// Component imports
import ChatSidebar from './chat/ChatSidebar';
import ChatHeader from './chat/ChatHeader';
import ChatMessageList from './chat/ChatMessageList';
import ChatInput from './chat/ChatInput';
import ProfileHoverCard from './chat/ProfileHoverCard';

// Socket.io connection - use environment variable or fallback
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Main Chat Component
const Chat = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedChatData, setSelectedChatData] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const [sending, setSending] = useState(false);
  const [profileHover, setProfileHover] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ top: 0, left: 0 });
  const profileTimeoutRef = useRef(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const chatContainerRef = useRef(null);
  const chatListRef = useRef(null);
  const socketRef = useRef(null);

  // Define scrollToBottom first to avoid the circular dependency
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    try {
      if (messagesEndRef.current) {
        console.log('Scrolling to bottom using messagesEndRef');
        messagesEndRef.current.scrollIntoView({ 
          behavior, 
          block: 'end',
          inline: 'nearest'
        });
      } else {
        // Fallback method if the ref isn't working
        if (chatContainerRef.current) {
          console.log('Scrolling to bottom using chatContainerRef');
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }
    } catch (scrollError) {
      console.error('Error scrolling to bottom:', scrollError);
      // Last resort fallback
      if (chatContainerRef.current) {
        setTimeout(() => {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }, 100);
      }
    }
  }, []);
  
  // Load chats when component mounts - optimized with pagination
  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      try {
        console.log('Fetching all chats...');
        const response = await chatAPI.getAllChats();
        console.log('Chats fetched successfully:', response.data);
        setChats(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching chats:', err);
        setError('Failed to load conversations. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (user?._id) {
      fetchChats();
    }
  }, [user]);
  
  // Load individual chat messages when chat is selected
  useEffect(() => {
    if (!selectedChat) return;
    
    const fetchChatData = async () => {
      setLoading(true);
      setPage(1); // Reset pagination
      setHasMore(true);
      
      try {
        console.log(`Fetching data for chat: ${selectedChat}`);
        const response = await chatAPI.getChatById(selectedChat);
        console.log('Chat data received:', response.data);
        
        // Verify messages structure
        if (response.data && response.data.messages) {
          console.log('Messages count:', response.data.messages.length);
          if (response.data.messages.length > 0) {
            console.log('First message sample:', response.data.messages[0]);
          }
          
          // Sort messages in chronological order (oldest to newest)
          response.data.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else {
          console.warn('No messages found in chat data');
        }
        
        setSelectedChatData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching chat data:', err);
        setError('Failed to load conversation. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchChatData();
  }, [selectedChat]);
  
  // Handle scrolling to unread messages or bottom of chat when data is loaded
  useEffect(() => {
    if (!selectedChatData || !chatContainerRef.current) return;
    
    // Wait a bit for the DOM to be fully rendered with messages
    setTimeout(() => {
      if (loadingMore) return; // Don't perform scroll during loading more messages
      
      const messages = selectedChatData.messages;
      if (!messages || messages.length === 0) return;
      
      // Find the first unread message not from the current user
      let firstUnreadIndex = -1;
      const unreadMessages = messages.filter((msg, index) => {
        if (!msg.read && msg.sender?._id !== user?._id) {
          if (firstUnreadIndex === -1) firstUnreadIndex = index;
          return true;
        }
        return false;
      });
      
      if (unreadMessages.length > 0 && firstUnreadIndex !== -1) {
        // Find the DOM element for the first unread message
        const messageElements = chatContainerRef.current.querySelectorAll('.chat-message');
        if (messageElements.length > firstUnreadIndex) {
          console.log('Scrolling to first unread message at index:', firstUnreadIndex);
          
          // Create a marker element for the first unread message
          const unreadMarker = document.createElement('div');
          unreadMarker.className = 'unread-messages-marker';
          unreadMarker.textContent = `${unreadMessages.length} unread messages`;
          
          // Insert the marker before the first unread message
          const firstUnreadElement = messageElements[firstUnreadIndex];
          if (firstUnreadElement && firstUnreadElement.parentNode) {
            // Remove any existing marker first
            const existingMarker = chatContainerRef.current.querySelector('.unread-messages-marker');
            if (existingMarker) existingMarker.remove();
            
            firstUnreadElement.parentNode.insertBefore(unreadMarker, firstUnreadElement);
          }
          
          // Scroll to the first unread message with some offset
          messageElements[firstUnreadIndex].scrollIntoView({ block: 'center' });
        }
      } else {
        // If no unread messages, scroll to bottom
        scrollToBottom('auto');
      }
    }, 300);
  }, [selectedChatData, loadingMore, user?._id, scrollToBottom]);
  
  // Scroll to bottom of messages when new messages arrive or chat changes
  useEffect(() => {
    if (selectedChatData?.messages?.length > 0 && !loadingMore) {
      // Use 'auto' instead of 'smooth' for initial load to avoid animation issues
      console.log('Messages changed, scrolling to bottom');
      scrollToBottom('auto');
    }
  }, [selectedChatData?.messages?.length, selectedChat, loadingMore, scrollToBottom]);

  // Define loadMoreMessages function before it's referenced in handleScroll
  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore || !selectedChat) return;
    
    setLoadingMore(true);
    
    // Remember current scroll height to maintain position after loading more messages
    const currentScrollHeight = chatContainerRef.current?.scrollHeight || 0;
    const currentScrollPosition = chatContainerRef.current?.scrollTop || 0;
    
    try {
      const nextPage = page + 1;
      const response = await chatAPI.getChatMessages(selectedChat, nextPage);
      
      if (!response.data.messages || response.data.messages.length === 0) {
        setHasMore(false);
      } else {
        // Sort older messages chronologically before adding them
        const olderMessages = [...response.data.messages].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        
        setSelectedChatData(prevData => ({
          ...prevData,
          messages: [...olderMessages, ...prevData.messages]
        }));
        setPage(nextPage);
        
        // Wait for DOM update after adding new messages
        setTimeout(() => {
          if (chatContainerRef.current) {
            // Calculate how much the content height has changed
            const newScrollHeight = chatContainerRef.current.scrollHeight;
            const scrollHeightDiff = newScrollHeight - currentScrollHeight;
            
            // Maintain scroll position by adjusting for the newly added content
            chatContainerRef.current.scrollTop = currentScrollPosition + scrollHeightDiff;
          }
        }, 50); // Increased timeout to ensure DOM is updated
      }
    } catch (err) {
      console.error('Error loading more messages:', err);
      setError('Failed to load more messages. Please try again.');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, selectedChat, page]);
  
  // Handle infinite scrolling for message history
  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current || loadingMore || !hasMore || !selectedChat) return;
    
    const { scrollTop } = chatContainerRef.current;
    
    // Load more messages when user scrolls near the top (within 50px)
    if (scrollTop <= 50) {
      loadMoreMessages();
    }
  }, [loadingMore, hasMore, selectedChat, loadMoreMessages]);

  // Add scroll event listener
  useEffect(() => {
    const currentChatContainer = chatContainerRef.current;
    if (currentChatContainer) {
      currentChatContainer.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (currentChatContainer) {
        currentChatContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll]);
  
  // Search for users - with debounce
  const handleSearch = useCallback(async (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (!value.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    try {
      const response = await usersAPI.getAll({
        search: value,
        role: user.role === 'client' ? 'freelancer' : 'client'
      });
      setSearchResults(response.data.users || []);
    } catch (err) {
      console.error('Error searching users:', err);
    }
  }, [user?.role]);
  
  // Start a new conversation with selected user
  const handleStartConversation = async (recipientId) => {
    try {
      // Create new chat
      const response = await chatAPI.createChat(recipientId);
      
      // Refresh chats list
      const chatsResponse = await chatAPI.getAllChats();
      setChats(chatsResponse.data);
      
      // Select the new chat
      setSelectedChat(response.data._id);
      
      // Reset UI state
      setShowNewChat(false);
      setSearchTerm('');
      setSearchResults([]);
      setIsSearching(false);
    } catch (err) {
      console.error('Error creating chat:', err);
      setError('Failed to start conversation. Please try again.');
    }
  };
  
  // Handle file attachment
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      // Validate file sizes
      const validFiles = newFiles.filter(file => file.size <= 5 * 1024 * 1024); // 5MB limit
      if (validFiles.length < newFiles.length) {
        setError('Some files were not added because they exceed the 5MB size limit.');
      }
      setAttachments(prevAttachments => [...prevAttachments, ...validFiles]);
    }
  };
  
  // Remove attachment
  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle sending a message with improved error handling
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!message.trim() && attachments.length === 0) || !selectedChat || sending) return;
    
    setSending(true);
    
    try {
      const formData = new FormData();
      formData.append('chatId', selectedChat);
      formData.append('content', message.trim());
      
      // Add attachments to formData
      attachments.forEach(file => {
        formData.append('attachments', file);
      });
      
      // Send message with attachments
      const response = await chatAPI.sendMessage(formData);
      
      // Validate the response has proper structure before updating UI
      const newMessage = response.data;
      if (!newMessage?.sender || typeof newMessage.sender !== 'object') {
        console.warn('Message received without proper sender information', newMessage);
        // Add sender info manually if needed
        newMessage.sender = {
          _id: user._id,
          name: user?.name || 'You'
        };
      }
      
      // Update local state with new message
      if (selectedChatData) {
        setSelectedChatData(prev => {
          const updatedData = {
            ...prev,
            messages: [...(prev?.messages || []), newMessage]
          };
          
          // Force immediate scroll to bottom after adding the message
          setTimeout(() => scrollToBottom('auto'), 10);
          return updatedData;
        });
      }
      
      // Update the preview text in the chat list
      setChats(prevChats => {
        if (!Array.isArray(prevChats)) return [];
        return prevChats.map(chat => {
          if (chat._id === selectedChat) {
            return {
              ...chat,
              lastMessage: {
                content: message || 'Sent an attachment',
                createdAt: new Date().toISOString(),
                sender: user?._id
              }
            };
          }
          return chat;
        });
      });
      
      // Clear form
      setMessage('');
      setAttachments([]);
      setError(null); // Clear any previous errors on success
    } catch (err) {
      console.error('Error details:', err?.response?.data || err?.message || err);
      setError(`Failed to send message: ${err?.response?.data?.message || err?.message || 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };
  
  // Calculate position for hover card based on element position
  const calculateHoverPosition = useCallback((element) => {
    if (!element) return { top: 0, left: 0 };
    
    const rect = element.getBoundingClientRect();
    const isRightSide = rect.left > window.innerWidth / 2;
    
    return {
      position: 'fixed',
      top: `${rect.bottom + 5}px`,
      left: isRightSide ? `${rect.right - 280}px` : `${rect.left}px`,
      zIndex: 1000
    };
  }, []);
  
  // Handle showing profile on hover
  const handleProfileMouseEnter = useCallback(async (userId, event) => {
    if (!userId) return;
    
    // Clear any existing timeout
    if (profileTimeoutRef.current) {
      clearTimeout(profileTimeoutRef.current);
    }
    
    // Set hover position immediately based on the event target
    if (event && event.currentTarget) {
      setHoverPosition(calculateHoverPosition(event.currentTarget));
    }
    
    // Set timeout to fetch and display profile info
    profileTimeoutRef.current = setTimeout(async () => {
      try {
        // Check if we already have this user's profile cached to avoid unnecessary requests
        if (userProfile && userProfile._id === userId) {
          // If we already have this profile, just show it
          setProfileHover(userId);
          return;
        }
        
        // For user privacy, only display profile info for participants in the current chat
        // instead of fetching user info for any arbitrary ID
        if (selectedChatData?.participants) {
          const participantData = selectedChatData.participants.find(p => p._id === userId);
          if (participantData) {
            setUserProfile(participantData);
            setProfileHover(userId);
            return;
          }
        }
        
        // As a fallback, try to fetch the user profile
        const response = await usersAPI.getById(userId);
        setUserProfile(response.data);
        setProfileHover(userId);
      } catch (err) {
        console.error('Error fetching profile:', err);
        // Show a minimal profile with data we have from the chat
        if (selectedChatData?.participants) {
          const participantData = selectedChatData.participants.find(p => p._id === userId);
          if (participantData) {
            setUserProfile(participantData);
            setProfileHover(userId);
          }
        }
      }
    }, 100); // Reduced timeout for better responsiveness
  }, [calculateHoverPosition, userProfile, selectedChatData]);
  
  // Handle hiding profile on mouse leave
  const handleProfileMouseLeave = useCallback(() => {
    // Clear any existing timeout
    if (profileTimeoutRef.current) {
      clearTimeout(profileTimeoutRef.current);
    }
    
    // Set timeout to allow moving to the profile card
    profileTimeoutRef.current = setTimeout(() => {
      setProfileHover(null);
    }, 200);
  }, []);
  
  // Format timestamp
  const formatMessageTime = useCallback((timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);
  
  // Generate preview for attachment
  const renderAttachmentPreview = useCallback((file, index) => {
    const isImage = file.type.startsWith('image/');
    if (isImage) {
      return (
        <div className="attachment-item" key={index}>
          <img 
            src={URL.createObjectURL(file)} 
            alt="attachment preview" 
            className="attachment-image"
          />
          <button 
            className="attachment-remove" 
            onClick={() => removeAttachment(index)}
            aria-label="Remove attachment"
          >
            ×
          </button>
        </div>
      );
    } else {
      return (
        <div className="attachment-item" key={index}>
          <div className="attachment-file">
            <span role="img" aria-label="attachment">📎</span>
            <span>{file.name}</span>
          </div>
          <button 
            className="attachment-remove" 
            onClick={() => removeAttachment(index)}
            aria-label="Remove attachment"
          >
            ×
          </button>
        </div>
      );
    }
  }, []);
  
  // Mark messages as read when they're viewed
  useEffect(() => {
    if (!selectedChat || !selectedChatData || !user) return;
    
    // Find all unread messages not from current user
    const unreadMessages = selectedChatData.messages.filter(
      msg => !msg.read && msg.sender._id !== user._id
    );
    
    if (unreadMessages.length === 0) return;
    
    // Mark messages as read
    const markMessagesAsRead = async () => {
      try {
        await chatAPI.markMessagesAsRead(selectedChat);
        
        // Update the local state to reflect read status
        setSelectedChatData(prev => ({
          ...prev,
          messages: prev.messages.map(msg => {
            if (!msg.read && msg.sender._id !== user._id) {
              return { ...msg, read: true };
            }
            return msg;
          })
        }));
        
        // Also update the unread counter in the chat list
        setChats(prevChats => {
          return prevChats.map(chat => {
            if (chat._id === selectedChat) {
              return {
                ...chat,
                unreadCount: 0
              };
            }
            return chat;
          });
        });
      } catch (err) {
        console.error('Error marking messages as read:', err);
      }
    };
    
    // Add a small delay to mark messages as read after they're viewed
    const readTimeout = setTimeout(markMessagesAsRead, 1000);
    
    return () => clearTimeout(readTimeout);
  }, [selectedChat, selectedChatData, user]);

  // Initialize Socket.IO connection with proper error handling
  useEffect(() => {
    if (!user?._id) return;

    console.log(`Attempting to connect to Socket.IO at ${SOCKET_URL}`);
    
    try {
      socketRef.current = io(SOCKET_URL, {
        query: { userId: user._id },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        transports: ['websocket', 'polling']
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to Socket.IO server');
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        // Don't show this error to the user unless chat functionality is critical
        // setError('Chat real-time updates unavailable. Please refresh the page.');
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from Socket.IO server');
      });

      socketRef.current.on('newMessage', (newMessage) => {
        console.log('New message received via Socket.IO:', newMessage);
        if (newMessage && newMessage.chatId === selectedChat) {
          setSelectedChatData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: [...(prev.messages || []), newMessage]
            };
          });
          
          // Scroll to bottom when receiving a new message, with null check
          setTimeout(() => scrollToBottom('auto'), 100);
        }
        
        // Update chat list with new message preview
        setChats(prevChats => {
          if (!Array.isArray(prevChats)) return prevChats;
          return prevChats.map(chat => {
            if (chat._id === newMessage?.chatId) {
              return {
                ...chat,
                lastMessage: {
                  content: newMessage.content || 'Sent an attachment',
                  createdAt: newMessage.createdAt,
                  sender: newMessage.sender?._id
                },
                unreadCount: chat._id === selectedChat ? 0 : (chat.unreadCount || 0) + 1
              };
            }
            return chat;
          });
        });
      });

      return () => {
        if (socketRef.current) {
          console.log('Cleaning up socket connection');
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    } catch (socketError) {
      console.error("Failed to initialize socket connection:", socketError);
      // Fail gracefully - chat will work without real-time updates
    }
  }, [user?._id, selectedChat, scrollToBottom]);

  // Handle deleting a message
  const handleDeleteMessage = useCallback(async (messageId) => {
    if (!selectedChat || !messageId) return;

    try {
      // Call API to delete the message
      await chatAPI.deleteMessage(selectedChat, messageId);
      
      // Update local state to remove the deleted message
      setSelectedChatData(prev => {
        if (!prev || !prev.messages) return prev;
        
        // Filter out the deleted message
        const updatedMessages = prev.messages.filter(msg => msg._id !== messageId);
        return {
          ...prev,
          messages: updatedMessages
        };
      });
      
      // Update the chat list if the deleted message was the last message
      setChats(prevChats => {
        if (!Array.isArray(prevChats)) return prevChats;
        
        return prevChats.map(chat => {
          if (chat._id === selectedChat) {
            // Get the current chat's messages after deletion
            const currentChat = selectedChatData;
            const updatedMessages = currentChat?.messages?.filter(msg => msg._id !== messageId) || [];
            
            // Find the new last message
            const newLastMessage = updatedMessages.length > 0 
              ? updatedMessages[updatedMessages.length - 1]
              : null;
            
            // Only update if we have a new last message
            if (newLastMessage) {
              return {
                ...chat,
                lastMessage: {
                  content: newLastMessage.content || (newLastMessage.attachments?.length ? 'Attachment' : ''),
                  createdAt: newLastMessage.createdAt,
                  sender: newLastMessage.sender?._id || newLastMessage.sender
                }
              };
            }
            
            // If no messages left, remove the last message
            return {
              ...chat,
              lastMessage: null
            };
          }
          return chat;
        });
      });
      
      // Show success notification (optional)
      console.log('Message deleted successfully');
      
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Failed to delete message. Please try again.');
    }
  }, [selectedChat, selectedChatData]);
  
  return (
    <div className="dashboard-chat">
      <h2 className="dashboard-section-title">Messages</h2>
      <div className="chat-container">
        {/* Chat Sidebar */}
        <ChatSidebar
          chatListRef={chatListRef}
          showNewChat={showNewChat}
          setShowNewChat={setShowNewChat}
          searchTerm={searchTerm}
          handleSearch={handleSearch}
          isSearching={isSearching}
          searchResults={searchResults}
          handleStartConversation={handleStartConversation}
          handleProfileMouseEnter={handleProfileMouseEnter}
          handleProfileMouseLeave={handleProfileMouseLeave}
          loading={loading}
          chats={chats}
          currentUser={user}
          selectedChat={selectedChat}
          setSelectedChat={setSelectedChat}
        />
        
        {/* Chat Content */}
        <div className="chat-content">
          {selectedChat && selectedChatData ? (
            <>
              {/* Chat Header */}
              <ChatHeader
                selectedChatData={selectedChatData}
                currentUserId={user._id}
                handleProfileMouseEnter={handleProfileMouseEnter}
                handleProfileMouseLeave={handleProfileMouseLeave}
              />
              
              {/* Chat Messages */}
              <div className="chat-messages" ref={chatContainerRef}>
                <ChatMessageList
                  messages={selectedChatData.messages}
                  currentUserId={user._id}
                  formatTime={formatMessageTime}
                  onProfileHover={handleProfileMouseEnter}
                  onProfileLeave={handleProfileMouseLeave}
                  loadingMore={loadingMore}
                  messagesEndRef={messagesEndRef}
                  onDeleteMessage={handleDeleteMessage}
                />
              </div>
              
              {/* Chat Input */}
              <ChatInput
                message={message}
                setMessage={setMessage}
                attachments={attachments}
                handleSendMessage={handleSendMessage}
                fileInputRef={fileInputRef}
                sending={sending}
                renderAttachmentPreview={renderAttachmentPreview}
                handleFileChange={handleFileChange}
              />
            </>
          ) : (
            <div className="chat-empty-state">
              <div>
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the list or start a new one</p>
                <button 
                  onClick={() => setShowNewChat(true)}
                  className="dashboard-action-button"
                >
                  Start a new conversation
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Profile hover card */}
      <ProfileHoverCard
        user={userProfile}
        isVisible={!!profileHover}
        position={hoverPosition}
        onMouseEnter={() => {
          if (profileTimeoutRef.current) {
            clearTimeout(profileTimeoutRef.current);
          }
        }}
        onMouseLeave={handleProfileMouseLeave}
      />
      
      {/* Error message display */}
      {error && (
        <div className="chat-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
    </div>
  );
};

export default Chat;