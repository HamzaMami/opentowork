import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { jobsAPI } from '../../api';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { getImageUrl } from '../../utils/imageUtils';
import './ActiveProjects.css';

const ActiveProjects = () => {
  const { user, freelancerProfile } = useAuth();
  const navigate = useNavigate();
  const [activeProjects, setActiveProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userRole = user?.role;
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchActiveProjects = async () => {
      setLoading(true);
      try {
        let response;
        
        if (userRole === 'client') {
          response = await jobsAPI.getClientJobs();
          
          // For client, also fetch accepted proposals to get freelancer details
          try {
            // Get all proposals for the client's jobs
            const allProposalsRes = await jobsAPI.getClientProposals();
            
            if (allProposalsRes?.data?.success && response.data?.success) {
              // Extract accepted proposals
              const acceptedProposals = allProposalsRes.data.data.filter(
                proposal => proposal.status === 'accepted'
              );
              
              console.log(`Found ${acceptedProposals.length} accepted proposals`);
              
              // Map of job ID to freelancer info from accepted proposals
              const jobFreelancerMap = {};
              
              acceptedProposals.forEach(proposal => {
                if (proposal.job && proposal.job._id && proposal.freelancer) {
                  jobFreelancerMap[proposal.job._id] = {
                    _id: proposal.freelancer._id,
                    name: proposal.freelancer.name,
                    profileImage: proposal.freelancer.profileImage
                  };
                }
              });
              
              // Enhance jobs with freelancer information
              if (response.data.data) {
                response.data.data = response.data.data.map(job => {
                  // If job already has assignedFreelancer, use it
                  if (job.assignedFreelancer && job.assignedFreelancer.name) {
                    return job;
                  }
                  
                  // Otherwise check if we have freelancer info from accepted proposals
                  if (jobFreelancerMap[job._id]) {
                    return {
                      ...job,
                      assignedFreelancer: jobFreelancerMap[job._id]
                    };
                  }
                  
                  // If job has accepted proposals embedded
                  if (job.proposals && job.proposals.length > 0) {
                    const acceptedProposal = job.proposals.find(p => p.status === 'accepted');
                    if (acceptedProposal && acceptedProposal.freelancer) {
                      return {
                        ...job,
                        assignedFreelancer: {
                          _id: acceptedProposal.freelancer._id,
                          name: acceptedProposal.freelancer.name,
                          profileImage: acceptedProposal.freelancer.profileImage
                        }
                      };
                    }
                  }
                  
                  return job;
                });
              }
            }
          } catch (err) {
            console.error('Error fetching proposals data:', err);
            // Continue with what we have even if proposal fetching fails
          }
          
          // Log for debugging - to see what freelancer data we're getting
          if (response.data?.success && response.data?.data?.length > 0) {
            const assignedFreelancers = response.data.data.filter(job => job.assignedFreelancer);
            console.log(`Found ${assignedFreelancers.length} projects with assigned freelancers`);
            if (assignedFreelancers.length > 0) {
              console.log('Sample project freelancer data:', assignedFreelancers[0].assignedFreelancer);
            } else {
              console.log('Sample project freelancer data: No assigned freelancers');
            }
          }
        } else if (userRole === 'freelancer') {
          response = await jobsAPI.getFreelancerJobs();
          
          // Also get freelancer proposals to check for accepted proposals
          const proposalsRes = await jobsAPI.getFreelancerProposals();
          if (proposalsRes.data?.success) {
            const acceptedProposals = proposalsRes.data.data.filter(
              proposal => proposal.status === 'accepted'
            );
            
            // Log for debugging
            console.log('Accepted proposals:', acceptedProposals.length);
            
            // If there are accepted proposals, merge with jobs data
            if (acceptedProposals.length > 0) {
              const acceptedJobIds = new Set(acceptedProposals.map(p => p.job._id));
              
              // Log for debugging
              console.log('Accepted job IDs:', Array.from(acceptedJobIds));
                
              // Find any jobs from the original response that match these IDs
              if (response.data?.success && response.data?.data) {
                const jobsData = [...response.data.data];
                
                // Check if the accepted proposal jobs are already in our jobs array
                acceptedProposals.forEach(proposal => {
                  const jobExists = jobsData.some(job => job._id === proposal.job._id);
                  
                  if (!jobExists && proposal.job) {
                    // If not, ensure it has a proper status and add it
                    const jobWithStatus = {
                      ...proposal.job,
                      status: proposal.job.status || 'in-progress',
                      assignedFreelancer: {
                        _id: user.id || user._id,
                        name: user.name,
                        profileImage: freelancerProfile?.profileImage
                      }
                    };
                    jobsData.push(jobWithStatus);
                  }
                });
                
                // Update the response data
                response.data.data = jobsData;
              }
            }
          }
        } else {
          setError('Unknown user role');
          return;
        }
        
        if (response.data.success) {
          // For freelancers, consider jobs with any status where they are assigned
          // or have an accepted proposal
          let projectsToShow = [];
          
          if (userRole === 'freelancer') {
            // Include any job that's active OR where the freelancer is assigned
            projectsToShow = response.data.data.filter(job => {
              // Check job status
              const isActiveStatus = job.status === 'in-progress' || 
                                    job.status === 'active' || 
                                    job.status === 'ongoing';
              
              // Check if the freelancer is assigned to this job
              const isAssigned = job.assignedFreelancer && 
                               (job.assignedFreelancer._id === user.id || 
                                job.assignedFreelancer._id === user._id);
              
              // Check if the job has an accepted proposal from this freelancer
              const hasAcceptedProposal = job.proposals && 
                                        job.proposals.some(p => 
                                          p.freelancer._id === user.id && 
                                          p.status === 'accepted');
              
              // Consider the job active if any of these conditions are met
              return isActiveStatus || isAssigned || hasAcceptedProposal;
            });
            
            // Log for debugging
            console.log(`Found ${projectsToShow.length} projects for freelancer`);
            
            // Enhance projects with freelancer's own information
            const enhancedProjects = projectsToShow.map(job => ({
              ...job,
              freelancerInfo: {
                name: user.name,
                profileImage: freelancerProfile?.profileImage || null
              }
            }));
            
            setActiveProjects(enhancedProjects);
          } else {
            // For clients, enhance projects with more detailed freelancer information
            const activeJobs = response.data.data.filter(job => 
              job.status === 'in-progress' || 
              job.status === 'active' ||
              job.status === 'ongoing'
            );
            
            // Make sure we have all necessary freelancer information
            const enhancedClientProjects = activeJobs.map(job => {
              // If the job has an accepted proposal but no assigned freelancer info,
              // extract the freelancer information from the accepted proposal
              if (!job.assignedFreelancer && job.proposals && job.proposals.length > 0) {
                const acceptedProposal = job.proposals.find(p => p.status === 'accepted');
                if (acceptedProposal && acceptedProposal.freelancer) {
                  return {
                    ...job,
                    assignedFreelancer: {
                      _id: acceptedProposal.freelancer._id,
                      name: acceptedProposal.freelancer.name || 'Freelancer',
                      profileImage: acceptedProposal.freelancer.profileImage
                    }
                  };
                }
              }
              return job;
            });
            
            setActiveProjects(enhancedClientProjects);
          }
        } else {
          setError('Failed to fetch projects');
        }
      } catch (err) {
        console.error('Error fetching active projects:', err);
        setError(err.response?.data?.message || 'An error occurred while fetching projects');
      } finally {
        setLoading(false);
      }
    };

    if (user && userRole) {
      fetchActiveProjects();
    }
  }, [user, userRole, freelancerProfile]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleMarkCompleted = async (jobId) => {
    try {
      const confirmed = window.confirm("Are you sure you want to mark this project as completed?");
      if (!confirmed) return;
      
      const response = await jobsAPI.updateJobStatus(jobId, { status: 'completed' });
      if (response.data.success) {
        // Update UI to reflect the change
        setActiveProjects(prevProjects => 
          prevProjects.filter(project => project._id !== jobId)
        );
      } else {
        alert('Failed to mark project as completed');
      }
    } catch (err) {
      console.error('Error marking project as completed:', err);
      alert(err.response?.data?.message || 'An error occurred while updating the project');
    }
  };

  const calculateProjectDuration = (startDate) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Started today';
    if (diffDays === 1) return '1 day';
    return `${diffDays} days`;
  };

  const calculateProgressPercentage = (startDate, estimatedDuration) => {
    if (!startDate || !estimatedDuration) return 0;
    
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Extract number from estimated duration (e.g., "5 days" => 5)
    const durationMatch = estimatedDuration.match(/\d+/);
    if (!durationMatch) return 0;
    
    const totalDuration = parseInt(durationMatch[0], 10);
    if (totalDuration <= 0) return 0;
    
    const progress = Math.min(100, Math.round((diffDays / totalDuration) * 100));
    return progress;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'in-progress':
        return 'status-in-progress';
      case 'active':
        return 'status-active';
      case 'ongoing':
        return 'status-ongoing';
      default:
        return 'status-in-progress';
    }
  };

  const getDisplayStatus = (status) => {
    switch (status) {
      case 'in-progress':
        return 'In Progress';
      case 'active':
        return 'Active';
      case 'ongoing':
        return 'Ongoing';
      default:
        return 'In Progress';
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const filteredProjects = filter === 'all' 
    ? activeProjects 
    : activeProjects.filter(project => {
        // This can be expanded to filter by other criteria like timeline, budget, etc.
        if (filter === 'recent') {
          const projectDate = new Date(project.startDate || project.updatedAt);
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return projectDate >= oneWeekAgo;
        }
        return true;
      });

  if (loading) {
    return (
      <div className="active-projects-container">
        <div className="loading-spinner"></div>
        <p>Loading active projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="active-projects-container">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (activeProjects.length === 0) {
    return (
      <div className="active-projects-container">
        <Card className="empty-projects-card">
          <CardContent>
            <div className="empty-state">
              <i className="fas fa-clipboard-list empty-icon"></i>
              <h3>No Active Projects</h3>
              {userRole === 'client' ? (
                <>
                  <p>You don't have any active projects at the moment. Post a job to get started.</p>
                  <Button onClick={() => navigate('/dashboard/client/post-job')}>
                    <i className="fas fa-plus"></i> Post a New Job
                  </Button>
                </>
              ) : (
                <>
                  <p>You don't have any active projects at the moment. Browse available jobs to find work.</p>
                  <Button onClick={() => navigate('/jobs')}>
                    <i className="fas fa-search"></i> Browse Jobs
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="active-projects-container">
      <h2>Active Projects</h2>
      <p className="section-description">
        {userRole === 'client' 
          ? 'Projects currently in progress with freelancers' 
          : 'Your current projects in progress'
        }
      </p>

      <div className="filter-controls">
        <div className="filter-buttons">
          <button 
            className={`filter-button ${filter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            All Projects
          </button>
          <button 
            className={`filter-button ${filter === 'recent' ? 'active' : ''}`}
            onClick={() => handleFilterChange('recent')}
          >
            Recent Projects
          </button>
        </div>
        <div className="projects-count">
          Showing {filteredProjects.length} of {activeProjects.length} projects
        </div>
      </div>

      <div className="projects-grid">
        {filteredProjects.map((project) => (
          <Card key={project._id} className="project-card">
            <CardContent>
              <div className="project-header">
                <h3>{project.title}</h3>
                <span className={`project-status ${getStatusBadgeClass(project.status)}`}>
                  {getDisplayStatus(project.status)}
                </span>
              </div>
              
              <div className="project-details">
                <div className="project-detail">
                  <i className="fas fa-calendar-alt"></i>
                  <span>Started: {formatDate(project.startDate || project.updatedAt)}</span>
                </div>
                
                <div className="project-detail">
                  <i className="fas fa-clock"></i>
                  <span>Duration: {calculateProjectDuration(project.startDate || project.updatedAt)}</span>
                </div>
                
                <div className="project-detail">
                  <i className="fas fa-money-bill-wave"></i>
                  <span>
                    Budget: ${project.budget.amount || (project.budget.min + '-' + project.budget.max)}
                    {project.budget.type === 'hourly' ? '/hr' : ' (fixed)'}
                  </span>
                </div>
              </div>

              {project.estimatedDuration && (
                <div className="project-progress">
                  <div className="progress-header">
                    <h4>Project Progress</h4>
                    <span>{calculateProgressPercentage(project.startDate || project.updatedAt, project.estimatedDuration)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{width: `${calculateProgressPercentage(project.startDate || project.updatedAt, project.estimatedDuration)}%`}}
                    ></div>
                  </div>
                </div>
              )}

              {userRole === 'client' && (
                <div className="freelancer-info-section">
                  <h4>Freelancer</h4>
                  <div className="project-freelancer">
                    <div className="freelancer-avatar">
                      {project.assignedFreelancer?.profileImage ? (
                        <img 
                          src={getImageUrl(project.assignedFreelancer.profileImage)} 
                          alt={project.assignedFreelancer?.name || 'Freelancer'} 
                        />
                      ) : (
                        <i className="fas fa-user"></i>
                      )}
                    </div>
                    <div>
                      <h5>
                        {project.assignedFreelancer?.name || 
                         (project.proposals?.find(p => p.status === 'accepted')?.freelancer?.name) || 
                         'Freelancer'}
                      </h5>
                      {!project.assignedFreelancer?.name && 
                       !project.proposals?.find(p => p.status === 'accepted')?.freelancer?.name && (
                        <small className="freelancer-note">Assigned freelancer's information will appear here</small>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {userRole === 'freelancer' && (
                <>
                  <div className="client-info-section">
                    <h4>Client</h4>
                    <div className="project-client">
                      <div className="client-avatar">
                        {project.client?.profileImage ? (
                          <img 
                            src={getImageUrl(project.client.profileImage)} 
                            alt={project.client.name} 
                          />
                        ) : (
                          <i className="fas fa-user"></i>
                        )}
                      </div>
                      <div>
                        <h5>{project.client?.name || 'Client'}</h5>
                      </div>
                    </div>
                  </div>
                  
                  <div className="freelancer-info-section">
                    <h4>You as Freelancer</h4>
                    <div className="project-freelancer">
                      <div className="freelancer-avatar">
                        {freelancerProfile?.profileImage ? (
                          <img 
                            src={getImageUrl(freelancerProfile.profileImage)} 
                            alt={user.name} 
                          />
                        ) : (
                          <i className="fas fa-user"></i>
                        )}
                      </div>
                      <div>
                        <h5>{user.name || 'You'}</h5>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              <div className="project-actions">
                <Button 
                  className="message-btn"
                  onClick={() => navigate(`/dashboard/${userRole}/chat/${userRole === 'client' 
                    ? project.assignedFreelancer?._id 
                    : project.client?._id}`)}
                >
                  <i className="fas fa-comment"></i> Message
                </Button>

                <Button 
                  className="view-details-btn"
                  onClick={() => navigate(`/jobs/${project._id}`)}
                >
                  <i className="fas fa-eye"></i> View Details
                </Button>

                {userRole === 'client' && (
                  <Button 
                    className="complete-btn"
                    onClick={() => handleMarkCompleted(project._id)}
                  >
                    <i className="fas fa-check-circle"></i> Mark Completed
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ActiveProjects;