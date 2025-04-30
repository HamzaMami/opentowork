import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { contactAPI } from '../api';
import './Contact.css';

const Contact = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: user ? (user.role === 'client' ? 'project-help' : 'job-opportunities') : 'general',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState(null);

  // Prefill form with user data if available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    
    // Form validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()) {
      setFormError('All fields are required');
      setIsSubmitting(false);
      return;
    }

    if (!isValidEmail(formData.email)) {
      setFormError('Please enter a valid email address');
      setIsSubmitting(false);
      return;
    }

    try {
      // Send form data to backend API
      const response = await contactAPI.submitContactForm(formData);
      
      console.log('Form submitted successfully:', response.data);
      setSubmitted(true);
      setTicketId(response.data.ticketId);
      
      // Reset form after submission
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        subject: '',
        message: '',
        category: user ? (user.role === 'client' ? 'project-help' : 'job-opportunities') : 'general',
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setFormError(error.response?.data?.message || 'Failed to submit the form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simple email validation
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Get category options based on user role
  const getCategoryOptions = () => {
    if (!user) {
      return [
        { value: 'general', label: 'General Inquiry' },
        { value: 'account-help', label: 'Account Help' },
        { value: 'feature-request', label: 'Feature Request' },
        { value: 'report-issue', label: 'Report an Issue' }
      ];
    } else if (user.role === 'client') {
      return [
        { value: 'project-help', label: 'Help with My Project' },
        { value: 'billing-question', label: 'Billing Question' },
        { value: 'freelancer-issue', label: 'Issue with a Freelancer' },
        { value: 'feature-request', label: 'Feature Request' },
        { value: 'other', label: 'Other' }
      ];
    } else {
      // Freelancer
      return [
        { value: 'job-opportunities', label: 'Job Opportunities' },
        { value: 'payment-issue', label: 'Payment Issue' },
        { value: 'client-issue', label: 'Issue with a Client' },
        { value: 'profile-help', label: 'Help with My Profile' },
        { value: 'feature-request', label: 'Feature Request' },
        { value: 'other', label: 'Other' }
      ];
    }
  };

  return (
    <div className="contact-container-compact">
      <div className="contact-header">
        <h1>Contact Us</h1>
        <p className="contact-tagline">
          {user ? 
            `We're here to help with any questions or concerns about your ${user.role} account.` :
            "Have questions about Open to Work? We're here to assist!"}
        </p>
      </div>

      <div className="contact-main">
        <Card className="contact-card">
          <CardHeader>
            <CardTitle>{submitted ? 'Thank You!' : 'Send Us a Message'}</CardTitle>
            <CardDescription>
              {submitted 
                ? 'We have received your message and will get back to you soon.'
                : 'Fill out the form below and our team will respond as soon as possible.'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {formError && <div className="contact-error">{formError}</div>}
            
            {!submitted ? (
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">Full Name</label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                      disabled={user}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">Email</label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Your email address"
                      disabled={user}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="category" className="form-label">Category</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="select-input"
                    required
                  >
                    {getCategoryOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="subject" className="form-label">Subject</label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Brief summary of your inquiry"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="message" className="form-label">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Please provide details about your inquiry..."
                    className="textarea-input"
                    rows="4"
                    required
                  ></textarea>
                </div>
                
                <div className="form-submit">
                  <Button 
                    type="submit" 
                    className="contact-button"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="success-message">
                <div className="success-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h3>Message Sent!</h3>
                <p>Thank you for contacting us. We'll respond to your inquiry within 24-48 hours.</p>
                {ticketId && <p className="ticket-id">Reference #: {ticketId.substring(0, 8)}</p>}
                <Button 
                  onClick={() => setSubmitted(false)} 
                  className="contact-button"
                >
                  Send Another Message
                </Button>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="contact-quick-info">
            <div className="contact-method">
              <i className="fas fa-envelope"></i>
              <span>support@opentowork.com</span>
            </div>
            <div className="contact-method">
              <i className="fas fa-phone"></i>
              <span>+216 28 354 073</span>
            </div>
            
            <div className="jobs-cta">
              <h4>Looking for work or talent?</h4>
              <p>Check out our job marketplace to find opportunities or post your job needs.</p>
              <div className="jobs-cta-buttons">
                {user ? (
                  <Button 
                    onClick={() => window.location.href = `/dashboard/${user.role}/${user.role === 'client' ? 'hire' : 'jobs'}`}
                    className="jobs-button"
                  >
                    <i className="fas fa-briefcase"></i> {user.role === 'client' ? 'Post a Job' : 'Find Jobs'}
                  </Button>
                ) : (
                  <Button 
                    onClick={() => window.location.href = '/jobs'}
                    className="jobs-button"
                  >
                    <i className="fas fa-briefcase"></i> Browse Jobs
                  </Button>
                )}
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Contact;