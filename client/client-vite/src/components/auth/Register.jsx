import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import './Auth.css';

const Register = () => {
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [formError, setFormError] = useState('');
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    try {
      // Remove confirmPassword before sending to API
      const {  ...userData } = formData;
      await register(userData);
      navigate('/profile');
    } catch (error) {
      setFormError(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  };
  
  return (
    <div className="auth-container">
      <Card className="auth-card">
        <CardHeader>
          <CardTitle className="auth-title">Create Your Account</CardTitle>
          <CardDescription>Join our platform and start exploring opportunities</CardDescription>
        </CardHeader>
        
        <CardContent>
          {(formError || error) && (
            <div className="auth-error">
              {formError || error}
            </div>
          )}
          
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
              <label htmlFor="password" className="form-label">Password</label>
              <Input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Create a password"
                minLength="6"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <Input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
                minLength="6"
              />
            </div>
            
            <Button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Register'}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="auth-footer">
          <p>
            Already have an account? <Link to="/login" className="auth-link">Login</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;