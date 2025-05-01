import { useState } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { formatTimeAgo, formatCurrency } from '../../../utils/formatUtils';
import { useJobStatus } from '../../../hooks/useJobStatus';
import './Jobs.css';

export const JobCard = ({ 
  job, 
  onClick, 
  onStatusChange,
  showActions = true,
  isLoading = false 
}) => {
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [error, setError] = useState(null);
  const { updateJobStatus, isValidStatusTransition, updating } = useJobStatus();

  const handleStatusChange = async (newStatus) => {
    if (!isValidStatusTransition(job.status, newStatus)) {
      setError(`Invalid status transition from ${job.status} to ${newStatus}`);
      return;
    }

    setLoadingLocal(true);
    setError(null);

    const result = await updateJobStatus(job._id, newStatus);
    if (result.success) {
      onStatusChange?.(job._id, newStatus);
    } else {
      setError(result.error);
    }

    setLoadingLocal(false);
  };

  if (isLoading) {
    return (
      <Card className="job-card skeleton">
        <CardContent className="job-card-content">
          <div className="skeleton-line" style={{ width: '70%', height: '24px' }}></div>
          <div className="skeleton-line" style={{ width: '30%', height: '16px' }}></div>
          <div className="skeleton-line" style={{ width: '100%', height: '60px' }}></div>
          <div className="job-skills">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-line" style={{ width: '80px', height: '24px' }}></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const isDisabled = updating || loadingLocal;

  return (
    <Card className={`job-card ${isDisabled ? 'disabled' : ''}`} onClick={onClick}>
      <CardContent className="job-card-content">
        <div className="job-header">
          <h2 className="job-title">{job.title}</h2>
          <span className="job-date">{formatTimeAgo(job.createdAt)}</span>
        </div>
        
        <div className="job-company">
          <span className="company-name">{job.client?.name || 'Anonymous'}</span>
          <span className="job-location">
            <i className="fas fa-map-marker-alt"></i> {job.location || 'Remote'}
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
              ${formatCurrency(job.budget.min)} - ${formatCurrency(job.budget.max)}
              {job.budget.type === 'hourly' ? '/hr' : ''}
            </span>
            <span className="budget-type">
              {job.budget.type === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}
            </span>
          </div>
          
          <div className="job-meta">
            <span className={`job-status status-${job.status}`}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
            <span className="job-proposals">
              <i className="fas fa-users"></i> {job.proposals?.length || 0} proposals
            </span>
          </div>
        </div>

        {showActions && job.status !== 'completed' && job.status !== 'cancelled' && (
          <div className="job-actions">
            {job.status === 'open' && (
              <Button
                variant="secondary"
                disabled={isDisabled}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange('cancelled');
                }}
              >
                Cancel Job
              </Button>
            )}
            {(job.status === 'in-progress' || job.status === 'active' || job.status === 'ongoing') && (
              <Button
                variant="primary"
                disabled={isDisabled}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange('completed');
                }}
              >
                Mark as Completed
              </Button>
            )}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};