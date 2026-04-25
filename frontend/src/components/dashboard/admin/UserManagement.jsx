import { useState, useEffect } from 'react';
import { usersAPI } from '../../../api';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import '../DashboardBase.css';
import './AdminComponents.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    username: '',
    role: ''
  });
  
  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await usersAPI.getAll();
        setUsers(response.data.users);
        setFilteredUsers(response.data.users);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  // Apply filters whenever searchTerm or roleFilter changes
  useEffect(() => {
    let result = users;
    
    // Apply role filter if not 'all'
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }
    
    // Apply search filter if there's a search term
    if (searchTerm.trim()) {
      const searchTermLower = searchTerm.toLowerCase();
      result = result.filter(
        user =>
          user.name.toLowerCase().includes(searchTermLower) ||
          user.username.toLowerCase().includes(searchTermLower) ||
          user.email.toLowerCase().includes(searchTermLower)
      );
    }
    
    setFilteredUsers(result);
  }, [users, searchTerm, roleFilter]);
  
  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    try {
      await usersAPI.delete(userId);
      
      // Update the users list
      setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));
      
      // Close the confirmation dialog
      setIsConfirmDialogOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again later.');
    }
  };
  
  // Open confirm delete dialog
  const openConfirmDeleteDialog = (user) => {
    setSelectedUser(user);
    setIsConfirmDialogOpen(true);
  };
  
  // Open edit user modal
  const openEditUserModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role
    });
    setIsEditModalOpen(true);
  };
  
  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prevForm => ({
      ...prevForm,
      [name]: value
    }));
  };
  
  // Handle user update
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) return;
    
    try {
      await usersAPI.update(selectedUser._id, editForm);
      
      // Update the users list
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === selectedUser._id 
            ? { ...user, ...editForm } 
            : user
        )
      );
      
      // Close the edit modal
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user. Please try again later.');
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="admin-content">
      <h2 className="admin-title">User Management</h2>
      <p className="admin-subtitle">View, edit, and manage user accounts</p>
      
      <div className="admin-filters">
        <div className="search-box">
          <i className="fas fa-search search-icon"></i>
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="role-filter"
        >
          <option value="all">All Roles</option>
          <option value="client">Clients</option>
          <option value="freelancer">Freelancers</option>
          <option value="admin">Admins</option>
        </select>
      </div>
      
      <div className="users-list">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <i className="fas fa-exclamation-circle"></i>
            <p>{error}</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <div className="user-actions">
                      <button 
                        className="edit-button"
                        onClick={() => openEditUserModal(user)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => openConfirmDeleteDialog(user)}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <i className="fas fa-users-slash"></i>
            <p>No users found matching your filters.</p>
          </div>
        )}
      </div>
      
      {/* Confirmation Dialog */}
      {isConfirmDialogOpen && selectedUser && (
        <div className="modal-overlay">
          <div className="confirm-dialog">
            <h3>Delete User?</h3>
            <p>
              Are you sure you want to delete the user <strong>{selectedUser.name}</strong>? 
              This action cannot be undone.
            </p>
            <div className="confirm-actions">
              <button 
                className="cancel-button"
                onClick={() => setIsConfirmDialogOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="delete-button"
                onClick={() => handleDeleteUser(selectedUser._id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="modal-overlay">
          <div className="edit-modal">
            <div className="modal-header">
              <h3>Edit User</h3>
              <button 
                className="close-button"
                onClick={() => setIsEditModalOpen(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form className="edit-form" onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  value={editForm.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input 
                  type="text" 
                  id="username" 
                  name="username" 
                  value={editForm.username}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  value={editForm.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select 
                  id="role" 
                  name="role" 
                  value={editForm.role}
                  onChange={handleInputChange}
                  required
                >
                  <option value="client">Client</option>
                  <option value="freelancer">Freelancer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="save-button"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;