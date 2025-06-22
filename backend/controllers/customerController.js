const Customer = require('../models/Customer');
const mongoose = require('mongoose');

// Get all customers (list)
exports.getCustomers = async (req, res) => {
  try {
    const { page, limit, search, status, customerType } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (customerType) {
      query.customerType = customerType;
    }
    
    // If pagination parameters are provided, use pagination
    if (page && limit) {
      const customers = await Customer.find(query)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ lastName: 1, firstName: 1 });
      
      const total = await Customer.countDocuments(query);
      
      res.json({
        customers,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } else {
      // Return all customers without pagination (for frontend compatibility)
      const customers = await Customer.find(query)
        .sort({ lastName: 1, firstName: 1 });
      res.json(customers);
    }
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single customer (details)
exports.getCustomer = async (req, res) => {
  try {
    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid customer ID format' });
    }
    
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create new customer
exports.createCustomer = async (req, res) => {
  try {
    console.log('📥 Received customer data:', req.body);
    
    const customer = new Customer(req.body);
    const newCustomer = await customer.save();
    
    console.log('✅ Customer created successfully:', newCustomer.fullName, 'ID:', newCustomer._id);
    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('❌ Error creating customer:', error);
    console.error('🔍 Validation errors:', error.errors);
    res.status(400).json({ 
      message: error.message,
      errors: error.errors
    });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    console.log('🔄 Updating customer ID:', req.params.id);
    console.log('📥 Update data:', req.body);
    
    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid customer ID format' });
    }
    
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      console.log('❌ Customer not found:', req.params.id);
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    console.log('✅ Customer updated successfully:', customer.fullName);
    res.json(customer);
  } catch (error) {
    console.error('❌ Error updating customer:', error);
    console.error('🔍 Validation errors:', error.errors);
    res.status(400).json({ 
      message: error.message,
      errors: error.errors
    });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    console.log('🗑️ Deleting customer ID:', req.params.id);
    
    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid customer ID format' });
    }
    
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      console.log('❌ Customer not found:', req.params.id);
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    console.log('✅ Customer deleted successfully:', customer.fullName);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting customer:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get customers by type
exports.getCustomersByType = async (req, res) => {
  try {
    const { customerType } = req.params;
    const customers = await Customer.find({ customerType })
      .sort({ lastName: 1, firstName: 1 });
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers by type:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get customers by status
exports.getCustomersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const customers = await Customer.find({ status })
      .sort({ lastName: 1, firstName: 1 });
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers by status:', error);
    res.status(500).json({ message: error.message });
  }
}; 