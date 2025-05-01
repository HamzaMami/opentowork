import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './components/Home';
import About from './components/About';
import Contact from './components/Contact';
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/auth/Profile';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './components/dashboard/Dashboard';
import ClientDashboard from './components/dashboard/ClientDashboard';
import FreelancerDashboard from './components/dashboard/FreelancerDashboard';
import Wallet from './components/dashboard/Wallet';
import Chat from './components/dashboard/Chat';
import AccountSettings from './components/dashboard/AccountSettings';
import PostJob from './components/dashboard/PostJob';
import Proposals from './components/dashboard/Proposals';
import ActiveProjects from './components/dashboard/ActiveProjects';
import ProposalReview from './components/dashboard/ProposalReview';
import ManageJobs from './components/dashboard/ManageJobs';
import EditJob from './components/dashboard/EditJob';
import Jobs from './components/Jobs';
import JobDetails from './components/jobs/JobDetails';
import { Button } from './components/ui/button';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:jobId" element={<JobDetails />} />
            
            {/* Redirect from old account settings URL to the new location */}
            <Route 
              path="/account/settings" 
              element={
                <ProtectedRoute>
                  {({ user }) => (
                    <Navigate to={`/dashboard/${user.role}/settings`} replace />
                  )}
                </ProtectedRoute>
              } 
            />
            
            {/* Profile route that handles both client and freelancer profiles */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />

            {/* Dashboard routes using nested routing */}
            <Route 
              path="/dashboard/:role" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            >
              {/* Shared dashboard features */}
              <Route path="wallet" element={<Wallet />} />
              <Route path="chat" element={<Chat />} />
              <Route path="settings" element={<AccountSettings />} />
              
              {/* Client-specific dashboard features */}
              <Route path="active-projects" element={<ActiveProjects />} />
              <Route path="projects" element={<ActiveProjects />} />
              <Route path="proposals" element={
                <ProtectedRoute>
                  {({ user }) => (
                    user.role === 'client' ? (
                      <ProposalReview />
                    ) : (
                      <Proposals />
                    )
                  )}
                </ProtectedRoute>
              } />
              {/* Add the missing route to view proposals for a specific job */}
              <Route path="proposals/:jobId" element={
                <ProtectedRoute>
                  {({ user }) => (
                    user.role === 'client' ? (
                      <ProposalReview />
                    ) : (
                      <Navigate to="/dashboard/freelancer/proposals" replace />
                    )
                  )}
                </ProtectedRoute>
              } />
              <Route path="post-job" element={<PostJob />} />
              <Route 
                path="hire" 
                element={
                  <div className="dashboard-section">
                    <h2 className="dashboard-section-title">Post a Job</h2>
                    <p>Create a new job to find talented freelancers for your project.</p>
                    <div className="action-buttons" style={{ marginTop: "1.5rem" }}>
                      <Button 
                        onClick={() => window.location.href = '/dashboard/client/post-job'}
                        style={{
                          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '0.5rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontWeight: '600',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <i className="fas fa-plus-circle"></i> Create New Job Post
                      </Button>
                    </div>
                  </div>
                } 
              />
              <Route
                path="jobs"
                element={
                  <ProtectedRoute>
                    {({ user }) => (
                      user.role === 'client' ? (
                        <ManageJobs />
                      ) : (
                        <div className="dashboard-section">
                          <h2 className="dashboard-section-title">Available Jobs</h2>
                          <p>Find and apply to jobs that match your skills.</p>
                          <div style={{ marginTop: '1.5rem' }}>
                            <Jobs />
                          </div>
                        </div>
                      )
                    )}
                  </ProtectedRoute>
                }
              />
            </Route>
            
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
