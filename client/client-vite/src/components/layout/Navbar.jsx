import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { useState, useRef, useEffect } from 'react';
import './Navbar.css';

function Navbar() {
  const { user, logout, clientProfile, freelancerProfile, adminProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);
  
  // Reset dropdown state when user changes (e.g., on login)
  useEffect(() => {
    setShowDropdown(false);
  }, [user]);
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const getProfileImage = () => {
    if (!user) return null;
    
    // Handle profile image for admin role
    if (user.role === 'admin') {
      if (!adminProfile?.profileImage) return null;
      
      return adminProfile.profileImage.startsWith('http') 
        ? adminProfile.profileImage 
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${adminProfile.profileImage}`;
    }
    
    // Handle client and freelancer profiles
    const profile = user.role === 'client' ? clientProfile : freelancerProfile;
    if (!profile?.profileImage) return null;

    return profile.profileImage.startsWith('http') 
      ? profile.profileImage 
      : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${profile.profileImage}`;
  };

  const isActive = (path) => {
    return location.pathname === path ? 'navbar-link-active' : '';
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowDropdown(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowDropdown(false);
    }, 300); // 300ms delay before closing dropdown
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
              <Link to="/jobs" className={`navbar-link navbar-link-jobs ${isActive('/jobs')}`}>
                <i className="fas fa-briefcase navbar-icon"></i> Jobs
              </Link>
              {user && user.role === 'client' && (
                <Link to="/dashboard/client/hire" className={`navbar-link ${isActive('/dashboard/client/hire')}`}>
                  <i className="fas fa-plus-circle navbar-icon"></i> Post a Job
                </Link>
              )}
              {user && user.role === 'freelancer' && (
                <Link to="/dashboard/freelancer/jobs" className={`navbar-link ${isActive('/dashboard/freelancer/jobs')}`}>
                  <i className="fas fa-search navbar-icon"></i> Find Work
                </Link>
              )}
              {user && user.role === 'admin' && (
                <Link to="/dashboard/admin/users" className={`navbar-link ${isActive('/dashboard/admin/users')}`}>
                  <i className="fas fa-users navbar-icon"></i> Manage Users
                </Link>
              )}
              <Link to="/about" className={`navbar-link ${isActive('/about')}`}>
                About
              </Link>
              <Link to="/contact" className={`navbar-link ${isActive('/contact')}`}>
                Contact
              </Link>
            </div>
            
            <div className="auth-buttons">
              {user ? (
                <>
                  <div className="navbar-user-dropdown">
                    <div 
                      className="navbar-user"
                      ref={dropdownRef}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div className="navbar-profile-container">
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
                      </div>
                      
                      {/* Dropdown menu */}
                      {showDropdown && (
                        <div 
                          className="navbar-dropdown"
                          onMouseEnter={handleMouseEnter}
                          onMouseLeave={handleMouseLeave}
                        >
                          <Link to={`/dashboard/${user.role}`} className="dropdown-item">
                            <i className="dropdown-icon fas fa-tachometer-alt"></i>
                            Dashboard
                          </Link>
                          
                          {/* Profile link - not relevant for admin users */}
                          {user.role !== 'admin' && (
                            <Link to="/profile" className="dropdown-item">
                              <i className="dropdown-icon fas fa-user"></i>
                              Profile
                            </Link>
                          )}
                          
                          {/* Role-specific menu items */}
                          {user.role === 'client' && (
                            <Link to={`/dashboard/${user.role}/hire`} className="dropdown-item">
                              <i className="dropdown-icon fas fa-plus-circle"></i>
                              Post a Job
                            </Link>
                          )}
                          
                          {user.role === 'freelancer' && (
                            <Link to={`/dashboard/${user.role}/jobs`} className="dropdown-item">
                              <i className="dropdown-icon fas fa-briefcase"></i>
                              Find Work
                            </Link>
                          )}
                          
                          {/* Admin-specific menu items */}
                          {user.role === 'admin' && (
                            <>
                              <Link to={`/dashboard/${user.role}/users`} className="dropdown-item">
                                <i className="dropdown-icon fas fa-users"></i>
                                Manage Users
                              </Link>
                              <Link to={`/dashboard/${user.role}/jobs`} className="dropdown-item">
                                <i className="dropdown-icon fas fa-briefcase"></i>
                                Manage Jobs
                              </Link>
                              <Link to={`/dashboard/${user.role}/reports`} className="dropdown-item">
                                <i className="dropdown-icon fas fa-flag"></i>
                                Reports
                              </Link>
                            </>
                          )}
                          
                          {/* Common menu items for all user types */}
                          {user.role !== 'admin' && (
                            <Link to={`/dashboard/${user.role}/wallet`} className="dropdown-item">
                              <i className="dropdown-icon fas fa-wallet"></i>
                              Wallet
                            </Link>
                          )}
                          
                          <Link to={`/dashboard/${user.role}/chat`} className="dropdown-item">
                            <i className="dropdown-icon fas fa-comments"></i>
                            Messages
                          </Link>
                          
                          <Link to={`/dashboard/${user.role}/settings`} className="dropdown-item">
                            <i className="dropdown-icon fas fa-cog"></i>
                            Account Settings
                          </Link>
                          
                          <div className="dropdown-divider"></div>
                          
                          <button onClick={handleLogout} className="dropdown-item dropdown-item-danger">
                            <i className="dropdown-icon fas fa-sign-out-alt"></i>
                            Logout
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
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