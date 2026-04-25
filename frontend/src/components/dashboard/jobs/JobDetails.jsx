import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { jobsAPI, usersAPI } from '../../../api';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import ProfileHoverCard from '../../ui/ProfileHoverCard';
import './JobDetails.css';

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposal, setProposal] = useState({
    coverLetter: '',
    price: '',
    estimatedTime: {
      value: '',
      unit: 'day'
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proposalError, setProposalError] = useState('');
  const [proposalSuccess, setProposalSuccess] = useState('');
  const [similarJobs, setSimilarJobs] = useState([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);
  const [clientProfile, setClientProfile] = useState(null);
  const [profileHover, setProfileHover] = useState(false);
  const [hoverPosition, setHoverPosition] = useState({ top: 0, left: 0 });
  const hoverTimeoutRef = useRef(null);

  // Define fetchSimilarJobs before using it in useEffect
  const fetchSimilarJobs = async (category) => {
    setIsLoadingSimilar(true);
    try {
        // Filter by category and exclude current job
        const response = await jobsAPI.getJobs({ 
          category, 
          status: 'open',
          limit: 4
        });
        
        if (response.data.success) {
          // Filter out the current job and limit to 3
          const filtered = response.data.data
            .filter(item => item._id !== jobId)
            .slice(0, 3);
            
          setSimilarJobs(filtered);
        }
      } catch (err) {
        console.error('Error fetching similar jobs:', err);
      } finally {
        setIsLoadingSimilar(false);
      }
    };

  useEffect(() => {
    const fetchJobDetails = async () => {
      setIsLoading(true);
      try {
        const response = await jobsAPI.getJobById(jobId);
        if (response.data.success) {
          setJob(response.data.data);
          
          // Fetch client details including profile picture if client exists
          if (response.data.data.client && response.data.data.client._id) {
            try {
              console.log('Fetching client profile data for:', response.data.data.client._id);
              const clientResponse = await usersAPI.getById(response.data.data.client._id);
              if (clientResponse.data) {
                console.log('Client data received:', clientResponse.data);
                
                // Check if createdAt date exists, if not, try to fetch it specifically
                if (!clientResponse.data.createdAt) {
                  try {
                    // Make a specific request to get user account creation date
                    const userAccountResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/${response.data.data.client._id}/account-info`, {
                      headers: {
                        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user'))?.token || ''}`
                      }
                    });
                    
                    if (userAccountResponse.ok) {
                      const accountData = await userAccountResponse.json();
                      console.log('Account creation date fetched:', accountData);
                      
                      // Merge the account creation date with the client profile
                      setClientProfile({
                        ...clientResponse.data,
                        createdAt: accountData.createdAt
                      });
                    } else {
                      console.warn('Failed to fetch account creation date');
                      setClientProfile(clientResponse.data);
                    }
                  } catch (accountErr) {
                    console.error('Error fetching user account creation date:', accountErr);
                    setClientProfile(clientResponse.data);
                  }
                } else {
                  setClientProfile(clientResponse.data);
                }
              }
            } catch (clientErr) {
              console.error('Error fetching client details:', clientErr);
            }
          }
          
          // Fetch similar jobs based on category
          if (response.data.data.category) {
            fetchSimilarJobs(response.data.data.category);
          }
        } else {
          setError('Failed to fetch job details');
        }
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError('An error occurred while fetching job details');
      } finally {
        setIsLoading(false);
      }
    };

    if (jobId) {
      fetchJobDetails();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    try {
      // Create a date object from the string
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      // Always use the localized date format rather than checking if it's today
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date format error';
    }
  };

  // Format date for display, using a special version for member since date
  const formatMemberSinceDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    try {
      // Create a date object from the string
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      // Always format the member since date in a user-friendly way, regardless if it's today
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting member since date:', error);
      return 'Date format error';
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    } catch (error) {
      console.error('Error formatting time ago:', error);
      // Silently handle the error and return empty string
      return '';
    }
  };

  const handleProposalChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'estimatedTime.value' || name === 'estimatedTime.unit') {
      const [parent, child] = name.split('.');
      setProposal(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProposal(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateProposal = () => {
    if (!proposal.coverLetter.trim()) {
      setProposalError('Please provide a cover letter');
      return false;
    }
    
    if (proposal.coverLetter.length < 50) {
      setProposalError('Cover letter must be at least 50 characters');
      return false;
    }
    
    if (!proposal.price || isNaN(proposal.price) || Number(proposal.price) <= 0) {
      setProposalError('Please enter a valid price greater than zero');
      return false;
    }
    
    if (!proposal.estimatedTime.value || isNaN(proposal.estimatedTime.value) || Number(proposal.estimatedTime.value) <= 0) {
      setProposalError('Please enter a valid estimated time value greater than zero');
      return false;
    }
    
    return true;
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    setProposalError('');
    setProposalSuccess('');
    
    if (!validateProposal()) return;
    
    try {
      setIsSubmitting(true);
      
      // Prepare the proposal data with proper number formatting
      const proposalData = {
        coverLetter: proposal.coverLetter,
        price: Number(proposal.price),
        estimatedTime: {
          value: Number(proposal.estimatedTime.value),
          unit: proposal.estimatedTime.unit
        }
      };
      
      const response = await jobsAPI.submitProposal(jobId, proposalData);
      
      if (response.data.success) {
        setProposalSuccess('Your proposal has been submitted successfully!');
        setShowProposalForm(false);
        
        // Refresh job details to get updated proposal count
        const jobResponse = await jobsAPI.getJobById(jobId);
        if (jobResponse.data.success) {
          setJob(jobResponse.data.data);
        }
      } else {
        setProposalError('Failed to submit your proposal');
      }
    } catch (err) {
      console.error('Error submitting proposal:', err);
      setProposalError(err.response?.data?.message || 'An error occurred while submitting your proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if the current user has already submitted a proposal
  const hasSubmittedProposal = () => {
    if (!user || !job || !job.proposals) return false;
    
    return job.proposals.some(proposal => proposal.freelancer._id === user.id);
  };

  // Determine if the user can submit a proposal (must be a freelancer and not already submitted)
  const canSubmitProposal = () => {
    if (!user || user.role !== 'freelancer') return false;
    if (job && job.status !== 'open') return false;
    if (hasSubmittedProposal()) return false;
    if (job && job.client && user.id === job.client._id) return false; // Can't apply to own job
    
    return true;
  };

  const handleEditJob = () => {
    navigate(`/dashboard/client/edit-job/${jobId}`);
  };
  
  const handleManageProposals = () => {
    navigate(`/dashboard/client/job/${jobId}/proposals`);
  };

  const handleSimilarJobClick = (id) => {
    navigate(`/jobs/${id}`);
  };

  // Helper function to safely format currency
  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0';
    }
    return Number(value).toLocaleString();
  };

  // Handle profile hover
  const handleProfileMouseEnter = useCallback((event) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    const rect = event.currentTarget.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    
    // Determine if we should show the card to the left or right based on available space
    const spaceOnRight = windowWidth - rect.right;
    const cardWidth = 300; // approximate width of the hover card
    
    // Position the hover card based on available space
    const position = {
      position: 'fixed',
      zIndex: 1000
    };
    
    // If there's not enough space on the right, show to the left
    if (spaceOnRight < cardWidth + 20) {
      position.top = `${rect.top}px`;
      position.right = `${windowWidth - rect.left + 10}px`; // 10px spacing
      position.left = 'auto';
    } else {
      // Default: show to the right
      position.top = `${rect.top}px`;
      position.left = `${rect.right + 10}px`; // 10px spacing
    }
    
    setHoverPosition(position);
    
    // Add a small delay to prevent flickering on accidental hover
    hoverTimeoutRef.current = setTimeout(() => {
      setProfileHover(true);
    }, 200);
  }, []);
  
  const handleProfileMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    // Add a small delay before hiding
    hoverTimeoutRef.current = setTimeout(() => {
      setProfileHover(false);
    }, 100);
  }, []);
  
  // Function to get image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already a full URL, use it as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Make sure path starts with a slash
    const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    // Construct full URL with base API URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}${normalizedPath}`;
  };

  if (isLoading) {
    return (
      <div className="job-details-container">
        <div className="job-details-loading">
          <div className="loading-spinner"></div>
          <p>Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="job-details-container">
        <div className="job-details-error">
          <i className="fas fa-exclamation-circle"></i>
          <h3>Error Loading Job</h3>
          <p>{error || 'Job not found'}</p>
          <Button onClick={() => navigate('/jobs')}>
            <i className="fas fa-arrow-left"></i> Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="job-details-container">
      <div className="job-details-header">
        <Button className="back-button" onClick={() => navigate('/jobs')}>
          <i className="fas fa-arrow-left"></i> Back to Jobs
        </Button>
        
        <div className="job-status-container">
          <span className={`job-status job-status-${job.status}`}>
            {job.status === 'open' ? 'Open' : 
             job.status === 'in-progress' ? 'In Progress' : 
             job.status === 'completed' ? 'Completed' : 'Closed'}
          </span>
          {job.status === 'closed' && job.closureReason && (
            <span className="closure-reason" title={job.closureReason}>
              <i className="fas fa-info-circle"></i>
            </span>
          )}
        </div>
      </div>

      <div className="job-details-content">
        <div className="main-content">
          <Card className="job-details-card">
            <CardContent>
              <div className="job-details-title-section">
                <h1 className="job-title">{job.title}</h1>
                <div className="job-posted-info">
                  <span className="posted-date">Posted on {formatDate(job.createdAt)}</span>
                </div>
              </div>
              
              <div className="job-details-meta">
                <div className="job-meta-item">
                  <i className="fas fa-building"></i>
                  <span>{job.client?.name || 'Anonymous Client'}</span>
                </div>
                
                <div className="job-meta-item">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{job.location || 'Remote'}</span>
                </div>
                
                <div className="job-meta-item">
                  <i className="fas fa-folder"></i>
                  <span>{job.category}</span>
                </div>
                
                <div className="job-meta-item">
                  <i className="fas fa-layer-group"></i>
                  <span>{job.experienceLevel}</span>
                </div>
              </div>
              
              <div className="job-details-budget">
                <h3>Budget</h3>
                <div className="budget-display">
                  <span className="budget-amount">
                    ${formatCurrency(job.budget?.min)} - ${formatCurrency(job.budget?.max)}
                    {job.budget?.type === 'hourly' && '/hr'}
                  </span>
                  <span className="budget-type">
                    {job.budget?.type === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}
                  </span>
                </div>
                
                {job.duration && (
                  <div className="job-duration">
                    <i className="fas fa-clock"></i>
                    <span>Estimated Duration: {job.duration}</span>
                  </div>
                )}
              </div>
              
              <div className="job-details-description">
                <h3>Description</h3>
                <div className="description-content">
                  {job.description.split('\n').map((paragraph, index) => (
                    paragraph ? <p key={index}>{paragraph}</p> : <br key={index} />
                  ))}
                </div>
              </div>
              
              <div className="job-details-skills">
                <h3>Required Skills</h3>
                <div className="skills-list">
                  {job.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
              
              <div className="job-details-proposals">
                <h3>Proposals</h3>
                <p>
                  <i className="fas fa-users"></i>
                  <span className="proposal-count">{job.proposals?.length || 0} freelancers</span> have submitted proposals
                </p>
              </div>
              
              {proposalSuccess && (
                <div className="proposal-success-message">
                  <i className="fas fa-check-circle"></i>
                  <p>{proposalSuccess}</p>
                </div>
              )}
              
              {user && user.role === 'client' && job.client && user.id === job.client._id && (
                <div className="client-job-actions">
                  <h3>Manage Your Job Posting</h3>
                  <div className="action-buttons">
                    {job.status === 'open' && (
                      <Button 
                        onClick={handleEditJob}
                        className="edit-job-button"
                      >
                        <i className="fas fa-edit"></i> Edit Job
                      </Button>
                    )}
                    <Button 
                      onClick={handleManageProposals}
                      className="manage-proposals-button"
                    >
                      <i className="fas fa-file-alt"></i> View Proposals ({job.proposals?.length || 0})
                    </Button>
                    <Button 
                      onClick={() => navigate('/dashboard/client/jobs')}
                      className="manage-jobs-button"
                    >
                      <i className="fas fa-briefcase"></i> Manage All Jobs
                    </Button>
                  </div>
                </div>
              )}
              
              {canSubmitProposal() && (
                <div className="job-details-actions">
                  {showProposalForm ? (
                    <Card className="proposal-form-card">
                      <CardContent>
                        <h3>Submit a Proposal</h3>
                        
                        {proposalError && (
                          <div className="proposal-error-message">
                            <i className="fas fa-exclamation-circle"></i>
                            <p>{proposalError}</p>
                          </div>
                        )}
                        
                        <form onSubmit={handleSubmitProposal} className="proposal-form">
                          <div className="form-group">
                            <label htmlFor="coverLetter">Cover Letter*</label>
                            <textarea
                              id="coverLetter"
                              name="coverLetter"
                              value={proposal.coverLetter}
                              onChange={handleProposalChange}
                              placeholder="Introduce yourself and explain why you're a good fit for this job..."
                              rows={6}
                              disabled={isSubmitting}
                              required
                            />
                            <div className="char-count">
                              {proposal.coverLetter.length}/1000 characters
                              {proposal.coverLetter.length < 50 && (
                                <span className="char-count-warning"> (minimum 50 characters)</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="form-group">
                            <label htmlFor="price">Your Bid ($)*</label>
                            <input
                              type="number"
                              id="price"
                              name="price"
                              value={proposal.price}
                              onChange={handleProposalChange}
                              placeholder="Enter your price"
                              min="1"
                              disabled={isSubmitting}
                              required
                            />
                            {job.budget.type === 'hourly' && <span className="input-suffix">/hr</span>}
                            
                            {proposal.price && job.budget.min && job.budget.max && (
                              <div className="bid-comparison">
                                {Number(proposal.price) < job.budget.min && (
                                  <p className="bid-warning">
                                    <i className="fas fa-exclamation-triangle"></i>
                                    Your bid is below the client's minimum budget.
                                  </p>
                                )}
                                
                                {Number(proposal.price) > job.budget.max && (
                                  <p className="bid-warning">
                                    <i className="fas fa-exclamation-triangle"></i>
                                    Your bid is above the client's maximum budget.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="form-group estimated-time-group">
                            <label>Estimated Completion Time*</label>
                            <div className="estimated-time-inputs">
                              <input
                                type="number"
                                name="estimatedTime.value"
                                value={proposal.estimatedTime.value}
                                onChange={handleProposalChange}
                                placeholder="Time"
                                min="1"
                                disabled={isSubmitting}
                                required
                              />
                              
                              <select
                                name="estimatedTime.unit"
                                value={proposal.estimatedTime.unit}
                                onChange={handleProposalChange}
                                disabled={isSubmitting}
                              >
                                <option value="hour">Hour(s)</option>
                                <option value="day">Day(s)</option>
                                <option value="week">Week(s)</option>
                                <option value="month">Month(s)</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="proposal-tips">
                            <h4><i className="fas fa-lightbulb"></i> Tips for a Great Proposal</h4>
                            <ul>
                              <li>Explain why you're the best fit for this particular job</li>
                              <li>Be specific about your relevant skills and experience</li>
                              <li>Ask clarifying questions about the project if needed</li>
                              <li>Set realistic expectations for time and budget</li>
                            </ul>
                          </div>
                          
                          <div className="proposal-form-actions">
                            <Button 
                              type="submit" 
                              disabled={isSubmitting}
                              className="submit-proposal-btn"
                            >
                              {isSubmitting ? (
                                <>
                                  <i className="fas fa-spinner fa-spin"></i> Submitting...
                                </>
                              ) : (
                                'Submit Proposal'
                              )}
                            </Button>
                            
                            <Button 
                              type="button"
                              onClick={() => setShowProposalForm(false)}
                              disabled={isSubmitting}
                              className="cancel-proposal-btn"
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="apply-button-container">
                      <h3>Interested in this job?</h3>
                      <Button 
                        onClick={() => setShowProposalForm(true)}
                        className="submit-proposal-button"
                      >
                        <i className="fas fa-paper-plane"></i> Submit a Proposal
                      </Button>
                      <p className="proposal-note">
                        <i className="fas fa-info-circle"></i> 
                        Submitting a thoughtful proposal increases your chances of being hired.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {hasSubmittedProposal() && (
                <div className="proposal-already-submitted">
                  <i className="fas fa-check-circle"></i>
                  <p>You have already submitted a proposal for this job.</p>
                  <Button onClick={() => navigate('/dashboard/freelancer/proposals')}>
                    View My Proposals
                  </Button>
                </div>
              )}
              
              {user && user.role === 'client' && job.client && user.id === job.client._id && (
                <div className="own-job-message">
                  <i className="fas fa-info-circle"></i>
                  <p>This is your job posting. You can manage it from your dashboard.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="sidebar-content">
          <Card className="client-info-card">
            <CardContent>
              <h3>About the Client</h3>
              <div 
                className="client-info"
                onMouseEnter={handleProfileMouseEnter}
                onMouseLeave={handleProfileMouseLeave}
              >
                {clientProfile && clientProfile.profileImage && (
                  <div className="client-profile-picture">
                    <img 
                      src={getImageUrl(clientProfile.profileImage)} 
                      alt={`${job.client?.name || 'Client'} profile`}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/70?text=' + (job.client?.name?.charAt(0) || 'C');
                      }}
                    />
                  </div>
                )}
                <div className="client-name">
                  <i className="fas fa-user"></i>
                  <span>{job.client?.name || 'Anonymous Client'}</span>
                </div>
                <div className="client-joined">
                  <i className="fas fa-calendar-alt"></i>
                  <span>Member since {formatMemberSinceDate(clientProfile?.createdAt || job.client?.createdAt)}</span>
                </div>
                <div className="client-location">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{job.location || 'Remote'}</span>
                </div>
              </div>
              {profileHover && clientProfile && (
                <ProfileHoverCard 
                  user={clientProfile} 
                  isVisible={profileHover}
                  position={hoverPosition}
                  onMouseEnter={() => setProfileHover(true)}
                  onMouseLeave={() => setProfileHover(false)}
                />
              )}
            </CardContent>
          </Card>
          
          {similarJobs.length > 0 && (
            <Card className="similar-jobs-card">
              <CardContent>
                <h3>Similar Jobs</h3>
                <div className="similar-jobs-list">
                  {isLoadingSimilar ? (
                    <div className="loading-similar">
                      <div className="loading-spinner-small"></div>
                      <p>Loading similar jobs...</p>
                    </div>
                  ) : (
                    similarJobs.map(similarJob => (
                      <div 
                        key={similarJob._id} 
                        className="similar-job-item"
                        onClick={() => handleSimilarJobClick(similarJob._id)}
                      >
                        <div className="similar-job-title">{similarJob.title}</div>
                        <div className="similar-job-budget">
                          ${formatCurrency(similarJob.budget?.min)} - ${formatCurrency(similarJob.budget?.max)}
                          {similarJob.budget?.type === 'hourly' ? '/hr' : ''}
                        </div>
                        <div className="similar-job-posted">
                          Posted {formatTimeAgo(similarJob.createdAt)}
                        </div>
                      </div>
                    ))
                  )}
                  
                  <Button 
                    onClick={() => navigate('/jobs', { 
                      state: { category: job.category }
                    })}
                    className="view-more-jobs"
                  >
                    View More Similar Jobs
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card className="job-actions-card">
            <CardContent>
              <h3>Quick Actions</h3>
              <div className="sidebar-actions">
                {user && user.role === 'freelancer' && !hasSubmittedProposal() && job.status === 'open' && (
                  <Button
                    onClick={() => setShowProposalForm(true)}
                    className="sidebar-action-button"
                    disabled={user.id === job.client?._id}
                  >
                    <i className="fas fa-paper-plane"></i>
                    Submit Proposal
                  </Button>
                )}
                
                <Button
                  onClick={() => {
                    // Create a shareable URL
                    const shareUrl = window.location.href;
                    navigator.clipboard.writeText(shareUrl);
                    alert('Job link copied to clipboard!');
                  }}
                  className="sidebar-action-button secondary"
                >
                  <i className="fas fa-share-alt"></i>
                  Share Job
                </Button>
                
                <Button
                  onClick={() => navigate('/jobs')}
                  className="sidebar-action-button secondary"
                >
                  <i className="fas fa-search"></i>
                  Browse More Jobs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;