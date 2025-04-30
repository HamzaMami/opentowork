import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './About.css';

const About = () => {
  // Use auth context to check if user is logged in
  const { user } = useAuth();
  
  return (
    <div className="about-container">
      <div className="about-header">
        <h1>About Open to Work</h1>
        <p className="about-tagline">Connecting Talent with Opportunity</p>
      </div>

      <section className="about-section">
        <h2>Our Mission</h2>
        <p>
          At Open to Work, we believe in democratizing the freelancing marketplace by creating a platform 
          that empowers both clients and freelancers. Our mission is to build a global community where 
          skilled professionals can find meaningful work, and businesses can discover exceptional talent 
          to bring their projects to life.
        </p>
      </section>

      <section className="about-section about-story">
        <div className="about-content">
          <h2>Our Story</h2>
          <p>
            Open to Work was developed as a MERN stack project by <strong>Hamza Mami</strong> and <strong>Ferdaws Chaouch</strong> 
            during the 2023/2024 academic year at ITBS (Institut Tunisien des Études Bancaires et de la Sécurité). This platform 
            was created as part of their academic curriculum, demonstrating their skills in modern web development.
          </p>
          <p>
            The project addresses real-world challenges in the freelancing ecosystem such as high fees, poor communication tools, 
            and payment security issues. Hamza and Ferdaws developed this platform to showcase how technology can create more 
            transparent, fair, and secure environments for remote work collaboration.
          </p>
        </div>
        <div className="about-image">
          <img src="https://gurzu.com/img/gurzu/mern-stack-01.webp" alt="MERN Stack technology" className="mern-image" />
        </div>
      </section>

      <section className="about-section about-values">
        <h2>Our Core Values</h2>
        <div className="values-container">
          <div className="value-card">
            <div className="value-icon">
              <i className="fas fa-handshake"></i>
            </div>
            <h3>Trust</h3>
            <p>We build trust through transparent processes, secure payments, and honest reviews.</p>
          </div>

          <div className="value-card">
            <div className="value-icon">
              <i className="fas fa-users"></i>
            </div>
            <h3>Community</h3>
            <p>We foster a supportive environment where professionals can grow and collaborate.</p>
          </div>

          <div className="value-card">
            <div className="value-icon">
              <i className="fas fa-star"></i>
            </div>
            <h3>Quality</h3>
            <p>We strive for excellence in every aspect of our platform and service.</p>
          </div>

          <div className="value-card">
            <div className="value-icon">
              <i className="fas fa-lock"></i>
            </div>
            <h3>Security</h3>
            <p>We prioritize secure transactions and protection of user data.</p>
          </div>
        </div>
      </section>

      <section className="about-section about-features">
        <h2>What Makes Us Different</h2>
        <div className="features-container">
          <div className="feature">
            <h3><i className="fas fa-comment-dots"></i> Real-time Communication</h3>
            <p>Our integrated chat system ensures clients and freelancers can collaborate seamlessly.</p>
          </div>
          <div className="feature">
            <h3><i className="fas fa-wallet"></i> Secure Payment System</h3>
            <p>Our escrow-based payment system protects both clients and freelancers.</p>
          </div>
          <div className="feature">
            <h3><i className="fas fa-percentage"></i> Lower Fees</h3>
            <p>We charge industry-leading low fees so freelancers keep more of what they earn.</p>
          </div>
          <div className="feature">
            <h3><i className="fas fa-user-shield"></i> Verified Profiles</h3>
            <p>Our verification process ensures you're working with legitimate professionals.</p>
          </div>
        </div>
      </section>

      <section className="about-section about-team">
        <h2>Project Creators</h2>
        <p className="team-intro">
          Open to Work was created by two talented developers as part of their academic studies at ITBS.
        </p>
        <div className="team-container">
          <div className="team-member">
            <div className="team-member-image">
              <img src="/images/Hamza.jpg" alt="Hamza Mami" />
            </div>
            <h3>Hamza Mami</h3>
            <p className="team-role">Full Stack Developer</p>
          </div>
          
          <div className="team-member">
            <div className="team-member-image">
              <img src="/images/ferdaws.jfif" alt="Ferdaws Chaouch" /> 
            </div>
            <h3>Ferdaws Chaouch</h3>
            <p className="team-role">Full Stack Developer</p>
          </div>
        </div>
      </section>

      <section className="about-section about-tech">
        <h2>Technologies Used</h2>
        <div className="tech-container">
          <div className="tech-item">
            <h3>M</h3>
            <p>MongoDB - NoSQL database for storing user profiles, job listings, and messages</p>
          </div>
          <div className="tech-item">
            <h3>E</h3>
            <p>Express - Backend framework for building the API</p>
          </div>
          <div className="tech-item">
            <h3>R</h3>
            <p>React - Frontend library for building the user interface</p>
          </div>
          <div className="tech-item">
            <h3>N</h3>
            <p>Node.js - JavaScript runtime for the backend server</p>
          </div>
        </div>
      </section>

      <section className="about-section about-join">
        <div className="join-container">
          <h2>Join Our Community</h2>
          <p>
            Whether you're a freelancer looking for your next opportunity or a client seeking skilled professionals,
            Open to Work is the platform for you.
          </p>
          <div className="join-buttons">
            {user ? (
              <Link to={`/dashboard/${user.role}`} className="join-button">Go to Dashboard</Link>
            ) : (
              <Link to="/register" className="join-button">Sign Up Now</Link>
            )}
            <Link to="/contact" className="contact-button">Contact Us</Link>
          </div>
        </div>
      </section>
      
      <section className="about-section about-academic">
        <h2>Academic Project</h2>
        <p>
          This platform was developed as part of the 2024/2025 academic curriculum at Institut Tunisien des 
          Études Bancaires et de la Sécurité (ITBS). The project demonstrates the application of web 
          development skills, database design, authentication systems, and real-time communications in 
          a practical, real-world context.
        </p>
        <p>
          <strong>Completion Date:</strong> Spring 2025
        </p>
      </section>
    </div>
  );
};

export default About;