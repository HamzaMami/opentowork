import { useState, } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { jobsAPI } from '../../../api';
import './PostJob.css';

const JOB_CATEGORIES = [
  'Web Development',
  'Mobile App Development',
  'UI/UX Design',
  'Graphic Design',
  'Content Writing',
  'Digital Marketing',
  'Data Entry',
  'Virtual Assistant',
  'Software Development',
  'Video Editing',
  'Other'
];

const SKILL_LEVELS = [
  'Entry Level',
  'Intermediate',
  'Expert'
];

const PostJob = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    skills: [''],
    budget: {
      min: '',
      max: '',
      type: 'fixed'
    },
    location: 'Remote',
    duration: '',
    experienceLevel: 'Intermediate'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('budget.')) {
      const budgetField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        budget: {
          ...prev.budget,
          [budgetField]: budgetField === 'type' ? value : Number(value)
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSkillChange = (index, value) => {
    const updatedSkills = [...formData.skills];
    updatedSkills[index] = value;
    setFormData(prev => ({
      ...prev,
      skills: updatedSkills
    }));
  };

  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, '']
    }));
  };

  const removeSkill = (index) => {
    if (formData.skills.length > 1) {
      const updatedSkills = formData.skills.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        skills: updatedSkills
      }));
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Job title is required');
      return false;
    }
    
    if (!formData.description.trim() || formData.description.length < 50) {
      setError('Please provide a detailed job description (at least 50 characters)');
      return false;
    }
    
    if (!formData.category) {
      setError('Please select a job category');
      return false;
    }
    
    if (formData.skills.some(skill => !skill.trim())) {
      setError('Please fill in all skills or remove empty ones');
      return false;
    }
    
    if (!formData.budget.min || !formData.budget.max) {
      setError('Please set a budget range');
      return false;
    }
    
    if (Number(formData.budget.min) <= 0 || Number(formData.budget.max) <= 0) {
      setError('Budget values must be greater than zero');
      return false;
    }
    
    if (Number(formData.budget.min) >= Number(formData.budget.max)) {
      setError('Maximum budget must be greater than minimum budget');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Filter out any empty skills
      const filteredSkills = formData.skills.filter(skill => skill.trim());
      
      const jobData = {
        ...formData,
        skills: filteredSkills
      };
      
      await jobsAPI.createJob(jobData);
      setSuccess(true);
      
      // Reset form after successful submission
      setFormData({
        title: '',
        description: '',
        category: '',
        skills: [''],
        budget: {
          min: '',
          max: '',
          type: 'fixed'
        },
        location: 'Remote',
        duration: '',
        experienceLevel: 'Intermediate'
      });
      
      // Redirect to manage jobs page after a short delay
      setTimeout(() => {
        navigate('/dashboard/client/jobs');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post job. Please try again.');
      console.error('Job posting error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="post-job-container">
      <div className="post-job-header">
        <h1>Post a New Job</h1>
        <p>Create a detailed job posting to find the perfect talent for your project</p>
      </div>
      
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}
      
      {success && (
        <div className="success-message">
          <i className="fas fa-check-circle"></i> Job posted successfully! Redirecting to your jobs...
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="post-job-form">
        <div className="form-section">
          <h2>Job Details</h2>
          
          <div className="form-group">
            <label htmlFor="title">Job Title*</label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., WordPress Website Development"
              disabled={isSubmitting}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="category">Category*</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={isSubmitting}
              required
              className="form-select"
            >
              <option value="" disabled>Select a category</option>
              {JOB_CATEGORIES.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Job Description*</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide a detailed description of your project, requirements, and expectations..."
              rows={8}
              disabled={isSubmitting}
              required
              className="form-textarea"
            />
            <div className="char-count">
              {formData.description.length}/2000 characters
              {formData.description.length < 50 && (
                <span className="char-count-warning"> (minimum 50 characters)</span>
              )}
            </div>
          </div>
          
          <div className="form-group">
            <label>Required Skills*</label>
            <div className="skills-input-container">
              {formData.skills.map((skill, index) => (
                <div key={index} className="skill-input-group">
                  <Input
                    value={skill}
                    onChange={(e) => handleSkillChange(index, e.target.value)}
                    placeholder="e.g., JavaScript"
                    disabled={isSubmitting}
                    className="skill-input"
                  />
                  {formData.skills.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="remove-skill-btn"
                      disabled={isSubmitting}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addSkill}
                className="add-skill-btn"
                disabled={isSubmitting}
              >
                <i className="fas fa-plus"></i> Add Skill
              </button>
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h2>Budget and Requirements</h2>
          
          <div className="form-group">
            <label>Budget Type</label>
            <div className="budget-type-selector">
              <div className="budget-type-option">
                <input
                  type="radio"
                  id="fixed"
                  name="budget.type"
                  value="fixed"
                  checked={formData.budget.type === 'fixed'}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                <label htmlFor="fixed">Fixed Price</label>
              </div>
              
              <div className="budget-type-option">
                <input
                  type="radio"
                  id="hourly"
                  name="budget.type"
                  value="hourly"
                  checked={formData.budget.type === 'hourly'}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                <label htmlFor="hourly">Hourly Rate</label>
              </div>
            </div>
          </div>
          
          <div className="budget-range">
            <div className="form-group">
              <label htmlFor="budget.min">Minimum {formData.budget.type === 'hourly' ? 'Hourly Rate' : 'Budget'} ($)*</label>
              <Input
                id="budget.min"
                name="budget.min"
                type="number"
                value={formData.budget.min}
                onChange={handleChange}
                min="1"
                placeholder="Min"
                disabled={isSubmitting}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="budget.max">Maximum {formData.budget.type === 'hourly' ? 'Hourly Rate' : 'Budget'} ($)*</label>
              <Input
                id="budget.max"
                name="budget.max"
                type="number"
                value={formData.budget.max}
                onChange={handleChange}
                min={formData.budget.min || 1}
                placeholder="Max"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="duration">Estimated Project Duration</label>
            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              disabled={isSubmitting}
              className="form-select"
            >
              <option value="">Select duration (optional)</option>
              <option value="Less than 1 week">Less than 1 week</option>
              <option value="1-2 weeks">1-2 weeks</option>
              <option value="2-4 weeks">2-4 weeks</option>
              <option value="1-3 months">1-3 months</option>
              <option value="3-6 months">3-6 months</option>
              <option value="6+ months">6+ months</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="experienceLevel">Experience Level</label>
            <select
              id="experienceLevel"
              name="experienceLevel"
              value={formData.experienceLevel}
              onChange={handleChange}
              disabled={isSubmitting}
              className="form-select"
            >
              {SKILL_LEVELS.map((level, index) => (
                <option key={index} value={level}>{level}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="location">Location Requirement</label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Remote, US Only, etc."
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        <div className="form-actions">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="post-job-submit-btn"
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Posting Job...
              </>
            ) : (
              'Post Job'
            )}
          </Button>
          
          <Button 
            type="button" 
            onClick={() => navigate('/dashboard/client/jobs')}
            disabled={isSubmitting}
            className="cancel-btn"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PostJob;