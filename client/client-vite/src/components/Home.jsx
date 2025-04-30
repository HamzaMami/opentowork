import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from './ui/input';
import { Button } from './ui/button';
import './Home.css';

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // Navigate to jobs page with search query
    navigate(`/jobs?search=${encodeURIComponent(searchQuery)}`);
  };

  // Popular job categories
  const jobCategories = [
    { name: 'Web Development', icon: 'fas fa-code', count: 215 },
    { name: 'Graphic Design', icon: 'fas fa-palette', count: 187 },
    { name: 'Content Writing', icon: 'fas fa-pen', count: 143 },
    { name: 'Digital Marketing', icon: 'fas fa-chart-line', count: 112 },
    { name: 'Mobile App Development', icon: 'fas fa-mobile-alt', count: 98 },
    { name: 'UI/UX Design', icon: 'fas fa-pencil-ruler', count: 76 }
  ];

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Find the Perfect Job or Talent</h1>
          <p className="hero-subtitle">
            Connect with skilled professionals or find exciting projects on our job marketplace
          </p>
          
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-container">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for jobs or skills..."
                className="search-input form-input"
              />
              <Button type="submit" className="search-button">
                <i className="fas fa-search"></i> Find Jobs
              </Button>
            </div>
          </form>
          
          <div className="popular-searches">
            <span className="popular-label">Popular:</span>
            <div className="popular-tags">
              <span onClick={() => navigate('/jobs?search=javascript')}>JavaScript</span>
              <span onClick={() => navigate('/jobs?search=web%20design')}>Web Design</span>
              <span onClick={() => navigate('/jobs?search=logo')}>Logo Design</span>
              <span onClick={() => navigate('/jobs?search=mobile%20app')}>Mobile App</span>
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2 className="section-title">Job Categories</h2>
        <p className="section-subtitle">Browse opportunities by category</p>
        
        <div className="job-categories">
          {jobCategories.map((category, index) => (
            <div key={index} className="category-card" onClick={() => navigate(`/jobs?category=${encodeURIComponent(category.name)}`)}>
              <div className="category-icon">
                <i className={category.icon}></i>
              </div>
              <div className="category-info">
                <h3>{category.name}</h3>
                <span>{category.count} jobs</span>
              </div>
            </div>
          ))}
        </div>

        <div className="view-all-jobs">
          <Link to="/jobs" className="view-all-link">
            View All Categories <i className="fas fa-arrow-right"></i>
          </Link>
        </div>
      </div>

      <div className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <p className="section-subtitle">Simple steps to start your journey</p>
        
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <div className="step-icon">
              <i className="fas fa-user-plus"></i>
            </div>
            <h3>Create an Account</h3>
            <p>Sign up as a client or freelancer in just minutes</p>
          </div>
          
          <div className="step-card">
            <div className="step-number">2</div>
            <div className="step-icon">
              <i className="fas fa-briefcase"></i>
            </div>
            <h3>{user?.role === 'client' ? 'Post a Job' : 'Find Opportunities'}</h3>
            <p>{user?.role === 'client' ? 'Describe your project and requirements' : 'Browse and apply to relevant jobs'}</p>
          </div>
          
          <div className="step-card">
            <div className="step-number">3</div>
            <div className="step-icon">
              <i className="fas fa-handshake"></i>
            </div>
            <h3>{user?.role === 'client' ? 'Hire Talent' : 'Get Hired'}</h3>
            <p>{user?.role === 'client' ? 'Review proposals and select the best match' : 'Showcase your skills and win projects'}</p>
          </div>
          
          <div className="step-card">
            <div className="step-number">4</div>
            <div className="step-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h3>Complete Projects</h3>
            <p>Work together, communicate and deliver quality results</p>
          </div>
        </div>
        
        {!user && (
          <div className="cta-container">
            <Link to="/register" className="cta-button primary">
              Join Our Job Marketplace
            </Link>
          </div>
        )}
      </div>

      <div className="stats-section">
        <div className="stat-item">
          <div className="stat-number">10,000+</div>
          <div className="stat-label">Freelancers</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">5,000+</div>
          <div className="stat-label">Clients</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">25,000+</div>
          <div className="stat-label">Jobs Posted</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">$2M+</div>
          <div className="stat-label">Paid to Freelancers</div>
        </div>
      </div>
      
      <div className="testimonials-section">
        <h2 className="section-title">Success Stories</h2>
        <p className="section-subtitle">What our community says</p>
        
        <div className="testimonials-container">
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"I found an amazing developer within hours of posting my job. The project was completed on time and exceeded my expectations!"</p>
            </div>
            <div className="testimonial-author">
              <div className="author-name">Sarah Johnson</div>
              <div className="author-role">Marketing Director</div>
            </div>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"Open to Work has been a game-changer for my freelance career. I've secured consistent projects and built long-term client relationships."</p>
            </div>
            <div className="testimonial-author">
              <div className="author-name">Michael Rodriguez</div>
              <div className="author-role">UX Designer</div>
            </div>
          </div>
          
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"The secure payment system and clear communication tools make managing remote projects so much easier. Highly recommended!"</p>
            </div>
            <div className="testimonial-author">
              <div className="author-name">Lisa Chen</div>
              <div className="author-role">Project Manager</div>
            </div>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>Join our community and start finding jobs or hiring talent today</p>
        <div className="cta-buttons">
          {!user ? (
            <>
              <Link to="/register?role=client" className="cta-button">Post a Job</Link>
              <Link to="/register?role=freelancer" className="cta-button secondary">Find Work</Link>
            </>
          ) : user.role === 'client' ? (
            <Link to="/dashboard/client/hire" className="cta-button">Post Your First Job</Link>
          ) : (
            <Link to="/dashboard/freelancer/jobs" className="cta-button">Browse Available Jobs</Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;