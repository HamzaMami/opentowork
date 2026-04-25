import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { walletAPI, jobsAPI, chatAPI } from '../../api';
import './DashboardBase.css';

const ClientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for dashboard metrics
  const [dashboardData, setDashboardData] = useState({
    walletBalance: 0,
    activeProjects: 0,
    unreadMessages: 0,
    pendingProposals: 0,
    totalJobs: 0,
    openJobs: 0
  });
  
  // Loading and error states
  const [loading, setLoading] = useState({
    wallet: true,
    projects: true,
    messages: true,
    proposals: true
  });
  const [error, setError] = useState({
    wallet: null,
    projects: null,
    messages: null,
    proposals: null
  });
  
  // State for refresh functionality
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    setIsRefreshing(true);
    
    // Fetch wallet data
    try {
      const walletRes = await walletAPI.getWallet();
      setDashboardData(prev => ({
        ...prev,
        walletBalance: walletRes.data?.balance || 0
      }));
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError(prev => ({
        ...prev,
        wallet: 'Failed to load wallet data'
      }));
    } finally {
      setLoading(prev => ({
        ...prev,
        wallet: false
      }));
    }
    
    // Fetch jobs/projects data
    try {
      const jobsRes = await jobsAPI.getClientJobs();
      const jobs = jobsRes.data?.data || [];
      
      // Count active projects - jobs that are currently in progress
      // This includes jobs with status 'in-progress' and may include other active statuses in the future
      const activeProjects = jobs.filter(job => 
        job.status === 'in-progress' || 
        // Add any other statuses that should be considered "active" here
        job.status === 'active' ||
        job.status === 'ongoing' ||
        job.status === 'completion-pending' // Include jobs pending completion confirmation
      ).length || 0;
      
      const openJobs = jobs.filter(job => job.status === 'open').length || 0;
      const totalJobs = jobs.length || 0;
      
      // Calculate pending proposals count
      const pendingProposals = jobs.reduce((count, job) => {
        if (job.status === 'open' && job.proposals && job.proposals.length > 0) {
          return count + job.proposals.filter(proposal => proposal.status === 'pending').length;
        }
        return count;
      }, 0) || 0;
      
      setDashboardData(prev => ({
        ...prev,
        activeProjects,
        pendingProposals,
        totalJobs,
        openJobs
      }));
    } catch (err) {
      console.error('Error fetching projects data:', err);
      setError(prev => ({
        ...prev,
        projects: 'Failed to load projects data',
        proposals: 'Failed to load proposal data'
      }));
    } finally {
      setLoading(prev => ({
        ...prev,
        projects: false,
        proposals: false
      }));
    }
    
    // Fetch unread messages
    try {
      const messagesRes = await chatAPI.getUnreadCount();
      setDashboardData(prev => ({
        ...prev,
        unreadMessages: messagesRes.data?.count || 0
      }));
    } catch (err) {
      console.error('Error fetching message data:', err);
      setError(prev => ({
        ...prev,
        messages: 'Failed to load message data'
      }));
    } finally {
      setLoading(prev => ({
        ...prev,
        messages: false
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
          <p className="dashboard-subtitle">Here's an overview of your account and activity.</p>
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
        <Card className="dashboard-stat-card" onClick={() => navigate('/dashboard/client/jobs')}>
          <CardHeader className="card-header-compact">
            <CardTitle>My Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {loading.projects ? (
              <div className="stat-value">Loading...</div>
            ) : error.projects ? (
              <div className="stat-value error">Error</div>
            ) : (
              <div className="stat-value">{dashboardData.totalJobs}</div>
            )}
            <div className="stat-description">
              {dashboardData.openJobs > 0 && (
                <span className="stat-highlight">{dashboardData.openJobs} open</span>
              )}
              {dashboardData.openJobs > 0 && dashboardData.totalJobs > dashboardData.openJobs && ', '}
              {dashboardData.totalJobs > dashboardData.openJobs && (
                <span>{dashboardData.totalJobs - dashboardData.openJobs} closed/in-progress</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-stat-card" onClick={() => navigate('/dashboard/client/active-projects')}>
          <CardHeader className="card-header-compact">
            <CardTitle>Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {loading.projects ? (
              <div className="stat-value">Loading...</div>
            ) : error.projects ? (
              <div className="stat-value error">Error</div>
            ) : (
              <div className="stat-value">{dashboardData.activeProjects}</div>
            )}
            <div className="stat-description">Projects in progress</div>
          </CardContent>
        </Card>

        <Card className="dashboard-stat-card" onClick={() => navigate('/dashboard/client/wallet')}>
          <CardHeader className="card-header-compact">
            <CardTitle>Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {loading.wallet ? (
              <div className="stat-value">Loading...</div>
            ) : error.wallet ? (
              <div className="stat-value error">Error</div>
            ) : (
              <div className="stat-value">${dashboardData.walletBalance.toFixed(2)}</div>
            )}
            <div className="stat-description">Available funds</div>
          </CardContent>
        </Card>

        <Card className="dashboard-stat-card" onClick={() => navigate('/dashboard/client/proposals')}>
          <CardHeader className="card-header-compact">
            <CardTitle>Pending Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            {loading.proposals ? (
              <div className="stat-value">Loading...</div>
            ) : error.proposals ? (
              <div className="stat-value error">Error</div>
            ) : (
              <div className="stat-value">{dashboardData.pendingProposals}</div>
            )}
            <div className="stat-description">Awaiting review</div>
          </CardContent>
        </Card>
        
        <Card className="dashboard-stat-card" onClick={() => navigate('/dashboard/client/chat')}>
          <CardHeader className="card-header-compact">
            <CardTitle>Unread Messages</CardTitle>
          </CardHeader>
          <CardContent>
            {loading.messages ? (
              <div className="stat-value">Loading...</div>
            ) : error.messages ? (
              <div className="stat-value error">Error</div>
            ) : (
              <div className="stat-value">{dashboardData.unreadMessages}</div>
            )}
            <div className="stat-description">From freelancers</div>
          </CardContent>
        </Card>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h3 className="section-title">Quick Actions</h3>
          <div className="quick-actions-grid">
            <Card className="action-card" onClick={() => navigate('/dashboard/client/post-job')}>
              <CardContent>
                <div className="action-content">
                  <div className="action-icon">
                    <i className="fas fa-plus-circle"></i>
                  </div>
                  <div className="action-details">
                    <h4>Post a New Job</h4>
                    <p>Create a job listing to find the perfect freelancer for your project</p>
                  </div>
                </div>
                <div className="action-link-wrapper">
                  <Link to="/dashboard/client/post-job" className="action-link">
                    Create Job <i className="fas fa-arrow-right"></i>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card className="action-card" onClick={() => navigate('/dashboard/client/jobs')}>
              <CardContent>
                <div className="action-content">
                  <div className="action-icon">
                    <i className="fas fa-briefcase"></i>
                  </div>
                  <div className="action-details">
                    <h4>Manage Your Jobs</h4>
                    <p>View, edit or close your job postings and manage received proposals</p>
                  </div>
                </div>
                <div className="action-link-wrapper">
                  <Link to="/dashboard/client/jobs" className="action-link">
                    View Jobs <i className="fas fa-arrow-right"></i>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card className="action-card" onClick={() => navigate('/dashboard/client/proposals')}>
              <CardContent>
                <div className="action-content">
                  <div className="action-icon">
                    <i className="fas fa-file-alt"></i>
                  </div>
                  <div className="action-details">
                    <h4>Review Proposals</h4>
                    <p>Review and accept proposals from freelancers for your projects</p>
                  </div>
                </div>
                <div className="action-link-wrapper">
                  <Link to="/dashboard/client/proposals" className="action-link">
                    View Proposals <i className="fas fa-arrow-right"></i>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            <Card className="action-card" onClick={() => navigate('/dashboard/client/active-projects')}>
              <CardContent>
                <div className="action-content">
                  <div className="action-icon">
                    <i className="fas fa-tasks"></i>
                  </div>
                  <div className="action-details">
                    <h4>Active Projects</h4>
                    <p>Manage your ongoing projects with freelancers</p>
                  </div>
                </div>
                <div className="action-link-wrapper">
                  <Link to="/dashboard/client/active-projects" className="action-link">
                    View Projects <i className="fas fa-arrow-right"></i>
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

export default ClientDashboard;