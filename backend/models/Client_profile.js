import mongoose from 'mongoose';

const clientProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String // URL to the profile image
  },
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
clientProfileSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

const ClientProfile = mongoose.model('ClientProfile', clientProfileSchema);

export default ClientProfile;