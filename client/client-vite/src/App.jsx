import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './components/Home';
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AccountSettings from './components/auth/AccountSettings';
import Profile from './components/auth/Profile';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/about" 
              element={
                <div className="container page-container">
                  <div className="content-card">
                    <h1 className="page-title">About Us</h1>
                    <p className="page-text">Coming soon...</p>
                  </div>
                </div>
              } 
            />
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
            {/* Account settings route that all logged in users can access */}
            <Route 
              path="/account" 
              element={
                <ProtectedRoute>
                  <AccountSettings />
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
