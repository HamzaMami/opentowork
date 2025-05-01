import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jobsAPI } from '../../../api';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import './Jobs.css';

const EditJob = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [job, setJob] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    skills: [],
    budget: {
      min: 0,
      max: 0,
      type: 'fixed'
    },
    location: 'Remote',
    duration: '',
    experienceLevel: 'Intermediate'
  });

  // Validation states
  const [validationErrors, setValidationErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await jobsAPI.getJobById(jobId);
        if (response.data.success) {
          const jobData = response.data.data;
          setJob(jobData);
          setFormData({
            title: jobData.title,
            description: jobData.description,
            category: jobData.category,
            skills: Array.isArray(jobData.skills) ? jobData.skills : [jobData.skills],
            budget: jobData.budget,
            location: jobData.location || 'Remote',
            duration: jobData.duration || '',
            experienceLevel: jobData.experienceLevel || 'Intermediate'
          });
        } else {
          setError('Failed to fetch job details');
        }
      } catch (err) {
        console.error('Error fetching job:', err);
        setError(err.response?.data?.message || 'Error loading job details');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Job title is required';
    } else if (formData.title.length > 100) {
      errors.title = 'Job title cannot exceed 100 characters';
    }

    if (!formData.description.trim()) {
      errors.description = 'Job description is required';
    } else if (formData.description.length < 50) {
      errors.description = 'Job description must be at least 50 characters';
    } else if (formData.description.length > 5000) {
      errors.description = 'Job description cannot exceed 5000 characters';
    }

    if (!formData.category) {
      errors.category = 'Job category is required';
    }

    if (!formData.skills.length) {
      errors.skills = 'At least one skill is required';
    }

    if (formData.budget.min <= 0) {
      errors.budgetMin = 'Minimum budget must be greater than 0';
    }

    if (formData.budget.max <= 0) {
      errors.budgetMax = 'Maximum budget must be greater than 0';
    }

    if (formData.budget.max <= formData.budget.min) {
      errors.budget = 'Maximum budget must be greater than minimum budget';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('budget.')) {
      const budgetField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        budget: {
          ...prev.budget,
          [budgetField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSkillsChange = (e) => {
    const skills = e.target.value.split(',').map(skill => skill.trim()).filter(Boolean);
    setFormData(prev => ({
      ...prev,
      skills
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await jobsAPI.updateJob(jobId, formData);
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard/client/jobs');
        }, 1500);
      } else {
        setError('Failed to update job');
      }
    } catch (err) {
      console.error('Error updating job:', err);
      setError(err.response?.data?.message || 'An error occurred while updating the job');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-job-loading">
        <div className="spinner"></div>
        <p>Loading job details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="edit-job-error">
        <h3>Error</h3>
        <p>{error}</p>
        <Button onClick={() => navigate('/dashboard/client/jobs')}>
          Back to Jobs
        </Button>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="edit-job-error">
        <h3>Job Not Found</h3>
        <p>The requested job could not be found.</p>
        <Button onClick={() => navigate('/dashboard/client/jobs')}>
          Back to Jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="edit-job-container">
      <Card>
        <CardContent>
          <div className="edit-job-header">
            <h2>Edit Job</h2>
            <p className="edit-job-id">Job ID: {jobId}</p>
          </div>

          {success && (
            <div className="success-message">
              Job updated successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} className="edit-job-form">
            <div className="form-group">
              <label htmlFor="title">Job Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={validationErrors.title ? 'error' : ''}
              />
              {validationErrors.title && (
                <span className="error-message">{validationErrors.title}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="6"
                className={validationErrors.description ? 'error' : ''}
              />
              {validationErrors.description && (
                <span className="error-message">{validationErrors.description}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={validationErrors.category ? 'error' : ''}
                >
                  <option value="">Select Category</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile Development">Mobile Development</option>
                  <option value="Design">Design</option>
                  <option value="Writing">Writing</option>
                  <option value="Marketing">Marketing</option>
                </select>
                {validationErrors.category && (
                  <span className="error-message">{validationErrors.category}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="experienceLevel">Experience Level</label>
                <select
                  id="experienceLevel"
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleInputChange}
                >
                  <option value="Entry Level">Entry Level</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="skills">Required Skills (comma-separated)</label>
              <input
                type="text"
                id="skills"
                name="skills"
                value={formData.skills.join(', ')}
                onChange={handleSkillsChange}
                className={validationErrors.skills ? 'error' : ''}
              />
              {validationErrors.skills && (
                <span className="error-message">{validationErrors.skills}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="budget.min">Minimum Budget</label>
                <input
                  type="number"
                  id="budget.min"
                  name="budget.min"
                  value={formData.budget.min}
                  onChange={handleInputChange}
                  min="1"
                  className={validationErrors.budgetMin ? 'error' : ''}
                />
                {validationErrors.budgetMin && (
                  <span className="error-message">{validationErrors.budgetMin}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="budget.max">Maximum Budget</label>
                <input
                  type="number"
                  id="budget.max"
                  name="budget.max"
                  value={formData.budget.max}
                  onChange={handleInputChange}
                  min="1"
                  className={validationErrors.budgetMax ? 'error' : ''}
                />
                {validationErrors.budgetMax && (
                  <span className="error-message">{validationErrors.budgetMax}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="budget.type">Budget Type</label>
                <select
                  id="budget.type"
                  name="budget.type"
                  value={formData.budget.type}
                  onChange={handleInputChange}
                >
                  <option value="fixed">Fixed</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
            </div>

            {validationErrors.budget && (
              <span className="error-message budget-error">{validationErrors.budget}</span>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="duration">Duration (optional)</label>
                <input
                  type="text"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="e.g., 2 weeks, 3 months"
                />
              </div>
            </div>

            <div className="form-actions">
              <Button 
                type="button" 
                className="cancel-button"
                onClick={() => navigate('/dashboard/client/jobs')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="save-button" 
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditJob;