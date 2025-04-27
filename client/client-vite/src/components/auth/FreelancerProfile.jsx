import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import './Auth.css';

const FreelancerProfile = () => {
  const { user, updateProfile, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    skills: '',
    bio: '',
    hourlyRate: '',
    experience: '',
    education: '',
    portfolio: ''
  });
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Set form data when user data is available
  useEffect(() => {
    if (user) {
      // Handle existing profile data if available
      setFormData({
        title: user.title || '',
        skills: user.skills?.join(', ') || '',
        bio: user.bio || '',
        hourlyRate: user.hourlyRate || '',
        experience: user.experience || '',
        education: user.education || '',
        portfolio: user.portfolio || ''
      });
    }
  }, [user]);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccess('');
    
    try {
      // Process skills as an array
      const profileData = {
        ...formData,
        skills: formData.skills.split(',').map(skill => skill.trim())
      };
      
      await updateProfile(profileData);
      setSuccess('Professional profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      setFormError(error.response?.data?.message || 'Profile update failed. Please try again.');
    }
  };
  
  // Verify user is a freelancer
  if (!user || user.role !== 'freelancer') {
    return <div className="auth-container">Access denied. This page is only for freelancers.</div>;
  }
  
  if (loading) {
    return <div className="auth-container">Loading profile...</div>;
  }
  
  return (
    <div className="auth-container">
      <Card className="auth-card">
        <CardHeader>
          <CardTitle className="auth-title">Professional Profile</CardTitle>
          <CardDescription>Showcase your skills and experience to potential clients</CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && <div className="auth-error">{error}</div>}
          {formError && <div className="auth-error">{formError}</div>}
          {success && <div className="auth-success">{success}</div>}
          
          <div className="profile-info">
            {!isEditing ? (
              <>
                <div className="freelancer-profile-view">
                  <div className="freelancer-header">
                    <h2 className="freelancer-name">{user.name}</h2>
                    {formData.title && <h3 className="freelancer-title">{formData.title}</h3>}
                  </div>
                  
                  {formData.bio && (
                    <div className="freelancer-section">
                      <h4 className="section-title">About Me</h4>
                      <p className="freelancer-bio">{formData.bio}</p>
                    </div>
                  )}
                  
                  {formData.skills && (
                    <div className="freelancer-section">
                      <h4 className="section-title">Skills</h4>
                      <div className="freelancer-skills">
                        {formData.skills.split(',').map((skill, index) => (
                          <span key={index} className="skill-tag">{skill.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {formData.hourlyRate && (
                    <div className="freelancer-section">
                      <h4 className="section-title">Hourly Rate</h4>
                      <p className="freelancer-rate">${formData.hourlyRate}/hr</p>
                    </div>
                  )}
                  
                  {formData.experience && (
                    <div className="freelancer-section">
                      <h4 className="section-title">Experience</h4>
                      <p className="freelancer-experience">{formData.experience}</p>
                    </div>
                  )}
                  
                  {formData.education && (
                    <div className="freelancer-section">
                      <h4 className="section-title">Education</h4>
                      <p className="freelancer-education">{formData.education}</p>
                    </div>
                  )}
                  
                  {formData.portfolio && (
                    <div className="freelancer-section">
                      <h4 className="section-title">Portfolio</h4>
                      <a href={formData.portfolio} target="_blank" rel="noopener noreferrer" className="freelancer-portfolio">
                        {formData.portfolio}
                      </a>
                    </div>
                  )}
                  
                  <div className="profile-actions">
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      className="profile-button"
                    >
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="title" className="form-label">Professional Title</label>
                  <Input
                    id="title"
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Senior Web Developer"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="skills" className="form-label">Skills</label>
                  <Input
                    id="skills"
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="e.g., JavaScript, React, Node.js"
                  />
                  <small className="form-hint">Separate skills with commas</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="bio" className="form-label">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    className="textarea-input"
                    rows="4"
                    placeholder="Tell clients about yourself"
                  ></textarea>
                </div>
                
                <div className="form-group">
                  <label htmlFor="hourlyRate" className="form-label">Hourly Rate (USD)</label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleChange}
                    min="1"
                    placeholder="e.g., 25"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="experience" className="form-label">Experience</label>
                  <textarea
                    id="experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="textarea-input"
                    rows="3"
                    placeholder="Describe your professional experience"
                  ></textarea>
                </div>
                
                <div className="form-group">
                  <label htmlFor="education" className="form-label">Education</label>
                  <textarea
                    id="education"
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    className="textarea-input"
                    rows="2"
                    placeholder="List your educational background"
                  ></textarea>
                </div>
                
                <div className="form-group">
                  <label htmlFor="portfolio" className="form-label">Portfolio URL</label>
                  <Input
                    id="portfolio"
                    type="url"
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleChange}
                    placeholder="e.g., https://myportfolio.com"
                  />
                </div>
                
                <div className="profile-form-actions">
                  <Button
                    type="submit"
                    className="profile-button"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Profile'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="profile-button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormError('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FreelancerProfile;