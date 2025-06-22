const mongoose = require("mongoose");

const objectSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "Office",
        "Residential",
        "Commercial",
        "Industrial",
        "Healthcare",
        "Educational",
        "Government",
        "NGO",
        "Other",
      ],
    },
    address: {
      street: {
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
      country: {
        type: String,
        default: "Kosovo",
      },
    },
    contactPerson: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      email: String,
    },
    size: {
      area: Number, // in square meters (Kosovo uses metric system)
      unit: {
        type: String,
        enum: ["sqm"], // Kosovo uses metric system
        default: "sqm",
      },
    },
    floors: {
      type: Number,
      default: 1,
    },
    rooms: {
      type: Number,
      default: 1,
    },
    specialRequirements: [
      {
        type: String,
        enum: [
          "Eco-friendly Products",
          "24/7 Access",
          "Security Clearance",
          "Special Equipment",
          "Hazardous Materials",
          "EU Standards Compliance",
        ],
      },
    ],
    cleaningFrequency: {
      type: String,
      enum: ["Daily", "Weekly", "Bi-weekly", "Monthly", "As Needed"],
      required: true,
    },
    estimatedCleaningTime: {
      type: Number, // in hours
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Under Maintenance"],
      default: "Active",
    },
    notes: String,
    photos: [
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

// Virtual for full address (Kosovo format)
objectSchema.virtual("fullAddress").get(function () {
  return `${this.address.street}, ${this.address.city}, ${this.address.municipality}`;
});

// Ensure virtual fields are serialized
objectSchema.set("toJSON", { virtuals: true });

// Updated indexes for Kosovo system
objectSchema.index({ "address.city": 1, "address.municipality": 1, status: 1 });
objectSchema.index({ type: 1, status: 1 });
objectSchema.index({ "address.municipality": 1 });

module.exports = mongoose.model("Object", objectSchema);
