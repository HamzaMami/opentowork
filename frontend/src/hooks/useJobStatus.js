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
    // Updated to match backend valid transitions
    const validTransitions = {
      'open': ['in-progress', 'cancelled'],
      'in-progress': ['completion-pending', 'cancelled'],
      'active': ['completion-pending', 'cancelled'],
      'ongoing': ['completion-pending', 'cancelled'],
      'completion-pending': ['completed', 'in-progress'], // Can go back to in-progress if rejected
      'completed': [],  // completed is final
      'cancelled': []   // cancelled is final
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