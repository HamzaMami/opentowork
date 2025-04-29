import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { walletAPI } from '../../api';
import './DashboardBase.css';

const ClientDashboard = () => {
  const { user } = useAuth();
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
            <CardTitle>Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">0</div>
            <div className="stat-description">Projects in progress</div>
          </CardContent>
        </Card>

        <Card className="dashboard-stat-card">
          <CardHeader className="card-header-compact">
            <CardTitle>Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">${loading ? '...' : walletBalance.toFixed(2)}</div>
            <div className="stat-description">Available funds</div>
          </CardContent>
        </Card>

        <Card className="dashboard-stat-card">
          <CardHeader className="card-header-compact">
            <CardTitle>Unread Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">0</div>
            <div className="stat-description">From freelancers</div>
          </CardContent>
        </Card>

        <Card className="dashboard-stat-card">
          <CardHeader className="card-header-compact">
            <CardTitle>Pending Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">0</div>
            <div className="stat-description">Awaiting feedback</div>
          </CardContent>
        </Card>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h3 className="section-title">Recent Projects</h3>
          <Card>
            <CardContent className="dashboard-empty-state">
              <div className="empty-icon">
                <i className="fas fa-briefcase"></i>
              </div>
              <h4>No projects yet</h4>
              <p>Create a new project to get started hiring freelancers.</p>
              <button className="dashboard-action-button">
                <i className="fas fa-plus"></i> Post a Project
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
              <p>Your messages with freelancers will appear here.</p>
              <button className="dashboard-action-button">
                <i className="fas fa-search"></i> Browse Freelancers
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;