const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
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
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
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
    company: {
      type: String,
      trim: true,
    },
    nipt: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          if (!v && this.customerType === "Residential") return true;
          if (!v && this.customerType === "Commercial") return false;
          return /^\d{9}$/.test(v);
        },
        message: "NIPT must be 9 digits for business customers",
      },
    },
    customerType: {
      type: String,
      enum: [
        "Residential",
        "Individual Business",
        "General Partnership",
        "Limited Partnership",
        "Limited Liability Company",
        "Joint Stock Company",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Pending"],
      default: "Pending",
    },
    preferredContactMethod: {
      type: String,
      enum: ["Email", "Phone", "Text", "WhatsApp"],
      default: "Email",
    },
    notes: {
      type: String,
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    lastServiceDate: {
      type: Date,
    },
    totalContracts: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    emergencyContact: {
      name: {
        type: String,
      },
      relationship: {
        type: String,
      },
      phone: {
        type: String,
      },
    },
    billingAddress: {
      address: {
        type: String,
      },
      city: {
        type: String,
      },
      municipality: {
        type: String,
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
      sameAsService: {
        type: Boolean,
        default: true,
      },
    },
    paymentInfo: {
      preferredMethod: {
        type: String,
        enum: [
          "Bank Transfer",
          "Cash",
          "ProCredit Bank",
          "TEB Bank",
          "NLB Bank",
          "BKT Bank",
          "Raiffeisen Bank",
        ],
        default: "Bank Transfer",
      },
      billingCycle: {
        type: String,
        enum: ["Weekly", "Bi-weekly", "Monthly", "Quarterly"],
        default: "Monthly",
      },
      autoPayEnabled: {
        type: Boolean,
        default: false,
      },
      bankAccount: {
        bankName: {
          type: String,
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
        },
        iban: {
          type: String,
          validate: {
            validator: function (v) {
              if (!v) return true;
              return /^XK\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/.test(
                v.replace(/\s/g, "")
              );
            },
            message: "Invalid Kosovo IBAN format",
          },
        },
      },
    },

    referralSource: {
      type: String,
      enum: [
        "Google Search",
        "Facebook",
        "Instagram",
        "Referral from Friend",
        "Flyers/Advertisements",
        "Website",
        "Telegrafi",
        "Express",
        "Koha Ditore",
        "RTK",
        "Other",
      ],
    },
    tags: [
      {
        type: String,
        enum: [
          "VIP Customer",
          "High Value",
          "Frequent Service",
          "Special Requirements",
          "Pet Owner",
          "Key Access",
          "Elderly Client",
          "New Customer",
          "Seasonal Service",
          "Corporate Account",
          "Government Client",
          "NGO Client",
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

customerSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

customerSchema.virtual("fullAddress").get(function () {
  return `${this.address}, ${this.city}, ${this.municipality}`;
});

customerSchema.set("toJSON", { virtuals: true });

customerSchema.index({ email: 1 });
customerSchema.index({ customerType: 1, status: 1 });
customerSchema.index({ city: 1, municipality: 1 });
customerSchema.index({ lastName: 1, firstName: 1 });
customerSchema.index({ nipt: 1 }, { sparse: true });

module.exports = mongoose.model("Customer", customerSchema);
