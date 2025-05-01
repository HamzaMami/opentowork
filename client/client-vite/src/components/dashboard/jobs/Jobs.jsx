import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useJobFilters } from '../../../hooks/useJobFilters';
import { jobsAPI } from '../../../api';
import { FilterComponent } from './JobUtils';
import { JobCard } from './JobCard';
import { Pagination } from './JobUtils';
import { Button } from '../../ui/button';
import './Jobs.css';

const Jobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalJobs: 0
  });

  const {
    searchQuery,
    setSearchQuery,
    filters,
    handleFilterChange,
    applyFilters,
    resetFilters
  } = useJobFilters();

  const fetchJobs = useCallback(async (params = new URLSearchParams()) => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobsAPI.getJobs({
        search: params.get('search') || '',
        page: params.get('page') || '1',
        category: params.get('category') || '',
        experienceLevel: params.get('experienceLevel') || '',
        sortBy: params.get('sortBy') || 'newest',
        status: user?.role === 'client' ? 'all' : 'open'
      });

      if (response.data.success) {
        setJobs(response.data.data);
        setPagination({
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages,
          totalJobs: response.data.totalJobs
        });
      } else {
        setError('Failed to fetch jobs');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while fetching jobs');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    fetchJobs(params);
  }, [fetchJobs]);

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', newPage);
    navigate({ search: params.toString() });
  };

  const handleJobClick = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const handleStatusChange = async (jobId, newStatus) => {
    const updatedJobs = jobs.map(job => 
      job._id === jobId ? { ...job, status: newStatus } : job
    );
    setJobs(updatedJobs);
    
    // Refetch jobs after a status change to ensure we have the latest data
    const params = new URLSearchParams(window.location.search);
    await fetchJobs(params);
  };

  if (error) {
    return (
      <div className="jobs-error">
        <h3>Error</h3>
        <p>{error}</p>
        <Button onClick={() => fetchJobs()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="jobs-container">
      <div className="jobs-header">
        <h1>Find the Perfect Job</h1>
        <p className="jobs-subtitle">Browse through thousands of job opportunities</p>
      </div>

      <div className="jobs-search-section">
        <div className="jobs-search-form">
          <div className="search-input-container">
            <input
              type="text"
              className="jobs-search-input"
              placeholder="Search jobs by title, skills, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
            />
            <button className="jobs-search-button" onClick={applyFilters}>
              <i className="fas fa-search"></i>
              Search Jobs
            </button>
          </div>
        </div>
      </div>

      <div className="jobs-main-content">
        <aside className="jobs-filters">
          <FilterComponent
            filters={filters}
            handleFilterChange={handleFilterChange}
            applyFilters={applyFilters}
            resetFilters={resetFilters}
          />

          {user?.role === 'client' && (
            <div className="post-job-card">
              <h3>Need to Hire?</h3>
              <p>Post a job to find the perfect freelancer for your project</p>
              <button 
                className="post-job-button"
                onClick={() => navigate('/dashboard/client/post-job')}
              >
                <i className="fas fa-plus-circle"></i>
                Post a Job
              </button>
            </div>
          )}

          {user?.role === 'freelancer' && (
            <div className="freelancer-tips-card">
              <h3>Tips for Success</h3>
              <ul>
                <li>Complete your profile to increase visibility</li>
                <li>Apply to jobs that match your skills</li>
                <li>Write personalized proposals</li>
                <li>Maintain good communication</li>
              </ul>
            </div>
          )}
        </aside>

        <main className="jobs-listings">
          <div className="jobs-count">
            {pagination.totalJobs} jobs found
          </div>

          <div className="jobs-list">
            {loading ? (
              // Show skeleton loading state
              Array(5).fill(0).map((_, index) => (
                <JobCard key={index} isLoading={true} />
              ))
            ) : jobs.length > 0 ? (
              jobs.map(job => (
                <JobCard
                  key={job._id}
                  job={job}
                  onClick={() => handleJobClick(job._id)}
                  onStatusChange={handleStatusChange}
                  showActions={user?.role === 'client' && job.client === user._id}
                />
              ))
            ) : (
              <div className="no-jobs-found">
                <i className="fas fa-search no-jobs-icon"></i>
                <h3>No Jobs Found</h3>
                <p>Try adjusting your search filters or browse all available jobs</p>
                <button className="browse-all-button" onClick={resetFilters}>
                  Browse All Jobs
                </button>
              </div>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Jobs;