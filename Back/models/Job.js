import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true,
    minlength: [50, 'Job description must be at least 50 characters long'],
    maxlength: [5000, 'Job description cannot exceed 5000 characters']
  },
  category: {
    type: String,
    required: [true, 'Job category is required'],
    trim: true
  },
  skills: {
    type: [String],
    required: [true, 'At least one skill is required'],
    validate: {
      validator: function(skills) {
        return skills.length > 0;
      },
      message: 'At least one skill is required'
    }
  },
  budget: {
    min: {
      type: Number,
      required: [true, 'Minimum budget is required'],
      min: [1, 'Minimum budget must be at least 1']
    },
    max: {
      type: Number,
      required: [true, 'Maximum budget is required'],
      min: [1, 'Maximum budget must be at least 1']
    },
    type: {
      type: String,
      enum: ['fixed', 'hourly'],
      default: 'fixed'
    }
  },
  location: {
    type: String,
    default: 'Remote'
  },
  duration: {
    type: String,
    default: ''
  },
  experienceLevel: {
    type: String,
    enum: ['Entry Level', 'Intermediate', 'Expert'],
    default: 'Intermediate'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'completed', 'cancelled', 'completion-pending'],
    default: 'open'
  },
  completionStatus: {
    clientConfirmed: {
      type: Boolean,
      default: false
    },
    freelancerConfirmed: {
      type: Boolean,
      default: false
    },
    clientConfirmedAt: {
      type: Date,
      default: null
    },
    freelancerConfirmedAt: {
      type: Date,
      default: null
    }
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  proposals: [{
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    coverLetter: {
      type: String,
      required: true,
      trim: true,
      minlength: [50, 'Cover letter must be at least 50 characters long'],
      maxlength: [1000, 'Cover letter cannot exceed 1000 characters']
    },
    price: {
      type: Number,
      required: true,
      min: [1, 'Price must be at least 1']
    },
    estimatedTime: {
      value: {
        type: Number,
        required: true,
        min: [1, 'Estimated time must be at least 1']
      },
      unit: {
        type: String,
        enum: ['hour', 'day', 'week', 'month'],
        required: true
      }
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
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
}, { 
  timestamps: true
});

// Create indexes for faster queries
jobSchema.index({ title: 'text', description: 'text', skills: 'text' });
jobSchema.index({ client: 1 });
jobSchema.index({ status: 1 });
jobSchema.index({ category: 1 });

const Job = mongoose.model('Job', jobSchema);

export default Job;