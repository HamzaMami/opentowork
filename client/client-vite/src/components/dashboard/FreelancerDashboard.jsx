import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { walletAPI } from '../../api';
import './DashboardBase.css';

const FreelancerDashboard = () => {
  const { user, freelancerProfile } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch wallet data when component mounts
  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        const walletRes = await walletAPI.getWallet();
        setWalletBalance(walletRes.data?.balance || 0);
      } catch (err) {
        console.error('Error fetching wallet data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWalletData();
  }, []);

  return (
    <div className="dashboard-overview">
      <h2 className="dashboard-welcome">Welcome back, {user.name}!</h2>
      <p className="dashboard-subtitle">Here's an overview of your account and activity.</p>
      
      <div className="dashboard-stats-grid">
        <Card className="dashboard-stat-card">
          <CardHeader className="card-header-compact">
            <CardTitle>Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">0</div>
            <div className="stat-description">Jobs in progress</div>
          </CardContent>
        </Card>

        <Card className="dashboard-stat-card">
          <CardHeader className="card-header-compact">
            <CardTitle>Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">${loading ? '...' : walletBalance.toFixed(2)}</div>
            <div className="stat-description">Available earnings</div>
          </CardContent>
        </Card>

        <Card className="dashboard-stat-card">
          <CardHeader className="card-header-compact">
            <CardTitle>Proposals Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">0</div>
            <div className="stat-description">Awaiting response</div>
          </CardContent>
        </Card>

        <Card className="dashboard-stat-card">
          <CardHeader className="card-header-compact">
            <CardTitle>Profile Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">0</div>
            <div className="stat-description">Past 30 days</div>
          </CardContent>
        </Card>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h3 className="section-title">Recent Jobs</h3>
          <Card>
            <CardContent className="dashboard-empty-state">
              <div className="empty-icon">
                <i className="fas fa-briefcase"></i>
              </div>
              <h4>No active jobs yet</h4>
              <p>Start applying to available jobs to find work opportunities.</p>
              <button className="dashboard-action-button">
                <i className="fas fa-search"></i> Find Jobs
              </button>
            </CardContent>
          </Card>
        </div>

        <div className="dashboard-section">
          <h3 className="section-title">Recent Messages</h3>
          <Card>
            <CardContent className="dashboard-empty-state">
              <div className="empty-icon">
                <i className="fas fa-comments"></i>
              </div>
              <h4>No messages yet</h4>
              <p>Your messages with clients will appear here.</p>
              <button className="dashboard-action-button">
                <i className="fas fa-paper-plane"></i> Send Proposals
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="dashboard-section">
        <h3 className="section-title">Skills & Expertise</h3>
        <Card>
          <CardContent>
            {freelancerProfile?.skills ? (
              <div className="skills-container">
                {freelancerProfile.skills.split(',').map((skill, index) => (
                  <span key={index} className="skill-tag">{skill.trim()}</span>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty-state">
                <div className="empty-icon">
                  <i className="fas fa-tools"></i>
                </div>
                <h4>No skills added yet</h4>
                <p>Add your skills to help clients find you for relevant projects.</p>
                <button className="dashboard-action-button">
                  <i className="fas fa-plus"></i> Add Skills
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FreelancerDashboard;