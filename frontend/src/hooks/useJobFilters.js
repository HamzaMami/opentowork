import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Custom hook for URL-based filtering and pagination
 */
export const useJobFilters = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    experienceLevel: '',
    budget: '',
    sortBy: 'newest'
  });

  // Extract filters from URL on mount/URL change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get('search') || '');
    setFilters({
      category: params.get('category') || '',
      experienceLevel: params.get('experienceLevel') || '',
      budget: params.get('budget') || '',
      sortBy: params.get('sortBy') || 'newest'
    });
  }, [location.search]);

  const updateSearchParams = useCallback((newParams = {}) => {
    const params = new URLSearchParams(location.search);
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    params.set('page', '1');
    
    navigate({
      pathname: location.pathname,
      search: params.toString()
    });
  }, [location.pathname, location.search, navigate]);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  }, []);

  const applyFilters = useCallback(() => {
    updateSearchParams({
      ...filters,
      search: searchQuery
    });
  }, [filters, searchQuery, updateSearchParams]);

  const resetFilters = useCallback(() => {
    setFilters({
      category: '',
      experienceLevel: '',
      budget: '',
      sortBy: 'newest'
    });
    setSearchQuery('');
    navigate(location.pathname);
  }, [navigate, location.pathname]);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    handleFilterChange,
    applyFilters,
    resetFilters,
    updateSearchParams
  };
};