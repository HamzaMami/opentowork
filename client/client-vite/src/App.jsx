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
import Wallet from './components/dashboard/wallet/Wallet';
import Chat from './components/dashboard/chat/Chat';
import AccountSettings from './components/dashboard/AccountSettings';
import PostJob from './components/dashboard/jobs/PostJob';
import Proposals from './components/dashboard/jobs/Proposals';
import ActiveProjects from './components/dashboard/ActiveProjects';
import ProposalReview from './components/dashboard/jobs/ProposalReview';
import ManageJobs from './components/dashboard/jobs/ManageJobs';
import Jobs from './components/dashboard/jobs/Jobs';
import JobDetails from './components/dashboard/jobs/JobDetails';
import EditJob from './components/dashboard/jobs/EditJob';
import UserManagement from './components/dashboard/admin/UserManagement';
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
              
              {/* Admin-specific dashboard features */}
              <Route path="users" element={
                <ProtectedRoute>
                  {({ user }) => (
                    user.role === 'admin' ? (
                      <UserManagement />
                    ) : (
                      <Navigate to={`/dashboard/${user.role}`} replace />
                    )
                  )}
                </ProtectedRoute>
              } />
              
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
                    user.role === 'client' || user.role === 'admin' ? (
                      <ProposalReview />
                    ) : (
                      <Navigate to="/dashboard/freelancer/proposals" replace />
                    )
                  )}
                </ProtectedRoute>
              } />
              <Route path="post-job" element={
                <ProtectedRoute>
                  {({ user }) => (
                    user.role === 'client' ? (
                      <PostJob />
                    ) : (
                      <Navigate to={`/dashboard/${user.role}`} replace />
                    )
                  )}
                </ProtectedRoute>
              } />
              <Route 
                path="hire" 
                element={
                  <ProtectedRoute>
                    {({ user }) => (
                      user.role === 'client' ? (
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
                      ) : (
                        <Navigate to={`/dashboard/${user.role}`} replace />
                      )
                    )}
                  </ProtectedRoute>
                } 
              />
              <Route
                path="jobs"
                element={
                  <ProtectedRoute>
                    {({ user }) => (
                      user.role === 'client' ? (
                        <ManageJobs />
                      ) : user.role === 'admin' ? (
                        <ManageJobs isAdmin={true} />
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
              <Route path="edit-job/:jobId" element={
                <ProtectedRoute>
                  {({ user }) => (
                    user.role === 'client' || user.role === 'admin' ? (
                      <EditJob />
                    ) : (
                      <Navigate to="/dashboard/freelancer/jobs" replace />
                    )
                  )}
                </ProtectedRoute>
              } />
              
              {/* Admin-specific routes for reports */}
              <Route path="reports" element={
                <ProtectedRoute>
                  {({ user }) => (
                    user.role === 'admin' ? (
                      <div className="dashboard-section">
                        <h2 className="dashboard-section-title">Reports Management</h2>
                        <p>Manage user and content reports.</p>
                        <div className="empty-state" style={{ marginTop: '2rem' }}>
                          <i className="fas fa-flag"></i>
                          <p>No reports to review at this time.</p>
                        </div>
                      </div>
                    ) : (
                      <Navigate to={`/dashboard/${user.role}`} replace />
                    )
                  )}
                </ProtectedRoute>
              } />
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
