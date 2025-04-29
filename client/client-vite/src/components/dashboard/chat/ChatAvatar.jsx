import React, { memo, useState, useEffect } from 'react';
import { usersAPI } from '../../../api';

const ChatAvatar = memo(({ user, onMouseEnter, onMouseLeave }) => {
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    if (!user) return;
    
    // Reset state for new user
    setError(false);
    
    // Check if user already has profileImage directly
    if (user.profileImage) {
      setProfileImage(user.profileImage);
      return;
    }
    
    // Only fetch if we have a user ID and no profile image yet
    if (user._id && !profileImage && !loading && !error) {
      setLoading(true);
      
      usersAPI.getById(user._id)
        .then(response => {
          // Check if response has profileImage
          if (response.data && response.data.profileImage) {
            console.log('Found profile image for', user.name, ':', response.data.profileImage);
            setProfileImage(response.data.profileImage);
          } else {
            console.log('No profile image found for', user.name);
            setError(true);
          }
        })
        .catch(err => {
          console.error('Failed to fetch user profile:', err);
          setError(true);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [user, profileImage, loading, error]);
  
  if (!user) return <div className="chat-avatar-placeholder">?</div>;
  
  return (
    <div 
      className="chat-avatar"
      onMouseEnter={onMouseEnter ? (e) => onMouseEnter(user._id, e) : undefined}
      onMouseLeave={onMouseLeave}
    >
      {profileImage && !error ? (
        <img 
          src={getImageUrl(profileImage)} 
          alt={user.name || 'User'} 
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          onError={() => {
            console.error('Error loading image:', profileImage);
            setError(true);
          }}
        />
      ) : (
        <div className="chat-avatar-placeholder">
          {user.name ? user.name.charAt(0).toUpperCase() : '?'}
        </div>
      )}
    </div>
  );
});

// Helper function to get the full image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL, use it as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Make sure path starts with a slash
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  // Construct full URL with base API URL
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${baseUrl}${normalizedPath}`;
};

export default ChatAvatar;