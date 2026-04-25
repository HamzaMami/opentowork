import { jobsAPI } from '../api';

/**
 * Parse a budget filter string into min and max values
 */
export const parseBudgetFilter = (budgetFilter) => {
  switch (budgetFilter) {
    case '0-1000': return [0, 1000];
    case '1000-5000': return [1000, 5000];
    case '5000-10000': return [5000, 10000];
    case '10000+': return [10000, null];
    default: return [null, null];
  }
};

/**
 * Fetch jobs with given API parameters
 */
export const fetchJobs = async (params, setStateCallback) => {
  setStateCallback(prev => ({ ...prev, isLoading: true, error: '' }));
  
  try {
    const apiParams = {
      search: params.get('search') || '',
      page: params.get('page') || '1',
      status: params.get('status') || 'open',
      category: params.get('category') || '',
      experienceLevel: params.get('experienceLevel') || '',
      sort: params.get('sortBy') || 'newest'
    };
    
    const budgetFilter = params.get('budget');
    if (budgetFilter) {
      const [minBudget, maxBudget] = parseBudgetFilter(budgetFilter);
      if (minBudget) apiParams.minBudget = minBudget;
      if (maxBudget) apiParams.maxBudget = maxBudget;
    }
    
    const response = await jobsAPI.getJobs(apiParams);
    
    if (response.data.success) {
      setStateCallback(prev => ({
        ...prev,
        jobs: response.data.data,
        pagination: {
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages,
          totalJobs: response.data.totalJobs
        },
        isLoading: false
      }));
    } else {
      setStateCallback(prev => ({
        ...prev,
        error: 'Failed to fetch jobs',
        jobs: [],
        isLoading: false
      }));
    }
  } catch (err) {
    console.error('Error fetching jobs:', err);
    setStateCallback(prev => ({
      ...prev,
      error: 'An error occurred while fetching jobs',
      jobs: [],
      isLoading: false
    }));
  }
};

/**
 * Fetch similar jobs based on a category
 */
export const fetchSimilarJobs = async (category, currentJobId, setStateCallback) => {
  setStateCallback(prev => ({ ...prev, isLoadingSimilar: true }));
  try {
    const response = await jobsAPI.getJobs({ 
      category, 
      status: 'open',
      limit: 4
    });
    
    if (response.data.success) {
      const filtered = response.data.data
        .filter(job => job._id !== currentJobId)
        .slice(0, 3);
        
      setStateCallback(prev => ({ 
        ...prev, 
        similarJobs: filtered, 
        isLoadingSimilar: false 
      }));
    }
  } catch (err) {
    console.error('Error fetching similar jobs:', err);
    setStateCallback(prev => ({ 
      ...prev, 
      isLoadingSimilar: false 
    }));
  }
};