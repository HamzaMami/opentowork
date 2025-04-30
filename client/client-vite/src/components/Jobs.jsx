import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { jobsAPI } from '../api';
import './Jobs.css';

const Jobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    experienceLevel: '',
    budget: '',
    sortBy: 'newest'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalJobs: 0
  });
  const [error, setError] = useState('');

  useEffect(() => {
    // Parse query parameters for initial search/filter state
    const params = new URLSearchParams(location.search);
    const searchFromQuery = params.get('search') || '';
    const categoryFromQuery = params.get('category') || '';
    const experienceLevelFromQuery = params.get('experienceLevel') || '';
    const budgetFromQuery = params.get('budget') || '';
    const sortByFromQuery = params.get('sortBy') || 'newest';
    const pageFromQuery = params.get('page') || '1';
    
    setSearchQuery(searchFromQuery);
    setFilters(prev => ({
      ...prev,
      category: categoryFromQuery,
      experienceLevel: experienceLevelFromQuery,
      budget: budgetFromQuery,
      sortBy: sortByFromQuery
    }));
    
    // Make actual API call to fetch jobs
    const fetchJobs = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // Build query parameters for API request
        const apiParams = {
          search: searchFromQuery,
          page: pageFromQuery,
          status: 'open'
        };
        
        if (categoryFromQuery) apiParams.category = categoryFromQuery;
        if (experienceLevelFromQuery) apiParams.experienceLevel = experienceLevelFromQuery;
        if (sortByFromQuery) apiParams.sort = sortByFromQuery;
        
        // Add budget filter if provided
        if (budgetFromQuery) {
          const [minBudget, maxBudget] = parseBudgetFilter(budgetFromQuery);
          if (minBudget) apiParams.minBudget = minBudget;
          if (maxBudget) apiParams.maxBudget = maxBudget;
        }
        
        const response = await jobsAPI.getJobs(apiParams);
        
        if (response.data.success) {
          setJobs(response.data.data);
          setPagination({
            currentPage: response.data.currentPage,
            totalPages: response.data.totalPages,
            totalJobs: response.data.totalJobs
          });
        } else {
          setError('Failed to fetch jobs');
          setJobs([]);
        }
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('An error occurred while fetching jobs');
        setJobs([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchJobs();
  }, [location.search]);

  // Parse budget filter values
  const parseBudgetFilter = (budgetFilter) => {
    switch (budgetFilter) {
      case '0-1000':
        return [0, 1000];
      case '1000-5000':
        return [1000, 5000];
      case '5000-10000':
        return [5000, 10000];
      case '10000+':
        return [10000, null];
      default:
        return [null, null];
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    // Update URL with search parameters
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (filters.category) params.append('category', filters.category);
    
    // Reset to page 1 when searching
    params.append('page', '1');
    
    navigate({
      pathname: '/jobs',
      search: params.toString()
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    // Update URL with all filter parameters
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (filters.category) params.append('category', filters.category);
    if (filters.experienceLevel) params.append('experienceLevel', filters.experienceLevel);
    if (filters.budget) params.append('budget', filters.budget);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    
    // Reset to page 1 when applying filters
    params.append('page', '1');
    
    navigate({
      pathname: '/jobs',
      search: params.toString()
    });
  };

  const handlePageChange = (page) => {
    const params = new URLSearchParams(location.search);
    params.set('page', page.toString());
    
    navigate({
      pathname: '/jobs',
      search: params.toString()
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    try {
      // Create a date object from the string
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      const now = new Date();
      
      // Check if the date is today
      if (
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      ) {
        return 'Today';
      }
      
      // Check if the date is yesterday
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
      ) {
        return 'Yesterday';
      }
      
      // Calculate days ago
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} days ago`;
      
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date format error';
    }
  };

  const handleViewJob = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  // Function to render pagination controls
  const renderPagination = () => {
    if (pagination.totalPages <= 1) return null;
    
    return (
      <div className="pagination">
        <button 
          className="pagination-button"
          disabled={pagination.currentPage === 1}
          onClick={() => handlePageChange(pagination.currentPage - 1)}
        >
          <i className="fas fa-chevron-left"></i> Previous
        </button>
        
        <span className="pagination-info">
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
        
        <button 
          className="pagination-button"
          disabled={pagination.currentPage === pagination.totalPages}
          onClick={() => handlePageChange(pagination.currentPage + 1)}
        >
          Next <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    );
  };

  return (
    <div className="jobs-container">
      <div className="jobs-header">
        <h1>Find Your Perfect Job</h1>
        <p className="jobs-subtitle">Browse job opportunities for freelancers and remote workers</p>
      </div>
      
      <div className="jobs-search-section">
        <form onSubmit={handleSearch} className="jobs-search-form">
          <div className="search-input-container">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for jobs by title, skill, or keyword"
              className="jobs-search-input"
            />
            <Button type="submit" className="jobs-search-button">
              <i className="fas fa-search"></i> Search
            </Button>
          </div>
        </form>
      </div>
      
      <div className="jobs-main-content">
        <div className="jobs-filters">
          <Card>
            <CardContent className="filters-content">
              <h3>Filters</h3>
              
              <div className="filter-group">
                <label>Category</label>
                <select name="category" value={filters.category} onChange={handleFilterChange}>
                  <option value="">All Categories</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile App Development">Mobile App Development</option>
                  <option value="Graphic Design">Graphic Design</option>
                  <option value="Content Writing">Content Writing</option>
                  <option value="Digital Marketing">Digital Marketing</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="Data Entry">Data Entry</option>
                  <option value="Video Editing">Video Editing</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Experience Level</label>
                <select name="experienceLevel" value={filters.experienceLevel} onChange={handleFilterChange}>
                  <option value="">All Levels</option>
                  <option value="Entry Level">Entry Level</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Budget</label>
                <select name="budget" value={filters.budget} onChange={handleFilterChange}>
                  <option value="">Any Budget</option>
                  <option value="0-1000">$0 - $1,000</option>
                  <option value="1000-5000">$1,000 - $5,000</option>
                  <option value="5000-10000">$5,000 - $10,000</option>
                  <option value="10000+">$10,000+</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label>Sort By</label>
                <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="budget-high">Budget: High to Low</option>
                  <option value="budget-low">Budget: Low to High</option>
                </select>
              </div>
              
              <Button className="apply-filters-button" onClick={applyFilters}>
                Apply Filters
              </Button>
              
              <Button 
                variant="outline" 
                className="reset-filters-button"
                onClick={() => {
                  setFilters({
                    category: '',
                    experienceLevel: '',
                    budget: '',
                    sortBy: 'newest'
                  });
                  navigate('/jobs');
                }}
              >
                Reset Filters
              </Button>
            </CardContent>
          </Card>
          
          {user && user.role === 'client' && (
            <div className="post-job-card">
              <h3>Need to hire?</h3>
              <p>Post a job and start receiving proposals from talented freelancers.</p>
              <Button 
                className="post-job-button"
                onClick={() => navigate('/dashboard/client/post-job')}
              >
                <i className="fas fa-plus-circle"></i> Post a Job
              </Button>
            </div>
          )}
          
          {user && user.role === 'freelancer' && (
            <div className="freelancer-tips-card">
              <h3>Tips for Success</h3>
              <ul>
                <li>Complete your profile to increase visibility</li>
                <li>Apply early to new job postings</li>
                <li>Personalize your proposals</li>
                <li>Showcase relevant portfolio items</li>
              </ul>
            </div>
          )}
        </div>
        
        <div className="jobs-listings">
          {isLoading ? (
            <div className="jobs-loading">
              <div className="loading-spinner"></div>
              <p>Loading job opportunities...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <i className="fas fa-exclamation-circle"></i>
              <p>{error}</p>
            </div>
          ) : jobs.length > 0 ? (
            <>
              <div className="jobs-count">
                <p>Showing {jobs.length} of {pagination.totalJobs} jobs</p>
              </div>
              
              <div className="jobs-list">
                {jobs.map(job => (
                  <Card key={job._id} className="job-card" onClick={() => handleViewJob(job._id)}>
                    <CardContent className="job-card-content">
                      <div className="job-header">
                        <h2 className="job-title">{job.title}</h2>
                        <span className="job-date">{formatDate(job.createdAt)}</span>
                      </div>
                      
                      <div className="job-company">
                        <span className="company-name">{job.client?.name || 'Anonymous'}</span>
                        <span className="job-location">
                          <i className="fas fa-map-marker-alt"></i> {job.location}
                        </span>
                      </div>
                      
                      <div className="job-description">
                        <p>{job.description.length > 150 
                           ? `${job.description.substring(0, 150)}...` 
                           : job.description}</p>
                      </div>
                      
                      <div className="job-skills">
                        {job.skills.slice(0, 5).map((skill, index) => (
                          <span key={index} className="skill-tag">{skill}</span>
                        ))}
                        {job.skills.length > 5 && (
                          <span className="skill-tag">+{job.skills.length - 5} more</span>
                        )}
                      </div>
                      
                      <div className="job-footer">
                        <div className="job-budget">
                          <span className="budget-amount">
                            {job.budget.type === 'fixed' 
                              ? `$${job.budget.min.toLocaleString()} - $${job.budget.max.toLocaleString()}` 
                              : `$${job.budget.min.toLocaleString()} - $${job.budget.max.toLocaleString()}/hr`}
                          </span>
                          <span className="budget-type">
                            {job.budget.type === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}
                          </span>
                        </div>
                        
                        <div className="job-meta">
                          <span className="job-skill-level">{job.experienceLevel}</span>
                          <span className="job-proposals">
                            <i className="fas fa-users"></i> {job.proposals?.length || 0} proposals
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {renderPagination()}
            </>
          ) : (
            <div className="no-jobs-found">
              <div className="no-jobs-icon">
                <i className="fas fa-search"></i>
              </div>
              <h3>No jobs found</h3>
              <p>Try adjusting your search criteria or browse all available jobs</p>
              <Button 
                variant="outline" 
                className="browse-all-button"
                onClick={() => navigate('/jobs')}
              >
                Browse All Jobs
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;