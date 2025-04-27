import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import './Auth.css';

const AccountSettings = () => {
  const { user, updateProfile, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Set form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        username: user.username || '',
        password: '',
        confirmPassword: '',
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
    
    // Validate password match if provided
    if (formData.password && formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    try {
      // Only include password if it was changed
      const updateData = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
      };
      
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      await updateProfile(updateData);
      setSuccess('Account settings updated successfully');
      setIsEditing(false);
      
      // Clear password fields
      setFormData({
        ...formData,
        password: '',
        confirmPassword: '',
      });
    } catch (error) {
      setFormError(error.response?.data?.message || 'Update failed. Please try again.');
    }
  };

  if (!user) {
    return <div className="auth-container">Loading account settings...</div>;
  }
  
  return (
    <div className="auth-container">
      <Card className="auth-card">
        <CardHeader>
          <CardTitle className="auth-title">Account Settings</CardTitle>
          <CardDescription>Manage your personal information and password</CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && <div className="auth-error">{error}</div>}
          {formError && <div className="auth-error">{formError}</div>}
          {success && <div className="auth-success">{success}</div>}
          
          <div className="profile-info">
            <div className="profile-header">
              <h2 className="profile-name">{user.name}</h2>
              <span className="profile-role">{user.role}</span>
            </div>
            
            {!isEditing ? (
              <>
                <div className="profile-details">
                  <div className="profile-detail">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{user.email}</span>
                  </div>
                  <div className="profile-detail">
                    <span className="detail-label">Username:</span>
                    <span className="detail-value">{user.username}</span>
                  </div>
                </div>
                
                <div className="profile-actions">
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="profile-button"
                  >
                    Edit Account
                  </Button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Full Name</label>
                  <Input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="username" className="form-label">Username</label>
                  <Input
                    id="username"
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder="Enter your username"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email</label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    New Password <span className="optional-text">(optional)</span>
                  </label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter new password"
                    minLength="6"
                  />
                </div>
                
                {formData.password && (
                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm new password"
                      minLength="6"
                    />
                  </div>
                )}
                
                <div className="profile-form-actions">
                  <Button
                    type="submit"
                    className="profile-button"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="profile-button"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset form to original values
                      if (user) {
                        setFormData({
                          name: user.name || '',
                          email: user.email || '',
                          username: user.username || '',
                          password: '',
                          confirmPassword: '',
                        });
                      }
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

export default AccountSettings;