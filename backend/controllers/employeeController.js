const Employee = require('../models/Employee');

// Get all employees (list)
exports.getEmployees = async (req, res) => {
  try {
    const { page, limit, search, status, position } = req.query;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (position) {
      query.position = position;
    }
    
    // If pagination parameters are provided, use pagination
    if (page && limit) {
      const employees = await Employee.find(query)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });
      
      const total = await Employee.countDocuments(query);
      
      res.json({
        employees,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } else {
      // Return all employees without pagination (for frontend compatibility)
      const employees = await Employee.find(query).sort({ createdAt: -1 });
      res.json(employees);
    }
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get single employee (details)
exports.getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new employee
exports.createEmployee = async (req, res) => {
  try {
    console.log('📥 Received employee data:', req.body);
    
    const employee = new Employee(req.body);
    const newEmployee = await employee.save();
    
    console.log('✅ Employee created successfully:', newEmployee.firstName, newEmployee.lastName, 'ID:', newEmployee._id);
    res.status(201).json(newEmployee);
  } catch (error) {
    console.error('❌ Error creating employee:', error);
    console.error('🔍 Validation errors:', error.errors);
    res.status(400).json({ 
      message: error.message,
      errors: error.errors
    });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    console.log('🔄 Updating employee ID:', req.params.id);
    console.log('📥 Update data:', req.body);
    
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!employee) {
      console.log('❌ Employee not found:', req.params.id);
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    console.log('✅ Employee updated successfully:', employee.firstName, employee.lastName);
    res.json(employee);
  } catch (error) {
    console.error('❌ Error updating employee:', error);
    console.error('🔍 Validation errors:', error.errors);
    res.status(400).json({ 
      message: error.message,
      errors: error.errors
    });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get employee statistics
exports.getEmployeeStats = async (req, res) => {
  try {
    const stats = await Employee.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const positionStats = await Employee.aggregate([
      {
        $group: {
          _id: '$position',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      statusStats: stats,
      positionStats: positionStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 