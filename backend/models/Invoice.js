const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customerContract: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerContract",
      required: false,
    },
    relatedSchedules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Schedule",
      },
    ],
    relatedObjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Object",
      },
    ],
    customer: {
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: false,
      },
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      phone: String,
      // Kosovo business identification
      nipt: {
        type: String,
        validate: {
          validator: function (v) {
            if (!v) return true; // Optional for residential customers
            return /^\d{9}$/.test(v);
          },
          message: "NIPT must be 9 digits",
        },
      },
      address: {
        street: String,
        city: String,
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
        country: {
          type: String,
          default: "Kosovo",
        },
      },
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    services: [
      {
        description: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 0,
        },
        unitPrice: {
          type: Number,
          required: true,
          min: 0,
        },
        total: {
          type: Number,
          required: true,
          min: 0,
        },
        relatedObject: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Object",
        },
        relatedSchedule: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Schedule",
        },
      },
    ],
    // Currency is always Euro in Kosovo
    currency: {
      type: String,
      default: "EUR",
      enum: ["EUR"],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    // Kosovo VAT rates
    taxRate: {
      type: Number,
      default: 18, // Standard Kosovo VAT rate is 18%
      min: 0,
      max: 100,
      enum: [0, 8, 18], // 0% (exempt), 8% (reduced rate), 18% (standard rate)
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Draft", "Sent", "Paid", "Overdue", "Cancelled", "Partially Paid"],
      default: "Draft",
    },
    // Kosovo payment methods
    paymentMethod: {
      type: String,
      enum: [
        "Cash",
        "Bank Transfer",
        "ProCredit Bank",
        "TEB Bank",
        "NLB Bank",
        "BKT Bank",
        "Raiffeisen Bank",
        "Online Payment",
      ],
    },
    paymentDate: Date,
    paymentToken: {
      type: String,
      unique: true,
      sparse: true
    },
    paymentTokenExpires: {
      type: Date
    },
    paymentReference: String,
    // Kosovo bank transfer details
    bankTransferDetails: {
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
      accountNumber: String,
      iban: {
        type: String,
        validate: {
          validator: function (v) {
            if (!v) return true;
            // Kosovo IBAN format: XK21 BANK CODE (4) + ACCOUNT NUMBER (10)
            return /^XK\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/.test(
              v.replace(/\s/g, "")
            );
          },
          message: "Invalid Kosovo IBAN format",
        },
      },
      reference: String,
    },
    notes: String,
    terms: {
      type: String,
      default: "Payment due within 30 days",
    },
    attachments: [
      {
        fileName: String,
        originalName: String,
        filePath: String,
        fileSize: Number,
        mimeType: String,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentDate: Date,
    emailSentTo: [String],
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringFrequency: {
      type: String,
      enum: ["Weekly", "Monthly", "Quarterly", "Yearly"],
    },
    nextInvoiceDate: Date,
    parentInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
    },
    // Kosovo specific tax compliance
    taxCompliance: {
      vatRegistered: {
        type: Boolean,
        default: false,
      },
      vatNumber: {
        type: String,
        validate: {
          validator: function (v) {
            if (!this.taxCompliance?.vatRegistered) return true;
            if (!v) return false;
            return /^\d{9}$/.test(v); // VAT number same as NIPT in Kosovo
          },
          message:
            "VAT number required for VAT registered businesses and must be 9 digits",
        },
      },
      fiscalVerificationCode: String, // For integration with Kosovo fiscal system
    },
  },
  {
    timestamps: true,
  }
);

invoiceSchema.virtual("remainingBalance").get(function () {
  return this.totalAmount - this.paidAmount;
});

invoiceSchema.virtual("isOverdue").get(function () {
  return (
    this.status !== "Paid" &&
    this.status !== "Cancelled" &&
    new Date() > this.dueDate
  );
});

invoiceSchema.virtual("daysOverdue").get(function () {
  if (this.isOverdue) {
    const today = new Date();
    const diffTime = today - this.dueDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for formatted amount in Euro
invoiceSchema.virtual("formattedAmount").get(function () {
  return `€${this.totalAmount.toFixed(2)}`;
});

invoiceSchema.set("toJSON", { virtuals: true });

invoiceSchema.pre("save", function (next) {
  this.balance = this.totalAmount - this.paidAmount;

  if (this.paidAmount >= this.totalAmount) {
    this.status = "Paid";
  } else if (this.paidAmount > 0) {
    this.status = "Partially Paid";
  } else if (this.status === "Paid" && this.paidAmount === 0) {
    this.status = "Sent";
  }

  // Set overdue status
  if (
    this.status !== "Paid" &&
    this.status !== "Cancelled" &&
    new Date() > this.dueDate
  ) {
    this.status = "Overdue";
  }

  next();
});

// Indexes for efficient queries
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ "customer.customerId": 1 });
invoiceSchema.index({ "customer.nipt": 1 }, { sparse: true });
invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ issueDate: 1 });
invoiceSchema.index({ "customer.address.municipality": 1 });

invoiceSchema.statics.generateInvoiceNumber = async function () {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;

  const latestInvoice = await this.findOne({
    invoiceNumber: { $regex: `^${prefix}` },
  }).sort({ invoiceNumber: -1 });

  let nextNumber = 1;
  if (latestInvoice) {
    const currentNumber = parseInt(latestInvoice.invoiceNumber.split("-")[2]);
    nextNumber = currentNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
};

invoiceSchema.methods.markAsPaid = function (
  paymentAmount,
  paymentMethod,
  paymentReference
) {
  this.paidAmount += paymentAmount;
  this.paymentMethod = paymentMethod;
  this.paymentReference = paymentReference;
  this.paymentDate = new Date();

  if (this.paidAmount >= this.totalAmount) {
    this.status = "Paid";
  } else {
    this.status = "Partially Paid";
  }

  return this.save();
};

invoiceSchema.methods.sendEmail = function (emailAddresses) {
  this.emailSent = true;
  this.emailSentDate = new Date();
  this.emailSentTo = emailAddresses;
  return this.save();
};

module.exports = mongoose.model("Invoice", invoiceSchema);
