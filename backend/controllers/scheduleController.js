const Schedule = require('../models/Schedule');
const Employee = require('../models/Employee');
const CustomerContract = require('../models/CustomerContract');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Object = require('../models/Object');

// Get all schedules
exports.getSchedules = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [schedules, total] = await Promise.all([
      Schedule.find()
      .populate({
        path: 'object',
        select: 'name address description'
      })
      .populate({
        path: 'employees.employee',
        select: 'firstName lastName email phone position'
      })
      .populate({
        path: 'customerContract',
        populate: {
          path: 'customer',
          select: 'name email phone'
        },
        select: 'contractNumber customer objects services status totalAmount'
      })
        .sort({ scheduledDate: 1 })
        .skip(skip)
        .limit(limit),
      Schedule.countDocuments()
    ]);

    res.json({
      schedules,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalSchedules: total
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get a single schedule
exports.getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate('object')
      .populate({
        path: 'employees.employee',
        select: 'firstName lastName email phone position'
      })
      .populate('customerContract');
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to calculate duration between two times
function calculateDuration(startTime, endTime) {
  // Convert time strings to minutes since midnight
  const getMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  let startMinutes = getMinutes(startTime);
  let endMinutes = getMinutes(endTime);

  // Handle case where end time is on the next day
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60; // Add 24 hours worth of minutes
  }

  // Calculate duration in hours, rounded to nearest 0.5
  const durationHours = Math.round((endMinutes - startMinutes) / 30) / 2;
  return durationHours;
}

// Create a new schedule
exports.createSchedule = async (req, res) => {
  try {
    const scheduleData = { ...req.body };
    
    // Calculate estimated duration if start and end times are provided
    if (scheduleData.startTime && scheduleData.endTime) {
      scheduleData.estimatedDuration = calculateDuration(scheduleData.startTime, scheduleData.endTime);
    }

    const schedule = new Schedule(scheduleData);
    const savedSchedule = await schedule.save();
    const populatedSchedule = await Schedule.findById(savedSchedule._id)
      .populate('object')
      .populate({
        path: 'employees.employee',
        select: 'firstName lastName email phone position'
      })
      .populate('customerContract');
    res.status(201).json(populatedSchedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a schedule
exports.updateSchedule = async (req, res) => {
  try {
    const oldSchedule = await Schedule.findById(req.params.id);
    if (!oldSchedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const updateData = { ...req.body };
    
    // Recalculate estimated duration if start or end time changed
    if (updateData.startTime && updateData.endTime) {
      updateData.estimatedDuration = calculateDuration(updateData.startTime, updateData.endTime);
    }

    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
    .populate('object')
    .populate({
      path: 'employees.employee',
      select: 'firstName lastName email phone position'
    })
    .populate('customerContract');
    
    // Check if status changed to 'Completed' and create invoice
    if (oldSchedule.status !== 'Completed' && updateData.status === 'Completed') {
      try {
        // If actual duration wasn't provided but status is complete, use estimated duration
        if (!updateData.actualDuration) {
          schedule.actualDuration = schedule.estimatedDuration;
          await schedule.save();
        }
        await createInvoiceForSchedule(schedule);
        console.log(`✅ Invoice created for completed schedule ${schedule._id}`);
      } catch (invoiceError) {
        console.error(`❌ Failed to create invoice for schedule ${schedule._id}:`, invoiceError);
        // Don't fail the schedule update if invoice creation fails
      }
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
    .populate({
      path: 'employees.employee',
      select: 'firstName lastName email phone position'
    })
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
      .populate({
        path: 'employees.employee',
        select: 'firstName lastName email phone position'
      })
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

// Helper function to create invoice for completed schedule
async function createInvoiceForSchedule(schedule) {
  try {
    // Get customer information
    let customer = null;
    if (schedule.customerContract) {
      const contract = await CustomerContract.findById(schedule.customerContract).populate('customer');
      customer = contract?.customer;
    }

    if (!customer) {
      throw new Error('No customer found for this schedule');
    }

    // Get object information
    const objectInfo = await Object.findById(schedule.object);
    if (!objectInfo) {
      throw new Error('No object found for this schedule');
    }

    // Generate invoice number
    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;

    // Calculate service details
    const duration = schedule.actualDuration || schedule.estimatedDuration || 2;
    const hourlyRate = 46; // Default rate in EUR (you can make this configurable)
    const serviceTotal = duration * hourlyRate;

    // Create invoice
    const invoice = new Invoice({
      invoiceNumber,
      customerContract: schedule.customerContract,
      relatedSchedules: [schedule._id],
      relatedObjects: [schedule.object],
      customer: {
        customerId: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        nipt: customer.nipt,
        address: customer.address
      },
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      services: [{
        description: `${schedule.cleaningType || 'Cleaning'} service at ${objectInfo.name}`,
        quantity: duration,
        unitPrice: hourlyRate,
        total: serviceTotal,
        relatedObject: schedule.object,
        relatedSchedule: schedule._id
      }],
      subtotal: serviceTotal,
      taxRate: 18, // Kosovo VAT rate
      taxAmount: serviceTotal * 0.18,
      totalAmount: serviceTotal * 1.18,
      balance: serviceTotal * 1.18,
      status: 'Sent'
    });

    await invoice.save();
    console.log(`📄 Invoice ${invoiceNumber} created for schedule ${schedule._id}`);
    return invoice;
  } catch (error) {
    console.error('Error creating invoice for schedule:', error);
    throw error;
  }
}

// Create invoice manually for a schedule
exports.createInvoiceForSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate('object')
      .populate('employees.employee')
      .populate('customerContract');
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    const invoice = await createInvoiceForSchedule(schedule);
    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 