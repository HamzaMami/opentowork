import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import './Auth.css';

const Login = () => {
  const { login, loading, error, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [formError, setFormError] = useState('');
  
  // Check if user is already logged in and redirect if needed
  useEffect(() => {
    if (user) {
      console.log('User already logged in, redirecting to dashboard...', user);
      redirectBasedOnRole(user.role);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  
  const redirectBasedOnRole = (role) => {
    // Get the intended destination from location state or use role-based default
    const from = location.state?.from || `/dashboard/${role}`;
    console.log(`Redirecting to: ${from}`);
    navigate(from, { replace: true });
  };
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    try {
      console.log('Attempting login with:', { email: formData.email });
      const userData = await login(formData.email, formData.password);
      
      console.log('Login successful, user data:', userData);
      
      // Redirect based on user role
      redirectBasedOnRole(userData.role);
    } catch (error) {
      console.error('Login error:', error);
      
      // More detailed error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response from server:', error.response.data);
        setFormError(error.response.data.message || 'Invalid credentials. Please try again.');
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        setFormError('No response from server. Please check your internet connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
        setFormError('An error occurred during login. Please try again.');
      }
    }
  };
  
  // Handle enter key press for form submission
  // eslint-disable-next-line no-unused-vars
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };
  
  return (
    <div className="auth-container">
      <Card className="auth-card">
        <CardHeader>
          <CardTitle className="auth-title">Login to Your Account</CardTitle>
          <CardDescription>Enter your email and password to access your account</CardDescription>
        </CardHeader>
        
        <CardContent>
          {(formError || error) && (
            <div className="auth-error">
              {formError || error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="auth-form">
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
              <div className="password-label-row">
                <label htmlFor="password" className="form-label">Password</label>
                <Link to="/forgot-password" className="forgot-password">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
              />
            </div>
            
            <Button 
              type="submit" 
              className="auth-button"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="auth-footer">
          <p>
            Don't have an account? <Link to="/register" className="auth-link">Register</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;