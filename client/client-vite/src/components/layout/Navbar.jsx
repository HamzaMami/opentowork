import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  // Function to check if a path is active
  const isActive = (path) => {
    return location.pathname === path ? 'navbar-link-active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          {/* Logo on the left */}
          <div className="navbar-left">
            <Link to="/" className="navbar-logo">
              <span>OpenToWork</span>
            </Link>
          </div>
          
          {/* Navigation links and buttons on the right */}
          <div className="navbar-right">
            {/* Navigation Links */}
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
              {/* Show Profile link only for freelancers */}
              {user && user.role === 'freelancer' && (
                <Link to="/profile" className={`navbar-link ${isActive('/profile')}`}>
                  Profile
                </Link>
              )}
              <Link to="/contact" className={`navbar-link ${isActive('/contact')}`}>
                Contact
              </Link>
            </div>
            
            {/* Auth Buttons */}
            <div className="auth-buttons">
              {user ? (
                <>
                  <div className="navbar-user">
                    <Link to="/account" className="navbar-username-link">
                      <span className="navbar-username">Hi, {user.name.split(' ')[0]}</span>
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