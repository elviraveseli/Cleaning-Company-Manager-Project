const mongoose = require("mongoose");

const customerContractSchema = new mongoose.Schema(
  {
    contractNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    objectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Object",
      required: false,
    },
    customer: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        required: true,
      },
      address: {
        street: String,
        city: String,
        municipality: String,
        country: {
          type: String,
          default: "Kosovo",
        },
      },
    },
    billingAddress: {
      sameAsService: {
        type: Boolean,
        default: true,
      },
      address: String,
      city: String,
      municipality: String,
      country: {
        type: String,
        default: "Kosovo",
      },
    },
    objects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Object",
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    contractType: {
      type: String,
      required: true,
      enum: ["One-time", "Recurring", "Long-term", "Emergency"],
    },
    billingFrequency: {
      type: String,
      required: true,
      enum: ["Weekly", "Bi-weekly", "Monthly", "Quarterly", "Annually"],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "EUR",
    },
    paymentTerms: {
      type: String,
      enum: [
        "Within 10 days",
        "Within 20 days",
        "Within 30 days",
        "Within 45 days",
        "Immediate Payment",
        "In advance"
      ],
      default: "Within 30 days",
    },
    // Payment calculation fields
    paymentCalculation: {
      paymentTermsText: String,
      paymentMethod: String,
      quantityHours: Number,
      hourlyRate: Number,
      totalAmountExcludingVAT: Number,
      vatRate: {
        type: Number,
        default: 8.1
      },
      vatAmount: Number,
      totalAmountIncludingVAT: Number,
      rhythmCountByYear: Number,
      totalAnnualizedQuantityHours: Number,
      totalMonthWorkingHours: Number,
      totalAnnualizedContractValue: Number,
      totalMonthlyContractValue: Number,
      employeeHoursPerEngagement: Number,
      numberOfEmployees: Number,
      totalHoursPerEngagement: Number,
    },
    services: [
      {
        name: {
          type: String,
          required: true,
        },
        description: String,
        frequency: {
          type: String,
          enum: ["Daily", "Weekly", "Bi-weekly", "Monthly", "As Needed"],
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    workingDaysAndTimes: [
      {
        day: {
          type: String,
          required: true,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
        },
        timeSlots: [
          {
            from: {
              type: String,
              required: true,
              validate: {
                validator: function (v) {
                  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
                },
                message: "Time must be in HH:MM format",
              },
            },
            to: {
              type: String,
              required: true,
              validate: {
                validator: function (v) {
                  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
                },
                message: "Time must be in HH:MM format",
              },
            },
            duration: {
              type: Number, // in hours
              required: true,
              min: 0.5,
              max: 12,
            },
          },
        ],
      },
    ],
    servicePreferences: {
      keyAccess: {
        type: Boolean,
        default: false,
      },
      petInstructions: {
        type: String,
      },
      accessInstructions: {
        type: String,
      },
      specialRequests: {
        type: String,
      },
    },
    specialRequirements: [String],
    status: {
      type: String,
      enum: ["Active", "Expired", "Terminated", "Suspended", "Pending"],
      default: "Pending",
    },
    terms: String,
    notes: String,
    documents: [
      {
        fileName: String,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
customerContractSchema.index({ "customer.email": 1 });
customerContractSchema.index({ startDate: 1, endDate: 1 });
customerContractSchema.index({ status: 1 });

module.exports = mongoose.model("CustomerContract", customerContractSchema);
