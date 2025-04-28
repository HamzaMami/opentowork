import mongoose from 'mongoose';

const freelancerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  skills: {
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
freelancerProfileSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

const FreelancerProfile = mongoose.model('FreelancerProfile', freelancerProfileSchema);

export default FreelancerProfile;