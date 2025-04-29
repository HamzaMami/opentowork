import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * A wrapper component for routes that require authentication
 * If user is not authenticated, redirects to login page
 * Supports both direct children and render function patterns
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return <div className="auth-container">Loading...</div>;
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If children is a function, call it with the auth context
  if (typeof children === 'function') {
    return children({ user, loading });
  }
  
  // Otherwise render children directly
  return children;
};

export default ProtectedRoute;