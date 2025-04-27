import { useState } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import './Home.css';

function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // Handle search functionality here
    console.log('Searching for:', searchQuery);
    // You can implement actual search functionality when ready
  };

  return (
    <div className="home-container">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Find the Perfect Service for Your Needs</h1>
          <p className="hero-subtitle">
            Connect with skilled professionals ready to bring your projects to life
          </p>
          
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-container">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for any service..."
                className="search-input"
              />
              <Button type="submit" className="search-button">
                Search
              </Button>
            </div>
          </form>
          
          <div className="popular-searches">
            <span className="popular-label">Popular:</span>
            <div className="search-tags">
              <button className="search-tag">Web Design</button>
              <button className="search-tag">Mobile Development</button>
              <button className="search-tag">Logo Design</button>
              <button className="search-tag">Content Writing</button>
            </div>
          </div>
        </div>
        
        <div className="hero-image">
          {/* Replace with your actual image */}
          <div className="placeholder-image">
            <img 
              src="Work_from_home.jpg" 
              alt="Professional services illustration" 
              className="main-image"
            />
          </div>
        </div>
      </div>
      
      <div className="features-section">
        <h2 className="section-title">How It Works</h2>
        <div className="feature-cards">
          <Card className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3 className="feature-title">Search</h3>
            <p className="feature-description">Find the perfect service to match your needs</p>
          </Card>
          
          <Card className="feature-card">
            <div className="feature-icon">💬</div>
            <h3 className="feature-title">Connect</h3>
            <p className="feature-description">Chat with skilled professionals</p>
          </Card>
          
          <Card className="feature-card">
            <div className="feature-icon">✅</div>
            <h3 className="feature-title">Hire</h3>
            <p className="feature-description">Choose the best fit and get your project done</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Home;