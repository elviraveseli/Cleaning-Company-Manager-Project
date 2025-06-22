const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  object: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Object',
    required: true
  },
  employees: [{
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    role: {
      type: String,
      enum: ['Primary', 'Secondary', 'Supervisor'],
      default: 'Primary'
    }
  }],
  customerContract: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerContract'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  estimatedDuration: {
    type: Number, // in hours
    required: true
  },
  actualDuration: {
    type: Number // in hours
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'No Show'],
    default: 'Scheduled'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  cleaningType: {
    type: String,
    enum: ['Regular', 'Deep Clean', 'Move-in/Move-out', 'Emergency', 'Special Event'],
    default: 'Regular'
  },
  tasks: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    completed: {
      type: Boolean,
      default: false
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    completedAt: Date
  }],
  notes: String,
  customerFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    date: Date
  },
  photos: [{
    fileName: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
scheduleSchema.index({ scheduledDate: 1, status: 1 });
scheduleSchema.index({ object: 1, scheduledDate: 1 });
scheduleSchema.index({ 'employees.employee': 1, scheduledDate: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema); 