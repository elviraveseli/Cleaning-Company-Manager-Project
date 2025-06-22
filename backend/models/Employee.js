const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    // Basic Data (Frontend Compatible)
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      required: true,
      enum: [
        "Cleaner",
        "Senior Cleaner",
        "Team Lead",
        "Supervisor",
        "Manager",
        "Administrator",
        "Specialist",
      ],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "On Leave"],
      default: "Active",
    },
    hourlyRate: {
      type: Number,
      required: true,
      min: 0,
    },
    hireDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Address Information (Kosovo format)
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    municipality: {
      type: String,
      required: true,
      enum: [
        "Pristina",
        "Mitrovica",
        "Peja",
        "Prizren",
        "Gjilan",
        "Ferizaj",
        "Gjakova",
        "Podujeva",
        "Suhareka",
        "Malisheva",
        "Vushtrri",
        "Drenas",
        "Rahovec",
        "Lipjan",
        "Kamenica",
        "Viti",
        "Obiliq",
        "Fushe Kosova",
        "Kllokot",
        "Novoberde",
        "Kacanik",
        "Hani i Elezit",
        "Mamusa",
        "Junik",
        "Decan",
        "Istog",
        "Klina",
        "Skenderaj",
        "Leposavic",
        "Zubin Potok",
        "Zvecan",
        "Mitrovica North",
        "Dragash",
        "Shtime",
        "Shterpce",
        "Ranillug",
        "Gracanica",
      ],
    },

    // Citizenship and Legal Status
    nationality: {
      type: String,
      required: true,
      enum: ["Kosovo Citizen", "EU Citizen", "Non-EU Citizen"],
    },

    // Kosovo Personal Identification Number
    personalNumber: {
      type: String,
      required: function () {
        return this.nationality === "Kosovo Citizen";
      },
      validate: {
        validator: function (v) {
          if (this.nationality !== "Kosovo Citizen" && !v) return true;
          return /^\d{10}$/.test(v);
        },
        message: "Personal number must be 10 digits for Kosovo citizens",
      },
    },

    // Work Permits (for non-Kosovo citizens)
    workPermit: {
      type: {
        type: String,
        enum: ["A", "B", "C", "D", "E", "F", "G", "H", "Not Required"],
        required: true,
        default: function () {
          return this.nationality === "Kosovo Citizen" ? "Not Required" : "A";
        },
      },
      number: {
        type: String,
        required: function () {
          return this.nationality !== "Kosovo Citizen";
        },
      },
      issueDate: {
        type: Date,
        required: function () {
          return this.nationality !== "Kosovo Citizen";
        },
      },
      expiryDate: {
        type: Date,
        required: function () {
          return this.nationality !== "Kosovo Citizen";
        },
      },
      issuingAuthority: {
        type: String,
        default: "Ministry of Internal Affairs - Kosovo",
      },
    },

    // Residence Permit (for non-Kosovo citizens)
    residencePermit: {
      type: {
        type: String,
        enum: ["Temporary", "Permanent", "EU Long-term", "Not Required"],
        default: function () {
          return this.nationality === "Kosovo Citizen"
            ? "Not Required"
            : "Temporary";
        },
      },
      number: {
        type: String,
        required: function () {
          return this.nationality !== "Kosovo Citizen";
        },
      },
      expiryDate: {
        type: Date,
        required: function () {
          return this.nationality !== "Kosovo Citizen";
        },
      },
    },

    // Emergency Contact (Frontend Compatible)
    emergencyContact: {
      name: {
        type: String,
        required: true,
      },
      relationship: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
    },

    // Kosovo-specific Documents
    documents: [
      {
        type: {
          type: String,
          required: true,
          enum: [
            "Kosovo ID Card",
            "Kosovo Passport",
            "EU Passport",
            "Non-EU Passport",
            "Kosovo Driving License",
            "Work Permit",
            "Residence Permit",
            "Health Insurance Card",
            "Employment Contract",
            "Criminal Background Check",
            "Health Certificate",
            "Educational Certificates",
            "Professional Qualifications",
            "Other",
          ],
        },
        number: {
          type: String,
          required: true,
        },
        expiryDate: {
          type: Date,
          required: true,
        },
      },
    ],

    // Skills and Certifications (Frontend Compatible)
    skills: [
      {
        type: String,
        enum: [
          "General Cleaning",
          "Floor Care",
          "Window Cleaning",
          "Carpet Cleaning",
          "Pressure Washing",
          "Deep Cleaning",
          "Sanitization",
          "Equipment Operation",
          "Team Leadership",
          "Customer Service",
          "Green Cleaning",
          "HVAC Cleaning",
          "Post-Construction Cleaning",
          "Biohazard Cleaning",
        ],
      },
    ],
    certifications: [
      {
        type: String,
        enum: [
          "Kosovo Health & Safety",
          "First Aid & CPR",
          "Green Cleaning",
          "Biohazard Handling",
          "Equipment Operation",
          "Supervisor Training",
          "Chemical Safety",
          "Infection Control",
          "EU Safety Standards",
          "ISO Cleaning Standards",
        ],
      },
    ],

    // Work Information (Frontend Compatible)
    department: {
      type: String,
      required: true,
      enum: [
        "Residential Cleaning",
        "Commercial Cleaning",
        "Special Projects",
        "Maintenance",
        "Administration",
        "Healthcare",
      ],
    },
    employmentType: {
      type: String,
      required: true,
      enum: ["Full-time", "Part-time", "Contract", "Temporary", "Seasonal"],
    },
    availability: {
      type: String,
      required: true,
      enum: [
        "Weekdays Only",
        "Weekends Only",
        "All Days",
        "Morning Shift",
        "Afternoon Shift",
        "Evening Shift",
        "Night Shift",
        "Flexible",
      ],
    },

    // Working Days (Frontend Compatible)
    workingDays: [
      {
        day: {
          type: String,
          required: true,
        },
        from: {
          type: String,
          required: true,
        },
        to: {
          type: String,
          required: true,
        },
        duration: {
          type: Number,
          required: true,
        },
      },
    ],

    // Languages (Kosovo-specific)
    languages: [
      {
        type: String,
        enum: [
          "Albanian",
          "Serbian",
          "English",
          "German",
          "Italian",
          "French",
          "Turkish",
          "Bosnian",
          "Croatian",
          "Macedonian",
          "Other",
        ],
      },
    ],

    // Payment Information (Kosovo banking)
    paymentInfo: {
      bankName: {
        type: String,
        required: true,
        enum: [
          "ProCredit Bank",
          "TEB Bank",
          "NLB Bank",
          "BKT Bank",
          "Raiffeisen Bank",
          "Other",
        ],
      },
      accountNumber: {
        type: String,
        required: true,
      },
      iban: {
        type: String,
        required: true,
        validate: {
          validator: function (v) {
            // Kosovo IBAN format: XK21 BANK CODE (4) + ACCOUNT NUMBER (10)
            return /^XK\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/.test(
              v.replace(/\s/g, "")
            );
          },
          message: "Invalid Kosovo IBAN format",
        },
      },
      accountType: {
        type: String,
        required: true,
        enum: ["Checking", "Savings"],
      },
    },

    // Health Insurance (mandatory in Kosovo)
    healthInsurance: {
      provider: {
        type: String,
        required: true,
        enum: [
          "Kosovo Health Insurance Fund",
          "Private Insurance",
          "EU Insurance",
          "Other",
        ],
      },
      policyNumber: {
        type: String,
        required: true,
      },
      validUntil: {
        type: Date,
        required: true,
      },
    },

    // Notes
    notes: {
      type: String,
      default: "",
    },

    // Legacy fields (keep for backward compatibility)
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
    },
    mobile: String,
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    dateOfBirth: Date,
    role: [String],
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },

    // Assignments
    assignments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Virtual for full name
employeeSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for full address (Kosovo format)
employeeSchema.virtual("fullAddress").get(function () {
  return `${this.address}, ${this.city}, ${this.municipality}`;
});

// Virtual to check if work permit is expiring soon (within 30 days)
employeeSchema.virtual("workPermitExpiringSoon").get(function () {
  if (this.workPermit && this.workPermit.expiryDate) {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return this.workPermit.expiryDate <= thirtyDaysFromNow;
  }
  return false;
});

// Ensure virtual fields are serialized
employeeSchema.set("toJSON", { virtuals: true });

// Indexes for efficient queries
employeeSchema.index({ email: 1 });
employeeSchema.index({ municipality: 1, city: 1 });
employeeSchema.index({ lastName: 1, firstName: 1 });
employeeSchema.index({ personalNumber: 1 }, { sparse: true });
employeeSchema.index({ "workPermit.expiryDate": 1 });
employeeSchema.index({ status: 1, position: 1 });

module.exports = mongoose.model("Employee", employeeSchema);
