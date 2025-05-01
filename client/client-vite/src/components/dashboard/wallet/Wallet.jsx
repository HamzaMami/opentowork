import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { walletAPI } from '../../../api';
import '../DashboardBase.css';
import './WalletComponents.css';

const Wallet = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    paymentType: 'card',
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Load wallet data when component mounts
  useEffect(() => {
    const fetchWalletData = async () => {
      setLoading(true);
      try {
        const walletRes = await walletAPI.getWallet();
        setWallet(walletRes.data);
        
        const transactionsRes = await walletAPI.getTransactions();
        setTransactions(transactionsRes.data);
        
        const paymentMethodsRes = await walletAPI.getPaymentMethods();
        setPaymentMethods(paymentMethodsRes.data.paymentMethods);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching wallet data:', err);
        setError('Failed to load wallet data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWalletData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle adding funds (for clients)
  const handleAddFunds = async (e) => {
    e.preventDefault();
    setFormError('');
    
    const { amount } = formData;
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }
    
    try {
      // In a real app, you would process the payment details here
      const paymentMethod = {
        // Mock payment details
        type: 'card',
        last4: '4242'
      };
      
      const response = await walletAPI.addFunds(Number(amount), paymentMethod);
      
      // Update local state with new data
      setWallet({
        ...wallet,
        balance: response.data.balance
      });
      
      // Refresh transactions
      const transactionsRes = await walletAPI.getTransactions();
      setTransactions(transactionsRes.data);
      
      setSuccess('Funds added successfully!');
      
      // Reset form
      setFormData({
        ...formData,
        amount: ''
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding funds:', err);
      setFormError(err.response?.data?.message || 'Failed to add funds. Please try again.');
    }
  };
  
  // Handle withdrawal (for freelancers)
  const handleWithdrawFunds = async (e) => {
    e.preventDefault();
    setFormError('');
    
    const { amount } = formData;
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }
    
    if (Number(amount) > wallet.balance) {
      setFormError('Insufficient funds for withdrawal.');
      return;
    }
    
    try {
      const withdrawalMethod = {
        type: 'bank',
        // Mock withdrawal details
        accountNumber: '********1234'
      };
      
      const response = await walletAPI.withdrawFunds(Number(amount), withdrawalMethod);
      
      // Update local state with new data
      setWallet({
        ...wallet,
        balance: response.data.balance
      });
      
      // Refresh transactions
      const transactionsRes = await walletAPI.getTransactions();
      setTransactions(transactionsRes.data);
      
      setSuccess('Withdrawal request submitted successfully!');
      
      // Reset form
      setFormData({
        ...formData,
        amount: ''
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error processing withdrawal:', err);
      setFormError(err.response?.data?.message || 'Failed to process withdrawal. Please try again.');
    }
  };
  
  // Handle removing a payment method
  const handleRemovePaymentMethod = async (methodId) => {
    try {
      await walletAPI.removePaymentMethod(methodId);
      
      // Update payment methods list
      const paymentMethodsRes = await walletAPI.getPaymentMethods();
      setPaymentMethods(paymentMethodsRes.data.paymentMethods);
      
      setSuccess('Payment method removed successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error removing payment method:', err);
      setError(err.response?.data?.message || 'Failed to remove payment method.');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  if (loading) {
    return <div className="dashboard-loading">Loading wallet data...</div>;
  }

  return (
    <div className="dashboard-wallet">
      <h2 className="dashboard-section-title">Wallet</h2>
      <p className="dashboard-subtitle">Manage your funds and transaction history</p>
      
      {error && <div className="dashboard-error">{error}</div>}
      {formError && <div className="dashboard-error">{formError}</div>}
      {success && <div className="dashboard-success">{success}</div>}
      
      <div className="wallet-overview">
        <Card className="balance-card">
          <CardHeader>
            <CardTitle>Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="balance-amount">${wallet?.balance?.toFixed(2) || '0.00'}</div>
            {user.role === 'freelancer' && (
              <button className="dashboard-action-button" onClick={() => setActiveTab('withdrawal')}>
                <i className="fas fa-money-bill-wave"></i> Withdraw Funds
              </button>
            )}
            {user.role === 'client' && (
              <button className="dashboard-action-button" onClick={() => setActiveTab('deposit')}>
                <i className="fas fa-plus"></i> Add Funds
              </button>
            )}
          </CardContent>
        </Card>

        {user.role === 'freelancer' && (
          <Card className="balance-card">
            <CardHeader>
              <CardTitle>Pending Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="balance-amount pending">${wallet?.pendingBalance?.toFixed(2) || '0.00'}</div>
              <p className="balance-note">Available after job completion</p>
            </CardContent>
          </Card>
        )}
        
        {user.role === 'client' && (
          <Card className="balance-card">
            <CardHeader>
              <CardTitle>Escrow Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="balance-amount pending">${wallet?.escrowBalance?.toFixed(2) || '0.00'}</div>
              <p className="balance-note">Reserved for active projects</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="wallet-tabs">
        <div className="tabs-header">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </button>
          {user.role === 'client' && (
            <>
              <button 
                className={`tab-button ${activeTab === 'deposit' ? 'active' : ''}`}
                onClick={() => setActiveTab('deposit')}
              >
                Add Funds
              </button>
              <button 
                className={`tab-button ${activeTab === 'payment-methods' ? 'active' : ''}`}
                onClick={() => setActiveTab('payment-methods')}
              >
                Payment Methods
              </button>
            </>
          )}
          {user.role === 'freelancer' && (
            <>
              <button 
                className={`tab-button ${activeTab === 'withdrawal' ? 'active' : ''}`}
                onClick={() => setActiveTab('withdrawal')}
              >
                Withdraw Funds
              </button>
              <button 
                className={`tab-button ${activeTab === 'withdrawal-methods' ? 'active' : ''}`}
                onClick={() => setActiveTab('withdrawal-methods')}
              >
                Withdrawal Methods
              </button>
            </>
          )}
        </div>
        
        <div className="tabs-content">
          {activeTab === 'overview' && (
            <Card>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="recent-transactions">
                    <h3>Recent Transactions</h3>
                    <table className="transactions-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.slice(0, 5).map(transaction => (
                          <tr key={transaction._id}>
                            <td>{formatDate(transaction.createdAt)}</td>
                            <td>{transaction.description}</td>
                            <td className={['deposit', 'receive'].includes(transaction.type) ? 'text-green' : 'text-red'}>
                              {['deposit', 'receive'].includes(transaction.type) ? '+' : '-'}${transaction.amount.toFixed(2)}
                            </td>
                            <td>
                              <span className={`status-badge ${transaction.status.toLowerCase()}`}>
                                {transaction.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="dashboard-empty-state">
                    <div className="empty-icon">
                      <i className="fas fa-wallet"></i>
                    </div>
                    <h4>No recent activity</h4>
                    <p>
                      {user.role === 'client' 
                        ? 'Add funds to your wallet to start hiring freelancers.' 
                        : 'Complete jobs to earn money and build your balance.'}
                    </p>
                    {user.role === 'client' && (
                      <button className="dashboard-action-button" onClick={() => setActiveTab('deposit')}>
                        <i className="fas fa-plus"></i> Add Funds
                      </button>
                    )}
                    {user.role === 'freelancer' && (
                      <button className="dashboard-action-button" onClick={() => window.location.href = '/dashboard/freelancer/jobs'}>
                        <i className="fas fa-search"></i> Find Jobs
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'transactions' && (
            <Card>
              <CardContent>
                {transactions.length > 0 ? (
                  <div className="transactions-table-container">
                    <table className="transactions-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Reference</th>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map(transaction => (
                          <tr key={transaction._id}>
                            <td>{formatDate(transaction.createdAt)}</td>
                            <td>{transaction.description}</td>
                            <td>{transaction.reference || '-'}</td>
                            <td>{transaction.type}</td>
                            <td className={['deposit', 'receive'].includes(transaction.type) ? 'text-green' : 'text-red'}>
                              {['deposit', 'receive'].includes(transaction.type) ? '+' : '-'}${transaction.amount.toFixed(2)}
                            </td>
                            <td>
                              <span className={`status-badge ${transaction.status.toLowerCase()}`}>
                                {transaction.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="dashboard-empty-state">
                    <div className="empty-icon">
                      <i className="fas fa-receipt"></i>
                    </div>
                    <h4>No transactions yet</h4>
                    <p>Your transaction history will appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'deposit' && user.role === 'client' && (
            <Card>
              <CardContent>
                <h3>Add Funds to Your Wallet</h3>
                <form className="deposit-form" onSubmit={handleAddFunds}>
                  <div className="form-group">
                    <label htmlFor="amount">Amount (USD)</label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      min="1"
                      step="0.01"
                      required
                      className="form-control"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="paymentType">Payment Method</label>
                    <select 
                      id="paymentType" 
                      name="paymentType" 
                      value={formData.paymentType}
                      onChange={handleInputChange}
                      className="form-control"
                    >
                      <option value="card">Credit/Debit Card</option>
                      <option value="paypal">PayPal</option>
                    </select>
                  </div>
                  
                  {formData.paymentType === 'card' && (
                    <>
                      <div className="form-group">
                        <label htmlFor="cardNumber">Card Number</label>
                        <input
                          type="text"
                          id="cardNumber"
                          name="cardNumber"
                          value={formData.cardNumber}
                          onChange={handleInputChange}
                          placeholder="1234 5678 9012 3456"
                          required
                          className="form-control"
                        />
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group half">
                          <label htmlFor="cardHolder">Card Holder</label>
                          <input
                            type="text"
                            id="cardHolder"
                            name="cardHolder"
                            value={formData.cardHolder}
                            onChange={handleInputChange}
                            placeholder="John Doe"
                            required
                            className="form-control"
                          />
                        </div>
                        
                        <div className="form-group quarter">
                          <label htmlFor="expiryDate">Expiry</label>
                          <input
                            type="text"
                            id="expiryDate"
                            name="expiryDate"
                            value={formData.expiryDate}
                            onChange={handleInputChange}
                            placeholder="MM/YY"
                            required
                            className="form-control"
                          />
                        </div>
                        
                        <div className="form-group quarter">
                          <label htmlFor="cvv">CVV</label>
                          <input
                            type="password"
                            id="cvv"
                            name="cvv"
                            value={formData.cvv}
                            onChange={handleInputChange}
                            placeholder="123"
                            required
                            className="form-control"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="form-submit">
                    <button type="submit" className="dashboard-action-button">
                      Add Funds
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'withdrawal' && user.role === 'freelancer' && (
            <Card>
              <CardContent>
                <h3>Withdraw Funds</h3>
                <form className="withdrawal-form" onSubmit={handleWithdrawFunds}>
                  <div className="form-group">
                    <label htmlFor="amount">Amount (USD)</label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      min="1"
                      max={wallet?.balance || 0}
                      step="0.01"
                      required
                      className="form-control"
                    />
                    <small>Available balance: ${wallet?.balance?.toFixed(2) || '0.00'}</small>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="withdrawalType">Withdrawal Method</label>
                    <select 
                      id="withdrawalType" 
                      name="withdrawalType" 
                      value={formData.withdrawalType}
                      onChange={handleInputChange}
                      className="form-control"
                    >
                      <option value="bank">Bank Transfer</option>
                      <option value="paypal">PayPal</option>
                    </select>
                  </div>
                  
                  <div className="form-submit">
                    <button 
                      type="submit" 
                      className="dashboard-action-button"
                      disabled={!wallet?.balance || wallet.balance <= 0}
                    >
                      Request Withdrawal
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'payment-methods' && user.role === 'client' && (
            <Card>
              <CardContent>
                {paymentMethods?.length > 0 ? (
                  <div className="payment-methods-list">
                    <h3>Your Payment Methods</h3>
                    {paymentMethods.map(method => (
                      <div key={method._id} className="payment-method-item">
                        <div className="payment-method-info">
                          <div className="payment-method-icon">
                            <i className={`fas ${method.type === 'card' ? 'fa-credit-card' : 'fa-paypal'}`}></i>
                          </div>
                          <div className="payment-method-details">
                            <div className="payment-method-name">
                              {method.type === 'card' ? `Card ending in ${method.details.last4}` : 'PayPal Account'}
                              {method.isDefault && <span className="default-badge">Default</span>}
                            </div>
                            {method.type === 'card' && (
                              <div className="payment-method-expiry">Expires {method.details.expiryDate}</div>
                            )}
                          </div>
                        </div>
                        <button className="payment-method-delete" onClick={() => handleRemovePaymentMethod(method._id)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="dashboard-empty-state">
                    <div className="empty-icon">
                      <i className="fas fa-credit-card"></i>
                    </div>
                    <h4>No payment methods</h4>
                    <p>Add a payment method to fund your account.</p>
                    <button className="dashboard-action-button" onClick={() => setActiveTab('add-payment-method')}>
                      <i className="fas fa-plus"></i> Add Payment Method
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {activeTab === 'withdrawal-methods' && user.role === 'freelancer' && (
            <Card>
              <CardContent>
                <div className="dashboard-empty-state">
                  <div className="empty-icon">
                    <i className="fas fa-university"></i>
                  </div>
                  <h4>No withdrawal methods</h4>
                  <p>Add a withdrawal method to receive your earnings.</p>
                  <button className="dashboard-action-button">
                    <i className="fas fa-plus"></i> Add Withdrawal Method
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;