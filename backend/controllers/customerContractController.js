const CustomerContract = require('../models/CustomerContract');
const emailService = require('../services/emailService');
const mongoose = require('mongoose');

// Get all customer contracts (list)
exports.getCustomerContracts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, contractType } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { contractNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (contractType) {
      query.contractType = contractType;
    }
    
    const contracts = await CustomerContract.find(query)
      .populate('objects', 'name address')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await CustomerContract.countDocuments(query);
    
    res.json({
      contracts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching customer contracts:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single customer contract (details)
exports.getCustomerContract = async (req, res) => {
  try {
    const contractId = req.params.id;
    
    // Validate ObjectId format
    if (!contractId || contractId === 'undefined' || !mongoose.Types.ObjectId.isValid(contractId)) {
      return res.status(400).json({ message: 'Invalid contract ID format' });
    }
    
    const contract = await CustomerContract.findById(contractId)
      .populate('objects', 'name address type contactPerson');
    if (!contract) {
      return res.status(404).json({ message: 'Customer contract not found' });
    }
    res.json(contract);
  } catch (error) {
    console.error('Error fetching customer contract:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create new customer contract
exports.createCustomerContract = async (req, res) => {
  try {
    const contract = new CustomerContract(req.body);
    const newContract = await contract.save();
    const populatedContract = await CustomerContract.findById(newContract._id)
      .populate('objects', 'name address');
    res.status(201).json(populatedContract);
  } catch (error) {
    console.error('Error creating customer contract:', error);
    res.status(400).json({ message: error.message });
  }
};

// Update customer contract
exports.updateCustomerContract = async (req, res) => {
  try {
    const contractId = req.params.id;
    
    // Validate ObjectId format
    if (!contractId || contractId === 'undefined' || !mongoose.Types.ObjectId.isValid(contractId)) {
      return res.status(400).json({ message: 'Invalid contract ID format' });
    }
    
    const contract = await CustomerContract.findByIdAndUpdate(
      contractId,
      req.body,
      { new: true, runValidators: true }
    ).populate('objects', 'name address');
    
    if (!contract) {
      return res.status(404).json({ message: 'Customer contract not found' });
    }
    res.json(contract);
  } catch (error) {
    console.error('Error updating customer contract:', error);
    res.status(400).json({ message: error.message });
  }
};

// Delete customer contract
exports.deleteCustomerContract = async (req, res) => {
  try {
    const contractId = req.params.id;
    
    // Validate ObjectId format
    if (!contractId || contractId === 'undefined' || !mongoose.Types.ObjectId.isValid(contractId)) {
      return res.status(400).json({ message: 'Invalid contract ID format' });
    }
    
    const contract = await CustomerContract.findByIdAndDelete(contractId);
    if (!contract) {
      return res.status(404).json({ message: 'Customer contract not found' });
    }
    res.json({ message: 'Customer contract deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer contract:', error);
    res.status(500).json({ message: error.message });
  }
};

// Send contract signature email
exports.sendContractEmail = async (req, res) => {
  try {
    const contract = await CustomerContract.findById(req.params.id)
      .populate('objects', 'name address type');
    
    if (!contract) {
      return res.status(404).json({ message: 'Customer contract not found' });
    }

    // Validate customer email
    if (!contract.customer || !contract.customer.email) {
      return res.status(400).json({ message: 'Customer email is not available' });
    }

    // Send the email
    const result = await emailService.sendContractSignatureEmail(contract);
    
    res.json({
      success: true,
      message: `Contract signature email sent successfully to ${contract.customer.email}`,
      emailInfo: {
        to: result.to,
        subject: result.subject,
        messageId: result.messageId,
        contractNumber: contract.contractNumber
      }
    });

  } catch (error) {
    console.error('Error sending contract email:', error);
    
    // If it's an email authentication error, provide a demo response
    if (error.code === 'EAUTH' || error.message.includes('Invalid login')) {
      const contract = await CustomerContract.findById(req.params.id);
      if (contract) {
        const htmlContent = emailService.generateContractEmailHTML(contract);
        
        return res.json({
          success: true,
          demo: true,
          message: `Email preview generated for ${contract.customer.email} (Demo Mode - No email configured)`,
          emailInfo: {
            to: contract.customer.email,
            subject: `Contract Signature Required - ${contract.contractNumber}`,
            contractNumber: contract.contractNumber,
            htmlContent: htmlContent
          }
        });
      }
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to send contract email',
      error: error.message 
    });
  }
};

// Test email configuration
exports.testEmailConfig = async (req, res) => {
  try {
    const result = await emailService.testEmailConfiguration();
    res.json(result);
  } catch (error) {
    console.error('Error testing email config:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Email configuration test failed',
      error: error.message 
    });
  }
}; 