const Schedule = require('../models/Schedule');
const Employee = require('../models/Employee');
const CustomerContract = require('../models/CustomerContract');

// Get all schedules
exports.getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find()
      .populate('object')
      .populate('employees.employee')
      .populate('customerContract')
      .sort({ scheduledDate: 1 });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single schedule
exports.getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate('object')
      .populate('employees.employee')
      .populate('customerContract');
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new schedule
exports.createSchedule = async (req, res) => {
  try {
    const schedule = new Schedule(req.body);
    const savedSchedule = await schedule.save();
    const populatedSchedule = await Schedule.findById(savedSchedule._id)
      .populate('object')
      .populate('employees.employee')
      .populate('customerContract');
    res.status(201).json(populatedSchedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a schedule
exports.updateSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    .populate('object')
    .populate('employees.employee')
    .populate('customerContract');
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.json(schedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a schedule
exports.deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update schedule date
exports.updateScheduleDate = async (req, res) => {
  try {
    const { scheduledDate } = req.body;
    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      { scheduledDate },
      { new: true }
    )
    .populate('object')
    .populate('employees.employee')
    .populate('customerContract');
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.json(schedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Assign employee to schedule
exports.assignEmployee = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const schedule = await Schedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if employee is already assigned
    const isAssigned = schedule.employees.some(e => e.employee.toString() === employeeId);
    if (isAssigned) {
      return res.status(400).json({ message: 'Employee is already assigned to this schedule' });
    }

    schedule.employees.push({ employee: employeeId });
    await schedule.save();

    const updatedSchedule = await Schedule.findById(req.params.id)
      .populate('object')
      .populate('employees.employee')
      .populate('customerContract');

    res.json(updatedSchedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Remove employee from schedule
exports.removeEmployee = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    schedule.employees = schedule.employees.filter(
      e => e.employee.toString() !== req.params.employeeId
    );
    await schedule.save();

    const updatedSchedule = await Schedule.findById(req.params.id)
      .populate('object')
      .populate('employees.employee')
      .populate('customerContract');

    res.json(updatedSchedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Assign contract to schedule
exports.assignContract = async (req, res) => {
  try {
    const { contractId } = req.body;
    const contract = await CustomerContract.findById(contractId);
    
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      { customerContract: contractId },
      { new: true }
    )
    .populate('object')
    .populate('employees.employee')
    .populate('customerContract');

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json(schedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 