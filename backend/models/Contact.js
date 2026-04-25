import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'general',
      'account-help',
      'feature-request',
      'report-issue',
      'project-help',
      'billing-question',
      'freelancer-issue',
      'job-opportunities',
      'payment-issue',
      'client-issue',
      'profile-help',
      'other'
    ]
  },
  status: {
    type: String,
    default: 'new',
    enum: ['new', 'in-progress', 'resolved', 'closed']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  userRole: {
    type: String,
    enum: ['client', 'freelancer', 'admin', 'guest'],
    default: 'guest'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  adminNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Contact = mongoose.model('Contact', ContactSchema);

export default Contact;