import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { usersAPI, jobsAPI, contactAPI } from '../../../api';
import '../DashboardBase.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for dashboard metrics
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    activeJobs: 0,
    pendingReports: 0,
    unreadMessages: 0,
    userBreakdown: {
      clients: 0,
      freelancers: 0,
      admins: 0
    },
    recentActivity: []
  });
  
  // Loading and error states
  const [loading, setLoading] = useState({
    users: true,
    jobs: true,
    reports: true
  });
  
  const [error, setError] = useState({
    users: null,
    jobs: null,
    reports: null
  });
  
  // State for refresh functionality
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    
    // Fetch users data
    try {
      const usersRes = await usersAPI.getAll();
      console.log('Raw users response:', usersRes);
      
      // Ensure users data is an array before processing
      const users = usersRes.data?.users || [];
      
      const totalUsers = users.length;
      const clients = users.filter(user => user && user.role === 'client').length;
      const freelancers = users.filter(user => user && user.role === 'freelancer').length;
      const admins = users.filter(user => user && user.role === 'admin').length;
      
      setDashboardData(prev => ({
        ...prev,
        totalUsers,
        userBreakdown: {
          clients,
          freelancers,
          admins
        }
      }));
      
      console.log('Processed users data:', { totalUsers, clients, freelancers, admins });
    } catch (err) {
      console.error('Error fetching users data:', err);
      setError(prev => ({
        ...prev,
        users: 'Failed to load users data'
      }));
    } finally {
      setLoading(prev => ({
        ...prev,
        users: false
      }));
    }
    
    // Fetch jobs data
    try {
      const jobsRes = await jobsAPI.getJobs();
      console.log('Raw jobs response:', jobsRes);
      
      // Ensure jobs data is an array before processing
      const jobs = jobsRes.data?.data || [];
      
      const activeJobs = jobs.filter(job => 
        job && (job.status === 'open' || 
        job.status === 'in-progress' || 
        job.status === 'active')
      ).length;
      
      setDashboardData(prev => ({
        ...prev,
        activeJobs
      }));
      
      console.log('Processed jobs data:', { activeJobs, totalJobs: jobs.length });
    } catch (err) {
      console.error('Error fetching jobs data:', err);
      setError(prev => ({
        ...prev,
        jobs: 'Failed to load jobs data'
      }));
    } finally {
      setLoading(prev => ({
        ...prev,
        jobs: false
      }));
    }
    
    // Fetch contact/reports data
    try {
      const contactRes = await contactAPI.getContactSubmissions();
      console.log('Raw contact response:', contactRes);
      
      // Ensure contacts data is an array before processing
      const contacts = contactRes.data?.contacts || [];
      
      const pendingReports = contacts.filter(
        contact => contact && (contact.status === 'pending' || !contact.status)
      ).length;
      
      setDashboardData(prev => ({
        ...prev,
        pendingReports
      }));
      
      console.log('Processed reports data:', { pendingReports, totalReports: contacts.length });
    } catch (err) {
      console.error('Error fetching reports data:', err);
      setError(prev => ({
        ...prev,
        reports: 'Failed to load reports data'
      }));
    } finally {
      setLoading(prev => ({
        ...prev,
        reports: false
      }));
      setIsRefreshing(false);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle refresh button click
  const handleRefresh = () => {
    fetchDashboardData();
  };

  return (
    <div className="dashboard-overview">
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-welcome">Welcome back, {user.name}!</h2>
          <p className="dashboard-subtitle">Here's an overview of platform activity and statistics.</p>
        </div>
        <button 
          className={`refresh-button ${isRefreshing ? 'refreshing' : ''}`} 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <i className="fas fa-sync-alt"></i>
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      <div className="dashboard-stats-grid">
        <Card className="dashboard-stat-card" onClick={() => navigate('/dashboard/admin/users')}>
          <CardHeader className="card-header-compact">
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading.users ? (
              <div className="stat-value">Loading...</div>
            ) : error.users ? (
              <div className="stat-value error">Error</div>
            ) : (
              <div className="stat-value">{dashboardData.totalUsers}</div>
            )}
            <div className="stat-description">
              <span className="stat-highlight">{dashboardData.userBreakdown.clients}</span> clients, 
              <span className="stat-highlight"> {dashboardData.userBreakdown.freelancers}</span> freelancers
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-stat-card" onClick={() => navigate('/dashboard/admin/jobs')}>
          <CardHeader className="card-header-compact">
            <CardTitle>Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {loading.jobs ? (
              <div className="stat-value">Loading...</div>
            ) : error.jobs ? (
              <div className="stat-value error">Error</div>
            ) : (
              <div className="stat-value">{dashboardData.activeJobs}</div>
            )}
            <div className="stat-description">Currently active on platform</div>
          </CardContent>
        </Card>

        <Card className="dashboard-stat-card" onClick={() => navigate('/dashboard/admin/reports')}>
          <CardHeader className="card-header-compact">
            <CardTitle>Pending Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {loading.reports ? (
              <div className="stat-value">Loading...</div>
            ) : error.reports ? (
              <div className="stat-value error">Error</div>
            ) : (
              <div className="stat-value">{dashboardData.pendingReports}</div>
            )}
            <div className="stat-description">Awaiting review</div>
          </CardContent>
        </Card>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h3 className="section-title">Quick Actions</h3>
          <div className="quick-actions-grid">
            <Card className="action-card" onClick={() => navigate('/dashboard/admin/users')}>
              <CardContent>
                <div className="action-content">
                  <div className="action-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="action-details">
                    <h4>User Management</h4>
                    <p>View, edit and manage user accounts and permissions</p>
                  </div>
                </div>
                <div className="action-link-wrapper">
                  <Link to="/dashboard/admin/users" className="action-link">
                    Manage Users <i className="fas fa-arrow-right"></i>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card className="action-card" onClick={() => navigate('/dashboard/admin/jobs')}>
              <CardContent>
                <div className="action-content">
                  <div className="action-icon">
                    <i className="fas fa-briefcase"></i>
                  </div>
                  <div className="action-details">
                    <h4>Job Management</h4>
                    <p>Oversee all platform jobs, proposals and review job quality</p>
                  </div>
                </div>
                <div className="action-link-wrapper">
                  <Link to="/dashboard/admin/jobs" className="action-link">
                    Manage Jobs <i className="fas fa-arrow-right"></i>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card className="action-card" onClick={() => navigate('/dashboard/admin/reports')}>
              <CardContent>
                <div className="action-content">
                  <div className="action-icon">
                    <i className="fas fa-flag"></i>
                  </div>
                  <div className="action-details">
                    <h4>Review Reports</h4>
                    <p>Check and address user reports and complaints</p>
                  </div>
                </div>
                <div className="action-link-wrapper">
                  <Link to="/dashboard/admin/reports" className="action-link">
                    View Reports <i className="fas fa-arrow-right"></i>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card className="action-card" onClick={() => navigate('/dashboard/admin/chat')}>
              <CardContent>
                <div className="action-content">
                  <div className="action-icon">
                    <i className="fas fa-comments"></i>
                  </div>
                  <div className="action-details">
                    <h4>Support Messages</h4>
                    <p>Respond to user support inquiries and messages</p>
                  </div>
                </div>
                <div className="action-link-wrapper">
                  <Link to="/dashboard/admin/chat" className="action-link">
                    View Messages <i className="fas fa-arrow-right"></i>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;