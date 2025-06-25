const Invoice = require('../models/Invoice');
const CustomerContract = require('../models/CustomerContract');
const Customer = require('../models/Customer');
const Schedule = require('../models/Schedule');
const Object = require('../models/Object');
const emailService = require('../services/emailService');
const PDFDocument = require('pdfkit');

// Helper function to generate PDF buffer
const generateInvoicePDF = async (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];

      // Collect PDF data chunks
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // Add blue header background
      doc.rect(0, 0, doc.page.width, 150)
         .fill('#4285f4');  // Google blue color

      // Add invoice number in white
      doc.fillColor('white')
         .fontSize(24)
         .text(`Invoice #${invoice.invoiceNumber || 'N/A'}`, 50, 60, { align: 'center' });

      // Add due date in white
      doc.fontSize(14)
         .text(`Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}`, 50, 100, { align: 'center' });

      // Reset text color to black for rest of content
      doc.fillColor('black');

      // Add greeting and intro
      doc.moveDown(4);
      doc.fontSize(12);
      if (invoice.customer) {
        doc.text(`Dear ${invoice.customer.name || 'Valued Customer'},`, 50);
      }
      doc.moveDown();
      doc.text(`Please find your invoice from Professional Cleaning Services attached.`, 50);
      doc.moveDown(2);

      // Add Invoice Details section
      doc.fontSize(16)
         .text('Invoice Details', 50);
      doc.moveDown();

      // Add invoice information in a clean format
      doc.fontSize(12);
      doc.text(`Invoice Number: ${invoice.invoiceNumber || 'N/A'}`, 50);
      doc.text(`Issue Date: ${invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 'N/A'}`, 50);
      doc.text(`Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}`, 50);
      doc.text(`Total Amount: €${(invoice.totalAmount || 0).toFixed(2)}`, 50);
      doc.moveDown(2);

      // Add contract details if available
      if (invoice.customerContract) {
        doc.fontSize(16)
           .text('Contract Information', 50);
        doc.moveDown();
        doc.fontSize(12)
           .text(`Contract Number: ${invoice.customerContract.contractNumber || 'N/A'}`, 50);
        doc.moveDown(2);
      }

      // Add Services section
      doc.fontSize(16)
         .text('Services', 50);
      doc.moveDown();

      // Add services table
      if (invoice.services && invoice.services.length > 0) {
        // Table headers
        const tableTop = doc.y;
        doc.fontSize(12);
        doc.text('Description', 50, tableTop);
        doc.text('Quantity', 300, tableTop);
        doc.text('Unit Price', 400, tableTop);
        doc.text('Total', 500, tableTop);
        doc.moveDown();

        // Table content
        let yPos = doc.y;
        invoice.services.forEach(service => {
          doc.text(service.description || 'N/A', 50, yPos);
          doc.text(service.quantity?.toString() || 'N/A', 300, yPos);
          doc.text(`€${(service.unitPrice || 0).toFixed(2)}`, 400, yPos);
          doc.text(`€${(service.total || 0).toFixed(2)}`, 500, yPos);
          yPos += 20;
        });

        doc.moveDown(2);
      }

      // Add totals section
      doc.text('Subtotal:', 400);
      doc.text(`€${(invoice.subtotalAmount || 0).toFixed(2)}`, 500);
      
      doc.text(`VAT (${invoice.vatRate || 0}%):`, 400);
      doc.text(`€${(invoice.vatAmount || 0).toFixed(2)}`, 500);
      
      doc.fontSize(14)
         .text('Total Amount:', 400);
      doc.text(`€${(invoice.totalAmount || 0).toFixed(2)}`, 500);

      // Add payment status if paid
      if (invoice.paidAmount > 0) {
        doc.moveDown();
        doc.fontSize(12)
           .text('Paid Amount:', 400);
        doc.text(`€${(invoice.paidAmount || 0).toFixed(2)}`, 500);
        doc.text('Balance Due:', 400);
        doc.text(`€${((invoice.totalAmount || 0) - (invoice.paidAmount || 0)).toFixed(2)}`, 500);
      }

      // Add payment instructions
      doc.moveDown(2);
      doc.fontSize(16)
         .text('Payment Instructions', 50);
      doc.moveDown();
      doc.fontSize(12)
         .text('Please include invoice number with payment', 50);
      doc.text('Bank Transfer Details:', 50);
      doc.text('Bank: Your Bank Name', 50);
      doc.text('IBAN: YOUR-IBAN-NUMBER', 50);
      doc.text('BIC/SWIFT: YOUR-BIC', 50);

      // Add footer
      doc.fontSize(10);
      const bottomY = doc.page.height - 50;
      doc.text('Thank you for your business!', 50, bottomY, { align: 'center' });
      doc.text('Professional Cleaning Services', 50, bottomY + 15, { align: 'center' });

      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Get all invoices with populated references
exports.getInvoices = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.customer) {
      filter.$or = [
        { 'customer.name': { $regex: req.query.customer, $options: 'i' } },
        { 'customer.email': { $regex: req.query.customer, $options: 'i' } }
      ];
    }
    
    if (req.query.dateFrom || req.query.dateTo) {
      filter.issueDate = {};
      if (req.query.dateFrom) {
        filter.issueDate.$gte = new Date(req.query.dateFrom);
      }
      if (req.query.dateTo) {
        filter.issueDate.$lte = new Date(req.query.dateTo);
      }
    }
    
    if (req.query.amountMin || req.query.amountMax) {
      filter.totalAmount = {};
      if (req.query.amountMin) {
        filter.totalAmount.$gte = parseFloat(req.query.amountMin);
      }
      if (req.query.amountMax) {
        filter.totalAmount.$lte = parseFloat(req.query.amountMax);
      }
    }

    // Get invoices with populated references
    const invoices = await Invoice.find(filter)
      .populate({
        path: 'customerContract',
        select: 'contractNumber customer totalAmount',
        populate: {
          path: 'customer',
          select: 'name email phone'
        }
      })
      .populate({
        path: 'customer.customerId',
        select: 'name email phone address'
      })
      .populate({
        path: 'relatedSchedules',
        select: 'scheduledDate estimatedDuration status object',
        populate: {
          path: 'object',
          select: 'name address'
        }
      })
      .populate({
        path: 'relatedObjects',
        select: 'name address type'
      })
      .populate('createdBy lastModifiedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Invoice.countDocuments(filter);
    
    // Calculate statistics
    const stats = await Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' },
          totalOutstanding: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } },
          avgAmount: { $avg: '$totalAmount' },
          statusCounts: {
            $push: '$status'
          }
        }
      }
    ]);

    // Process status counts
    let statusBreakdown = {};
    if (stats.length > 0 && stats[0].statusCounts) {
      statusBreakdown = stats[0].statusCounts.reduce((acc, status) => {
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
    }

    res.json({
      invoices,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      },
      stats: stats.length > 0 ? {
        ...stats[0],
        statusBreakdown
      } : {
        totalAmount: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        avgAmount: 0,
        statusBreakdown: {}
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Error fetching invoices', error: error.message });
  }
};

// Get single invoice with all populated references
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate({
        path: 'customerContract',
        populate: [
          {
            path: 'customer',
            select: 'name email phone address'
          },
          {
            path: 'objects',
            select: 'name address type'
          }
        ]
      })
      .populate({
        path: 'customer.customerId',
        select: 'name email phone address'
      })
      .populate({
        path: 'relatedSchedules',
        populate: [
          {
            path: 'object',
            select: 'name address type'
          },
          {
            path: 'assignedEmployees',
            select: 'firstName lastName email'
          }
        ]
      })
      .populate({
        path: 'relatedObjects',
        select: 'name address type customer',
        populate: {
          path: 'customer',
          select: 'name email'
        }
      })
      .populate('createdBy lastModifiedBy', 'name email');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Error fetching invoice', error: error.message });
  }
};

// Create new invoice with foreign key relationships
exports.createInvoice = async (req, res) => {
  try {
    const invoiceData = req.body;
    
    console.log('Received invoice data:', invoiceData); // Debug log
    
    // Generate invoice number if not provided
    if (!invoiceData.invoiceNumber) {
      invoiceData.invoiceNumber = await Invoice.generateInvoiceNumber();
    }
    
    // Set audit fields
    if (req.user) {
      invoiceData.createdBy = req.user.id;
      invoiceData.lastModifiedBy = req.user.id;
    }

    // Only populate from contract if customer data is not already provided
    if (invoiceData.customerContract && (!invoiceData.customer || !invoiceData.customer.name)) {
      const contract = await CustomerContract.findById(invoiceData.customerContract)
        .populate('customer')
        .populate('objects');
      
      if (contract) {
        // Update customer information from contract only if not provided
        invoiceData.customer = {
          customerId: contract.customer._id,
          name: contract.customer.name,
          email: contract.customer.email,
          phone: contract.customer.phone,
          address: contract.customer.address
        };
        
        // Set related objects
        if (contract.objects && contract.objects.length > 0) {
          invoiceData.relatedObjects = contract.objects.map(obj => obj._id);
        }
        
        // Find related schedules
        const relatedSchedules = await Schedule.find({
          customerContract: contract._id
        });
        
        if (relatedSchedules.length > 0) {
          invoiceData.relatedSchedules = relatedSchedules.map(schedule => schedule._id);
        }

        // Calculate invoice amounts from contract based on contract type and billing frequency
        let baseAmount = contract.totalAmount;
        let numberOfOccurrences = 1;

        // For recurring contracts, calculate the total monthly amount
        if (contract.contractType === 'Recurring') {
          // Calculate occurrences based on billing frequency
          switch (contract.billingFrequency) {
            case 'Weekly':
              numberOfOccurrences = 4; // Assuming 4 weeks per month
              break;
            case 'Bi-weekly':
              numberOfOccurrences = 2; // 2 times per month
              break;
            case 'Monthly':
              numberOfOccurrences = 1; // Once per month
              break;
            case 'Quarterly':
              numberOfOccurrences = 1/3; // One third of the amount per month
              break;
            case 'Annually':
              numberOfOccurrences = 1/12; // One twelfth of the amount per month
              break;
            default:
              numberOfOccurrences = 1;
          }

          // Calculate the total base amount for the period
          baseAmount = contract.totalAmount * numberOfOccurrences;
        }

        if (contract.paymentCalculation) {
          // Get amounts from contract
          const {
            vatRate,
            totalAmountExcludingVAT,
            totalMonthlyContractValue
          } = contract.paymentCalculation;

          // Use monthly contract value if available, otherwise calculate from base amount
          const monthlyBaseAmount = totalMonthlyContractValue || baseAmount;
          
          // Set invoice amounts
          invoiceData.subtotal = monthlyBaseAmount;
          invoiceData.taxRate = vatRate || 18; // Default Kosovo VAT rate if not specified
          invoiceData.taxAmount = monthlyBaseAmount * (invoiceData.taxRate / 100);
          invoiceData.totalAmount = monthlyBaseAmount + invoiceData.taxAmount;
          
          // Add service details if available
          if (contract.services && contract.services.length > 0) {
            invoiceData.services = contract.services.map(service => {
              const serviceBasePrice = service.price * numberOfOccurrences;
              return {
                description: service.name,
                quantity: numberOfOccurrences,
                unitPrice: service.price,
                total: serviceBasePrice,
                vatAmount: serviceBasePrice * (invoiceData.taxRate / 100),
                totalWithVat: serviceBasePrice * (1 + (invoiceData.taxRate / 100))
              };
            });
          }
        } else {
          // Fallback calculations if paymentCalculation is not available
          invoiceData.subtotal = baseAmount;
          invoiceData.taxRate = 18; // Default Kosovo VAT rate
          invoiceData.taxAmount = baseAmount * 0.18;
          invoiceData.totalAmount = baseAmount * 1.18;
        }

        // Add billing period information
        const today = new Date();
        invoiceData.billingPeriod = {
          startDate: today,
          endDate: new Date(today.getFullYear(), today.getMonth() + 1, today.getDate() - 1)
        };
      }
    }

    // If customer ID is provided but customer data is incomplete, populate from database
    if (invoiceData.customer && invoiceData.customer.customerId && !invoiceData.customer.name) {
      const customer = await Customer.findById(invoiceData.customer.customerId);
      if (customer) {
        invoiceData.customer = {
          customerId: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address
        };
      }
    }

    console.log('Final invoice data before save:', invoiceData); // Debug log

    const invoice = new Invoice(invoiceData);
    await invoice.save();
    
    console.log('Saved invoice:', invoice); // Debug log
    
    // Populate the response
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customerContract', 'contractNumber customer')
      .populate('customer.customerId', 'name email phone')
      .populate('relatedSchedules', 'scheduledDate estimatedDuration')
      .populate('relatedObjects', 'name address')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedInvoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(400).json({ message: 'Error creating invoice', error: error.message });
  }
};

// Update invoice with foreign key relationships
exports.updateInvoice = async (req, res) => {
  try {
    const invoiceData = req.body;
    
    // Set audit fields
    if (req.user) {
      invoiceData.lastModifiedBy = req.user.id;
    }

    // Handle customer contract changes
    if (invoiceData.customerContract) {
      const contract = await CustomerContract.findById(invoiceData.customerContract)
        .populate('customer')
        .populate('objects');
      
      if (contract) {
        // Update customer information from contract
        invoiceData.customer = {
          customerId: contract.customer._id,
          name: contract.customer.name,
          email: contract.customer.email,
          phone: contract.customer.phone,
          address: contract.customer.address
        };
        
        // Update related objects
        if (contract.objects && contract.objects.length > 0) {
          invoiceData.relatedObjects = contract.objects.map(obj => obj._id);
        }
      }
    }

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      invoiceData,
      { new: true, runValidators: true }
    )
    .populate('customerContract', 'contractNumber customer')
    .populate('customer.customerId', 'name email phone')
    .populate('relatedSchedules', 'scheduledDate estimatedDuration')
    .populate('relatedObjects', 'name address')
    .populate('createdBy lastModifiedBy', 'name email');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(400).json({ message: 'Error updating invoice', error: error.message });
  }
};

// Delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: 'Error deleting invoice', error: error.message });
  }
};

// Generate invoice number
exports.generateInvoiceNumber = async (req, res) => {
  try {
    const invoiceNumber = await Invoice.generateInvoiceNumber();
    res.json({ invoiceNumber });
  } catch (error) {
    console.error('Error generating invoice number:', error);
    res.status(500).json({ message: 'Error generating invoice number', error: error.message });
  }
};

// Mark invoice as paid with token verification
exports.markAsPaid = async (req, res) => {
  try {
    const { token } = req.query;
    
    // Find invoice by ID and valid token
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      paymentToken: token,
      paymentTokenExpires: { $gt: new Date() }
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invalid or expired payment token' });
    }

    // Set the invoice as paid
    invoice.status = 'Paid';
    invoice.paidAmount = invoice.totalAmount;
    invoice.paymentDate = new Date();
    
    // Clear the payment token
    invoice.paymentToken = undefined;
    invoice.paymentTokenExpires = undefined;
    
    await invoice.save();

    // Return success page
    res.send(`
      <html>
        <head>
          <title>Payment Confirmed</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; text-align: center; padding: 40px; }
            .success { color: #059669; font-size: 24px; margin-bottom: 20px; }
            .details { color: #4b5563; margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="success">✓ Payment Confirmed</div>
          <div class="details">
            Invoice #${invoice.invoiceNumber} has been marked as paid.<br>
            Amount: €${invoice.totalAmount.toLocaleString()}
          </div>
          <p>You can close this window now.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    res.status(500).json({ message: 'Error marking invoice as paid', error: error.message });
  }
};

// Verify payment token
exports.verifyPaymentToken = async (req, res) => {
  try {
    const { token } = req.body;
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      paymentToken: token,
      paymentTokenExpires: { $gt: new Date() }
    }).populate('customer');

    if (!invoice) {
      return res.status(400).json({
        valid: false,
        message: 'Invalid or expired payment token'
      });
    }

    res.json({
      valid: true,
      invoice
    });
  } catch (error) {
    console.error('Error verifying payment token:', error);
    res.status(500).json({
      valid: false,
      message: 'Error verifying payment token'
    });
  }
};

// Send invoice email
exports.sendInvoiceEmail = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer')
      .populate('customerContract');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice);

    // Send email with PDF and payment link
    await emailService.sendInvoiceEmail(invoice, {
      to: invoice.customer.email,
      attachments: [{
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer
      }]
    });

    // Update invoice status to Sent
    invoice.status = 'Sent';
    await invoice.save();

    res.json({ message: 'Invoice email sent successfully' });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({ message: 'Error sending invoice email', error: error.message });
  }
};

// Get invoices by customer
exports.getInvoicesByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const invoices = await Invoice.find({
      $or: [
        { 'customer.customerId': customerId },
        { customerContract: { $in: await CustomerContract.find({ customer: customerId }).select('_id') } }
      ]
    })
    .populate('customerContract', 'contractNumber')
    .populate('relatedSchedules', 'scheduledDate')
    .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    res.status(500).json({ message: 'Error fetching customer invoices', error: error.message });
  }
};

// Get invoices by contract
exports.getInvoicesByContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    
    const invoices = await Invoice.find({ customerContract: contractId })
      .populate('customer.customerId', 'name email')
      .populate('relatedSchedules', 'scheduledDate estimatedDuration')
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (error) {
    console.error('Error fetching contract invoices:', error);
    res.status(500).json({ message: 'Error fetching contract invoices', error: error.message });
  }
};

// Get dashboard statistics
exports.getInvoiceStats = async (req, res) => {
  try {
    const stats = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' },
          totalOutstanding: { $sum: { $subtract: ['$totalAmount', '$paidAmount'] } },
          avgAmount: { $avg: '$totalAmount' }
        }
      }
    ]);

    const statusStats = await Invoice.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const monthlyStats = await Invoice.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$issueDate' },
            month: { $month: '$issueDate' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      overview: stats[0] || {
        totalInvoices: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        avgAmount: 0
      },
      statusBreakdown: statusStats,
      monthlyTrends: monthlyStats
    });
  } catch (error) {
    console.error('Error fetching invoice stats:', error);
    res.status(500).json({ message: 'Error fetching invoice stats', error: error.message });
  }
};

// Generate invoice PDF
exports.generateInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer')
      .populate('customerContract')
      .populate('relatedSchedules')
      .populate('relatedObjects');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const pdfBuffer = await generateInvoicePDF(invoice);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    res.status(500).json({ message: 'Error generating invoice PDF', error: error.message });
  }
}; 