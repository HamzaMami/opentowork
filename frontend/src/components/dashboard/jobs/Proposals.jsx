import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { jobsAPI } from '../../../api';
import '../DashboardBase.css';
import './Proposals.css';

const Proposals = () => {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    sortBy: 'newest'
  });

  useEffect(() => {
    fetchProposals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.sortBy]);

  const fetchProposals = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (filters.status !== 'all') {
        params.status = filters.status;
      }
      
      if (filters.sortBy === 'newest') {
        params.sort = '-createdAt';
      } else if (filters.sortBy === 'oldest') {
        params.sort = 'createdAt';
      } else if (filters.sortBy === 'bid-high') {
        params.sort = '-bidAmount';
      } else if (filters.sortBy === 'bid-low') {
        params.sort = 'bidAmount';
      }

      const response = await jobsAPI.getFreelancerProposals(params);
      
      if (response.data?.success) {
        setProposals(response.data.data || []);
      } else {
        setError('Failed to fetch proposals');
      }
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setError('An error occurred while fetching proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawProposal = async (jobId, proposalId) => {
    if (!window.confirm('Are you sure you want to withdraw this proposal? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await jobsAPI.withdrawProposal(jobId, proposalId);
      
      if (response.data?.success) {
        // Remove the proposal from the list
        setProposals(prevProposals => 
          prevProposals.filter(proposal => proposal._id !== proposalId)
        );
      } else {
        alert('Failed to withdraw proposal');
      }
    } catch (err) {
      console.error('Error withdrawing proposal:', err);
      alert('An error occurred while withdrawing your proposal');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="dashboard-section proposals-container">
      <h2 className="dashboard-section-title">My Proposals</h2>
      <p className="dashboard-section-description">
        Track the status of your job applications and proposals.
      </p>

      <div className="proposals-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            name="status" 
            value={filters.status} 
            onChange={handleFilterChange}
          >
            <option value="all">All Proposals</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Sort By:</label>
          <select 
            name="sortBy" 
            value={filters.sortBy} 
            onChange={handleFilterChange}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="bid-high">Bid: High to Low</option>
            <option value="bid-low">Bid: Low to High</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
          <p>Loading your proposals...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
          <Button onClick={fetchProposals}>Try Again</Button>
        </div>
      ) : proposals.length === 0 ? (
        <Card className="empty-state-card">
          <CardContent className="empty-state">
            <div className="empty-icon">
              <i className="fas fa-file-contract"></i>
            </div>
            <h3>No proposals found</h3>
            <p>You haven't submitted any proposals yet or none match your current filters.</p>
            <Button 
              className="action-button" 
              onClick={() => navigate('/dashboard/freelancer/jobs')}
            >
              Browse Available Jobs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="proposals-list">
          {proposals.map((proposal) => (
            <Card key={proposal._id} className="proposal-card">
              <CardContent>
                <div className="proposal-header">
                  <h3 className="job-title" onClick={() => navigate(`/jobs/${proposal.job._id}`)}>
                    {proposal.job.title}
                  </h3>
                  <div className={`proposal-status ${getStatusClass(proposal.status)}`}>
                    {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                  </div>
                </div>

                <div className="proposal-details">
                  <div className="proposal-detail">
                    <i className="fas fa-calendar"></i>
                    <span>Submitted on {formatDate(proposal.createdAt)}</span>
                  </div>
                  <div className="proposal-detail">
                    <i className="fas fa-user"></i>
                    <span>Client: {proposal.job.client.name}</span>
                  </div>
                  <div className="proposal-detail">
                    <i className="fas fa-money-bill-wave"></i>
                    <span>Your Bid: ${proposal.price ? proposal.price.toFixed(2) : proposal.bidAmount.toFixed(2)}</span>
                  </div>
                  {proposal.estimatedDuration && (
                    <div className="proposal-detail">
                      <i className="fas fa-clock"></i>
                      <span>Estimated Duration: {proposal.estimatedDuration}</span>
                    </div>
                  )}
                </div>

                <div className="proposal-content">
                  <h4>Cover Letter</h4>
                  <p>{proposal.coverLetter}</p>
                </div>

                <div className="proposal-actions">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/jobs/${proposal.job._id}`)}
                  >
                    <i className="fas fa-eye"></i> View Job
                  </Button>
                  
                  {proposal.status === 'pending' && (
                    <Button 
                      variant="destructive" 
                      onClick={() => handleWithdrawProposal(proposal.job._id, proposal._id)}
                    >
                      <i className="fas fa-times-circle"></i> Withdraw
                    </Button>
                  )}
                  
                  {proposal.status === 'accepted' && (
                    <Button 
                      onClick={() => navigate(`/dashboard/freelancer/chat`)}
                    >
                      <i className="fas fa-comments"></i> Contact Client
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Proposals;