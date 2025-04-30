import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI } from '../../api';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import './ProposalReview.css';

const ProposalReview = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedJob, setExpandedJob] = useState(null);

  useEffect(() => {
    const fetchClientJobs = async () => {
      setLoading(true);
      try {
        const response = await jobsAPI.getClientJobs();
        if (response.data.success) {
          // Filter jobs that have pending proposals
          const jobsWithProposals = response.data.data.filter(
            job => job.proposals && job.proposals.length > 0
          );
          setJobs(jobsWithProposals);
        } else {
          setError('Failed to fetch jobs');
        }
      } catch (err) {
        console.error('Error fetching client jobs:', err);
        setError(err.response?.data?.message || 'An error occurred while fetching jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchClientJobs();
  }, []);

  const handleAcceptProposal = async (jobId, proposalId) => {
    try {
      const response = await jobsAPI.acceptProposal(jobId, proposalId);
      if (response.data.success) {
        // Update the local state to reflect the changes
        setJobs(prevJobs => 
          prevJobs.map(job => {
            if (job._id === jobId) {
              // Update job status to in-progress
              const updatedJob = { ...job, status: 'in-progress' };
              
              // Update the accepted proposal status
              updatedJob.proposals = job.proposals.map(proposal => {
                if (proposal._id === proposalId) {
                  return { ...proposal, status: 'accepted' };
                }
                // Reject all other proposals
                return { ...proposal, status: 'rejected' };
              });
              
              return updatedJob;
            }
            return job;
          })
        );
      } else {
        alert('Failed to accept proposal');
      }
    } catch (err) {
      console.error('Error accepting proposal:', err);
      alert(err.response?.data?.message || 'An error occurred while accepting the proposal');
    }
  };

  const toggleExpandJob = (jobId) => {
    if (expandedJob === jobId) {
      setExpandedJob(null);
    } else {
      setExpandedJob(jobId);
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

  if (loading) {
    return (
      <div className="proposal-review-container">
        <div className="loading-spinner"></div>
        <p>Loading proposals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="proposal-review-container">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="proposal-review-container">
        <Card className="empty-proposals-card">
          <CardContent>
            <div className="empty-state">
              <i className="fas fa-file-alt empty-icon"></i>
              <h3>No Proposals to Review</h3>
              <p>You don't have any proposals to review at this time. Post a job to start receiving proposals.</p>
              <Button onClick={() => navigate('/dashboard/client/post-job')}>
                <i className="fas fa-plus"></i> Post a New Job
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="proposal-review-container">
      <h2>Review Proposals</h2>
      <p className="section-description">
        Review and manage freelancer proposals for your open jobs
      </p>

      <div className="jobs-with-proposals">
        {jobs.map((job) => (
          <Card key={job._id} className="job-proposals-card">
            <CardContent>
              <div className="job-header">
                <div className="job-title-area">
                  <h3>{job.title}</h3>
                  <div className="job-meta">
                    <span className={`job-status job-status-${job.status}`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                    <span className="job-date">Posted on {formatDate(job.createdAt)}</span>
                  </div>
                </div>

                <Button 
                  className="toggle-proposals-btn"
                  onClick={() => toggleExpandJob(job._id)}
                >
                  <i className={`fas fa-chevron-${expandedJob === job._id ? 'up' : 'down'}`}></i>
                  {job.proposals.length} {job.proposals.length === 1 ? 'Proposal' : 'Proposals'}
                </Button>
              </div>

              {expandedJob === job._id && (
                <div className="proposals-section">
                  {job.status === 'in-progress' ? (
                    <div className="job-in-progress-note">
                      <i className="fas fa-info-circle"></i>
                      <p>This job is already in progress with an accepted proposal.</p>
                    </div>
                  ) : null}

                  {job.proposals.map((proposal) => (
                    <Card key={proposal._id} className={`proposal-card proposal-${proposal.status}`}>
                      <CardContent>
                        <div className="proposal-header">
                          <div className="freelancer-info">
                            <div className="freelancer-avatar">
                              {proposal.freelancer.profileImage ? (
                                <img 
                                  src={proposal.freelancer.profileImage} 
                                  alt={proposal.freelancer.name} 
                                />
                              ) : (
                                <i className="fas fa-user"></i>
                              )}
                            </div>
                            <div>
                              <h4>{proposal.freelancer.name}</h4>
                              <p className="proposal-date">
                                Submitted {formatDate(proposal.createdAt)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="proposal-status">
                            {proposal.status === 'pending' && (
                              <>
                                <Button
                                  className="accept-btn"
                                  disabled={job.status === 'in-progress'}
                                  onClick={() => handleAcceptProposal(job._id, proposal._id)}
                                >
                                  <i className="fas fa-check"></i> Accept
                                </Button>
                              </>
                            )}
                            {proposal.status === 'accepted' && (
                              <span className="accepted-label">
                                <i className="fas fa-check-circle"></i> Accepted
                              </span>
                            )}
                            {proposal.status === 'rejected' && (
                              <span className="rejected-label">
                                <i className="fas fa-times-circle"></i> Rejected
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="proposal-details">
                          <div className="proposal-detail">
                            <i className="fas fa-money-bill-wave"></i>
                            <span>Bid: ${proposal.price ? proposal.price.toFixed(2) : 'N/A'}</span>
                            {job.budget.type === 'hourly' && <span className="rate-label">/hr</span>}
                          </div>

                          <div className="proposal-detail">
                            <i className="fas fa-clock"></i>
                            <span>
                              Estimated Time: {proposal.estimatedTime.value} {proposal.estimatedTime.unit}
                              {proposal.estimatedTime.value > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        <div className="proposal-cover-letter">
                          <h5>Cover Letter</h5>
                          <div className="cover-letter-content">
                            {proposal.coverLetter}
                          </div>
                        </div>

                        {proposal.status === 'accepted' && (
                          <div className="proposal-actions">
                            <Button 
                              className="message-btn"
                              onClick={() => navigate(`/dashboard/client/chat/${proposal.freelancer._id}`)}
                            >
                              <i className="fas fa-comment"></i> Message Freelancer
                            </Button>
                            <Button 
                              className="view-project-btn"
                              onClick={() => navigate(`/dashboard/client/projects/${job._id}`)}
                            >
                              <i className="fas fa-project-diagram"></i> View Project
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProposalReview;