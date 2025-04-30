import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ClientDashboard from './ClientDashboard';
import FreelancerDashboard from './FreelancerDashboard';
import './DashboardBase.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { role } = useParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Redirect if user is not authenticated or role doesn't match the URL parameter
  if (!user || (role !== 'client' && role !== 'freelancer') || user.role !== role) {
    navigate('/login');
    return null;
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Determine if we're at the index route or a child route
  const isIndexRoute = window.location.pathname === `/dashboard/${role}`;

  return (
    <div className="dashboard-container">
      <aside className={`dashboard-sidebar ${isMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">{role.charAt(0).toUpperCase() + role.slice(1)} Dashboard</h2>
          <button className="sidebar-close-btn" onClick={toggleMenu}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink 
            to={`/dashboard/${role}`} 
            end
            className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
          >
            <i className="fas fa-tachometer-alt sidebar-icon"></i>
            <span>Overview</span>
          </NavLink>
          
          <NavLink 
            to={`/dashboard/${role}/wallet`} 
            className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
          >
            <i className="fas fa-wallet sidebar-icon"></i>
            <span>Wallet</span>
          </NavLink>
          
          <NavLink 
            to={`/dashboard/${role}/chat`} 
            className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
          >
            <i className="fas fa-comments sidebar-icon"></i>
            <span>Messages</span>
          </NavLink>

          {role === 'client' && (
            <>
              <NavLink 
                to={`/dashboard/${role}/active-projects`} 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
              >
                <i className="fas fa-tasks sidebar-icon"></i>
                <span>Active Projects</span>
              </NavLink>

              <NavLink 
                to={`/dashboard/${role}/proposals`} 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
              >
                <i className="fas fa-file-alt sidebar-icon"></i>
                <span>Review Proposals</span>
              </NavLink>

              <NavLink 
                to={`/dashboard/${role}/jobs`} 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
              >
                <i className="fas fa-briefcase sidebar-icon"></i>
                <span>My Jobs</span>
              </NavLink>

              <NavLink 
                to={`/dashboard/${role}/post-job`} 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
              >
                <i className="fas fa-plus-circle sidebar-icon"></i>
                <span>Post a Job</span>
              </NavLink>
            </>
          )}

          {role === 'freelancer' && (
            <>
              <NavLink 
                to={`/dashboard/${role}/active-projects`} 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
              >
                <i className="fas fa-tasks sidebar-icon"></i>
                <span>Active Projects</span>
              </NavLink>
              
              <NavLink 
                to={`/dashboard/${role}/jobs`} 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
              >
                <i className="fas fa-briefcase sidebar-icon"></i>
                <span>Available Jobs</span>
              </NavLink>

              <NavLink 
                to={`/dashboard/${role}/proposals`} 
                className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
              >
                <i className="fas fa-file-contract sidebar-icon"></i>
                <span>My Proposals</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <NavLink 
            to={`/dashboard/${role}/settings`} 
            className={({ isActive }) => isActive ? "sidebar-link active" : "sidebar-link"}
          >
            <i className="fas fa-cog sidebar-icon"></i>
            <span>Account Settings</span>
          </NavLink>
        </div>
      </aside>

      <div className="dashboard-content">
        <div className="dashboard-topbar">
          <button className="menu-toggle" onClick={toggleMenu}>
            <i className="fas fa-bars"></i>
          </button>
          <div className="dashboard-title">
            <h1>{role.charAt(0).toUpperCase() + role.slice(1)} Dashboard</h1>
          </div>
        </div>

        <main className="dashboard-main">
          {isIndexRoute ? (
            role === 'client' ? <ClientDashboard /> : <FreelancerDashboard />
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;