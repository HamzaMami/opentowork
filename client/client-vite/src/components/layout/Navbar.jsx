import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import './Navbar.css';

function Navbar() {
  const { user, logout, clientProfile, freelancerProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const getProfileImage = () => {
    if (!user) return null;
    const profile = user.role === 'client' ? clientProfile : freelancerProfile;
    if (!profile?.profileImage) return null;

    return profile.profileImage.startsWith('http') 
      ? profile.profileImage 
      : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${profile.profileImage}`;
  };

  const isActive = (path) => {
    return location.pathname === path ? 'navbar-link-active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <div className="navbar-left">
            <Link to="/" className="navbar-logo">
              <span>OpenToWork</span>
            </Link>
          </div>
          
          <div className="navbar-right">
            <div className="navbar-links">
              <Link to="/" className={`navbar-link ${isActive('/')}`}>
                Home
              </Link>
              <Link to="/about" className={`navbar-link ${isActive('/about')}`}>
                About
              </Link>
              <Link to="/jobs" className={`navbar-link ${isActive('/jobs')}`}>
                Jobs
              </Link>
              {user && (
                <Link to="/profile" className={`navbar-link ${isActive('/profile')}`}>
                  My Profile
                </Link>
              )}
              <Link to="/contact" className={`navbar-link ${isActive('/contact')}`}>
                Contact
              </Link>
            </div>
            
            <div className="auth-buttons">
              {user ? (
                <>
                  <div className="navbar-user">
                    <Link to="/account" className="navbar-profile-container">
                      {getProfileImage() ? (
                        <img 
                          src={getProfileImage()} 
                          alt={user.name} 
                          className="navbar-profile-image"
                        />
                      ) : (
                        <div className="navbar-profile-placeholder">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="navbar-user-info">
                        <span className="navbar-username">{user.name}</span>
                        <span className="navbar-role">{user.role}</span>
                      </div>
                    </Link>
                  </div>
                  <Button onClick={handleLogout} variant="outline" className="logout-button">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline" className="login-button">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="signup-button">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;