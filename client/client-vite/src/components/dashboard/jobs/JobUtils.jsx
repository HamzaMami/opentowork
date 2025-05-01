import { Card, CardContent } from '../../ui/card';
import { formatTimeAgo, formatCurrency } from '../../../utils/formatUtils';

// Reusable component for job filters
export const FilterComponent = ({ filters, handleFilterChange, applyFilters, resetFilters }) => (
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
      
      <button className="apply-filters-button button" onClick={applyFilters}>
        Apply Filters
      </button>
      
      <button variant="outline" className="reset-filters-button button" onClick={resetFilters}>
        Reset Filters
      </button>
    </CardContent>
  </Card>
);

// Reusable job card component
export const JobCard = ({ job, onClick }) => (
  <Card className="job-card" onClick={onClick}>
    <CardContent className="job-card-content">
      <div className="job-header">
        <h2 className="job-title">{job.title}</h2>
        <span className="job-date">{formatTimeAgo(job.createdAt)}</span>
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
            ${formatCurrency(job.budget.min)} - ${formatCurrency(job.budget.max)}
            {job.budget.type === 'hourly' ? '/hr' : ''}
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
);

// Reusable pagination component
export const Pagination = ({ currentPage, totalPages, onPageChange }) => (
  <div className="pagination">
    <button 
      className="pagination-button"
      disabled={currentPage === 1}
      onClick={() => onPageChange(currentPage - 1)}
    >
      <i className="fas fa-chevron-left"></i> Previous
    </button>
    
    <span className="pagination-info">
      Page {currentPage} of {totalPages}
    </span>
    
    <button 
      className="pagination-button"
      disabled={currentPage === totalPages}
      onClick={() => onPageChange(currentPage + 1)}
    >
      Next <i className="fas fa-chevron-right"></i>
    </button>
  </div>
);