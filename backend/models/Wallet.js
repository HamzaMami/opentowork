import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'payment', 'receive', 'refund', 'escrow'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  description: {
    type: String,
    required: true
  },
  reference: {
    type: String
  },
  relatedProject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0
  },
  pendingBalance: {
    type: Number,
    default: 0
  },
  escrowBalance: {
    type: Number,
    default: 0
  },
  transactions: [transactionSchema],
  paymentMethods: [{
    type: {
      type: String,
      enum: ['card', 'bank', 'paypal'],
      required: true
    },
    details: {
      type: Object
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp when document is modified
walletSchema.pre('save', async function() {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
});

const Wallet = mongoose.model('Wallet', walletSchema);

export default Wallet;