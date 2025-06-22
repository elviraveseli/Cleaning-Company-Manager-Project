const Invoice = require('../models/Invoice');
const CustomerContract = require('../models/CustomerContract');
const Customer = require('../models/Customer');
const Schedule = require('../models/Schedule');
const Object = require('../models/Object');

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

// Mark invoice as paid
exports.markAsPaid = async (req, res) => {
  try {
    const { paymentAmount, paymentMethod, paymentReference } = req.body;
    
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    await invoice.markAsPaid(paymentAmount, paymentMethod, paymentReference);
    
    // Return updated invoice with populated fields
    const updatedInvoice = await Invoice.findById(invoice._id)
      .populate('customerContract', 'contractNumber customer')
      .populate('customer.customerId', 'name email phone');

    res.json(updatedInvoice);
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    res.status(400).json({ message: 'Error marking invoice as paid', error: error.message });
  }
};

// Send invoice email
exports.sendInvoiceEmail = async (req, res) => {
  try {
    const { emailAddresses, subject, message } = req.body;
    
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerContract')
      .populate('customer.customerId');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Here you would integrate with your email service
    // For now, we'll just mark it as sent
    await invoice.sendEmail(emailAddresses);
    
    res.json({ message: 'Invoice email sent successfully', invoice });
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