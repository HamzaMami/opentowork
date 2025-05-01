import { useState, useCallback } from 'react';
import { jobsAPI } from '../api';

export const useJobStatus = () => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  const updateJobStatus = useCallback(async (jobId, newStatus) => {
    setUpdating(true);
    setError(null);
    try {
      const response = await jobsAPI.updateJobStatus(jobId, { status: newStatus });
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        setError(response.data.message || 'Failed to update job status');
        return { success: false, error: response.data.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An error occurred while updating the job status';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setUpdating(false);
    }
  }, []);

  const isValidStatusTransition = useCallback((currentStatus, newStatus) => {
    const validTransitions = {
      'open': ['in-progress', 'cancelled'],
      'in-progress': ['completed', 'cancelled'],
      'active': ['completed', 'cancelled'],
      'ongoing': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }, []);

  return {
    updating,
    error,
    updateJobStatus,
    isValidStatusTransition
  };
};