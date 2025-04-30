import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { walletAPI, jobsAPI } from '../../api';
import './DashboardBase.css';

const FreelancerDashboard = () => {
  const { user, freelancerProfile } = useAuth();
  const navigate = useNavigate();
  
  // State for dashboard metrics
  const [dashboardData, setDashboardData] = useState({
    walletBalance: 0,
    activeJobs: 0,
    proposalsSent: 0,
    profileViews: 0
  });
  
  // State for recent proposals
  const [recentProposals, setRecentProposals] = useState([]);
  
  // Loading and error states
  const [loading, setLoading] = useState({
    wallet: true,
    jobs: true,
    proposals: true,
    messages: true
  });
  const [error, setError] = useState({
    wallet: null,
    jobs: null,
    proposals: null,
    messages: null
  });

  // Fetch all dashboard data when component mounts
  useEffect(() => {
    const fetchDashboardData = async () => {
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
      
      // Fetch active jobs data
      try {
        const jobsRes = await jobsAPI.getFreelancerJobs();
        const activeJobs = jobsRes.data?.data?.filter(job => job.status === 'in-progress').length || 0;
        
        setDashboardData(prev => ({
          ...prev,
          activeJobs
        }));
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
      
      // Fetch proposals data
      try {
        // Get all proposals with sorting by newest first
        const proposalsRes = await jobsAPI.getFreelancerProposals({ sort: '-createdAt' });
        
        if (proposalsRes.data?.success) {
          const allProposals = proposalsRes.data.data || [];
          // Count pending proposals for the stats card
          const pendingProposals = allProposals.filter(proposal => 
            proposal.status === 'pending'
          ).length;
          
          // Set recent proposals (up to 3)
          setRecentProposals(allProposals.slice(0, 3));
          
          // Update dashboard data with counts
          setDashboardData(prev => ({
            ...prev,
            proposalsSent: pendingProposals
          }));
        }
      } catch (err) {
        console.error('Error fetching proposals data:', err);
        setError(prev => ({
          ...prev,
          proposals: 'Failed to load proposals data'
        }));
      } finally {
        setLoading(prev => ({
          ...prev,
          proposals: false
        }));
      }
      
      // For profile views, we could add this later
      // This would typically need an analytics backend
      setDashboardData(prev => ({
        ...prev,
        profileViews: 0
      }));
    };
    
    fetchDashboardData();
  }, []);

  // Format skills array from string if it exists
  const formatSkills = () => {
    if (!freelancerProfile?.skills) return [];
    
    // Ensure proper formatting by trimming and filtering empty items
    return freelancerProfile.skills
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);
  };

  // Function to format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Function to get status badge class based on proposal status
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'accepted':
        return 'status-accepted';
      case 'rejected':
        return 'status-rejected';
      case 'withdrawn':
        return 'status-withdrawn';
      default:
        return '';
    }
  };

  return (
    <div className="dashboard-overview">
      <h2 className="dashboard-welcome">Welcome back, {user.name}!</h2>
      <p className="dashboard-subtitle">Here's an overview of your account and activity.</p>
      
      <div className="dashboard-stats-grid">
        <Card className="dashboard-stat-card">
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
            <div className="stat-description">Jobs in progress</div>
          </CardContent>
        </Card>

        <Card className="dashboard-stat-card">
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
            <div className="stat-description">Available earnings</div>
          </CardContent>
        </Card>

        <Card className="dashboard-stat-card" onClick={() => navigate('/dashboard/freelancer/proposals')}>
          <CardHeader className="card-header-compact">
            <CardTitle>Proposals Sent</CardTitle>
          </CardHeader>
          <CardContent>
            {loading.proposals ? (
              <div className="stat-value">Loading...</div>
            ) : error.proposals ? (
              <div className="stat-value error">Error</div>
            ) : (
              <div className="stat-value">{dashboardData.proposalsSent}</div>
            )}
            <div className="stat-description">Awaiting response</div>
          </CardContent>
        </Card>

        <Card className="dashboard-stat-card">
          <CardHeader className="card-header-compact">
            <CardTitle>Profile Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{dashboardData.profileViews}</div>
            <div className="stat-description">Past 30 days</div>
          </CardContent>
        </Card>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h3 className="section-title">Recent Jobs</h3>
          <Card>
            <CardContent className="dashboard-empty-state">
              <div className="empty-icon">
                <i className="fas fa-briefcase"></i>
              </div>
              <h4>No active jobs yet</h4>
              <p>Start applying to available jobs to find work opportunities.</p>
              <button 
                className="dashboard-action-button"
                onClick={() => navigate('/dashboard/freelancer/jobs')}
              >
                <i className="fas fa-search"></i> Find Work
              </button>
            </CardContent>
          </Card>
        </div>

        <div className="dashboard-section">
          <h3 className="section-title">Recent Proposals</h3>
          <Card>
            {loading.proposals ? (
              <CardContent className="dashboard-loading-state">
                <div className="loading-spinner"></div>
                <p>Loading proposals...</p>
              </CardContent>
            ) : error.proposals ? (
              <CardContent className="dashboard-error-state">
                <div className="error-icon">
                  <i className="fas fa-exclamation-circle"></i>
                </div>
                <p>{error.proposals}</p>
              </CardContent>
            ) : recentProposals.length === 0 ? (
              <CardContent className="dashboard-empty-state">
                <div className="empty-icon">
                  <i className="fas fa-file-contract"></i>
                </div>
                <h4>No proposals yet</h4>
                <p>Submit proposals to jobs to start tracking them here.</p>
                <button 
                  className="dashboard-action-button"
                  onClick={() => navigate('/dashboard/freelancer/jobs')}
                >
                  <i className="fas fa-search"></i> Browse Jobs
                </button>
              </CardContent>
            ) : (
              <CardContent className="recent-proposals-list">
                {recentProposals.map((proposal) => (
                  <div key={proposal._id} className="recent-proposal-item">
                    <div className="recent-proposal-header">
                      <h4 className="job-title" onClick={() => navigate(`/jobs/${proposal.job._id}`)}>
                        {proposal.job.title}
                      </h4>
                      <div className={`proposal-status-badge ${getStatusClass(proposal.status)}`}>
                        {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                      </div>
                    </div>
                    <div className="recent-proposal-details">
                      <div className="proposal-detail">
                        <i className="fas fa-calendar"></i>
                        <span>{formatDate(proposal.createdAt)}</span>
                      </div>
                      <div className="proposal-detail">
                        <i className="fas fa-money-bill-wave"></i>
                        <span>${proposal.bidAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="view-all-link">
                  <button
                    className="link-button"
                    onClick={() => navigate('/dashboard/freelancer/proposals')}
                  >
                    View all proposals <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        <div className="dashboard-section">
          <h3 className="section-title">Recent Messages</h3>
          <Card>
            <CardContent className="dashboard-empty-state">
              <div className="empty-icon">
                <i className="fas fa-comments"></i>
              </div>
              <h4>No messages yet</h4>
              <p>Your messages with clients will appear here.</p>
              <button 
                className="dashboard-action-button"
                onClick={() => navigate('/dashboard/freelancer/chat')}
              >
                <i className="fas fa-comment"></i> View Messages
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="dashboard-section">
        <h3 className="section-title">Skills & Expertise</h3>
        <Card>
          <CardContent>
            {freelancerProfile?.skills ? (
              <div className="skills-container">
                {formatSkills().map((skill, index) => (
                  <span key={index} className="skill-tag">{skill}</span>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty-state">
                <div className="empty-icon">
                  <i className="fas fa-tools"></i>
                </div>
                <h4>No skills added yet</h4>
                <p>Add your skills to help clients find you for relevant projects.</p>
                <button 
                  className="dashboard-action-button"
                  onClick={() => navigate('/profile')}
                >
                  <i className="fas fa-plus"></i> Add Skills
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FreelancerDashboard;