import React, { memo, useState, useEffect } from 'react';
import { usersAPI } from '../../../api';

const ProfileHoverCard = memo(({ user, isVisible, position, onMouseEnter, onMouseLeave }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    // Reset profile data when user changes
    if (user && user._id) {
      setProfileData(prev => {
        // Only reset if it's a different user
        if (!prev || prev._id !== user._id) {
          return null;
        }
        return prev;
      });
    }
  }, [user]);
  
  useEffect(() => {
    // Only attempt to fetch profile if the card is visible, we have a user with an ID, and we haven't already loaded or are loading
    if (isVisible && user && user._id && !profileData && !loading) {
      setLoading(true);
      
      usersAPI.getById(user._id)
        .then(response => {
          const userData = response.data;
          console.log('Fetched user data for hover card:', userData);
          
          // Store the entire user data including email, role, bio, etc.
          setProfileData(userData);
        })
        .catch(err => {
          console.error('Failed to fetch user profile for hover card:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [user, isVisible, profileData, loading]);
  
  // Don't render anything if the card should be invisible or there's no user data
  if (!user || !isVisible) return null;
  
  // Use profile data if available, fall back to the original user object
  const displayData = profileData || user;
  
  return (
    <div 
      className="profile-hover-card"
      style={position}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="profile-hover-header">
        <div className="profile-hover-avatar">
          {(profileData?.profileImage || displayData.profileImage) ? (
            <img 
              src={getImageUrl(profileData?.profileImage || displayData.profileImage)}
              alt={displayData.name} 
              loading="lazy"
              onError={(e) => {
                console.error('Error loading profile image');
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = `<div class="profile-avatar-placeholder">${displayData.name.charAt(0).toUpperCase()}</div>`;
              }}
            />
          ) : (
            <div className="profile-avatar-placeholder">
              {displayData.name ? displayData.name.charAt(0).toUpperCase() : '?'}
            </div>
          )}
        </div>
        <div className="profile-hover-name">{displayData.name}</div>
      </div>
      <div className="profile-hover-info">
        {displayData.email && (
          <div className="profile-hover-item">
            <span className="profile-hover-label">Email:</span>
            <span>{displayData.email}</span>
          </div>
        )}
        {displayData.role && (
          <div className="profile-hover-item">
            <span className="profile-hover-label">Role:</span>
            <span style={{ textTransform: 'capitalize' }}>{displayData.role}</span>
          </div>
        )}
        {displayData.bio && (
          <div className="profile-hover-item">
            <span className="profile-hover-label">Bio:</span>
            <span>{displayData.bio}</span>
          </div>
        )}
      </div>
      {loading && <div className="profile-hover-loading">Loading profile...</div>}
    </div>
  );
});

// Helper function to construct image URLs
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

export default ProfileHoverCard;