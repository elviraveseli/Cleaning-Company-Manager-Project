const Employee = require('../models/Employee');
const CustomerContract = require('../models/CustomerContract');
const Object = require('../models/Object');
const Schedule = require('../models/Schedule');
const Invoice = require('../models/Invoice');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Get current date info
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // Parallel queries for better performance
    const [
      totalEmployees,
      activeEmployees,
      totalContracts,
      activeContracts,
      totalLocations,
      todaysSchedules,
      allSchedules,
      recentEmployees,
      recentContracts,
      completedSchedules,
      upcomingSchedules,
      totalInvoices,
      paidInvoices
    ] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: 'Active' }),
      CustomerContract.countDocuments(),
      CustomerContract.countDocuments({ status: 'Active' }),
      Object.countDocuments(),
      Schedule.countDocuments({
        scheduledDate: { $gte: todayStart, $lt: todayEnd }
      }),
      Schedule.countDocuments(),
      Employee.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .select('firstName lastName createdAt hireDate'),
      CustomerContract.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .select('contractNumber createdAt signedDate customer')
        .populate('customer', 'name'),
      Schedule.countDocuments({ status: 'Completed' }),
      Schedule.find({
        scheduledDate: { $gte: today },
        status: { $ne: 'Completed' }
      })
        .sort({ scheduledDate: 1 })
        .limit(5)
        .populate('object', 'name')
        .populate('employees.employee', 'firstName lastName'),
      Invoice.countDocuments(),
      Invoice.aggregate([
        { $match: { status: 'Paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    // Calculate performance metrics
    const completionRate = allSchedules > 0 ? Math.round((completedSchedules / allSchedules) * 100) : 0;
    const totalRevenue = paidInvoices.length > 0 ? paidInvoices[0].total : 0;
    
    // Calculate average rating (placeholder - would need customer feedback)
    const averageRating = Math.min(5, Math.max(1, (completionRate / 20) + 1));

    // Generate recent activities
    const recentActivities = [];

    // Add recent employees
    recentEmployees.forEach(employee => {
      if (employee) {
        const firstName = employee.firstName || '';
        const lastName = employee.lastName || '';
        const name = `${firstName} ${lastName}`.trim() || 'New employee';
      recentActivities.push({
        icon: 'person_add',
        type: 'success',
          title: `${name} added`,
        time: getTimeAgo(employee.createdAt || employee.hireDate)
      });
      }
    });

    // Add recent contracts
    recentContracts.forEach(contract => {
      if (contract) {
      const customerName = contract.customer?.name || 'Customer';
        const contractNumber = contract.contractNumber || 'New contract';
      recentActivities.push({
        icon: 'assignment',
        type: 'info',
          title: `${contractNumber} signed with ${customerName}`,
        time: getTimeAgo(contract.createdAt || contract.signedDate)
      });
      }
    });

    // Format upcoming tasks
    const upcomingTasks = upcomingSchedules.map(schedule => {
      const employeeNames = schedule.employees
        .filter(emp => emp && emp.employee) // Filter out null employees
        .map(emp => {
          const firstName = emp.employee.firstName || '';
          const lastName = emp.employee.lastName || '';
          return `${firstName} ${lastName}`.trim() || 'Unknown';
        })
        .join(', ');
      
      return {
        title: `${schedule.cleaningType || 'Cleaning Service'}`,
        time: schedule.startTime || '09:00',
        date: formatDate(schedule.scheduledDate),
        location: schedule.object?.name || 'Location TBD',
        employees: employeeNames || 'Unassigned',
        status: mapScheduleStatus(schedule.status),
        statusIcon: getStatusIcon(mapScheduleStatus(schedule.status))
      };
    });

    // Return dashboard data
    res.json({
      totalEmployees,
      activeEmployees,
      totalContracts,
      activeContracts,
      totalLocations,
      todaysTasks: todaysSchedules,
      recentActivities: recentActivities.slice(0, 5),
      upcomingTasks,
      performance: {
        completionRate,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRevenue
      },
      summary: {
        totalSchedules: allSchedules,
        completedSchedules,
        totalInvoices,
        paidInvoicesCount: paidInvoices.length > 0 ? await Invoice.countDocuments({ status: 'Paid' }) : 0
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      message: 'Error fetching dashboard statistics',
      error: error.message 
    });
  }
};

// Helper functions
function getTimeAgo(date) {
  if (!date) return 'Unknown';
  
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}

function formatDate(date) {
  const d = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString();
}

function mapScheduleStatus(status) {
  switch (status) {
    case 'Completed': return 'completed';
    case 'In Progress': return 'in-progress';
    case 'Scheduled':
    default: return 'pending';
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'completed': return 'check_circle';
    case 'in-progress': return 'play_arrow';
    case 'pending':
    default: return 'schedule';
  }
} 
//e;bsyugs
