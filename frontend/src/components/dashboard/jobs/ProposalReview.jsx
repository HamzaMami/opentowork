import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI, usersAPI } from '../../../api';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import ProfileHoverCard from '../../ui/ProfileHoverCard';
import { getImageUrl } from '../../../utils/imageUtils';
import './ProposalReview.css';

const ProposalReview = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedJob, setExpandedJob] = useState(null);
  const [hoverUser, setHoverUser] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(null);
  const [hoverIsVisible, setHoverIsVisible] = useState(false);
  const [freelancersData, setFreelancersData] = useState({});

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
          
          console.log('Jobs with proposals:', jobsWithProposals);
          
          // Collect all freelancer IDs to fetch
          const freelancerIds = new Set();
          jobsWithProposals.forEach(job => {
            job.proposals.forEach(proposal => {
              if (proposal.freelancer) {
                // If freelancer is a string (just an ID)
                if (typeof proposal.freelancer === 'string') {
                  freelancerIds.add(proposal.freelancer);
                } 
                // If freelancer is an object with _id
                else if (proposal.freelancer._id) {
                  freelancerIds.add(proposal.freelancer._id);
                }
              }
            });
          });
          
          // Fetch data for all freelancers in one go
          const freelancerDataMap = {};
          await Promise.all([...freelancerIds].map(async (freelancerId) => {
            try {
              const userResponse = await usersAPI.getById(freelancerId);
              if (userResponse.data) {
                freelancerDataMap[freelancerId] = {
                  _id: freelancerId,
                  name: userResponse.data.name || 'Freelancer',
                  email: userResponse.data.email,
                  profileImage: userResponse.data.profileImage,
                  // Store the complete user data too
                  userData: userResponse.data
                };
              }
            } catch (err) {
              console.error(`Failed to fetch data for freelancer ID ${freelancerId}:`, err);
            }
          }));
          
          setFreelancersData(freelancerDataMap);
          
          // Now enhance the jobs with this data where needed
          const enhancedJobs = jobsWithProposals.map(job => {
            if (job.proposals) {
              job.proposals = job.proposals.map(proposal => {
                const originalFreelancer = proposal.freelancer;
                
                // Handle string IDs
                if (typeof originalFreelancer === 'string') {
                  const freelancerId = originalFreelancer;
                  const freelancerData = freelancerDataMap[freelancerId];
                  
                  if (freelancerData) {
                    proposal.freelancer = { 
                      ...freelancerData,
                      // Keep the original ID
                      _id: freelancerId
                    };
                  } else {
                    // Create a placeholder if we couldn't load the data
                    proposal.freelancer = {
                      _id: freelancerId,
                      name: 'Freelancer',
                      isPlaceholder: true
                    };
                  }
                }
                // Handle cases where freelancer is already an object but might be missing data
                else if (originalFreelancer && originalFreelancer._id) {
                  const freelancerData = freelancerDataMap[originalFreelancer._id];
                  
                  if (freelancerData) {
                    // Enhance with additional data, but keep original data as well
                    proposal.freelancer = {
                      ...originalFreelancer,
                      name: originalFreelancer.name || freelancerData.name,
                      email: originalFreelancer.email || freelancerData.email,
                      profileImage: originalFreelancer.profileImage || freelancerData.profileImage,
                      userData: freelancerData.userData
                    };
                  }
                }
                
                return proposal;
              });
            }
            return job;
          });
          
          setJobs(enhancedJobs);
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

  const handleProfileHover = (userId, e) => {
    if (!userId) {
      console.error('No user ID provided for hover card');
      return;
    }
    
    // Calculate position for the hover card
    const rect = e.currentTarget.getBoundingClientRect();
    const position = {
      top: rect.bottom + window.scrollY + 10, // 10px below the element
      left: rect.left + window.scrollX,
    };
    
    // Get the user data
    const userData = freelancersData[userId] || { _id: userId };
    
    setHoverPosition(position);
    setHoverUser(userData);
    setHoverIsVisible(true);
  };

  const handleProfileLeave = () => {
    // Use a small timeout to prevent flickering when moving from name to avatar
    setTimeout(() => {
      setHoverIsVisible(false);
    }, 100);
  };

  // Helper function to get freelancer name safely
  const getFreelancerName = (proposal) => {
    if (!proposal || !proposal.freelancer) return 'Freelancer';
    
    return proposal.freelancer.name || 'Freelancer';
  };
  
  // Helper function to get first letter for avatar placeholder
  const getInitial = (name) => {
    if (name && typeof name === 'string' && name.length > 0) {
      return name.charAt(0).toUpperCase();
    }
    return 'F';
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

                  {job.proposals && job.proposals.length > 0 ? job.proposals.map((proposal) => {
                    // Safety check for proposal data
                    if (!proposal) {
                      console.error('Invalid proposal data');
                      return null;
                    }
                    
                    // Ensure freelancer data exists
                    if (!proposal.freelancer) {
                      console.error('Missing freelancer data in proposal:', proposal._id);
                      return null;
                    }
                    
                    const freelancerName = getFreelancerName(proposal);
                    const freelancerId = proposal.freelancer._id;
                    
                    return (
                    <Card key={proposal._id} className={`proposal-card proposal-${proposal.status}`}>
                      <CardContent>
                        <div className="proposal-header">
                          <div className="freelancer-info">
                            <div 
                              className="freelancer-avatar"
                              onMouseEnter={(e) => handleProfileHover(freelancerId, e)}
                              onMouseLeave={handleProfileLeave}
                            >
                              {proposal.freelancer.profileImage ? (
                                <img 
                                  src={getImageUrl(proposal.freelancer.profileImage)} 
                                  alt={freelancerName}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    const initial = getInitial(freelancerName);
                                    e.target.parentElement.innerHTML = `<div class="freelancer-avatar-placeholder">${initial}</div>`;
                                  }}
                                />
                              ) : (
                                <div className="freelancer-avatar-placeholder">
                                  {getInitial(freelancerName)}
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 
                                className="freelancer-name"
                                onMouseEnter={(e) => handleProfileHover(freelancerId, e)}
                                onMouseLeave={handleProfileLeave}
                              >
                                {freelancerName}
                              </h4>
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
                            <span>Bid: ${proposal.price ? parseFloat(proposal.price).toFixed(2) : 'N/A'}</span>
                            {job.budget && job.budget.type === 'hourly' && <span className="rate-label">/hr</span>}
                          </div>

                          {proposal.estimatedTime && (
                            <div className="proposal-detail">
                              <i className="fas fa-clock"></i>
                              <span>
                                Estimated Time: {proposal.estimatedTime.value} {proposal.estimatedTime.unit}
                                {proposal.estimatedTime.value > 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
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
                              onClick={() => navigate(`/dashboard/client/chat`)}
                            >
                              <i className="fas fa-comment"></i> Message Freelancer
                            </Button>
                            <Button 
                              className="view-project-btn"
                              onClick={() => navigate(`/dashboard/client/projects`)}
                            >
                              <i className="fas fa-project-diagram"></i> View Project
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}) : (
                    <div className="no-proposals-message">
                      <p>No proposals found for this job.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Profile hover card */}
      {hoverUser && hoverIsVisible && (
        <ProfileHoverCard 
          user={hoverUser}
          isVisible={hoverIsVisible}
          position={hoverPosition}
          onMouseEnter={() => setHoverIsVisible(true)}
          onMouseLeave={handleProfileLeave}
        />
      )}
    </div>
  );
};

export default ProposalReview;