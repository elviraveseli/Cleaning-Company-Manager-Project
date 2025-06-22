const EmployeeContract = require('../models/EmployeeContract');
const Employee = require('../models/Employee');
const mongoose = require('mongoose');

// Get all employee contracts (list)
exports.getEmployeeContracts = async (req, res) => {
  try {
    const { page, limit, search, status, contractType } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { contractNumber: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (contractType) {
      query.contractType = contractType;
    }
    
    // If pagination parameters are provided, use pagination
    if (page && limit) {
      const contracts = await EmployeeContract.find(query)
        .populate('employee', 'firstName lastName email phone')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });
      
      const total = await EmployeeContract.countDocuments(query);
      
      res.json({
        contracts,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } else {
      // Return all contracts without pagination (for frontend compatibility)
      const contracts = await EmployeeContract.find(query)
        .populate('employee', 'firstName lastName email phone')
        .sort({ createdAt: -1 });
      res.json(contracts);
    }
  } catch (error) {
    console.error('Error fetching employee contracts:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single employee contract (details)
exports.getEmployeeContract = async (req, res) => {
  try {
    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid contract ID format' });
    }
    
    const contract = await EmployeeContract.findById(req.params.id)
      .populate('employee', 'firstName lastName email phone address');
    if (!contract) {
      return res.status(404).json({ message: 'Employee contract not found' });
    }
    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new employee contract
exports.createEmployeeContract = async (req, res) => {
  try {
    console.log('📥 Received employee contract data:', req.body);
    
    // If employeeId is provided but employee ObjectId is not, find the employee
    if (req.body.employeeId && !req.body.employee) {
      const employee = await Employee.findById(req.body.employeeId);
      if (!employee) {
        return res.status(400).json({ message: 'Employee not found with the provided employeeId' });
      }
      req.body.employee = employee._id;
    }
    
    // Generate contract number if not provided
    if (!req.body.contractNumber) {
      const contractCount = await EmployeeContract.countDocuments();
      req.body.contractNumber = `EMP-${new Date().getFullYear()}-${String(contractCount + 1).padStart(3, '0')}`;
    }
    
    const contract = new EmployeeContract(req.body);
    const newContract = await contract.save();
    const populatedContract = await EmployeeContract.findById(newContract._id)
      .populate('employee', 'firstName lastName email phone');
    
    console.log('✅ Employee contract created successfully for employee:', req.body.employeeId, 'ID:', newContract._id);
    res.status(201).json(populatedContract);
  } catch (error) {
    console.error('❌ Error creating employee contract:', error);
    console.error('🔍 Validation errors:', error.errors);
    res.status(400).json({ 
      message: error.message,
      errors: error.errors
    });
  }
};

// Update employee contract
exports.updateEmployeeContract = async (req, res) => {
  try {
    console.log('🔄 Updating employee contract ID:', req.params.id);
    console.log('📥 Update data:', req.body);
    
    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid contract ID format' });
    }
    
    // If employeeId is provided but employee ObjectId is not, find the employee
    if (req.body.employeeId && !req.body.employee) {
      const employee = await Employee.findById(req.body.employeeId);
      if (!employee) {
        return res.status(400).json({ message: 'Employee not found with the provided employeeId' });
      }
      req.body.employee = employee._id;
    }
    
    const contract = await EmployeeContract.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('employee', 'firstName lastName email phone');
    
    if (!contract) {
      console.log('❌ Employee contract not found:', req.params.id);
      return res.status(404).json({ message: 'Employee contract not found' });
    }
    
    console.log('✅ Employee contract updated successfully for employee:', contract.employeeId);
    res.json(contract);
  } catch (error) {
    console.error('❌ Error updating employee contract:', error);
    console.error('🔍 Validation errors:', error.errors);
    res.status(400).json({ 
      message: error.message,
      errors: error.errors
    });
  }
};

// Delete employee contract
exports.deleteEmployeeContract = async (req, res) => {
  try {
    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid contract ID format' });
    }
    
    const contract = await EmployeeContract.findByIdAndDelete(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: 'Employee contract not found' });
    }
    res.json({ message: 'Employee contract deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get contracts by employee
exports.getContractsByEmployee = async (req, res) => {
  try {
    // Try to find by both employee ObjectId and employeeId string for compatibility
    const contracts = await EmployeeContract.find({
      $or: [
        { employee: req.params.employeeId },
        { employeeId: req.params.employeeId }
      ]
    })
      .populate('employee', 'firstName lastName email')
      .sort({ startDate: -1 });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 