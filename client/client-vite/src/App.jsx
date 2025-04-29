import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './components/Home';
import About from './components/About';
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
            <Route 
              path="/jobs" 
              element={
                <div className="container page-container">
                  <div className="content-card">
                    <h1 className="page-title">Job Listings</h1>
                    <p className="page-text">Coming soon...</p>
                  </div>
                </div>
              } 
            />
            
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
              
              {/* Client-specific dashboard features - placeholders for now */}
              <Route 
                path="projects" 
                element={
                  <div className="dashboard-section">
                    <h2 className="dashboard-section-title">My Projects</h2>
                    <p>This feature is coming soon...</p>
                  </div>
                } 
              />
              <Route 
                path="hire" 
                element={
                  <div className="dashboard-section">
                    <h2 className="dashboard-section-title">Hire Freelancers</h2>
                    <p>This feature is coming soon...</p>
                  </div>
                } 
              />
              
              {/* Freelancer-specific dashboard features - placeholders for now */}
              <Route 
                path="jobs" 
                element={
                  <div className="dashboard-section">
                    <h2 className="dashboard-section-title">Available Jobs</h2>
                    <p>This feature is coming soon...</p>
                  </div>
                } 
              />
              <Route 
                path="proposals" 
                element={
                  <div className="dashboard-section">
                    <h2 className="dashboard-section-title">My Proposals</h2>
                    <p>This feature is coming soon...</p>
                  </div>
                } 
              />
            </Route>
            
            <Route 
              path="/contact" 
              element={
                <div className="container page-container">
                  <div className="content-card">
                    <h1 className="page-title">Contact Us</h1>
                    <p className="page-text">Coming soon...</p>
                  </div>
                </div>
              } 
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
