import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import ProfileImageUploader from './ProfileImageUploader';
import './Profile.css';

const Profile = () => {
  const { user, loading, error, clientProfile, freelancerProfile, updateClientProfile, updateFreelancerProfile } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({ companyName: '', title: '', skills: '', bio: '', profileImage: null });
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  const getFullImageUrl = (imagePath) => imagePath?.startsWith('http')
    ? imagePath
    : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${imagePath}`;

  const loadProfile = useCallback(() => {
    if (!user) return;

    if (user.role === 'client' && clientProfile) {
      setFormData({
        companyName: clientProfile.companyName || '',
        title: clientProfile.title || '',
        skills: '',
        bio: clientProfile.bio || '',
        profileImage: null,
      });
      if (clientProfile.profileImage) {
        setImagePreview(getFullImageUrl(clientProfile.profileImage));
      } else {
        setImagePreview(null);
      }
      setRemoveImage(false);
    } else if (user.role === 'freelancer' && freelancerProfile) {
      setFormData({
        companyName: '',
        title: '',
        skills: freelancerProfile.skills || '',
        bio: freelancerProfile.bio || '',
        profileImage: null,
      });
      if (freelancerProfile.profileImage) {
        setImagePreview(getFullImageUrl(freelancerProfile.profileImage));
      } else {
        setImagePreview(null);
      }
      setRemoveImage(false);
    }
  }, [user, clientProfile, freelancerProfile]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageRemove = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, profileImage: null }));
    setRemoveImage(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');
  
    try {
      const dataToSend = new FormData();
      dataToSend.append('bio', formData.bio);
  
      if (user.role === 'client') {
        dataToSend.append('companyName', formData.companyName);
        dataToSend.append('title', formData.title);
      } else if (user.role === 'freelancer') {
        dataToSend.append('skills', formData.skills);
      }
  
      if (formData.profileImage) {
        dataToSend.append('profileImage', formData.profileImage);
      }
      
      // Only append removeImage if it's true
      if (removeImage) {
        dataToSend.append('removeImage', 'true');
      }
  
      if (user.role === 'client') {
        await updateClientProfile(dataToSend);
      } else {
        await updateFreelancerProfile(dataToSend);
      }
  
      setSuccess('Profile updated successfully!');
      loadProfile(); // Refresh data
    } catch (error) {
      console.error(error);
      setFormError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };
  


  if (!user) return <div className="profile-container">Loading profile...</div>;

  return (
    <div className="profile-container">
      <Card className="profile-card">
        <CardHeader>
          <CardTitle>{user.role === 'client' ? 'Client Profile' : 'Freelancer Profile'}</CardTitle>
          <CardDescription>
            {user.role === 'client' 
              ? 'Manage your client information and company details' 
              : 'Showcase your skills and expertise to potential clients'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && <div className="profile-error">{error}</div>}
          {formError && <div className="profile-error">{formError}</div>}
          {success && <div className="profile-success">{success}</div>}

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="profile-info">
              <div className="profile-header">
                <h2 className="profile-name">{user.name}</h2>
                <span className="profile-role">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
              </div>

              <ProfileImageUploader 
                imagePreview={imagePreview} 
                setImagePreview={setImagePreview} 
                setFormData={setFormData}
                onRemoveImage={handleImageRemove}
                type={user.role}
              />

              {user.role === 'client' && (
                <>
                  <div className="form-group">
                    <label htmlFor="companyName" className="form-label">Company/Business Name</label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleFormChange}
                      placeholder="Enter your company or business name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="title" className="form-label">Title/Position</label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleFormChange}
                      placeholder="Your position or title"
                    />
                  </div>
                </>
              )}

              {user.role === 'freelancer' && (
                <div className="form-group">
                  <label htmlFor="skills" className="form-label">Skills</label>
                  <Input
                    id="skills"
                    name="skills"
                    value={formData.skills}
                    onChange={handleFormChange}
                    placeholder="Your skills (separate with commas)"
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="bio" className="form-label">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  className="textarea-input"
                  value={formData.bio}
                  onChange={handleFormChange}
                  placeholder={user.role === 'client' ? "Tell us about your company or project needs" : "Tell clients about your experience and expertise"}
                  rows="4"
                />
              </div>

              <div className="profile-form-actions">
                <Button type="submit" className="profile-button" disabled={loading || isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
