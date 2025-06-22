const mongoose = require("mongoose");

const employeeContractSchema = new mongoose.Schema(
  {
    // Employee Reference (Frontend Compatible)
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    employeeId: {
      type: String,
      required: true,
    },

    // Contract Basic Information (Frontend Compatible)
    contractType: {
      type: String,
      required: true,
      enum: ["Full-time", "Part-time", "Temporary", "Contract", "Seasonal"],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },

    // Compensation (Frontend Compatible)
    salary: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentFrequency: {
      type: String,
      required: true,
      enum: ["Weekly", "Bi-weekly", "Monthly"],
      default: "Monthly",
    },

    // Benefits (Frontend Compatible)
    benefits: [
      {
        type: String,
        enum: [
          "Health Insurance",
          "Dental Coverage",
          "Vision Insurance",
          "Retirement Plan",
          "Paid Time Off",
          "Sick Leave",
          "401k Matching",
          "Life Insurance",
          "Disability Insurance",
          "Flexible Spending Account",
        ],
      },
    ],

    // Working Hours (Frontend Compatible)
    workingHours: {
      weeklyHours: {
        type: Number,
        required: true,
        min: 0,
        max: 80,
      },
      scheduleType: {
        type: String,
        required: true,
        enum: ["Fixed", "Flexible"],
        default: "Fixed",
      },
    },

    // Leave Entitlement (Frontend Compatible)
    leaveEntitlement: {
      annualLeave: {
        type: Number,
        required: true,
        min: 0,
        default: 15,
      },
      sickLeave: {
        type: Number,
        required: true,
        min: 0,
        default: 10,
      },
      paidHolidays: {
        type: Number,
        required: true,
        min: 0,
        default: 8,
      },
    },

    // Probation Period (Frontend Compatible)
    probationPeriod: {
      duration: {
        type: Number,
        min: 0,
        default: 3, // in months
      },
      endDate: {
        type: Date,
      },
    },

    // Documents (Frontend Compatible)
    documents: [
      {
        type: {
          type: String,
          required: true,
          enum: [
            "Contract Agreement",
            "NDA",
            "Benefits Documentation",
            "Performance Reviews",
            "Amendments",
            "Tax Forms",
          ],
        },
        name: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Terms and Conditions (Frontend Compatible)
    terms: [
      {
        type: String,
      },
    ],

    // Status (Frontend Compatible)
    status: {
      type: String,
      enum: ["Active", "Expired", "Terminated", "Suspended"],
      default: "Active",
    },

    // Termination Details (Frontend Compatible)
    terminationDetails: {
      date: {
        type: Date,
      },
      reason: {
        type: String,
      },
      notes: {
        type: String,
      },
    },

    // Legacy fields (keep for backward compatibility)
    contractNumber: {
      type: String,
      sparse: true,
    },
    hourlyRate: {
      type: Number,
      min: 0,
    },
    overtimeRate: {
      type: Number,
      default: 0,
    },
    terminationNotice: {
      type: Number,
      default: 14, // in days
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
employeeContractSchema.index({ employee: 1, status: 1 });
employeeContractSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model("EmployeeContract", employeeContractSchema);
