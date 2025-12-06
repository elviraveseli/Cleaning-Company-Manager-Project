const Schedule = require("../models/Schedule");
const Employee = require("../models/Employee");
const CustomerContract = require("../models/CustomerContract");
const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");
const Object = require("../models/Object");

// Get all schedulesjjj
exports.getSchedules = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [schedules, total] = await Promise.all([
      Schedule.find()
        .populate({
          path: "object",
          select: "name address description",
        })
        .populate({
          path: "employees.employee",
          select: "firstName lastName email phone position",
        })
        .populate({
          path: "customerContract",
          populate: {
            path: "customer",
            select: "name email phone",
          },
          select: "contractNumber customer objects services status totalAmount",
        })
        .sort({ scheduledDate: 1 })
        .skip(skip)
        .limit(limit),
      Schedule.countDocuments(),
    ]);

    res.json({
      schedules,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalSchedules: total,
    });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get a single schedule
exports.getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate("object")
      .populate({
        path: "employees.employee",
        select: "firstName lastName email phone position",
      })
      .populate("customerContract");
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
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
    const [hours, minutes] = timeStr.split(":").map(Number);
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

// Helper function to check if two time periods overlap
function timePeriodsOverlap(start1, end1, start2, end2) {
  // Convert time strings to minutes since midnight
  const getMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const start1Minutes = getMinutes(start1);
  const end1Minutes = getMinutes(end1);
  const start2Minutes = getMinutes(start2);
  const end2Minutes = getMinutes(end2);

  // Check if periods overlap
  return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
}

// Helper function to check for employee scheduling conflicts
async function checkEmployeeConflicts(
  employeeIds,
  scheduledDate,
  startTime,
  endTime,
  excludeScheduleId = null
) {
  try {
    // Get the start and end of the scheduled date
    const dateStart = new Date(scheduledDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(scheduledDate);
    dateEnd.setHours(23, 59, 59, 999);

    // Find all schedules for the given employees on the same date
    const query = {
      "employees.employee": { $in: employeeIds },
      scheduledDate: {
        $gte: dateStart,
        $lte: dateEnd,
      },
      status: { $nin: ["Cancelled", "No Show"] }, // Exclude cancelled schedules
    };

    // Exclude current schedule if updating
    if (excludeScheduleId) {
      query._id = { $ne: excludeScheduleId };
    }

    const existingSchedules = await Schedule.find(query)
      .populate("employees.employee", "firstName lastName")
      .populate("object", "name");

    const conflicts = [];

    for (const schedule of existingSchedules) {
      // Check if the time periods overlap
      if (
        timePeriodsOverlap(
          startTime,
          endTime,
          schedule.startTime,
          schedule.endTime
        )
      ) {
        // Find which specific employees have conflicts
        const conflictingEmployees = schedule.employees.filter((emp) =>
          employeeIds.some(
            (id) => id.toString() === emp.employee._id.toString()
          )
        );

        for (const emp of conflictingEmployees) {
          conflicts.push({
            employeeId: emp.employee._id,
            employeeName: `${emp.employee.firstName} ${emp.employee.lastName}`,
            conflictingSchedule: {
              id: schedule._id,
              objectName: schedule.object?.name || "Unknown Object",
              date: schedule.scheduledDate.toLocaleDateString(),
              time: `${schedule.startTime} - ${schedule.endTime}`,
            },
          });
        }
      }
    }

    return conflicts;
  } catch (error) {
    console.error("Error checking employee conflicts:", error);
    throw error;
  }
}

// Create a new schedule
exports.createSchedule = async (req, res) => {
  try {
    const scheduleData = { ...req.body };

    // Validate employee IDs format before processing
    if (scheduleData.employees && scheduleData.employees.length > 0) {
      for (let i = 0; i < scheduleData.employees.length; i++) {
        const emp = scheduleData.employees[i];
        const employeeId =
          typeof emp.employee === "string" ? emp.employee : emp.employee?._id;

        if (!employeeId || !/^[0-9a-fA-F]{24}$/.test(employeeId)) {
          return res.status(400).json({
            message: `Invalid employee ID format at position ${
              i + 1
            }. Please select a valid employee from the dropdown.`,
            invalidEmployeeId: employeeId,
          });
        }

        // Check if employee exists
        const employeeExists = await Employee.findById(employeeId);
        if (!employeeExists) {
          return res.status(400).json({
            message: `Employee with ID ${employeeId} not found. Please select a valid employee.`,
            invalidEmployeeId: employeeId,
          });
        }
      }
    }

    // Calculate estimated duration if start and end times are provided
    if (scheduleData.startTime && scheduleData.endTime) {
      scheduleData.estimatedDuration = calculateDuration(
        scheduleData.startTime,
        scheduleData.endTime
      );
    }

    // Check for employee scheduling conflicts
    if (
      scheduleData.employees &&
      scheduleData.employees.length > 0 &&
      scheduleData.scheduledDate &&
      scheduleData.startTime &&
      scheduleData.endTime
    ) {
      const employeeIds = scheduleData.employees.map((emp) =>
        typeof emp.employee === "string" ? emp.employee : emp.employee._id
      );

      const conflicts = await checkEmployeeConflicts(
        employeeIds,
        scheduleData.scheduledDate,
        scheduleData.startTime,
        scheduleData.endTime
      );

      if (conflicts.length > 0) {
        const conflictMessages = conflicts.map(
          (conflict) =>
            `${conflict.employeeName} is already scheduled at ${conflict.conflictingSchedule.objectName} on ${conflict.conflictingSchedule.date} from ${conflict.conflictingSchedule.time}`
        );

        return res.status(400).json({
          message: "Employee scheduling conflict detected",
          conflicts: conflictMessages,
        });
      }
    }

    const schedule = new Schedule(scheduleData);
    const savedSchedule = await schedule.save();
    const populatedSchedule = await Schedule.findById(savedSchedule._id)
      .populate("object")
      .populate({
        path: "employees.employee",
        select: "firstName lastName email phone position",
      })
      .populate("customerContract");
    res.status(201).json(populatedSchedule);
  } catch (error) {
    // Handle specific BSON/ObjectId errors
    if (
      error.name === "CastError" ||
      error.message.includes("Cast to ObjectId failed")
    ) {
      return res.status(400).json({
        message:
          "Invalid employee ID format. Please select valid employees from the dropdown and try again.",
        error: "INVALID_EMPLOYEE_ID",
      });
    }
    res.status(400).json({ message: error.message });
  }
};

// Update a schedule
exports.updateSchedule = async (req, res) => {
  try {
    const oldSchedule = await Schedule.findById(req.params.id);
    if (!oldSchedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    const updateData = { ...req.body };

    // Recalculate estimated duration if start or end time changed
    if (updateData.startTime && updateData.endTime) {
      updateData.estimatedDuration = calculateDuration(
        updateData.startTime,
        updateData.endTime
      );
    }

    // Check for employee scheduling conflicts when updating
    const employeesToCheck = updateData.employees || oldSchedule.employees;
    const dateToCheck = updateData.scheduledDate || oldSchedule.scheduledDate;
    const startTimeToCheck = updateData.startTime || oldSchedule.startTime;
    const endTimeToCheck = updateData.endTime || oldSchedule.endTime;

    if (
      employeesToCheck &&
      employeesToCheck.length > 0 &&
      dateToCheck &&
      startTimeToCheck &&
      endTimeToCheck
    ) {
      const employeeIds = employeesToCheck.map((emp) =>
        typeof emp.employee === "string"
          ? emp.employee
          : emp.employee._id || emp.employee
      );

      const conflicts = await checkEmployeeConflicts(
        employeeIds,
        dateToCheck,
        startTimeToCheck,
        endTimeToCheck,
        req.params.id // Exclude current schedule from conflict check
      );

      if (conflicts.length > 0) {
        const conflictMessages = conflicts.map(
          (conflict) =>
            `${conflict.employeeName} is already scheduled at ${conflict.conflictingSchedule.objectName} on ${conflict.conflictingSchedule.date} from ${conflict.conflictingSchedule.time}`
        );

        return res.status(400).json({
          message: "Employee scheduling conflict detected",
          conflicts: conflictMessages,
        });
      }
    }

    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate("object")
      .populate({
        path: "employees.employee",
        select: "firstName lastName email phone position",
      })
      .populate("customerContract");

    // Check if status changed to 'Completed' and create invoice
    if (
      oldSchedule.status !== "Completed" &&
      updateData.status === "Completed"
    ) {
      try {
        // If actual duration wasn't provided but status is complete, use estimated duration
        if (!updateData.actualDuration) {
          schedule.actualDuration = schedule.estimatedDuration;
          await schedule.save();
        }
        await createInvoiceForSchedule(schedule);
        console.log(
          `✅ Invoice created for completed schedule ${schedule._id}`
        );
      } catch (invoiceError) {
        console.error(
          `❌ Failed to create invoice for schedule ${schedule._id}:`,
          invoiceError
        );
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
      return res.status(404).json({ message: "Schedule not found" });
    }
    res.json({ message: "Schedule deleted successfully" });
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
      .populate("object")
      .populate({
        path: "employees.employee",
        select: "firstName lastName email phone position",
      })
      .populate("customerContract");

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
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
      return res.status(404).json({ message: "Schedule not found" });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if employee is already assigned
    const isAssigned = schedule.employees.some(
      (e) => e.employee.toString() === employeeId
    );
    if (isAssigned) {
      return res
        .status(400)
        .json({ message: "Employee is already assigned to this schedule" });
    }

    // Check for scheduling conflicts before assigning
    const conflicts = await checkEmployeeConflicts(
      [employeeId],
      schedule.scheduledDate,
      schedule.startTime,
      schedule.endTime,
      req.params.id
    );

    if (conflicts.length > 0) {
      const conflictMessages = conflicts.map(
        (conflict) =>
          `${conflict.employeeName} is already scheduled at ${conflict.conflictingSchedule.objectName} on ${conflict.conflictingSchedule.date} from ${conflict.conflictingSchedule.time}`
      );

      return res.status(400).json({
        message: "Employee scheduling conflict detected",
        conflicts: conflictMessages,
      });
    }

    schedule.employees.push({ employee: employeeId });
    await schedule.save();

    const updatedSchedule = await Schedule.findById(req.params.id)
      .populate("object")
      .populate({
        path: "employees.employee",
        select: "firstName lastName email phone position",
      })
      .populate("customerContract");

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
      return res.status(404).json({ message: "Schedule not found" });
    }

    schedule.employees = schedule.employees.filter(
      (e) => e.employee.toString() !== req.params.employeeId
    );
    await schedule.save();

    const updatedSchedule = await Schedule.findById(req.params.id)
      .populate("object")
      .populate("employees.employee")
      .populate("customerContract");

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
      return res.status(404).json({ message: "Contract not found" });
    }

    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      { customerContract: contractId },
      { new: true }
    )
      .populate("object")
      .populate("employees.employee")
      .populate("customerContract");

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
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
      const contract = await CustomerContract.findById(
        schedule.customerContract
      ).populate("customer");
      customer = contract?.customer;
    }

    if (!customer) {
      throw new Error("No customer found for this schedule");
    }

    // Get object information
    const objectInfo = await Object.findById(schedule.object);
    if (!objectInfo) {
      throw new Error("No object found for this schedule");
    }

    // Generate invoice number
    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(
      invoiceCount + 1
    ).padStart(4, "0")}`;

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
        address: customer.address,
      },
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      services: [
        {
          description: `${schedule.cleaningType || "Cleaning"} service at ${
            objectInfo.name
          }`,
          quantity: duration,
          unitPrice: hourlyRate,
          total: serviceTotal,
          relatedObject: schedule.object,
          relatedSchedule: schedule._id,
        },
      ],
      subtotal: serviceTotal,
      taxRate: 18, // Kosovo VAT rate
      taxAmount: serviceTotal * 0.18,
      totalAmount: serviceTotal * 1.18,
      balance: serviceTotal * 1.18,
      status: "Sent",
    });

    await invoice.save();
    console.log(
      `📄 Invoice ${invoiceNumber} created for schedule ${schedule._id}`
    );
    return invoice;
  } catch (error) {
    console.error("Error creating invoice for schedule:", error);
    throw error;
  }
}

// Create invoice manually for a schedule
exports.createInvoiceForSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id)
      .populate("object")
      .populate("employees.employee")
      .populate("customerContract");

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    const invoice = await createInvoiceForSchedule(schedule);
    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
