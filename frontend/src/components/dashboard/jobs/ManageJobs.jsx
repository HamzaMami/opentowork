import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsAPI } from '../../../api';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { useAuth } from '../../../context/AuthContext';
import './ManageJobs.css';

const ManageJobs = ({ isAdmin = false }) => {
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedJob, setSelectedJob] = useState(null);
  const [showCloseJobModal, setShowCloseJobModal] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchJobs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const fetchJobs = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Use different API calls for admin vs client
      const response = isAdmin 
        ? await jobsAPI.getJobs() // Get all jobs for admin
        : await jobsAPI.getClientJobs(); // Get only client's jobs
        
      if (response.data.success || response.data.data) {
        setJobs(response.data.data || []);
      } else {
        setError('Failed to fetch jobs');
      }
    } catch (err) {
      console.error(`Error fetching ${isAdmin ? 'all' : 'client'} jobs:`, err);
      setError(err.response?.data?.message || 'An error occurred while fetching jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseJob = async () => {
    if (!selectedJob) return;
    
    setIsProcessing(true);
    try {
      await jobsAPI.updateJobStatus(selectedJob._id, { 
        status: 'cancelled', // Changed from 'closed' to 'cancelled'
        closureReason: closeReason.trim() || 'Job no longer available'
      });
      
      // Update the job status in the local state
      setJobs(prev => prev.map(job => 
        job._id === selectedJob._id 
          ? { ...job, status: 'cancelled', closureReason: closeReason.trim() || 'Job no longer available' } 
          : job
      ));
      
      setShowCloseJobModal(false);
      setSelectedJob(null);
      setCloseReason('');
    } catch (err) {
      console.error('Error closing job:', err);
      setError('Failed to close job. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditJob = (jobId) => {
    if (isAdmin) {
      navigate(`/dashboard/admin/edit-job/${jobId}`);
    } else {
      navigate(`/dashboard/client/edit-job/${jobId}`);
    }
  };

  const handleViewProposals = (jobId) => {
    if (isAdmin) {
      navigate(`/dashboard/admin/proposals/${jobId}`);
    } else {
      navigate(`/dashboard/client/proposals/${jobId}`);
    }
  };
  
  const handleViewJobDetails = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'open': return 'status-open';
      case 'in-progress': return 'status-in-progress';
      case 'completed': return 'status-completed';
      case 'closed': return 'status-closed';
      default: return '';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return 'fa-bullhorn';
      case 'in-progress': return 'fa-tasks';
      case 'completed': return 'fa-check-circle';
      case 'closed': return 'fa-ban';
      default: return 'fa-question-circle';
    }
  };

  const getFilteredJobs = () => {
    if (activeTab === 'all') return jobs;
    // Special case for 'closed' tab to show jobs with 'cancelled' status
    if (activeTab === 'closed') {
      return jobs.filter(job => job.status === 'cancelled');
    }
    return jobs.filter(job => job.status === activeTab);
  };

  const filteredJobs = getFilteredJobs();
  const counts = {
    open: jobs.filter(job => job.status === 'open').length,
    'in-progress': jobs.filter(job => job.status === 'in-progress').length,
    completed: jobs.filter(job => job.status === 'completed').length,
    closed: jobs.filter(job => job.status === 'cancelled').length, // Fixed: Count 'cancelled' jobs as 'closed'
    all: jobs.length
  };

  return (
    <div className="manage-jobs-container">
      <div className="manage-jobs-header">
        <h1>{isAdmin ? 'Manage Platform Jobs' : 'Manage Your Jobs'}</h1>
        {!isAdmin && (
          <Button 
            onClick={() => navigate('/dashboard/client/post-job')}
            className="post-job-button"
          >
            <i className="fas fa-plus-circle"></i> Post New Job
          </Button>
        )}
      </div>
      
      {error && (
        <div className="manage-jobs-error">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
        </div>
      )}
      
      <div className="job-status-tabs">
        <button 
          className={`status-tab ${activeTab === 'all' ? 'active' : ''}`} 
          onClick={() => setActiveTab('all')}
        >
          All Jobs <span className="tab-count">{counts.all}</span>
        </button>
        <button 
          className={`status-tab ${activeTab === 'open' ? 'active' : ''}`} 
          onClick={() => setActiveTab('open')}
        >
          Open <span className="tab-count">{counts.open}</span>
        </button>
        <button 
          className={`status-tab ${activeTab === 'in-progress' ? 'active' : ''}`} 
          onClick={() => setActiveTab('in-progress')}
        >
          In Progress <span className="tab-count">{counts['in-progress']}</span>
        </button>
        <button 
          className={`status-tab ${activeTab === 'completed' ? 'active' : ''}`} 
          onClick={() => setActiveTab('completed')}
        >
          Completed <span className="tab-count">{counts.completed}</span>
        </button>
        <button 
          className={`status-tab ${activeTab === 'closed' ? 'active' : ''}`} 
          onClick={() => setActiveTab('closed')}
        >
          Closed <span className="tab-count">{counts.closed}</span>
        </button>
      </div>
      
      {isLoading ? (
        <div className="jobs-loading">
          <div className="loading-spinner"></div>
          <p>Loading {isAdmin ? 'all' : 'your'} jobs...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="no-jobs-card">
          <CardContent>
            <div className="no-jobs-message">
              <i className="fas fa-briefcase"></i>
              <h3>No jobs found</h3>
              <p>
                {activeTab === 'all'
                  ? isAdmin 
                    ? "There are no jobs in the system currently."
                    : "You haven't posted any jobs yet. Post a job to start hiring freelancers."
                  : `No ${activeTab} jobs found.`}
              </p>
              {activeTab === 'all' && !isAdmin && (
                <Button
                  onClick={() => navigate('/dashboard/client/post-job')}
                  className="post-job-button"
                >
                  <i className="fas fa-plus-circle"></i> Post Your First Job
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="jobs-list">
          {filteredJobs.map((job) => (
            <Card key={job._id} className="job-card">
              <CardContent>
                <div className="job-card-header">
                  <h3 className="job-title" onClick={() => handleViewJobDetails(job._id)}>
                    {job.title}
                  </h3>
                  <div className={`job-status ${getStatusClass(job.status)}`}>
                    <i className={`fas ${getStatusIcon(job.status)}`}></i>
                    <span>
                      {job.status === 'open' ? 'Open' : 
                       job.status === 'in-progress' ? 'In Progress' : 
                       job.status === 'completed' ? 'Completed' : 'Closed'}
                    </span>
                  </div>
                </div>
                
                {isAdmin && job.client && (
                  <div className="job-client-info">
                    <i className="fas fa-user"></i>
                    <span>Posted by: {job.client.name || 'Unknown Client'}</span>
                  </div>
                )}
                
                <div className="job-meta">
                  <div className="job-meta-item">
                    <i className="fas fa-calendar-alt"></i>
                    <span>Posted: {formatDate(job.createdAt)}</span>
                  </div>
                  <div className="job-meta-item">
                    <i className="fas fa-money-bill-wave"></i>
                    <span>
                      Budget: ${job.budget.min} - ${job.budget.max}
                      {job.budget.type === 'hourly' ? '/hr' : ''}
                    </span>
                  </div>
                  <div className="job-meta-item">
                    <i className="fas fa-user-friends"></i>
                    <span>Proposals: {job.proposals?.length || 0}</span>
                  </div>
                </div>
                
                <div className="job-skills">
                  {job.skills.slice(0, 4).map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                  {job.skills.length > 4 && (
                    <span className="skill-tag">+{job.skills.length - 4} more</span>
                  )}
                </div>
                
                <div className="job-actions">
                  <Button 
                    onClick={() => handleViewProposals(job._id)}
                    className="view-proposals-btn"
                  >
                    <i className="fas fa-file-alt"></i> View Proposals
                  </Button>
                  
                  {job.status === 'open' && !isAdmin && (
                    <>
                      <Button 
                        onClick={() => handleEditJob(job._id)}
                        className="edit-job-btn"
                      >
                        <i className="fas fa-edit"></i> Edit
                      </Button>
                      
                      <Button 
                        onClick={() => {
                          setSelectedJob(job);
                          setShowCloseJobModal(true);
                        }}
                        className="close-job-btn"
                      >
                        <i className="fas fa-times-circle"></i> Close Job
                      </Button>
                    </>
                  )}
                  
                  {isAdmin && job.status === 'open' && (
                    <Button 
                      onClick={() => handleEditJob(job._id)}
                      className="edit-job-btn"
                    >
                      <i className="fas fa-edit"></i> Edit
                    </Button>
                  )}
                  
                  <Button 
                    onClick={() => handleViewJobDetails(job._id)}
                    className="view-details-btn"
                  >
                    <i className="fas fa-eye"></i> View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Close Job Modal */}
      {showCloseJobModal && selectedJob && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Close Job</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowCloseJobModal(false);
                  setSelectedJob(null);
                  setCloseReason('');
                }}
                disabled={isProcessing}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <p>Are you sure you want to close this job?</p>
              <div className="job-title-preview">"{selectedJob.title}"</div>
              
              <div className="form-group">
                <label htmlFor="closeReason">Reason for closing (optional)</label>
                <textarea
                  id="closeReason"
                  value={closeReason}
                  onChange={(e) => setCloseReason(e.target.value)}
                  placeholder="e.g., Found a freelancer outside the platform, No longer needed, etc."
                  rows={3}
                  disabled={isProcessing}
                ></textarea>
              </div>
              
              <p className="modal-note">
                <i className="fas fa-info-circle"></i> Note: Once closed, a job can't be reopened.
              </p>
            </div>
            
            <div className="modal-actions">
              <Button
                onClick={handleCloseJob}
                className="confirm-close-btn"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Closing...
                  </>
                ) : (
                  'Close Job'
                )}
              </Button>
              
              <Button
                onClick={() => {
                  setShowCloseJobModal(false);
                  setSelectedJob(null);
                  setCloseReason('');
                }}
                className="cancel-btn"
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageJobs;